"""Gizmo Origins Short 4 "The Wrong Part That Saved Millions of Hearts" (Beanfolk 3D): the sound cue sheet. Every time
comes from cue_times_bean.json, which video/scripts/dump_short04_pacemaker.mjs exports from the picture's own timing
(video/src/short04_pacemaker/timing.ts and pops.ts, all anchored to measured words), so whooshes, pops, pulse ticks and
monitor beeps land on the same frames as the picture.
Effects:  python3 -I episodes/04_pacemaker/sfx_bean.py
Mix:      python3 -I pipeline/mix.py episodes/04_pacemaker/cues_bean.py episodes/04_pacemaker/mix_bean.wav
Level:    python3 -I pipeline/music_level.py episodes/04_pacemaker/cues_bean.py -15
"""
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
J = json.load(open(HERE / "cue_times_bean.json"))
CUTS, PULSES, EV, POPS, END = J["CUTS"], J["PULSES"], J["EV"], J["POPS"], J["END"]
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
    if 22 <= n <= 28: return "hospital"
    if 29 <= n <= 30: return "dark"
    if 31 <= n <= 37: return "reveal"
    if n in (40, 42): return "farm"
    if n == 41: return "barn"
    if 43 <= n <= 47: return "or"
    if 48 <= n <= 50: return "street"
    return "lab"

spans = {}
for sid, t0, _ in CUTS:
    k, t1 = place(sid), nxt[sid]
    L = spans.setdefault(k, [])
    if L and abs(L[-1][1] - t0) < 1e-6: L[-1][1] = t1
    else: L.append([t0, t1])

BEDS = []
fi = lambda a: 0.0 if a == 0 else 0.12
for a, b in spans.get("lab", []):
    BEDS += [("amb_room_tone_02", a, b, -30, fi(a), 0.12), ("clock_tick_old_01", a, b, -34, fi(a), 0.12)]
for a, b in spans.get("hospital", []) + spans.get("or", []):
    BEDS += [("amb_room_tone_01", a, b, -30, 0.12, 0.12), ("crowd_whisper_01", a, b, -38, 0.12, 0.12)]
for a, b in spans.get("dark", []):
    BEDS += [("amb_room_tone_03", a, b, -31, 0.1, 0.1), ("drone_tension_01", a, b, -30, 0.2, 0.2)]
for a, b in spans.get("reveal", []):
    BEDS += [("drone_tension_02", a, b, -33, 0.2, 0.2)]
for a, b in spans.get("farm", []):
    BEDS += [(S("street_birds"), a, b, -30, 0.12, 0.12), ("amb_wind_soft_01", a, b, -34, 0.12, 0.12)]
for a, b in spans.get("barn", []):
    BEDS += [("amb_barn_01", a, b, -30, 0.12, 0.12)]
for a, b in spans.get("street", []):
    BEDS += [("amb_city_street_03", a, b, -29, 0.12, 0.15), ("crowd_murmur_01", a, b, -31, 0.12, 0.15)]

# music: the owner's own track "Tiptoe Across the Floorboards" (sfx/music, credits.json), 15 dB under the voice (measured)
MUSIC = str(ROOT / "sfx" / "music" / "tiptoe_across_the_floorboards.mp3")
MUSIC_REL = -6.3
BEDS += [(MUSIC, 0.0, END, MUSIC_REL, 0.0, 0.4, "music")]

SFX = []
wh = ["whoosh_short_01", "whoosh_short_02", "whoosh_short_03"]
for i, (sid, t0, enter) in enumerate(CUTS):
    if enter.startswith("whip"):
        SFX.append((wh[i % 3], t0 - 0.14, -15, 0.5))
    elif enter == "flash" and sid != "s31_yousee":
        SFX += [("whoosh_medium_03", t0 - 0.25, -14, 1.2), ("sparkle_03", t0 - 0.02, -22, 1.2)]
    elif enter == "cut" and t0 > 0:
        SFX.append(("impact_hit_03", t0 - 0.01, -20, 0.4))
# "You see": a riser in, a record scratch on the cut
SFX += [("riser_03", start["s31_yousee"] - 2.0, -19, 2.0), (S("record_scratch"), start["s31_yousee"] - 0.12, -11, 0.9)]

