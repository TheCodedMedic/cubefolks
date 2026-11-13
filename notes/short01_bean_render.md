# Short 1 "Clever Hans" (Beanfolk 3D): render split

- Frozen source: `7d22851715c18ac0ca60489b13c09b20d6dcd462` on `claude/short01-bean`; composition `Short01Bean`, 1080x1920, 30 fps, 2011 frames (67.03 s).
- 14 parts of 143 frames (the last runs to 2010), one cloud session each, each pushing `parts/short01_bean_KK.mp4` to its own branch.
- Measured locally: about 1.2-1.5 s a frame at concurrency 4, so a part is about 3-4 minutes of drawing.

| part | start | end | frames | branch |
|---|---|---|---|---|
| 01 | 0 | 142 | 143 | claude/short01-bean-part01 |
| 02 | 143 | 285 | 143 | claude/short01-bean-part02 |
| 03 | 286 | 428 | 143 | claude/short01-bean-part03 |
| 04 | 429 | 571 | 143 | claude/short01-bean-part04 |
| 05 | 572 | 714 | 143 | claude/short01-bean-part05 |
| 06 | 715 | 857 | 143 | claude/short01-bean-part06 |
| 07 | 858 | 1000 | 143 | claude/short01-bean-part07 |
| 08 | 1001 | 1143 | 143 | claude/short01-bean-part08 |
| 09 | 1144 | 1286 | 143 | claude/short01-bean-part09 |
| 10 | 1287 | 1429 | 143 | claude/short01-bean-part10 |
| 11 | 1430 | 1572 | 143 | claude/short01-bean-part11 |
| 12 | 1573 | 1715 | 143 | claude/short01-bean-part12 |
| 13 | 1716 | 1858 | 143 | claude/short01-bean-part13 |
| 14 | 1859 | 2010 | 152 | claude/short01-bean-part14 |

Part sessions (created by session_01LQP7w1ERQr3miTeZqx3tVn): 01 session_01LQP7vwRdyvr4tQeYF46fSR, 02 session_01LQP7w11hBW8ZWxLXBQSw7o,
03 session_01LQP7w18aRW9kG5kGHyjjy4, 04 session_01LQP7vz8LXETwN4DPiZ6u2X, 05 session_01LQP7vwG528sr7C9hjKxzHs, 06 session_01LQP7w1pqNEiAzEfTqJ8xig,
07 session_01LQP7vwd9nLzQ7c7RcjrVWf, 08 session_01LQP7vwLSCazquHKFmiHdr4, 09 session_01LQP7vymcqJ4ygrLxhc2yWr, 10 session_01LQP7vx61ZqQWt8obqVHjrF,
11 session_01LQP7vy79J9GS2eSgNun2ex, 12 session_01LQP7vwvPd3svCpjNurv7WR, 13 session_01LQP7vzqF8vfPHxoemzBkAZ, 14 session_01LQP7vwQT3bZVXovdrNkWrJ.

## Result (2026-11-09)
- All 14 parts collected (143 frames each, part 14 152), remuxed and joined with a stream copy: 2011 frames; no black runs (min YAVG 16.3).
- Finished: `exports/short01_clever_hans_bean.mp4`, 67.03 s, -14.2 LUFS, -2.1 dBTP, video and audio the same length.
- Drive: https://drive.google.com/open?id=1YEWIITSpO4hRKhthOYxR2LVub8CTO7Bh
- Review sheets: `docs/review/short01_bean_every_second.jpg` (one frame a second), `docs/review/short01_bean_parts.jpg` (first, middle and last frame of each part).
