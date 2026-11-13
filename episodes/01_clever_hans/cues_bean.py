"""Short 1 "Clever Hans" (Beanfolk 3D): the sound cue sheet. Every time comes from cue_times_bean.json, which
video/scripts/dump_short01_bean.mjs exports from the picture's own timing (video/src/short01_bean/timing.ts and pops.ts,
all anchored to measured words), so whooshes, pops and hoof taps land on the same frames as the picture.
Mix: python3 -I pipeline/mix.py episodes/01_clever_hans/cues_bean.py episodes/01_clever_hans/mix_bean.wav
"""
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
J = json.load(open(HERE / "cue_times_bean.json"))
CUTS, TAPS, EV, POPS, END = J["CUTS"], J["TAPS"], J["EV"], J["POPS"], J["END"]
G = lambda n: str(HERE / "sfx_bean" / f"{n}.wav")   # our synthesised effects
S = lambda n: str(ROOT / "sfx" / f"{n}.mp3")        # the credited CC0 one-offs in sfx/
start = {c[0]: c[1] for c in CUTS}
nxt = {CUTS[i][0]: (CUTS[i + 1][1] if i + 1 < len(CUTS) else END) for i in range(len(CUTS))}

VOICE = str(HERE / "master_voiceover.wav")
LENGTH = END
MUSIC_DUCK_DB = 6
SFX_MAX = 4.0

# ---- places: where the picture is, so each bed plays only there ----
ROOM = {"s14_eyeroll", "s19_nothing"}
STUDY = {"s25_oskar", "s26_noticed"}
VIOLET = (start["s32_yousee"], start["s45_still"])
spans = {"court": [], "room": [], "study": []}
for i, (sid, t0, _) in enumerate(CUTS):
    k = "room" if sid in ROOM else "study" if sid in STUDY else "court"
    t1 = nxt[sid]
    if spans[k] and abs(spans[k][-1][1] - t0) < 1e-6:
        spans[k][-1][1] = t1
    else:
        spans[k].append([t0, t1])

BEDS = []
for a, b in spans["court"]:
    vio = a >= VIOLET[0] - 0.01 and b <= VIOLET[1] + 0.01
    BEDS.append(("amb_city_street_03", a, b, -30 if not vio else -36, 0.15 if a > 0 else 0.0, 0.15))
    BEDS.append(("crowd_murmur_01", a, b, -27 if not vio else -33, 0.15 if a > 0 else 0.0, 0.15))
    BEDS.append((S("street_birds"), a, b, -36 if not vio else -48, 0.15 if a > 0 else 0.0, 0.15))
for a, b in spans["room"]:
    BEDS.append(("amb_room_tone_03", a, b, -32, 0.1, 0.1))
    BEDS.append(("clock_tick_02", a, b, -34, 0.1, 0.1))
for a, b in spans["study"]:
    BEDS.append(("amb_room_tone_01", a, b, -30, 0.1, 0.1))
    BEDS.append(("clock_tick_01", a, b, -30, 0.1, 0.1))

# music: the owner's own track "Tiptoe Across the Floorboards" (sfx/music, credits.json), subtle under the voice
MUSIC = str(ROOT / "sfx" / "music" / "tiptoe_across_the_floorboards.mp3")
BEDS += [
    (MUSIC, 0.0, END, -6.2, 0.0, 0.4, "music"),
    ("heartbeat_03", EV["tensed"] - 0.8, TAPS["reveal"][4], -30, 0.3, 0.1, "music"),
]

SFX = []
# a whoosh on every whip; flashes get a bigger swoosh
wh = ["whoosh_short_01", "whoosh_short_02", "whoosh_short_03"]
for i, (sid, t0, enter) in enumerate(CUTS):
    if enter.startswith("whip"):
        SFX.append((wh[i % 3], t0 - 0.14, -15, 0.5))
    elif enter == "flash" and sid != "s32_yousee":
        SFX.append(("whoosh_medium_03", t0 - 0.25, -14, 1.2))
        SFX.append(("sparkle_03", t0 - 0.02, -22, 1.2))
# "You see": riser in, record scratch on the cut
SFX += [("riser_03", start["s32_yousee"] - 2.0, -19, 2.0), (S("record_scratch"), start["s32_yousee"] - 0.12, -10, 0.9)]

