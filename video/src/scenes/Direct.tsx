import React from "react";
import { Sequence, interpolate, useCurrentFrame } from "remotion";
import { C, mono, sans, TONE, zhSerif } from "../theme";
import { clamp, expo } from "../ui/motion";
import { Browser, markOf } from "../ui/Footage";
import { scene } from "../timing";
import { Card, Fill, In, Kicker, useCue } from "./common";

const T = TONE.light;
const ZH = "切换到城市街道，让角色跳舞。";

/** The line, set large, each character arriving as it is spoken. */
const Spoken: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ fontFamily: zhSerif, fontWeight: 700, fontSize: 78, letterSpacing: "0.02em", color: C.canvas, lineHeight: 1.2 }}>
      {[...ZH].map((ch, i) => {
        const at = from + ((to - from) * i) / ZH.length;
        const p = interpolate(f, [at, at + 8], [0, 1], { ...clamp, easing: expo });
        return <span key={i} style={{ display: "inline-block", opacity: 0.16 + 0.84 * p, transform: `translateY(${(1 - p) * 10}px)`, color: i >= 3 && i <= 6 ? T.accent : C.canvas }}>{ch}</span>;
      })}
    </div>
  );
};

/** The app in Chinese, then a Chinese prompt to the co-director: the world switches and she dances. */
export const Direct: React.FC = () => {
  const { rel, dur } = useCue("direct");
  const s = scene("direct");
  const zhLine = s.lines[1], enLine = s.lines[2];
  const zhFrom = zhLine.startFrame - s.from, zhTo = zhLine.words[zhLine.words.length - 1].end - s.from;
  const tEn = enLine.startFrame - s.from;
  const tOr = rel("or"), tPlan = rel("plan");
  const sw = markOf("zh", "zh.switch"), type = markOf("direct", "direct.type"), apply = markOf("direct", "direct.apply");
  const aLen = zhFrom - 6;
  const B = { width: 1500, left: 210, top: 80, light: true } as const;
  const bLocal = (t: number) => t - aLen;
  const cut1 = tEn + 28, cut2 = tPlan - 10;
  return (
    <Fill tone="light">
      <Sequence durationInFrames={aLen} layout="none">
        <Browser name="zh" url="holorra.xyz" {...B} startFrom={Math.max(0, sw - tOr)} cams={[{ f: 0, z: 1 }, { f: tOr - 24, z: 1 }, { f: tOr - 4, z: 1.7, rect: { x: 1380, y: 0, w: 200, h: 70 }, dy: 200 }, { f: tOr + 40, z: 1.7, rect: { x: 1380, y: 0, w: 200, h: 70 }, dy: 200 }, { f: tOr + 66, z: 1 }]} />
        <Card at={8} left={90} top={720} width={520} tone="light" accent={T.accent} out={aLen - 12}>
          <Kicker color={T.muted} size={15}>Every page, two languages</Kicker>
          <div style={{ fontSize: 60, fontWeight: 600, letterSpacing: "-0.03em", marginTop: 6, fontFamily: sans }}>中 <span style={{ color: T.muted, fontWeight: 400 }}>/</span> EN</div>
        </Card>
      </Sequence>
      <Sequence from={aLen} durationInFrames={cut1 - aLen} layout="none">
        <Browser name="direct" url="holorra.xyz/studio · Co-director" {...B} startFrom={Math.max(0, type - (zhFrom - aLen))}
          cams={[{ f: 0, z: 1.5, rect: { x: 1180, y: 60, w: 420, h: 420 } }, { f: bLocal(tEn) - 14, z: 1.5, rect: { x: 1180, y: 60, w: 420, h: 420 } }, { f: bLocal(tEn) + 16, z: 1.0 }]} />
      </Sequence>
      <Sequence from={cut1} durationInFrames={cut2 - cut1} layout="none">
        <Browser name="direct" url="holorra.xyz/studio · 02 Juguo Urban Plaza" {...B} startFrom={800} enter={-40}
          cams={[{ f: 0, z: 1.3, rect: { x: 330, y: 60, w: 900, h: 620 } }, { f: cut2 - cut1, z: 1.42, rect: { x: 330, y: 60, w: 900, h: 620 } }]} />
      </Sequence>
      <Sequence from={cut2} layout="none">
        <Browser name="direct" url="holorra.xyz/studio · tool trace" {...B} startFrom={800 + cut2 - cut1} enter={-40}
          cams={[{ f: 0, z: 1.42, rect: { x: 330, y: 60, w: 900, h: 620 } }, { f: 26, z: 1.75, rect: { x: 1230, y: 520, w: 370, h: 380 } }]} />
      </Sequence>
      <Sequence from={aLen} layout="none">
        <Card at={bLocal(zhFrom) - 6} left={90} top={640} width={1010} tone="light" accent={T.accent} out={bLocal(tPlan) - 14}>
          <Kicker color={T.muted} size={15} dot={T.accent}>Typed into the co-director</Kicker>
          <div style={{ marginTop: 10 }}><Spoken from={bLocal(zhFrom)} to={bLocal(zhTo)} /></div>
          <In at={bLocal(tEn)} y={10}><div style={{ fontFamily: sans, fontSize: 34, color: "#4a473f", marginTop: 12, letterSpacing: "-0.02em" }}>Switch to the city street, and make her dance.</div></In>
        </Card>
        <Card at={bLocal(tPlan) + 4} left={90} top={720} width={640} tone="dark" accent={C.accent}>
          <Kicker color={C.ink3} size={15}>@manycore/aholo-sdk-mcp · plan, no LLM key</Kicker>
          <div style={{ fontFamily: mono, fontSize: 25, lineHeight: 1.55, marginTop: 10, color: C.ink }}>01 world_generate<br />02 lux3d_humanoid_animation_retarget</div>
        </Card>
      </Sequence>
      {apply && dur ? null : null}
    </Fill>
  );
};
