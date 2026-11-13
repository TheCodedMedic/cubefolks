You are building **Beanfolk Short 5, "What If You Never Slept Again?"**, from finished audio to a finished, uploaded video, in the **Beanfolk 3D**
style (round 3D bean people with stick legs and drawn-on faces). This one is for the Beanfolk channel (strange true stories), a 37-second "What if" Short. Make every decision yourself and don't stop to ask; aim to have it uploaded within about 60 minutes.

## Start
- Work on your own branch: `git checkout -B claude/short05-never-sleep` and push only there (`git push -u origin claude/short05-never-sleep`). Commit and push often. No pull request.
- Read `CLAUDE.md`, then `docs/PRODUCTION_PLAYBOOK.md`, then `docs/lessons/short01-owner-notes.md`: never (1) anything too close to the
  lens, (2) the back of a head or a hat filling the frame (still happened with conical hats in Short 2), (3) dim faces in dark grades,
  (4) odd proportions on a new character, (5) a blurry foreground opening a shot.
- Reuse: `video/src/bean/` (rig, faces), `video/src/kit/`, and the finished builds `video/src/short01_bean/`, `short02_bean/`,
  `short03_microwave/` and `short04_pacemaker/` (on their branches `claude/short03-microwave`, `claude/short04-pacemaker`) (shots, timing build, pops, sets, Clean composition, render scripts) with their sound in
  `episodes/01_clever_hans/` and `episodes/02_rat_bounty/` (`cues_bean.py`, `sfx_bean.py`). Copy patterns; keep your code in its own folder.
- **Channel:** Beanfolk (no Gizmo cameo). Read `knowledge/SHORTS_PLAYBOOK.md` first: the hook checklist and story shape apply to every frame.

## Inputs (frozen: do NOT rewrite the script or re-voice anything)
`episodes/05_never_sleep/`: `script.txt` (13 beats), the mp3 clips, `words.json`, `timeline_chunks.json`, `tts_text.json`, `tts_speed.json`.
WAVs aren't in git: first `python3 pipeline/assemble_cast.py episodes/05_never_sleep` (the voice ends at 37.4 s).

The story (true: Randy Gardner, San Diego, 1963-64, 264 hours awake, observed by Stanford sleep researcher William Dement): Line 1: "A kid stayed awake for eleven days straight, and he did it for a
science fair." (No title question, no year in the narration: "1964" is only a pop-in.) Line 2: his name, his friends take shifts; his friends take shifts keeping him moving all night. Day 2 he
can't focus his eyes; day 4 he thinks a street sign is a person; then he decides he's a famous football player. But on the last night he
beats a sleep scientist at pinball. "So how was his brain still working? You see, scientists think his brain was cheating": microsleeps,
naps of a few seconds while his eyes stayed open ("you've probably had one in class"). After eleven days he slept fourteen hours and woke
up fine; the record was so risky that Guinness stopped accepting new ones. Last line "So no one can officially beat the time..." loops into
line 1 ("A kid stayed awake for eleven days straight...").

## Picture (38 s: about 28-32 set-ups, a new picture every 1-1.3 s)
- **Frame 1 (hook):** Randy, wide-eyed, eyes bloodshot, huge dark circles, holding a giant coffee mug, a wall clock spinning, a pop-in
  "11 DAYS AWAKE" then a crossed-out bed icon; the camera already pushing in. No title card.
- **Cast:** Randy (a lanky 1960s teen: crew cut, striped T-shirt, his eyes get droopier and his hair messier each day; great faces),
  two friends (one on guard with a whistle, one bouncing a basketball), the sleep scientist (a 1960s researcher, lab coat, tie,
  clipboard, glasses), a sign-post, a football player in a 1960s uniform for the daydream. Original designs, the Beanfolk palette.
- **Sets:** a 1960s San Diego bedroom/garage (science-fair poster "HOW LONG CAN YOU STAY AWAKE?", a day counter on a wall calendar),
  a night street with a street sign that turns into a "person" (Randy shakes its hand), a football-field daydream with a crowd, an
  arcade with a pinball machine lit up ("TILT!" never; "WINNER" lights), the violet "You see" reveal: inside Randy's head, a cartoon
  brain flicking a light switch off-on in tiny blinks ("MICROSLEEP" pops), a classroom with a kid's head nodding for a split second, a
  bed with Randy snoring for 14 hours (a clock spinning), a Guinness-style record book stamped "NO MORE".
- **Pop-ins:** "11 DAYS AWAKE", "1964" (small, on "Randy Gardner"), "AGE 17", a "DAY 1 → DAY 11" counter that ticks up with the days, "DAY 2", "DAY 4", "???" by the
  sign, a football with a star, "WINNER", "MICROSLEEP", "2 SECONDS", "14 HOURS", "264 HOURS AWAKE", "RECORD CLOSED".
- **Comment question pop-in in the last 3-4 s (never spoken):** "How long have YOU stayed awake? 👇".

- Captions one or two words at a time from `words.json`, highlight colours on key words. Everything from `at(beat, "word")`;
  never type seconds. About 45-55 set-ups, a new picture every 1-1.5 s, every camera moving, mostly whips, faces changing on words,
  characters acting, feet on the ground. The last frame runs straight into the first (the script loops).
- Compositions `Short05NeverSleep` and `Short05NeverSleepClean` (no captions, for thumbnails).
- **Review before rendering** (playbook step 5): stills of every shot at start, middle and end (look at the corners), a contact sheet
  of every second, a 60-frame sequence of the busiest part. Fix everything on the owner's list, review again.

## Render: split across 10-20 sessions
`docs/RENDER_ON_MANY_SESSIONS.md`: freeze the source, split table in `notes/short05_never_sleep_render.md`, one `create_session` per part (never the
Agent tool), each part on its own branch `claude/short05-never-sleep-partKK`; collect, check frame counts and black runs, join, check the total, archive
the part sessions. After joining, look at a contact sheet of the joined picture; if any owner-note problem slipped through, fix it and
re-render only the affected parts.

## Sound
`episodes/05_never_sleep/cues_bean.py` + `sfx_bean.py`, all timed from the picture: a whoosh on every whip, a pop on every pop-in, real reactions from
`sfx/library/` on the beats that call for them (`library_index.md`: laughs, cheers, gasps, applause, stings, bells, heartbeats, coins),
ambience per place. **Synthesise in `sfx_bean.py` what the library lacks:** a whistle blast, a basketball bounce, pinball flipper clacks and bells, a yawn-like swoosh, a light-switch click for each microsleep blink, a long snore. Music: the owner's track
`sfx/music/tiptoe_across_the_floorboards.mp3`, **15 dB under the voice, measured** with
`python3 -I pipeline/music_level.py episodes/05_never_sleep/cues_bean.py -15`.

## Finish and deliver
`python3 pipeline/finish.py <joined.mp4> episodes/05_never_sleep/mix_bean.wav exports/short05_never_sleep.mp4` (-14 LUFS, -1.5 dBTP); check length,
loudness and a contact sheet of the finished file; upload with `bash pipeline/upload_drive.sh exports/short05_never_sleep.mp4`; `git add -f` the export and
push. Render 4-5 caption-free thumbnail stills from `Short05NeverSleepClean` into `docs/review/short05_never_sleep_thumbs/`, a one-frame-per-second contact
sheet into `docs/review/short05_never_sleep_every_second.jpg`. Then `send_message` to the coordinator `session_01LQP7vwBtF6kFJ2p3c2AWBZ` with the Drive
link, branch, length, loudness, music level, sheet and thumbnail paths, and anything still weak, honestly. Then stop.
