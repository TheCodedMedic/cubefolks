"""Short 3 "The Chocolate Bar That Invented the Microwave" (Beanfolk 3D): the sound cue sheet. Every time comes from
cue_times_bean.json, which video/scripts/dump_short03_microwave.mjs exports from the picture's own timing
(video/src/short03_microwave/timing.ts and pops.ts, all anchored to measured words).
Effects:  python3 -I episodes/03_microwave/sfx_bean.py
Mix:      python3 -I pipeline/mix.py episodes/03_microwave/cues_bean.py episodes/03_microwave/mix_bean.wav
Level:    python3 -I pipeline/music_level.py episodes/03_microwave/cues_bean.py -15
"""
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
J = json.load(open(HERE / "cue_times_bean.json"))
CUTS, EV, POPS, END = J["CUTS"], J["EV"], J["POPS"], J["END"]
BURST_T0, BOOM_T0 = J["BURST_T0"], J["BOOM_T0"]
G = lambda n: str(HERE / "sfx_bean" / f"{n}.wav")   # our synthesised effects
S = lambda n: str(ROOT / "sfx" / f"{n}.mp3")        # the credited CC0 one-offs in sfx/
start = {c[0]: c[1] for c in CUTS}
nxt = {CUTS[i][0]: (CUTS[i + 1][1] if i + 1 < len(CUTS) else END) for i in range(len(CUTS))}

VOICE = str(HERE / "master_voiceover.wav")
LENGTH = END
MUSIC_DUCK_DB = 6
SFX_MAX = 4.0

def place(sid):
    if sid in ("s02_invented", "s41_war", "s42_kitchen", "s43_taller", "s44_piano", "s48_notbad"): return "show"
    if sid in ("s07_war", "s26_meanwhile"): return "yard"
    if sid in ("s27_factory", "s28_thousands", "s29_useless"): return "factory"
    if sid in ("s30_yousee", "s31_firing", "s32_invisible", "s33_molecule", "s34_inside", "s35_spin", "s36_billions", "s37_jiggle", "s38_heat"): return "reveal"
    if sid == "s45_cost": return "k50"
    if sid in ("s46_today", "s47_every"): return "know"
    return "lab"

spans = {}
for sid, t0, _ in CUTS:
    k, t1 = place(sid), nxt[sid]
    L = spans.setdefault(k, [])
    if L and abs(L[-1][1] - t0) < 1e-6: L[-1][1] = t1
    else: L.append([t0, t1])

BEDS = []
fi = lambda a: 0.0 if a == 0 else 0.1
for a, b in spans.get("lab", []):
    BEDS += [("amb_room_tone_03", a, b, -30, fi(a), 0.12), (G("hum"), a, b, -27, fi(a), 0.12), ("clock_tick_old_01", a, b, -35, fi(a), 0.12)]
for a, b in spans.get("show", []):
    BEDS += [("amb_room_tone_01", a, b, -31, 0.1, 0.12), ("crowd_murmur_01", a, b, -36, 0.1, 0.12)]
for a, b in spans.get("yard", []):
    BEDS += [("amb_wind_soft_01", a, b, -30, 0.1, 0.12), ("crowd_murmur_02", a, b, -30, 0.1, 0.12)]
for a, b in spans.get("factory", []):
    BEDS += [("amb_school_gym_02", a, b, -32, 0.1, 0.12), (G("hum"), a, b, -29, 0.1, 0.12)]
for a, b in spans.get("reveal", []):   # quieter in the reveal: a low drone only
    BEDS += [("drone_tension_02", a, b, -33, 0.2, 0.2)]
for a, b in spans.get("k50", []):
    BEDS += [("amb_room_tone_02", a, b, -31, 0.1, 0.1), ("clock_tick_02", a, b, -34, 0.1, 0.1)]
for a, b in spans.get("know", []):
    BEDS += [("amb_room_tone_02", a, b, -31, 0.1, 0.1), (G("turntable"), start["s46_today"] + 0.5, EV["one20"], -24, 0.1, 0.05)]

# music: the owner's own track "Tiptoe Across the Floorboards" (sfx/music, credits.json), 15 dB under the voice (measured)
MUSIC = str(ROOT / "sfx" / "music" / "tiptoe_across_the_floorboards.mp3")
MUSIC_REL = -6.3
BEDS += [(MUSIC, 0.0, END, MUSIC_REL, 0.0, 0.4, "music")]

SFX = []
wh = ["whoosh_short_01", "whoosh_short_02", "whoosh_short_03"]
for i, (sid, t0, enter) in enumerate(CUTS):
    if enter.startswith("whip"):
        SFX.append((wh[i % 3], t0 - 0.14, -15, 0.5))
    elif enter == "flash" and sid != "s30_yousee":
        SFX += [("whoosh_medium_03", t0 - 0.25, -14, 1.2), ("sparkle_03", t0 - 0.02, -22, 1.2)]
    elif enter == "cut" and t0 > 0:
        SFX.append(("impact_hit_03", t0 - 0.01, -20, 0.4))
# "You see": a riser in, a record scratch on the cut
SFX += [("riser_03", start["s30_yousee"] - 2.0, -19, 2.0), (S("record_scratch"), start["s30_yousee"] - 0.12, -10, 0.9)]

