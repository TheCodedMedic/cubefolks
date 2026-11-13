// Short 6: ONE place re-exporting every builder's parts (notes/short06/CONTRACT.md). Shots import from "./parts06" only.
// The integrator swaps each STUB below for the builder's real export as the branch is merged.
import React from "react";
import * as THREE from "three";
import type { V3, Shot } from "../kit/core";

// ---- shared blocky parts (RIG, FACE, LOOK) ----
export { BlockChar, wavePose, knockPose, walkAt, POSES, blinkCurve, blendPose, HEAD_R } from "../blocky/BlockRig";
export type { PoseName } from "../blocky/BlockRig";
export type { BlockCharProps } from "../blocky/BlockRig";
export { makeFaceTexture } from "../blocky/BlockFace";
export { BlockLights, Sky, LIGHTS, Grade as GradeDom } from "../blocky/Look";
/** Scene-safe no-op: the night vignette is a DOM overlay; use GradeDom inside a shot's dom(), never inside scene(). */
export const Grade: React.FC<{ time?: string; strength?: number }> = () => null;
export type { TimeOfDay } from "../blocky/Look";
export type { Expr, Look, Pose, Walk } from "../blocky/types";
import type { Pose } from "../blocky/types";

export * from "./cast";

// ---------------- STUBS (replaced on merge) ----------------
// LOOK: textures, grade
export { tex, mat, rep, texNeutral, bump } from "../blocky/Textures";
export type { TexKind, MatProps } from "../blocky/Textures";
// TOWN
export { MyStreet, StreetSet, JennyHouseDark, Bike, MissingPoster, SchoolYard, HOME, JENNY_HOUSE, JENNY_LAWN, YARD_SPOT, POSTER_AT, LOT_X, STREET, SCHOOL, sidewalkAt } from "./Town";
export type { TownTime } from "./Town";
// HOUSE
export { Bathroom, Kitchen, DiningRoom, Hallway, Bedroom, Razor, Spoon, Shoes, Towel, MIRROR, SINK_FRONT, DOORWAY, STOOL_TOP, KITCHEN_SINK, TABLE, SEATS, SEAT_HEIGHT, SEAT_YAW, seatAt, HALL_MIRRORS, HALL_NORMAL, HALL_SPOTS, BED, BEDROOM_DOOR, SHOE_SPOT } from "./House";
// SHOTS (SHOTS-A owns cast.ts + ShotsA.tsx, SHOTS-B owns ShotsB.tsx; Short06.tsx imports these from here)
