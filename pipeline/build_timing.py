"""The Shorts timing build: episodes/<ep>/words.json + timeline_chunks.json -> video/src/<short>/timing.json.

Usage: python3 pipeline/build_timing.py episodes/<ep> video/src/<short>/timing.json

timing.json = {"words": [{b, w, s, e}], "beats": [{b, s, e, gap}], "end": seconds}: beats 1-based, master seconds
(the voice lead added back), every word clamped inside its beat's clip. The kit's makeTiming() (video/src/kit/core.ts)
reads it for at(beat, "word"). Never type a second: every cut, caption, face and sound anchors to these times.
"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import clip_base, paras, voice_settings

ep, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
P = paras(ep)
V = voice_settings(ep, len(P))
words = json.loads((ep / "words.json").read_text())
chunks = json.loads((ep / "timeline_chunks.json").read_text())
base = clip_base(ep)
beat_of = [b for b, p in enumerate(P) for _ in p.split()]  # align_cast writes one entry per script token, in order
assert len(beat_of) == len(words), (len(beat_of), len(words))
cb = {c["index"] - base: c for c in chunks}
W = []
for w, b in zip(words, beat_of):
    c = cb[b]
    s = min(max(w["start"] + V["lead"], c["start"]), c["end"])
    e = min(max(w["end"] + V["lead"], s + 0.05), c["end"])
    W.append({"b": b + 1, "w": w["word"], "s": round(s, 3), "e": round(e, 3)})
beats = [{"b": i + 1, "s": cb[i]["start"], "e": cb[i]["end"], "gap": cb[i]["gap_after"]} for i in range(len(P))]
end = round(beats[-1]["e"] + V["tail"], 3)
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({"words": W, "beats": beats, "end": end}, indent=0))
wpm = len(W) / ((beats[-1]["e"] - beats[0]["s"]) / 60)
print(f"wrote {out}: {len(beats)} beats, {len(W)} words, voice {beats[0]['s']:.2f}-{beats[-1]['e']:.2f} s, end {end:.2f} s, {wpm:.0f} words/min")
