# Short 6 "The Reflection That Blinks First": parallel build contract (blocky style)

The owner liked the blocky test's bodies and blocks. Three asks for this Short:
1. **Faces that look like real classic blocky-game (Roblox-style) characters**: flat black decal faces printed on a rounded-cylinder
   head: two small solid black oval eyes (no whites, no outlines, no pupils), a thin black curved smile, simple variants (see Expr).
   Drawn by us (no copied decal files, logos or branded items), but the look must read instantly as that classic style.
2. **The owner's own voice**, cloned from their Roblox sample: speaker `R` (done, frozen).
3. **The sample's storytelling and look**: study `notes/short06/ref/sample_contact.jpg` (one frame every 2 s of the owner's sample).
   First-person kid narrator; a new shot about every 1-1.3 s, mostly **hard cuts**; cameras mostly calm (slow push, slight drift,
   over-the-shoulder, a gentle handheld sway), never wild; medium shots that show whole blocky bodies; suburban sets with **real
   textures** (white/grey clapboard siding, shingle roofs, picket fences, mowed grass, concrete sidewalk, wood floors, kitchen tiles),
   **soft overcast daylight** with a blue sky and white clouds, deep-blue nights; one-word captions (white, dark outline).
   This must look clearly better than the blocky test (flat bright toy colours, no textures): that is the point of this Short.

## Audio (final, frozen; never re-voice)
`episodes/06_reflection/` (14 beats, 180 words, voice ends 41.85 s, master 42.4 s; rebuild the WAV with
`python3 pipeline/assemble_cast.py episodes/06_reflection`). Timing: `video/src/short06_blocky/timing.json` (makeTiming format).
Never type a time in seconds: every cut, expression, caption, pop and sound comes from `at(beat, "word")`.

| b | starts | line |
|---|---|---|
| 1 | 0.05 | In my town, if your reflection blinks before you do, you have three days left. |
| 2 | 3.80 | Nobody knows where those people go. Their beds are made, and their shoes are still by the door. |
| 3 | 7.97 | So every morning, my whole family stands at the bathroom mirror and blinks together. |
| 4 | 11.62 | Last week, it was Jenny from next door. She told me at recess, and she laughed, like it was a joke. |
| 5 | 16.08 | On day three, her bike was still on the lawn, and her house was dark. |
| 6 | 19.17 | After that, I started noticing little things. |
| 7 | 21.33 | My dad started shaving in the kitchen, with no mirror at all. |
| 8 | 24.17 | My mom covered every mirror in the house with towels. She said it was for the dust. |
| 9 | 27.89 | And at dinner, my little brother wouldn't look at his spoon. |
| 10 | 30.18 | Tonight, I pulled the towel off the bathroom mirror. |
| 11 | 32.23 | All three of them came to the doorway behind me. |
| 12 | 34.29 | But in the mirror, I was standing there alone. (the reveal, ends at 85%) |
| 13 | 36.36 | They were never blinking with me. They were watching me blink. |
| 14 | 38.88 | And this morning, for the first time, my reflection blinked first. (loops into line 1) |

## Cast (Looks in `video/src/short06_blocky/cast.ts`, owned by SHOTS-A; SHOTS-B imports it)
Pale grey-white or light skin like the sample (`#e9e4dc`-ish), and some warm skin tones; clothes with fabric texture.
- **ME** (narrator kid, ~10): yellow-and-black striped shirt, black pants, messy blond spiky hair; pyjamas (blue `pajamas` pattern) at night.
- **DAD**: green plaid sweater, grey slacks, short brown hair. **MOM**: pink cardigan, dark jeans, brown hair in a bun.
- **BRO** (little brother, ~6, scale 0.75): red hoodie, short dark hair. **JENNY** (~10, next door): purple shirt, long black hair, a red bike.
- Classmates at recess (3-4, varied), a teacher on the yard (optional).
The family's faces: `smile` in public, and in beats 11-14 they go `stare` (wide black eyes, no mouth, never blink). ME uses everything.

## Who owns what (each on its own branch, pushing only there; commit and push every ~10 minutes)
Everything in `video/src/blocky/` (shared parts) or `video/src/short06_blocky/` (this Short). 1080x1920, 30 fps. Units: the rig is 5
units tall (scale 0.32 = 1.6 m), feet on y=0. Base branch: `claude/wizardly-rubin-98ysz8` (it already has the blocky test parts).

