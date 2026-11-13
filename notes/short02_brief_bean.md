You are building **Beanfolk Short 2, "The City That Paid for Rat Tails"**, from finished audio to a finished, uploaded video, in the
**Beanfolk 3D** style (the owner's chosen style: round 3D bean people with stick legs and drawn-on faces; Short 1 "Clever Hans" was built
in it and shipped).

## Start
- Work on your own branch: `git checkout -B claude/short02-bean` and push only there (`git push -u origin claude/short02-bean`). Commit
  and push often. Do not open a pull request.
- Read `CLAUDE.md`, then `docs/PRODUCTION_PLAYBOOK.md`, then the docs they list. Above all `docs/lessons/short01-owner-notes.md`: the
  owner shipped Short 1 but said never again to (1) put anything too close to the lens (a black slab in a corner), (2) let the back of a
  head fill the frame, (3) let faces go dim in dark grades, (4) give a new character odd proportions (Hans's neck read like a giraffe),
  (5) open a shot on a blurry foreground. Check every one before rendering.
- Style and code to reuse: `docs/review/cast_sheet_v1.jpg`, `video/src/bean/` (Bean3D rig, Face kit), `video/src/kit/`, and the whole
  Short 1 build in `video/src/short01_bean/` (shots, timing build, pops, sets, the horse as an example of an animal in this style),
  `episodes/01_clever_hans/cues_bean.py` and `sfx_bean.py` (sound). Copy patterns from it; keep Short 2 code in its own folder.

## Inputs (frozen: do NOT rewrite the script or re-voice anything)
`episodes/02_rat_bounty/`: `script.txt` (23 beats, 223 words), the mp3 clips in `audio/`, `words.json` (all 223 words timed),
`timeline_chunks.json`, `tts_text.json`, `tts_speed.json`. WAVs are not in git: rebuild the voice first with
`python3 pipeline/assemble_cast.py episodes/02_rat_bounty` (64.6 s with the tail; the voice ends at 64.0 s).

The story (true: the Great Hanoi Rat Massacre, 1902, documented by historian Michael Vann), one beat per line:
1902 Hanoi: the city's shiny new sewers have become a highway for rats, which pop out of toilets in the fanciest homes. Officials offer
one cent per rat tail. Tails pour in by the thousands, some days more than twenty thousand; the officials cheer, counting tails in
crates. But the streets are still crawling, and people notice rats running around with no tails. "Meanwhile," inspectors outside the
city find barns full of rats, fed and cared for like pets. "You see," the city wasn't paying for dead rats, it was paying for tails, and
a rat doesn't need its tail to make more rats: hunters caught a rat, snipped the tail, let it go; every freed rat had babies, and every
baby grew a new tail; some people simply farmed them. The more the city paid, the more rats it got: a perverse incentive. "When you
reward the proof instead of the result, people just make more proof." Hanoi quietly cancelled the bounty. The last line ("Which is the
real story of how...") loops straight into line 1, so the final frame must cut seamlessly into the first.

## Picture
- Code in `video/src/short02_bean/`, composition `Short02Bean` (1080x1920, 30 fps, length from the voice track), plus `Short02BeanClean`
  (the same picture without captions, for thumbnails) like `Short01BeanClean`.
- **Cast:** cute original cartoon **rats** in this style (round, big drawn eyes, pink ears, a clearly visible long tail; tailless rats
  with a tiny bandage on the stub, read instantly as funny), checked from front, three-quarter and side before any shot; **French
  colonial officials** (white suits, moustaches, a sun helmet), an **inspector** with a clipboard; **Hanoi townspeople and rat hunters**
  in period clothes, drawn with care and variety, never as caricatures; an **economist** at a chalkboard. Use the Beanfolk cast's skin
  palette, faces bright in every grade.
- **Sets** (dense, cosy, readable detail, `docs/lessons/sets-full-of-detail.md`): a 1902 Hanoi street of colonial buildings and shop
  signs with a sewer grate; a fancy tiled bathroom (a rat pops out of the toilet); the town hall counting room with crates of tails, a
  ledger and coin stacks; a night alley of tailless rats; barns among rice fields outside the city full of rats being fed; the violet
  "You see" reveal as a loop diagram: catch → snip → release → babies → new tails → cents, spinning faster; an economist's chalkboard.
- About 45-55 set-ups, a new picture every 1-1.5 s, every camera moving (push, orbit, crane, tilt), mostly whip transitions, faces that
  change on the words, characters that act (counting, cheering, gasping, snipping, shrugging), feet on the ground.
- **Pop-ins on words:** "1902", "HANOI", "1¢ PER TAIL", a tail counter racing up to "20,000 / DAY", coin bursts, "NO TAIL?!", "RAT FARM",
  a graph line going UP on "the more rats it got", "PERVERSE INCENTIVE", "PROOF ≠ RESULT", a "CANCELLED" stamp.
- Captions one or two words at a time from `words.json`, highlight colours on key words.
- Every cut, expression, pop and sound from `at(beat, "word")` on the measured word times. Never type a time in seconds.
- **Review before rendering** (playbook step 5): stills of every shot (check corners!), a contact sheet of every second, a 60-frame
  sequence of the busiest part. Fix, review again.

## Render: always split across 10-20 sessions
Playbook step 6 and `docs/RENDER_ON_MANY_SESSIONS.md`: freeze the source, write the split table in `notes/short02_bean_render.md`,
one `create_session` per part (never the Agent tool), each part on its own branch `claude/short02-bean-partKK`; collect, check frame
counts and black runs, join, check the total, archive the part sessions.

## Sound
`episodes/02_rat_bounty/cues_bean.py` (+ `sfx_bean.py` for synthesised effects), every time from the picture's own timing:
- a whoosh on every whip, a pop on every pop-in;
- **synthesise** what the library lacks: rat squeaks (short high chirps, a few variants), a scissor snip, scurrying feet;
- from `sfx/library/` (see `library_index.md`): `toilet_flush_01` + `cartoon_panic_01` for the toilet rat, `coins_clink_01` /
  `coins_handling_01` / `coin_win_01` for each paid tail, `coins_jackpot_01` on "twenty thousand", `cheer_crowd_03` when officials
  cheer, `gasp_woman_01` / `gasp_man_01` on "no tails", `amb_barn_01` + `chickens_01` at the barns, `sting_wrong_buzz_01` or
  `cartoon_sad_horn_01` on "the more rats it got", `sting_joke_drum_01` on "make more proof", `stamp` on "cancelled";
- street, room and barn ambience, quieter in the reveal;
- **music 15 dB under the voice, measured:** `python3 -I pipeline/music_level.py episodes/02_rat_bounty/cues_bean.py -15`. Use the
  owner's track `sfx/music/tiptoe_across_the_floorboards.mp3` for now (it fits a sneaky mystery); the owner may send a new track
  later, which is only a remix and re-finish, never a re-render.

## Finish and deliver
`python3 pipeline/finish.py <joined.mp4> episodes/02_rat_bounty/mix_bean.wav exports/short02_rat_bounty_bean.mp4` (-14 LUFS,
-1.5 dBTP). Check length, loudness and a contact sheet of the finished file. Upload with
`bash pipeline/upload_drive.sh exports/short02_rat_bounty_bean.mp4`, `git add -f` the export and push it to `claude/short02-bean`.
Render 4-5 caption-free thumbnail stills from `Short02BeanClean` (playbook step 9) into `docs/review/short02_thumbs/`.
Then `send_message` to the coordinator session `session_01LQP7vwBtF6kFJ2p3c2AWBZ` with: the Drive link, the branch, the length and
loudness, the contact-sheet path, the thumbnail paths, and anything still weak, honestly.

Work without small questions; make the calls a good animation director would. If something blocks you, message the coordinator.
