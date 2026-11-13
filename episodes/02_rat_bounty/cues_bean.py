"""Short 2 "The City That Paid for Rat Tails" (Beanfolk 3D): the sound cue sheet. Every time comes from cue_times_bean.json,
which video/scripts/dump_short02_bean.mjs exports from the picture's own timing (video/src/short02_bean/timing.ts and pops.ts,
all anchored to measured words), so whooshes, pops, squeaks and coins land on the same frames as the picture.
Effects:  python3 -I episodes/02_rat_bounty/sfx_bean.py
Mix:      python3 -I pipeline/mix.py episodes/02_rat_bounty/cues_bean.py episodes/02_rat_bounty/mix_bean.wav
Level:    python3 -I pipeline/music_level.py episodes/02_rat_bounty/cues_bean.py -15
"""
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
J = json.load(open(HERE / "cue_times_bean.json"))
CUTS, DROPS, EV, POPS, END = J["CUTS"], J["DROPS"], J["EV"], J["POPS"], J["END"]
G = lambda n: str(HERE / "sfx_bean" / f"{n}.wav")   # our synthesised effects
S = lambda n: str(ROOT / "sfx" / f"{n}.mp3")        # the credited CC0 one-offs in sfx/
start = {c[0]: c[1] for c in CUTS}
nxt = {CUTS[i][0]: (CUTS[i + 1][1] if i + 1 < len(CUTS) else END) for i in range(len(CUTS))}

VOICE = str(HERE / "master_voiceover.wav")
LENGTH = END
MUSIC_DUCK_DB = 6
SFX_MAX = 4.0

# ---- places: where the picture is, so each bed plays only there ----
def place(sid):
    if sid in ("s07_highway",): return "sewer"
    if sid in ("s08_toilet", "s09_lady"): return "bath"
    if sid in ("s10_officials", "s11_offer", "s14_cent", "s15_poured", "s16_thousands", "s18_twenty", "s19_cheer", "s20_count",
               "s21_crates", "s48_paid"): return "office"
    if sid in ("s35_yousee", "s36_dead", "s37_tails", "s38_rat", "s39_make", "s40_catch", "s41_snip", "s42_go", "s43_freed",
               "s44_babies", "s45_grew", "s45b_spin"): return "reveal"
    if sid in ("s29_meanwhile", "s30_inspector", "s32_full", "s34_pets", "s46_stopped", "s47_farmed", "s54_moreproof"): return "barn"
    if sid in ("s50_econ", "s51_perverse", "s52_proof", "s53_result"): return "class"
    if sid in ("s26_running", "s27_notail"): return "dusk"
    return "street"

spans = {}
for sid, t0, _ in CUTS:
    k, t1 = place(sid), nxt[sid]
    L = spans.setdefault(k, [])
    if L and abs(L[-1][1] - t0) < 1e-6: L[-1][1] = t1
    else: L.append([t0, t1])

BEDS = []
fi = lambda a: 0.0 if a == 0 else 0.12
for a, b in spans.get("street", []):
    BEDS += [("amb_city_street_03", a, b, -29, fi(a), 0.15), ("crowd_murmur_01", a, b, -30, fi(a), 0.15), (S("street_birds"), a, b, -36, fi(a), 0.15)]
for a, b in spans.get("dusk", []):
    BEDS += [("amb_city_evening_01", a, b, -27, 0.12, 0.15), (G("scurry"), a, b, -24, 0.1, 0.1)]
for a, b in spans.get("sewer", []):
    BEDS += [("amb_wind_soft_02", a, b, -28, 0.1, 0.1), (G("scurry"), a, b, -20, 0.1, 0.1)]
for a, b in spans.get("bath", []):
    BEDS += [("amb_room_tone_01", a, b, -30, 0.1, 0.1)]
for a, b in spans.get("office", []):
    BEDS += [("amb_room_tone_03", a, b, -31, 0.1, 0.1), ("clock_tick_old_01", a, b, -33, 0.1, 0.1), ("crowd_murmur_02", a, b, -34, 0.1, 0.1)]
for a, b in spans.get("barn", []):
    BEDS += [("amb_barn_01", a, b, -28, 0.12, 0.15), ("chickens_01", a, b, -34, 0.12, 0.15)]
for a, b in spans.get("class", []):
    BEDS += [("amb_room_tone_01", a, b, -30, 0.1, 0.1), ("clock_tick_02", a, b, -35, 0.1, 0.1)]
for a, b in spans.get("reveal", []):   # quieter in the reveal: a low tension drone only
    BEDS += [("drone_tension_02", a, b, -32, 0.2, 0.2)]

# music: the owner's own track "Tiptoe Across the Floorboards" (sfx/music, credits.json), 15 dB under the voice (measured)
MUSIC = str(ROOT / "sfx" / "music" / "tiptoe_across_the_floorboards.mp3")
MUSIC_REL = -6.2
BEDS += [(MUSIC, 0.0, END, MUSIC_REL, 0.0, 0.4, "music")]

