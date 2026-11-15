# Short 07 "The Truck With No Speaker": build contract (2026-11-15)

Lead (integrator, street shots, truck, sound, render): session `session_01LQP7vwxHEDUGJ2akTUDBAU`.
Plan: `notes/cubefolks/STORY_TESTS_v2.md` section A (script, clues, shot table). Brief: `notes/cubefolks/BUILD_BRIEF_07-10.md`.

## Inputs (frozen)
- `video/src/short07_truck/timing.json`: beats and words. **Every time comes from `at(beat, "word")` / `E.*` in `common.tsx`.**
- `video/src/short07_truck/common.tsx`: cast (ME, ME_PJ, MOM, TOBY, TEACHER, KIDS), word anchors `E`, the cut list `CUTS`
  (each shot's id and start; it ends where the next starts), `mk(id, {scene, cam})`, `mv(id, from, to)`, `move`, `Ch` (the
  collider-aware character), `st()` (a CharState for `others`), jingle helpers (`notePulse`, `isWrong`).
- `video/src/short07_truck/Props07.tsx`: `Truck`, `TRUCK`, `truckPt`, `truckCS`, `SpeakerMount`, `Cone` (hold it with
  `hold={{ R: <Cone glow={..}/> }}`; with the arm raised forward ~1.5 rad the cone stands upright), `Flyer`.

## UNITS: rig units everywhere
An adult BlockChar at scale 1 is 5 tall (1 m ~ 3.1 units); kids `S.kid` = 0.82. Build every new room in RIG UNITS (do NOT
reuse Short 6's metre-scale House sets; copy ideas, not the scale). Doors at least 5 wide, aisles at least 5.

## Who owns what (each builder works on its own branch and only in its own files)
| Role | Branch | Files | Shots (ids in `CUTS`) |
|---|---|---|---|
| Lead | main | `common.tsx`, `Props07.tsx`, `ShotsStreet.tsx`, `Short07.tsx`, `tools/clipAudit07.tsx`, sound | s01 s04 s05 s19 s20 s21 s35 |
| SCHOOL builder | `claude/short07-school` | `School07.tsx` (yard lunch tables, slide, corridor, classroom window view), `ShotsSchool.tsx` (export `SHOTS_SCHOOL`) | s06-s18 |
| HOUSE builder | `claude/short07-house` | `Rooms07.tsx` (ME's bedroom, upstairs hallway, kitchen), `ShotsHouse.tsx` (export `SHOTS_HOUSE`) | s02 s03 s22-s34 |

Shared sets: the **classroom** is `video/src/blocky/Classroom.tsx` (lead 10 owns it; first version on main within ~45 min:
`Classroom`, `CLASSROOM_CS`, `TEACHER_SPOT`, `DESK(i)`, `SHELF`, `DOOR`). Never edit it; ask the lead 07 session if you need
something and it will ask lead 10. A school **corridor** may exist in `video/src/blocky/SchoolHall.tsx` (lead 08); use it
if it is on main, else build our own in `School07.tsx`. The street is Short 6's `MyStreet` (`video/src/short06_blocky/Town.tsx`).

## Rules (the owner's)
- **Motion in every shot**: walks, turns, gestures (Motion.ts), faces change on the words. Never a still person.
- **Nothing passes through anything**: every `<Ch>` gets `cs` (the set's colliders as `Collide` boxes: walls, furniture,
  floors you step on) and `others` (the other people in the shot). `<Ch>` must appear DIRECTLY in the tree a scene returns
  (fragments/groups/set wrappers' children), never inside another component's render, so the audit can find it.
  Audit: `cd video && npx esbuild tools/clipAudit07.tsx --bundle --platform=node --outfile=out/clipAudit07.cjs --jsx=automatic --loader:.json=json && node out/clipAudit07.cjs`
  must print **0 hits** for your shots. Sitting/lying people: `allow` the seat/bed collider names, or `noFeet`.
- **Framing**: medium / medium-wide, whole bodies or head to knees, faces visible, camera 8-16 units away; close-ups only
  for a face reaction or a CLUE prop (CLUE shots: the prop lit, in frame the whole shot, in the upper 60% of the frame:
  captions sit at 70% height). Never a blank wall, the back of a head, or a prop filling the frame. Night lit like night
  (`BlockLights time="night"` / `"interiorNight"`, a face fill keeps faces readable).
- Hard cuts (`mk` defaults to `enter: "cut"`), calm moving cameras (`mv`), about one shot a second.
- The jingle (sound) is the story: the cone-holders hum/sing it. Use `notePulse(t, t0)` for small jolts or glows on its notes,
  `isWrong(t, t0)` for the wrong note (the teacher's head tilt in s17, Mom's jolts in s30). The lead places the audio at the
  same `t0` you use: say which `t0` (an `E.*` anchor) you used in your message.

## Review stills
`cd video && npx remotion still src/index.ts Short07At out/s07_<id>.png --props '{"u": <seconds>}'` (add `"debug": true`
to paint clipping parts magenta). Look at first/middle/last frame of every shot, and at the corners.

## Handing over
Commit to your branch, push (`git push -u origin claude/short07-<role>`), and `send_message` the lead with: the branch, the
shots done, the audit result, anything weak. Never call archive_session. Never edit files you don't own.
