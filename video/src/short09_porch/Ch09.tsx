// Short 09 character wrapper: a BlockChar plus leg wear, with the clipping check built in. The audit
// (video/src/short09_porch/clipAudit09.tsx) walks every shot's scene tree for <C> elements and checks the same props.
// Debug renders: pass {"debug": true} in the input props; clipping parts turn magenta.
import React from "react";
import { getInputProps } from "remotion";
import { BlockChar, blinkCurve } from "../blocky/BlockRig";
import * as K from "../blocky/Collide";
import type { Expr, Look, Pose, Walk } from "../blocky/types";
import { LegWear, type V3 } from "./Porch09";

export const DEBUG = (() => { try { return !!(typeof window === "undefined" ? {} : getInputProps() as any)?.debug; } catch { return false; } })();
export type A = { position: V3; yaw: number; pose?: Pose; walk?: Walk; seed?: number };
export type CP = {
  look: Look; a: A; t: number; s?: number; expr?: Expr; blink?: number; hold?: { R?: React.ReactNode; L?: React.ReactNode };
  /** lift above the floor (a jump, tiptoe): the feet check is skipped while lifted */
  lift?: number; still?: boolean; cs?: K.Box[]; others?: K.CharState[]; allow?: string[];
  wear?: ("slippers" | "brace")[]; braceSide?: 1 | -1; blinkSeed?: number;
};
export const st = (a: A, s = 1, lift = 0): K.CharState => ({ position: [a.position[0], a.position[1] + lift, a.position[2]], yaw: a.yaw, pose: a.pose, walk: a.walk, scale: s });

export const C: React.FC<CP> = ({ look, a, t, s = 1, expr = "smile", blink, hold, lift = 0, still, cs = [], others = [], allow = ["seat"], wear = [], braceSide = -1, blinkSeed = 0 }) => {
  const c = st(a, s, lift);
  let hits: ReturnType<typeof K.clipParts> | undefined;
  if (DEBUG) {
    hits = K.clipParts(c, cs, others, 0.04 * s, allow);
    if (lift === 0 && K.footGap(c, cs) < -0.12 * s) { hits.legL = true; hits.legR = true; }
  }
  const b = blink ?? (expr === "stare" ? 0 : blinkCurve(t, blinkSeed));
  return <>
    <BlockChar look={look} scale={s} position={c.position} yaw={a.yaw} walk={a.walk} pose={a.pose} hits={hits} seed={a.seed ?? blinkSeed}
      expr={expr} blink={b} hold={hold} still={still} />
    {wear.includes("slippers") && <LegWear c={c} kind="slippers" />}
    {wear.includes("brace") && <LegWear c={c} kind="brace" side={braceSide} />}
  </>;
};
