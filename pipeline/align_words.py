"""Map Whisper word times onto the script's own words -> words.json.

Usage: python3 pipeline/align_words.py episodes/<name>
The script spelling wins; each beat's first/last word is clamped to the edges
known from timeline_chunks.json (Whisper drifts around long silences).
"""
import difflib
import json
import pathlib
import re
import sys

ep = pathlib.Path(sys.argv[1])
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())
NUM = {"40": "forty", "10": "ten", "cot": "caught", "they're": "their"}

chunks = json.loads((ep / "timeline_chunks.json").read_text())
script = [(c["index"], w) for c in chunks for w in c["text"].split()]
heard = [w for s in json.loads((ep / "whisper_words.json").read_text()) for w in s["words"]]
a = [norm(w) for _, w in script]
b = [NUM.get(norm(w["w"]), norm(w["w"])) for w in heard]

times = [None] * len(script)
for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
    if tag in ("equal", "replace") and i2 - i1 == j2 - j1:
        for k in range(i2 - i1):
            times[i1 + k] = (heard[j1 + k]["s"], heard[j1 + k]["e"])

# fill gaps by interpolation inside the beat
for i, t in enumerate(times):
    if t is None:
        prev = next((times[k][1] for k in range(i - 1, -1, -1) if times[k]), 0.0)
        nxt = next((times[k][0] for k in range(i + 1, len(times)) if times[k]), prev + 0.3)
        times[i] = (prev, nxt)

words = [{"para": p, "word": w, "start": round(s, 3), "end": round(e, 3)}
         for (p, w), (s, e) in zip(script, times)]
for c in chunks:
    ws = [w for w in words if w["para"] == c["index"]]
    ws[0]["start"] = max(ws[0]["start"], c["start"])
    ws[-1]["end"] = min(max(ws[-1]["end"], ws[-1]["start"] + 0.1), c["end"])
(ep / "words.json").write_text(json.dumps(words, indent=0))
print(len(words), "words,", sum(1 for t in times if t), "timed")
