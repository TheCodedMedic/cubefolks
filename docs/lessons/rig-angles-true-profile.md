---
name: rig-angles-true-profile
description: User (2026-10-22) rejected side-view frames where the torso faced the camera with arms on the sternum; characters must be drawn at real angles (front / three-quarter / profile)
metadata:
  node_type: memory
  type: feedback
  originSessionId: aedc497c-b939-484f-acd1-44568a738f16
  modified: 2026-10-22T20:23:09.002Z
---

When the user reviews a video they check the characters' anatomy at every angle. Frames where a "side" character has a front-facing torso with the limbs rooted at the chest are rejected outright ("his body is still looking as though he's facing me... which is weird. We need to know how to be able to render at different angles").

**Why:** the user's bar is believable bodies, the same as the hands/arms feedback on Ep03. A walking or turning figure must read as a real profile or three-quarter: narrow torso, chest forward, shoulders at the back of the chest, one eye in profile.

**How to apply:** in the Remotion rig (`tools/yta-cloud/video/src/kit/Character.tsx`) use `view="side"` (true profile) for walks and silhouettes, `view="quarter"` when the expression must read, and the `yaw` prop (0 front … 1 profile) for turns; render the `RigTest` composition after any rig change and look at every angle before a long render. Related: [[3d-look-no-filters]], [[no-letterbox-default]].
