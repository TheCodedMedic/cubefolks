"""words.json + timeline_chunks.json -> video/src/<dir>/timing.json ({words:[{b,w,s,e}], beats:[{b,s,e,gap}]}), beats 1-based, master seconds.
Also prints script/heard mismatches per beat so garbled beats can be re-voiced."""
import difflib, json, pathlib, re, sys
ep, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())
words = json.loads((ep / "words.json").read_text()); chunks = json.loads((ep / "timeline_chunks.json").read_text())
heard = [norm(w["w"]) for s in json.loads((ep / "whisper_words.json").read_text()) for w in s["words"]]
a = [norm(w["word"]) for w in words]
bad = {}
for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, heard, autojunk=False).get_opcodes():
    if tag != "equal":
        for k in range(i1, max(i2, i1 + 1)):
            if k < len(words): bad.setdefault(words[k]["para"], []).append(f"{' '.join(a[i1:i2])} -> {' '.join(heard[j1:j2])}")
for b, v in sorted(bad.items()): print(f"beat {b}: {sorted(set(v))[:3]}")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({"words": [{"b": w["para"] + 1, "w": w["word"], "s": w["start"], "e": w["end"]} for w in words],
                           "beats": [{"b": c["index"] + 1, "s": c["start"], "e": c["end"], "gap": c["gap_after"]} for c in chunks]}))
print("wrote", out, "end", chunks[-1]["end"])
