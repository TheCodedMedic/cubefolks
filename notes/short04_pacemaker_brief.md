You are building **Gizmo Origins Short 4, "The Wrong Part That Saved Millions of Hearts"**, from finished audio to a finished, uploaded video, in the **Beanfolk 3D**
style (round 3D bean people with stick legs and drawn-on faces). Gizmo Origins is the owner's channel for the surprising true stories behind
everyday gadgets. The owner is away and wants the finished video in under 2 hours: make every decision yourself, aim to have it uploaded
within about 80 minutes, and don't stop to ask. Another session is building a different Short at the same time on its own branch; never
touch it.

## Start
- Work on your own branch: `git checkout -B claude/short04-pacemaker` and push only there (`git push -u origin claude/short04-pacemaker`). Commit and push often. No pull request.
- Read `CLAUDE.md`, then `docs/PRODUCTION_PLAYBOOK.md`, then `docs/lessons/short01-owner-notes.md`: never (1) anything too close to the
  lens, (2) the back of a head or a hat filling the frame (still happened with conical hats in Short 2), (3) dim faces in dark grades,
  (4) odd proportions on a new character, (5) a blurry foreground opening a shot.
- Reuse: `video/src/bean/` (rig, faces), `video/src/kit/`, and the two finished builds `video/src/short01_bean/` and
  `video/src/short02_bean/` (shots, timing build, pops, sets, Clean composition, render scripts) with their sound in
  `episodes/01_clever_hans/` and `episodes/02_rat_bounty/` (`cues_bean.py`, `sfx_bean.py`). Copy patterns; keep your code in its own folder.
- **Channel branding:** Gizmo, the mascot (look `GIZMO` in `video/src/gizmo/GizmoArt.tsx`: teal jumpsuit, brass goggles), makes one
  short cameo, e.g. peeking in from the edge of a shot reacting to the reveal. Keep it a beat, not a distraction.

## Inputs (frozen: do NOT rewrite the script or re-voice anything)
`episodes/04_pacemaker/`: `script.txt` (22 beats), the mp3 clips, `words.json`, `timeline_chunks.json`, `tts_text.json`, `tts_speed.json`.
WAVs aren't in git: first `python3 pipeline/assemble_cast.py episodes/04_pacemaker` (the voice ends at 61.4 s).

The story (true: Wilson Greatbatch, Buffalo, 1956): building a gadget to record heartbeats, he reaches for a tiny resistor but grabs one a
hundred times too strong (10 kilohm vs 1 megohm). He solders it in, switches on, and freezes: the circuit goes quiet, then pulses: quiet,
pulse; quiet, pulse; once a second, like a heart. "Meanwhile" doctors have patients whose hearts keep slowing until they stop; the only
machines that help are TV-sized and plugged into the wall: if the power goes out, the patient is in trouble. "You see," every heartbeat
starts with a tiny electrical spark; in those patients the spark isn't getting through, and Wilson's mistake makes the exact spark a heart
needs, once every second. He shrinks it to fit in a palm, quits his job and builds them in the barn behind his house. In 1960 surgeons
place one in a 77-year-old man; his heart beats steady again. Today millions of people have one in their chest. "All because of one wrong
part from one box." Last line "And it all began when..." loops into line 1.

## Picture
- **Cast:** Wilson (1950s engineer, glasses, cardigan or white shirt and tie; the hero, great faces: concentration, the freeze, wonder),
  doctors and nurses, a slow-heart patient (warm, never scary), the 77-year-old man (smiling, walking again at the end), crowds of people
  of every age at the end with a tiny glowing heart icon on their chest. Original designs in the Beanfolk cast's style and palette.
- **Sets:** a cosy 1950s electronics workbench (oscilloscope, breadboard, parts drawers labelled "RESISTORS", a soldering iron with smoke),
  the two resistors side by side (stripe colours, "10K" vs "1M" labels), the oscilloscope screen showing a pulse every second (green blips),
  a 1950s hospital room with a huge TV-sized machine plugged into the wall and a cord, a power cut (lights flicker), the violet "You see"
  reveal: a cartoon heart with a glowing spark at the top travelling down (the spark blocked in the patient, then delivered by a tiny box),
  Wilson's barn workshop full of little devices, an operating room (tasteful, no gore: we see the surgeons and a happy monitor), the
  steady heart monitor, a modern street.
- **Pop-ins:** "1956", "WRONG PART!", "x100", "PULSE" blips synced to each "pulse" word, "1 PER SECOND", "TV-SIZED", a plug icon, "POWER CUT",
  "SPARK", "BLOCKED", "FITS IN YOUR PALM", "THE BARN", "1960", "MILLIONS ♥".
- Captions one or two words at a time from `words.json`, highlight colours on key words. Everything from `at(beat, "word")`;
  never type seconds. About 45-55 set-ups, a new picture every 1-1.5 s, every camera moving, mostly whips, faces changing on words,
  characters acting, feet on the ground. The last frame runs straight into the first (the script loops).
- Compositions `Short04Pacemaker` and `Short04PacemakerClean` (no captions, for thumbnails).
- **Review before rendering** (playbook step 5): stills of every shot at start, middle and end (look at the corners), a contact sheet
  of every second, a 60-frame sequence of the busiest part. Fix everything on the owner's list, review again.

## Render: split across 10-20 sessions
`docs/RENDER_ON_MANY_SESSIONS.md`: freeze the source, split table in `notes/short04_pacemaker_render.md`, one `create_session` per part (never the
Agent tool), each part on its own branch `claude/short04-pacemaker-partKK`; collect, check frame counts and black runs, join, check the total, archive
the part sessions. After joining, look at a contact sheet of the joined picture; if any owner-note problem slipped through, fix it and
re-render only the affected parts.

## Sound
`episodes/04_pacemaker/cues_bean.py` + `sfx_bean.py`, all timed from the picture: a whoosh on every whip, a pop on every pop-in, real reactions from
`sfx/library/` on the beats that call for them (`library_index.md`: laughs, cheers, gasps, applause, stings, bells, heartbeats, coins),
ambience per place. **Synthesise in `sfx_bean.py` what the library lacks:** a soldering-iron sizzle, a switch click, an electric pulse 'tick' that lands exactly on each pulse in the picture, a heart-monitor beep, a small zap/spark, a power-cut thunk. Music: the owner's track
`sfx/music/tiptoe_across_the_floorboards.mp3`, **15 dB under the voice, measured** with
`python3 -I pipeline/music_level.py episodes/04_pacemaker/cues_bean.py -15`.

## Finish and deliver
`python3 pipeline/finish.py <joined.mp4> episodes/04_pacemaker/mix_bean.wav exports/short04_pacemaker.mp4` (-14 LUFS, -1.5 dBTP); check length,
loudness and a contact sheet of the finished file; upload with `bash pipeline/upload_drive.sh exports/short04_pacemaker.mp4`; `git add -f` the export and
push. Render 4-5 caption-free thumbnail stills from `Short04PacemakerClean` into `docs/review/short04_pacemaker_thumbs/`, a one-frame-per-second contact
sheet into `docs/review/short04_pacemaker_every_second.jpg`. Then `send_message` to the coordinator `session_01LQP7vwBtF6kFJ2p3c2AWBZ` with the Drive
link, branch, length, loudness, music level, sheet and thumbnail paths, and anything still weak, honestly. Then stop.
