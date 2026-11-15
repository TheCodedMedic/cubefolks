// Preview shots of the shared classroom (review only).
import React from "react";
import type { Shot } from "../kit/core";
import { BlockChar } from "../blocky/BlockRig";
import { BlockLights } from "../blocky/Look";
import { Classroom, DESK, TEACHER_SPOT, SHELF_FRONT, CLASSROOM_CS } from "../blocky/Classroom";
import * as M from "../blocky/Motion";
import { TOWNSFOLK } from "../blocky/MotionSheet";

const Scene: React.FC<{ t: number }> = ({ t }) => <>
  <BlockLights time="interior" focus={[0, 0, 0]} />
  <Classroom door={0.6} />
  {[0, 1, 2, 3, 4, 5, 7, 9].map((i, k) => { const d = DESK(i); return <BlockChar key={i} look={TOWNSFOLK[k + 1]} scale={0.82} position={[d.seat[0], M.seatedY(d.seat[1], 0.82), d.seat[2]]} yaw={d.yaw} pose={{ legL: Math.PI / 2, legR: Math.PI / 2, armL: 0.35, armR: 0.35 }} expr="smile" />; })}
  <BlockChar look={TOWNSFOLK[12]} scale={1} position={TEACHER_SPOT} yaw={0} expr="smile" pose={{}} />
  <BlockChar look={TOWNSFOLK[0]} scale={0.82} position={SHELF_FRONT} yaw={Math.PI / 2} expr="smile" pose={{}} />
</>;
const mk = (id: string, t0: number, pos: [number, number, number], target: [number, number, number], fov = 50): Shot => ({ id, t0, t1: t0 + 1, scene: (t) => <Scene t={t} />, cam: () => ({ pos, target, fov }) });
export const PREVIEW: Shot[] = [
  mk("back", 0, [6, 11, 17], [-2, 3, -8], 55),
  mk("board", 1, [-2, 6, 2], [0, 6, -18], 55),
  mk("shelf", 2, [2, 7, 2], [20, 2.5, 4], 50),
  mk("windows", 3, [12, 7, 8], [-22, 5, -2], 55),
  mk("drone", 4, [0, 40, 6], [0, 0, 0], 60),
];
void CLASSROOM_CS;