1. **RIG** (`claude/s06-rig`): `video/src/blocky/BlockRig.tsx`, `Accessories.tsx`. Keep `BlockChar` props, add `hold?: { R?: React.ReactNode; L?: React.ReactNode }`
   (a prop parented to the hand), the new Pose fields, hair `long`/`ponytail`, `glasses`, `pajamas` pattern, and **fabric/plastic
   materials** (subtle canvas noise on clothes, slightly glossy plastic skin like the sample). Ready-made poses exported from BlockRig:
   `POSES = { stand, wave, point, shave, eat, pullTowel, arms crossed "cross", hands on hips "hips", recoil "recoil", sit }` (Pose
   objects), and `blinkCurve(t, seed)` (0..1). Head proportions as in the sample: slightly wider than tall, rounded edges.
2. **FACE** (`claude/s06-face`): `video/src/blocky/BlockFace.tsx` only: `makeFaceTexture(expr: Expr, blink?: number): THREE.CanvasTexture`
   in the classic blocky-game style above, every Expr in types.ts; blink squashes the ovals to thin lines; textures cached per
   (expr, blink rounded to 0.1). Add `FaceSheet` (a 1080x1920 still composition `BlockFaceSheet` in `video/src/blocky/FaceSheet.tsx`, all
   expressions on heads, front and three-quarter) and render it to `notes/short06/face_sheet.png`; tell the coordinator when pushed.
3. **LOOK** (`claude/s06-look`): `video/src/blocky/Look.tsx` and `video/src/blocky/Textures.ts`. **Push Textures.ts first, within ~10
   minutes**, because both set builders use it: `export function tex(kind: "siding" | "sidingGrey" | "shingle" | "brick" | "grass" |
   "concrete" | "asphalt" | "wood" | "woodDark" | "tile" | "carpet" | "wallpaper" | "fabric" | "plaster", repeat?: [number, number]):
   THREE.Texture` (procedural canvas textures, cached, sRGB, believable at phone size) and `export function mat(kind, color?, repeat?)`
   returning a `meshStandardMaterial` props object. Then `BlockLights` with `time: "day" | "morning" | "dusk" | "night" | "interior" |
   "interiorNight" | "bathroom"` (soft shadows, max 3 lights + hemisphere, a face fill so faces stay bright in night grades) and
   `Sky` (day: blue with soft white clouds like the sample; night: deep blue with a moon glow). Also a tiny `Grade` overlay component
   (a very light vignette ONLY for night/interiorNight; none in the day).
