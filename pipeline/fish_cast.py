"""Voice an episode with a cast: one Fish Audio request per beat, voice chosen by speakers.json + config/voices.json.

Usage: python3 pipeline/fish_cast.py episodes/<name> [workers]
Existing audio/para_NNN.mp3 clips are kept (delete one to re-voice that beat); clips are numbered from para_001 (an episode
that already uses para_000 keeps that). Reads BEAN_FISH_API_KEY (environment or .env); never prints it.
"""
import json, pathlib, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import ROOT, clip, clip_base, paras as read_paras, speakers, bean_env

ENV = bean_env()
CFG = json.loads((ROOT / "config" / "voices.json").read_text())
VOICES = CFG["voices"]
VID = lambda s: VOICES[s].get("voice_id") or ENV.get(VOICES[s]["env"], "")
REF_CACHE = {}
def reference_wav(path):
    """A voice cloned on the fly: the sample as 40 s of 44.1 kHz mono WAV bytes (Fish rejects MP3 references)."""
    if path not in REF_CACHE:
        import subprocess
        REF_CACHE[path] = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ROOT / path), "-ac", "1", "-ar", "44100", "-t", "40", "-f", "wav", "-"], capture_output=True, check=True).stdout
    return REF_CACHE[path]
ep = pathlib.Path(sys.argv[1]); workers = int(sys.argv[2]) if len(sys.argv) > 2 else 4
paras = read_paras(ep)
spk = speakers(ep)
# optional delivery tags for Fish only ({beat: "[shouting] text"}, 1-based): script.txt stays clean for the alignment
TTS = json.loads((ep / "tts_text.json").read_text()) if (ep / "tts_text.json").exists() else {}
say = lambda i: TTS.get(str(i + 1), paras[i])
# optional per-beat speaking speed ({beat: 1.1}, 1-based) for lines that came out slow; merged into the voice's prosody
SPEED = json.loads((ep / "tts_speed.json").read_text()) if (ep / "tts_speed.json").exists() else {}
def delivery(i, v):
    d = {k: v[k] for k in ("prosody", "temperature", "top_p") if k in v}
    if str(i + 1) in SPEED:
        d["prosody"] = {**d.get("prosody", {}), "speed": SPEED[str(i + 1)]}
    return d
assert len(paras) == len(spk), (len(paras), len(spk))
unknown = sorted({s for s in spk if s not in VOICES})
novoice = sorted({s for s in spk if s in VOICES and not VOICES[s].get("reference_audio") and not VID(s)})
if novoice:
    sys.exit(f"no voice id or reference audio for: {novoice}")
if unknown:
    sys.exit(f"speakers.json uses tags that are not in config/voices.json: {unknown}")
# Each voice may name its own Fish account key ("api_key_env", e.g. BEAN_FISH2_API_KEY for voices made on the second
# account); the rest use the default CFG["api_key_env"]. Generation spends the credits of the key that sends it.
KEY = lambda s: VOICES[s].get("api_key_env") or CFG["api_key_env"]
missing = sorted({KEY(s) for s in spk if not ENV.get(KEY(s))})
if missing:
    sys.exit(f"{missing} not set (config/keys.env, cloud environment variable or .env); nothing was sent to Fish Audio")
(ep / "audio").mkdir(exist_ok=True)
BASE = clip_base(ep)
todo = [i for i in range(len(paras)) if not (clip(ep, i, BASE).exists() and clip(ep, i, BASE).stat().st_size > 2000)]
print(f"{len(paras)} beats, {len(paras) - len(todo)} cached, {len(todo)} to voice (clips numbered from para_{BASE:03d})", flush=True)

def job(i):
    out = clip(ep, i, BASE)
    if out.exists() and out.stat().st_size > 2000:
        return f"{i:03d} cached"
    v = VOICES[spk[i]]
    if v.get("reference_audio"):
        import msgpack
        body = {"text": say(i), "format": "mp3", "latency": "normal", "references": [{"audio": reference_wav(v["reference_audio"]), "text": v.get("reference_text", "")}]}
        body.update(delivery(i, v))
        data, ctype = msgpack.packb(body), "application/msgpack"
    else:
        body = {"text": say(i), "reference_id": VID(spk[i]), "format": "mp3", "latency": "normal"}
        body.update(delivery(i, v))
        data, ctype = json.dumps(body).encode(), "application/json"
    for attempt in range(4):
        try:
            req = urllib.request.Request("https://api.fish.audio/v1/tts", data=data,
                headers={"Authorization": f"Bearer {ENV[KEY(spk[i])]}", "Content-Type": ctype, "model": CFG.get("model_header", "s2.1-pro-free")})
            with urllib.request.urlopen(req, timeout=180) as r:
                audio = r.read()
            if len(audio) < 2000:
                raise RuntimeError(f"short reply {len(audio)} bytes")
            out.write_bytes(audio)
            return f"{i:03d} {spk[i]} ok"
        except Exception as e:
            err = str(e)[:120]; time.sleep(3 * (attempt + 1))
    return f"{i:03d} FAILED {err}"

with ThreadPoolExecutor(workers) as ex:
    for msg in ex.map(job, range(len(paras))):
        print(msg, flush=True)
