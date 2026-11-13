"""Measure peak and loudest-0.3s RMS (dBFS) of library WAVs; write levels.json and library_index.md.
Run: python3 -I measure.py"""
import json, os, subprocess, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = f"{ROOT}/library"
credits = {c["file"]: c for c in json.load(open(f"{ROOT}/library_credits.json"))}
SHORT = {"CC0 1.0": "CC0", "Mixkit Sound Effects Free License": "Mixkit Free", "CC BY 3.0": "CC BY 3.0", "CC BY 4.0": "CC BY 4.0"}

def db(x): return round(float(20 * np.log10(max(x, 1e-10))), 2)

levels, rows = {}, []
for fn in sorted(os.listdir(LIB)):
    if not fn.endswith(".ogg"): continue
    ch, sr = 2, 48000
    raw = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", f"{LIB}/{fn}", "-ac", str(ch), "-ar", str(sr), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    x = x.reshape(-1, ch); n = len(x)
    mono_sq = (x ** 2).mean(axis=1)
    win = int(0.3 * sr)
    if len(mono_sq) >= win:
        c = np.concatenate([[0.0], np.cumsum(mono_sq)])
        rms = np.sqrt((c[win:] - c[:-win]).max() / win)
    else:
        rms = np.sqrt(mono_sq.mean())
    dur = n / sr
    levels[fn] = {"duration_s": round(dur, 3), "channels": ch, "sample_rate": sr,
                  "peak_dbfs": db(np.abs(x).max()), "max_rms_0p3s_dbfs": db(rms),
                  "overall_rms_dbfs": db(np.sqrt(mono_sq.mean()))}
    c = credits.get(f"library/{fn}", {})
    rows.append((fn[:-4], dur, c.get("description", ""), SHORT.get(c.get("license", ""), c.get("license", "?")),
                 c.get("category", ""), levels[fn]))
json.dump(levels, open(f"{ROOT}/levels.json", "w"), indent=1)

order = ["ambience", "pad", "sfx", "ui", "reaction", "animal", "cartoon", "music_sting"]
names = {"ambience": "Ambience beds", "pad": "Pads / musical beds", "sfx": "Realistic SFX", "ui": "UI / motion-graphics SFX", "reaction": "People: laughs, cheers, applause, gasps, crowds", "animal": "Animals (horses, dogs, farm)", "cartoon": "Cartoon SFX", "music_sting": "Stings: game show, drums, bells"}
L = ["# SFX library index", "",
     "All files: 48 kHz OGG Vorbis (q8) in `sfx/library/`. Sources, authors and licences per file are in `library_credits.json`; "
     "peak and loudest-0.3 s RMS levels are in `levels.json`.", "",
     "Licences: **CC0** = public domain, no attribution. **Mixkit Free** = Mixkit Sound Effects Free License "
     "(commercial video use OK, no attribution; don't redistribute the raw files). **CC BY** = attribution required, "
     "exact text in `credits.json` → `attribution_text` (put it in the video description).", ""]
for cat in order:
    L += [f"## {names[cat]}", "", "| name | duration | sounds like | ch | peak dBFS | max RMS 0.3s | licence |", "|---|---|---|---|---|---|---|"]
    for name, dur, desc, lic, c, lv in rows:
        if c == cat:
            L.append(f"| {name} | {dur:.2f} s | {desc} | {lv['channels']} | {lv['peak_dbfs']} | {lv['max_rms_0p3s_dbfs']} | {lic} |")
    L.append("")
attr = [c for c in credits.values() if c["attribution_required"]]
if attr:
    L += ["## Required attributions (paste into video description)", ""] + [f"- {c['attribution_text']}" for c in attr] + [""]
open(f"{ROOT}/library_index.md", "w").write("\n".join(L))
print(len(rows), "files")