4. **TOWN** (`claude/s06-town`): `video/src/short06_blocky/Town.tsx`: `MyStreet: React.FC<{ time }>` (two-storey clapboard houses in
   whites and greys with dark shutters, porches, picket fences, mailboxes, lawns, sidewalk, road, bare and leafy trees, lamp posts;
   export `HOME: V3` (our front door), `JENNY_HOUSE: V3` (next door), `JENNY_LAWN: V3`); `JennyHouseDark` (the same street at night,
   Jenny's house unlit, every other window lit, her red bike `Bike` lying on her lawn: export `Bike`); `SchoolYard: React.FC<{}>`
   (recess: a brick school wall, chain fence, a swing set, a hopscotch court; export `YARD_SPOT: V3`); a `MissingPoster` prop (a paper
   on a pole with a blocky face drawing and "MISSING", JENNY's look) for beat 5/6. Use `tex()`/`mat()` from Textures.ts.
5. **HOUSE** (`claude/s06-house`): `video/src/short06_blocky/House.tsx`: interiors with textures, warm and lived-in like the sample:
   `Bathroom: React.FC<{ towel: number; mirrorWorld: React.ReactNode }>` with a big wall mirror over a sink: the mirror shows a **fake
   reflection**: a mirrored copy of the bathroom behind the glass (scale x -1 room) where the shot places whatever it wants via
   `mirrorWorld` (so the reflection can blink on its own, and the family can be missing from it); `towel` 0..1 = a towel hanging over
   the mirror being pulled off (1 = gone). Export `MIRROR: { center: V3; w: number; h: number }`, `SINK_FRONT: V3` (where people stand),
   `DOORWAY: V3` (behind them). `Kitchen` (sink by a window, no mirror; dad shaves here; export `KITCHEN_SINK: V3`), `DiningRoom` (table
   for four, plates, a `Spoon` prop export; export `SEATS: V3[]` and `TABLE: V3`), `Hallway: React.FC<{ towels: boolean }>` (framed
   mirrors along the wall, each covered with a towel when `towels`), `Bedroom` (Jenny's empty room: bed perfectly made, shoes by the
   door; export `BED: V3`), and props `Razor`, `Towel`, `Shoes`. Use `tex()`/`mat()` from Textures.ts.
6. **SHOTS-A** (`claude/s06-shots-a`): `video/src/short06_blocky/cast.ts` (push it first, within ~10 minutes) and `ShotsA.tsx`:
   `export const SHOTS_A: Shot[]` covering beats 1-7 (0 to `P(8)`), about 20 set-ups. Frame 0 must already tell the hook: ME at the
   bathroom mirror, close, with the reflection's eyes **already mid-blink while ME's are open**, pop "3 DAYS" lands in beat 1 on
   "three". Then: empty rooms with made beds and shoes by the door (b2); the family of four at the mirror blinking in sync (b3, a pop of a
   tally or "BLINK" ok); recess with Jenny laughing (b4); day three: dark house, bike on the lawn, a MISSING poster (b5); ME looking
   around warily on the street (b6); dad shaving at the kitchen sink by the window (b7).
7. **SHOTS-B** (`claude/s06-shots-b`): `ShotsB.tsx`: `export const SHOTS_B: Shot[]` covering beats 8-14 (`P(8)` to `END`), about 17
   set-ups: mom hanging towels over the hallway mirrors (b8); dinner, brother staring away from his spoon, ME seeing it (b9); ME at
   night in pyjamas pulling the towel off (b10); the three of them appear in the doorway behind ME, smiling (b11); **the reveal**: the
   mirror shows ME alone (b12), the real doorway full; cut between real room and mirror; the family's faces go `stare` (b13); last shot:
   ME's own reflection blinks while ME's eyes stay open, hold, and the final frame must cut cleanly into frame 0 (b14 → b1, the loop).
   On-screen question pop in the last 3-4 s (never spoken): "Would you look?".
   SHOTS-A and SHOTS-B import parts from `./parts06` (the integrator writes it; until then import builders' files directly, or stub).
8. **SOUND** (`claude/s06-sound`): `episodes/06_reflection/cues.py` (+ `sfx06.py` for synthesised effects), from `words.json` and the
   shot cut list in `video/src/short06_blocky/cuts.json` (SHOTS-A and SHOTS-B each write their half to `cuts_a.json`/`cuts_b.json`:
   `[{id, t0, enter}]`; read whichever exist, re-run when both land): suburban morning birds, distant kids at recess, crickets at night,
   a fridge hum in the kitchen, a razor buzz on b7, cloth swish on b8 and b10, cutlery clink on b9, a sharp low hit on "alone" (b12), a
   sub drone under b11-14, a soft blink "tick" on every on-screen blink of a reflection, a soft whoosh only on whip cuts, music 15 dB
   under the voice, measured (`python3 -I pipeline/music_level.py episodes/06_reflection/cues.py -15`; use a creepy library pad or
   `sfx/music/tiptoe_across_the_floorboards.mp3`, credited). Then mix: `python3 -I pipeline/mix.py episodes/06_reflection/cues.py episodes/06_reflection/mix.wav`.
9. **INTEGRATOR** (`claude/s06-integrate`): `video/src/short06_blocky/parts06.ts` (one place re-exporting every builder's parts),
   `Short06.tsx` (compositions `Short06Blocky` and `Short06BlockyClean`, registered in `video/src/Root.tsx`), captions (one word at a
   time, white with a dark outline, like the sample: use the kit's Captions with groups of 1), merging all builder branches as they
   land, review (stills of every shot incl. corners, contact sheet of every second, frames 0/15/45 against the hook checklist, a 60-frame
   sequence of the reveal), fixes, then the 10-part render, join, finish, upload, and report to the coordinator.

## Rules for every builder
- Read `CLAUDE.md`, `docs/PRODUCTION_PLAYBOOK.md`, `docs/lessons/short01-owner-notes.md` first (15 minutes at most); then build.
- Only touch your own files. Never re-voice. Never type seconds. Every camera moves (calm). Faces bright. Nothing too close to the lens.
- When your part is pushed and reviewed (render 2-4 stills of your work and look at them), `send_message` the integrator session (its id
  is in your first message) with your branch, head hash and what you exported, and the coordinator `session_01LQP7vwBtF6kFJ2p3c2AWBZ`
  with one line. Then keep improving until the integrator says stop.
- **Never call archive_session** (it needs a human click and stalls you). The coordinator archives sessions.
- No pull requests. Only your branch.
