// Set previews for Short 09 (dev only): SHOTS-like list rendered through Short09At by setting PREVIEW in Short09.tsx.
import React from "react";
import type { Shot } from "../kit/core";
import { Street09 } from "./Town09";
import { Lights09, PorchLamp, Switch, FrontDoor, W } from "./Porch09";
import { OurRoom, BellRoom, Grocery, Cart, GX } from "./Interior09";

const mk = (id: string, i: number, scene: Shot["scene"], cam: Shot["cam"]): Shot => ({ id, t0: i, t1: i + 1, scene, cam, still: true, enter: "cut" });
export const PREVIEW: Shot[] = [
  mk("street_from_bell", 0, () => <><Lights09 time="night" focus={[-3, 0, 20]} /><Street09 time="night" /><PorchLamp lot="home" on={1} /><PorchLamp lot="bell" on={1} /></>,
    () => ({ pos: W("bell", [-8, 7, 13]), target: [-3, 5, 10], fov: 40 })),
  mk("bell_porch", 1, () => <><Lights09 time="night" focus={W("bell", [-3, 0, 12])} /><Street09 time="night" /><PorchLamp lot="bell" on={1} /><Switch lot="bell" up={1} /><FrontDoor lot="bell" open={0} color="doorGreen" /></>,
    () => ({ pos: W("bell", [4, 6, 24]), target: W("bell", [-4, 4.5, 10]), fov: 40 })),
  mk("our_room", 2, (t) => <><Lights09 time="inNight" focus={[2, 1.2, 2]} /><Street09 time="night" homeCut /><PorchLamp lot="home" on={0} /><FrontDoor lot="home" open={0.2} color="doorRed" /><OurRoom t={t} lamp={1} hall={1} /><Switch lot="home" inside up={0} /></>,
    () => ({ pos: [-7, 7.5, -6], target: [3, 3.5, 5], fov: 50 })),
  mk("our_window", 3, (t) => <><Lights09 time="inNight" focus={[2, 1.2, 2]} /><Street09 time="night" homeCut /><PorchLamp lot="bell" on={1} /><FrontDoor lot="home" open={0} color="doorRed" /><OurRoom t={t} curtain={0.6} /></>,
    () => ({ pos: [1, 5.5, 1], target: [5, 5.5, 12], fov: 50 })),
  mk("bell_hall", 4, () => <><Lights09 time="inNight" focus={W("bell", [-3, 1.2, 4])} /><Street09 time="night" bellCut /><FrontDoor lot="bell" open={0.8} color="doorGreen" /><BellRoom /><PorchLamp lot="bell" on={1} /></>,
    () => ({ pos: W("bell", [4, 6.5, -4]), target: W("bell", [-5, 4, 7]), fov: 50 })),
  mk("grocery", 5, () => <><Lights09 time="store" focus={[GX, 0, 0]} /><Grocery /><Cart at={[GX + 1, 0, 4]} yaw={0.3} /></>,
    () => ({ pos: [GX + 2, 6.5, 18], target: [GX, 3.5, 0], fov: 50 })),
];
