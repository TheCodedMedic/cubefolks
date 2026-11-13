"""Map Whisper word times onto the script's own words -> episodes/<name>/words.json for build_timing.py.

Usage: python3 pipeline/align_cast.py episodes/<name>
Reads whisper_words.json (from pipeline/whisper_words.py, run on narrator_16k.wav = the voice without the lead) or, if
that is absent, narrator_16k.json (the openai-whisper CLI's json). Writes words.json as [{i, word, start, end}] in
lead-free seconds, one entry per script token, the script's spelling kept; then the episode's build_timing.py adds the
lead and clamps every beat's words into its clip. Prints what Whisper heard differently per beat (a garbled beat is
re-voiced: delete its clip, run fish_cast.py and assemble_cast.py again).
"""
import difflib, json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import clip_base, paras, voice_settings

EP = pathlib.Path(sys.argv[1])
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())
NUM = {"40": "forty", "10": "ten", "cot": "caught", "they're": "their"}
P = paras(EP)
V = voice_settings(EP, len(P))
script = [(b, w) for b, p in enumerate(P) for w in p.split()]

if (EP / "whisper_words.json").exists():
    heard = [{"w": w["w"], "s": w["s"], "e": w["e"]} for s in json.loads((EP / "whisper_words.json").read_text()) for w in s["words"]]
else:
    raw = json.loads((EP / "narrator_16k.json").read_text())
    heard = [{"w": w["word"].strip(), "s": w["start"], "e": w["end"]} for s in raw["segments"] for w in s.get("words", [])]
a = [norm(w) for _, w in script]
b = [NUM.get(norm(w["w"]), norm(w["w"])) for w in heard]

times = [None] * len(script)
bad = {}
for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
    if tag in ("equal", "replace") and i2 - i1 == j2 - j1:
        for k in range(i2 - i1):
            times[i1 + k] = (heard[j1 + k]["s"], heard[j1 + k]["e"])
    if tag != "equal":
        for k in range(i1, max(i2, i1 + 1)):
            if k < len(script):
                bad.setdefault(script[k][0] + 1, set()).add(f"{' '.join(a[i1:i2])} -> {' '.join(b[j1:j2])}")
for i, t in enumerate(times):  # fill gaps by interpolation between the neighbours
    if t is None:
        prev = next((times[k][1] for k in range(i - 1, -1, -1) if times[k]), 0.0)
        nxt = next((times[k][0] for k in range(i + 1, len(times)) if times[k]), prev + 0.3)
        times[i] = (prev, nxt)

# keep every beat's words inside its own clip (lead-free times); timeline_chunks.json is in master seconds
chunks = json.loads((EP / "timeline_chunks.json").read_text())
base = clip_base(EP)  # chunk index counts like the clips (from 1 for the 3D episodes)
words = [{"i": i, "word": w, "start": round(s, 3), "end": round(e, 3)} for i, ((_, w), (s, e)) in enumerate(zip(script, times))]
for c in chunks:
    ws = [x for x, (bt, _) in zip(words, script) if bt + base == c["index"]]
    c0, c1 = c["start"] - V["lead"], c["end"] - V["lead"]
    ws[0]["start"] = round(max(ws[0]["start"], c0), 3)
    ws[-1]["end"] = round(min(max(ws[-1]["end"], ws[-1]["start"] + 0.1), c1), 3)
(EP / "words.json").write_text(json.dumps(words, indent=0))
for bt, v in sorted(bad.items()):
    print(f"beat {bt}: {sorted(v)[:3]}")
print(len(words), "words,", sum(1 for t in times if t) , "timed,", len(bad), "beats with differences")