pops = ["pop_01", "pop_05", "pop_06"]
for i, p in enumerate(POPS):
    t = p["t0"]
    if p["kind"] == "stamp":
        SFX += [(S("stamp"), t - 0.03, -6, 1.0), ("impact_hit_03", t - 0.02, -13, 0.6)]
    elif p.get("icon") == "check":
        SFX += [("ding_02", t, -13, 1.5)]
    elif p.get("icon") == "heart":
        SFX += [("sparkle_01", t, -16, 1.2), (pops[i % 3], t, -16, 0.4)]
    elif p.get("text") == "PULSE":
        SFX.append(("pop_02", t + 0.02, -19, 0.4))
    else:
        SFX.append((pops[i % 3], t, -15, 0.4))
SFX.append(("pop_03", EV["plugged"], -15, 0.4))  # the plug icon

# the lab scope: an electric tick on every blip that is on screen in a lab shot
def in_place(t, k): return any(a <= t < b for a, b in spans.get(k, []))
for t in PULSES["lab"]:
    if in_place(t, "lab") and t < END:
        SFX.append((G("tick"), t, -13 if EV["pulsed"] <= t < EV["heart9"] + 0.5 else -19, 0.3))
# monitors: a beep on every blip (slowing, the machine, the steady one)
for t in PULSES["slow"] + PULSES["machine"]:
    if in_place(t, "hospital") or in_place(t, "dark"): SFX.append((G("beep"), t, -18, 0.2))
for t in PULSES["steady"]:
    SFX.append((G("beep"), t, -17, 0.2))
# the violet heart: a heartbeat on each squeeze, a zap when the spark arrives
for t in PULSES["heart"]:
    SFX.append(("heartbeat_single_01", t, -12, 0.8))
SFX += [(G("zap"), EV["tiny13"], -16, 0.5), (G("zap"), EV["exact"], -15, 0.5), (G("zap"), EV["once15"] - 0.4, -18, 0.5)]
# blocked: the spark fizzles against the wall
SFX += [(G("zap"), EV["wasnt"] + 0.15, -14, 0.5), ("cartoon_sad_horn_01", EV["through"], -20, 1.4)]

# story beats
SFX += [
    ("drawer_open" if False else "door_creak_open_01", EV["grabbed"] - 0.1, -26, 0.6),
    ("sting_wrong_buzz_01", EV["wrong"] + 0.05, -22, 0.8),
    ("sparkle_02", EV["heart1"], -20, 1.2),
    (G("sizzle"), start["s07_build"] + 0.1, -18, 1.2),
    ("click_02", EV["reached"] + 0.3, -18, 0.3),
    ("cartoon_spring_01", EV["hundred"], -19, 0.6),
    (G("sizzle"), EV["soldered"], -13, 1.2),
    (G("click"), EV["on5"] - 0.02, -9, 0.3),
    ("gasp_cartoon_01", EV["froze"], -16, 1.0),
    ("sting_mystery_bells_01", EV["once9"], -22, 1.6),
    ("gasp_man_01", EV["stopped"], -18, 1.0), ("gasp_woman_01", EV["stopped"] + 0.15, -19, 1.0),
    ("cartoon_success_01", EV["tv"], -22, 1.0),
    (G("click"), EV["plugged"] + 0.1, -12, 0.3),
    (G("thunk"), EV["out"] - 0.05, -10, 1.3), ("crowd_gasp_01", EV["out"] + 0.25, -20, 1.2),
    ("sting_achievement_bell_01", EV["needs"], -20, 1.5),
    ("cheer_man_01", start["s37_once"] + 0.2, -19, 1.2), ("cartoon_surprise_01", start["s37_once"] + 0.3, -20, 0.8),
    ("cartoon_dazzle_01", EV["shrank"], -18, 1.2),
    ("sparkle_01", EV["palm"], -18, 1.2),
    ("door_close_01", EV["quit"] + 0.2, -22, 0.6),
    (G("sizzle"), EV["built"], -22, 1.0),
    ("rooster_01", start["s42_house"] + 0.2, -26, 1.2),
    ("applause_small_01", EV["steady"] + 0.1, -18, 1.5), ("cheer_crowd_02", EV["again"], -22, 1.4),
    ("laugh_children_01", EV["millions"] + 0.3, -26, 1.2),
    ("sting_win_drums_01", EV["box21"] - 0.2, -18, 1.6),
    ("tape_rewind_02", EV["when"] - 0.2, -22, 1.0),
]
SFX = [s for s in SFX if s[0] != "drawer_open"]
