"""Assemble a cast episode: trim each beat, level-match (per speaker gain from config/voices.json), place with designed gaps.

Usage: python3 pipeline/assemble_cast.py episodes/<name>
Voice settings come from episodes/<name>/episode.json ("voice": lead, gaps [one per beat] or gap_default, tail,
level_match_db); without them: gaps.json ({"0-based beat": seconds}) or 0.45 s, lead 0.3, tail 3.0.
Writes master_voiceover.wav (48 kHz mono, lead + beats + tail), narrator_16k.wav (the same voice WITHOUT the lead,
16 kHz, for Whisper: build_timing.py adds the lead back) and timeline_chunks.json (index, speaker, start, end, gap_after, text
in master seconds; index counts like the clips: from 1 for the 3D episodes, so it equals the beat number in timing.json).
"""
import json, pathlib, subprocess, sys
import numpy as np
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import ROOT, clip, clip_base, paras, speakers, voice_settings

EP = pathlib.Path(sys.argv[1])
SR = 48000
VOICES = json.loads((ROOT / "config" / "voices.json").read_text())["voices"]
P, spk = paras(EP), speakers(EP)
assert len(P) == len(spk), (len(P), len(spk))
V = voice_settings(EP, len(P))
base = clip_base(EP)
missing = [str(clip(EP, i, base)) for i in range(len(P)) if not clip(EP, i, base).exists()]
if missing:
    sys.exit(f"{len(missing)} clips missing (run fish_cast.py first), e.g. {missing[:3]}")


def load(path):
    trim = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-af", trim, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def speech_rms(x):
    win = int(0.3 * SR)
    r = np.array([np.sqrt(np.mean(x[i:i + win] ** 2)) for i in range(0, max(1, len(x) - win), win)])
    return float(np.median(r[r > 0.02])) if (r > 0.02).any() else float(r.max() + 1e-6)


clips = [load(clip(EP, i, base)) for i in range(len(P))]
levels = [speech_rms(c) for c in clips]
narr = [l for l, s in zip(levels, spk) if s == V["narrator"]] or levels
target = float(np.median(narr))
lim = 10 ** (V["level_match_db"] / 20)
fade = int(0.01 * SR)
body, chunks, t = [], [], V["lead"]
for i, (c, lv) in enumerate(zip(clips, levels)):
    g = np.clip(target / lv, 1 / lim, lim) * 10 ** (VOICES[spk[i]].get("gain_db", 0) / 20)
    c = c * g; c[:fade] *= np.linspace(0, 1, fade); c[-fade:] *= np.linspace(1, 0, fade)
    gap = V["gaps"][i]
    chunks.append({"index": i + base, "speaker": spk[i], "start": round(t, 3), "end": round(t + len(c) / SR, 3), "gap_after": gap, "text": P[i]})
    body += [c, np.zeros(int((max(gap, V["tail"]) if i == len(P) - 1 else gap) * SR), np.float32)]
    t += len(c) / SR + gap
voice = np.concatenate(body); voice *= 0.93 / np.abs(voice).max()
master = np.concatenate([np.zeros(int(V["lead"] * SR), np.float32), voice])
for name, x, rate in (("master_voiceover.wav", master, SR), ("narrator_16k.wav", voice, 16000)):
    pcm = (x * 32767).astype(np.int16).tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ar", str(rate), str(EP / name)], input=pcm, check=True)
(EP / "timeline_chunks.json").write_text(json.dumps(chunks, indent=1))
print(f"{len(P)} beats (clips from para_{base:03d}), lead {V['lead']} s, last line ends {chunks[-1]['end']} s, master {len(master) / SR:.1f} s")
