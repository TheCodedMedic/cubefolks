# Nothing is embedded in the floor (user, 2026-10-25)

The user caught a bike with its tyres sunk into a raised sidewalk (bike at y 0, sidewalk top at 0.08). Rule: no tyre,
foot, chair or bed leg, or prop ever sinks into a surface, and nothing floats above one. Every set with raised surfaces
(sidewalks, curbs, porches, steps, platforms, rugs, ballast) exports a `groundAt(x, z)`, and every person, vehicle and
prop is placed with it; anything crossing a curb follows the surface. Check contact with low-angle stills.
