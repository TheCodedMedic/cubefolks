"""Narrate an episode with Fish Audio: one request per paragraph of script.txt.

Usage: python3 pipeline/fish_tts.py episodes/<name> [VOICE_ENV_KEY]
Reads BEAN_FISH_API_KEY and the voice id from the environment or the repo's .env. Existing clips are
kept, so delete audio/para_NNN.mp3 to regenerate a single beat (numbered from para_001; an episode that already
uses para_000 keeps that). For a cast (several speakers) use fish_cast.py.
"""
import json
import pathlib
import sys
import urllib.request
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import clip, clip_base, paras as read_paras, bean_env

ENV = bean_env()

ep = pathlib.Path(sys.argv[1])
voice_key = sys.argv[2] if len(sys.argv) > 2 else "BEAN_NARRATOR_VOICE_ID"
paras = read_paras(ep)
for k in ("BEAN_FISH_API_KEY", voice_key):
    if k not in ENV:
        sys.exit(f"{k} is not set (cloud environment variable or .env); nothing was sent to Fish Audio")
(ep / "audio").mkdir(exist_ok=True)
BASE = clip_base(ep)

for i, text in enumerate(paras):
    out = clip(ep, i, BASE)
    if out.exists():
        continue
    body = {"text": text, "reference_id": ENV[voice_key], "format": "mp3", "latency": "normal"}
    req = urllib.request.Request(
        "https://api.fish.audio/v1/tts",
        data=json.dumps(body).encode(),
        headers={
            "Authorization": f"Bearer {ENV['BEAN_FISH_API_KEY']}",
            "Content-Type": "application/json",
            "model": "s2.1-pro-free",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        out.write_bytes(r.read())
    print(f"para {i:03d} ok", flush=True)
