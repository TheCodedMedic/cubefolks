// Episode 16 full film: the approved first minute (POpen, PTtl, PHome, PBus) + ten windows (Q*.tsx, core.tsx WIN2). Compositions Ep16Film,
// Ep16FilmPicture (muted, for the cloud render) and Ep16FilmCheck<Name> (stills from check-Q<Name>.json).
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { useEpFonts } from "../ep04/AssetSheet";
import { FILM_END, FPS4, Shot, ShotFrame } from "./core";
import * as Open from "./POpen";
import * as Ttl from "./PTtl";
import * as Home from "./PHome";
import * as Bus from "./PBus";
import * as QSchool from "./QSchool";
import CQSchool from "./check-QSchool.json";
import * as QDelgado from "./QDelgado";
import CQDelgado from "./check-QDelgado.json";
import * as QRule from "./QRule";
import CQRule from "./check-QRule.json";
import * as QNight from "./QNight";
import CQNight from "./check-QNight.json";
import * as QLetter from "./QLetter";
import CQLetter from "./check-QLetter.json";
import * as QJordan from "./QJordan";
import CQJordan from "./check-QJordan.json";
import * as QPizza from "./QPizza";
import CQPizza from "./check-QPizza.json";
import * as QPlan from "./QPlan";
import CQPlan from "./check-QPlan.json";
import * as QApril from "./QApril";
import CQApril from "./check-QApril.json";
import * as QEnding from "./QEnding";
import CQEnding from "./check-QEnding.json";

const B = [Open, Ttl, Home, Bus, QSchool, QDelgado, QRule, QNight, QLetter, QJordan, QPizza, QPlan, QApril, QEnding];
export const W16_FILM_NAMES = ["School", "Delgado", "Rule", "Night", "Letter", "Jordan", "Pizza", "Plan", "April", "Ending"];
const SHOTS: Shot[] = B.flatMap((m) => m.SHOTS).sort((a, b) => a.t0 - b.t0);
export const W16_FILM_SHOTS = SHOTS.map((s, i, a) => ({ ...s, t1: a[i + 1] ? a[i + 1].t0 : FILM_END }));
export const W16_FILM_FRAMES = Math.round(FILM_END * FPS4);
const Type: React.FC<{ t: number }> = ({ t }) => <>{B.map((m, i) => <m.Type key={i} t={t} />)}</>;
const EMPTY: React.FC = () => <AbsoluteFill style={{ background: "#05070F" }} />;

export const Ep16Film: React.FC<{ voice?: boolean }> = ({ voice = true }) => {
  const ready = useEpFonts();
  const t = useCurrentFrame() / FPS4;
  if (!ready) return <EMPTY />;
  return <><ShotFrame shots={W16_FILM_SHOTS} t={t} type={Type} />{voice && <Audio src={staticFile("ep16_film.wav")} />}</>;
};
export const Ep16FilmPicture: React.FC = () => <Ep16Film voice={false} />;
const CHECKS = [CQSchool, CQDelgado, CQRule, CQNight, CQLetter, CQJordan, CQPizza, CQPlan, CQApril, CQEnding] as unknown as [string, number][][];
export const w16FilmCheckCount = (k: number) => Math.max(1, CHECKS[k].length);
export const Ep16FilmCheck: React.FC<{ k?: number }> = ({ k = 0 }) => {
  const ready = useEpFonts();
  const c = CHECKS[k][useCurrentFrame()];
  if (!ready || !c) return <EMPTY />;
  return <ShotFrame shots={W16_FILM_SHOTS} t={c[1]} type={Type} label={`${c[0]} ${c[1].toFixed(2)}s`} />;
};
