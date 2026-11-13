"""List Mixkit SFX items from category pages: id, title, duration, tags. Usage: mixkit_list.py cat1 cat2 ..."""
import re, sys, html, json, subprocess, os
OUT = sys.argv[1]
res = {}
for cat in sys.argv[2:]:
    for page in (1, 2):
        url = f"https://mixkit.co/free-sound-effects/{cat}/" + (f"?page={page}" if page > 1 else "")
        t = subprocess.run(["curl", "-sSL", url], capture_output=True, text=True).stdout
        blocks = t.split('data-test-id="audio-player"')[1:]
        if not blocks: break
        for b in blocks:
            m = re.search(r'data-audio-player-item-id-value="(\d+)"', b)
            ti = re.search(r'item-grid-card__title">\s*(.*?)\s*</h2>', b, re.S)
            du = re.search(r'data-test-id="duration">\s*([\d:]+)', b)
            tags = re.findall(r'meta-links__link" data-global--meta-links-target="link" href="/free-sound-effects/([^/]+)/', b)
            if m:
                i = m.group(1)
                res.setdefault(i, {"id": i, "title": html.unescape(ti.group(1)) if ti else "", "dur": du.group(1) if du else "", "tags": tags, "cats": []})
                if cat not in res[i]["cats"]: res[i]["cats"].append(cat)
json.dump(res, open(OUT, "w"), indent=1)
for v in res.values(): print(v["id"], v["dur"], v["title"], "|", ",".join(v["cats"]))
