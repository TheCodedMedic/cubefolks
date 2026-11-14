# Spatial awareness: nothing passes through anything (the owner, 2026-11-14)

The owner on motion sheet v1: "Your characters' hands are apart from their body" and "Why do characters fuse with items?
Sometimes you just see their limbs embedded in walls. There should be absolute spatial awareness and realistic things."

## What was wrong
- **Arms looked detached.** The shoulder pivot sat at the very top of the arm, so a raised arm swung out from its top corner
  and left an empty notch at the shoulder; the hand was a narrower box than the sleeve (read as a separate cube); a small
  rest splay opened a gap at the hip.
- **Limbs inside things.** Poses were just angles: nothing knew where the counter, the seat, the door frame, the steps or
  the other people were. A chop went through the counter, a crowd walked through itself, steps were a ramp the feet sank
  into, a 4-wide character walked through a 3.2-wide door.

## The fix (in the kit, so every Short gets it)
- `BlockRig.tsx`: the classic shoulder joint (pivot inside the arm, 0.5 below its top: `SHOULDER`), the hand as wide as the
  sleeve and overlapping it, no rest splay. `solveRig()` is the one skeleton both the renderer and the checks use.
- `Collide.ts`:
  - every set exports its solid things as **colliders** (boxes; name the ones a character may touch, like `seat`);
  - `groundFn(colliders)` → `walkPath(..., { ground })`: feet step up onto steps and porches as the leading foot arrives;
  - `clipParts(char, colliders, others)`: which parts are inside a collider, another person, or the character's own chest
    (crossed arms); `footGap()` for sunk or floating feet;
  - `reachArm(char, side, target)`: the hand ENDS on a point (door handle, board, shoulder of a friend) and follows it as it
    moves; `armAboveSurface()` keeps a knife tip or fist on top of a surface; `standToReach()` places a character so its
    hand can reach;
  - `separate(positions)`: crowd members never overlap (deterministic, no jitter).
- `Motion.ts`: `sit()` hops onto the seat (legs up first, in free space, then back and down), like the game.
- Doors are **5 units wide** (a character is 4 across the arms); corridors and aisles at least 5.

## The check (every shot, before rendering)
1. Pass each character its set's colliders and the other people in the shot.
2. Render the shot (or the motion sheet cell) with the debug flag: every clipping part turns flat magenta.
3. `python3 -I pipeline/clip_scan.py <debug.mp4>` lists the frames with clipping. **Zero frames** before the real render.
4. Look at the frames it lists, fix the motion (move the mark, aim the hand with reachArm, separate the crowd, widen the
   gap), scan again.
