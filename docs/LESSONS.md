# What the main studio learned (18 episodes and several Shorts, Oct-Nov 2026)

The full notes are in `docs/lessons/` (written for the main channel "What If in Theory": read "the user" as this repo's owner; rules
about that channel's hero, episode length or recurring characters don't apply here). The ones that matter most for Beanfolk:

## Picture
- **Short 1 owner notes** (`short01-owner-notes.md`): nothing too close to the lens, no back of a head filling the frame,
  faces bright in dark grades, approved proportions on every new character, no blurry foreground opening a shot.
- **Every shot's camera moves** (push, orbit, crane, drift). A still camera reads as broken.
- **No clipping, ever:** nothing through tables, walls or people; feet on the ground; held props IN the hand; walking legs move;
  true profile and three-quarter angles, never a body facing the camera while it "walks sideways" (`rig-angles-true-profile.md`,
  `anatomy-and-staging-rules.md`, `nothing-in-the-floor.md`).
- **Check where the camera starts and ends:** a push-in that starts inside a wall or a lamp gives half a second of black or a slab
  across a face. Render the first and last frame of every moving shot. Scan the finished picture for black runs (see
  `RENDER_ON_MANY_SESSIONS.md` step 4): sampled contact sheets missed one in Ep18.
- **Sets full of detail:** no blank walls, opened doors show furnished rooms, windows show views, readable signs (`sets-full-of-detail.md`).
- **Raw 3D, no filters:** no vignette, grain, grade or letterbox on the 3D (`3d-look-no-filters.md`).
- **Render budget:** about 300 meshes in view, 3 lights, a few full rigs per shot; crowds instanced and low-detail (`light-scenes-render-budget.md`).
- **If code changes the camera (aspect, fov, scissor) inside a frame, restore it:** otherwise later frames stretch.
- **Infographics include people.** Text-only screens get small background animations.
- **Review before every long render:** stills of every shot, then a rendered 60-frame sequence of the busiest one (motion bugs don't
  show in stills). The fix playbook (`fix-playbook.md`) lists every fix the owner asked for and how it was done.

## Sound
- **Level every voice to the narrator** before mixing; a quiet or whispered voice can need +10-16 dB (measure, don't guess).
- Music claim-free. **For Shorts the owner wants it 15 dB under the voice** (measured RMS, `short01-owner-notes.md`); it must be clearly
  heard on a phone. (The main studio's −22 to −26 dB in `bg-sound-levels.md` was too quiet for Shorts.)
- Use the real reactions in `sfx/library/`: laughs, cheers, applause, gasps, animal voices, stings, on the beats that call for them.
- Every whip gets a whoosh, every pop-in a pop; ambience under every set. Finish at −14 LUFS, −1.5 dBTP.

## Timing and voice
- **Never type seconds:** everything anchors to measured words.
- Fish clips are kept per beat; renumber by text when lines are inserted; shift word times after a late gap change.

## Shorts
- **First analytics (2026-11-11):** crazy hook; reveal ends at 80-85% of the runtime; 8 s max after it; an on-screen comment question in
  the last 3-4 s; a pinned comment per upload (`analytics-retention-comments.md`).

## Shorts (from the main channel's Short analytics, `shorts-retention-feedback.md`)
- The hook is the first second: a picture already in motion and the strangest thing first. No logo, no title card, no "in this video".
- Captions on every word. A loop ending (the last line leads into the first) lifts replays.

## Working
- **Build on several sessions and render on several sessions**, each part on its own branch (`RENDER_ON_MANY_SESSIONS.md`).
- Push a first complete pass early, then refine. Archive finished sessions.
- Deliver finished videos as files and on Drive (`pipeline/upload_drive.sh`); don't commit MP4 renders (they're git-ignored).
- The owner writes scripts in ChatGPT: produce them, don't rewrite them (`user-writes-scripts-in-chatgpt.md`).
- The audience is US-based: places, money, names, slang (`us-audience.md`), unless the owner says otherwise.
