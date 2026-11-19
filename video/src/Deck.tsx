import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, mono, sans, serif, zhSerif, zhSans, TONE, Tone } from "./theme";
import { Mark } from "./scenes/common";
import { Lockup, Lux3D } from "./ui/Logos";

/** The project report deck: 12 stills at 1920 x 1080 (rendered at 2x). Every figure is from the Lux3D bench's run log. */
const A = "#ff6a2b";
const Slide: React.FC<{ tone: Tone; children: React.ReactNode; n: number }> = ({ tone, children, n }) => {
  const t = TONE[tone];
  const dot = tone === "dark" ? "rgba(236,233,226,0.07)" : tone === "light" ? "rgba(11,11,10,0.07)" : "rgba(26,11,3,0.1)";
  return (
    <AbsoluteFill style={{ background: tone === "dark" ? "radial-gradient(1200px 700px at 72% 40%, #1d130d 0%, #0b0b0a 62%)" : t.bg, color: t.ink, fontFamily: sans, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${dot} 1.4px, transparent 1.6px)`, backgroundSize: "34px 34px" }} />
      {children}
      <div style={{ position: "absolute", right: 64, bottom: 44, fontFamily: mono, fontSize: 15, letterSpacing: "0.14em", color: t.muted }}>HOLORRA · {String(n).padStart(2, "0")} / 12</div>
    </AbsoluteFill>
  );
};
const K: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = A, style }) => (
  <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: "0.2em", textTransform: "uppercase", color, ...style }}>{children}</div>
);
const H: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ children, size = 64, style }) => (
  <div style={{ fontFamily: sans, fontWeight: 500, fontSize: size, letterSpacing: "-0.04em", lineHeight: 1.08, ...style }}>{children}</div>
);
const I: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = A }) => (
  <span style={{ fontFamily: serif, fontStyle: "italic", fontWeight: 400, color, fontSize: "1.14em", letterSpacing: "-0.01em" }}>{children}</span>
);
/** A crop of a screenshot: `r` is the source rect in the image's own pixels (image is `iw` wide). */
const Shot: React.FC<{ src: string; iw: number; ih: number; r?: [number, number, number, number]; w: number; h?: number; radius?: number; style?: React.CSSProperties; light?: boolean }> = ({ src, iw, ih, r = [0, 0, iw, ih], w, h, radius = 12, style, light }) => {
  const k = w / r[2], H0 = h ?? r[3] * k;
  return (
    <div style={{ width: w, height: H0, overflow: "hidden", borderRadius: radius, position: "relative", background: "#000", boxShadow: light ? "0 0 0 1px rgba(11,11,10,0.14), 0 30px 70px rgba(11,11,10,0.22)" : "0 0 0 1px rgba(236,233,226,0.16), 0 34px 80px rgba(0,0,0,0.6)", ...style }}>
      <Img src={staticFile(`deck/${src}`)} style={{ position: "absolute", left: -r[0] * k, top: -r[1] * k, width: iw * k, height: ih * k }} />
    </div>
  );
};
const Browser: React.FC<{ url: string; w: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ url, w, children, style }) => (
  <div style={{ width: w, borderRadius: 14, overflow: "hidden", boxShadow: "0 0 0 1px rgba(236,233,226,0.16), 0 40px 100px rgba(0,0,0,0.6)", ...style }}>
    <div style={{ height: 40, background: "#1c1c19", display: "flex", alignItems: "center", gap: 8, padding: "0 16px" }}>
      {[0, 1, 2].map((i) => <span key={i} style={{ width: 11, height: 11, borderRadius: 6, background: "rgba(236,233,226,0.2)" }} />)}
      <span style={{ marginLeft: 14, fontFamily: mono, fontSize: 15, color: "rgba(236,233,226,0.7)" }}>{url}</span>
    </div>
    {children}
  </div>
);
const Fig: React.FC<{ n: React.ReactNode; label: React.ReactNode; color?: string; muted?: string; size?: number; style?: React.CSSProperties }> = ({ n, label, color, muted, size = 150, style }) => (
  <div style={style}>
    <div style={{ fontFamily: sans, fontWeight: 500, fontSize: size, letterSpacing: "-0.055em", lineHeight: 1, color }}>{n}</div>
    <div style={{ fontSize: 27, lineHeight: 1.35, marginTop: 16, color: muted, letterSpacing: "-0.01em" }}>{label}</div>
  </div>
);
const Cap: React.FC<{ k: string; t: React.ReactNode; s?: React.ReactNode; muted: string; w?: number }> = ({ k, t, s, muted, w }) => (
  <div style={{ width: w, marginTop: 18 }}>
    <div style={{ fontFamily: mono, fontSize: 16, letterSpacing: "0.16em", color: A }}>{k}</div>
    <div style={{ fontSize: 31, fontWeight: 600, letterSpacing: "-0.03em", marginTop: 6 }}>{t}</div>
    {s ? <div style={{ fontFamily: mono, fontSize: 17.5, color: muted, marginTop: 6, lineHeight: 1.5 }}>{s}</div> : null}
  </div>
);
const D = TONE.dark, L = TONE.light, B = TONE.brand;
const P = 110; // page margin

const S1 = () => (
  <Slide tone="dark" n={1}>
    <div style={{ position: "absolute", left: P, top: 96, display: "flex", alignItems: "center", gap: 18 }}><Mark size={64} /><span style={{ fontWeight: 600, fontSize: 62, letterSpacing: "-0.05em" }}>Holorra</span></div>
    <H size={92} style={{ position: "absolute", left: P, top: 300, width: 860 }}>AI builds the<br />3D world.<br /><I>Holorra makes it alive.</I></H>
    <div style={{ position: "absolute", left: P, top: 720, width: 760, fontSize: 30, lineHeight: 1.4, color: D.muted }}>One browser tab where Manycore's Aholo tools become a single scene you can play: generate the world, split the parts, rig the actors, direct the scene.</div>
    <Browser url="holorra.xyz/studio" w={900} style={{ position: "absolute", left: 950, top: 250 }}><Shot src="studio.jpg" iw={1920} ih={1102} w={900} radius={0} /></Browser>
    <div style={{ position: "absolute", left: P, bottom: 70, display: "flex", alignItems: "center", gap: 28 }}><Lockup height={44} /><span style={{ fontFamily: mono, fontSize: 17, letterSpacing: "0.14em", color: D.muted }}>PROJECT REPORT · GLOBAL 3D AI HACKATHON · NOV 2026</span></div>
  </Slide>
);
const S2 = () => (
  <Slide tone="brand" n={2}>
    <K color={B.ink} style={{ position: "absolute", left: P, top: 110 }}>The problem</K>
    <H size={86} style={{ position: "absolute", left: P, top: 170, width: 1500, color: B.ink }}>A generated world is beautiful.<br /><I color={C.ink}>And nothing in it moves.</I></H>
    <div style={{ position: "absolute", left: P, right: P, top: 500, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 90 }}>
      {[["625 s", "for Aholo SpatialGen to turn our one prompt into a 266,895-splat coffee bar."], ["0", "things in that world that open, walk or respond. We call it the dead scene."]].map(([n, l]) => (
        <div key={n} style={{ borderTop: `2px solid ${B.ink}`, paddingTop: 30 }}><Fig n={n} label={l} color={B.ink} muted={B.ink} size={190} /></div>
      ))}
    </div>
    <K color={B.ink} style={{ position: "absolute", left: P, bottom: 100, fontSize: 16 }}>Source: our own job, world 3FO4K4V99KMD, 18 Nov 2026 · holorra.xyz/lab</K>
  </Slide>
);
const VERBS = [["生成", "Generate the world", "SpatialGen worlds and hosted 3DGS streams, in one viewer."], ["拆分", "Split the parts", "partSplit and articulation turn a fused mesh into a working object."], ["绑定", "Rig the actors", "Auto rig and retarget turn a still mesh into a playable character."], ["执导", "Direct the scene", "Play it, record a camera path, or ask the co-director in 中 / EN."]];
const S3 = () => (
  <Slide tone="light" n={3}>
    <K style={{ position: "absolute", left: P, top: 100 }} color={L.accent}>What Holorra does</K>
    <H style={{ position: "absolute", left: P, top: 150, width: 1700 }}>Four verbs, one tab. <I color={L.accent}>Then you press Play.</I></H>
    <div style={{ position: "absolute", left: P, top: 320, width: 720 }}>
      {VERBS.map(([zh, en, sub], i) => (
        <div key={en} style={{ display: "flex", gap: 26, alignItems: "center", borderTop: `1px solid ${L.line}`, padding: "20px 0" }}>
          <div style={{ fontFamily: zhSerif, fontWeight: 700, fontSize: 70, color: L.accent, width: 180, lineHeight: 1, whiteSpace: "nowrap" }}>{zh}</div>
          <div><div style={{ fontFamily: mono, fontSize: 15, letterSpacing: "0.16em", color: L.muted }}>0{i + 1}</div><div style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em" }}>{en}</div><div style={{ fontSize: 22, color: L.muted, marginTop: 4, lineHeight: 1.35 }}>{sub}</div></div>
        </div>
      ))}
    </div>
    <Browser url="holorra.xyz/studio · live" w={900} style={{ position: "absolute", left: 910, top: 330 }}><Shot src="exploded.jpg" iw={1600} ih={900} w={900} radius={0} /></Browser>
    <div style={{ position: "absolute", left: 1560, top: 300, background: C.canvas, color: C.ink, borderRadius: 999, padding: "10px 22px", fontFamily: mono, fontSize: 18, letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 10, height: 10, borderRadius: 5, background: A }} />LIVE AT HOLORRA.XYZ</div>
  </Slide>
);
const Step: React.FC<{ t: string; a: string; b: string; hot?: boolean }> = ({ t, a, b, hot }) => (
  <div style={{ flex: 1, background: hot ? A : "rgba(236,233,226,0.06)", color: hot ? C.accentInk : C.ink, border: `1px solid ${hot ? A : "rgba(236,233,226,0.16)"}`, borderRadius: 10, padding: "16px 18px" }}>
    <div style={{ fontFamily: mono, fontSize: 16, color: hot ? C.accentInk : A }}>{t}</div>
    <div style={{ fontSize: 29, fontWeight: 600, letterSpacing: "-0.03em", marginTop: 4 }}>{a}</div>
    <div style={{ fontFamily: mono, fontSize: 15.5, color: hot ? "rgba(26,11,3,0.75)" : D.muted, marginTop: 4 }}>{b}</div>
  </div>
);
const Arrow = () => <div style={{ alignSelf: "center", color: A, fontSize: 30, fontFamily: mono }}>→</div>;
const S4 = () => (
  <Slide tone="dark" n={4}>
    <K style={{ position: "absolute", left: P, top: 100 }}>The process · every job is real</K>
    <H style={{ position: "absolute", left: P, top: 150, width: 1700 }}>Three prompts in. <I>One playable scene out.</I></H>
    <div style={{ position: "absolute", left: P, right: P, top: 310, display: "flex", flexDirection: "column", gap: 26 }}>
      {[
        ["WORLD", [["world.generations.create", "SpatialGen", "625 s · world 3FO4K4V99KMD"], ["result", "266,895 splats", "a walkable coffee bar"], ["@manycore/aholo-viewer", "3DGS stage", "plus 4 hosted worlds, up to 41.8M splats"]]],
        ["OBJECT", [["textTo3d · G1", "Espresso machine", "343 s · 229,788 tris · task 8353478"], ["partSplit", "4 real parts", "118 s · same triangles · task 8354166"], ["articulationAnimation", "URDF, 2 joints", "298 s · hinge + slide · task 8354168"]]],
        ["ACTOR", [["textTo3d · G1-Turbo", "T-pose character", "197 s · 284,608 tris · task 8354807"], ["humanoidAutoRig", "52 joints", "81 s · task 8355123"], ["humanoidAnimationRetarget", "8 clips", "17 s · task 8359816"]]],
      ].map(([name, steps]) => (
        <div key={name as string} style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
          <div style={{ width: 130, fontFamily: mono, fontSize: 19, letterSpacing: "0.18em", color: D.muted, alignSelf: "center" }}>{name as string}</div>
          {(steps as string[][]).map((s, i) => <React.Fragment key={s[1]}>{i ? <Arrow /> : null}<Step t={s[0]} a={s[1]} b={s[2]} /></React.Fragment>)}
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: P + 146, right: P, top: 800, display: "flex", gap: 16 }}><Step hot t="holorra.xyz/studio?play=1" a="Walk her to the machine, brew, frame the shot, dance." b="The machine is the one Lux3D generated. The hinge that opens is the one Lux3D inferred." /></div>
    <K color={D.muted} style={{ position: "absolute", left: P, bottom: 70, fontSize: 15 }}>All run on 18 Nov 2026 through the official SDKs · full log at holorra.xyz/lab</K>
  </Slide>
);
const Row: React.FC<{ c: React.ReactNode[]; head?: boolean; line: string; muted: string }> = ({ c, head, line, muted }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", borderTop: `1px solid ${line}`, padding: "13px 0", fontFamily: head ? mono : sans, fontSize: head ? 16 : 27, letterSpacing: head ? "0.14em" : "-0.02em", color: head ? muted : undefined }}>{c.map((x, i) => <div key={i} style={{ fontWeight: !head && i ? 600 : 400, fontVariantNumeric: "tabular-nums" }}>{x}</div>)}</div>
);
const S5 = () => (
  <Slide tone="light" n={5}>
    <K color={L.accent} style={{ position: "absolute", left: P, top: 100 }}>Asset comparison 1 · engines</K>
    <H style={{ position: "absolute", left: P, top: 150, width: 1700 }}>G1-Turbo drafts. <I color={L.accent}>G1 finishes.</I></H>
    <div style={{ position: "absolute", left: P, top: 300, display: "flex", gap: 30 }}>
      <div><Shot light src="engines.jpg" iw={1600} ih={900} r={[312, 336, 596, 454]} w={500} /><Cap muted={L.muted} k="DRAFT" t="Lux3D G1-Turbo" s="task 8353472" /></div>
      <div><Shot light src="engines.jpg" iw={1600} ih={900} r={[932, 336, 596, 454]} w={500} /><Cap muted={L.muted} k="PRODUCTION" t="Lux3D G1" s="task 8353478 · the one on stage" /></div>
    </div>
    <div style={{ position: "absolute", left: 1210, top: 310, width: 600 }}>
      <Row head line={L.line} muted={L.muted} c={["SAME PROMPT", "G1-TURBO", "G1"]} />
      <Row line={L.line} muted={L.muted} c={["Time", "151 s", "343 s"]} />
      <Row line={L.line} muted={L.muted} c={["Triangles", "252,226", "229,788"]} />
      <Row line={L.line} muted={L.muted} c={["Texture maps", "2", "3 (PBR)"]} />
      <div style={{ borderTop: `1px solid ${L.line}`, paddingTop: 22, fontFamily: serif, fontStyle: "italic", fontSize: 26, lineHeight: 1.3, color: "#3a3833" }}>“A modular espresso machine with a brushed titanium body, a hinged brewing hood on top, a sliding capsule drawer at the front and a rotary dial on the side.”</div>
      <div style={{ marginTop: 22, fontSize: 23, lineHeight: 1.4, color: L.muted }}>Turbo is 2.3 times faster and good for iterating. G1 returned the cleaner surface and a full PBR set, so it is the mesh we split, articulated and put on stage.</div>
    </div>
  </Slide>
);
const S6 = () => (
  <Slide tone="dark" n={6}>
    <K style={{ position: "absolute", left: P, top: 100 }}>Asset comparison 2 · topology</K>
    <H style={{ position: "absolute", left: P, top: 150, width: 1700 }}>From a statue <I>to a machine that works.</I></H>
    <div style={{ position: "absolute", left: P, top: 300, display: "flex", gap: 32 }}>
      {[
        ["closed.jpg", [560, 190, 520, 500], "01 · FUSED", "One mesh", "textTo3d G1 · 229,788 tris"],
        ["exploded.jpg", [540, 150, 520, 500], "02 · PART SPLIT", "Four real parts", "118 s · 229,788 tris, none lost"],
        ["hinge.jpg", [420, 150, 620, 596], "03 · ARTICULATED", "Hood hinges, drawer slides", "298 s · URDF: revolute 0–90° + prismatic"],
      ].map(([src, r, k, t, s]) => (
        <div key={k as string}><Shot src={src as string} iw={1600} ih={900} r={r as [number, number, number, number]} w={545} h={524} /><Cap muted={D.muted} k={k as string} t={t as string} s={s as string} w={545} /></div>
      ))}
    </div>
    <div style={{ position: "absolute", left: P, bottom: 70, display: "flex", alignItems: "center", gap: 18 }}><Lux3D size={38} /><span style={{ fontFamily: mono, fontSize: 16, letterSpacing: "0.08em", color: A, border: `1px solid ${A}`, borderRadius: 6, padding: "5px 10px" }}>SPLIT · IN AHOLO LUX3D'S 18 NOV 2026 UPDATE</span><span style={{ fontFamily: mono, fontSize: 16, color: D.muted }}>screenshots: holorra.xyz/studio, Parts panel</span></div>
  </Slide>
);
const S7 = () => (
  <Slide tone="light" n={7}>
    <K color={L.accent} style={{ position: "absolute", left: P, top: 100 }}>Asset comparison 3 · character</K>
    <H style={{ position: "absolute", left: P, top: 150, width: 1700 }}>The first rig failed. <I color={L.accent}>We kept that in.</I></H>
    <div style={{ position: "absolute", left: P, top: 300, display: "flex", gap: 32 }}>
      {[
        [[312, 146, 388, 500], "ATTEMPT 1 · REJECTED", "Stylised courier", "humanoidAutoRig → RIG_ELIGIBILITY_FAILED (315 s)", true],
        [[724, 146, 390, 500], "ATTEMPT 2 · RIGGED", "Strict T-pose", "auto-rigged in 81 s · 52 joints · skin weights", false],
        [[1138, 146, 390, 500], "RETARGETED", "8 official clips", "17 s · walk, jog, dance, interact, sword…", false],
      ].map(([r, k, t, s, bad]) => (
        <div key={k as string}><Shot light src="chars.jpg" iw={1600} ih={900} r={r as [number, number, number, number]} w={400} h={500} /><div style={{ width: 400 }}><div style={{ fontFamily: mono, fontSize: 16, letterSpacing: "0.14em", color: bad ? "#b3261e" : L.accent, marginTop: 18 }}>{k as string}</div><div style={{ fontSize: 31, fontWeight: 600, letterSpacing: "-0.03em", marginTop: 6 }}>{t as string}</div><div style={{ fontFamily: mono, fontSize: 16.5, color: L.muted, marginTop: 6, lineHeight: 1.5 }}>{s as string}</div></div></div>
      ))}
      <div style={{ width: 380, paddingTop: 6 }}>
        <div style={{ fontSize: 26, lineHeight: 1.42, color: "#33312c" }}>The auto rig is strict about pose. A relaxed A-pose with a jacket was refused; the same character idea regenerated in a strict T-pose passed first time.</div>
        <div style={{ fontSize: 26, lineHeight: 1.42, color: "#33312c", marginTop: 22 }}>The 8 retargeted clips are what the Play mode's walk, brew, cheer and number-key emotes use. The other 77 Lux3D presets are one Retarget click away.</div>
      </div>
    </div>
  </Slide>
);
const S8 = () => (
  <Slide tone="dark" n={8}>
    <K style={{ position: "absolute", left: P, top: 100 }}>Process screenshots · a live job on 19 Nov 2026</K>
    <H style={{ position: "absolute", left: P, top: 150, width: 1700 }}>One sentence, 3 min 41 s, <I>and it lands in the room.</I></H>
    <div style={{ position: "absolute", left: P, top: 300, display: "flex", gap: 32 }}>
      <div><Shot src="prompt.jpg" iw={1920} ih={1102} r={[0, 440, 380, 430]} w={480} h={540} /><Cap muted={D.muted} k="01 · PROMPT" t="“A small wooden bar stool”" s="Text to 3D · G1-Turbo · from the studio dock" w={480} /></div>
      <div><Shot src="chip.jpg" iw={1920} ih={1102} r={[640, 60, 640, 720]} w={480} h={540} /><Cap muted={D.muted} k="02 · WAIT" t="The job chip at 03:41" s="you keep walking and playing meanwhile" w={480} /></div>
      <div><Shot src="stool.jpg" iw={1920} ih={1102} r={[700, 330, 760, 560]} w={708} h={540} /><Cap muted={D.muted} k="03 · DROP-IN" t="“Dropped into the scene · live”" s="fetched, scaled, landed on the floor, then kickable" w={708} /></div>
    </div>
    <K color={D.muted} style={{ position: "absolute", left: P, bottom: 70, fontSize: 15 }}>Our own screen recording of holorra.xyz · the hosted key allows 5 live jobs per visitor per day, or bring your own key</K>
  </Slide>
);
const S9 = () => (
  <Slide tone="dark" n={9}>
    <K style={{ position: "absolute", left: P, top: 100 }}>Final result · play mode</K>
    <H style={{ position: "absolute", left: P, top: 150, width: 1700 }}>Walk, collect, brew, frame, dance. <I>00:49.3.</I></H>
    <div style={{ position: "absolute", left: P, top: 300, display: "flex", gap: 26 }}>
      <div><Shot src="beans.jpg" iw={1920} ih={1206} r={[300, 150, 1320, 900]} w={430} h={300} /><Cap muted={D.muted} k="BEAN HUNT" t="5 beans, on a timer" w={430} /></div>
      <div><Shot src="brew.jpg" iw={1920} ih={1206} r={[300, 150, 1320, 900]} w={430} h={300} /><Cap muted={D.muted} k="BREW · E" t="The URDF joints open" w={430} /></div>
      <div><Shot src="card.jpg" iw={1920} ih={1206} r={[520, 40, 880, 640]} w={430} h={300} /><Cap muted={D.muted} k="FINISH CARD" t="Save it, or post on X" w={430} /></div>
    </div>
    <div style={{ position: "absolute", left: P, top: 740, width: 1100, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 30 }}>
      {[["5 cm", "voxel collision grid from the same capture"], ["8", "retargeted moves on keys 1 to 8"], ["中 / EN", "the whole app, in two languages"]].map(([n, l]) => <div key={n} style={{ borderTop: `1px solid ${D.line}`, paddingTop: 16 }}><div style={{ fontSize: 58, fontWeight: 500, letterSpacing: "-0.04em" }}>{n}</div><div style={{ fontSize: 21, color: D.muted, marginTop: 6, lineHeight: 1.35 }}>{l}</div></div>)}
    </div>
    <div style={{ position: "absolute", left: 1480, top: 230, width: 330, height: 716, borderRadius: 52, padding: 13, boxSizing: "border-box", background: "linear-gradient(135deg, #b9b6af, #4a4946 50%, #c2bfb8)", boxShadow: "0 40px 90px rgba(0,0,0,0.6)" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 40, overflow: "hidden", background: "#000", border: "7px solid #020202", boxSizing: "border-box" }}><Img src={staticFile("deck/phone.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
    </div>
    <div style={{ position: "absolute", left: 1480, top: 962, width: 330, textAlign: "center", fontFamily: mono, fontSize: 15, letterSpacing: "0.12em", color: D.muted }}>THE SAME QUEST ON A PHONE</div>
  </Slide>
);
const USE = [["aholo-viewer", "3DGS splats, chunk-LOD streams, voxel collision, GLB actors, in one canvas"], ["aholo-sdk-world", "SpatialGen worlds and Aholo Reality reconstruction"], ["aholo-sdk-lux3d", "Text/image to 3D, part split, articulation, auto rig, retarget, material, export"], ["aholo-sdk-asset", "Asset staging for jobs"], ["aholo-sdk-mcp", "The co-director's tool plans, and a .mcp.json for Claude Code and Cursor"]];
const S10 = () => (
  <Slide tone="light" n={10}>
    <K color={L.accent} style={{ position: "absolute", left: P, top: 100 }}>Use of Manycore's tools</K>
    <H style={{ position: "absolute", left: P, top: 150, width: 1300 }}>The whole Aholo stack, <I color={L.accent}>in one scene.</I></H>
    <div style={{ position: "absolute", right: P, top: 108 }}><Lockup height={50} plate /></div>
    <div style={{ position: "absolute", left: P, top: 330, width: 560, display: "flex", flexDirection: "column", gap: 34 }}>
      {[["5", "official @manycore SDKs"], ["10", "Lux3D methods wired to the studio"], ["22", "MCP tools in the server the co-director plans with"]].map(([n, l]) => <div key={n} style={{ display: "flex", alignItems: "baseline", gap: 26, borderTop: `1px solid ${L.line}`, paddingTop: 18 }}><span style={{ fontSize: 124, fontWeight: 500, letterSpacing: "-0.055em", lineHeight: 1, width: 170, color: L.accent }}>{n}</span><span style={{ fontSize: 27, lineHeight: 1.3, color: "#33312c", flex: 1 }}>{l}</span></div>)}
    </div>
    <div style={{ position: "absolute", left: 760, right: P, top: 330 }}>
      {USE.map(([p, w]) => <div key={p} style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: 20, borderTop: `1px solid ${L.line}`, padding: "19px 0", alignItems: "baseline" }}><span style={{ fontFamily: mono, fontSize: 22, color: C.canvas }}>@manycore/{p}</span><span style={{ fontSize: 23.5, lineHeight: 1.35, color: "#33312c" }}>{w}</span></div>)}
      <div style={{ borderTop: `1px solid ${L.line}`, paddingTop: 20, fontSize: 22, lineHeight: 1.4, color: L.muted }}>Every call leaves a receipt in the studio: SDK method, task or world ID, status, and whether it was live, cached or a preview. No key is needed to play; live jobs run on a daily budget or on the visitor's own key.</div>
    </div>
  </Slide>
);
const S11 = () => (
  <Slide tone="dark" n={11}>
    <div style={{ position: "absolute", left: P, top: 330, width: 560 }}>
      <K>The team</K>
      <H size={78} style={{ marginTop: 22 }}>Designed, built<br />and shipped<br /><I>by one person.</I></H>
      <div style={{ fontSize: 26, lineHeight: 1.42, color: D.muted, marginTop: 30 }}>Product, design, engineering, deployment and this report, for the Manycore Aholo Global 3D AI Hackathon.</div>
    </div>
    <div style={{ position: "absolute", left: 860, top: 170 }}>
      <div style={{ width: 520, height: 694, borderRadius: 14, overflow: "hidden", boxShadow: "0 0 0 1px rgba(236,233,226,0.16), 0 40px 100px rgba(0,0,0,0.6)" }}><Img src={staticFile("deck/team.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
    </div>
    <div style={{ position: "absolute", left: 1430, top: 560, width: 400 }}>
      <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 56, letterSpacing: "-0.04em", lineHeight: 1.08 }}>Ifeanyichukwu<br />Emmanuel O.</div>
      <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: "0.16em", color: A, marginTop: 20, lineHeight: 1.6 }}>SOLO BUILDER<br />PRODUCT · DESIGN · ENGINEERING</div>
    </div>
  </Slide>
);
const S12 = () => (
  <Slide tone="dark" n={12}>
    <div style={{ position: "absolute", left: P, top: 250, display: "flex", alignItems: "center", gap: 18 }}><Mark size={64} /><span style={{ fontWeight: 600, fontSize: 62, letterSpacing: "-0.05em" }}>Holorra</span></div>
    <H size={104} style={{ position: "absolute", left: P, top: 380, width: 1100 }}>The world is generated.<br /><I>Now it is alive.</I></H>
    <div style={{ position: "absolute", left: P, top: 680, fontSize: 28, color: D.muted }}>Open the studio, press Play, and brew a coffee. No key, no account.</div>
    <div style={{ position: "absolute", left: P, top: 760, display: "flex", gap: 14, flexWrap: "wrap", width: 1100 }}>
      {["holorra.xyz", "holorra.xyz/studio?play=1", "holorra.xyz/lab", "holorra.xyz/report"].map((u) => <span key={u} style={{ fontFamily: mono, fontSize: 22, border: `1px solid ${D.line}`, borderRadius: 8, padding: "9px 16px" }}>{u}</span>)}
    </div>
    <div style={{ position: "absolute", left: P, bottom: 76, display: "flex", alignItems: "center", gap: 26 }}><span style={{ fontFamily: mono, fontSize: 17, letterSpacing: "0.16em", color: D.muted }}>BUILT ON</span><Lockup height={44} /><span style={{ width: 1, height: 38, background: C.lineStrong }} /><Lux3D size={40} /></div>
    <div style={{ position: "absolute", left: 1400, top: 300, width: 400, background: "#fff", borderRadius: 22, padding: 34, boxSizing: "border-box", textAlign: "center" }}>
      <Img src={staticFile("deck/qr.png")} style={{ width: 332, height: 332 }} />
      <div style={{ fontFamily: mono, fontSize: 18, letterSpacing: "0.2em", color: C.canvas, marginTop: 16 }}>SCAN TO PLAY IT</div>
    </div>
    <div style={{ position: "absolute", left: 1400, top: 780, width: 400, textAlign: "center", fontFamily: zhSans, fontSize: 30, color: C.ink }}>生成 · 拆分 · 绑定 · 执导</div>
  </Slide>
);
export const DECK = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12];
