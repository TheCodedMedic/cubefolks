"""Download, licence-check and convert the SFX library. Run with: python3 -I build_library.py SCRATCH_DIR
Reads only metadata JSON from scratch (mixkit/freesound search results); never executes downloaded content."""
import sys, os, json, re, subprocess, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from manifest import M

SCR = sys.argv[1]
ROOT = "/home/user/yta-cloud/sfx"
DL = f"{ROOT}/_downloads"
LIB = f"{ROOT}/library"
os.makedirs(LIB, exist_ok=True)
fs = json.load(open(f"{SCR}/fs.json"))
KEY = next(l.split("=", 1)[1].strip() for l in open("/home/user/yta-cloud/.env") if l.startswith("FREESOUND_API_KEY="))
mk = {}
for f in ("mk1.json", "mk2.json", "mk3.json"):
    mk.update(json.load(open(f"{SCR}/{f}")))

def curl(url, out=None):
    args = ["curl", "-sSL", "--fail", "--retry", "2", "--max-time", "90", url]
    if out: args[1:1] = ["-o", out]
    r = subprocess.run(args, capture_output=True, text=out is None)
    if r.returncode: raise RuntimeError(f"curl failed {url}")
    return r.stdout

CC0 = "https://creativecommons.org/publicdomain/zero/1.0/"
MIXKIT_LIC = "https://mixkit.co/license/#sfxFree"
fs_page_lic = {}
credits, failures = [], []
for out, cat, src, ref, desc, ss, dur in M:
    try:
        if src == "fs":
            s = fs[str(ref)]
            page = s["url"]
            api = f"https://freesound.org/apiv2/sounds/{ref}/?fields=id,license,url,username,name&token={KEY}"
            r = subprocess.run(["curl", "-sS", "--max-time", "60", "--config", "-"], input=f'url = "{api}"\n', capture_output=True, text=True)
            info = json.loads(r.stdout)
            m = re.search(r'creativecommons\.org/(publicdomain/zero/1\.0|licenses/[a-z-]+/[0-9.]+)/', info["license"])
            if not m: raise RuntimeError(f"unacceptable licence {info['license']}")
            lic = m.group(1); page = info["url"]; s["username"] = info["username"]; s["name"] = info["name"]
            if lic == "publicdomain/zero/1.0":
                lname, lurl, attr = "CC0 1.0", CC0, False
            elif re.fullmatch(r"licenses/by/[34]\.0", lic):
                v = lic.split("/")[-1]
                lname, lurl, attr = f"CC BY {v}", f"https://creativecommons.org/{lic}/", True
            else:
                raise RuntimeError(f"unacceptable licence {lic}")
            url = s["previews"]["preview-hq-ogg"]
            local = f"{DL}/freesound/{ref}.ogg"
            author = s["username"]
            attr_text = f'"{s["name"]}" by {author} ({page}), {lname} ({lurl})' if attr else ""
            note = "Freesound HQ preview (OGG ~192 kbps); original file needs OAuth2"
        elif src == "mk":
            it = mk[str(ref)]
            page = f"https://mixkit.co/free-sound-effects/{it['cats'][0]}/"
            url = f"https://assets.mixkit.co/active_storage/sfx/{ref}/{ref}.wav"
            local = f"{DL}/mixkit/{ref}.wav"
            author, lname, lurl, attr, attr_text = "Mixkit (Envato)", "Mixkit Sound Effects Free License", MIXKIT_LIC, False, ""
            note = f'Mixkit title: "{it["title"]}" (id {ref}); no redistribution as standalone files'
        else:
            pack = ref.split("/")[0]
            page = f"https://kenney.nl/assets/{pack}"
            url = None
            local = f"{DL}/kenney/{pack}/{ref.split('/', 1)[1]}"
            author, lname, lurl, attr, attr_text = "Kenney (kenney.nl)", "CC0 1.0", CC0, False, ""
            note = f"from {pack} pack zip, file {ref.split('/', 1)[1]}"
        if url and not os.path.exists(local):
            os.makedirs(os.path.dirname(local), exist_ok=True)
            curl(url, local); time.sleep(0.3)
        cap = {"ambience": 45, "pad": 40}.get(cat)
        if cap:
            src_len = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", local], capture_output=True, text=True).stdout.strip())
            avail = src_len - ss
            dur = min(dur or avail, cap) if avail > cap + 2 else None
        dst = f"{LIB}/{out}.wav"
        filt = []
        if cat in ("sfx", "ui"):
            filt.append("silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.005")
        cmd = ["ffmpeg", "-nostdin", "-v", "error", "-y"]
        if ss: cmd += ["-ss", str(ss)]
        cmd += ["-i", local]
        if dur:
            cmd += ["-t", str(dur)]
            filt.append(f"afade=t=out:st={dur-1.0}:d=1.0")
        if filt: cmd += ["-af", ",".join(filt)]
        cmd += ["-map_metadata", "-1", "-ar", "48000", "-c:a", "pcm_s16le", dst]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode: raise RuntimeError("ffmpeg: " + r.stderr[-300:])
        credits.append({"file": f"library/{out}.wav", "category": cat, "description": desc,
                        "source_page": page, "download_url": url or ([l for l in open(f'{DL}/kenney/zip_urls.txt') if f'/{pack}/' in l][0].strip()),
                        "author": author, "license": lname, "license_url": lurl,
                        "attribution_required": attr, "attribution_text": attr_text, "notes": note})
        print("ok", out, lname)
    except Exception as e:
        failures.append((out, str(e))); print("FAIL", out, e)
json.dump(credits, open(f"{ROOT}/credits.json", "w"), indent=1, ensure_ascii=False)
print("failures:", failures)
