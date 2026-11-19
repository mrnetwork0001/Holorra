import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { C, mono } from "../theme";
import { Card, Fill, Finder, In, Kicker, Plate, useCue } from "./common";
import { Lockup, Lux3D } from "../ui/Logos";


/**
 * A live Text to 3D job, from the owner's own screen recording of holorra.xyz (19 Nov 2026):
 * the prompt typed, the job sent, the chip at 03:41, the stool on the floor, then kicked.
 * Jump cuts skip the wait; the typing and the click are sped up.
 */
export const Generate: React.FC = () => {
  const { rel, dur } = useCue("generate");
  const tOne = rel("One"), tLux = rel("Lux3D."), tA = rel("A"), tModel = rel("model"), tLands = rel("lands"), tWalk = rel("Walk");
  const a1 = tLux - 4, a2 = tA - 4, b = tModel - 8, c = tWalk - 6;
  const box = { x: 0, y: 0, w: 1920, h: 1080 } as const;
  return (
    <Fill tone="dark" grid={false}>
      <Sequence durationInFrames={a1} layout="none"><AbsoluteFill><Plate name="genA" from={80} rate={1.75} {...box} dur={a1} z0={2.25} z1={2.4} ox={0} oy={44} /></AbsoluteFill></Sequence>
      <Sequence from={a1} durationInFrames={a2 - a1} layout="none"><AbsoluteFill><Plate name="genA" from={470} rate={2.7} {...box} dur={a2 - a1} z0={1.5} z1={1.42} ox={0} oy={36} /></AbsoluteFill></Sequence>
      <Sequence from={a2} durationInFrames={b - a2} layout="none"><AbsoluteFill><Plate name="genB" from={70} {...box} dur={b - a2} z0={2.5} z1={2.8} ox={45} oy={6} /></AbsoluteFill></Sequence>
      <Sequence from={b} durationInFrames={c - b} layout="none"><AbsoluteFill><Plate name="genC" from={98} {...box} dur={c - b} z0={1.62} z1={1.74} ox={46} oy={62} /></AbsoluteFill></Sequence>
      <Sequence from={c} layout="none"><AbsoluteFill><Plate name="genD" from={318} {...box} dur={dur - c} z0={1.66} z1={1.72} ox={44} oy={50} /></AbsoluteFill></Sequence>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,11,10,0.5) 0%, rgba(11,11,10,0) 22%, rgba(11,11,10,0) 70%, rgba(11,11,10,0.75) 100%)" }} />
      <Finder x={60} y={60} w={1800} h={960} p={1} arm={46} weight={4} />
      <In at={4} style={{ position: "absolute", left: 130, top: 925, display: "flex", alignItems: "center", gap: 22, background: "rgba(11,11,10,0.78)", borderRadius: 10, padding: "10px 18px 10px 12px" }}><Lux3D size={40} /><Kicker color={C.ink2} size={17}>textTo3d.create · G1-Turbo</Kicker></In>
      <Card at={tOne - 6} out={a2 - 10} left={1150} top={250} width={620} accent={C.accent}>
        <Kicker color={C.ink3} size={15}>One sentence</Kicker>
        <div style={{ fontSize: 58, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1.08, marginTop: 10 }}>“A small wooden bar stool”</div>
      </Card>
      <Card at={a2 + 2} out={b - 10} left={1090} top={420} width={680} accent={C.accent}>
        <Kicker color={C.ink3} size={15}>The job chip, just before it lands</Kicker>
        <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginTop: 4 }}>
          <span style={{ fontFamily: mono, fontSize: 132, letterSpacing: "-0.04em", lineHeight: 1.1 }}>03:41</span>
          <span style={{ fontFamily: mono, fontSize: 21, color: C.ink2, letterSpacing: "0.1em" }}>MIN : SEC<br />THE WAIT IS CUT</span>
        </div>
      </Card>
      <Card at={tLands - 4} out={c - 8} left={1160} top={230} width={620} accent={C.accent}>
        <Kicker color={C.ok} size={15} dot={C.ok}>live · dropped into the scene</Kicker>
        <div style={{ fontSize: 46, fontWeight: 600, letterSpacing: "-0.04em", marginTop: 8 }}>Fetched, scaled, on the floor.</div>
      </Card>
      <Card at={rel("slides") - 4} left={130} top={780} width={560} accent={C.accent}>
        <Kicker color={C.ink3} size={15}>Play mode</Kicker>
        <div style={{ fontSize: 46, fontWeight: 600, letterSpacing: "-0.04em", marginTop: 8 }}>Generated models are kickable.</div>
      </Card>
      <div style={{ position: "absolute", right: 130, top: 100, fontFamily: mono, fontSize: 16, color: C.ink2, letterSpacing: "0.04em" }}>our own screen recording of a live job · holorra.xyz · 19 Nov 2026</div>
    </Fill>
  );
};
