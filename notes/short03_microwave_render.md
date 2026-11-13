# Short 3 "The Chocolate Bar That Invented the Microwave" (Beanfolk 3D): render split

- Frozen source: `d6f65f412c2be0ef05f6bfd99b33708641176461` on `claude/short03-microwave`; composition `Short03Microwave`, 1080x1920, 30 fps, 1964 frames (65.47 s).
- 14 parts, one cloud session each, each pushing `parts/short03_microwave_KK.mp4` to its own branch.

| part | start | end | frames | branch |
|---|---|---|---|---|
| 01 | 0 | 139 | 140 | claude/short03-microwave-part01 |
| 02 | 140 | 279 | 140 | claude/short03-microwave-part02 |
| 03 | 280 | 419 | 140 | claude/short03-microwave-part03 |
| 04 | 420 | 559 | 140 | claude/short03-microwave-part04 |
| 05 | 560 | 699 | 140 | claude/short03-microwave-part05 |
| 06 | 700 | 839 | 140 | claude/short03-microwave-part06 |
| 07 | 840 | 979 | 140 | claude/short03-microwave-part07 |
| 08 | 980 | 1119 | 140 | claude/short03-microwave-part08 |
| 09 | 1120 | 1259 | 140 | claude/short03-microwave-part09 |
| 10 | 1260 | 1399 | 140 | claude/short03-microwave-part10 |
| 11 | 1400 | 1539 | 140 | claude/short03-microwave-part11 |
| 12 | 1540 | 1679 | 140 | claude/short03-microwave-part12 |
| 13 | 1680 | 1819 | 140 | claude/short03-microwave-part13 |
| 14 | 1820 | 1963 | 144 | claude/short03-microwave-part14 |

Part sessions: 01 session_01LQP7vzSn2qFzLjPBpaensJ, 02 session_01LQP7w17XAz2wxVCMUqDJLW, 03 session_01LQP7vxAoHcGBKZsU1j2H3t, 04 session_01LQP7w1qeUBQ1XuTPSj39Rs,
05 session_01LQP7vyEHvARLEcUGMBbjoP, 06 session_01LQP7w1NqvTZRbNM8AS1tK8, 07 session_01LQP7vw9MhPsDykmHc13WcU, 08 session_01LQP7w1RbN3PaDZs31275Zx,
09 session_01LQP7w19UWRqhjabKsKrNAW, 10 session_01LQP7vwvEwKp4t7S8MhsvYS, 11 session_01LQP7vxWL3TsNjF5M4MwHAi, 12 session_01LQP7vwCPWfDmTxLPchErr8,
13 session_01LQP7vxn4LrJj5xbZxdi6w4, 14 session_01LQP7vzuLSgX671JxTqnjL7.

## Result (2026-11-11)
- All 14 parts collected (140 frames each, part 14 144), remuxed and joined with a stream copy: 1964 frames; no black runs (min YAVG 44.4).
- Mix: music measured -15.0 dB under the voice (`MUSIC_REL = -6.3`). Finished: `exports/short03_microwave.mp4`, 65.47 s, -14.2 LUFS, -2.4 dBTP, video and audio the same length.
- Drive: https://drive.google.com/open?id=1Y_Mnft9Nygstz2ilCUz8Pf74lehUqMn0
- Review: `docs/review/short03_microwave_every_second.jpg`; thumbnails in `docs/review/short03_microwave_thumbs/`.

## v2 (coordinator review, 2026-11-11)
- Fixes: the three POP! pop-ins never overlap (top-left, mid-right, then upper-centre after both are gone); the oven-vs-piano balance framed closer and bigger.
- Frozen `2917d0129bc449c1ca0c162cc1bd7764583c540a`; re-rendered only parts 06, 12, 13 on branches `claude/short03-microwave-v2-partKK`
  (sessions session_01LQP7vwLVBWTQH4qcYSABws, session_01LQP7vwD5gTLeRPKkk56sxR (12, retry: the first part-12 session never started), session_01LQP7vyJc8E96xx7oMCe3pj).
- Joined 1964 frames, min YAVG 44.4. Same mix. `exports/short03_microwave_v2.mp4`: 65.47 s, -14.2 LUFS, -2.4 dBTP.
- Drive: https://drive.google.com/open?id=1upnJYc_rBm_0wTWk2kBkgvbtqDLgXziA
