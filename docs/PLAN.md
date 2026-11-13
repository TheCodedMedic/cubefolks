# The plan: from an empty studio to the first Beanfolk Short

The owner chose the trending pill-character style (reference 3, `inbox/reference_shorts/3_prison_LIKED.mp4`, is the one they like).
Measurements of all three references are in `docs/STYLE_BRIEF.md`. Do the steps in order; each ends with something the owner can see.

## Step 0. Get the studio running (first session, ~20 min)
- Follow `docs/SETUP.md`. Render the smoke test: `cd video && npx remotion still src/index.ts Smoke out/smoke.png --frame=45`.
- Check the keys are present (without printing them): the session-start hook reports `BEAN_FISH_API_KEY is available`.
- Set up the narrator voice (`docs/VOICE.md`): find the owner's Fish voice or clone it from the sample URL they give.

## Step 1. The Beanfolk rig, `video/src/bean/Bean3D.tsx` (1 building session) → APPROVAL GATE
Proportions (in the trend, our own design): head a sphere about 40% of total height; body a short capsule; **thin black stick legs**
(a hip and a knee bend each, small rounded feet); thin stick arms with small round mitten hands (hidden or tucked when idle); a short neck
gap or none. Total height about 1.1 m in scene units so sets read as cosy dioramas.
- **Outfits as the body's material:** stripes (a canvas texture), a suit and tie, a uniform with buttons, an apron, a hoodie, a dress;
  hats and hair caps as separate meshes (a cap, a chef's hat, a bob, buns, a side part, a bun on top, a moustache, glasses).
- **Skin tones** from a palette of 8 (light to deep brown); avoid near-black for anyone.
- **Motion:** walk (legs swing, the body bobs and sways), run, sit (legs bend over an edge), stand idle (a breathing squash and
  stretch of the body, 2%), jump, fall over, carry a prop in a hand, point, arms up in joy, hands on head, shrug, sleep (lying down).
  Feet stay on the ground (a ground solver like `cam3d` has); props stay in the hand.
- **Shading:** soft matte toon-like `MeshStandardMaterial` (roughness 0.6-0.8), warm key light, soft fill, soft shadows. No outline on
  this style. Keep the light budget: at most 3 lights and about 300 meshes in view; crowds instanced and low-detail.
- Deliver a **character sheet**: 8 characters (front, three-quarter, side, back) in different outfits and skin tones, plus a row of
  6 poses. Render it as a still and send it to the owner. **Do not start Short 1 until the owner approves it.**

## Step 2. The face kit, `video/src/bean/Face.tsx` (same session or the next)
Drawn faces on the head's front, as a canvas texture redrawn per expression (crisp at 1080 wide, readable at phone size):
- **Eyes:** white eyes with black pupils that look left, right, up, down; half-lids (smug, tired), closed arcs `^ ^` (happy), wide with
  tiny pupils (shock), squints, tears (streams and drops), and a blink every 2-5 s.
- **Brows:** neutral, raised, worried (tilted up in the middle), angry (down in the middle), one raised.
- **Mouths (about 12):** smile, big grin with teeth, smirk, flat, frown, wobbly worried, "O" shock, gritted teeth, open laugh, pout,
  tongue out, plus 4 talking shapes for lip flaps when a character "speaks" in the narration.
- **Extras:** sweat drop, blush, sparkles, anger vein, a thought bubble, "Z z z", sound-wave arcs.
- An expression is set per shot from the script: `face: { eyes, brows, mouth, extras }`, switching on a word with `at(beat, "word")`.

## Step 3. The Shorts kit, `video/src/kit/` (1 building session)
- `Short.tsx`: a 1080×1920 composition from a shot list, picking the shot at each frame (copy `ShotFrame` from
  `docs/examples/wit16/core.tsx`; the canvas is 1080×1920 and the fov a bit wider for close vertical framing).
- `Captions.tsx`: one or two words at a time from `words.json`, heavy rounded white type (about 88 px) with a dark stroke and shadow,
  at about 60% of the height, a tiny pop on each word. Optional highlight colour on key words.
- `Whip.tsx`: whip-pan transitions (the camera rotates fast with horizontal motion blur, 6-8 frames) between set-ups; most picture
  changes in the references are whips, not hard cuts.
- `Pop.tsx`: pop-in 3D words and icons on a word ("+5 YEARS", a calendar page, tally marks, a price tag), with an overshoot ease.
- `Cutaway.tsx`: the cross-section view (a wall cut open to show a tunnel, pipes, a vault): the reveal device.
- A **timing template**: about 45 set-ups for 65 s (one per 1-1.5 s), each with a moving camera (push, orbit, crane, tilt).
- Sets for the first story (dense, cosy, full of readable signs and props; see `docs/lessons/sets-full-of-detail.md`).

## Step 4. Short 1 (script → finished, ~2 hours) → APPROVAL GATE
- Script (the owner's words): 200-230 words, one sentence per beat, in this shape:
  1. **Hook as a strange fact** in the first sentence ("A man was offered X, and he begged to Y").
  2. Everyone laughs or doubts.
  3. 2-4 clues the viewer can't solve.
  4. A parallel mystery ("Meanwhile, ...").
  5. **"You see, ..."**: the reveal, with logic that makes sense inside the story's world (stories are made-up by default; see `CLAUDE.md`).
  6. A one-line payoff.
  7. The last sentence leads straight back into the first, so the Short loops.
- Voice at a brisk delivery (the references run 187-225 words a minute). Check the speed after assembly; tighten gaps rather than
  asking Fish to rush.
- Build about 45 shots, review a contact sheet of every second and a 60-frame sequence of the busiest part, render, mix, finish,
  upload, send. **Wait for the owner's notes before making Short 2.**

## Step 5. After approval: the routine
- One Short a day is realistic: script from the owner, voice (5 min), build (1-2 sessions), render on 5-10 sessions (minutes), mix, finish.
- Keep a list of story ideas in `notes/ideas.md`: original made-up stories (clever thieves, strange towns, odd jobs, schemes, twists), and true
  stories only when the owner asks for them.
- Later, optional: style 1 (2D outlined look: flat shading plus a thick black inverted-hull outline) and style 2 (flat characters on
  billboards inside 3D sets) reuse the same kit.

## Template to give ChatGPT for scripts
> Write a 60-70 second YouTube Short script, 200-230 words, one sentence per line, for a cartoon story narrated in third person.
> Shape: (1) open with a strange situation stated as fact; (2) people laugh or doubt; (3) 2-4 odd clues; (4) "Meanwhile," a second
> mystery; (5) "You see," the reveal, with logic that makes sense inside the story and at least two clues planted earlier (the story
> can be made up); (6) a one-line payoff; (7) the last line flows straight
> back into the first line so the video loops. Short punchy sentences, vivid nouns a cartoon can show, no dialogue tags, no emojis.
> Topic: <TOPIC>.
