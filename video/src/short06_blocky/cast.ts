// Short 6 cast (notes/short06/CONTRACT.md, section Cast). Owned by SHOTS-A; SHOTS-B imports it.
import type { Look } from "../blocky/types";

const PALE = "#e9e4dc", LIGHT = "#f0d2b4", WARM = "#c98e62", DEEP = "#8a5a3a";

/** The narrator kid (~10): yellow-and-black stripes, black pants, messy blond spiky hair. */
export const ME: Look = { skin: PALE, shirt: "#f2c81e", pants: "#1c1c20", shirtPattern: "stripes", hair: "spiky", hairColor: "#f3d35a" };
/** ME at night, in blue pyjamas. */
export const ME_PJ: Look = { ...ME, shirt: "#5f86c8", pants: "#5f86c8", shirtPattern: "pajamas" };
export const DAD: Look = { skin: PALE, shirt: "#3f7a46", pants: "#8a8c90", shirtPattern: "plaid", hair: "short", hairColor: "#5a3a22" };
export const MOM: Look = { skin: PALE, shirt: "#e9a3b8", pants: "#2c3a5a", hair: "bun", hairColor: "#6a4024" };
/** Little brother (~6): use with BRO_SCALE. */
export const BRO: Look = { skin: PALE, shirt: "#c8342e", pants: "#3a3f4a", hair: "short", hairColor: "#2a1c14" };
export const BRO_SCALE = 0.75;
/** Kids' scale (ME, JENNY, classmates). */
export const KID_SCALE = 0.82;
export const JENNY: Look = { skin: LIGHT, shirt: "#7a4fb0", pants: "#2a2a34", hair: "long", hairColor: "#141014" };
export const BIKE_RED = "#c8302a";
/** Classmates at recess (varied). */
export const CLASSMATES: Look[] = [
  { skin: WARM, shirt: "#2f7fc8", pants: "#2a2f3a", hair: "short", hairColor: "#1a120c" },
  { skin: PALE, shirt: "#e07a2e", pants: "#3a4a6a", hair: "ponytail", hairColor: "#a0602c" },
  { skin: DEEP, shirt: "#3aa07a", pants: "#202020", hair: "short", hairColor: "#0e0a08", hat: "cap" },
  { skin: LIGHT, shirt: "#d8d4c8", pants: "#4a3a2a", hair: "bob", hairColor: "#c89a4a", glasses: true },
];
export const TEACHER: Look = { skin: LIGHT, shirt: "#5a6a8a", pants: "#2a2a30", hair: "bun", hairColor: "#888078", glasses: true };

// ---- scale. HOUSE interiors are in METRES (an adult BlockChar at scale 0.32 = 1.6 m); TOWN streets are in RIG UNITS
// (an adult at scale 1, 1 m ~ 3.1 units). Use SCALE indoors and SCALE_U on the street.
/** BlockChar `scale` for an adult in metre sets. */
export const ADULT = 0.32;
/** Absolute BlockChar scales in metre sets (HOUSE): adult, kid (ME, JENNY, classmates), little brother. */
export const SCALE = { adult: ADULT, kid: ADULT * KID_SCALE, bro: ADULT * BRO_SCALE } as const;
/** The same in rig-unit sets (TOWN). */
export const SCALE_U = { adult: 1, kid: KID_SCALE, bro: BRO_SCALE } as const;
/** Height of the middle of the face above the feet for a character of BlockChar scale s (head centre at 4.5 rig units). */
export const eyeY = (s: number) => 4.55 * s;
