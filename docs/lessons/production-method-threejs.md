---
name: production-method-threejs
description: "User decision 2026-10-23: our production method is now 3D-in-code (Three.js inside Remotion, tools/yta-cloud/video/src/cam3d), not Blender: 'This is the best. This is what we would be using'"
metadata:
  node_type: memory
  type: project
  originSessionId: aedc497c-b939-484f-acd1-44568a738f16
  modified: 2026-10-23T00:32:33.598Z
---

From 2026-10-23 the channel's videos are built as real 3D scenes in code: Three.js through `@remotion/three` in `tools/yta-cloud/video` (`src/cam3d/Person3D.tsx` character, `World3D.tsx` set, `CameraTest.tsx` camera system). The user saw the 65 s camera test (8 angles, 12 moves, rendered in about 76 s) and said "This is the best. This is what we would be using."

**Why:** Blender renders were far too slow (about 21 frames a minute, overnight renders for an episode; the user had complained repeatedly and forbade RunPod). The code method renders about 70 times faster on this Mac and still gives true 3D camera angles and moves, plus bodies that read correctly from every angle.

**How to apply:**
- Build Shorts and episodes with the cam3d system. Grow it (sets, cast, props, camera presets) rather than going back to the Blender engine, unless the user asks.
- Keep the Motion Graphic style rules: [[motion-graphic-style-reference]].
- Render locally with `--gl=angle --port=3301` (port 3000 is taken by another app).
- No grain or vignette on 3D renders unless asked ([[3d-look-no-filters]]).
- The engine root stays read-only. CLAUDE.md's "always builds with the live engine" rule predates this decision.
