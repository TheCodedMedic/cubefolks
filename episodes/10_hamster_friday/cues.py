"""Short 10 "The Hamster Who Escapes Every Friday": the sound cue sheet. A light, curious mystery: classroom murmur by day, a
quiet bedroom at night, small real sounds on every action, a soft detective sting on each clue, a big "aha" on the reveal.
Every time comes from words in video/src/short10_hamster/timing.json (at(beat, "word")) or the picture's cut list
video/src/short10_hamster/cuts.json ([{id, t0}], written by `node out/cuts10.cjs`); never a typed second.
Effects:  python3 -I episodes/10_hamster_friday/sfx10.py      (sfx_gen/*.wav, committed; includes our own music bed)
Mix:      python3 -I pipeline/mix.py episodes/10_hamster_friday/cues.py episodes/10_hamster_friday/mix.wav
Level:    python3 -I pipeline/music_level.py episodes/10_hamster_friday/cues.py -9
"""
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
from cuekit import Cues  # noqa: E402

c = Cues("short10_hamster", HERE)
at, atE, PS, PE = c.at, c.atE, c.PS, c.PE
G = lambda n: str(HERE / "sfx_gen" / f"{n}.wav")              # our synthesised effects (sfx10.py)
G6 = lambda n: str(ROOT / "episodes" / "06_reflection" / "sfx_gen" / f"{n}.wav")
S = lambda n: str(ROOT / "sfx" / f"{n}.mp3")

VOICE = str(HERE / "master_voiceover.wav")
END = c.T["end"]
LENGTH = END
MUSIC_DUCK_DB = 6
SFX_MAX = 4.0

# ---- THE MUSIC LEVEL: one number. Measured 9 dB under the voice (owner may ask for 15 dB: change only this, remix, no re-render).
MUSIC_DB = -1.3

# the picture's cuts (optional): shot ids -> start times, used to land effects on the exact cut
CUTS = {}
_cf = ROOT / "video" / "src" / "short10_hamster" / "cuts.json"
if _cf.exists():
    CUTS = {x["id"]: x["t0"] for x in json.load(open(_cf))}
B = lambda b: max(0.0, PS(b) - 0.08)

# ---------------------------------------------------------------- places (beats): classroom / bedroom at night
CLASS = [(0.0, B(10)), (B(13), B(14)), (B(18) + (PE(18) - PS(18)) * 0.5, END)]
HOME = [(B(10), B(13)), (B(14), B(18) + (PE(18) - PS(18)) * 0.5)]
BEDS = []
for a, b in CLASS:
    BEDS += [("amb_school_gym_04", a, b, -36, 0.0 if a < 0.01 else 0.1, 0.1), ("clock_tick_02", a, b, -42, 0.0 if a < 0.01 else 0.1, 0.1)]
for a, b in HOME:
    BEDS += [("amb_room_tone_01", a, b, -30, 0.1, 0.1), (G6("crickets"), a, b, -38, 0.1, 0.1)]
# midnight: a slow clock and a low tension drone under b15-16 (the music steps out)
BEDS.append(("clock_tick_03", B(15), B(17), -34, 0.1, 0.2))
BEDS.append(("drone_tension_02", B(15), B(17) + 0.4, -30, 0.3, 0.6))

# ---------------------------------------------------------------- music: our own sneaky pizzicato bed (sfx10.py)
# plays from frame 0; steps out at "midnight" (b15) for the scratching; returns on the reveal (b17) and runs into the loop.
M_OUT, M_IN = at(15, "midnight"), at(17, "crawled")
BEDS += [(G("mystery_bed"), 0.0, M_OUT + 0.2, MUSIC_DB, 0.0, 0.5, "music"), (G("mystery_bed"), M_IN, END, MUSIC_DB, 0.3, 0.3, "music")]

