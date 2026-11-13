// Shared types for the blocky style (notes/short06/CONTRACT.md). Do not change without telling the integrator.
// Expressions: classic blocky-game decal faces. "happy" = closed ^ ^ eyes + smile; "stare" = wide unblinking dot eyes, no mouth.
export type Expr = "smile" | "grin" | "happy" | "worried" | "scared" | "surprised" | "blank" | "smirk" | "creepy" | "stare";
export type Look = { skin: string; shirt: string; pants: string; shirtPattern?: "plain" | "stripes" | "plaid" | "pajamas";
  hair?: "short" | "bob" | "spiky" | "bun" | "cap" | "long" | "ponytail" | "none"; hairColor?: string; hat?: "none" | "cap" | "beanie";
  tie?: string; glasses?: boolean };
// radians; armL/armR: forward swing (+ = raise forward), armLOut/armROut: sideways raise; head: [yaw, pitch]
export type Pose = { armL?: number; armR?: number; armLOut?: number; armROut?: number; legL?: number; legR?: number; head?: [number, number]; lean?: number };
export type Walk = { phase: number; amount: number }; // limb swing helper input
