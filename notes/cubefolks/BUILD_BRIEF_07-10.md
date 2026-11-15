# Build brief: Shorts 07-10 (the four story tests), 2026-11-15

Four Shorts are built at the same time, one **lead session** per Short. The owner approved the scripts and the voice; this
brief is everything a lead needs. Coordinator (reviews every Short before the owner sees it): **session_01LQP7vwSQNUAmZREKBcn8iD**.

| Short | Lead | Folder | Episode (audio, frozen) | Composition | Plan |
|---|---|---|---|---|---|
| 07 The Truck With No Speaker (creepy) | lead 07 | `video/src/short07_truck/` | `episodes/07_icecream_truck/` (35.1 s) | `Short07`, `Short07Clean`, `Short07At` | `STORY_TESTS_v2.md` section A |
| 08 The Invisible Elephant (comedy) | lead 08 | `video/src/short08_elephant/` | `episodes/08_invisible_elephant/` (38.9 s) | `Short08`... | section B |
| 09 The Porch Light Code (wholesome) | lead 09 | `video/src/short09_porch/` | `episodes/09_porch_light/` (36.7 s) | `Short09`... | section C |
| 10 The Hamster Who Escapes Every Friday (mystery) | lead 10 | `video/src/short10_hamster/` | `episodes/10_hamster_friday/` (40.9 s) | `Short10`... | section D |

