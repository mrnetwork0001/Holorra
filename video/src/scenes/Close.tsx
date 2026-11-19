import React from "react";
import { interpolate } from "remotion";
import { C, mono, sans, zhSerif } from "../theme";
import { clamp, expo, pop } from "../ui/motion";
import { scene } from "../timing";
import { Words } from "../ui/Words";
import { Fill, Finder, In, Mark, useCue } from "./common";
import { Lockup, Lux3D } from "../ui/Logos";


/** The mark, the line the film rests on, where to play it, and thank you. */
export const Close: React.FC = () => {
  const { f, rel } = useCue("close");
  const s = scene("close");
  const tName = rel("Holorra."), tThe = rel("The"), tNow = rel("Now"), tPlay = rel("Play");
  const tXie = s.lines[1].startFrame - s.from;
  const mark = interpolate(f, [tName - 10, tName + 20], [0, 1], clamp);
  const word = interpolate(f, [tName, tName + 18], [0, 1], { ...clamp, easing: expo });
  const fin = interpolate(f, [0, 26], [0, 1], { ...clamp, easing: expo });
  const xie = pop(f, tXie - 4), xo = interpolate(f, [tXie - 4, tXie + 6], [0, 1], clamp);
  return (
    <Fill tone="dark">
      <Finder x={70} y={70} w={1780} h={940} p={fin} spread={(1 - fin) * 120} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", alignItems: "center", gap: 34 }}>
        <Mark size={132} p={mark} />
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 132, letterSpacing: "-0.055em", color: C.ink, opacity: word, clipPath: `inset(-10% ${(1 - word) * 100}% -10% 0)` }}>Holorra</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 320, textAlign: "center", fontFamily: sans, fontWeight: 500, fontSize: 92, letterSpacing: "-0.045em", lineHeight: 1.1, color: C.ink }}>
        <div><Words text="The world is generated." at={tThe} every={4} /></div>
        <div><Words text="Now it is alive." at={tNow} every={4} accent={{ "alive.": C.accent }} /></div>
      </div>
      <In at={tPlay - 4} style={{ position: "absolute", left: 0, right: 0, top: 600, display: "flex", justifyContent: "center" }}>
        <div style={{ fontFamily: mono, fontSize: 54, color: C.accentInk, background: C.accent, padding: "14px 40px", borderRadius: 10, letterSpacing: "-0.01em" }}>holorra.xyz</div>
      </In>
      <In at={tPlay + 14} style={{ position: "absolute", left: 0, right: 0, top: 815, display: "flex", justifyContent: "center", alignItems: "center", gap: 36 }}>
        <span style={{ fontFamily: mono, fontSize: 19, letterSpacing: "0.14em", color: C.ink3 }}>BUILT ON</span>
        <Lockup height={50} />
        <span style={{ width: 1, height: 44, background: C.lineStrong }} />
        <Lux3D size={46} />
      </In>
      <In at={tPlay + 22} style={{ position: "absolute", left: 0, right: 0, top: 915, textAlign: "center" }}>
        <span style={{ fontFamily: mono, fontSize: 19, letterSpacing: "0.14em", color: C.ink3 }}>MANYCORE AHOLO GLOBAL 3D AI HACKATHON · #MANYCOREHACKATHON</span>
      </In>
      <div style={{ position: "absolute", right: 170, top: 520, opacity: xo, transform: `scale(${0.7 + 0.3 * xie}) rotate(${(1 - xie) * -8}deg)`, transformOrigin: "50% 50%" }}>
        <div style={{ fontFamily: zhSerif, fontWeight: 700, fontSize: 150, color: C.ink, lineHeight: 1 }}>谢谢</div>
        <div style={{ fontFamily: mono, fontSize: 20, letterSpacing: "0.2em", color: C.ink3, textAlign: "center", marginTop: 6 }}>THANK YOU</div>
      </div>
    </Fill>
  );
};
