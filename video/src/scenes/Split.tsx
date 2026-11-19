import React from "react";
import { interpolate } from "remotion";
import { C, mono } from "../theme";
import { clamp, expo } from "../ui/motion";
import { Count } from "../ui/Count";
import { Browser, markOf } from "../ui/Footage";
import { Words } from "../ui/Words";
import { Card, Display, Fill, In, Kicker, useCue } from "./common";
import { Lockup, Lux3D } from "../ui/Logos";


/** partSplit, on the live Parts panel: the explode slider is dragged as the line says "Drag". */
export const Split: React.FC = () => {
  const { f, rel } = useCue("split");
  const tPart = rel("Part"), tFour = rel("four"), tNot = rel("not"), tDrag = rel("Drag");
  const drag = markOf("parts", "parts.drag");
  const hold = Math.max(0, tDrag - 8 - drag);
  const title = interpolate(f, [tPart - 12, tPart], [1, 0], clamp);
  const push = interpolate(f, [tDrag - 30, tDrag + 10], [0, 1], { ...clamp, easing: expo });
  return (
    <Fill tone="dark">
      <Browser name="parts" url="holorra.xyz/studio · Parts" width={1500} left={380 - push * 170} top={120 - push * 40} hold={hold}
        cams={[{ f: 0, z: 1.25, rect: { x: 760, y: 120, w: 760, h: 520 } }, { f: tDrag - 20, z: 1.25, rect: { x: 760, y: 120, w: 760, h: 520 } }, { f: tDrag + 20, z: 1.42, rect: { x: 900, y: 150, w: 700, h: 460 } }]} />
      <div style={{ position: "absolute", left: 110, top: 150, width: 900, opacity: title }}>
        <Kicker color={C.ink3} dot={C.accent}>lux3d.partSplit.create</Kicker>
        <Display size={84} style={{ marginTop: 20, textShadow: "0 6px 40px rgba(0,0,0,0.9)" }}>
          <Words text="A fused mesh is still a statue." at={rel("fused") - 8} every={4} accent={{ "statue.": C.accent }} />
        </Display>
      </div>
      <In at={4} out={tDrag + 40} style={{ position: "absolute", left: 90, top: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Lux3D size={40} />
          <span style={{ fontFamily: mono, fontSize: 16, letterSpacing: "0.1em", color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 6, padding: "5px 10px" }}>SPLIT · IN LUX3D'S 18 NOV 2026 UPDATE</span>
        </div>
      </In>
      <Card at={tFour - 6} left={90} top={170} width={330} accent={C.accent} out={tDrag + 40}>
        <div style={{ fontSize: 120, fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 1 }}><Count to={4} at={tFour - 6} dur={14} /></div>
        <div style={{ fontFamily: mono, fontSize: 18, color: C.ink2, letterSpacing: "0.1em", marginTop: 8 }}>REAL PARTS · 118 S</div>
      </Card>
      <Card at={tNot - 6} left={90} top={420} width={330} out={tDrag + 40}>
        <div style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1 }}><Count to={229788} at={tNot - 6} dur={26} /></div>
        <div style={{ fontFamily: mono, fontSize: 18, color: C.ink2, letterSpacing: "0.1em", marginTop: 10 }}>TRIANGLES BEFORE</div>
        <div style={{ fontSize: 56, fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1, marginTop: 18, color: C.accent }}><Count to={229788} at={tNot + 8} dur={26} /></div>
        <div style={{ fontFamily: mono, fontSize: 18, color: C.ink2, letterSpacing: "0.1em", marginTop: 10 }}>TRIANGLES AFTER</div>
      </Card>
    </Fill>
  );
};