SFX = []
# a whoosh on every whip; flashes get a bigger swoosh and a sparkle
wh = ["whoosh_short_01", "whoosh_short_02", "whoosh_short_03"]
for i, (sid, t0, enter) in enumerate(CUTS):
    if enter.startswith("whip"):
        SFX.append((wh[i % 3], t0 - 0.14, -15, 0.5))
    elif enter == "flash" and sid != "s35_yousee":
        SFX += [("whoosh_medium_03", t0 - 0.25, -14, 1.2), ("sparkle_03", t0 - 0.02, -22, 1.2)]
    elif enter == "cut" and t0 > 0:
        SFX.append(("impact_hit_03", t0 - 0.01, -20, 0.4))
# "You see": a riser in, a record scratch on the cut
SFX += [("riser_03", start["s35_yousee"] - 2.0, -19, 2.0), (S("record_scratch"), start["s35_yousee"] - 0.12, -10, 0.9)]

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

# rats: a squeak whenever a rat appears or reacts
sq = lambda k: G(f"squeak{k % 4 + 1}")
for k, (t, lvl) in enumerate([
    (EV["kill"] + 0.05, -14), (EV["more1"] + 0.1, -17), (EV["ever"], -18), (EV["sewers"] + 0.15, -14), (EV["highway"], -18),
    (EV["popped"] + 0.05, -11), (EV["tail"], -14), (EV["streets"] + 0.1, -18), (EV["crawling"], -17), (EV["no"] + 0.05, -13),
    (EV["rats12"] + 0.1, -16), (EV["pets"], -15), (EV["need"] + 0.1, -14), (EV["make15"] + 0.1, -15), (EV["make15"] + 0.35, -17),
    (EV["caught"] + 0.05, -13), (EV["go"], -14), (EV["babies"] + 0.05, -15), (EV["babies"] + 0.3, -17), (EV["brand"], -16),
    (EV["farmed"] + 0.2, -17), (EV["got"], -15), (EV["result"] + 0.3, -17), (EV["proof2"] + 0.2, -18), (EV["how"] - 0.3, -19)]):
    SFX.append((sq(k), t, lvl, 0.6))
# scurrying under the rat swarms
for a, b in [(start["s04_more"], nxt["s04_more"]), (start["s22_streets"], nxt["s23_crawling"]), (start["s49_got"], nxt["s49_got"])]:
    SFX.append((G("scurry"), a, -18, b - a))

# the toilet rat
SFX += [(G("bubble"), start["s08_toilet"] + 0.05, -16, 0.9), ("toilet_lid_close_01", EV["popped"] - 0.12, -16, 0.5),
        ("toilet_flush_01", EV["popped"] - 0.05, -14, 1.6), ("cartoon_panic_01", EV["fanciest"], -15, 1.4), ("gasp_woman_02", EV["fanciest"] - 0.05, -16, 1.2)]
# the offer and each paid tail
SFX += [("cartoon_spring_01", EV["simple"], -18, 0.6), ("coin_drop_bag_01", EV["cent"] - 0.05, -14, 1.0), ("coin_win_01", EV["cent"], -15, 1.5)]
for k, t in enumerate(DROPS["poured"] + DROPS["thousands"]):
    SFX.append((["coins_clink_01", "coins_handling_01"][k % 2], t, -19, 0.5))
for t in DROPS["count"]:
    SFX.append(("coins_clink_01", t, -18, 0.5))
SFX += [("coins_jackpot_01", EV["twenty"] + 0.4, -13, 2.0), ("cheer_crowd_03", EV["cheered"] - 0.05, -15, 2.2), ("applause_light_01", EV["cheered"] + 0.4, -21, 1.4)]
# people notice; the gasp
SFX += [("crowd_murmur_02", EV["noticing"], -22, 1.6), ("gasp_woman_01", EV["tails11"] - 0.1, -14, 1.2), ("gasp_man_01", EV["tails11"] + 0.15, -17, 1.0)]
# the barns
SFX += [("door_creak_open_01", EV["barns"] - 0.05, -14, 1.2), ("gasp_man_01", EV["barns"] + 0.3, -17, 1.0), ("rooster_01", start["s29_meanwhile"] + 0.25, -22, 1.4)]
# the reveal: the snip, the release, the babies, the turntable
SFX += [(G("snip"), EV["snipped"] + 0.05, -9, 0.4), (G("snip"), EV["snipped"] + 0.22, -12, 0.4), ("cartoon_boing_01", EV["go"] - 0.05, -17, 0.7),
        ("cartoon_giggle_01", EV["babies"], -20, 1.0), ("sparkle_02", EV["grew"], -16, 1.4), ("tape_rewind_02", start["s45b_spin"], -20, 1.0)]
# the farm, the payoff
SFX += [("laugh_man_02", EV["altogether"] + 0.2, -19, 1.2), ("coin_drop_bag_01", EV["paid19"], -15, 1.0),
        ("cartoon_sad_horn_01", EV["got"] - 0.05, -14, 1.4), ("sting_wrong_buzz_01", EV["more19"] + 0.1, -20, 0.8),
        ("text_tick_02", EV["perverse"], -22, 0.4), ("sting_mystery_bells_01", EV["incentive"], -20, 1.6),
        ("sting_joke_drum_01", EV["proof2"] + 0.05, -15, 1.6)]
# "Hanoi quietly cancelled the bounty": tiptoes, the stamp (from the pop), a tiny embarrassed laugh
SFX += [("footsteps_tile_01", start["s55_quietly"], -26, nxt["s55_quietly"] - start["s55_quietly"]), ("cartoon_laugh_mock_01", EV["bounty"] + 0.2, -22, 1.2)]
