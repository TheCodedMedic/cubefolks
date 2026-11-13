---
name: fix-playbook
description: "Every staging/anatomy/set/sound problem the user flagged in Episode 06 (v1 → v2, 40+ notes), the rule it implies, HOW it was fixed in code, and how to check it before the user sees it. Read before building any episode; run the checklist before every render."
metadata:
  type: feedback
---

The user, 2026-10-25: "I wouldn't want to fix things like that in subsequent videos. For example, when someone is
sitting on a chair, when someone is lying on a bed, the background, surroundings, when someone pulls a door... I don't
want to have to correct those again." The source notes are `episodes/06_see_when_everyone_dies/review_notes.md`
(40 notes) and the v1/v2 first-minute notes; the older Part 2 list is in [[anatomy-and-staging-rules]].

**Shared tools (use them, don't rebuild):**
- `cam3d/Vehicles3D.tsx`:
  - `Bike6`, `riderPose`, `mountPose`
  - `Car6`, `drivePose`, `passengerPose`, `enterCar`, `carToWorld`
  - `bikeOn`, `reachArm`/`handAt`, `reachLeg`/`ankleAt`
- `cam3d/Ground3D.ts`: `groundFit`, `groundLift`
- `cam3d/Props3D.tsx`: `sitOn(h)`
- Person3D:
  - face `tears`
  - an apron whose skirt hinges at the hips
- The Ep06 sets in `video/src/wit06/`:
  - `SetsC.tsx`: `Duvet` (a bedcover shaped over a body)
  - `SetsD.tsx`: the hospital bed and a lying pose, the zip bag, the folded referral paper
  - `SetsE.tsx`: the sliding doors, the staged mirror room
  - `Sets6.tsx`: `stairGround`, `Stairwell`, `ShopFront`
- Check compositions: `Ep6Check` and `Ep6FilmCheck{,B..E}` (still lists in check*.json), `Ep6GroundCheck` and `Ep6VehCheck` (low-angle contact checks). Make the same for each new episode.

---

## 1 · Bodies touching things
| Situation | The rule | How (code) | Check |
|---|---|---|---|
| **Sitting on a chair, sofa or wall** | Hips ON the seat; thighs rest on top of the seat (never inside it); feet on the floor or hanging clear of the front face; forearms on the tabletop or in the lap. | `sitOn(seatHeight)`; hips near the seat's front edge; knees past the front face; check the shin length against the seat height. A child at an adult table gets a **booster cushion** so their forearms reach the top. | A side-on still at seat height. |
| **Lying in a bed** | The body lies ON the mattress: head in a dented pillow, the blanket shaped over the body, nothing through the mattress or frame. A raised bed: back on the raised section, hips on the flat. | The SetsD hospital bed and lying pose; `Duvet` (a height field that humps over the body and hangs over the sides). No slab blankets. | Stills from the side at bed height, and from the foot. |
| **Someone beside a bed** (carer, parent) | Kneel or sit on the floor or a stool beside it, head OUTSIDE the bed's footprint, forearm on the mattress edge, a visible gap between body and bed. Never "sitting on air", never leaning over the duvet from above. | `reachArm` puts the hand exactly on the forehead or hand. Camera at bed height from the foot or side. | A side still that shows the gap. |
| **Hands on things** (grips, steering wheel, shoulder, zip, paper) | The hand is exactly on the target, not near it and not inside it. | `reachArm(pose, side, target)` / `handAt`. | A close-up still. |
| **Two heads close** (kisses, hugs, confrontations, getting into a car) | Heads at least 0.3 m apart in 3D **and** their silhouettes separate in the frame. A goodnight kiss = hand on the shoulder, lips to the back of the head, side-on. Confrontations happen at about 1 m. | Check head positions; choose a camera where the silhouettes don't overlap. | Score the screen overlap with a small projection, then confirm in stills. |
| **A push or rescue** | You push them: hands planted on the shoulder and hip, torsos apart, they fall away. Nobody passes through anybody or their bike. Keep effects (rings, glare) from ghosting a body. | Stage the push from the side; the victim stays on the bike and they tip together, separating only on landing. | Stills every 0.1 s through the slow motion. |
| **Landing in a hedge or bush** | The body stops AT the surface; leaves dent and burst. | The `Hedge` `hits` prop plus `LeafBurst`. | |
| **Lying on tracks or ground** | The sleeper stays in one pose between shots; nothing intersects the rails; it's lifted over the rail when dragged. | A ground function for the ballast, sleepers and rails. | |
| **Holding things** (a bag, paper, cup) | Bags really open (zip, an opening, an inside); the hand goes INTO the opening; paper comes out folded, unfolds and has readable writing; putting it back is shown. Cups are put down on a surface and stay there. | The SetsD zip bag and folded referral paper. | |

## 2 · Floors, stairs and contact with the ground ([[nothing-in-the-floor]])
- **Nothing sinks into or floats over any surface:** feet, tyres, chair or bed legs, props.
  - Every set with raised surfaces exports `groundAt(x, z)`: sidewalks and curbs, porches, steps, rugs, mats, ballast.
  - Everything placed in those sets reads its height from it: `groundFit` for people; `groundLift` for poses staged on flat ground, so runs keep their airborne frames; `bikeOn` for bikes crossing curbs.
- **Stairs:** each foot lands in the middle of a tread, one step at a time, with the hand on the banister. Headroom is checked, so the head never goes into the ceiling or soffit. Use a stair ground function (`stairGround`, `hallGround`).
- **Sitting on a low wall:** see section 1 (the regression came from raising the person without moving the hips forward).

## 3 · Vehicles
- **Every bike is a whole bike:** frame, fork, handlebars with grips, saddle, cranks, pedals and chain (`Bike6`). The rider's hands are on the grips, hips on the saddle, feet on the pedals (`RIDER6` + `riderPose`). A fallen bike gets `steer` so no bar end goes into the ground.
- **Getting on a bike is shown:** walk to its left side, then `mountPose(u)`, filmed from the front three-quarter or side.
- **Every car is a real car** (`Car6`): body, wheels, see-through windows, seats, dashboard, steering wheel, and doors that swing open. The driver is at `CAR6.driverRoot` in `drivePose`, with both hands on the wheel at 10 and 2.
- **Getting in or out of a car is shown:**
  1. Open the door first (`doors.fl` 0→1).
  2. Run `enterCar(u, side)`.
  3. Close the door.
- **Cars stay on the road:** they park at the curb in the road, never on the sidewalk. They drive in the lanes, never through other cars; to leave a parking lot, reverse out of the bay and drive along the lane.
- **Mopeds and scooters** are fully built and ridden in the road lane.
- **Trains** have steel wheels on the rails.
- **A vehicle's sound ends when it leaves** (see section 7).

## 4 · Doors, rooms and sets ([[sets-full-of-detail]], `knowledge/craft/street_environments.md`)
- **A door opens before anyone passes through it,** then closes. Automatic doors slide (SetsE `CareHomeFront`); exits have real double doors with push bars. Skirting boards stop at doorways.
- **An open door, gate or window shows a furnished space or a view.** Never a blank wall: a rolling shop gate opens onto a shop.
- **Sets are complete from every camera angle used:**
  - No blank white, no empty sky, no black void behind anyone.
  - Exteriors follow the real street layers: road → parking lane → curb → furniture zone (trees, lamps, benches, hydrants) → sidewalk → shopfronts.
  - Vary the place types: main street, suburb, park, market, school front, hospital entrance.
- **Furniture never blocks a path a character takes** (re-lay the room rather than let someone run through the TV).
- **Wet things look wet** (a book in a puddle: blue-grey pages, a sheen, ripples, drips), not black.

## 5 · Camera and framing
- **No shake on stairs or walks:** the camera follows a smooth line (the stair's pitch), never each step.
- **Foreground heads stay small:** in over-the-shoulder shots the near head is a small shape at the frame edge (≤ ~15%), never a dome covering the subject. Mirror shots: the camera is high behind, looking over the head.
- **Cameras never sit inside** a wall, car, tree, head or building (they were found inside a car and a brick wall).
- **Screens and diagrams the story needs** (a scan, a phone, a letter) are framed clear of equipment and heads.
- **Nobody runs on the spot:** a running character travels, and the camera trails slower than they run.
- **Dark scenes stay readable:** add fill light so the faces read.

## 6 · Cinematic treatment the user expects
- **The first 3 seconds hook:** motion plus sound from frame 0 (lightning and thunder, a frozen moment, a red clock). See `knowledge/STORYTELLING_HOOKS_GUIDE.md`.
- **Big story moments get the full treatment:**
  - A snap or slow push-in zoom.
  - A cut to the face.
  - Slow motion and freezing.
  - An orbit or dolly zoom.
  - A colour change.
  - A doom hit, a sub drop or a heartbeat.

  Examples: the market reveal, "One of them is you", the door "Your boy!" push-in.
- **Scene changes get a transition:** a whip, a zoom-through or a white flash. Never a hard jump between places.
- **Emotion is visible:** tears really run (`face.tears`); reactions change on screen (shock, then denial).
- **The title is spoken and cinematic:** see [[cinematic-spoken-title]].
- **Every shot's camera moves;** slow motion gets effects (bursts, debris, shatter).

## 7 · Sound (see [[bg-sound-levels]])
- **Check an effect's length before cueing it:** library "one-shots" can be loops (footsteps 24 s, heartbeats 10–40 s, ticks 23 s). `mix.py` cuts every one-shot to `keep_s` (else 8 s). Single steps are cut into `sfx_gen/step1–4.wav`.
- **Sounds end with their source:** a train or truck stops when it has passed.
- **Ticks are short and quiet.**
- **Music sits low under speech,** with deep ducking.

## 9 · Added from the Episode 07 first-minute review (2026-10-25)
| Situation | The rule | How | Check |
|---|---|---|---|
| **A hook built around a special moment** (a freeze, a power, a twist) | Open on the real event in motion at full speed first: a speeding car, a fall. THEN the special moment hits. The viewer must see what's being stopped. | 1–2 s of real-time action with full sound, then a speed ramp into the effect. | Watch the first 3 s: is there motion and sound before the effect? |
| **Getting someone out of a vehicle** | Open the door on its hinge, reach in, press the belt release (show the buckle), support the head and body, draw them out through the opening. Never pull through glass or a closed door. | `Car6` doors; `reachArm` onto the buckle and the body. | Stills through the extraction. |
| **Carrying a person** | A real carry: cradled against the chest, one arm under the back or shoulders and one under the knees, both hands ON the body, head on the shoulder, limbs hanging naturally. The carrier walks with weight, then crouches carefully to set them down. Never a body fused to the hands. | `reachArm` targets on the carried body; carrier pose with lean-back and slower steps. | Side and front stills; no intersections. |
| **Rain** | When rain falls, the ground is wet: glossy reflections, puddles with ripples, splashes on the road, water running along the curb. In frozen rain, splash crowns hang over puddles. | FreezeFX `Splashes`, `FrozenCrowns`, reflective ground. | Wide and low stills in rain. |
| **An accident or mishap** | Show exactly what goes wrong, close and in slow motion (a foot slipping on a wet board), before the consequence. The cause must be obvious. | A close insert plus a speed ramp. | Can a viewer name the cause from the picture alone? |
| **Physical props behave physically** | A springboard flexes and bounces; a jump is natural, with no impossible turns mid-air. | Animate the board's bend; keep the body's rotation continuous. | Dense stills through the action. |
| **Key hand actions** (grabbing a rail, a lever, a hand) | Show them in a close-up insert (fingertips, the grip tightening, the pull) so the action is obvious before anyone reacts to it. | A dedicated insert shot. | |
| **Crowds** | Variety: body types, ages (kids to elderly), hair, hats, glasses, team shirts and jackets, flags, phones up, seated and standing, varied poses. React as a crowd (a held breath = a collective inhale, hands to mouths, half-rising), not identical figures. The venue is well defined (banners, a judges' table, a scoreboard with names, officials, a ceiling with lights). | Several look sets plus per-extra random variation. | A crowd still at full size. |

## 8 · The checklist before showing the user anything
1. For every shot, run dense stills (every 0.1–0.25 s through action) and look at **every** frame for:
   - merges (heads, bodies, hands, beds, chairs, cars, hedges, bags);
   - floor contact;
   - blank backgrounds;
   - foreground heads blocking the subject;
   - a camera inside geometry;
   - doors opening;
   - hands on grips and wheels.
2. Take low-angle stills wherever someone or something stands on a raised surface or crosses a curb.
3. Take side-on stills for every sit and every lie.
4. Watch the hook's first 3 seconds and the big moments for the full cinematic treatment.
5. Check every one-shot effect's length; check every sound ends with its source.
6. Only then render.

Related: [[anatomy-and-staging-rules]], [[nothing-in-the-floor]], [[sets-full-of-detail]], [[no-explainer-fillers]], [[render-across-sessions]].

## 10. Episode 07 full-film review (coordinator, 2026-10-26)
- **Hood-up face.** The hood's face opening used to run open under the chin, so close-ups showed the black head ball and the neck in a wedge ("Pac-Man" face). Fixed in `cam3d/Hair3D.tsx` (HoodUp): an oval opening round the face only, closed under the chin, with a full rim. Check: one front and one 3/4 close-up of any hood-up character.
- **Two people touching (drag, carry, lean, head on shoulder).** Heads never merge. Keep a visible gap or a side-by-side touch in every frame; check with close stills of every contact frame.
- **Passing a frozen person.** Duck or step round; never through their body or umbrella.
- **Sitting down.** The seat lands ON the ground or seat; no frames with the pelvis floating. Check low side-on stills through the whole sit-down.
- **Small objects at a head (a ball, a phone).** Keep sky or space between the object and the head so the action reads; the fingertip visibly meets the object.
- **The loved one's big moment** (Maya on stage) gets her own framing; never lose her in a crowd.

## 11. Episode 07 v1 full-film review (the user, 2026-10-26)
- **The spoken title is a movie moment.** The music that leads into it keeps playing through it (never change the music at the title), LOUD (no deep duck), with a hit on the first word. The animation needs a strong camera move, dramatic light and a styled reveal of the letters. Check: watch the 5 s around the title with sound.
- **Jitter (shaking limbs, popping poses).** Stills at 15/50/85 % miss it. Check runs of consecutive frames (every frame for about 1 s) through every walk-up, jump, bite, grab and sit; smooth any snapping IK target or flipping pose.
- **Held props (spoon, bullet, marker, gun, umbrella).** The prop is attached to the hand, fingers wrapped round it, at a natural angle. A spoon stops AT the open mouth. An umbrella's canopy sits clearly above the head. Check close stills of every grip.
- **Flicker on ground and roads.** Overlapping layers (road, paint, wet sheen, puddles, ripple discs) must not z-fight; glints and splash sprites must not pop on and off between frames. Check consecutive frames from a low camera.
- **Vaults and climbs.** Hands plant ON the surface and the body clears it with space.
- **Red marks on faces** read as a bloody mouth: no nosebleed lines.
- **Dialogue must be motivated by what the character sees** (Maya sees the grey hair before she asks why he looks older).
- **Every scene has a music bed** (low in calm moments); check for silent stretches in the music-only mix.
- **No synthetic short loops for crowds or applause** (`sfx_extra/crowd_murmur.wav`, `applause.wav`): they crackle like a broken radio. Use real recordings (`crowd_murmur_01/02`).
- **A sequel teaser uses the same title plus "PART 2"** ("WHAT IF YOU COULD PAUSE TIME? PART 2"), not a new question.

- **Split screens / extra viewports must restore the camera** (Ep12, 2026-10-31): a `useFrame` that renders several viewports changes `camera.aspect`; restore `aspect = W/H` and `updateProjectionMatrix()` at the end, or every later shot in that render tab comes out stretched sideways ("scrambled"). Single stills will not show it; check a sequence that starts inside the split.

- **Concat timebase** (Ep14): render parts that were re-encoded by ffmpeg use timebase 1/90000, untouched Remotion parts 1/15360; a mixed concat gives a wrong duration (4006 s for an 11-minute film). Remux every part with `-c copy -video_track_timescale 90000` before `ffmpeg -f concat`.

## Whispered character lines come back far too quiet (Ep15, 2026-11-04)
Fish whisper takes ([whisper] tags) measured ~17 dB under the narrator, and assemble_cast does no level matching while `level_match_db` is 0. The user: "TOOOOO low".
After assembling, measure each speaker's mean LUFS per line against the narrator (ffmpeg ebur128 on each chunk span) and set that voice's `gain_db` in
config/voices.json so characters sit within ~2–3 dB of the narrator. Do it before the first-minute mix, every episode.

## Changing one gap late: shift, don't re-measure (Ep15, 2026-11-04)
Re-running Whisper after re-assembly jitters word times everywhere (Ep15: one word in the approved first minute moved 0.44 s). When only a gap changes,
re-assemble (for the master and the chunks), then keep the previous timing.json words and shift the beats after the gap by the measured delta.
