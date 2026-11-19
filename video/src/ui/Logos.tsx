import React from "react";
import { Img, staticFile } from "remotion";
import { C, mono, sans } from "../theme";

/**
 * The official "群核科技 Manycore | Aholo" lockup, as served on the hackathon page
 * (aholo.ai/hackathon). It is white artwork, so it always sits on a dark ground: on light or
 * orange scenes it gets a dark plate. Unaltered.
 */
export const Lockup: React.FC<{ height?: number; plate?: boolean; style?: React.CSSProperties }> = ({ height = 51, plate, style }) => {
  const img = <Img src={staticFile("logos/manycore-aholo.png")} style={{ height, width: (height * 448) / 51, display: "block" }} />;
  if (!plate) return <div style={style}>{img}</div>;
  return <div style={{ display: "inline-block", background: C.canvas, borderRadius: 12, padding: `${height * 0.42}px ${height * 0.6}px`, boxShadow: "0 18px 44px rgba(11,11,10,0.25)", ...style }}>{img}</div>;
};

/** Aholo Lux3D's own mark (the @Aholo_Lux3D profile image), unaltered, with the product name. */
export const Lux3D: React.FC<{ size?: number; label?: React.ReactNode; color?: string; muted?: string; style?: React.CSSProperties }> = ({ size = 40, label = "Aholo Lux3D", color = C.ink, muted, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3, ...style }}>
    <Img src={staticFile("logos/aholo-lux3d.jpg")} style={{ width: size, height: size, borderRadius: size * 0.24, display: "block", boxShadow: "0 0 0 1px rgba(11,11,10,0.12)" }} />
    {label ? <span style={{ fontFamily: sans, fontWeight: 600, fontSize: size * 0.56, letterSpacing: "-0.02em", color }}>{label}{muted ? <span style={{ fontFamily: mono, fontWeight: 400, fontSize: size * 0.4, color: muted, marginLeft: size * 0.3, letterSpacing: "0.04em" }} /> : null}</span> : null}
  </div>
);
