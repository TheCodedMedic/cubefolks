# Four story tests, v2 (2026-11-15): after the GPT critique

v1 (`STORY_TESTS_v1.md`) went to GPT for a hard critique. Its verdict: **A is the strongest concept, D the backup**, and none of
the four was ready (A wasted its ending, B showed the answer before the suspense, C stopped for a backstory lecture, D promised a
locked-cage mystery and never solved it). It rewrote all four. This file is the **production version**: GPT's rewrites, polished
for reading aloud, with rebuilt animation plans. Production order: **A first**, then D, B, C.

| # | Kind | Title | Words | Est. length | Twist lands |
|---|---|---|---:|---:|---|
| A | Creepy | The 3 A.M. Ice Cream Truck | 160 | ~38 s | beat 17 of 19 (~87%): the whole truck song comes out of Mom |
| B | Comedy | The Invisible Elephant | 161 | ~38 s | beat 15 of 18 (~82%): she sells elephant rides; the brother buys first |
| C | Wholesome | The Porch Light Code | 163 | ~38 s | beat 15 of 18 (~84%): he came because he was scared for Dad |
| D | Mystery | The Hamster Who Escapes Every Friday | 170 | ~40 s | beat 17 of 19 (~88%): the food-drawer hole and my backpack |

Lengths: words at 4.5 a second plus our 0.08 s gaps and 0.6 s tail; the real times come from the voice.

## What we kept from GPT, and where we changed its lines
- **Kept every structural fix:** A's missing-speaker mechanism; B's principal out-scamming the brother; C's missed signal and
  the visit that turns from scary to kind; D's tape test, food drawer, cleaning days and backpack route.
- **Line polish (ours):** A "at three every morning" → "at 3 a.m. every night" (the hook reads at a glance, and "3 a.m." can
  be a pop-in); A "Every wrong note sounded exactly the same" → "She even hit the same wrong note the truck always hits"
  (states the clue plainly). B "I laughed at him" → "Kids lined up anyway" (the line now moves the story); "a tiny step" →
  "a tiny step stool" (readable). C "even when we're still waiting at the store" → "even from the middle of the grocery
  store"; "Mister" stays "Mr." in the captions and is spelled "Mister" only in the voice text. D present tense for the
  routine ("We clean... he's always back"), and the reveal merged into two clear sentences.
- **Channel direction (GPT's advice, which we'll test, not assume):** creepy stories built around solvable mysteries are the
  likely core; occasional comic or warm endings keep the emotional destination unpredictable. These four uploads compare
  four executions, so one result is not a verdict on a whole genre.

