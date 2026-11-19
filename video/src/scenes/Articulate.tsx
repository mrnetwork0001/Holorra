import React from "react";
import { C, mono, serif, TONE } from "../theme";
import { Card, Fill, Finder, In, Kicker, Plate, useCue } from "./common";
import { Lockup, Lux3D } from "../ui/Logos";


const T = TONE.light;
/** articulationAnimation: the real joints running on the machine, with what the URDF named them. */
export const Articulate: React.FC = () => {
  const { rel, dur } = useCue("articulate");
  const tThen = rel("Then"), tHood = rel("hood"), tDrawer = rel("drawer"), tReal = rel("real");
  const row = (k: string, v: string, w: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 20 }}>
      <span style={{ fontFamily: mono, fontSize: 27, color: C.canvas }}>{k}</span>
      <span style={{ fontFamily: mono, fontSize: 21, color: T.accent }}>{v}<span style={{ color: T.muted }}> · {w}</span></span>
    </div>
  );
  return (
    <Fill tone="light">
      <Plate name="artic" from={20} x={90} y={90} w={1120} h={900} dur={dur} z0={1.3} z1={1.42} ox={50} oy={56} radius={14} style={{ boxShadow: "0 40px 90px rgba(11,11,10,0.3)" }} />
      <Finder x={90} y={90} w={1120} h={900} p={1} color={C.accent} arm={44} weight={4} />
      <div style={{ position: "absolute", left: 1270, top: 84, width: 560 }}>
        <In at={tThen - 6}><Lux3D size={44} color={C.canvas} /></In>
        <In at={tThen - 4} style={{ marginTop: 16 }}><Kicker color={T.muted} dot={T.accent}>lux3d.articulationAnimation.create</Kicker></In>
        <In at={tThen + 2} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 44, lineHeight: 1.14, letterSpacing: "-0.01em", color: C.canvas }}>
            “The top brewing hood hinges open upward about its back edge while the front capsule drawer slides out.”
          </div>
        </In>
      </div>
      <Card at={tHood - 6} left={1270} top={520} width={560} tone="light" accent={T.accent}>{row("hood_top", "revolute", "0–90°")}</Card>
      <Card at={tDrawer - 6} left={1270} top={630} width={560} tone="light" accent={T.accent}>{row("drawer_front", "prismatic", "slide")}</Card>
      <Card at={tReal - 8} left={1270} top={770} width={560} tone="dark">
        <Kicker color={C.ink3} size={15}>Returned by Lux3D · task 8354168 · 298 s</Kicker>
        <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.035em", marginTop: 10 }}>A URDF with real joints</div>
        <div style={{ fontFamily: mono, fontSize: 19, color: C.ink2, marginTop: 8 }}>4 links · 1 hinge · 1 slide · with limits</div>
      </Card>
    </Fill>
  );
};
