"""Freesound text search (token read from .env, never printed). Usage: fs_search.py OUT.json "query" [mindur] [maxdur] [license]"""
import sys, json, urllib.parse, subprocess, re
key = None
for line in open("/home/user/yta-cloud/.env"):
    m = re.match(r'\s*(?:export\s+)?FREESOUND_API_KEY\s*=\s*["\']?([^"\'\s]+)', line)
    if m: key = m.group(1)
assert key, "no key"
out, q = sys.argv[1], sys.argv[2]
mind = sys.argv[3] if len(sys.argv) > 3 else "0"
maxd = sys.argv[4] if len(sys.argv) > 4 else "*"
lic = sys.argv[5] if len(sys.argv) > 5 else "cc0"
lf = 'license:"Creative Commons 0"' if lic == "cc0" else '(license:"Creative Commons 0" OR license:"Attribution")'
params = {"query": q, "filter": f"{lf} duration:[{mind} TO {maxd}]", "sort": (sys.argv[6] if len(sys.argv) > 6 else "downloads_desc"),
          "fields": "id,name,license,username,duration,previews,url,avg_rating,num_ratings,num_downloads,description",
          "page_size": "15", "token": key}
url = "https://freesound.org/apiv2/search/text/?" + urllib.parse.urlencode(params)
r = subprocess.run(["curl", "-sS", "--config", "-"], input=f'url = "{url}"\n', capture_output=True, text=True)
try:
    d = json.loads(r.stdout)
except Exception:
    print("ERR", r.stdout[:300].replace(key, "<KEY>")); sys.exit(1)
try: old = json.load(open(out))
except Exception: old = {}
for s in d.get("results", []):
    s["description"] = (s.get("description") or "")[:200]
    old[str(s["id"])] = s
    print(s["id"], f'{s["duration"]:.1f}s', f'r{s.get("avg_rating",0):.1f}', s["num_downloads"], s["license"].split("/")[-3:-1], s["username"], "|", s["name"][:60])
json.dump(old, open(out, "w"), indent=1)
