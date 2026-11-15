"""Short 08 "The Invisible Elephant" (comedy): the sound cue sheet. Bright and bouncy: school beds, cartoon accents, one
original sneaky-comedy music bed. Every time comes from the voice's measured words (video/src/short08_elephant/timing.json)
via at(beat, "word"); small offsets are lead-ins only. Never a typed second.
Effects:  python3 -I episodes/08_invisible_elephant/sfx08.py      (sfx_gen/*.wav, ours)
Mix:      python3 -I pipeline/mix.py episodes/08_invisible_elephant/cues.py episodes/08_invisible_elephant/mix.wav
Level:    python3 -I pipeline/music_level.py episodes/08_invisible_elephant/cues.py -9
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(ROOT / "pipeline"))
from cuekit import Cues  # noqa: E402

c = Cues("short08_elephant", HERE)
at, atE, PS, PE = c.at, c.atE, c.PS, c.PE
G = lambda n: str(HERE / "sfx_gen" / f"{n}.wav")   # ours (sfx08.py)
S = lambda n: str(ROOT / "sfx" / f"{n}.mp3")       # credited one-offs in sfx/

VOICE = str(HERE / "master_voiceover.wav")
END = c.T["end"]
LENGTH = END
MUSIC_DUCK_DB = 6
SFX_MAX = 4.0

# ---------------------------------------------------------------- music: ONE number for the owner (measured vs the voice)
# MUSIC_DB is the bed's rel_db. Measured with pipeline/music_level.py: this value puts the music about 9 dB under the voice.
# For the owner's 15 dB remix, lower MUSIC_DB by 6 (to -8.6) and re-mix (no re-render).
MUSIC_DB = -2.6
B = lambda b: PS(b) - 0.06
HAYES_IN, BACK_IN = at(7, "Hayes"), B(8)   # the record-scratch freeze: the music stops on "Hayes", back on beat 8

BEDS = [
    (G("scheme_bed"), 0.0, HAYES_IN + 0.05, MUSIC_DB, 0.0, 0.12, "music"),
    (G("scheme_bed"), BACK_IN, END, MUSIC_DB, 0.25, 0.6, "music"),
]
fi = lambda a: 0.0 if a <= 0.01 else 0.12
def bed(name, a, b, db, fo=0.12):
    BEDS.append((name, a, b, db, fi(a), fo))

# places (by beat): gym b1, yard b2-4 + b8-9, field b5, corridor b6-7, office corridor b10-12, gym b13-18
bed("amb_school_gym_01", 0.0, B(2), -30)
bed("amb_kids_playground_01", B(2), B(5), -29)
bed("amb_wind_soft_02", B(5), B(6), -36); bed(S("street_birds"), B(5), B(6), -34)
bed("amb_school_gym_04", B(6), HAYES_IN + 0.1, -31, fo=0.25)           # the hallway jam: kids everywhere ... until Hayes
bed("amb_room_tone_03", HAYES_IN, B(8), -30)                            # the frozen silence
bed("amb_kids_playground_01", B(8), B(10), -31)
bed("amb_room_tone_03", B(10), B(13), -30); bed("clock_tick_02", B(10), B(13), -38)
bed("amb_school_gym_01", B(13), END, -29)
bed("crowd_murmur_01", at(14, "Forty"), END, -33)

# ---------------------------------------------------------------- effects
SFX = []
# pops on every pop-in graphic (Short08.tsx POPS)
for t in [0.0, at(3, "Five"), at(12, "fifty"), at(14, "Forty"), at(15, "ten"), at(17, "paid"), END - 3.0]:
    SFX.append(("pop_01", t, -24, 0.3))
# b1 the hook: a giggle from the rider, cash being counted, a ka-ching on "four hundred"
SFX += [("laugh_kid_01", 0.15, -26, 1.6), ("coins_handling_01", at(1, "made"), -28, 1.0), (G("kaching"), at(1, "four"), -17, 1.2)]
# b2 the yard: a school bell far off, BRO's "come on over" squeak of a toy as he waves the empty leash
SFX += [("bell_school_01", B(2), -33, 2.0), ("squeaky_toy_01", at(2, "pets"), -28, 0.8)]
# b3 the sale: a small ka-ching on "Five", the box, a paper flick on "certificate"
SFX += [(G("kaching"), at(3, "Five") + 0.05, -23, 1.0), ("cup_set_down_01", at(3, "box,"), -30, 0.5), (S("paper"), at(3, "certificate.") - 0.05, -26, 0.6)]
# b4 the line
SFX.append(("crowd_murmur_02", B(4), -28, 1.2))
# b5 Coach: a whinny on "climbed" (Coach doing it himself), the gallop, BONK into the tree, birds, the thud
SFX += [("horse_neigh_01", at(5, "onto"), -27, 1.4), ("horse_gallop_dirt_01", at(5, "horse"), -25, 1.6),
        ("cartoon_dazzle_01", at(5, "real") + 0.27, -16, 1.9), ("body_thud_01", at(5, "real") + 0.75, -22, 1.0)]
# b6 the hallway jam: kids yapping like their dogs, a laugh
SFX += [("dog_bark_happy_01", at(6, "hallway"), -30, 2.0), ("laugh_children_01", at(6, "walk"), -31, 1.6)]
# b7 Hayes: heels on tile, then the record scratch on her name (the music stops dead)
SFX += [("footsteps_tile_03", B(7), -27, 0.8), (S("record_scratch"), HAYES_IN - 0.04, -15, 0.9)]
# b8 "how much": coins as BRO lifts the cash box
SFX.append(("coins_clink_01", at(8, "much"), -24, 0.8))
# b9 her finger down the price list
SFX.append(("text_tick_04", at(9, "which"), -30, 0.9))
# b10 the peanuts: a cheeky clarinet suspense sting
SFX.append(("cartoon_suspense_02", at(10, "giant"), -24, 2.6))
# b11 the office door: in, shut
SFX += [("door_open_01", at(11, "went"), -24, 0.8), ("door_close_01", at(11, "leash.") + 0.05, -24, 0.7)]
# b12 out again: door, then KA-CHING on "fifty"
SFX += [("door_open_01", at(12, "came"), -24, 0.8), (G("kaching"), at(12, "fifty") - 0.03, -14, 1.3)]
# b13 the big gym doors creak open; a "woah" from inside
SFX += [("door_creak_open_01", at(13, "opened") - 0.1, -16, 2.4), ("crowd_gasp_03", at(13, "doors.") - 0.1, -24, 1.8)]
# b15 THE TWIST: the cloth whips off the sign, a crowd "ooh", ka-ching on "ten"
SFX += [("whoosh_short_03", at(15, "selling") - 0.05, -22, 0.5), ("crowd_gasp_02", at(15, "elephant"), -24, 1.4),
        ("laugh_kid_01", at(15, "rides"), -27, 1.4), (G("kaching"), at(15, "ten") - 0.03, -18, 1.1)]
# b16 "first ticket": the comedy sting (ba-dum-tss)
SFX += [(S("paper"), at(16, "first"), -30, 0.4),
        ("sting_joke_drum_01", atE(16, "ticket."), -16, 1.8)]
# b17 paying with THE fifty: coins (the $40 change), a sad little horn for the brother's money
SFX += [("coins_handling_01", at(17, "money"), -25, 1.0), ("cartoon_sad_horn_01", atE(17, "him."), -26, 1.5)]
# b18 "the first ten dollars she made": ka-ching, a wink sparkle on her smirk; the giggle that loops into frame 0
SFX += [(G("kaching"), at(18, "ten") - 0.03, -15, 1.2), ("sparkle_01", at(18, "made.") - 0.1, -22, 1.2)]
