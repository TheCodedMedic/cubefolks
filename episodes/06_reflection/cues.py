"""Short 6 "The Reflection That Blinks First": the sound cue sheet. Quiet, creepy suburban: soft beds, small real sounds,
nothing loud. Every time comes from measured data: words in video/src/short06_blocky/timing.json via `at(beat, "word")`,
and the picture's cut lists video/src/short06_blocky/cuts_a.json / cuts_b.json ([{id, t0, enter}], written by SHOTS-A / SHOTS-B;
read whichever exist; optional extra keys per entry: "blinks": [t...] reflection blinks, "pops": [t...] pop-in graphics).
Never a typed second: only words, beat bounds and cut times (small offsets are lead-ins, e.g. a whoosh peaks on its cut).
Effects:  python3 -I episodes/06_reflection/sfx06.py      (sfx_gen/*.wav, committed)
Mix:      python3 -I pipeline/mix.py episodes/06_reflection/cues.py episodes/06_reflection/mix.wav
Level:    python3 -I pipeline/music_level.py episodes/06_reflection/cues.py -15
"""
import json
import pathlib
import subprocess
import sys

import numpy as np

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
from cuekit import Cues  # noqa: E402

SRC = ROOT / "video" / "src" / "short06_blocky"
c = Cues("short06_blocky", HERE)
at, atE, PS, PE = c.at, c.atE, c.PS, c.PE
G = lambda n: str(HERE / "sfx_gen" / f"{n}.wav")   # our synthesised effects (sfx06.py)
S = lambda n: str(ROOT / "sfx" / f"{n}.mp3")       # the credited one-offs in sfx/

VOICE = str(HERE / "master_voiceover.wav")
END = c.T["end"]                                   # the picture's length (master 42.4 s)
LENGTH = END
MUSIC_DUCK_DB = 6
SFX_MAX = 4.0

# the cut lists from the picture (either half may be missing until SHOTS-A / SHOTS-B push)
CUTS = []
for f in ("cuts_a.json", "cuts_b.json", "cuts.json"):
    if (SRC / f).exists() and not (f == "cuts.json" and CUTS):
        CUTS += json.load(open(SRC / f))
CUTS.sort(key=lambda x: x["t0"])

# ---------------------------------------------------------------- places and their beds
# Each shot in the cut lists is mapped to a place by its id; where no cut list covers a time yet, the place comes from
# the contract's beat (B(b) = just before the beat's first word). Consecutive shots in one place merge into one span.
B = lambda b: PS(b) - 0.06
BEAT_PLACE = {1: "bath_morning", 2: "empty_rooms", 3: "bath_morning", 4: "recess", 5: "dusk_street", 6: "street",
              7: "kitchen", 8: "hallway", 9: "dining", 10: "bath_night", 11: "bath_night", 12: "bath_night",
              13: "bath_night", 14: "bath_night"}
ID_PLACE = {  # SHOTS-A ids (video/src/short06_blocky/ShotsA.tsx comments)
    "a01": "bath_morning", "a02": "bath_morning", "a03": "bath_morning", "a04": "bath_morning",
    "a05": "street", "a06": "empty_rooms", "a07": "empty_rooms", "a08": "empty_rooms",
    "a09": "street", "a10": "bath_morning", "a11": "bath_morning", "a12": "bath_morning",
    "a13": "street", "a14": "street", "a15": "recess", "a16": "recess", "a17": "recess",
    "a18": "dusk_street", "a19": "dusk_street", "a20": "dusk_street", "a21": "street", "a22": "street", "a23": "street",
    "a24": "kitchen", "a25": "kitchen", "a26": "kitchen",
    # SHOTS-B ids (ShotsB.tsx): b8 hallway towels, b9 dinner, b10-13 the bathroom at night, b14 the bathroom next morning
    "b8_": "hallway", "b9_": "dining", "b10": "bath_night", "b11": "bath_night", "b12": "bath_night", "b13": "bath_night",
    "b14": "bath_morning",
}
def beat_of(t):
    return max([b for b in range(1, 15) if B(b) <= t + 1e-6] or [1])
