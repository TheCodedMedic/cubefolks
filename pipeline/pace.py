"""Check a Short's length and pace after assemble + align: total length, words per second, and the slowest beats.

Usage: python3 -I pipeline/pace.py episodes/<ep>
Targets: any length the story needs (about 20-60 s; the owner, 2026-11-11), about 3.5-4.1 words a second. Fix a padded or slow Short by cutting beats that don't move the
story, then re-voicing the slowest lines faster with tts_speed.json ({"7": 1.1}): delete their clips, run fish_cast.py,
assemble_cast.py, whisper_words.py and align_cast.py again. Tighten gaps only as a last step (they are already short).
"""
import json, pathlib, sys
E = pathlib.Path(sys.argv[1])
P = [p.strip() for p in (E / "script.txt").read_text().split("\n\n") if p.strip()]
C = json.loads((E / "timeline_chunks.json").read_text()); W = json.loads((E / "words.json").read_text())
span = W[-1]["end"] - W[0]["start"]; total = C[-1]["end"]
print(f"{len(P)} beats, {len(W)} words, voice ends {total:.1f} s, {len(W) / span:.2f} words/s (length: whatever the story needs, ~20-60 s; pace 3.5-4.1 w/s)")
rows = sorted(((len(p.split()) / (c["end"] - c["start"]), i + 1, c["end"] - c["start"], p) for i, (p, c) in enumerate(zip(P, C))))
print("slowest beats (words/s, beat, seconds):")
for wps, b, d, p in rows[:8]:
    print(f"  {wps:4.2f}  beat {b:2d}  {d:4.2f} s  {p[:60]}")
gaps = [(W[i + 1]["start"] - W[i]["end"], W[i]["word"]) for i in range(len(W) - 1)]
big = [g for g in gaps if g[0] > 0.25]
print(f"pauses over 0.25 s: {len(big)}, {sum(g for g, _ in big):.1f} s in all")
