You are building **Gizmo Origins Short 3, "The Chocolate Bar That Invented the Microwave"**, from finished audio to a finished, uploaded video, in the **Beanfolk 3D**
style (round 3D bean people with stick legs and drawn-on faces). Gizmo Origins is the owner's channel for the surprising true stories behind
everyday gadgets. The owner is away and wants the finished video in under 2 hours: make every decision yourself, aim to have it uploaded
within about 80 minutes, and don't stop to ask. Another session is building a different Short at the same time on its own branch; never
touch it.

## Start
- Work on your own branch: `git checkout -B claude/short03-microwave` and push only there (`git push -u origin claude/short03-microwave`). Commit and push often. No pull request.
- Read `CLAUDE.md`, then `docs/PRODUCTION_PLAYBOOK.md`, then `docs/lessons/short01-owner-notes.md`: never (1) anything too close to the
  lens, (2) the back of a head or a hat filling the frame (still happened with conical hats in Short 2), (3) dim faces in dark grades,
  (4) odd proportions on a new character, (5) a blurry foreground opening a shot.
- Reuse: `video/src/bean/` (rig, faces), `video/src/kit/`, and the two finished builds `video/src/short01_bean/` and
  `video/src/short02_bean/` (shots, timing build, pops, sets, Clean composition, render scripts) with their sound in
  `episodes/01_clever_hans/` and `episodes/02_rat_bounty/` (`cues_bean.py`, `sfx_bean.py`). Copy patterns; keep your code in its own folder.
- **Channel branding:** Gizmo, the mascot (look `GIZMO` in `video/src/gizmo/GizmoArt.tsx`: teal jumpsuit, brass goggles), makes one
  short cameo, e.g. peeking in from the edge of a shot reacting to the reveal. Keep it a beat, not a distraction.

## Inputs (frozen: do NOT rewrite the script or re-voice anything)
`episodes/03_microwave/`: `script.txt` (22 beats), the mp3 clips, `words.json`, `timeline_chunks.json`, `tts_text.json`, `tts_speed.json`.
WAVs aren't in git: first `python3 pipeline/assemble_cast.py episodes/03_microwave` (the voice ends at 64.9 s).

The story (true: Percy Spencer at Raytheon, 1945): Percy, who never finished school, builds radar parts for the war. Standing next to a
humming radar tube (a magnetron), his chocolate bar melts in his pocket though the room and he aren't hot. He sends for popcorn kernels:
they burst all over the lab. Then an egg: it wobbles, shakes and explodes in a coworker's face. "Meanwhile" the war is ending and the
factory's thousands of radar tubes are about to become useless. "You see," the tube fires invisible microwaves that make the water
molecules in food spin back and forth billions of times a second; the jiggling turns into heat inside the food, so the snack got hot but
the room didn't. The company turns a war machine into a kitchen machine: the first one taller than a man, heavy as a piano, about $5,000.
Today almost every kitchen has one. "Not bad for a guy with no diploma and a ruined snack." Last line "And it all started when..." loops into line 1.

## Picture
- **Cast:** Percy (a lean engineer in a 1940s shirt, rolled sleeves, tie, pencil behind his ear; he's the hero, give him great faces),
  lab coworkers (one gets the egg, with a funny dripping face), factory workers, a 1950s family at the end. Original designs in the
  Beanfolk cast's style and skin palette.
- **Sets:** a 1940s radar lab (humming magnetron with glowing coils, dials, cables, a "RAYTHEON" style sign must be generic: use "RADAR LAB"),
  Percy's pocket close-up (the chocolate melting), the lab bench with popcorn bursting, the egg test, a war factory with rows of radar tubes,
  a violet "You see" reveal: a giant cartoon water molecule (Mickey-shaped H2O) spinning faster and faster inside a popcorn kernel / egg,
  heat waves rising; then the first giant "Radarange"-style oven next to a man (taller than him) and a piano on a scale, a 1950s kitchen,
  a modern kitchen with a microwave going ding.
- **Pop-ins:** "1945", "NO DIPLOMA", melting chocolate drip, "POP!" bursts, "SPLAT!", "1,000,000,000 SPINS / SEC" (billions), "HEAT INSIDE",
  "750 LB" or a piano icon, "$5,000", a big ✓ "EVERY KITCHEN".
- Captions one or two words at a time from `words.json`, highlight colours on key words. Everything from `at(beat, "word")`;
  never type seconds. About 45-55 set-ups, a new picture every 1-1.5 s, every camera moving, mostly whips, faces changing on words,
  characters acting, feet on the ground. The last frame runs straight into the first (the script loops).
- Compositions `Short03Microwave` and `Short03MicrowaveClean` (no captions, for thumbnails).
- **Review before rendering** (playbook step 5): stills of every shot at start, middle and end (look at the corners), a contact sheet
  of every second, a 60-frame sequence of the busiest part. Fix everything on the owner's list, review again.

## Render: split across 10-20 sessions
`docs/RENDER_ON_MANY_SESSIONS.md`: freeze the source, split table in `notes/short03_microwave_render.md`, one `create_session` per part (never the
Agent tool), each part on its own branch `claude/short03-microwave-partKK`; collect, check frame counts and black runs, join, check the total, archive
the part sessions. After joining, look at a contact sheet of the joined picture; if any owner-note problem slipped through, fix it and
re-render only the affected parts.

## Sound
`episodes/03_microwave/cues_bean.py` + `sfx_bean.py`, all timed from the picture: a whoosh on every whip, a pop on every pop-in, real reactions from
`sfx/library/` on the beats that call for them (`library_index.md`: laughs, cheers, gasps, applause, stings, bells, heartbeats, coins),
ambience per place. **Synthesise in `sfx_bean.py` what the library lacks:** a low electric radar hum, popcorn kernels popping (a rapid burst), an egg wobble and a wet splat, a microwave-oven ding, a whirring turntable, a factory clank. Music: the owner's track
`sfx/music/tiptoe_across_the_floorboards.mp3`, **15 dB under the voice, measured** with
`python3 -I pipeline/music_level.py episodes/03_microwave/cues_bean.py -15`.

## Finish and deliver
`python3 pipeline/finish.py <joined.mp4> episodes/03_microwave/mix_bean.wav exports/short03_microwave.mp4` (-14 LUFS, -1.5 dBTP); check length,
loudness and a contact sheet of the finished file; upload with `bash pipeline/upload_drive.sh exports/short03_microwave.mp4`; `git add -f` the export and
push. Render 4-5 caption-free thumbnail stills from `Short03MicrowaveClean` into `docs/review/short03_microwave_thumbs/`, a one-frame-per-second contact
sheet into `docs/review/short03_microwave_every_second.jpg`. Then `send_message` to the coordinator `session_01LQP7vwBtF6kFJ2p3c2AWBZ` with the Drive
link, branch, length, loudness, music level, sheet and thumbnail paths, and anything still weak, honestly. Then stop.