# segments: the cut list where it exists, else beat bounds
_cov = [(x["t0"], x["id"]) for x in CUTS]
_cuts_end = {"a": PS(8) - 0.12 if any(i.startswith("a") for _, i in _cov) else 0.0}
segs = []
for i, (t0, sid) in enumerate(_cov):
    t1 = _cov[i + 1][0] if i + 1 < len(_cov) else (END if sid.startswith("b") else max(_cuts_end["a"], t0))
    segs.append((t0, t1, ID_PLACE.get(sid[:3], BEAT_PLACE[beat_of(t0 + 0.05)])))
covered_to = max([s[1] for s in segs] or [0.0])
_marks = sorted({covered_to, END} | {B(b) for b in range(1, 15) if B(b) > covered_to})
for a, b in zip(_marks, _marks[1:]):
    if b - a > 1e-3: segs.append((a, b, BEAT_PLACE[beat_of(a + 0.05)]))
segs.sort()
SPANS = {}
for a, b, k in segs:
    L = SPANS.setdefault(k, [])
    if L and abs(L[-1][1] - a) < 1e-6: L[-1] = (L[-1][0], b)
    else: L.append((a, b))
fi = lambda a: 0.0 if a <= 0.01 else 0.12
BEDS = []
def bed(place, name, db, fo=0.12):
    for a, b in SPANS[place]:
        BEDS.append((name, a, b, db, fi(a), fo))

bed("bath_morning", "amb_room_tone_01", -30); bed("bath_morning", S("street_birds"), -36)
bed("empty_rooms", "amb_room_tone_03", -32); bed("empty_rooms", "clock_tick_01", -36)
bed("recess", "amb_kids_playground_01", -27); bed("recess", "amb_wind_soft_02", -38)
bed("dusk_street", "amb_wind_soft_01", -32); bed("dusk_street", G("crickets"), -38)
bed("street", S("street_birds"), -31); bed("street", "amb_wind_soft_02", -36)
bed("kitchen", G("fridge"), -32); bed("kitchen", "amb_room_tone_01", -32); bed("kitchen", S("street_birds"), -40)
bed("hallway", "amb_room_tone_03", -32); bed("hallway", "clock_tick_02", -38)
bed("dining", "amb_room_tone_03", -32); bed("dining", "clock_tick_02", -36)
bed("bath_night", G("crickets"), -34); bed("bath_night", "amb_room_tone_02", -38)
# a dark sub drone under b11-14 ("All three of them came to the doorway..."), a second layer from "alone"
BEDS.append((G("sub_drone"), PS(11) - 0.3, END, -26, 1.0, 1.2))   # thins out over the last shot into the loop
def lib_from(name, off):
    """a library bed starting `off` s into the file (the drones open with long fade-ins we must skip)"""
    out = HERE / "music_beds" / f"{name}_from{off}.wav"
    if not out.exists():
        out.parent.mkdir(exist_ok=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(off), "-i", str(ROOT / "sfx" / "library" / f"{name}.ogg"),
                        "-ar", "48000", "-ac", "2", str(out)], check=True)
    return str(out)
BEDS.append((lib_from("drone_tension_03", 26), at(12, "alone"), END, -17, 0.4, 1.2))
BEDS.append((lib_from("drone_tension_02", 6), at(12, "alone"), END, -20, 0.8, 1.2))   # an airy top a phone can hear

