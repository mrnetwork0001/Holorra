import React from "react";
import { AbsoluteFill, Sequence, interpolate } from "remotion";
import { C, mono, sans } from "../theme";
import { clamp } from "../ui/motion";
import { Count } from "../ui/Count";
import { markOf } from "../ui/Footage";
import { Words } from "../ui/Words";
import { Card, Display, Fill, Finder, In, Kicker, Plate, useCue } from "./common";
import { Lockup, Lux3D } from "../ui/Logos";


const SDKS = ["aholo-viewer", "aholo-sdk-world", "aholo-sdk-lux3d", "aholo-sdk-asset", "aholo-sdk-mcp"];

/** The camera path playing on the live stage, then what the studio is built on. */
export const Under: React.FC = () => {
  const { f, rel, dur } = useCue("under");
  const tLux = rel("LuxReal"), tUnder = rel("Under"), tFive = rel("five"), tTen = rel("ten"), t22 = rel("22"), tBring = rel("Bring");
  const play = markOf("path", "path.play");
  const aLen = tUnder - 6;
  const col = (at: number, n: number, label: string, sub: React.ReactNode) => (
    <In at={at - 6} style={{ width: 520 }}>
      <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 200, letterSpacing: "-0.06em", lineHeight: 0.95, color: C.ink }}><Count to={n} at={at - 6} dur={18} /></div>
      <div style={{ fontFamily: sans, fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em", color: C.accent, marginTop: 10 }}>{label}</div>
      <div style={{ fontFamily: mono, fontSize: 18.5, color: C.ink2, lineHeight: 1.6, marginTop: 14 }}>{sub}</div>
    </In>
  );
  return (
    <Fill tone="dark">
      <Sequence durationInFrames={aLen} layout="none">
        <AbsoluteFill>
          <Plate name="path" from={Math.max(0, play + 20)} dur={aLen} z0={1.5} z1={1.56} ox={47} oy={38} />
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,11,10,0.35) 0%, rgba(11,11,10,0) 30%, rgba(11,11,10,0) 62%, rgba(11,11,10,0.8) 100%)" }} />
          <Finder x={70} y={70} w={1780} h={940} p={interpolate(f, [0, 16], [0, 1], clamp)} rec />
          <In at={6} style={{ position: "absolute", left: 150, top: 104 }}><Kicker color={C.ink} size={20}>REC · camera path · 3 keyframes · Catmull-Rom</Kicker></In>
          <Card at={tLux - 6} left={1180} top={720} width={620} accent={C.accent}>
            <Kicker color={C.ink3} size={15}>Hand-off</Kicker>
            <div style={{ fontSize: 52, fontWeight: 600, letterSpacing: "-0.04em", marginTop: 6 }}>LuxReal storyboard</div>
            <div style={{ fontFamily: mono, fontSize: 19, color: C.ink2, marginTop: 8 }}>video prompt · camera data · keyframes · JSON</div>
          </Card>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={aLen} layout="none">
        <div style={{ position: "absolute", left: 140, top: 110 }}>
          <In at={2}><Kicker color={C.ink3} dot={C.accent}>Under the hood</Kicker></In>
        </div>
        <In at={6} style={{ position: "absolute", right: 140, top: 92, display: "flex", alignItems: "center", gap: 30 }}><Lockup height={46} /><span style={{ width: 1, height: 40, background: C.lineStrong }} /><Lux3D size={42} /></In>
        <div style={{ position: "absolute", left: 140, right: 140, top: 230, display: "flex", gap: 40, justifyContent: "space-between" }}>
          {col(tFive - aLen, 5, "official SDKs", <>{SDKS.map((s) => <div key={s}>@manycore/{s}</div>)}</>)}
          {col(tTen - aLen, 10, "Lux3D methods", <>textTo3d · imgTo3d · partSplit<br />articulationAnimation<br />humanoidAutoRig · retarget<br />materialTransfer · export …</>)}
          {col(t22 - aLen, 22, "MCP tools", <>world_generate · lux3d_part_split<br />lux3d_humanoid_auto_rig …<br />for Claude Code, Claude Desktop<br />and Cursor</>)}
        </div>
        <div style={{ position: "absolute", left: 140, right: 140, top: 850 }}>
          <Display size={76}><Words text="Bring your own key, or just play." at={tBring - aLen - 2} every={4} accent={{ "play.": C.accent }} /></Display>
        </div>
      </Sequence>
      {dur ? null : null}
    </Fill>
  );
};
