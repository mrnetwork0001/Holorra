import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { C, mono } from "../theme";
import { clamp, expo } from "../ui/motion";
import { Words } from "../ui/Words";
import { Display, Finder, In, Kicker, Plate, useCue } from "./common";

/** A generated world, and nothing alive in it: the picture stops dead on "nothing moves". */
export const Open: React.FC = () => {
  const { f, rel, dur } = useCue("open");
  const tAI = rel("AI"), tThen = rel("Then"), tNothing = rel("nothing"), tLid = rel("lid"), tChar = rel("character"), tLook = rel("look,"), tDead = rel("dead");
  const frozen = interpolate(f, [tNothing, tNothing + 10], [0, 1], clamp);
  const dim = interpolate(f, [tDead - 14, tDead + 6], [0, 1], clamp);
  const fin = interpolate(f, [4, 30], [0, 1], { ...clamp, easing: expo });
  const tag = (at: number, x: number, y: number, k: string, v: string) => (
    <In at={at} out={tDead - 12} y={14} style={{ position: "absolute", left: x, top: y }}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", fontFamily: mono, fontSize: 24, letterSpacing: "0.1em", color: C.ink, background: "rgba(11,11,10,0.8)", border: `1px solid ${C.lineStrong}`, padding: "10px 18px", borderRadius: 6 }}>
        <span style={{ color: C.ink3 }}>{k}</span><span style={{ color: C.err }}>{v}</span>
      </div>
    </In>
  );
  return (
    <AbsoluteFill style={{ background: C.canvas }}>
      <div style={{ position: "absolute", inset: 0, filter: `grayscale(${frozen * 0.85}) brightness(${1 - frozen * 0.28 - dim * 0.5}) contrast(${1 + frozen * 0.08})` }}>
        <Plate name="dead" from={30} dur={dur} z0={1.04} z1={1.12} freezeAt={tNothing + 4} />
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,11,10,0.55) 0%, rgba(11,11,10,0) 34%, rgba(11,11,10,0) 60%, rgba(11,11,10,0.7) 100%)" }} />
      <Finder x={70} y={70} w={1780} h={940} p={fin} rec={f < tNothing} color={frozen > 0.5 ? C.ink3 : C.accent} />
      <In at={tAI - 4} out={tThen - 8} style={{ position: "absolute", left: 150, top: 150 }}>
        <Kicker color={C.ink2} dot={C.accent}>Generated in minutes</Kicker>
      </In>
      <Display size={104} style={{ position: "absolute", left: 150, top: 200, width: 1500, color: C.ink, textShadow: "0 4px 40px rgba(0,0,0,0.6)" }}>
        <Words text="AI can build a 3D world in minutes." at={tAI} every={4} accent={{ "minutes.": C.accent }} out={tThen - 8} />
      </Display>
      <Display size={150} style={{ position: "absolute", left: 150, top: 380, width: 1600, color: C.ink, textShadow: "0 4px 40px rgba(0,0,0,0.7)" }}>
        <Words text="Nothing moves." at={tNothing - 2} every={5} accent={{ "moves.": C.ink2 }} out={tLook - 6} />
      </Display>
      {tag(tLid, 1130, 250, "LID", "SHUT")}
      {tag(tChar, 1130, 330, "CHARACTER", "FROZEN")}
      {tag(tLook, 1130, 410, "YOU", "LOOK ONLY")}
      <div style={{ position: "absolute", left: 0, right: 0, top: 400, textAlign: "center" }}>
        <In at={rel("We") - 2} y={10}><Kicker color={C.ink2} style={{ justifyContent: "center", marginBottom: 22 }}>We call it</Kicker></In>
        <Display size={190} style={{ color: C.ink }}>
          <Words text="the dead scene." at={tDead - 10} every={5} accent={{ "dead": C.accent }} />
        </Display>
      </div>
    </AbsoluteFill>
  );
};
