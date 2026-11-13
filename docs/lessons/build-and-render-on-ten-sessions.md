# Building AND rendering run on about 10 cloud sessions (fixed rule, the user, 2026-10-26)

The user: "You create about 10 cloud sessions to render all of them... Put that as a fixed rule."

- **Rendering** a long video is always split across about 10 cloud sessions. Each renders one frame range from a
  pushed commit and pushes the part to its own branch; the coordinator collects the parts, checks the frame counts,
  joins them with `ffmpeg -c copy`, and archives each worker. The method is in `docs/PARALLEL_RENDER_GUIDE.md`.
- **Building** the animation for anything bigger than a first minute is ALSO split across about 10 cloud sessions,
  not local subagents. Local subagents share this machine's 4 cores and queue for every review still, which is
  several times slower.
  - Split by PLACE (one session owns each set), so a set looks the same in every shot.
  - Give every builder exact time windows built from words (`WIN` in the episode's core.tsx).
  - Write a shared brief in the repo (e.g. `episodes/07_pause_time/BUILD_BRIEF.md`).
  - Each builder owns its own files, reviews its own stills, and pushes to its own branch. The coordinator merges the
    branches, reviews every frame again and sends fixes back with `send_message`.
- Never run long builds or renders as local background helpers. Also: interrupting the coordinator stops local
  helpers, but cloud sessions keep going.

**Update (the user, 2026-10-26): RENDER on about 20 sessions, BUILD on about 10.**
- Rendering: about 20 cloud sessions, so each renders about 20–30 s of film (balanced by scene weight: rain, crowds and confetti are 3–5× slower) and a 6–10 minute film finishes in about 35–45 minutes. Render workers use very little plan usage (a short chat each), so more of them cost almost nothing extra.
- Building and fixing: about 10 sessions, split by place. Builders are the heavy users of the plan's 5-hour usage window (each about 20–40× a render worker).
- If the plan's usage window runs out, sessions pause until it resets; work is committed and pushed, so nothing is lost.

**Review strips too (user, 2026-10-28):** full-film review strips (EpNPart*) are rendered on cloud sessions as well (about 6 sessions, two parts each, pushing contact sheets), never on the coordinator session: one part takes ~12 min locally.

## Faster renders (learned on Ep9 v2, 2026-10-28; the user: "should be like 2-5 minutes max")
- Software WebGL on dark, foggy, lit scenes runs ~20-30 frames/min per session, not 140: plan from that.
- Stay at ~20 render sessions (the user: 40-60 is too much). Each takes ONE contiguous range (film frames / 20).
- Expect ~45-55 min for a 15-min film at that speed; say so up front instead of promising minutes.
- ONE range per session; never two renders at once on one machine (it halves the speed).
- Start (warm) the render sessions while the final review runs, so they begin drawing as soon as the SHA is fixed.
