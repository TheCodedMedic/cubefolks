# Short 10 "The Hamster Who Escapes Every Friday": build contract (lead 10)

Plan: `notes/cubefolks/STORY_TESTS_v2.md` section D (script, clues, shot table 1-34). Rules: `notes/cubefolks/BUILD_BRIEF_07-10.md`
("Picture rules"), `CLAUDE.md`, `docs/lessons/spatial-awareness.md`. Audio and `timing.json` are FROZEN (40.86 s).

## Who owns what
| Role | Branch | Files (only these) | Shots / beats |
|---|---|---|---|
| lead 10 (integrator) | main | `Short10.tsx`, `Props.tsx`, `common.tsx`, `ClassPreview.tsx`, `CONTRACT.md`, `../blocky/Classroom.tsx`, `tools/clip10.tsx`, `episodes/10_hamster_friday/cues*.py` | pops (hook, question), sound, review, render |
| builder A | `claude/short10-shotsa` | `ShotsA.tsx` (+ `ShotsA_*.tsx` helpers if needed) | shots 1-15, beats 1-9, from t = 0 to `P(10)` |
| builder B | `claude/short10-shotsb` | `ShotsB.tsx` (+ `ShotsB_*.tsx`) | shots 16-34, beats 10-19, from `P(10)` to `T.END` |

Need a change in Props/common/Classroom? Message the lead (send_message) with the exact change; meanwhile build a local copy in
your own file. Do not edit files you don't own.

## Exports
`ShotsA.tsx`: `SHOTS_A: Shot[]`, `POPS_A: PopSpec[]`. `ShotsB.tsx`: `SHOTS_B`, `POPS_B`. Shots are contiguous: A's last shot ends
exactly at `P(10)`; B's first starts at `P(10)`; B's last ends at `T.END`. Short10.tsx concatenates them.
Pops: the lead adds the hook stamp `ESCAPED (AGAIN)` (frame 0 to ~at(1,"every")) and the question (last 3 s). Builders may add
small CLUE pops (`kind: "tag"`/"word", short) but never over a CLUE prop or under the caption band (captions at y 0.7).

## The kit
- `common.tsx`: `T, at, atE, P, KC` (timing), cast `ME, MAYA, ORTIZ, KIDS, KID` (kids scale 0.82, adults 1), `Ch` (character with
  blinks + debug), `st()`, `eye()`, `Lights`, `cam()`, `move()`, `add`, `L3`.
- `../blocky/Classroom.tsx`: `Classroom`, `CLASSROOM_CS`, `doorCS`, `DESK(i)` (sit with `M.sit(d.stand, d.seat, d.yaw, t, t0, 0.6, KID)`,
  or seated: position `[seat.x, M.seatedY(seat.y, KID), seat.z]`, pose `{legL: PI/2, legR: PI/2, armL: .35, armR: .35}` + `M.seatedIdle`),
  `TEACHER_SPOT`, `SHELF`, `SHELF_FRONT`, `SINK`, `SINK_BASIN`, `DOOR_IN/OUT`, `CLOCK`, `WINDOW(i)`. Rig units, room x -22..22, z -18..18.
- `Props.tsx`: `ClassCage` (props `drawer` 0..1 or null = gone/hole showing, `wheel`, `tape` 0..1, `lock`, `children` in cage-local
  space), `Cage` (local; Peanut's: `color="#e86aa0" lock={false} tape={0} sideDoorOpen nest2`), `cagePoint(local)`, `CAGE_POS`, `HOLE`,
  `SEAM`, `CAGE_CENTER`, `CAGE_CS`, `DRAWER`, `CAGE_DOOR`, `DrawerTray`; `Hamster` (look `NIBBLES` | `PEANUT`, `walk` phase, `cheeks`,
  `lookYaw`, `curl`, `blink`); `Backpack`, `ME_BAG`, `BAG_ROW`, `BagRow` (ME's bag under the hole), `BAG_CS`, `POCKET`; `Shells`,
  `Nest`, `Magnifier`, `Notebook`, `KeyLanyard`, `TapeRoll`, `Sponge`, `Phone`, `BookStack`; the night `Bedroom` (`BED`, `BED_SIT`,
  `HOME_DESK`, `PCAGE_POS`, `pcagePoint`, `HOME_BAG`, `DigitalClock`, `BEDSIDE_CLOCK`, `BEDROOM_CS`).
- `../blocky/Motion.ts` (all the moves), `../blocky/Collide.ts`. Working example of a shot file: `../short06_blocky/ShotsA.tsx`.
  Held props: `hold={{ R: <Magnifier/> }}` on `Ch`.

## Picture rules (all matter)
- Every time from `at(beat, "word")`, never a typed second. About one shot a second; hard cuts (`enter: "cut"` unless a whip helps).
- MOTION in every shot: someone walks, turns, gestures, sits, reacts; expressions change on words. Brisk walks, big gestures.
- Framing: medium / medium-wide, faces visible, camera 8-16 units away; close-ups only for a face reaction or a CLUE prop.
  Never a blank wall, the back of a head or a prop filling the frame. Bedroom night lit like night (`time="interiorNight"`, face fill).
- CLUE shots (6 drawer out + HOLE visible, 9 backpack row with ME's striped bag right under the drawer, 17 shells, 20 second nest,
  30 the hole clearly) read on a phone: prop lit, ≥1 s in frame, in the upper 2/3 of the frame (captions sit at y 0.7).
- Frame 0 (shot 1): the empty cage, wheel still turning, door taped + padlocked, slow push. The last shot (34) is shot 1's angle so
  the loop cuts cleanly (builder B copies builder A's shot-1 camera: A exports `SHOT1_CAM(t)`).
- **Nothing passes through anything:** every `Ch` sits directly in the fragment `scene(t)` returns (not inside another component) with
  `cs` = `CLASSROOM_CS` (+ `CAGE_CS`, `BAG_CS`, `doorCS(..)` as present) or `BEDROOM_CS`, and `others` = the other people (`st()`).
  `npx esbuild tools/clip10.tsx --bundle --platform=node --outfile=out/clip10.cjs --log-level=error && node out/clip10.cjs` must print
  `TOTAL clipping frames: 0` for your shots. Lying in bed (rotated body): wrap in a group and mark `noAudit` (keep it clear of things by eye).
- The recording (shots 22, 28, 29): render the classroom from the phone's position and add a phone UI in `dom` (REC dot, timestamp
  "FRI 2:14 PM", a rounded frame); 28/29 show the drawer out, Sir Nibbles climbing out of HOLE and dropping into POCKET.

## Review before you report "done"
Stills (first/middle/last frame) of every shot: `npx remotion still src/index.ts Short10At out.png --props '{"u":12.3,"captions":true}' --scale=0.5`
(run stills one or two at a time; many in parallel can hang). The audit at zero. Then push your branch and send_message the lead
(session id in your first message) with the commit hash and any weak spots.
