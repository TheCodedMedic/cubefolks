// Review-only preview shots of the classroom and Short 10 props (removed from SHOTS once real shots land).
import React from "react";
import type { Shot } from "../kit/core";
import { Classroom } from "../blocky/Classroom";
import * as P from "./Props";
import { Ch, Lights, ME, KID } from "./common";

const Room: React.FC<{ drawer: number | null; t: number }> = ({ drawer, t }) => <>
  <Lights focus={P.CAGE_POS} />
  <Classroom />
  <P.ClassCage drawer={drawer} wheel={t * 4}>{drawer === 0 && <P.Hamster look={P.NIBBLES} p={[0.2, P.CAGE.base, 0.3]} cheeks={1} />}</P.ClassCage>
  <P.BagRow />
</>;
const mk = (id: string, t0: number, scene: (t: number) => React.ReactNode, pos: [number, number, number], target: [number, number, number], fov = 40): Shot => ({ id, t0, t1: t0 + 1, scene, cam: () => ({ pos, target, fov }) });
const h = P.HOLE;
export const PREVIEW: Shot[] = [
  mk("cage", 0, (t) => <Room drawer={0} t={t} />, [h[0] - 7, 4.6, h[2] - 1.5], [P.CAGE_CENTER[0], 3.2, P.CAGE_CENTER[2]], 40),
  mk("hole", 1, (t) => <Room drawer={null} t={t} />, [h[0] - 5, 2.6, h[2] + 1.5], [h[0], 1.6, h[2]], 40),
  mk("bags", 2, (t) => <><Room drawer={null} t={t} /><Ch look={ME} t={t} a={{ position: P.HOLE.map((v, i) => i === 0 ? v - 5 : i === 1 ? 0 : v - 2) as any, yaw: Math.PI / 2 }} /></>, [6, 6, h[2] + 6], [18, 2, h[2]], 45),
  mk("bedroom", 3, () => <><Lights time="interiorNight" focus={[0, 0, -3]} practicalAt={[-3, 5, -8]} /><P.Bedroom peanutCage={<P.Cage color="#e86aa0" lock={false} tape={0} sideDoorOpen nest2><P.Hamster look={P.PEANUT} p={[0.6, P.CAGE.base, 0.2]} yaw={-0.6} /></P.Cage>} /><P.Backpack p={P.HOME_BAG} yaw={-Math.PI / 2} color={P.ME_BAG.color} stripe={P.ME_BAG.stripe} open={1} /></>, [-6, 7, 8], [4, 2.5, -2], 50),
  mk("hamsters", 4, () => <><Lights focus={[0, 0, 0]} /><mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[10, 10]} /><meshStandardMaterial color="#e9d9a8" /></mesh><P.Hamster look={P.NIBBLES} p={[-0.6, 0, 0]} yaw={0.4} cheeks={1} /><P.Hamster look={P.PEANUT} p={[0.6, 0, 0]} yaw={-0.4} /><P.Shells p={[0, 0, 1]} /><P.Nest p={[0, 0, -1]} /></>, [0, 1.6, 3.4], [0, 0.4, 0], 40),
];
void KID;