## Read first (15 minutes at most)
`CLAUDE.md`; `notes/cubefolks/STORY_TESTS_v2.md` (your section: script, clues, pop-ins, cast, sets, sound, shot table);
`docs/CUBEFOLKS_STYLE.md` (what the owner's sample does); `docs/lessons/spatial-awareness.md`; `docs/lessons/short01-owner-notes.md`;
`notes/short06/CONTRACT.md` (how Short 6 was built) and `video/src/short06_blocky/ShotsA.tsx` (a working shot file).

## Inputs (frozen: never re-voice, never edit the script)
- `video/src/<short>/timing.json` (beats and words with times). **Every cut, face, pop, caption and sound anchors to
  `at(beat, "word")`. Never type a second.**
- The scaffold `video/src/<short>/ShortNN.tsx` is registered in `Root.tsx` already (empty shot list): replace `SHOTS`, `POPS`,
  `HIGHLIGHT`; keep the exports. Captions are one word at a time at `captionY 0.7`.
- Rebuild the voice WAV in a new container: `python3 pipeline/assemble_cast.py episodes/<ep>` (the mp3 clips are committed).

## The kit (use it; extend it only in the files you own)
- `video/src/blocky/BlockRig.tsx` (characters; `hits` for the clipping debug), `Motion.ts` (walkPath with `ground`, turn,
  sit (hops on), jump, wave, point, shrug, crossArms (folded in front), hips, chop, stir, pushDoor, knock, raise, cheer, clap,
  leanIn, laugh, nod, headShake, lookAround, headSnap, recoil, cower, talkHands, pickUp, pour, talk() faces, crowdTurn,
  fileIn, wander, stagger), `Collide.ts` (box colliders, groundFn, clipParts, footGap, reachArm, armAboveSurface, separate),
  `Look.tsx` (BlockLights, Sky), `Textures.ts` (tex/mat), `Accessories.tsx` (hair incl. emo; hats cap, capBack, beanie;
  glasses; `acc: ["bow" | "headphones"]`), `ChannelArt.tsx` (`SKINS`: narrator, soft, emo, street, preppy, y2k, sage).
- `video/src/blocky/MotionSheet.tsx` shows every move WITH colliders in real sets (sit on a chair, chop on a board with
  `armAboveSurface`, a hand on a door with `reachArm`, crowds with `separate`, steps with `groundFn`, pews with crowd turns).
  `video/tools/clipAudit.tsx` is the fast no-render clipping audit pattern: copy it for your shots.
- Short 6 sets you can reuse: `video/src/short06_blocky/Town.tsx` (`StreetSet`, `MyStreet` day/dusk/night, houses, porches,
  fences, lamps), `House.tsx` (Bathroom, Kitchen, DiningRoom, Hallway, Bedroom). Remember HOUSE is in metres (adult scale
  0.32) and TOWN in rig units (adult scale 1).

## Shared new sets (built ONCE, by one lead, pushed to main early)
- **Classroom** (used by 07 and 10): **lead 10 owns** `video/src/blocky/Classroom.tsx`: desks in rows with chairs, a green
  board with chalk doodles, a clock, windows, a teacher's desk, a low shelf by the wall (for the hamster cage), a door.
  Export the component, its colliders (`CLASSROOM_CS: Box[]`) and named spots (`TEACHER_SPOT`, `DESK(i)`, `SHELF`, `DOOR`).
  **Push a first working version to main within 45 minutes** and message lead 07 (its session id is in your first message).
- **School corridor, principal's office door, gym** (used by 08, maybe 07): **lead 08 owns** `video/src/blocky/SchoolHall.tsx`
  (`Corridor` with lockers, `OfficeDoor` with a window, `Gym` with big doors and floor lines), with colliders and spots.
- Everything else is per Short, inside your own folder (the truck, the hamsters and cages, porch lights, the step stool...).

## Who touches what (git)
- Leads push to **main**, touching ONLY their own folder, their own `episodes/<ep>/cues*.py`/`sfx*.py`, and the shared file they
  own. `git pull --rebase origin main` before every push. Small commits, every ~15 minutes.
- If you start builders (`create_session`, at most 3 per Short, e.g. "sets and props", "shots first half", "shots second half"),
  each works on its own branch `claude/shortNN-<role>` and messages you; you merge into main. Write each builder a short brief
  (the files it owns, what it exports, the beats it covers, the colliders it must pass). **Builder and render sessions never
  call archive_session**; you archive the sessions you created once their work is merged or collected.

## Picture rules (the owner's, all of them matter)
- **Motion in every shot**: someone walks in or out, turns, gestures, sits, reacts. Expressions change on the words
  (`talk()` for quoted lines). People walk briskly; gestures are big and readable.
- **Nothing passes through anything**: every character gets its set's colliders and the other people in the shot; your audit
  must report **zero clipping frames** before the real render (also no sunk or floating feet; doors at least 5 wide).
- **Framing**: medium and medium-wide like the sample (whole bodies or head to knees, faces visible, the place around them),
  camera 2.5-5 m away (8-16 rig units); close-ups only for a face reaction or a key CLUE prop; never a blank wall, the back of
  a head or a prop filling the frame; night scenes lit like night with a face fill.
- **CLUE shots** (marked in the plan) must read on a phone: the prop lit, in frame at least 1 s, not under a caption.
- **Frame 0** already shows the strange thing in motion, with the hook pop-in fully on screen. **Last shot** cuts cleanly into
  shot 1 (the loop). The on-screen question pops in for the last 3 s (never spoken).
- Hard cuts, about one shot a second, calm moving cameras (push, drift, lead dolly, one game-camera shot: drone or aerial).

## Review before the render (send stills to the coordinator only if something is unclear)
Stills of every shot (first, middle, last frame; look at the corners), frames 0/15/45 against the hook checklist
(`knowledge/SHORTS_PLAYBOOK.md`), a contact sheet of every second, a 60-frame sequence of the busiest shot, the clipping audit
at zero, the twist and the loop read correctly.

## Sound (`episodes/<ep>/cues.py`, as `episodes/06_reflection/cues.py`)
- Ambience per place from `sfx/library/` (see `sfx/library_index.md`), effects on actions (door, knock, switch clicks, cash,
  bells, cartoon stings for comedy), a soft riser or sting on the twist.
- Music: a claim-free bed (`sfx/music/` or a credited library pad; mood per story). **Level: about 9 dB under the voice,
  measured** (`python3 -I pipeline/music_level.py episodes/<ep>/cues.py -9`), kept as ONE number in `cues.py` so the owner
  can ask for 15 dB later as a remix, not a re-render. Mix: `python3 -I pipeline/mix.py episodes/<ep>/cues.py episodes/<ep>/mix.wav`.
- **Short 07 only:** the story runs on one ORIGINAL jingle (our own melody, never a real ice cream truck tune) with one fixed
  wrong note; synthesise it (`pipeline/synth.py` / `sfx_gen.py`), play it from the truck (shot 1), from Toby (beat 6), hummed by
  the teacher with the same wrong note (beats 9-10), and in full with bells from Mom (beat 17).

## Render, finish, deliver
- Render split across about 12 sessions (`docs/RENDER_ON_MANY_SESSIONS.md`): about 90-100 frames a part, each part on its own
  branch `claude/shortNN-partKK`, a render timeout of at least 30 minutes, `--concurrency=2`. Collect, check frame counts and
  black runs, join with `-c copy`.
- Finish: `python3 pipeline/finish.py <picture.mp4> episodes/<ep>/mix.wav exports/shortNN_<slug>_v1.mp4` (-14 LUFS, -1.5 dBTP);
  `bash pipeline/upload_drive.sh exports/shortNN_<slug>_v1.mp4`; `git add -f` the export; push.
- Thumbnails: 3 caption-free stills from `ShortNNClean` (best face + the key prop) into `docs/review/shortNN_thumbs/`.
- **Report to the coordinator** (send_message to session_01LQP7vwSQNUAmZREKBcn8iD): the Drive link, the export path, the length,
  a contact-sheet path (`docs/review/shortNN_every_second.jpg`), and what is still weak, honestly. Do not message the owner;
  the coordinator reviews first. Also report milestones briefly (sets done, all shots in, render started).

Work without small questions; make the calls a good animation director would. If something blocks you, message the coordinator.
