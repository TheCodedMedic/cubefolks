---
name: sets-full-of-detail
description: No blank surfaces: opened doors and gates reveal furnished rooms, windows show views, skies have detail; feet always land on what they stand on
metadata:
  type: feedback
---

The user, 2026-10-24, on the Ep06 first minute: the rolling gate "is meant to show what's there, but it's showing a very
plain wall … When a door is open, things have to be inside. In the surroundings, there have to be details in the sky or
side or whatever. Don't put blank colors everywhere." And: on the stairs "his leg was entering into the concrete …
When you are climbing on top of something, it needs to be on top of it … well calculated."

**Why:** blank planes and clipping break the film's reality at once; viewers notice them before anything else.

**How to apply:**
- Anything that opens (gate, door, window, curtain) opens onto a dressed space: furniture, lights, props, people.
- Every window has a view (sky, buildings, trees at the right height for the floor); every sky has detail (night: stars,
  moon, clouds; day: clouds, haze). No flat-colour backdrops.
- Rooms get the lived-in layer: pictures, plants, books, lamps, rugs, a clock; streets get racks, bins, hydrants, signs.
- Feet: use `groundFit` (`video/src/cam3d/Ground3D.ts`) with the set's exact walking surface for stairs, steps and kerbs;
  build steps solid with exact rise and tread. Check every climbing or standing-on shot in stills.
