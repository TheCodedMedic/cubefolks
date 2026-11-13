# Blocky-style test (parallel build contract)

A 7.6 s test Short in an original **blocky toy style** (boxy characters made of a box torso, box arms and legs, a rounded-cylinder
head with a drawn decal face; plastic-toy materials; bright daylight with soft shadows; suburban sets). The genre the owner showed
is Roblox story videos, but this is **our own design built in Three.js**: never copy Roblox's logo, its default smiley face decal,
branded items or names. Original faces, hair and clothes only.

Audio (final, do not re-voice): `episodes/90_blocky_test/` (3 beats, 28 words, voice ends 7.6 s; words.json timed).
> Every house on Maple Street has the same family living in it. / Same dad, same mom, same little kid. / And tonight, one of them knocked on my door.

Everything lives in `video/src/blocky/`. Each builder owns ONLY its files, works on its own branch, and pushes there. 1080x1920, 30 fps.

## Shared interfaces (write to these exactly)
```ts
// video/src/blocky/types.ts  (already committed; do not change without telling the integrator)
export type Expr = "smile" | "grin" | "worried" | "scared" | "blank" | "smirk" | "creepy";
export type Look = { skin: string; shirt: string; pants: string; shirtPattern?: "plain" | "stripes" | "plaid";
  hair?: "short" | "bob" | "spiky" | "bun" | "cap" | "none"; hairColor?: string; hat?: "none" | "cap" | "beanie"; tie?: string };
export type Pose = { armL?: number; armR?: number; legL?: number; legR?: number; head?: [number, number]; lean?: number }; // radians
export type Walk = { phase: number; amount: number }; // limb swing helper input
```
- **RIG** `BlockRig.tsx`: `export const BlockChar: React.FC<{ look: Look; expr?: Expr; pose?: Pose; walk?: Walk; position?: [number,number,number]; yaw?: number; scale?: number; blink?: number }>`
  - proportions: head 1.0 wide x 1.0 tall (rounded cylinder), torso 2.0 x 2.0 x 1.0, arms and legs 1.0 x 2.0 x 1.0; total 5 units = 1.6 m
    (scale 0.32). Feet on y=0. Arms pivot at the shoulder, legs at the hip. Stiff toy swing walk (`walk`), a knock pose usable via `pose`.
  - Imports the face from `BlockFace.tsx` (`makeFaceTexture(expr, blink)`) and hair/hats from `Accessories.tsx` (`<Hair look/>`, `<Hat look/>`).
- **FACE + ACCESSORIES** `BlockFace.tsx`, `Accessories.tsx`: `export function makeFaceTexture(expr: Expr, blink?: number): THREE.CanvasTexture`
  (simple black drawn eyes + mouth decal on a transparent canvas, readable at phone size, our own designs; `creepy` = a too-wide flat smile and
  tiny pupils), `export const Hair: React.FC<{ look: Look }>`, `export const Hat: React.FC<{ look: Look }>` positioned for a head centered
  at local (0,0,0), radius 0.5, height 1.0.
- **SET** `MapleStreet.tsx`: `export const MapleStreet: React.FC<{ time: "day" | "dusk" | "night" }>`: a suburban street of IDENTICAL
  two-storey houses (same colour, same door, same mailbox: the point of the story), lawns, white picket fences, sidewalk, road with lane
  marks, a few bare trees, street lamps; and `export const FrontDoorInterior: React.FC<{ knock: number }>` (a cosy hallway at night,
  looking at the front door from inside; `knock` 0..1 shakes the door; a peephole). Export `HOUSE_X: number[]` (house centers along x)
  and `PORCH: [number,number,number]` for one porch. Units: 1 unit = 1 rig unit (the rig is 5 units tall).
- **LOOK** `Look.tsx`: `export const BlockLights: React.FC<{ time: "day" | "dusk" | "night" }>` (sun + sky fill with soft shadows, no
  more than 3 lights), `export const Sky: React.FC<{ time }>`, and `export function camAt(...)` helpers are not needed: shots use the kit's `Cam`.
- **SOUND** `episodes/90_blocky_test/cues.py` + `sfx_blocky.py`: from `words.json` only (never type seconds): street ambience and birds
  (day), crickets (night), a single dog bark far away, three slow door knocks on "knocked" (synthesise), a low drone under beat 3, a soft
  whoosh on each cut, music 15 dB under the voice, measured with `pipeline/music_level.py` (use `sfx/music/tiptoe_across_the_floorboards.mp3`).
- **INTEGRATOR** `BlockTest.tsx` (composition `BlockTest` and `BlockTestClean`), registered in `video/src/Root.tsx`: merges the four
  builder branches, builds ~7 shots anchored to words with the kit's ShortFrame/Cam/Captions/Pop: (1) frame 0 already shows the street of
  identical houses with identical families waving on every porch, pop-in "MAPLE STREET"; (2) push along the row: the same dad, same mom,
  same kid on each lawn, waving in perfect sync; (3) close on the three of them, smiling, then their heads turn together; (4) dusk:
  the families all go inside at the same moment; (5) night, inside: the narrator kid (pyjamas) in the hallway; (6) the door shakes on
  each knock; (7) peephole view: the same little kid outside, `creepy` face, holds the last frame. Then renders on 10 sessions and finishes.
