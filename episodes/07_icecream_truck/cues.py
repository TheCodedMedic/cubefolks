"""Short 07 "The Truck With No Speaker": the sound cue sheet. The whole story is sound: ONE original jingle with a fixed wrong
note (sfx07.py) that comes from the truck (frame 0), from Toby (b6), hummed by the teacher with the same wrong note (b9-10),
up the stairs and out of Mom (b11-15), stops dead on "Then" (b16), and blasts out of her with bells (b17). Night: crickets and a
soft wind; school: kids' murmur, a clock; a slow music-box bed of our own (the jingle at half speed) where the jingle is not.
Every time comes from words in video/src/short07_truck/timing.json (at(beat, "word")); never a typed second.
Effects:  python3 -I episodes/07_icecream_truck/sfx07.py      (sfx_gen/*.wav, committed)
Mix:      python3 -I pipeline/mix.py episodes/07_icecream_truck/cues.py episodes/07_icecream_truck/mix.wav
Level:    python3 -I pipeline/music_level.py episodes/07_icecream_truck/cues.py -9
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
from cuekit import Cues  # noqa: E402

c = Cues("short07_truck", HERE)
at, atE, PS, PE = c.at, c.atE, c.PS, c.PE
G = lambda n: str(HERE / "sfx_gen" / f"{n}.wav")                   # our synthesised sounds (sfx07.py)
G6 = lambda n: str(ROOT / "episodes" / "06_reflection" / "sfx_gen" / f"{n}.wav")
S = lambda n: str(ROOT / "sfx" / f"{n}.mp3")

VOICE = str(HERE / "master_voiceover.wav")
END = c.T["end"]
LENGTH = END
MUSIC_DUCK_DB = 6
SFX_MAX = 4.0
B = lambda b: max(0.0, PS(b) - 0.08)                                # a cut lands just before a line (common.tsx P)

# ---- THE MUSIC LEVEL: one number. Measured about 9 dB under the voice with music_level.py (the owner may ask for 15 dB:
# change only this and remix; no re-render).
MUSIC_DB = 2.1
# ---- the jingle's level (it is a story sound, not the music bed): one number too
JINGLE_DB = -14

# ---------------------------------------------------------------- places
NIGHT_ST = [(0.0, B(2)), (B(3), B(4)), (B(11), at(12, "but") - 0.06), (at(19, "its") - 0.06, END)]
KITCHEN = [(B(2), B(3))]
YARD = [(B(4), B(6))]
SCHOOL_IN = [(B(6), B(11))]
HOUSE_NIGHT = [(at(12, "but") - 0.06, at(19, "its") - 0.06)]
BEDS = []
fi = lambda a: 0.0 if a < 0.01 else 0.08
for a, b in NIGHT_ST:
    BEDS += [(G6("crickets"), a, b, -30, fi(a), 0.1), ("amb_wind_soft_02", a, b, -36, fi(a), 0.1)]
for a, b in KITCHEN:
    BEDS += [("amb_room_tone_01", a, b, -30, 0.08, 0.08), (S("street_birds"), a, b, -36, 0.08, 0.08), (G6("fridge"), a, b, -36, 0.08, 0.08)]
for a, b in YARD:
    BEDS += [("amb_kids_playground_01", a, b, -30, 0.08, 0.1), ("amb_wind_soft_02", a, b, -38, 0.08, 0.1)]
for a, b in SCHOOL_IN:
    BEDS += [("amb_room_tone_03", a, b, -32, 0.08, 0.08), ("clock_tick_02", a, b, -38, 0.08, 0.08)]
BEDS.append(("amb_school_gym_04", B(6), B(7), -38, 0.08, 0.1))      # the corridor's distant kids
for a, b in HOUSE_NIGHT:
    BEDS += [("amb_room_tone_01", a, b, -30, 0.1, 0.1), (G6("crickets"), a, b, -40, 0.1, 0.1)]
# dread: a low drone from "Last night" (b11) to the end, thickening under b16's silence
BEDS.append(("drone_tension_03", B(11), at(19, "its"), -30, 0.8, 0.8))
BEDS.append((G6("sub_drone"), at(16, "Then"), at(17, "whole"), -24, 0.1, 0.05))
BEDS.append(("drone_tension_02", B(13), at(19, "its"), -34, 0.6, 0.8))

# ---------------------------------------------------------------- music: our own slow music-box bed (sfx07.py)
# where the jingle is not: b2 (kitchen), b4-b10 (school, under Toby and the hum), back softly for b18-b19.
BEDS += [
    (G("music_box_bed"), B(2), B(3) + 0.1, MUSIC_DB, 0.15, 0.25, "music"),
    (G("music_box_bed"), B(4), B(11), MUSIC_DB, 0.2, 0.6, "music"),
    (G("music_box_bed"), at(18, "held"), at(19, "its") + 0.3, MUSIC_DB, 0.4, 0.5, "music"),
]

# ---------------------------------------------------------------- the jingle (sfx07.py renders each cue at its exact phrase position)
SFX = []
add = lambda name, t, db, keep=None: SFX.append((name, t, db) + ((keep,) if keep else ()))
add(G("j01_truck_hook"), 0.0, JINGLE_DB, 4.0)                        # frame 0: the truck sings
add(G("j03_truck_toby"), B(3) - 0.05, JINGLE_DB - 3, 2.0)            # next door, a little further
add(G("j06_toby"), at(6, "walked") - 0.02, JINGLE_DB - 4, 2.0)       # from Toby himself (stops dead at b7)
add(G("j09_hum"), at(9, "hummed"), JINGLE_DB - 1, 4.0)               # the teacher hums it
add(G("wrong_note"), at(10, "wrong"), JINGLE_DB - 12, 0.6)           # a whisper of the truck's own sour note under hers
add(G("j11_closer"), B(11), JINGLE_DB, 9.0)                          # outside, then up the stairs, then from Mom; cut on "Then"
add(G("j17_blast"), at(17, "whole") - 0.02, JINGLE_DB + 11, 3.0)      # THE TWIST: the whole song, bells and all
add(G("j18_cone"), at(18, "held"), JINGLE_DB - 8, 2.0)               # the spare cone hums it, tiny
add(G("j35_loop"), at(19, "its") - 0.08, JINGLE_DB + 1, 2.0)         # back on the street: carries across the loop cut

# ---------------------------------------------------------------- effects (all on words)
# b1: the truck rolls in (engine idle under the jingle), comes to rest
add(G("engine_idle"), 0.0, -30, 3.3)
# b2: Mom drops the free-cone flyer in the bin ("never take"): paper, the tin lid
add(S("paper"), at(2, "never") - 0.05, -26, 0.6)
add(G("bin_lid"), at(2, "take"), -24, 0.9)
# b3: Toby's steps to the truck; the cone handed over with a tiny sparkle
add(G("step_soft"), B(3) + 0.05, -32, 0.4); add(G("step_soft"), B(3) + 0.35, -32, 0.4)
add("sparkle_01", at(3, "week."), -28, 1.0)
# b5: down the hot slide
add(G("slide_whoosh"), at(5, "even") - 0.6, -26, 1.0)
# b7: the song stops dead: a little air
add("whoosh_short_01", B(7) - 0.05, -32, 0.4)
# b8: chalk on the board; b9: pencils scratching (the spelling test)
add(G("chalk"), at(8, "teacher"), -28, 0.6); add(G("chalk"), at(8, "cone") + 0.05, -30, 0.6)
add(G("pencils"), B(9) + 0.05, -30, 0.7); add(G("pencils"), at(9, "spelling") + 0.2, -32, 0.7)
# b10: the class goes still on the wrong note (ME's pencil stops: a tiny tap)
add("text_tick_02", at(10, "the", 2), -30, 0.2)
# b11: the truck rolls up our street, brakes on "stopped"
add(G("engine_idle"), B(11), -26, 3.0)
add(G("brake_squeak"), at(11, "stopped") + 0.15, -28, 0.7)
# b12: "The engine went quiet": it dies; the headlights click off
add(G("engine_off"), at(12, "engine") - 0.1, -22, 1.6)
add(G("click"), at(12, "quiet,"), -26, 0.15)
# b13: the bedroom door creaks open on "opened"
add("door_creak_open_01", at(13, "opened") - 0.05, -22, 2.0)
# b14: ME scrambles back across the bed
add(G6("swish"), at(14, "backed"), -24, 0.7)
# b15: Mom's slow steps
add(G("step_soft"), at(15, "music"), -26, 0.4); add(G("step_soft"), at(15, "followed") + 0.1, -26, 0.4)
# b16: silence; a held breath; her mouth opens with a wet click; a riser into the blast
add(G("mouth_click"), at(16, "opened") + 0.1, -28, 0.25)
add(G("riser_in"), at(17, "whole") - 2.0, -26, 2.0)
# b17: the blast: a sub hit and a short impact under the first note
add(G("sub_hit"), at(17, "whole") - 0.02, -12, 2.5)
add("impact_low_04", at(17, "whole") - 0.02, -20, 1.0)
# b19: the last word: a low hit on "speaker", then the street
add(G("sub_hit"), at(19, "speaker."), -20, 1.5)
