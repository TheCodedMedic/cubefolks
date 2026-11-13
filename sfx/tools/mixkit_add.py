"""Add Mixkit sound effects to sfx/library (48 kHz OGG q8) and record them in library_credits.json.
Run: python3 -I sfx/tools/mixkit_add.py DOWNLOAD_DIR   (DOWNLOAD_DIR: a new, empty folder outside the repo)
Downloads only audio (the full-quality WAV, or the MP3 preview if that fails); never runs anything it downloads."""
import json, os, pathlib, subprocess, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]; LIB = ROOT / "library"; DL = pathlib.Path(sys.argv[1]); DL.mkdir(parents=True, exist_ok=True)
V, A, C, S, X, W = "reaction", "animal", "cartoon", "sfx", "music_sting", "ambience"
# (name, category, mixkit id, description, max seconds or None)
M = [
 # laughs
 ("laugh_crowd_01", V, 424, "Crowd laugh", None), ("laugh_crowd_02", V, 460, "Big crowd laughing", None),
 ("laugh_crowd_03", V, 423, "Small group of men laughing", None), ("laugh_crowd_applause_01", V, 422, "Small crowd laugh and applause", None),
 ("laugh_crowd_applause_02", V, 512, "Light applause with audience laughter", None), ("laugh_crowd_applause_03", V, 516, "Medium group applause and laugh", None),
 ("laugh_man_01", V, 411, "Man, casual laugh", None), ("laugh_man_02", V, 2883, "Person nasal laugh", None),
 ("laugh_woman_01", V, 416, "Woman, cheerful laughter", None), ("laugh_woman_02", V, 410, "Woman, hilarious laughing", None),
 ("laugh_woman_03", V, 425, "Women laugh, short", None), ("laugh_woman_04", V, 426, "Woman, long laugh", None),
 ("laugh_teens_01", V, 429, "Teenagers laughing", None), ("laugh_teen_01", V, 428, "Teenager laughing", None),
 ("laugh_kid_01", V, 431, "Kid giggle laugh", None), ("laugh_child_01", V, 2263, "Child laughing happily", None),
 ("laugh_child_02", V, 2265, "Happy child laughing", None), ("laugh_children_01", V, 427, "Children laughing indoors", None),
 ("laugh_santa_01", V, 418, "Ho ho ho laugh", None),
 # cheers, applause, boos
 ("cheer_crowd_01", V, 459, "Male crowd cheering, short", None), ("cheer_crowd_02", V, 462, "Huge crowd cheering victory", None),
 ("cheer_crowd_03", V, 518, "Small group cheer and applause", None), ("cheer_crowd_04", V, 531, "Party crowd cheer", None),
 ("cheer_crowd_whistle_01", V, 610, "Cheering crowd with loud whistle", None), ("cheer_man_01", V, 2010, "Man cheers", None),
 ("cheer_man_02", V, 2011, "Man cheers victory", None), ("cheer_and_boo_01", V, 3037, "Young crowd cheers and boos", None),
 ("boo_crowd_01", V, 463, "Crowd disappointment, long boo", 12),
 ("applause_light_01", V, 354, "Audience light applause", None), ("applause_medium_01", V, 485, "Medium crowd applause", None),
 ("applause_ovation_01", V, 437, "Small crowd ovation", None), ("applause_classroom_01", V, 500, "Classroom spontaneous applause", None),
 ("applause_small_01", V, 505, "Small group moderate applause", None), ("clap_slow_01", V, 479, "Slow clapping", None),
 ("clap_one_man_01", V, 482, "One man clapping", None),
 # gasps, crowd walla
 ("gasp_woman_01", V, 964, "Woman, astonished gasp", None), ("gasp_woman_02", V, 965, "Woman, shocked gasp", None),
 ("gasp_woman_03", V, 968, "Woman, surprised gasp", None), ("gasp_man_01", V, 966, "Man, astonished gasp", None),
 ("gasp_cartoon_01", V, 967, "Cartoon surprise gasp", None), ("crowd_whisper_01", V, 456, "Crowd whispering", 20),
 ("crowd_angry_01", V, 458, "Angry crowd", 20), ("crowd_reporters_01", V, 432, "Reporters and camera flashes", None),
 ("crowd_chant_01", V, 441, "Crowd short chanting", None), ("scream_man_fall_01", V, 391, "Man screams while falling", None),
 ("scream_crowd_01", V, 349, "People screaming on a fair ride", None),
 # animals
 ("horse_neigh_01", A, 1762, "Horse neigh", None), ("horse_neigh_02", A, 76, "Horse neigh, intense", None),
 ("horse_neigh_scared_01", A, 85, "Scared horse neighing", None), ("horse_scared_01", A, 30, "Scared stallion", None),
 ("horse_snort_01", A, 80, "Big horse snort", None), ("horse_snore_01", A, 75, "Horse snore / blow", None),
 ("horse_trot_street_01", A, 81, "Horse trot on a paved street", None), ("horse_trot_concrete_01", A, 82, "Horse trot on concrete", None),
 ("horse_walk_concrete_01", A, 84, "Horse walking fast on concrete", None), ("horse_walk_dirt_01", A, 78, "Horse walking on dirt", None),
 ("horse_gallop_dirt_01", A, 77, "Horse gallop on dirt", None), ("horse_gallop_concrete_01", A, 83, "Horse gallop on concrete", None),
 ("dog_bark_01", A, 1, "Dog barks twice", None), ("dog_bark_happy_01", A, 741, "Happy puppy barks", None),
 ("cat_meow_01", A, 93, "Sweet kitty meow", None), ("rooster_01", A, 2470, "Rooster crowing", None),
 ("cow_moo_01", A, 1747, "Cow moo", None), ("donkey_01", A, 1770, "Donkey bray", None),
 # cartoon
 ("cartoon_laugh_01", C, 343, "Cartoon voice laugh", None), ("cartoon_laugh_02", C, 2874, "Funny cartoon laugh", None),
 ("cartoon_laugh_mock_01", C, 4, "Mocking cartoon laugh", None), ("cartoon_giggle_01", C, 743, "Cartoon giggle", None),
 ("cartoon_spring_01", C, 736, "Cartoon spring boing", None), ("cartoon_boing_01", C, 2894, "Boing hit", None),
 ("cartoon_fall_whistle_01", C, 395, "Cartoon falling whistle", None), ("cartoon_slide_01", C, 2888, "Funny slide", None),
 ("cartoon_dazzle_01", C, 746, "Cartoon bonk with tweeting birds", None), ("cartoon_panic_01", C, 1010, "Cartoon panic squeak", None),
 ("cartoon_punch_01", C, 2149, "Cartoon punch", None), ("cartoon_splash_01", C, 2884, "Funny cartoon splash", None),
 ("cartoon_clown_horn_01", C, 2886, "Clown horn", None), ("cartoon_sad_horn_01", C, 527, "Sad party horn", None),
 ("cartoon_party_horn_01", C, 530, "Happy party horn", None), ("cartoon_fail_piano_01", C, 473, "Cartoon failure piano", None),
 ("cartoon_suspense_01", C, 674, "Cartoon suspense sting", None), ("cartoon_suspense_02", C, 742, "Cartoon clarinet suspense", None),
 ("cartoon_surprise_01", C, 676, "Cartoon surprise suspense", None), ("cartoon_whistle_01", C, 738, "Cartoon whistling", None),
 ("cartoon_success_01", C, 344, "Fairy success voice", None), ("cartoon_bubbles_01", C, 729, "Cartoon bubbles pop", None),
 ("pop_silly_01", C, 2359, "Silly pop cluster", None), ("pop_long_01", C, 2358, "Long pop", None),
 # stings: game show, drums, bells
 ("sting_wrong_buzz_01", X, 950, "Game show wrong-answer buzz", None), ("sting_wrong_01", X, 3219, "Wrong answer jingle", None),
 ("sting_drumroll_01", X, 566, "Drum roll", None), ("sting_drumroll_suspense_01", X, 577, "Tension drum roll", None),
 ("sting_joke_drum_01", X, 578, "Joke drums (ba-dum-tss)", None), ("sting_fail_drum_01", X, 568, "Fail drum and xylophone", None),
 ("sting_win_drums_01", X, 555, "Achievement win drums", None), ("sting_mystery_drum_01", X, 546, "Mystery trailer drum hit", None),
 ("sting_achievement_bell_01", X, 600, "Achievement bell", None), ("sting_mystery_bells_01", X, 581, "Bells of mystery", None),
 ("sting_glass_suspense_01", X, 677, "Glass hit suspense", None),
 # realistic
 ("gunshot_01", S, 1662, "Gun shot", None), ("gunshot_echo_01", S, 1700, "Gunshot with long echo", None),
 ("gun_click_01", S, 1660, "Handgun click", None), ("gun_revolver_spin_01", S, 1674, "Revolver chamber spin", None),
 ("shotgun_pump_01", S, 1659, "Shotgun pump", None), ("explosion_distant_01", S, 1690, "Distant explosion", None),
 ("thunder_strike_01", S, 2405, "Thunder strike", None), ("punch_01", S, 2143, "Hard quick punch", None),
 ("punch_whoosh_01", S, 2049, "Punch with whistle", None), ("glass_break_01", S, 759, "Glass break", None),
 ("door_creak_open_01", S, 195, "Creaky door opens", None), ("door_creak_close_01", S, 189, "Creaky wooden door closes", None),
 ("door_bell_shop_01", S, 936, "Wooden shop door bell", None), ("bell_service_01", S, 931, "Service bell", None),
 ("bell_church_01", S, 619, "Church bell hit", None), ("bell_school_01", S, 580, "School bell", None),
 ("clock_tick_fast_01", S, 1063, "Fast wall clock ticking", None), ("clock_tick_old_01", S, 1070, "Big old clock ticking", 20),
 ("heartbeat_fast_01", S, 493, "Fast heartbeat", None), ("heartbeat_single_01", S, 490, "Single heartbeat", None),
 ("newspaper_fall_01", S, 386, "Newspaper drops on the floor", None), ("book_pages_01", S, 1101, "Book page turn", None),
 ("glasses_clink_01", S, 2836, "Glasses clinking", None), ("camera_flash_crowd_01", S, 432, "Camera flashes", 6),
 # ambience
 ("amb_fair_laughter_01", W, 368, "Fair crowd with laughter", None), ("amb_kids_playground_01", W, 2266, "Kids playing in a playground", None),
 ("amb_crowd_talking_01", W, 364, "Big crowd talking loop", None), ("amb_tourists_01", W, 435, "Tourists at a sightseeing spot", None),
 # Short 2 (rat bounty): money, bathrooms, farms
 ("coins_clink_01", S, 1993, "Clinking coins", None), ("coins_handling_01", S, 1939, "Coins handling", None),
 ("coin_drop_bag_01", S, 1989, "Money bag drop", None), ("coins_jackpot_01", S, 1991, "Jackpot alarm and coins", None),
 ("coin_win_01", C, 1992, "Coin win notification", None), ("toilet_flush_01", S, 1889, "Bathroom toilet flush", None),
 ("toilet_flush_hard_01", S, 1872, "Hard toilet flush", None), ("toilet_lid_close_01", S, 1887, "Toilet heavy lid close", None),
 ("squeaky_toy_01", C, 2813, "Funny squeaky toy hits", None), ("amb_barn_01", W, 1755, "Barn with animals and birds", 40),
 ("amb_pig_sty_01", W, 1753, "Pig sty ambience", 40), ("chickens_01", A, 1772, "Chickens clucking", None),
]
cred_f = ROOT / "library_credits.json"; credits = json.load(open(cred_f)); have = {c["file"] for c in credits}
ok = fail = 0
for name, cat, i, desc, maxd in M:
    out = LIB / f"{name}.ogg"; rel = f"library/{name}.ogg"
    if out.exists() and rel in have: continue
    src = None
    for url in (f"https://assets.mixkit.co/active_storage/sfx/{i}/{i}.wav", f"https://assets.mixkit.co/active_storage/sfx/{i}/{i}-preview.mp3"):
        f = DL / url.rsplit("/", 1)[1]
        r = subprocess.run(["curl", "-sSL", "--fail", "--max-time", "90", "-A", "Mozilla/5.0", "-o", str(f), url], capture_output=True)
        if r.returncode == 0 and f.stat().st_size > 1000: src = (url, f); break
    if not src: print("FAILED", name, i); fail += 1; continue
    args = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(src[1])] + (["-t", str(maxd), "-af", f"afade=t=out:st={maxd - 1}:d=1"] if maxd else []) + ["-ac", "2", "-ar", "48000", "-c:a", "libvorbis", "-q:a", "8", str(out)]
    subprocess.run(args, check=True)
    credits = [c for c in credits if c["file"] != rel] + [{"file": rel, "category": cat, "description": desc,
        "source_page": f"https://mixkit.co/free-sound-effects/", "download_url": src[0], "author": "Mixkit (Envato)",
        "license": "Mixkit Sound Effects Free License", "license_url": "https://mixkit.co/license/#sfxFree", "attribution_required": False,
        "attribution_text": "", "notes": f"Mixkit id {i}; no redistribution as standalone files"}]
    ok += 1
json.dump(credits, open(cred_f, "w"), indent=1)
print(ok, "added,", fail, "failed,", len(M), "in manifest")
