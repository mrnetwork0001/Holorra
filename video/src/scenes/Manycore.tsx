import React from "react";
import { interpolate } from "remotion";
import { C, mono, sans, TONE, zhSans } from "../theme";
import { clamp, expo, pop } from "../ui/motion";
import { Words } from "../ui/Words";
import { Display, Fill, In, useCue } from "./common";
import { Lockup, Lux3D } from "../ui/Logos";


const T = TONE.light;
const TOOLS = [
  { cue: "SpatialGen", name: "SpatialGen", call: "world.generations.create", out: "a world", zh: "世界" },
  { cue: "object,", name: "Lux3D", call: "textTo3d.create", out: "an object", zh: "物体" },
  { cue: "parts,", name: "Part split", call: "partSplit.create", out: "its parts", zh: "部件" },
  { cue: "joints,", name: "Articulation", call: "articulationAnimation.create", out: "its joints", zh: "关节" },
  { cue: "character.", name: "Auto rig", call: "humanoidAutoRig.create", out: "a character", zh: "角色" },
];

/** The stack has every piece. The cards land one by one, then drift apart: five tools, five results. */
export const Manycore: React.FC = () => {
  const { f, rel } = useCue("manycore");
  const tBut = rel("But"), tSep = rel("separate");
  const apart = interpolate(f, [tBut, tSep + 16], [0, 1], { ...clamp, easing: expo });
  const W = 316, GAP = 22, X0 = (1920 - (W * 5 + GAP * 4)) / 2;
  const DRIFT = [[-46, -58, -5], [-18, 44, 3], [0, -74, -2], [22, 52, 4], [50, -40, -4]];
  return (
    <Fill tone="light">
      <div style={{ position: "absolute", left: 140, top: 90 }}>
        <In at={2}><Lockup height={58} plate /></In>
        <Display size={92} style={{ marginTop: 34, width: 1600 }}>
          <Words text="The stack already holds the cure." at={rel("Manycore's")} every={4} accent={{ "cure.": T.accent }} out={tBut - 10} />
        </Display>
      </div>
      <Display size={92} style={{ position: "absolute", left: 140, top: 250, width: 1650 }}>
        <Words text="But each one is a separate tool." at={tBut - 2} every={4} accent={{ "separate": T.accent }} />
      </Display>
      {TOOLS.map((t, i) => {
        const at = rel(t.cue) - 6;
        const p = pop(f, at), o = interpolate(f, [at, at + 8], [0, 1], clamp);
        const d = DRIFT[i];
        return (
          <div key={t.name} style={{
            position: "absolute", left: X0 + i * (W + GAP), top: 470, width: W, height: 350, opacity: o,
            transform: `translate(${apart * d[0]}px, ${(1 - p) * 40 + apart * d[1]}px) rotate(${apart * d[2]}deg) scale(${0.94 + 0.06 * p})`,
            background: "#fff", borderRadius: 10, boxShadow: `0 0 0 1px ${T.line}, 0 ${24 + apart * 20}px ${50 + apart * 30}px rgba(11,11,10,${0.14 + apart * 0.1})`, padding: "26px 26px", boxSizing: "border-box",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontFamily: mono, fontSize: 17, letterSpacing: "0.14em", color: T.muted }}>0{i + 1}</span><Lux3D size={34} label={null} /></div>
            <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 40, letterSpacing: "-0.03em", marginTop: 12, color: C.canvas }}>{t.name}</div>
            <div style={{ fontFamily: mono, fontSize: 15.5, color: T.accent, marginTop: 10, whiteSpace: "nowrap" }}>{t.call}</div>
            <div style={{ position: "absolute", left: 26, right: 26, bottom: 24, display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: `1px solid ${T.line}`, paddingTop: 16 }}>
              <span style={{ fontFamily: sans, fontSize: 23, color: "#3a3833", whiteSpace: "nowrap" }}>makes {t.out}</span>
              <span style={{ fontFamily: zhSans, fontSize: 30, fontWeight: 600, color: C.canvas }}>{t.zh}</span>
            </div>
          </div>
        );
      })}
      <In at={tSep + 10} style={{ position: "absolute", left: 0, right: 0, top: 900, textAlign: "center" }}>
        <span style={{ fontFamily: mono, fontSize: 22, letterSpacing: "0.12em", color: T.muted }}>FIVE TOOLS · FIVE RESULTS · NO SCENE</span>
      </In>
    </Fill>
  );
};
