import React from "react";
import { interpolate } from "remotion";
import { C, mono, sans, zhSerif } from "../theme";
import { clamp, expo, pop } from "../ui/motion";
import { Words } from "../ui/Words";
import { Fill, In, Mark, useCue } from "./common";

const VERBS = [
  { cue: "Generate", zh: "生成", en: "Generate", rest: "the world" },
  { cue: "Split", zh: "拆分", en: "Split", rest: "the parts" },
  { cue: "Rig", zh: "绑定", en: "Rig", rest: "the actors" },
  { cue: "Direct", zh: "执导", en: "Direct", rest: "the scene" },
];

/** Full-bleed orange: the mark draws, the name lands, and the four verbs arrive in two languages. */
export const Turn: React.FC = () => {
  const { f, rel } = useCue("turn");
  const tName = rel("Holorra."), tOne = rel("One"), tGen = rel("Generate");
  const mark = interpolate(f, [tName - 16, tName + 14], [0, 1], clamp);
  const word = interpolate(f, [tName - 2, tName + 18], [0, 1], { ...clamp, easing: expo });
  const ring = interpolate(f, [tName, tName + 40], [0, 1], clamp);
  const up = interpolate(f, [tGen - 22, tGen - 2], [0, 1], { ...clamp, easing: expo });
  return (
    <Fill tone="brand" grid={false}>
      <div style={{ position: "absolute", left: 960 - 420, top: 330 - 420 - up * 150, width: 840, height: 840, borderRadius: "50%", border: `2px solid rgba(26,11,3,${0.5 * (1 - ring)})`, transform: `scale(${0.2 + ring * 1.4})` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 250 - up * 150, display: "flex", justifyContent: "center", alignItems: "center", gap: 44, transform: `scale(${1 - up * 0.3})`, transformOrigin: "50% 0" }}>
        <Mark size={200} p={mark} stroke={C.accentInk} fill={C.ink} />
        <div style={{ fontFamily: sans, fontWeight: 600, fontSize: 200, letterSpacing: "-0.055em", color: C.accentInk, opacity: word, clipPath: `inset(-10% ${(1 - word) * 100}% -10% 0)`, transform: `translateX(${(1 - word) * -30}px)` }}>Holorra</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 560 - up * 250, textAlign: "center", fontFamily: sans, fontWeight: 500, fontSize: 60, letterSpacing: "-0.035em", lineHeight: 1.2, color: C.accentInk, opacity: 1 - up * 0.0 }}>
        <Words text="One browser tab. One scene you can play." at={tOne} every={4} accent={{ "play.": C.ink }} />
      </div>
      <div style={{ position: "absolute", left: 120, right: 120, top: 520, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 26 }}>
        {VERBS.map((v, i) => {
          const at = rel(v.cue) - 5;
          const p = pop(f, at), o = interpolate(f, [at, at + 8], [0, 1], clamp);
          return (
            <div key={v.en} style={{ opacity: o, transform: `translateY(${(1 - p) * 50}px)`, background: C.accentInk, color: C.ink, borderRadius: 12, padding: "34px 34px 32px", boxShadow: "0 30px 70px rgba(26,11,3,0.35)" }}>
              <div style={{ fontFamily: mono, fontSize: 18, letterSpacing: "0.16em", color: C.accent }}>0{i + 1}</div>
              <div style={{ fontFamily: zhSerif, fontSize: 150, lineHeight: 1.05, fontWeight: 700, marginTop: 8, color: C.ink }}>{v.zh}</div>
              <div style={{ fontFamily: sans, fontSize: 44, fontWeight: 600, letterSpacing: "-0.035em", marginTop: 14 }}>{v.en}</div>
              <div style={{ fontFamily: sans, fontSize: 30, color: C.ink2, letterSpacing: "-0.02em" }}>{v.rest}</div>
            </div>
          );
        })}
      </div>
    </Fill>
  );
};
