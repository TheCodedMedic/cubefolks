"""Beanfolk Short 5 "A kid stayed awake for eleven days" (Beanfolk 3D): the sound cue sheet. Every time comes from
cue_times_bean.json, which video/scripts/dump_short05_never_sleep.mjs exports from the picture's own timing
(video/src/short05_never_sleep/timing.ts and pops.ts, all anchored to measured words), so whooshes, pops, the whistle,
the bounces, the flippers and the microsleep switch clicks land on the same frames as the picture.
Effects:  python3 -I episodes/05_never_sleep/sfx_bean.py
Mix:      python3 -I pipeline/mix.py episodes/05_never_sleep/cues_bean.py episodes/05_never_sleep/mix_bean.wav
Level:    python3 -I pipeline/music_level.py episodes/05_never_sleep/cues_bean.py -15
"""
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
J = json.load(open(HERE / "cue_times_bean.json"))
CUTS, EV, POPS, END = J["CUTS"], J["EV"], J["POPS"], J["END"]
G = lambda n: str(HERE / "sfx_bean" / f"{n}.wav")   # our synthesised effects
S = lambda n: str(ROOT / "sfx" / f"{n}.mp3")        # the credited CC0 one-offs in sfx/
start = {c[0]: c[1] for c in CUTS}
nxt = {CUTS[i][0]: (CUTS[i + 1][1] if i + 1 < len(CUTS) else END) for i in range(len(CUTS))}

VOICE = str(HERE / "master_voiceover.wav")
LENGTH = END
MUSIC_DUCK_DB = 6
SFX_MAX = 4.0

def place(sid):
    n = int(sid[1:3])
    if n in (3, 4, 5, 31): return "day"
    if 11 <= n <= 14 or n == 16: return "street"
    if n == 15: return "field"
    if 17 <= n <= 21: return "arcade"
    if 22 <= n <= 27: return "reveal"
    if n == 28: return "class"
    if 32 <= n <= 34: return "stage"
    return "den"

spans = {}
for sid, t0, _ in CUTS:
    k, t1 = place(sid), nxt[sid]
    L = spans.setdefault(k, [])
    if L and abs(L[-1][1] - t0) < 1e-6: L[-1][1] = t1
    else: L.append([t0, t1])

BEDS = []
fi = lambda a: 0.0 if a == 0 else 0.12
for a, b in spans.get("den", []):
    BEDS += [("amb_room_tone_02", a, b, -30, fi(a), 0.12), ("clock_tick_fast_01" if b - a < 2.6 else "clock_tick_02", a, b, -30, fi(a), 0.12)]
for a, b in spans.get("day", []):
    BEDS += [("amb_room_tone_01", a, b, -30, 0.12, 0.12), (S("street_birds"), a, b, -33, 0.12, 0.12)]
for a, b in spans.get("street", []):
    BEDS += [("amb_city_evening_02", a, b, -29, 0.12, 0.12), ("amb_wind_soft_01", a, b, -36, 0.12, 0.12)]
for a, b in spans.get("field", []):
    BEDS += [("cheer_crowd_02", a, b, -18, 0.05, 0.15)]
for a, b in spans.get("arcade", []):
    BEDS += [("amb_crowd_talking_01", a, b, -33, 0.12, 0.12), ("keyboard_gaming_01", a, b, -34, 0.12, 0.12)]
for a, b in spans.get("reveal", []):
    BEDS += [("drone_tension_02", a, b, -32, 0.2, 0.2)]
for a, b in spans.get("class", []):
    BEDS += [("amb_room_tone_03", a, b, -30, 0.12, 0.12), ("crowd_whisper_01", a, b, -36, 0.12, 0.12)]
for a, b in spans.get("stage", []):
    BEDS += [("amb_room_tone_02", a, b, -31, 0.12, 0.12), ("crowd_murmur_02", a, b, -32, 0.12, 0.12)]

# music: the owner's own track "Tiptoe Across the Floorboards" (sfx/music, credits.json), 15 dB under the voice (measured)
MUSIC = str(ROOT / "sfx" / "music" / "tiptoe_across_the_floorboards.mp3")
MUSIC_REL = -5.4
BEDS += [(MUSIC, 0.0, END, MUSIC_REL, 0.0, 0.4, "music")]

SFX = []
wh = ["whoosh_short_01", "whoosh_short_02", "whoosh_short_03"]
for i, (sid, t0, enter) in enumerate(CUTS):
    if enter.startswith("whip"):
        SFX.append((wh[i % 3], t0 - 0.14, -15, 0.5))
    elif enter == "flash" and sid != "s22_yousee":
        SFX += [("whoosh_medium_03", t0 - 0.25, -14, 1.2), ("sparkle_03", t0 - 0.02, -22, 1.2)]
# frame 1: a sound on the first frame (a riser-pop and the ticking clock)
SFX += [("pop_05", 0.0, -14, 0.4), ("clock_tick_fast_01", 0.0, -24, 1.0)]
# "You see": a riser in, a record scratch on the cut
SFX += [("riser_03", start["s22_yousee"] - 2.0, -20, 2.0), (S("record_scratch"), start["s22_yousee"] - 0.12, -11, 0.9)]

