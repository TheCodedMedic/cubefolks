"""Helpers for cue sheets: word times from video/src/<ep>/timing.json, and music beds cut from music/library.

In a cue sheet:
    from cuekit import Cues
    c = Cues("ep05", HERE)       # timing + output dir for cut music
    c.at(3, "red"), c.PS(5), c.P(6), c.END
    c.music(track, offset, t0, t1, rel_db)  -> a BEDS row
"""
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())


class Cues:
    def __init__(self, ep, here):
        self.T = json.load(open(ROOT / "video" / "src" / ep / "timing.json"))
        self.here = pathlib.Path(here)
        self.END = self.PE(len(self.T["beats"])) + 2.4

    def at(self, b, w, n=1, off=0.0):
        hits = [x["s"] for x in self.T["words"] if x["b"] == b and norm(x["w"]) == norm(w)]
        if len(hits) < n:
            raise KeyError(f"{w}#{n} not in beat {b}")
        return hits[n - 1] + off

    def atE(self, b, w, n=1, off=0.0):
        hits = [x["e"] for x in self.T["words"] if x["b"] == b and norm(x["w"]) == norm(w)]
        return hits[n - 1] + off

    def PS(self, b):
        return self.T["beats"][b - 1]["s"]

    def PE(self, b):
        return self.T["beats"][b - 1]["e"]

    def P(self, b):
        return self.PS(b) - 0.12

    def music(self, track, off, t0, t1, db, fi=1.2, fo=1.5):
        src = next((ROOT / "music" / "library").glob(f"{track}*.mp3"))
        out = self.here / "music_beds" / f"{track}_{off}_{t1 - t0:.1f}.wav"
        if not out.exists():
            out.parent.mkdir(exist_ok=True)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(off), "-t", f"{t1 - t0 + 0.5:.2f}", "-i", str(src),
                            "-ar", "48000", "-ac", "2", str(out)], check=True)
        return (str(out), t0, t1, db, fi if t0 > 0 else 0.3, fo)


def synth(name):
    return str(ROOT / "sfx" / "synth" / f"{name}.wav")