pops = ["pop_01", "pop_05", "pop_06"]
for i, p in enumerate(POPS):
    t = p["t0"]
    if p["kind"] == "stamp":
        SFX += [(S("stamp"), t - 0.03, -6, 1.0), ("impact_hit_03", t - 0.02, -13, 0.6)]
    elif p.get("icon") == "check":
        SFX += [("ding_02", t, -13, 1.5)]
    elif p.get("icon") == "cross":
        SFX += [("impact_hit_01", t, -14, 0.5), ("glitch_02", t, -22, 0.6)]
    else:
        SFX.append((pops[i % 3], t, -15, 0.4))

# the story beats
SFX += [
    ("sparkle_02", EV["invented"] + 0.1, -18, 1.2),                       # the oven reveal
    ("splat_soft_01", EV["melted"] + 0.1, -18, 0.8),                      # chocolate going soft
    ("cartoon_boing_01", EV["percy"] - 0.05, -20, 0.6),
    ("sting_wrong_01", EV["finished"] + 0.05, -20, 1.0),                  # no diploma
    (G("zap"), EV["built"], -22, 0.9),                                    # sparks at the bench
    ("sting_achievement_bell_01", EV["brilliant"], -17, 1.6), ("applause_small_01", EV["brilliant"] + 0.1, -20, 1.4),
    (G("hum"), start["s10_humming"], -16, nxt["s10_humming"] - start["s10_humming"]),   # the tube up close
    ("splat_soft_02", EV["sticky"], -15, 0.7), ("gasp_cartoon_01", EV["sticky"] + 0.15, -17, 1.0),
    ("splat_soft_03", EV["goo"] - 0.05, -13, 0.8), ("gasp_man_01", EV["turned5"], -17, 1.0),
    ("cartoon_surprise_01", EV["hot7"] + 0.1, -20, 1.0),
    ("footsteps_tile_02", start["s16_sent"] + 0.25, -20, 1.0), ("door_open_01", EV["someone"] + 0.25, -20, 0.8),
    ("footsteps_tile_01", start["s17_bag"], -21, 0.8),
    (G("popcorn"), BURST_T0 - 0.02, -10, 1.8), (G("popcorn"), BURST_T0 + 0.6, -14, 1.6),
    ("laugh_crowd_02", EV["all9"] + 0.1, -18, 1.6), ("laugh_man_01", start["s20_lab"] + 0.2, -19, 1.0),
    (G("wobble"), EV["wobbled"], -13, 1.2), ("sting_drumroll_suspense_01", EV["wobbled"] + 0.1, -22, 1.0),
    (G("splat"), BOOM_T0, -8, 0.6), ("cartoon_splash_01", BOOM_T0 + 0.02, -15, 0.8),
    ("laugh_crowd_applause_01", EV["coworkers"], -18, 1.6), ("cartoon_sad_horn_01", EV["face"] + 0.15, -18, 1.2),
    ("cheer_crowd_02", EV["ending"] - 0.2, -16, 1.6), ("newspaper_fall_01", EV["meanwhile"] + 0.3, -22, 0.8),
    (G("clank"), start["s27_factory"] + 0.05, -15, 1.0), (G("clank"), EV["thousands"] + 0.1, -17, 1.0),
    ("cartoon_sad_horn_01", EV["useless"] + 0.25, -15, 1.4),
    (G("zap"), EV["firing"], -12, 1.0), (G("zap"), EV["firing"] + 0.45, -15, 1.0),
    ("cartoon_dazzle_01", EV["invisible"], -20, 1.2),
    ("pop_long_01", EV["tiny"], -16, 0.8), ("cartoon_giggle_01", EV["molecules"], -20, 1.0),
    ("tape_rewind_02", EV["spin"], -18, 1.0), ("tape_rewind_01", EV["billions"], -19, 1.2),
    ("cartoon_bubbles_01", EV["jiggling"], -18, 1.2), ("riser_02", EV["heat"] - 0.3, -22, 1.2),
    (G("popcorn"), EV["food15"] - 0.02, -12, 0.6), ("pop_silly_01", EV["food15"], -14, 0.6),
    ("sparkle_01", EV["hot16"], -18, 1.0), ("cartoon_whistle_01", EV["didnt"] - 0.1, -22, 1.0),
    ("sparkle_03", start["s40_room"] + 0.4, -18, 1.0),                    # Gizmo peeks in
    (G("clank"), start["s41_war"] + 0.05, -18, 0.8),
    ("cartoon_dazzle_01", start["s42_kitchen"], -15, 1.4), ("cheer_man_01", EV["kitchen17"] + 0.1, -20, 1.0),
    ("cartoon_fall_whistle_01", EV["taller"], -22, 1.0), ("body_thud_02", EV["piano"] - 0.4, -16, 0.6),
    ("cartoon_fail_piano_01", EV["piano"] + 0.05, -16, 1.6),
    ("coins_jackpot_01", EV["five"] + 0.05, -15, 1.6), ("gasp_woman_02", EV["five"] + 0.15, -16, 1.0), ("gasp_man_01", EV["five"] + 0.25, -18, 1.0),
    ("click_02", start["s46_today"] + 0.45, -16, 0.3), ("click_01", start["s46_today"] + 0.6, -18, 0.3),
    (G("popcorn"), start["s47_every"] + 0.1, -18, 0.9), (G("ding"), EV["one20"], -9, 1.6), ("door_open_01", EV["one20"] + 0.05, -22, 0.6),
    ("laugh_kid_01", EV["one20"] + 0.2, -20, 1.0),
    ("sting_joke_drum_01", EV["snack21"] + 0.05, -15, 1.6),
    ("riser_04", EV["and22"], -24, 1.2),
]
