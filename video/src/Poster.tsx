import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, mono, sans, serif, zhSerif } from "./theme";
import { Finder, Mark } from "./scenes/common";
import { Lockup } from "./ui/Logos";

/** The thumbnail: the working machine from the live site, the line, the mark. */
export const Poster: React.FC = () => (
  <AbsoluteFill style={{ background: C.canvas, fontFamily: sans, color: C.ink }}>
    <Img src={staticFile("logos/poster-bg.jpg")} style={{ position: "absolute", right: -80, top: -60, width: 1500, height: 1200, objectFit: "cover", objectPosition: "45% 50%" }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(11,11,10,1) 0%, rgba(11,11,10,0.96) 34%, rgba(11,11,10,0.35) 62%, rgba(11,11,10,0) 100%)" }} />
    <Finder x={56} y={56} w={1808} h={968} arm={70} weight={7} />
    <div style={{ position: "absolute", left: 130, top: 120, display: "flex", alignItems: "center", gap: 26 }}>
      <Mark size={96} />
      <span style={{ fontWeight: 600, fontSize: 96, letterSpacing: "-0.055em" }}>Holorra</span>
    </div>
    <div style={{ position: "absolute", left: 130, top: 300, width: 1050, fontWeight: 600, fontSize: 150, letterSpacing: "-0.055em", lineHeight: 0.98 }}>
      The 3D world<br />is <span style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 400, color: C.accent, fontSize: 176 }}>alive.</span>
    </div>
    <div style={{ position: "absolute", left: 134, top: 690, fontFamily: zhSerif, fontWeight: 700, fontSize: 66, letterSpacing: "0.06em", color: C.ink }}>生成 · 拆分 · 绑定 · 执导</div>
    <div style={{ position: "absolute", left: 134, top: 800, fontFamily: mono, fontSize: 30, letterSpacing: "0.04em", color: C.ink2 }}>Generate · Split · Rig · Direct</div>
    <div style={{ position: "absolute", left: 130, top: 900, display: "flex", alignItems: "center", gap: 30 }}>
      <Lockup height={56} />
      <span style={{ fontFamily: mono, fontSize: 30, color: C.accentInk, background: C.accent, padding: "8px 22px", borderRadius: 8 }}>holorra.xyz</span>
    </div>
  </AbsoluteFill>
);