pops = ["pop_01", "pop_05", "pop_06"]
for i, p in enumerate(POPS):
    t = p["t0"]
    if t <= 0.01: continue
    if p["kind"] == "stamp":
        SFX += [(S("stamp"), t - 0.03, -6, 1.0), ("impact_hit_03", t - 0.02, -13, 0.6)]
    elif p.get("icon") == "check":
        SFX += [("ding_02", t, -13, 1.5)]
    elif p["kind"] == "calendar":
        SFX += [(S("paper"), t - 0.02, -18, 0.5), (pops[i % 3], t, -16, 0.4)]
    else:
        SFX.append((pops[i % 3], t, -15, 0.4))
for k in ("BED_X", "FOOTBALL", "QUESTION"):
    SFX.append(("pop_02", J[k]["t0"], -15, 0.4))
SFX.append(("sting_wrong_buzz_01", J["BED_X"]["t0"] + 0.05, -26, 0.6))   # the crossed-out bed

# the friends: a whistle blast in Randy's ear, the basketball bouncing, a swish into the hoop
for t in J["WHISTLES"]:
    SFX += [(G("whistle"), t, -8, 0.8), ("cartoon_boing_01", t + 0.1, -18, 0.8)]
for t in J["BOUNCES"]:
    if t < END: SFX.append((G("bounce"), t, -17, 0.35))
SFX += [("ball_throw_01", start["s08_hoops"] + 0.35, -20, 0.6), (S("swish"), start["s08_hoops"] + 0.75, -16, 0.6),
        ("cheer_man_01", start["s08_hoops"] + 0.8, -19, 1.0)]
# the calendar flipping through the days (hook)
for k in range(10):
    SFX.append(("text_tick_01", start["s02_eleven"] + k * 0.075, -24, 0.12))
# day two: a woozy blur
SFX += [("cartoon_dazzle_01", EV["couldnt"], -20, 1.6)]
# day four: the street sign "person"
SFX += [("cartoon_suspense_01", EV["thought"], -24, 1.2), ("cartoon_spring_01", EV["was4"] + 0.1, -20, 0.8), ("phone_catch_03", EV["person"] + 0.05, -14, 0.3),
        ("gasp_man_01", EV["person"] + 0.3, -20, 1.0)]
# the football daydream: a big crowd roar, then back on the street with a ba-dum-tss
SFX += [("cheer_crowd_whistle_01", start["s15_famous"], -16, 0.75), ("sting_joke_drum_01", EV["player"] + 0.25, -20, 1.6)]
# the pinball: flipper clacks, bells, then WINNER
for k in range(8):
    tt = start["s17_last"] + 0.35 + k * 0.32
    if tt < EV["pinball"] - 0.1: SFX.append((G("flipper"), tt, -17, 0.2))
SFX += [(G("pinbell"), start["s17_last"] + 0.6, -20, 1.0), (G("pinbell"), start["s18_scientist"] + 0.5, -20, 1.0),
        ("game_victory_04", EV["pinball"], -14, 1.8), ("gasp_man_01", EV["pinball"] + 0.35, -18, 1.0), ("cheer_man_02", EV["pinball"] + 0.2, -17, 1.0)]
SFX += [("cartoon_suspense_02", EV["how"], -24, 1.4), (S("sparkle"), EV["brain7"] + 0.05, -20, 1.0)]
# the reveal: a sly giggle, then a light-switch click (off and on) on each microsleep blink
SFX += [("cartoon_giggle_01", EV["cheating"] + 0.15, -20, 1.4)]
for t in J["BLINKS"]:
    SFX += [(G("switch"), t, -11, 0.2), (G("switch"), t + 0.18, -14, 0.2)]
SFX += [(G("yawn"), EV["naps"] - 0.15, -20, 1.2), ("ding_04", EV["micro"] + 0.6, -20, 0.4)]
# the classroom nod: a snap back awake and a little laugh
SFX += [("cartoon_slide_01", EV["one10"], -22, 0.6), ("cartoon_panic_01", EV["one10"] + 0.42, -18, 0.6), ("laugh_children_01", EV["class10"], -26, 1.0)]
# eleven days: a huge yawn; fourteen hours of snoring; woke up fine
SFX += [(G("yawn"), EV["eleven11"] - 0.1, -12, 1.2), (G("snore"), EV["randy11"] + 0.05, -12, 1.7), ("tape_rewind_01", EV["fourteen"], -24, 1.0),
        ("sting_achievement_bell_01", EV["fine"], -18, 1.5), ("cheer_crowd_03", EV["woke"] + 0.1, -22, 1.0)]
# the record book: a glow, the stamp (already above), the book slamming shut, a gasp
SFX += [("sparkle_03", EV["record"], -22, 1.2), (G("switch"), EV["accepting"] + 0.38, -16, 0.2), (S("thud"), EV["accepting"] + 0.36, -12, 0.8),
        ("crowd_gasp_02", EV["stopped"] + 0.3, -22, 1.0), ("sting_mystery_drum_01", EV["noone"], -22, 1.6)]
# the loop: a rewind swoosh into frame 1
SFX += [("tape_rewind_02", END - 1.2, -24, 1.2)]
# v2 acting: the jolt hop on the whistle, the flop onto the cot (a spring creak), the stamp jump
SFX += [("cartoon_spring_01", start["s30_slept"] + 0.36, -17, 0.9), ("cartoon_slide_01", start["s30_slept"], -24, 0.5),
        ("cartoon_panic_01", EV["shifts"] + 0.08, -20, 0.6), ("cartoon_party_horn_01", start["s19_pinball"] + 0.4, -24, 1.2)]
