# Cubefolks: first tasks (2026-11-13)

The owner, after seeing Short 6: "we need to analyze deeper, more motion, better story telling, better Roblox feel and so on."
Do these in order. Speed matters (the owner wants work split over many sessions, no hour-long waits), but quality is the point.

## 1. Deep analysis of the style
- Inputs: the owner's sample (`notes/short06/ref/sample_contact.jpg`; the video itself is not in the repo) and the 3-5 reference
  Shorts the owner will send into `inbox/reference_shorts/` (study only, delete after).
- For each reference, measure and write down in `docs/CUBEFOLKS_STYLE.md`:
  - shot length (cut times), shot sizes (wide/medium/close), camera position and movement per shot;
  - **how much characters move**: walking in and out, turning, sitting, gestures, head snaps, crowds; count moving characters per shot;
  - the narration: words per second, pauses, where the voice speeds up or slows down, first-person phrasing;
  - the story shape: the town rule, the clues, the community scene, the turn, the last line;
  - captions (size, position, colour, outline, one word or two), on-screen text (MISSING posters, signs, chat bubbles);
  - sets, props, lighting, sky, time of day; what makes it feel like the game (default-avatar clothes, hats, accessories,
    camera views, UI-like touches).
- End with a ranked list: the 10 things that would most raise our Shorts toward the references.

## 2. Motion (Short 6's weakest point: characters mostly stood still)
Build into `video/src/blocky/` (a motion module beside BlockRig, e.g. `Motion.ts`):
- the game's stiff toy walk and run (arms and legs swinging as solid blocks), idle sway, turn on the spot, sit and stand, jump,
  wave, point, shrug, cross arms, the sudden head snap toward the camera, a nervous look-around;
- path walking: characters entering and leaving shots, walking through doors, down sidewalks and church aisles, feet on the ground;
- crowds that move (people taking seats, a room turning to stare);
- review them as a 3x3 motion sheet video (a few seconds each) before using them.

## 3. Storytelling
- A script template in `knowledge/CUBEFOLKS_SCRIPT.md` from the analysis: line 1 states the town's strange rule as fact; named
  neighbours; 2+ planted clues; a community scene; the turn on the narrator by 80-85%; a loop line.
- Check every script against `knowledge/SHORTS_PLAYBOOK.md` before voicing (voice `R`).

## 4. The blocky-game feel
- Default-avatar-like clothes and accessories, simple hats, hair pieces; sets with the game's clean modular look (and studs or a
  baseplate where it fits); chat-bubble dialogue above heads where the references use it; camera views like the game's.
- All drawn by us: never Roblox's logo, name, branded items or copied assets.

## 5. Prove it with a ~15 s test Short
Before a full episode: a 15 s test with real motion (people walking into frame, a head snap, a crowd turning), built in parallel and
rendered on 10 sessions. Send it to the owner with what changed since Short 6.

## Known weak spots in Short 6 (don't repeat)
- 10-12 s: the family at the mirror was a crowded tangle of backs and shoulders.
- 23 s: dad's face too close to the lens. 38 s: mom's face filling the frame.
- Frame 0: the hook read, but the faces were small.
- First pass: most shots far too close (fixed by the framing rule in CLAUDE.md); the night bathroom first lit like day.
