"""Check every at(beat, "word", nth) / atE(...) anchor in shot files against a timing.json.
Usage: python3 pipeline/check_anchors.py video/src/<ep>/timing.json video/src/<ep>/*.tsx"""
import json,re,sys,pathlib
T=json.load(open(sys.argv[1]))
norm=lambda s: re.sub(r"[^a-z0-9']","",s.lower())
bad=0
for f in sys.argv[2:]:
    for m in re.finditer(r'\bat[E]?\((\d+),\s*([\'"])(.*?)\2(?:,\s*(\d+))?', pathlib.Path(f).read_text()):
        b,w,n=int(m.group(1)),m.group(3),int(m.group(4) or 1)
        hits=[x for x in T["words"] if x["b"]==b and norm(x["w"])==norm(w)]
        if len(hits)<n: bad+=1; print(f"{f}: at({b},{w!r},{n}) -> {len(hits)} hits")
print("bad",bad)