# a pop on every pop-in (stamps thud, ticks ding, crosses buzz)
pops = ["pop_01", "pop_05", "pop_06"]
for i, p in enumerate(POPS):
    t = p["t0"]
    if p["kind"] == "stamp":
        SFX += [(S("stamp"), t - 0.03, -6, 1.0), ("impact_hit_03", t - 0.02, -13, 0.6)]
    elif p.get("icon") == "check":
        SFX += [("ding_02", t, -13, 1.5)]
    elif p.get("icon") == "cross":
        SFX += [("impact_hit_01", t, -14, 0.5), ("glitch_02", t, -22, 0.6)]
    elif p.get("icon") == "heart":
        SFX += [("sparkle_01", t, -16, 1.2), (pops[i % 3], t, -16, 0.4)]
    else:
        SFX.append((pops[i % 3], t, -15, 0.4))

# hoof taps: every tap of every run (louder in the reveal, the final one with a low hit)
for run, ts in TAPS.items():
    for k, t in enumerate(ts):
        lvl = -8 if run == "reveal" else -11
        SFX.append((G(f"hoof{k % 3 + 1}"), t - 0.01, lvl, 0.25))
SFX += [("impact_low_04", TAPS["reveal"][4] - 0.01, -12, 1.0)]

# the crowd, the scientists, the props
SFX += [
    ("crowd_gasp_02", TAPS["five"][-1] + 0.15, -17, 1.6),
    (G("snort"), EV["snort"], -9, 0.6),
    ("crowd_gasp_03", EV["right"] + 0.05, -15, 2.5),
    ("footsteps_tile_03", start["s15_march"], -22, nxt["s15_march"] - start["s15_march"]),
    ("crowd_gasp_01", EV["wrong"] + 0.05, -19, 1.8),
    ("phone_catch_04", EV["blinders"], -15, 0.3),
    ("balloon_pop_01", EV["vanished"], -12, 0.6),
    (G("drop"), EV["relaxed"], -9, 0.7),
    (G("lift"), EV["lifted"], -15, 0.3),
    (G("lift"), EV["himself"], -15, 0.3),
    ("phone_catch_06", EV["doing"], -14, 0.5),
    ("sparkle_03", EV["clever"], -18, 1.4),
    ("sparkle_02", EV["genius"], -14, 1.6),
    (S("paper"), EV["whole"] - 0.05, -14, 1.0),
    (S("paper"), EV["world"] - 0.05, -14, 1.0),
    ("crowd_gasp_03", EV["whole"] + 0.2, -20, 2.0),
]

# real reactions and animals (Mixkit library, 2026-11-09): laughs, cheers, applause, neighs, stings
SFX += [
    ("horse_neigh_01", EV["hansName"] - 0.1, -17, 1.6),            # "His name was Hans" - he introduces himself
    ("laugh_children_01", EV["school"] + 0.1, -22, 1.6),            # the schoolchildren
    ("applause_light_01", TAPS["five"][-1] + 0.35, -20, 2.2),       # five taps: the courtyard claps
    ("horse_snort_01", EV["snort"] + 0.02, -15, 0.8),               # a real snort under the cartoon one
    ("laugh_crowd_01", EV["snort"] + 0.35, -19, 2.0),               # the crowd laughs at the proud snort
    ("laugh_man_02", EV["rolled"], -18, 1.2),                       # scientists roll their eyes, a nasal scoff
    ("sting_mystery_drum_01", EV["nothing"] - 0.05, -18, 1.8),      # "Nothing."
    ("cheer_crowd_03", EV["right"] + 0.25, -17, 2.4),               # Hans still got them right
    ("sting_wrong_buzz_01", EV["wrong"], -17, 0.9),                 # Hans got it wrong
    ("cartoon_sad_horn_01", EV["vanished"] + 0.15, -19, 1.0),       # his genius vanished
    ("horse_snore_01", EV["stopped"] + 0.1, -18, 1.0),              # Hans stops, a satisfied blow
    ("sting_achievement_bell_01", EV["clever"], -20, 1.6),          # the Clever Hans effect
    ("cheer_crowd_04", EV["genius"] + 0.1, -17, 1.8),               # a genius after all
    ("sting_joke_drum_01", EV["math"] + 0.05, -16, 1.6),            # "...just not at math" ba-dum-tss
    ("laugh_crowd_applause_01", EV["people"] + 0.1, -21, 1.8),      # a genius at reading people
    ("camera_flash_crowd_01", EV["whole"] - 0.1, -22, 2.5),         # the whole world believed: the press
    ("applause_ovation_01", EV["world"] + 0.1, -23, 2.0),
]
