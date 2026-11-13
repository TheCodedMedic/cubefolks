---
name: 3d-look-no-filters
description: "The user likes the real-3D Blender build but wants the raw render: no vignette, grain or post grade on top"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 47f040bd-d02d-490b-864d-7c8085c8d164
  modified: 2026-10-21T16:35:53.196Z
---

On the Short 02 3D look test (2026-10-21) the user said they like the 3D build, but not the vignette or the grain ("it's making it look unclear… I like it to be normal"). Deliver the render as it comes out of Blender (EEVEE, AgX) with no post filter: no vignette, film grain, added bloom or contrast curve.

**Why:** the filters made the picture look muddy and less clear to them; the 3D lighting already carries the mood.

**How to apply:** for any 3D-built picture, skip the house post grade (the nexus skill's bloom/vignette/grain values apply to the old 2.5D look only, if at all); ask before adding any filter. Related: [[shorts-retention-feedback]].