# ---------------------------------------------------------------- music: the owner's own track, 15 dB under the voice (measured)
# "Tiptoe Across the Floorboards" (sfx/music, credits.json). It drops out on "alone" and creeps back in under b13, continuing
# from where it would have been. Each segment's level is corrected to the whole track's loudest 3 s, so the halves match.
TRACK = ROOT / "sfx" / "music" / "tiptoe_across_the_floorboards.mp3"
MUSIC_REL = -5.9
def _pcm(args):
    raw = subprocess.run(["ffmpeg", "-v", "error", *args, "-ac", "2", "-ar", "48000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).mean(axis=1)
def _loud3(x):
    n = 3 * 48000; cs = np.cumsum(np.concatenate([[0], x.astype(np.float64) ** 2]))
    return np.sqrt((cs[n:] - cs[:-n]).max() / n) if len(x) > n else np.sqrt(np.mean(x ** 2))
_FULL = _loud3(_pcm(["-i", str(TRACK)]))
def music(off, t0, t1, fin, fout):
    out = HERE / "music_beds" / f"tiptoe_{off:.3f}_{t1 - t0:.3f}.wav"
    if not out.exists():
        out.parent.mkdir(exist_ok=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{off:.3f}", "-t", f"{t1 - t0 + 0.3:.3f}", "-i", str(TRACK),
                        "-ar", "48000", "-ac", "2", str(out)], check=True)
    corr = 20 * np.log10(_loud3(_pcm(["-i", str(out)])) / _FULL)
    return (str(out), t0, t1, MUSIC_REL + corr, fin, fout, "music")
M_OUT, M_IN = at(12, "alone"), at(13, "watching")
BEDS += [music(0.0, 0.0, M_OUT + 0.15, 0.0, 0.35), music(M_IN, M_IN, END, 1.6, 0.4)]

# ---------------------------------------------------------------- effects
SFX = []
# reflection blinks: a soft tick. Frame 0 opens on the reflection mid-blink; b1 "blinks"; b3 the family blinking together
# (four lids, a hair apart); b13 "watching me blink"; b14 "my reflection blinked first" (the last, a little louder).
blinks = [(0.0, -22), (at(1, "blinks") + 0.04, -21), (at(13, "blink"), -22), (at(14, "blinked") + 0.08, -17)]
blinks += [(at(3, "blinks") + 0.03 + k * 0.035, -22 - 2 * k) for k in range(4)]   # ShotsA a12: all four blink at blinks+0.03
for cut in CUTS:                                    # any blink the shots list explicitly
    blinks += [(t, -21) for t in cut.get("blinks", [])]
seen = []
for t, db in sorted(blinks):
    if all(abs(t - s) > 0.03 for s in seen) or db < -22:
        SFX.append((G("blink"), t, db, 0.2)); seen.append(t)

# whooshes only on whip cuts
for cut in CUTS:
    if str(cut.get("enter", "")).startswith("whip"):
        SFX.append((G("whoosh_soft"), cut["t0"] - 0.25, -20, 0.45))

# pop-in graphics (ShotsA POPS_A + the contract): "3 DAYS" on "three" (b1), "BLINK" on "blinks" (b3), the day-3 calendar on
# "day" (b5, a paper flick under it), "Would you look?" on the first "first" (b14, as in Short06.tsx POPS06) unless the shots list pops
pops = [p for cut in CUTS for p in cut.get("pops", [])] or [at(1, "three"), at(3, "blinks"), at(5, "day"), at(14, "first")]
for i, t in enumerate(pops):
    SFX.append(("pop_02", t, -24, 0.4))
SFX.append((S("paper"), at(5, "day") - 0.02, -28, 0.5))

# b4: Jenny laughs at recess
SFX.append(("laugh_child_01", at(4, "laughed"), -24, 0.8))
# b5: day three: a faint dog far off as we see the dark house
SFX.append(("dog_bark_01", atE(5, "dark") + 0.1, -36, 1.0))
# b7: dad's razor: switched on at "shaving", buzzing through "kitchen" (soft, from across the room)
SFX += [(G("razor"), at(7, "shaving") - 0.05, -24, 2.4), (G("razor"), at(7, "shaving") + 2.2, -27, 1.2)]
# b8: mom's towels: a cloth swish on "covered" and on "towels"
SFX += [(G("swish"), at(8, "covered"), -22, 0.7), (G("swish"), at(8, "towels") - 0.05, -24, 0.7)]
# b9: dinner: cutlery on a plate on "dinner", one small spoon clink on "spoon"
SFX += [("cutlery_plate_01", at(9, "dinner"), -26, 1.2), ("clink_glass_02", at(9, "spoon") + 0.05, -32, 0.6)]
# b10: the towel pulled off the mirror
SFX.append((G("swish_long"), at(10, "pulled") - 0.05, -18, 1.1))
# b11: soft footsteps as the three come to the doorway (slow steps on tile, quiet)
SFX.append(("footsteps_tile_01", at(11, "came") - 0.1, -30, 1.6))
# b12: the reveal: a sharp, low hit on "alone" (the music drops out on it)
SFX += [(G("low_hit"), at(12, "alone") - 0.02, -9, 2.5), ("impact_low_04", at(12, "alone") - 0.02, -22, 1.0)]