# ---------------------------------------------------------------- effects
SFX = []
add = lambda name, t, db, keep=None: SFX.append((name, t, db) + ((keep,) if keep else ()))
# b1 frame 0: the empty cage's wheel still squeaking round
add(G("wheel"), 0.0, -24, at(1, "without") - 0.0)
add("pop_02", 0.0, -26, 0.4)                                   # the ESCAPED (AGAIN) stamp is on at frame 0
add(S("stamp"), 0.02, -24, 0.5)
# b2: the key swings; the tape rips and slaps on
add("text_tick_02", at(2, "key"), -30, 0.2)
add(G("tape_rip"), at(2, "taped") - 0.1, -18, 0.9)
# b3: ME watching (a pencil note), "vanished": a quick whoosh
add(G("pencil"), at(3, "watched"), -28, 0.8)
add("whoosh_short_02", at(3, "vanished") - 0.05, -22, 0.5)
# b4 CLUE: the drawer slides out; washing at the sink
add(G("drawer_out"), at(4, "Maya") , -18, 0.7)
add(G("clue"), at(4, "drawer"), -20, 1.3)
add("amb_rain_light_02", at(4, "wash"), -34, 1.0)              # the sink tap running
# b5 CLUE: cleaning (a spray/rustle), the backpacks lined up
add(G("rustle"), at(5, "clean"), -26, 0.7)
add(G("clue"), at(5, "backpacks"), -20, 1.3)
# b6 Monday: kids file in; he's back, munching
add("footsteps_tile_02", B(6), -30, 1.4)
add(G("munch"), at(6, "back") - 0.1, -22, 1.0)
# b7: the tape, still whole (a fingertip tap)
add(S("finger_tap"), at(7, "tape"), -24, 0.5)
# b8: the magnifying glass sweep, tapping the bars
add("whoosh_short_01", at(8, "checked"), -28, 0.4)
add("text_tick_01", at(8, "bars"), -28, 0.3)
# b9: "Nothing." a deflated little horn
add("cartoon_sad_horn_01", at(9, "nothing") + 0.05, -30, 1.4)
# b10 CLUE: unzip; the shells spill on the bed
add(G("rustle"), B(10) + 0.15, -24, 0.7)
add(G("shells"), at(10, "shells") - 0.05, -20, 1.0)
add(G("clue"), at(10, "shells") + 0.1, -22, 1.3)
# b11: a head shake (a soft whoosh)
add("whoosh_short_03", at(11, "never"), -32, 0.4)
# b12 CLUE: Peanut's wheel at home, the second nest
add(G("wheel"), at(12, "Peanut") - 0.2, -28, 1.4)
add(G("clue"), at(12, "nest"), -20, 1.3)
# b13: the phone starts recording
add(G("boop"), at(13, "filmed"), -20, 0.3)
add(G("rec_beep"), at(13, "cage") , -28, 0.2)
# b14: the backpack set down by Peanut's cage
add(G("rustle"), at(14, "set"), -26, 0.7)
add("body_thud_04", at(14, "backpack") , -36, 0.4)
# b15: midnight; scratching inside the bag; ME sits up (a heartbeat)
add("text_tick_03", at(15, "midnight"), -26, 0.2)                # the digital clock flips
add(G("scratch"), at(15, "something"), -16, 1.6)
add("heartbeat_single_01", at(15, "scratched") + 0.25, -24, 1.0)
# b16: grabs the phone, presses play
add("phone_catch_02", at(16, "checked") - 0.1, -26, 0.6)
add(G("boop"), at(16, "video"), -22, 0.3)
# b17: the recording: the drawer out, a little patter, the drop into the bag; the AHA on the reveal
add(G("drawer_out"), B(17) + 0.05, -26, 0.7)
add(G("scratch"), at(17, "through") , -26, 0.8)
add("pop_06", at(17, "straight"), -24, 0.3)
add(G("aha"), at(17, "into") - 0.05, -14, 2.4)
# b18: ME's slow smile; Monday: he climbs back up the hole
add("sparkle_01", at(18, "weekend"), -24, 1.2)
add(G("scratch"), at(18, "Monday's"), -28, 0.8)
add(G("drawer_in"), at(18, "back"), -24, 0.7)
# b19: ME parks the bag by the cage, a wink; the wheel squeaks into the loop
add(G("rustle"), at(19, "park"), -26, 0.7)
add("sparkle_01", at(19, "car"), -22, 1.2)
add(G("wheel"), at(19, "beside"), -26, END - at(19, "beside"))
# the on-screen question pops in for the last 3 s
add("pop_02", END - 3.0, -24, 0.4)
