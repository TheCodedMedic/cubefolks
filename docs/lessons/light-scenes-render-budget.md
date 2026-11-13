# Light scenes: draw like Episode 5 (user rule, 2026-10-28)

The user: "Future episodes should be as light as Episode 5 in terms of their drawings, 'cause yeah, it's taking a lot of time."

## What was measured (same container, same settings, 10 frames, start-up removed)
| | s / frame |
|---|---|
| Episode 5 (Wit5FilmPicture) | ~0.7 |
| Episode 10 bus (Ep10FilmPicture 3000) | ~13.6 |
| Episode 10 bus, shadows off | ~14.3 (shadows are NOT the cost) |
| Episode 10 bus, antialias off | ~6.4 (MSAA doubles the cost of a heavy scene) |

What grew between Ep05 and Ep09/10: meshes in the set code (wit05 ~240, wit10 ~1,500, wit09 ~2,300), lights (15 → 64 → 181),
shadow-casting objects (6 → 76 → 124). In software WebGL every mesh is a draw call and every light is paid on every lit
pixel, and MSAA multiplies both.

## The budget (every shot; check before the review)
- **Meshes in view: about 300 or fewer.** Detail comes from painted textures (a shelf of books is one textured box, a
  window view is one image, a crowd far away is flat cut-outs), not from hundreds of little boxes. Repeated objects
  (seats, lockers, windows, trees) are ONE instancedMesh or one merged geometry. Mount only the set the shot sees.
- **Lights: 3 or fewer per shot** (one key with shadow, one ambient/hemisphere fill, at most one practical). Lamps,
  candles, screens, pumpkins and windows glow through emissive materials and textures, never one pointLight each.
- **People: up to 4 full rigs in frame;** extras are low-detail figures (no fingers, no face parts) or cut-outs.
- **Fog, particles, rain, snow:** one cheap layer, only in the shots that need it.
- **Speed check:** each builder times 10 frames of its heaviest shot (`--frames=a-(a+9)`); it must be at most ~1.5 s
  per frame (Ep05-like). A heavier shot is simplified before review, not after.
This keeps "sets full of detail" (sets-full-of-detail.md): the detail lives in textures, not geometry.
