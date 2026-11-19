import React from "react";
import { Sequence, interpolate } from "remotion";
import { C, mono } from "../theme";
import { clamp } from "../ui/motion";
import { Count } from "../ui/Count";
import { Browser, rectOf } from "../ui/Footage";
import { Words } from "../ui/Words";
import { Card, Display, Fill, Kicker, useCue } from "./common";
import { Lockup, Lux3D } from "../ui/Logos";


/** The actor's pipeline on the Lux3D bench: the three characters and the clip switcher, then the run log's rejected rig. */
export const Rig: React.FC = () => {
  const { f, rel, dur } = useCue("rig");
  const tAuto = rel("Auto"), t52 = rel("52"), t81 = rel("81"), tRe = rel("Retarget"), tEight = rel("eight"), t17 = rel("17."), tFirst = rel("first"), tRej = rel("rejected."), tWe = rel("We");
  const aLen = tFirst - 6;
  const failed = rectOf("bench", "failed");
  const hi = interpolate(f, [tRej - 4, tRej + 10], [0, 1], clamp);
  return (
    <Fill tone="dark">
      <Sequence durationInFrames={aLen} layout="none">
        <Browser name="labrig" url="holorra.xyz/lab · character" width={1180} left={90} top={110} startFrom={Math.max(0, 232 - tRe)}
          cams={[{ f: 0, z: 1.34, rect: { x: 330, y: 250, w: 1240, h: 560 } }, { f: tRe - 20, z: 1.34, rect: { x: 330, y: 250, w: 1240, h: 560 } }, { f: tRe + 20, z: 1.8, rect: { x: 1215, y: 290, w: 350, h: 520 } }]} />
        <div style={{ position: "absolute", left: 1320, top: 90, width: 520 }}>
          <Lux3D size={42} />
          <Kicker color={C.ink3} dot={C.accent} style={{ marginTop: 16 }}>Text to 3D → rig → retarget</Kicker>
          <Display size={58} style={{ marginTop: 14 }}><Words text="She began as a statue." at={rel("actor")} every={4} accent={{ "statue.": C.accent }} /></Display>
        </div>
        <Card at={tAuto - 6} left={1320} top={400} width={520} accent={C.accent}>
          <Kicker color={C.ink3} size={15}>humanoidAutoRig · task 8355123</Kicker>
          <div style={{ display: "flex", alignItems: "baseline", gap: 26, marginTop: 8 }}>
            <span style={{ fontSize: 104, fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 1 }}><Count to={52} at={t52 - 6} dur={20} /></span>
            <span style={{ fontFamily: mono, fontSize: 21, color: C.ink2 }}>JOINTS</span>
            <span style={{ fontSize: 60, fontWeight: 500, letterSpacing: "-0.04em", color: C.accent, marginLeft: "auto" }}><Count to={81} at={t81 - 6} dur={20} suffix=" s" /></span>
          </div>
        </Card>
        <Card at={tRe - 6} left={1320} top={660} width={520} accent={C.accent}>
          <Kicker color={C.ink3} size={15}>humanoidAnimationRetarget · task 8359816</Kicker>
          <div style={{ display: "flex", alignItems: "baseline", gap: 26, marginTop: 8 }}>
            <span style={{ fontSize: 104, fontWeight: 500, letterSpacing: "-0.05em", lineHeight: 1 }}><Count to={8} at={tEight - 6} dur={14} /></span>
            <span style={{ fontFamily: mono, fontSize: 21, color: C.ink2 }}>MOVES</span>
            <span style={{ fontSize: 60, fontWeight: 500, letterSpacing: "-0.04em", color: C.accent, marginLeft: "auto" }}><Count to={17} at={t17 - 6} dur={14} suffix=" s" /></span>
          </div>
        </Card>
      </Sequence>
      <Sequence from={aLen} layout="none">
        <Browser name="bench" url="holorra.xyz/lab · run log" width={1560} left={180} top={90} stopAt={2}
          cams={[{ f: 0, z: 1.25, rect: "table" }, { f: tRej - aLen - 6, z: 1.25, rect: "table" }, { f: tRej - aLen + 22, z: 1.9, rect: "failed", dx: 260, dy: 110 }]} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 420, background: "linear-gradient(180deg, rgba(11,11,10,0) 0%, rgba(11,11,10,0.94) 46%, rgba(11,11,10,1) 100%)" }} />
        {failed ? null : null}
        <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", opacity: hi }}>
          <span style={{ fontFamily: mono, fontSize: 30, letterSpacing: "0.08em", color: C.err, background: "rgba(11,11,10,0.9)", border: `1px solid ${C.err}`, padding: "12px 22px", borderRadius: 6 }}>humanoidAutoRig · RIG_ELIGIBILITY_FAILED</span>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 900, textAlign: "center" }}>
          <Display size={72}><Words text="We left that in." at={tWe - aLen - 2} every={4} accent={{ "left": C.accent }} /></Display>
        </div>
      </Sequence>
      {dur ? null : null}
    </Fill>
  );
};
