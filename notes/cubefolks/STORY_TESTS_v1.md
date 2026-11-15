# Four story tests for the channel (v1, 2026-11-15)

Four different kinds of story, to post over the next few days and see which kind the audience wants:

| # | Kind | Working title | Length (est.) |
|---|---|---|---|
| A | **Creepy** (a strange town rule) | The 3 A.M. Ice Cream Truck | ~36 s, 157 words |
| B | **Comedy** (a kid's scheme that escalates) | My Brother Sold Invisible Pets | ~31 s, 138 words |
| C | **Wholesome** (looks spooky, turns sweet) | The Porch Light Code | ~36 s, 159 words |
| D | **Mystery** (kid detective, fair clues) | The Hamster Who Escapes Every Friday | ~37 s, 163 words |

Each Short has the **same production quality** (same cast style, same captions, same pace), so the test compares story kinds, not polish.

---

## Brief for the critic (read this first)

You are reviewing scripts and animation plans for an animated YouTube Shorts channel. Please be blunt.

- **Format:** vertical 1080×1920, 30–50 s (the owner's sweet spot). Animated in a blocky online-game style (boxy toy characters,
  flat black decal faces, suburban towns), built as real 3D in code. A new shot about every 1.1 s, mostly hard cuts, calm
  cameras, one-word captions in the lower third.
- **Narration:** one first-person kid narrator (the owner's cloned voice), about 4.5 words a second, almost no pauses.
- **Story rules we follow:** line 1 is the most surprising thing in the story, stated as plain fact, 10–16 words, no "One
  day..." or year opener. At least two clues planted before the twist, so it feels fair. The twist lands at about 80–90% of the
  runtime; at most a few seconds after it. The last line loops grammatically back into line 1, so a replay feels seamless. An
  on-screen question (never spoken) in the last 3 s to drive comments. Everyday words a 10-year-old understands. Original,
  made-up stories.
- **What we want from you:** (1) Is the hook strong enough to stop a scroll in 1–2 seconds? (2) Does every line earn its place
  (would you cut or merge any)? (3) Are the clues fair and is the twist surprising? (4) Does the loop work? (5) Which of the
  four would you bet on, and why? (6) Line-level rewrites where you have better wording (keep the length within ±15 words).

---

## Shared production notes (all four)

- **Narrator:** speaker `R` (the owner's voice), Fish Audio. `episode.json` voice: lead 0.05, gap_default 0.08, tail 0.6.
- **Captions:** one word at a time, white with a dark outline, at about 70% of the height; highlight colour on names, numbers
  and twist words (listed per story).
- **Motion:** every shot has at least one character doing something (the motion library, `video/src/blocky/Motion.ts`: walk
  paths, turns, sit, wave, point, shrug, lean-in, laugh, chop, head snap, look-around, crowd turn, file-in). **Nothing passes
  through anything** (`Collide.ts` check, zero clipping frames before the render).
- **Framing:** mostly medium and medium-wide (whole bodies or head to knees, faces visible, the place around them), camera
  2.5–5 m away; close-ups only for a face reaction or a key prop. One game-camera shot per Short (drone top-down, aerial street,
  low angle, or a lead dolly in front of a walker).
- **Sound:** ambience per place, effects on actions, a music bed (level the owner is choosing: ~9–15 dB under the voice).
- **Frame 0** already shows the strange thing, in motion, with the hook pop-in fully on screen.
- **Sets we already have:** the suburban street (day/dusk/night: houses, porches, picket fences, sidewalks, lamp posts,
  mailboxes), a school yard, kitchen, dining room, hallway, bedroom, bathroom, church pews, a porch with steps and a door.
  **New pieces each story needs** are listed per story.

Shot tables: **#** shot, **Line** the words it covers, **Size** (W wide, MW medium-wide, M medium, C close), **Camera**, **Who
moves and how**. Cuts land on the first word of each line or on the word named.

---

# A. CREEPY: "The 3 A.M. Ice Cream Truck"

## Script (14 beats, ~36 s)

1. Our ice cream truck only comes at 3 a.m., and nobody's allowed to look.
2. Every night, the same tinkly song rolls down Maple Street, and every curtain on the block stays shut.
3. Last summer, Toby Parker looked.
4. The next morning, he was at the bus stop, smiling, holding an ice cream cone that never melted.
5. He didn't take one bite. Not at lunch. Not at recess. Not all day.
6. After that, I started noticing little things.
7. Mrs. Alvarez had a cone. So did the mailman. So did my teacher.
8. They all hummed that song when they thought nobody was listening.
9. Even my mom stopped asking what I wanted for dessert.
10. Then last night, the song stopped right outside our house.
11. I peeked through my curtain, just a crack.
12. My mom was walking back up the driveway, holding two cones.
13. She knocked on my door and whispered, "One's for you, sweetie."
14. So tonight, I'm going to look. *(loops into line 1: "...look. / Our ice cream truck only comes at 3 a.m....")*

- **Clues before the twist:** the cones never melt and nobody eats them (4–5); everyone who has one hums the song (8); mom
  stopped asking about dessert (9).
- **Twist:** mom has already been "changed", and she's bringing one for me (12–13, at ~85%).
- **Hook pop-in (frame 0):** `3:00 AM` (a digital-clock style tag). **On-screen question (last 3 s):** "Would you look? 👀"
- **Caption highlights:** 3, a.m., look, Toby, never, melted, hummed, mom, two, you.
- **Pinned comment:** "What's the strangest rule your town or school had? 👇"
- **Titles:** "Never Look at the 3 A.M. Ice Cream Truck" / "Our Ice Cream Truck Only Comes at 3 A.M." / "Don't Eat the Midnight Ice Cream"

## Cast and sets
- **ME** (narrator, ~10): yellow-and-black striped shirt, messy blond spiky hair; blue pyjamas at night.
- **MOM**: pink cardigan, dark jeans, brown bun. **TOBY** (~10): green hoodie, red cap. **MRS. ALVAREZ** (older neighbour):
  lavender cardigan, grey bun, glasses. **MAILMAN**: blue uniform, cap, mailbag. **TEACHER**: grey sweater, glasses.
- **Existing:** the street at night and day, ME's bedroom, the hallway, the kitchen, the school yard.
- **New:** an old ice cream truck (boxy, cream and pink, a cone on the roof, a dim pink glow, a speaker horn), a bus stop sign
  and bench, ice cream cones (prop, held), a window with curtains in ME's bedroom.

## Shots (~32 set-ups)

| # | Line | Size | Camera | Who moves and how |
|---|---|---|---|---|
| 1 | 1 "Our ice cream truck..." | W | Low angle on the empty night street, slow push | The truck rolls in from the right, headlights off, pink glow; curtains in every window. Pop-in `3:00 AM` fully on screen. |
| 2 | 1 "...nobody's allowed to look" | M | Inside ME's dark bedroom | ME in pyjamas sits bolt upright in bed (head snap toward the window). |
| 3 | 2 "Every night..." | MW | Truck side, tracking slowly beside it | The truck creeps along; its speaker horn wobbles to the song. |
| 4 | 2 "...every curtain stays shut" | W | Across the street, three houses | Three upstairs curtains twitch shut one after another (staggered). |
| 5 | 3 "Last summer, Toby Parker looked." | M | Outside Toby's window, looking in | Toby lifts the curtain, face lit pink, eyes go wide (surprised). |
| 6 | 4 "The next morning..." | MW | Bus stop, day, slow push | Kids arrive and stand; Toby already there, smiling, cone in hand. |
| 7 | 4 "...never melted" | C | The cone in Toby's hand | Bright sun, perfect cone; a fly lands and leaves. |
| 8 | 5 "He didn't take one bite..." | M | Cafeteria/yard bench | Toby sits, holding the cone up, perfectly still, while the others eat and chatter (talk hands). |
| 9 | 5 "Not at recess. Not all day." | W | School yard drone, top-down | Kids run and play (crowd milling); Toby stands still in the middle, cone up. |
| 10 | 6 "After that, I started noticing..." | M | Lead dolly in front of ME walking home | ME walks down the sidewalk, looking side to side (look-around). |
| 11 | 7 "Mrs. Alvarez had a cone." | MW | Her porch | She waves slowly from a rocking chair, cone in the other hand. |
| 12 | 7 "So did the mailman." | MW | Sidewalk | The mailman walks past, mailbag on one shoulder, cone held up. |
| 13 | 7 "So did my teacher." | M | Classroom front | Teacher writes on the board with chalk, cone in the other hand. |
| 14 | 8 "They all hummed..." | M | Over ME's shoulder (sliver only) to the teacher | Teacher turns from the board, mouth humming (talk face), eyes on ME. |
| 15 | 8 "...nobody was listening" | M | Hallway | ME stops; behind ME, three adults' heads turn together (synced). |
| 16 | 9 "Even my mom stopped asking..." | MW | Kitchen | Mom chops vegetables, then stops mid-chop as ME walks in, smiles without turning. |
| 17 | 10 "Then last night..." | W | Aerial down the night street | The truck's glow creeps toward our house. |
| 18 | 10 "...right outside our house" | MW | Our front lawn, low | The truck stops; its music cuts out (silence). |
| 19 | 11 "I peeked through my curtain" | M | Bedroom, from beside the window | ME pinches the curtain open a crack, one eye at the gap. |
| 20 | 11 "...just a crack" | C | ME's eye in the gap | Eyes wide (scared), trembling (cower layer). |
| 21 | 12 "My mom was walking back..." | MW | ME's POV down onto the driveway | Mom walks up the driveway path, two glowing cones held up. |
| 22 | 12 "...holding two cones" | M | Driveway, low | Mom stops, head snaps up toward ME's window (head snap). |
| 23 | 13 "She knocked on my door..." | M | Bedroom from behind ME (sliver) to the door | Three knocks (door shakes); ME pulls the blanket up. |
| 24 | 13 "'One's for you, sweetie.'" | M | Hallway outside the door | Mom leans in to the door (lean-in), cone held up, smiling (creepy face). |
| 25 | 14 "So tonight, I'm going to look." | M | Bedroom, slow push on ME at the window | ME stands at the curtain, hand on it. Question pop: "Would you look? 👀". Cut back to shot 1. |

- **Sound:** a tinny, slightly detuned ice cream truck tune (synthesised, our own), crickets, the truck's engine idle; the
  music cuts out on "stopped"; three knocks; a soft sting on "two cones".
- **Night lighting:** deep blue with a face fill; the truck gives a pink glow.

---

# B. COMEDY: "My Brother Sold Invisible Pets"

## Script (14 beats, ~31 s)

1. My little brother sold invisible pets at school and made four hundred dollars.
2. Invisible hamsters were five bucks. Invisible dogs were ten.
3. Every customer got an empty leash and a certificate with a gold star.
4. By Wednesday, half the third grade was walking nothing down the hallway.
5. Then Coach Miller bought an invisible horse for twenty dollars.
6. And Principal Hayes kept stopping by to ask which animals were left.
7. That's when she called him into her office.
8. Through the window, I saw a giant bag of peanuts on her desk.
9. I figured he was done for.
10. But he walked out grinning, holding a fifty-dollar bill.
11. She'd bought the invisible elephant.
12. "For the school," she said. "He's our new mascot."
13. Now every assembly starts with a moment of silence for Gus the elephant.
14. And it all started because... *(loops into line 1: "...because / My little brother sold invisible pets...")*

- **Clues before the twist:** the principal keeps asking which animals are left (6); a giant bag of peanuts on her desk (8).
- **Twist:** the principal didn't punish him, she bought the biggest pet (11–12, at ~80%).
- **Hook pop-in (frame 0):** `$400` (a gold coin stack). **On-screen question:** "What invisible pet would YOU buy? 👇"
- **Caption highlights:** invisible, $400 / four hundred, five, ten, horse, Principal, peanuts, fifty, elephant, Gus.
- **Pinned comment:** "Be honest: how much would you pay for an invisible dragon? 🐉"
- **Titles:** "My Brother Sold Invisible Pets at School" / "He Made $400 Selling Nothing" / "The Invisible Pet Business"

## Cast and sets
- **ME** (narrator): striped shirt, spiky blond hair. **BRO** (little brother, ~7, small scale): oversized blue hoodie, cap
  backwards, a fanny pack of cash. **COACH MILLER**: red tracksuit, whistle, buzz cut. **PRINCIPAL HAYES**: navy blazer,
  grey bob, glasses. **Kids**: 10–20 varied townsfolk kids (the popular avatar styles: soft, emo, streetwear, preppy, Y2K).
- **Existing:** the school yard, the hallway (redressed as a school corridor).
- **New:** a school corridor with lockers, a classroom, the principal's office (desk, window in the door), a gym for the
  assembly (bleachers or rows of kids standing), props: empty leashes, certificates, cash, a giant peanut bag.

## Shots (~28 set-ups)

| # | Line | Size | Camera | Who moves and how |
|---|---|---|---|---|
| 1 | 1 "My little brother sold invisible pets..." | MW | School yard, low, slow push | BRO behind a folding table, waves cash at a line of kids; one kid walks away proudly holding an empty leash. Pop-in `$400`. |
| 2 | 1 "...four hundred dollars" | C | The cash box | BRO fans a stack of bills, grinning. |
| 3 | 2 "Invisible hamsters were five bucks." | M | Table, kid's side | BRO "hands over" a hamster with both hands (nothing there); the kid cups it carefully. |
| 4 | 2 "Invisible dogs were ten." | M | Same table | BRO points at a price sign: HAMSTER $5, DOG $10, HORSE $20, ELEPHANT $50 (the elephant line is a planted clue). |
| 5 | 3 "Every customer got an empty leash..." | C | Hands | A leash and a certificate with a gold star slide across the table. |
| 6 | 4 "By Wednesday..." | W | Corridor drone, top-down | 8 kids walk empty leashes down the corridor, leashes taut, stopping to "let them sniff". |
| 7 | 4 "...walking nothing down the hallway" | MW | Corridor, lead dolly | Two kids stop and kneel to "pet" the air; a third steps carefully over nothing. |
| 8 | 5 "Then Coach Miller..." | MW | Gym door | Coach walks out holding a leash high (a horse is tall), proud. |
| 9 | 5 "...an invisible horse for twenty dollars" | M | Field | Coach "rides": a stiff gallop in place, arms forward on reins. |
| 10 | 6 "And Principal Hayes kept stopping by..." | MW | Yard, BRO's table | The principal leans over the table (lean-in), finger on the price list. |
| 11 | 6 "...which animals were left" | C | The price sign | Her finger taps ELEPHANT twice. |
| 12 | 7 "That's when she called him into her office." | M | Corridor | She points at BRO, then the office (point); BRO gulps (worried). |
| 13 | 7 | MW | Office door | BRO walks in; the door closes behind him. |
| 14 | 8 "Through the window, I saw..." | M | ME at the door's window | ME on tiptoe, peeking in. |
| 15 | 8 "...a giant bag of peanuts" | M | Through the window | A huge peanut bag on her desk; she sits behind it, hands folded. |
| 16 | 9 "I figured he was done for." | C | ME | ME's face: worried; shakes head slowly. |
| 17 | 10 "But he walked out grinning..." | MW | Office door | The door opens; BRO strolls out, grinning, waving a fifty. |
| 18 | 11 "She'd bought the invisible elephant." | MW | Behind BRO | The principal walks out holding a leash way up high, beaming (happy face). Sting. |
| 19 | 12 "'For the school,' she said." | M | Corridor | She turns to the camera and talks (talk face, talk hands). |
| 20 | 12 "'He's our new mascot.'" | W | Gym | A banner unrolls: GO GUS! (an elephant outline drawn on it), kids cheer (cheer, jump). |
| 21 | 13 "Now every assembly starts..." | W | Gym, wide | 30 kids standing in rows bow their heads (crowd, staggered). |
| 22 | 13 "...silence for Gus the elephant" | MW | Front of the gym | The principal holds the leash up in silence; one kid peeks up at the empty space. |
| 23 | 14 "And it all started because..." | M | Yard table | BRO winks at the camera, opens a new sign: INVISIBLE DRAGONS. Question pop. Cut back to shot 1. |

- **Sound:** school bell, corridor chatter, cash-register "ka-ching" on $400, a comedy sting on "elephant", a kazoo-like
  gallop under Coach's horse, a big cheer on "mascot", a long silent beat with one cough for the assembly.
- **Lighting:** bright day, cheerful.

---

# C. WHOLESOME: "The Porch Light Code"

## Script (14 beats, ~36 s)

1. Every night at nine, old Mr. Bell flashes his porch light three times.
2. Nobody on our street knows why.
3. The big kids say he's signaling aliens. My friend Ava says it's a ghost.
4. The weird part? My dad is always home by nine. Always.
5. So one night, Ava and I hid behind Mr. Bell's hedge with a flashlight.
6. Nine o'clock. Flash. Flash. Flash.
7. Then, across the street, another porch light flashed back three times.
8. Our porch light.
9. I ran home, and my dad was standing at the switch, like he'd done it a thousand times.
10. When I was a baby, I got really sick, and Mr. Bell drove us to the hospital in a snowstorm.
11. Mr. Bell lives alone, so they made a deal. Three flashes means, "I'm okay." Three back means, "We see you."
12. They haven't missed one night in ten years.
13. But this week, Dad hurt his knee and can't get up.
14. So tonight, it's my turn. *(loops into line 1: "...my turn. / Every night at nine, old Mr. Bell flashes...")*

- **Clues before the twist:** dad is always home by nine (4); the second light is across the street, where we live (7).
- **Twist:** it's a promise between Mr. Bell and my family, not aliens or ghosts (9–11, at ~75–85%); then it passes to me.
- **Hook pop-in (frame 0):** `9:00 PM` with three light-bulb icons. **On-screen question:** "Who do you check on every day? 💡"
- **Caption highlights:** nine, three, Mr. Bell, aliens, ghost, Our, dad, snowstorm, okay, see, ten, turn.
- **Pinned comment:** "Do you have a secret signal with someone? Tell us 👇"
- **Titles:** "My Neighbor Flashes His Light Every Night at 9" / "The Porch Light Code" / "Why Mr. Bell Flashes His Light"

## Cast and sets
- **ME** (narrator): striped shirt, spiky blond hair. **AVA** (~10): yellow raincoat, two puffs/ponytail, sneakers.
  **MR. BELL** (old man): brown cardigan, white hair, glasses, a cane. **DAD**: green plaid sweater, short brown hair.
  **BIG KIDS** (2–3 teens): hoodies, caps, one on a bike.
- **Existing:** the street at dusk and night (porches, lamps, hedges, lit windows), our hallway/front door inside.
- **New:** porch light fixtures that switch on and off (an emissive bulb and a light), a light switch by our front door
  (inside), a snowy night street and an old station wagon for the flashback (a quick 2-shot memory with a soft blue tint and
  snow), Ava's flashlight (we have one).

## Shots (~30 set-ups)

| # | Line | Size | Camera | Who moves and how |
|---|---|---|---|---|
| 1 | 1 "Every night at nine..." | MW | Mr. Bell's porch at dusk, slow push | Mr. Bell at his door, hand on the switch: the porch light blinks (on/off/on). Pop-in `9:00 PM` + 3 bulbs. |
| 2 | 1 "...three times" | C | The porch bulb | Off, on, off, on; moths circle. |
| 3 | 2 "Nobody on our street knows why." | W | Aerial down the dusk street | Neighbours on porches all turn their heads toward his house (crowd turn). |
| 4 | 3 "The big kids say...aliens" | MW | Sidewalk | Big kids on bikes stop, one points at the sky, another laughs (laugh). |
| 5 | 3 "Ava says it's a ghost" | M | Ava's porch | Ava hugs herself, whispering to ME (lean-in, scared face). |
| 6 | 4 "My dad is always home by nine." | MW | Our driveway | Dad walks fast up the path, checking his watch (look down at wrist). |
| 7 | 4 "Always." | C | Our front door | The door shuts at 8:59 (a clock pop: `8:59`). |
| 8 | 5 "So one night, Ava and I hid..." | MW | Behind Mr. Bell's hedge, low | ME and Ava crouch-walk in (walk with lean), kneel behind the hedge. |
| 9 | 5 "...with a flashlight" | M | The two of them | Ava clicks the flashlight off; ME holds a finger to lips (shh: arm up to the face). |
| 10 | 6 "Nine o'clock." | C | Mr. Bell's window | Mr. Bell's silhouette walks to the door. |
| 11 | 6 "Flash. Flash. Flash." | M | His porch, kids in the foreground (sliver) | Three flashes, cut on each word (three quick cuts, alternating angle). |
| 12 | 7 "Then, across the street..." | W | Kids' POV across the street | A porch across the street flashes back: one, two, three. |
| 13 | 8 "Our porch light." | M | ME and Ava | ME's head snaps to Ava; both surprised. Sting. |
| 14 | 9 "I ran home..." | MW | Lead dolly in front of ME running | ME runs across the street (run gait, look both ways first!). |
| 15 | 9 "...dad was standing at the switch" | M | Inside our front hall | Dad, hand on the switch, turns slowly (turn), smiles (happy). |
| 16 | 10 "When I was a baby..." | W | Flashback: snowy night street (blue tint, snow) | An old station wagon's headlights cut through snow. |
| 17 | 10 "...Mr. Bell drove us" | M | Flashback, by the car | Younger Mr. Bell (darker hair) opens the car door for mom holding a bundled baby. |
| 18 | 11 "Mr. Bell lives alone..." | MW | His house at night | Mr. Bell sits alone at his kitchen table (seated idle), one plate. |
| 19 | 11 "Three flashes means 'I'm okay.'" | M | His porch | He flashes the light, nods (nod). |
| 20 | 11 "Three back means 'We see you.'" | M | Our hall | Dad flashes back, waves through the window (wave). |
| 21 | 12 "They haven't missed one night..." | W | Time-lapse, the two porches | Seasons change fast (leaves, snow, summer); the two lights keep flashing back and forth. |
| 22 | 13 "But this week, Dad hurt his knee..." | MW | Living room | Dad on the couch, knee up on a cushion, waves ME over (wave). |
| 23 | 14 "So tonight, it's my turn." | M | Our front hall, slow push | ME reaches up to the switch at 9:00, flashes it three times. Question pop. |
| 24 | 14 | W | Across the street (shot 1 angle) | Mr. Bell's light answers. Cut back to shot 1. |

- **Sound:** crickets, a light-switch click on every flash (6 + 3 + 3), a soft hopeful piano on the reveal; wind and snow
  in the flashback; a warm swell on "my turn".
- **Lighting:** dusk to night, warm porch lights; the flashback cool blue with snow.

---

# D. MYSTERY: "The Hamster Who Escapes Every Friday"

## Script (14 beats, ~37 s)

1. Our class hamster escapes every single Friday, and his cage is always still locked.
2. His name is Sir Nibbles, and he's the chubbiest hamster in the third grade.
3. Mr. Ortiz says someone in our class is letting him out, so I made a list of suspects.
4. Maya has the only spare key, and she loves him the most.
5. Jalen keeps sunflower seeds in his pocket, which is very suspicious.
6. And Mr. Ortiz smiles every time Sir Nibbles goes missing.
7. But every Monday, Sir Nibbles is back in his cage, and nobody saw a thing.
8. Here's the weird part. My backpack smells like sunflower seeds every Friday night.
9. And my hamster at home, Peanut, is always super happy on Saturdays.
10. So last Friday, I stayed up and watched Peanut's cage.
11. At midnight, my backpack started wiggling.
12. Sir Nibbles climbed out, squeezed into Peanut's cage, and snuggled up next to her.
13. He wasn't escaping. He was visiting his girlfriend.
14. And that's why, every single Friday... *(loops into line 1: "...every single Friday / Our class hamster escapes every single Friday...")*

- **Clues before the twist:** my backpack smells of seeds on Fridays (8); Peanut is happy on Saturdays (9); and, for sharp
  viewers, the backpack sits on the floor right under the cage in shot 3.
- **Twist:** the detective is the getaway car (11–13, at ~85%).
- **Hook pop-in (frame 0):** `ESCAPED (AGAIN)` stamp over the cage. **On-screen question:** "Did you suspect the backpack? 🎒"
- **Caption highlights:** Friday, locked, Sir Nibbles, suspects, Maya, key, Jalen, seeds, Ortiz, backpack, Peanut, midnight, girlfriend.
- **Pinned comment:** "Name a pet you'd want to visit YOU every Friday 🐹"
- **Titles:** "Our Class Hamster Escapes Every Friday" / "I Investigated the Hamster Mystery" / "The Locked Cage Mystery"

## Cast and sets
- **ME** (narrator, detective): striped shirt, spiky blond hair; a detective cap and a notebook for the investigation shots.
- **MAYA** (~9): purple hoodie, braids, a key on a lanyard. **JALEN** (~9): orange shirt, cap, a pocket of seeds.
  **MR. ORTIZ** (teacher): sweater vest, tie, glasses, moustache. **Classmates:** 12–16 varied kids at desks.
  **SIR NIBBLES** (hamster, chubby, golden) and **PEANUT** (hamster, white with a pink bow): new, blocky toy-style animals.
- **Existing:** ME's bedroom (night), the hallway.
- **New:** a classroom (desks, green chalkboard with doodles, a window, the hamster cage on a shelf, a clock), two hamster
  cages (bars, wheel, water bottle), the two hamsters (blocky, simple: a rounded box body, two ears, two black dot eyes),
  a backpack that can wiggle (a squash-and-stretch on its pocket), a detective notebook with a suspect list.

## Shots (~31 set-ups)

| # | Line | Size | Camera | Who moves and how |
|---|---|---|---|---|
| 1 | 1 "Our class hamster escapes..." | M | Low on the cage shelf, slow push | The cage door is locked (padlock); the wheel still spinning, no hamster. Pop-in `ESCAPED (AGAIN)` stamped on. |
| 2 | 1 "...always still locked" | C | The padlock | ME's hand tugs it: locked. |
| 3 | 2 "His name is Sir Nibbles..." | MW | Classroom, Monday | Sir Nibbles back in the cage, eating; kids crowd round the cage (file in, kneel); ME's backpack on the floor right under the shelf (planted clue). |
| 4 | 2 "...the chubbiest hamster" | C | Sir Nibbles | Cheeks stuffed, he turns to the camera (head snap, cute). |
| 5 | 3 "Mr. Ortiz says someone..." | M | Front of the class | Mr. Ortiz points around the room slowly (point + turn). |
| 6 | 3 "...a list of suspects" | C | ME's notebook | ME writes SUSPECTS and three names (a hand-drawn list pop). |
| 7 | 4 "Maya has the only spare key..." | M | Maya at her desk | Maya swings the key on its lanyard, smiles (happy). Pop: a red circle around the key. |
| 8 | 4 "...loves him the most" | MW | Cage | Maya presses her face to the cage, waving at him (wave). |
| 9 | 5 "Jalen keeps sunflower seeds..." | M | Jalen's desk | Jalen pulls a fistful of seeds from his pocket, eats one (eat). |
| 10 | 5 "...very suspicious" | C | ME | ME narrows eyes (smirk), writes in the notebook. |
| 11 | 6 "And Mr. Ortiz smiles..." | M | Teacher's desk | Mr. Ortiz looks at the empty cage and smiles to himself (smirk), sips coffee. |
| 12 | 7 "But every Monday..." | MW | The cage, Monday morning | Kids walk in (file in), freeze: Sir Nibbles is back. They look around (look-around). |
| 13 | 7 "...nobody saw a thing" | W | Classroom drone, top-down | Every kid shrugs (shrug, staggered crowd). |
| 14 | 8 "Here's the weird part." | M | ME's bedroom, Friday night | ME unzips the backpack, sniffs, recoils (recoil). |
| 15 | 8 "...smells like sunflower seeds" | C | Backpack pocket | A few seeds spill out. |
| 16 | 9 "And my hamster at home, Peanut..." | MW | Peanut's cage on ME's desk | Peanut (pink bow) runs happily on her wheel. |
| 17 | 9 "...super happy on Saturdays" | C | Peanut | Peanut jumps and spins (jump), heart pop. |
| 18 | 10 "So last Friday, I stayed up..." | M | ME in bed, lamp on | ME sits up with the notebook and a flashlight, staring at the cage. |
| 19 | 10 | C | Clock | 11:58, 11:59 (quick cuts). |
| 20 | 11 "At midnight, my backpack started wiggling." | M | The backpack on the floor | The pocket bulges and wiggles; ME's head snaps to it (head snap), flashlight on it. |
| 21 | 12 "Sir Nibbles climbed out..." | C | Backpack zip | Sir Nibbles squeezes out of the pocket. |
| 22 | 12 "...squeezed into Peanut's cage" | MW | The desk | He climbs the desk leg, squeezes between Peanut's cage bars (a squash). |
| 23 | 12 "...snuggled up next to her" | C | Inside Peanut's cage | The two hamsters snuggle; a heart pop. |
| 24 | 13 "He wasn't escaping." | M | ME | ME's jaw drops (surprised); the flashlight droops. |
| 25 | 13 "He was visiting his girlfriend." | C | The two hamsters | Sir Nibbles winks at the camera. Sting. |
| 26 | 14 "And that's why, every single Friday..." | M | Classroom, Friday afternoon | ME zips the backpack with a tiny wave inside (wave), walks out. Question pop. Cut back to shot 1. |

- **Sound:** classroom chatter, a squeaky hamster wheel, a pencil scribble, a "dun dun dun" detective sting for each suspect,
  a zipper, rustling seeds, a clock tick into midnight, a sweet "aww" sting on the snuggle, kids gasping on Monday.
- **Lighting:** bright classroom day; bedroom night with a desk lamp and a face fill.

---

## What each test tells us

| Test | What a win looks like | Watch in analytics |
|---|---|---|
| A Creepy | Few viewers swipe away in the first 3 s; comments answer "would you look?" | Retention through the "noticing things" middle; replays from the loop |
| B Comedy | Shares and likes; viewers name their own invisible pet | Retention at the elephant reveal (around 80%) |
| C Wholesome | Saves, shares, "this made me cry" comments | Whether the slower emotional middle holds |
| D Mystery | Comments guessing the culprit; rewatches to spot the backpack clue | Replay rate; comments on the planted clue |

Post them about 24 hours apart, at the same time of day, with the same title style and the same hashtag set (#shorts plus
one or two topic tags), so the only big difference is the kind of story.
