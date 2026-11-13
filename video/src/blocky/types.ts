// Shared types for the blocky style (notes/short06/CONTRACT.md). Do not change without telling the integrator.
// Expressions: classic blocky-game decal faces. "happy" = closed ^ ^ eyes + smile; "stare" = wide unblinking dot eyes, no mouth.
export type Expr = "smile" | "grin" | "happy" | "worried" | "scared" | "surprised" | "blank" | "smirk" | "creepy" | "stare" | "talk" | "laugh";
export type Look = { skin: string; shirt: string; pants: string; shirtPattern?: "plain" | "stripes" | "plaid" | "pajamas";
  hair?: "short" | "bob" | "spiky" | "bun" | "cap" | "long" | "ponytail" | "none"; hairColor?: string; hat?: "none" | "cap" | "beanie";
  tie?: string; glasses?: boolean };
// radians; armL/armR: forward swing (+ = raise forward), armLOut/armROut: sideways raise; head: [yaw, pitch]
// tilt: head roll (+ = toward its left shoulder); twist: upper-body yaw at the hips (+ = to its left);
// roll: whole body rocks sideways about the feet (+ = to its left), for weight shifts and laughs.
export type Pose = { armL?: number; armR?: number; armLOut?: number; armROut?: number; legL?: number; legR?: number; head?: [number, number]; lean?: number;
  tilt?: number; twist?: number; roll?: number };
/** Limb swing input. amount 1 = walk (legs +-0.75 rad), ~1.4 = run. flight 0..1 adds a hop (run). The hips dip so the feet stay planted. */
export type Walk = { phase: number; amount: number; flight?: number };
