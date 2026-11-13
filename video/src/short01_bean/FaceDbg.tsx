import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { drawFace, EXPR, PHI_SPAN, PX, THETA_SPAN } from "../bean/Face";
export const FaceDbg: React.FC = () => {
  const urls = useMemo(() => ["#b9773f", "#f7dcc8", "#7c4a2d"].map((skin) => {
    const c = document.createElement("canvas"); c.width = Math.round(PHI_SPAN * PX); c.height = Math.round(THETA_SPAN * PX);
    drawFace(c.getContext("2d")!, EXPR.smug, { skin, brow: "#4b2a17" }); return c.toDataURL();
  }), []);
  return <AbsoluteFill style={{ background: "#888" }}>{urls.map((u, i) => <img key={i} src={u} style={{ width: 760, display: "block" }} />)}</AbsoluteFill>;
};