## Shared production notes
- Narrator `R` (owner's voice), lead 0.05, gap 0.08, tail 0.6. One-word captions at ~70% height, highlight words per story.
- About one shot a second (32-35 numbered shots each; a beat can span several); hard cuts; calm cameras; every shot has someone doing something
  (`Motion.ts`); **zero clipping** (`Collide.ts` audit) before any render. Medium and medium-wide framing, faces visible.
- Frame 0 shows the strange thing in motion with the hook pop-in already on screen. The last 3 s carry an on-screen question
  (never spoken). The last shot cuts cleanly into shot 1.
- Shots marked **CLUE** must read at phone size: hold the prop in frame for at least 1 s, lit, not covered by captions.

---

# A. CREEPY: "The 3 A.M. Ice Cream Truck"

## Script (19 beats, ~38 s)
1. A truck with no speaker sings outside my window at 3 a.m. every night.
2. Mom says we never take its free ice cream.
3. Toby took one last week.
4. The next day, he held his cone all through lunch without taking a bite.
5. It didn't melt, even on the hot slide.
6. When he walked past me, I heard the truck's song.
7. There wasn't a truck anywhere.
8. A week later, my teacher had a cone too.
9. During our spelling test, she hummed the tune while she wrote.
10. She even hit the same wrong note the truck always hits.
11. Last night, the truck stopped outside our house.
12. The engine went quiet, but the song kept getting closer.
13. Mom opened my bedroom door holding two cones.
14. I backed away.
15. The music followed her.
16. Then she opened her mouth.
17. The whole truck song came out, bells and all.
18. She held the spare cone out to me.
19. I was supposed to be its next speaker. *(loops: "...its next speaker. / A truck with no speaker sings...")*

- **Clues:** the empty speaker mount (shot 1, CLUE); the song comes from Toby, not a truck (6-7); the teacher's wrong note
  matches the truck's (10). **Twist:** the cone-holders ARE the truck's speakers, and the spare cone is for me.
- **Hook pop-in:** `3:00 AM` (digital clock). **Question (last 3 s):** "When did you figure out where the song came from? 👀"
- **Highlights:** speaker, 3, a.m., free, Toby, melt, song, anywhere, teacher, wrong, closer, two, mouth, bells, speaker.
- **Pinned comment:** "Would you have taken the free ice cream? Be honest 🍦"
- **Titles:** "The Truck With No Speaker" / "Never Take the 3 A.M. Ice Cream" / "Our Ice Cream Truck Has No Speaker"

### Cast, sets, sound
- **ME** (~10, pyjamas at night, striped shirt by day), **MOM** (pink cardigan, brown bun), **TOBY** (green hoodie, red cap),
  **TEACHER** (grey sweater, glasses, bun), classmates (popular avatar styles).
- **Existing:** night and day street, bedroom, hallway, school yard. **New:** the ice cream truck (cream and pink, a cone
  on the roof, a dim pink glow, an **empty speaker mount with loose wires** on the roof), a classroom (desks, board, clock),
  a playground slide, ice cream cones (prop; one glows faintly).
- **Sound (the whole story is sound):** one original tinny jingle with a fixed **wrong note** (always the same note). It plays
  from the truck in shot 1, from Toby in 6, hummed by the teacher in 9-10 with the same wrong note, and in full (bells
  included) from Mom in 17. It must be our own melody (no real ice cream truck tune). Crickets at night; school murmur by day.

### Shots (35)
| # | Beat | Size | Camera | Action |
|---|---|---|---|---|
| 1 | 1 | W | Low on the night street, slow push | The truck rolls in, lights dim pink; **CLUE: the roof speaker mount is empty, wires hanging**, yet the jingle plays. `3:00 AM` on screen. |
| 2 | 1 | M | ME's bedroom window from inside | ME in pyjamas peeks between the curtains (head snap toward the sound). |
| 3 | 2 | MW | Kitchen, morning | Mom drops a free-cone flyer in the bin, wags a finger at ME (point). |
| 4 | 3 | MW | Street at night, Toby's lawn | Toby walks out to the truck's window (walk path) and reaches up. |
| 5 | 3 | C | Truck window | A hand passes Toby a cone; the jingle swells. |
| 6 | 4 | MW | School yard lunch tables, day | Kids eat; Toby sits holding the cone up, perfectly still. |
| 7 | 4 | M | Toby | He smiles, never blinks (stare-ish smile), the cone untouched. |
| 8 | 5 | MW | The playground slide, hot sun (heat shimmer) | Toby slides down holding the cone up. |
| 9 | 5 | C | **CLUE: the cone** at the bottom of the slide | Perfect, not one drip. |
| 10 | 6 | MW | Corridor, lead dolly | Toby walks past ME; ME turns to watch him (turn). |
| 11 | 6 | M | ME, Toby passing behind | The jingle plays softly as he passes; ME's head snaps after him. |
| 12 | 7 | W | Out of the school window | Empty street. No truck. |
| 13 | 7 | M | ME | ME looks around (look-around), worried. |
| 14 | 8 | MW | Classroom | Teacher at the board, a cone in her other hand. |
| 15 | 9 | M | Teacher's desk | She writes, humming (talk face on the hum beats). |
| 16 | 9 | MW | Classroom | Kids bent over tests; one by one they look up (staggered head turns). |
| 17 | 10 | C | Teacher | **CLUE:** she hums, and on the wrong note her head tilts (tilt) the same way the truck's horn wobbles. |
| 18 | 10 | M | ME at a desk | ME freezes, pencil up (scared). |
| 19 | 11 | W | Aerial down the night street | The pink glow creeps up the street and stops at our house. |
| 20 | 11 | MW | Our lawn | The truck stops at the curb. |
| 21 | 12 | M | Truck front | Headlights die; the engine stops (silence, then the jingle continues). |
| 22 | 12 | MW | Our dark hallway | No one there; the jingle gets louder (camera drifts toward ME's door). |
| 23 | 12 | M | ME in bed | ME pulls the blanket up, eyes on the door. |
| 24 | 13 | MW | ME's bedroom door | The door swings open; Mom in the doorway, a cone in each hand, backlit. |
| 25 | 13 | C | The two cones | Both faintly glowing. |
| 26 | 14 | M | ME | ME backs away across the bed (walk back, recoil). |
| 27 | 15 | MW | The room | Mom steps in (slow walk); the music is now clearly coming from her. |
| 28 | 16 | M | Mom | Her smile (creepy face); her head tilts. |
| 29 | 16 | C | Mom's face | Her mouth opens (grin face, held). |
| 30 | 17 | M | Mom | The full jingle, bells and all, blasts out; her body jolts on each bell (small recoil beats). Sting. |
| 31 | 17 | MW | ME | ME presses against the wall, hands up (cower). |
| 32 | 18 | M | Mom | She holds the spare cone out (arm forward, reachArm to a point in front of ME). |
| 33 | 18 | C | The cone in front of ME | It glows; it hums. |
| 34 | 19 | M | ME's face, slow push | ME's eyes on the cone. Question pop. |
| 35 | 19 | W | Cut to the night street (shot 1 angle) | The truck's empty speaker mount; the jingle note carries across the cut. |

---

# B. COMEDY: "The Invisible Elephant"

## Script (18 beats, ~38 s)
1. An invisible elephant made my principal four hundred dollars in one lunch break.
2. My little brother started it by selling invisible pets at school.
3. Five dollars got you a leash, an empty box, and a certificate.
4. Kids lined up anyway.
5. Then Coach Miller climbed onto an invisible horse and rode straight into a real tree.
6. Soon kids were blocking the hallway to walk their invisible dogs.
7. That brought Principal Hayes over.
8. She only asked how much my brother had made.
9. Then she asked which pets were left.
10. Next morning, I saw a giant bag of peanuts outside her office.
11. My brother went in holding an empty leash.
12. He came out holding fifty dollars.
13. At lunch, she opened the gym doors.
14. Forty kids were waiting beside a tiny step stool.
15. She was selling elephant rides for ten dollars each.
16. My brother bought the first ticket.
17. He paid with the money she'd just given him.
18. That was the first ten dollars she made. *(loops: "...the first ten dollars she made. / An invisible elephant made my principal four hundred dollars...")*

- **Clues:** she asks how much he made (8, money motive); she asks which pets are left (9); the peanut bag (10).
  **Twist:** she bought the elephant to sell rides (15), and the scammer is her first customer (16-17). 40 × $10 = $400.
- **Hook pop-in:** `$400` with an empty leash icon. **Question:** "Who scammed who? 🐘"
- **Highlights:** invisible, elephant, $400 / four hundred, five, lined, horse, tree, Principal, much, left, peanuts, fifty,
  forty, ten, first.
- **Pinned comment:** "How much would YOU pay to ride an invisible elephant? 🐘"
- **Titles:** "My Principal Made $400 With an Invisible Elephant" / "Who Scammed Who?" / "The Invisible Elephant Ride"

### Cast, sets, sound
- **ME** (striped shirt), **BRO** (~7, small: oversized blue hoodie, backwards cap, a fanny pack), **COACH MILLER** (red
  tracksuit, whistle), **PRINCIPAL HAYES** (navy blazer, grey bob, glasses), 40 kids (popular avatar styles, instanced).
- **Existing:** school yard. **New:** school corridor with lockers, a tree by the field, the principal's office door with a
  window, the gym (big doors, floor lines), a tiny step stool, props: empty leashes, small empty boxes, certificates, cash,
  a giant peanut bag, a hand-written sign `ELEPHANT RIDES $10` (kept hidden until beat 15).
- **Sound:** school bell, chatter, cash "ka-ching" on $400 and $50, a cartoon gallop and a "bonk" on the tree, a hallway
  traffic jam of yaps (kids making dog noises), the gym doors' big creak, a crowd "ooh", a comedy sting on "first ticket".
- **Rule for every invisible pet:** the empty space stays empty; the kids supply all the movement (leash held slack or taut
  by their own arm, never pulling on its own).

### Shots (33)
| # | Beat | Size | Camera | Action |
|---|---|---|---|---|
| 1 | 1 | MW | Gym, low, slow push | A kid "rides" an invisible elephant: sitting on air above a step stool, bouncing; Principal Hayes counts cash beside the stool. `$400` on screen. |
| 2 | 1 | C | Her cash box | Bills fanned out. |
| 3 | 2 | MW | School yard | BRO behind a folding table, waving kids over (wave). |
| 4 | 3 | M | The table | BRO hands over a leash, an empty box and a certificate; a kid hands him $5. |
| 5 | 3 | C | The certificate | Gold star, "1 INVISIBLE DOG". |
| 6 | 4 | W | Drone over the yard | A long line of kids snakes to the table (file in). |
| 7 | 5 | MW | Field | Coach Miller steps up onto nothing (jump), grips invisible reins. |
| 8 | 5 | M | Lead dolly | Coach "gallops" (run gait with stiff legs). |
| 9 | 5 | W | The tree | Bonk: Coach stops dead against the real tree, falls back (recoil, sit). |
| 10 | 6 | W | Corridor drone | Kids with leashes clog the hallway, stopping to "pet". |
| 11 | 6 | MW | Corridor | A teacher tries to squeeze past; kids hold their leashes up (shrug). |
| 12 | 7 | MW | Corridor end | Principal Hayes walks into the jam (walk path), arms folded. |
| 13 | 7 | M | Kids | Everyone freezes, leashes up. |
| 14 | 8 | M | BRO's table | She leans over the table (lean-in). |
| 15 | 8 | C | She, then BRO | She asks; BRO holds up his cash box, nervous grin. |
| 16 | 9 | M | Price list (no tap on any one animal) | She runs a finger down the whole list, thinking (stroke chin). |
| 17 | 10 | MW | Office corridor, morning | ME walks past her door (walk), stops. |
| 18 | 10 | M | Beside the door | **CLUE:** a giant peanut bag leaning against the wall. ME's head snaps to it. |
| 19 | 11 | MW | Office door | BRO walks in holding an empty leash high, like something tall is on it. |
| 20 | 11 | M | ME | ME winces (worried). |
| 21 | 12 | MW | Office door | BRO walks out grinning, waving a fifty. Ka-ching. |
| 22 | 13 | W | Gym doors, lunch | The big doors swing open (doors creak). |
| 23 | 14 | W | Inside the gym, high | Forty kids in a line beside a tiny step stool. |
| 24 | 14 | M | The stool | A kid steps up onto it, hesitates. |
| 25 | 15 | MW | Principal | She unveils the sign `ELEPHANT RIDES $10` (raise). |
| 26 | 15 | M | A kid "riding" | Sitting on air, bouncing, beaming (cheer). |
| 27 | 15 | C | Her hand | Takes a $10 bill. |
| 28 | 16 | MW | The line | BRO pushes to the front (walk), cash in hand. |
| 29 | 16 | M | Ticket booth | She hands him ticket #1. |
| 30 | 17 | C | The bill | The same fifty-dollar bill; she gives him $40 change. |
| 31 | 17 | M | BRO | He climbs the stool, delighted (happy). |
| 32 | 18 | M | Principal | She smiles at the camera, pockets the $10 (smirk). Question pop. |
| 33 | 18 | W | Gym, high | BRO "riding" in the middle of the gym, the line of 40 behind. Cut to shot 1. |

---

# C. WHOLESOME: "The Porch Light Code"

## Script (18 beats, ~38 s)
1. Our house blinks at our neighbor every night to keep him away.
2. Dad always rushes home before nine, even from the middle of the grocery store.
3. At nine, Mr. Bell blinks his porch light three times and watches our window.
4. Dad flashes ours back.
5. I thought they were planning something.
6. Then Dad hurt his knee and fell asleep on the couch.
7. Nine o'clock came, and our porch stayed dark.
8. Mr. Bell flashed again.
9. I waved from behind the curtain, but he couldn't see me.
10. He stood there in his slippers, staring at our window.
11. I didn't know whether to wake Dad or pretend nobody was home.
12. Then he grabbed his coat and hurried across the street.
13. I opened the door before he could knock.
14. He wasn't angry about the light.
15. He was scared something had happened to Dad.
16. Their secret code meant someone would always come.
17. Tonight, I took Dad's turn at the switch.
18. Mr. Bell went home knowing we were safe inside. *(loops: "...safe inside. / Our house blinks at our neighbor every night to keep him away.")*

- **Clues:** Dad's rush home before nine (2); Mr. Bell watches our window (3). **Twist:** the code is a check-in; when it
  fails, he comes to help (15-16). On replay, "to keep him away" means "so he doesn't have to worry".
- **Voice text:** "Mister Bell" in `tts_text.json`; captions keep "Mr. Bell".
- **Hook pop-in:** three light-bulb icons blinking. **Question:** "Who would notice if your light stayed dark? 💡"
- **Highlights:** blinks, away, nine, three, Mr. Bell, back, knee, dark, slippers, coat, scared, always, turn, safe.
- **Pinned comment:** "Do you have a secret signal with someone? 👇"
- **Titles:** "Our House Blinks at Our Neighbor Every Night" / "The Porch Light Code" / "What Happens If We Don't Blink Back"

### Cast, sets, sound
- **ME**, **DAD** (green plaid sweater, short brown hair; a knee brace later), **MR. BELL** (old man: brown cardigan, white
  hair, glasses, slippers, a coat on a hook).
- **Existing:** the street at dusk and night, our hallway and front door, living room (dining room redressed), kitchen.
  **New:** working porch lights (a bulb that switches on and off and lights the porch), a light switch by our front door, a
  small grocery aisle (2 shelves and a cart) for beat 2, a couch.
- **Sound:** crickets, a light-switch click on every flash (clear and countable), the TV murmuring, Dad snoring softly, fast
  slipper steps across the street, a knock that never comes (ME opens first), a warm piano that rises on beat 15.
- **Signal order:** Mr. Bell always flashes first; we answer. In the last shots the child answers.

### Shots (32)
| # | Beat | Size | Camera | Action |
|---|---|---|---|---|
| 1 | 1 | MW | Across the street at dusk, from Mr. Bell's porch toward our house | Our porch light blinks three times; Mr. Bell, in the foreground at the side, lowers his hand from his own switch. 3 bulbs pop. |
| 2 | 1 | M | Mr. Bell | He nods and goes inside (turn, walk). |
| 3 | 2 | MW | Grocery aisle | Dad checks his watch (look down at the wrist), abandons the cart (walk off fast). |
| 4 | 2 | M | ME in the aisle | ME holding a cereal box, confused (shrug). |
| 5 | 2 | W | The street | Dad hurries up our path (hurry gait), ME trailing. |
| 6 | 3 | MW | Mr. Bell's porch, 9:00 | Mr. Bell flicks his switch: on, off, on (three clicks). |
| 7 | 3 | M | Mr. Bell | He watches our window across the street. |
| 8 | 4 | M | Our hall | Dad flicks our switch three times. |
| 9 | 4 | W | Street, both houses in frame | Our porch answers; Mr. Bell's door closes. |
| 10 | 5 | M | ME on the stairs | ME watches Dad, suspicious (smirk), arms folded. |
| 11 | 6 | MW | Living room | Dad on the couch, knee in a brace on a cushion; his head drops (asleep). |
| 12 | 6 | C | Clock | 8:59 → 9:00. |
| 13 | 7 | W | Street | Our porch stays dark. |
| 14 | 8 | MW | Mr. Bell's porch | He flashes again, three clicks, slower. |
| 15 | 9 | M | Our front window | ME waves from behind the curtain (wave). |
| 16 | 9 | MW | Mr. Bell's POV | He can't see: our window is dark. |
| 17 | 10 | M | Mr. Bell | In slippers, staring (blank face), unmoving. Ambiguous and a little creepy. |
| 18 | 11 | M | ME | ME looks from the window to sleeping Dad and back (head turns). |
| 19 | 11 | MW | Living room | Dad snoring; ME tiptoes (stroll gait) between Dad and the door. |
| 20 | 12 | M | Mr. Bell's hall | He takes his coat off the hook (pickUp), pulls it on. |
| 21 | 12 | W | Street | He hurries across the street (hurry gait), slippers. |
| 22 | 13 | M | Our front door, inside | ME reaches the handle (reachArm), opens it. |
| 23 | 13 | MW | Our porch, outside | The door opens; Mr. Bell, fist raised to knock, stops (knock interrupted). |
| 24 | 14 | M | Mr. Bell | His face: not angry (worried). |
| 25 | 15 | M | Over ME's shoulder (sliver) | He looks past ME into the house, hand on his chest (scared). |
| 26 | 15 | MW | Living room through the door | Dad wakes, waves from the couch (wave); Mr. Bell's shoulders drop (relief: happy face). |
| 27 | 16 | M | The two men | Mr. Bell sits by the couch; they laugh (laugh). |
| 28 | 16 | C | Our light switch | ME's hand near it. |
| 29 | 17 | MW | Mr. Bell's porch, next night | He flashes three times. |
| 30 | 17 | M | Our hall | ME stands on tiptoe and flashes ours back, three clicks. |
| 31 | 18 | W | Street | Mr. Bell sees it, nods, goes inside; his porch goes dark. Question pop. |
| 32 | 18 | MW | Shot 1 angle | Cut to shot 1 (our light blinking). |

---

# D. MYSTERY: "The Hamster Who Escapes Every Friday"

## Script (19 beats, ~40 s)
1. Our class hamster escapes his locked cage every Friday without opening the door.
2. Maya has the spare key, so I taped the door shut.
3. I watched her all morning, but Sir Nibbles still vanished.
4. All Maya did was wash his food drawer.
5. We clean his cage every Friday and Monday, with our backpacks lined up beside it.
6. And by Monday's first lesson, he's always back inside.
7. My tape never broke.
8. I checked for bite marks and gaps between the bars.
9. Nothing.
10. Then I found sunflower shells inside my backpack.
11. I never packed any.
12. And at home, my hamster Peanut kept building a second nest.
13. So the next Friday, I filmed the cage during cleanup.
14. At home, I set my backpack next to Peanut's cage.
15. At midnight, something scratched inside it.
16. I checked the video.
17. He'd crawled out through the food drawer hole, straight into my backpack.
18. I was his weekend ride to Peanut, and Monday's cleanup was his ride back.
19. Now I park his getaway car right beside the cage. *(loops: "...right beside the cage. / Our class hamster escapes his locked cage every Friday...")*

- **Clues:** the removable food drawer (4, CLUE); cleaning days with backpacks lined up beside the cage (5, CLUE: ME's
  backpack is the one nearest the drawer); shells in my backpack (10); Peanut's second nest (12).
- **Twist:** the escape route is the drawer hole, and I'm the getaway car (17-18). The tape on the door never breaks.
- **Hook pop-in:** `ESCAPED (AGAIN)` stamped over the cage, tape visible on the door. **Question:** "Which clue gave him away? 🔍"
- **Highlights:** locked, Friday, Maya, key, taped, vanished, drawer, backpacks, Monday, never, nothing, shells, Peanut,
  nest, filmed, midnight, video, hole, ride, getaway.
- **Pinned comment:** "Did you spot the backpack before I did? 🎒"
- **Titles:** "Our Hamster Escapes a Locked Cage Every Friday" / "The Locked Cage Mystery" / "I Caught Our Class Hamster's Secret"

### Cast, sets, sound
- **ME** (detective: striped shirt, a cap, a notebook), **MAYA** (~9: purple hoodie, braids, the key on a lanyard),
  classmates, **MR. ORTIZ** (teacher: sweater vest, glasses) in the background only. **SIR NIBBLES** (golden hamster) and
  **PEANUT** (white hamster with a pink bow): new, blocky toy animals (a rounded box body, ears, dot eyes, a tiny walk cycle).
- **New:** classroom with the cage on a low shelf; the class cage with **a removable food drawer at the bottom that leaves a
  hamster-sized hole when it is out**; tape across the door; a row of backpacks on the floor beside the shelf; Peanut's cage
  at home with an open side door; a phone on a stack of books (the recording); sunflower shells; a second nest of shredded
  paper. **The drawer hole must be shown clearly in shots 6 and 30.**
- **Sound:** classroom chatter, tape rip, a squeaky wheel, the drawer sliding, a pencil, a ticking clock, the scratching at
  midnight, a phone "boop", a soft detective sting on each clue, a big "aha" sting on the reveal.

### Shots (34)
| # | Beat | Size | Camera | Action |
|---|---|---|---|---|
| 1 | 1 | M | Low on the cage, slow push | Empty cage, the wheel still turning, the door taped shut and padlocked. `ESCAPED (AGAIN)` stamped. |
| 2 | 1 | C | The tape | ME's finger presses it: unbroken. |
| 3 | 2 | M | Maya's desk | Maya swings the key on its lanyard (wave of the hand). |
| 4 | 2 | C | The cage door | ME rips tape and seals the door across the seam (pickUp + reach). |
| 5 | 3 | MW | Classroom | ME at a desk watching Maya (head turns follow her), notebook up. |
| 6 | 4 | M | The cage, cleanup | **CLUE:** Maya slides the food drawer OUT (the hole shows) and carries it to the sink (walk). |
| 7 | 4 | MW | The sink | Maya washes the drawer, humming. |
| 8 | 5 | W | Drone over the cage corner | Kids clean: one wipes, one sweeps; backpacks in a row on the floor beside the shelf. |
| 9 | 5 | C | **CLUE: the row of backpacks** | ME's striped backpack is the one right under the drawer, its pocket open. |
| 10 | 6 | MW | Monday, the cage | Kids walk in (file in) and stop: Sir Nibbles is back inside, eating. |
| 11 | 6 | C | Sir Nibbles | Cheeks full, he looks at the camera. |
| 12 | 7 | C | The tape | Still unbroken. ME's jaw drops (surprised). |
| 13 | 8 | M | ME with a magnifying glass | ME inspects the bars (lean-in, look-around). |
| 14 | 8 | C | The bars | No bite marks, no gaps. |
| 15 | 9 | M | ME | ME shrugs (shrug). |
| 16 | 10 | MW | ME's bedroom, Friday night | ME unzips the backpack, tips it out. |
| 17 | 10 | C | **CLUE: sunflower shells** | They spill onto the bed. |
| 18 | 11 | M | ME | ME shakes head (headShake): "I never packed any." |
| 19 | 12 | MW | Peanut's cage on ME's desk | Peanut runs on her wheel. |
| 20 | 12 | C | **CLUE: a second nest** | A second pile of shredded paper in the corner, with a sunflower shell. |
| 21 | 13 | MW | Classroom, next Friday | ME props a phone on a stack of books facing the cage (reach, point). |
| 22 | 13 | C | Phone screen | REC ●. |
| 23 | 14 | MW | Bedroom, night | ME sets the backpack on the floor next to Peanut's cage (pickUp). |
| 24 | 14 | M | Peanut's cage | The little side door is open. |
| 25 | 15 | C | Clock | 11:59 → 12:00. |
| 26 | 15 | M | The backpack | The pocket wiggles; scratching. ME sits up (head snap). |
| 27 | 16 | M | ME in bed | ME grabs the phone, presses play. |
| 28 | 17 | C | Phone screen (the recording) | During cleanup the drawer is out; Sir Nibbles pops out of the drawer hole. |
| 29 | 17 | C | Recording | He drops into ME's open backpack pocket below. |
| 30 | 17 | MW | Bedroom | Sir Nibbles climbs out of the backpack and into Peanut's cage; they curl up in the second nest. "Aha" sting. |
| 31 | 18 | M | ME | ME slowly smiles (smirk). |
| 32 | 18 | MW | Classroom, Monday cleanup | The drawer is out; ME's backpack below; Sir Nibbles climbs back up into the hole. |
| 33 | 19 | MW | Classroom, Friday | ME sets the backpack down right beside the cage, pocket open, and winks at the camera. Question pop. |
| 34 | 19 | M | Cut to shot 1 angle | The empty cage, the wheel turning. |

---

## Before voicing (the checklist)
- [ ] Owner approves these four scripts (or sends line edits).
- [ ] `tts_text.json` per story: tags only on the hook, the turn and the reveal; "Mister Bell" in C; "three a.m." in A.
- [ ] Build order and new assets: A (truck with the empty speaker mount, classroom, slide, cones, the jingle with its fixed
      wrong note) → D (classroom reused, the cage with the drawer hole, two hamsters, backpacks) → B (corridor, gym, office
      door, step stool) → C (porch lights, switch, grocery aisle, couch).
