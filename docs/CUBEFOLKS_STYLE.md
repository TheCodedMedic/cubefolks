# Cubefolks style: what the references do, measured (2026-11-13)

Sources analysed so far:
1. **The owner's sample** "the mimic" (`inbox/reference_shorts/owner_sample_mimic.mp4`, 61.3 s, 720x1280, 30 fps; the owner's own
   video, study only). Measured with ffmpeg scene detection (threshold 0.2, checked by eye), Whisper word times, first/middle/last
   frames of every shot and 6 fps strips of eight busy shots.
2. *(3-5 more references the owner will send: add a section per video below, then re-rank the top 10.)*

Compared against what we shipped: Short 6 "The Reflection That Blinks First" (`docs/review/short06_every_second.jpg`).

---

## 1. The sample in numbers

| | The sample | Short 6 |
|---|---|---|
| Length | 61.3 s, 281 words | 42.4 s, 180 words |
| Narration pace | **4.6 words/s**, one pause > 0.35 s in the whole video (0.42 s at 11.6 s, after the rule is set up) | ~4.3 words/s |
| Shots | **54**, average **1.13 s** (shortest 0.57 s, longest 1.9 s) | ~45 |
| Transitions | Hard cuts. One motion-blur smear on frame 0 (the loop seam). No whips. | Hard cuts |
| Shots with a character visibly moving (walk, gesture, arm, crowd, expression change) | **~34 of 54 (63%)** | ~8 of 45 |
| Shots where someone walks (in, out, across, toward camera, up steps) | **9** | ~1 |
| Shots with 3+ characters | **14** (crowds of 15-40 in 5) | 6 (the family) |
| Shots with no character at all | 6 (posters, empty classroom, church exterior, aerial street) | ~8 (empty rooms, shoes) |
| Facial expression changes inside a shot | ~10 (on the words: worried to smile, mouth opens on "said", eyes close on "whistle") | ~3 |
| Captions | One word, white, black outline, heavy rounded sans, **~70% down** the frame; a few words in **yellow or pink** (you, you're, people) | one word at 62%, yellow highlights |
| Music | **Loud**: the bed is only ~2-3 dB under the voice in the gaps (mean −20 dB vs −17.8 dB with voice). Light, creepy-cute music box/piano. | 15 dB under (house rule) |

## 2. Shot by shot

Cut times from scene detection (s). Size: W wide, MW medium-wide (whole bodies), M medium (head to knees), MC medium close (chest up),
C close. "Moves" = what the characters do; "Cam" = what the camera does.

| # | t | Words | Size | Picture | Moves | Cam |
|---|---|---|---|---|---|---|
| 1 | 0.0-2.0 | In this town, there's a shape-shifting mimic. | MW | White clapboard house, porch, mailbox. A girl (red top, long black hair) **walks** along the path to the mailbox; an old man in black **walks across** the foreground | 2 walking | Frame 0 a motion-blur smear (loop seam), then a **sideways truck behind a tree trunk** (the trunk wipes across the frame) |
| 2 | 2.0-3.5 | If it eats you, it becomes you. | M | A man in a tan suit behind a picket fence. Face **worried → (a black mimic with a toothy grin lunges up) → smiling**: the mimic took him | expression swap + creature pop | slight push |
| 3 | 3.5-4.3 | It looks like you, | M | A woman (blue jacket, long hair, back to us) hugging/talking to the tan man at a garage | sway | static-ish |
| 4 | 4.3-5.3 | it talks like you, | W | The tan man and a kid in green on a front path, talking | small idle | slow push |
| 5 | 5.3-6.7 | and nobody can tell the difference. | M | The tan man **walks toward camera** down a sidewalk, legs swinging hard; a woman stands behind; trees, crosswalk | walk toward lens | **dolly back** with him (walk-and-talk lead) |
| 6-7 | 6.7-8.6 | But it can only be one person at a time. | MW → M | Night (deep blue sky, cool grade). The girl in red behind a picket fence, people at the frame edges | idle | push in |
| 8 | 8.6-9.9 | So when it wants to be someone new, | W | Night: a row of 3 neighbours along the fence | idle | slow push |
| 9 | 9.9-11.1 | the person it was pretending to be, | M | The girl in red, face **smile → blank** | expression | push |
| 10 | 11.1-12.2 | just disappears. | MW | The girl, then **the same framing empty**: she is gone (a cut-away vanish) | vanish | static, held |
| 11 | 12.2-12.9 | Every few weeks, | M | Three MISSING posters stacked on a pole | — | slight drift |
| 12 | 12.9-14.3 | someone in town vanishes. | W, **top-down** | ~25 townsfolk **milling on a lawn** in front of a house (drone view) | crowd moving | slow descent |
| 13 | 14.3-14.9 | And when they do, | MW | Three townsfolk by a fence | idle | drift |
| 14 | 14.9-16.9 | we know that person was the mimic all along, | C | A MISSING poster: the drawn face **changes from a smile to a toothy grimace** | poster face swap | push |
| 15 | 16.9-18.3 | and that now, it's somebody else. | MW | Two men talk by a fence | idle, small gestures | static |
| 16 | 18.3-19.3 | We just never know who. | W | 5 people in front of a house (incl. the narrator in the bee shirt) | idle | slow push |
| 17 | 19.3-20.0 | Last March, | W, **aerial** | The whole town: rows of houses, a long road, the church spire at the end | — | crane |
| 18 | 20.0-21.3 | it was our neighbor, Mr. Greene. | M | Mr. Greene (white hair, green sweater), ^ ^ happy eyes, by his gate | idle | slight push |
| 19 | 21.3-22.6 | One morning, his house was empty, | MW, OTS | The narrator and mom from behind, looking into his **open front door** | — | slow push |
| 20 | 22.6-23.9 | and his coffee was still warm. | MC | The narrator (grimace) at his kitchen table, steaming mug | expression | static |
| 21-24 | 23.9-27.9 | He'd waved at me from his window every day for months. And the whole time, that wasn't really him. | M (through glass) | Mr. Greene **waving in his window**, 4 set-ups (two angles, day light and cooler light), ^ ^ eyes then plain smile | **wave loops** | push in through the glass |
| 25 | 27.9-28.7 | That afternoon, | W, low | The church front, steeple, crowd at its feet | — | tilt up |
| 26 | 28.7-29.7 | the whole town met at the church | MW | **People walking up the church steps and in through the door**, one after another | 4+ walking | static |
| 27 | 29.7-31.3 | to figure out who the mimic had become. | W | Church interior: ~40 seated in pews, red carpet aisle, chandeliers, cross | heads turning | slow push |
| 28 | 31.3-32.1 | But nobody could. | M | The pastor in black **spreading his arms** (shrug) at the pulpit | gesture | static |
| 29 | 32.1-34.0 | After that, I started noticing little things. | M | The narrator (bee shirt, spiky blond) **walking** along a sidewalk past houses, people pass behind | walking | **tracking** beside |
| 30 | 34.0-35.0 | Our crossing guard said, | M, low | The crossing guard (hi-vis vest, cap) **raising a STOP sign**; kids walk past the lens | arm raise + 2 walking | static |
| 31 | 35.0-35.7 | "See you tomorrow," | MW | Guard and narrator at a crossing with a school sign; guard **lifts the sign**, mouth opens | gesture, talk | static |
| 32 | 35.7-36.5 | like he always does. | W | Tiny narrator **walking across** a long tree-lined crosswalk | walking | static (the scale is the shot) |
| 33 | 36.5-37.8 | But this time, he leaned in | MW | Guard **leans in** toward the narrator | lean | slight push |
| 34 | 37.8-39.3 | and whispered, "If you're still you." | MC two-shot | Faces side by side: guard's **mouth open** on the words, narrator's **eyes go wide** | expressions on words | slow push |
| 35 | 39.3-40.0 | Then he laughed. | MW | The guard **rocks back** laughing | body laugh | static |
| 36-38 | 40.0-43.0 | A week later, my teacher, Mrs. Kerr, started whistling in class. | W → M | Classroom (green chalkboard with squiggles, desks, clock), then Mrs. Kerr (glasses, bun) at the board, **turning from the board to the class** | turn | push |
| 39 | 43.0-43.9 | I knew that song. | M | Narrator at a desk: smile → **frown with teeth** | expression | static |
| 40-41 | 43.9-45.9 | Mr. Greene used to whistle it when he watered his lawn. | M | Mr. Greene with a green watering can, eyes **close** as he whistles, water stream | arm tip, expression | static |
| 42-44 | 45.9-49.9 | I told my mom, and she stopped chopping for a second. Then she said, "Lots of people know that song." | OTS → M → M | Kitchen: mom **chopping carrots** with a knife (the arm goes up and down), **stops**, then talks with a small smile | repeated chop, stop | push |
| 45-48 | 49.9-52.5 | Three weeks later, Mrs. Kerr vanished. She'd been the mimic. | M → C → M → W | Back of a classmate's head, **her empty desk and chair**, the narrator scared at his desk, the empty classroom | expression | drift |
| 49 | 52.5-54.3 | The day before, she'd kept me after class, | W | Empty classroom, doors closed | — | slow push |
| 50 | 54.3-55.0 | closed the door, | M | Mrs. Kerr **pushing the door shut** (arm out, the door swings) | arm + door | static |
| 51 | 55.0-56.9 | and asked if I ever got scared at night. | M | Mrs. Kerr **leaning in close** over the narrator's desk | lean | static |
| 52 | 56.9-58.2 | The whole town went back to the church. | W, night | The church at night, door open, light inside | — | slow push |
| 53 | 58.2-59.0 | And when I looked up, | M | Narrator in a pew, **looks up**, mouth opens | head tilt | static |
| 54-55 | 59.0-61.3 | everyone in the room was staring at me. Then, all of a sudden, | W → M | The whole congregation **turned in their pews, every face toward camera**; push into the front rows | crowd turned | push in |

## 3. What the sample does that we don't (by category)

**Motion.** Something moves in nearly two shots out of three, and the motion is the classic game's own: the stiff
scissor walk (legs swing about ±40° as solid blocks, arms opposite, no knees, a small bob), arms that swing up from the shoulder as
one block (wave, stop sign, chopping, door push), whole-body leans (whisper, laugh), heads that turn, and crowds that mill, file in
and turn. Nothing is subtle: a gesture is a big readable arm arc. Characters enter and leave frame (walk past the lens, up the steps,
across the street). Short 6's people mostly stood with arms down.

**Camera.** Mostly calm and close to static, but with **game-like camera positions**: a drone/top-down view of a crowd, a high
aerial down the whole street to the steeple, a low angle up at the church, a sideways truck past a tree trunk, a lead dolly back
in front of a walker, a two-shot from the side for the whisper. It feels like a player recording with the free camera.

**Story shape.** Line 1 is the town's rule as plain fact ("In this town, there's a shape-shifting mimic."), lines 2-6 explain the
rule in short "it ... it ... it ..." steps, then **"Every few weeks"** (the rule's routine), **one named neighbour** as the proof
(Mr. Greene, his warm coffee, his wave), **the community scene** (the whole town meets at church; "But nobody could"), **"After that,
I started noticing little things"** (the re-hook at 52%), three small clues from three named people (the crossing guard's whisper,
Mrs. Kerr whistling Mr. Greene's song, mom stopping mid-chop), a second vanishing that proves the clue, a creepy flashback (kept after
class, door closed, "do you get scared at night?"), the **community scene again** with the turn on the narrator (everyone staring at
me), and a cliffhanger line ("Then, all of a sudden,") that runs into line 1. Dialogue is quoted in the narration ("See you
tomorrow"). The narrator never explains; the viewer connects the clues (mom may be the mimic; the town thinks *I* am).

**Look and game feel.** Classic default-avatar clothes (plain tees, hoodies, suits, hi-vis vest, a pastor's black), smooth
plastic heads with decal faces that **change expression on the words**, simple hair pieces and caps, white clapboard houses with
dark shutters, picket fences, bare winter trees, flat blue sky with puffy clouds, the white church with a steeple and a red aisle,
a classroom with a green board of squiggles, a kitchen with tiles and canisters. Props are chunky and readable (STOP sign,
watering can, carrots and knife, coffee mug, MISSING posters). Night is deep blue with bright faces.

**Captions.** One word at a time, white with a black outline, heavy rounded sans, about 70% down the frame, a few highlight colours.

**Sound.** The music bed is loud (a few dB under the voice), the narration nearly continuous; pauses are rare and short.

## 4. Ranked: the 10 changes that would most raise our Shorts

1. **Make two shots in three move.** Every set-up gets at least one character action that lasts the shot: walking in/out/across,
   a wave, a lean, a chop, a door push, a head turn, a laugh. Build it once as a motion library (`video/src/blocky/Motion.ts`,
   task 2) so every shot can call `walk`, `wave`, `lean`, `chop` etc. with word-anchored times.
2. **People enter and leave frame.** At least one walk-in, walk-out or walk-past every 5 s; feet planted, the stiff toy scissor
   walk, true profile or three-quarter, paths along sidewalks, up steps, through doors.
3. **Crowds that do something.** One community scene per Short (church, assembly, town meeting, block party) with 20-40 people,
   who file in, sit, and at the turn **all turn to stare at the camera**. Cheap, instanced, low-detail.
4. **Expressions that change on the words.** Every speaking or reacting character changes face at least once inside the shot (mouth
   opens on a quoted line, smile drops to blank, eyes close on "whistle"). A `talk(t)` helper that flips mouth shapes on word times.
5. **Story: the sample's shape.** Rule in line 1 → the rule's routine ("Every few weeks") → one named neighbour as proof with two
   sensory details → the town meets → "After that, I started noticing little things." → three clues from three named people,
   each with a quoted line → a second event that confirms → the community scene turns on the narrator → a cliffhanger loop line.
   Written up as the template in `knowledge/CUBEFOLKS_SCRIPT.md` (task 3).
6. **Game-camera views.** One drone/top-down crowd shot, one high aerial of the whole town to the landmark, one low angle on the
   landmark, one lead dolly in front of a walker, one truck past a foreground tree per Short, among the calm mediums.
7. **Readable chunky props in hands, used.** STOP signs, watering cans, knives and carrots, mugs, flashlights, backpacks: held in the
   hand and animated (chopped, raised, poured), not just carried.
8. **Pace: 4.5-4.6 words/s, almost no gaps** (gap_default 0.08-0.1), a new shot every ~1.1 s, a couple of 1.5-2 s holds on the
   key image (the waving neighbour, the staring crowd).
9. **Default-avatar wardrobe and more extras.** More varied townsfolk (suits, hoodies, vests, uniforms, caps, hair pieces in
   browns, blondes, gingers), more people per street shot (2-5 instead of 1), a recognisable job costume per named character.
10. **Louder, cute-creepy music.** The sample's bed sits only a few dB under the voice. Our 15 dB rule is the owner's; propose
    trying 8-10 dB under on the next Short with a music-box/piano track, and let the owner pick by ear.

Also: captions down to ~70% of the height (from 62%); keep the one-word captions with a highlight colour on "you"/names.

---

## 5. More references

*(Add one section per reference Short the owner sends, with the same table and numbers; then re-rank section 4.)*
