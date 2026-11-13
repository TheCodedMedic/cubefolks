---
name: render-across-sessions
description: Long renders go across several parallel cloud sessions, never as parallel jobs inside one container
metadata:
  type: feedback
---

The user, 2026-10-24, when the Ep06 first minute was rendering in one container: "Why are we doing it on a single
container? … estimate the time for a single container, then analyze if setting up different branches would be faster
so they run on different virtual machines … at least they run concurrently."

**Why:** one container has 4 cores; four renders inside it (8 browser tabs) only fight each other (load 22 on 4 cores,
about 50 frames a minute). Separate sessions are separate machines, so their speed adds up; the few minutes of setup
per session are worth it for anything longer than a few minutes of rendering.

**How to apply:**
- Before any render, estimate the single-container time (measure frames per minute on the actual scenes). If it is
  more than about 10 minutes, split the frame range across parallel sessions (`create_session`, same pushed commit,
  `--concurrency=4` each) and say so; one job per container, never several.
- Each worker renders its range and pushes the MP4 to its own branch `claude/<ep>-render-partN` (`git add -f`); the
  main session fetches, joins with `ffmpeg -f concat -c copy`, checks the frame count, mixes and finishes.
- Keep scenes cheap for a CPU renderer: no per-object point lights (bake glows into textures), few shadowed lights.
- See `docs/HOW_WE_MAKE_VIDEOS.md` section 6.

**Update (2026-10-24, after the Ep06 full film: 10 sessions, 38 min render, 55 min to the finished file):**
- **Balance the parts by complexity, not by frame count.** Equal frame ranges finished between 14 and 38 minutes because
  one range held the heaviest scenes (lit shop interior at dusk, the house kitchen), and everyone waited on it. Before
  splitting, time a few spot stills per scene (`Ep6FilmCheck`-style composition, concurrency 4) or rank scenes by weight
  (rain, crowds of clocks, strand hair in close-up, live mirrors, many lights are heavy; empty rooms and 2D cards are
  light). Give heavy stretches shorter ranges and light ones longer, aiming for equal minutes per session, not equal frames.
- **Join with a stream copy, never a re-encode.** About 15 of the 55 minutes went into re-encoding the join. Every segment
  must come from Remotion with identical settings (`--codec=h264 --crf=17 --muted`, same composition size and fps) and
  start and end on whole frame ranges of the same composition, so `ffmpeg -f concat -safe 0 -i list.txt -c copy` joins them
  exactly. To reuse an approved section (e.g. the first minute), render it as frames 0..N-1 of the film composition
  itself, or cut the new parts so they begin exactly where the reused file ends; never trim a reused file with `outpoint`
  (that forces a re-encode). `pipeline/finish.py` already copies the video stream, so only the mix is re-encoded.

**Archive workers when done (user's request, 2026-10-25).** As soon as a render worker's part is collected (and checked for the right frame count), archive that session with `archive_session`, so the user never has to clean the session list by hand. Only archive sessions this session created (parent = this session); never touch the user's own sessions. Archiving is not deleting: the user deletes permanently in the app if they want.
