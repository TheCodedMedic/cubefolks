// Stills of the TOWN sets for review (not part of the Short). Render with:
//   npx remotion still src/short06_blocky/town_preview_entry.ts TownDay out/town_day.png
import React from "react";
import { Composition, useCurrentFrame } from "remotion";
import { ShortFrame, FPS } from "../kit/Short";
import { CamS, push, Shot, V3 } from "../kit/core";
import { BlockLights, Sky } from "../blocky/Look";
import { Bike, HOME, JENNY_HOUSE, JENNY_LAWN, MissingPoster, MyStreet, POSTER_AT, SchoolYard, StreetSet, YARD_SPOT, LOT_X } from "./Town";

const c = (pos: V3, target: V3, fov: number): CamS => ({ pos, target, fov });
const one = (id: string, scene: Shot["scene"], a: CamS, b: CamS): Shot[] => [{ id, t0: 0, t1: 1, enter: "cut", scene, cam: (t) => push(a, b, t, 0, 1) }];

const VIEWS: Record<string, Shot[]> = {
  TownDay: one("day", () => <StreetSet time="day" />, c([30, 7, 58], [4, 6, 8], 50), c([29, 7, 56], [4, 6, 8], 50)),
  TownDayHome: one("home", () => <StreetSet time="day" focus={[0, 0, 10]} />, c([4, 6, 40], [-3, 7, 4], 42), c([4, 6, 39], [-3, 7, 4], 42)),
  TownDayAlong: one("along", () => <StreetSet time="day" />, c([-40, 5, 33], [40, 4, 20], 46), c([-39, 5, 33], [40, 4, 20], 46)),
  TownNight: one("night", () => <StreetSet time="night" jennyDark bike poster />, c(
    [JENNY_LAWN[0] - 4, 5, 46], [JENNY_HOUSE[0], 6, 6], 50), c([JENNY_LAWN[0] - 4, 5, 45], [JENNY_HOUSE[0], 6, 6], 50)),
  TownBike: one("bike", () => <StreetSet time="day" bike />, c([JENNY_LAWN[0] - 6, 4, JENNY_LAWN[2] + 9], [JENNY_LAWN[0], 0.8, JENNY_LAWN[2]], 40),
    c([JENNY_LAWN[0] - 6, 4, JENNY_LAWN[2] + 9], [JENNY_LAWN[0], 0.8, JENNY_LAWN[2]], 40)),
  TownPoster: one("poster", () => <StreetSet time="day" poster />, c([POSTER_AT[0] + 1.5, 5.4, POSTER_AT[2] + 7], [POSTER_AT[0], 5.4, POSTER_AT[2]], 45),
    c([POSTER_AT[0] + 1.5, 5.4, POSTER_AT[2] + 7], [POSTER_AT[0], 5.4, POSTER_AT[2]], 45)),
  TownSchool: one("school", () => <><Sky time="day" /><BlockLights time="day" focus={YARD_SPOT} /><SchoolYard /></>,
    c([YARD_SPOT[0] + 6, 6, YARD_SPOT[2] + 22], [YARD_SPOT[0] - 4, 5, -10], 50), c([YARD_SPOT[0] + 6, 6, YARD_SPOT[2] + 21], [YARD_SPOT[0] - 4, 5, -10], 50)),
  TownSchool2: one("school2", () => <><Sky time="day" /><BlockLights time="day" focus={YARD_SPOT} /><SchoolYard /></>,
    c([-6, 7, 34], [0, 3, 0], 50), c([-5, 7, 33], [0, 3, 0], 50)),
  TownFar: one("far", () => <StreetSet time="day" focus={[0, 0, 70]} />, c([10, 6, 30], [0, 8, 90], 50), c([9, 6, 30], [0, 8, 90], 50)),
  TownNightWide: one("nw", () => <StreetSet time="night" jennyDark bike />, c([-10, 9, 62], [24, 5, 10], 50), c([-9, 9, 62], [24, 5, 10], 50)),
  TownNightHome: one("nh", () => <StreetSet time="night" jennyDark />, c([16, 7, 60], [16, 9, 0], 55), c([16, 7, 59], [16, 9, 0], 55)),
  TownRecess: one("recess", () => <><Sky time="day" /><BlockLights time="day" focus={YARD_SPOT} /><SchoolYard /></>,
    c([24, 6.5, 32], [2, 3, 6], 48), c([23, 6.5, 31], [2, 3, 6], 48)),
};
void HOME; void MyStreet; void Bike; void MissingPoster; void LOT_X;

const make = (shots: Shot[]): React.FC => () => <ShortFrame shots={shots} t={useCurrentFrame() / FPS} />;
export const TownPreviews: React.FC = () => (
  <>
    {Object.entries(VIEWS).map(([id, shots]) => (
      <Composition key={id} id={id} component={make(shots)} width={1080} height={1920} fps={30} durationInFrames={30} />
    ))}
  </>
);
