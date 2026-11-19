import React from "react";
import { AbsoluteFill, Sequence, interpolate } from "remotion";
import { C, mono, sans } from "../theme";
import { clamp, pop } from "../ui/motion";
import { Card, Fill, Finder, In, Kicker, Plate, useCue } from "./common";

const PW = 428, PH = 927; // the screen, at the recording's own 1180 x 2556 proportion
/** An iPhone 15 Pro body drawn around the recording: titanium band, thin black bezel, side buttons. */
const Phone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const band = 7, bezel = 9, r = 70;
  const W = PW + 2 * (band + bezel), H = PH + 2 * (band + bezel);
  const btn = (side: "l" | "r", top: number, h: number) => (
    <div style={{ position: "absolute", [side === "l" ? "left" : "right"]: -4, top, width: 5, height: h, borderRadius: 3, background: "linear-gradient(180deg, #8f8c86, #55534f 50%, #7d7a74)", boxShadow: "0 0 0 1px rgba(0,0,0,0.5)" }} />
  );
  return (
    <div style={{ position: "relative", width: W, height: H, filter: "drop-shadow(0 50px 70px rgba(0,0,0,0.65))" }}>
      {btn("l", 150, 34)}{btn("l", 214, 62)}{btn("l", 290, 62)}{btn("r", 250, 98)}
      <div style={{ position: "absolute", inset: 0, borderRadius: r, background: "linear-gradient(135deg, #b9b6af 0%, #6f6d68 22%, #3d3c39 50%, #7b7873 78%, #c2bfb8 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 0 6px rgba(0,0,0,0.6)" }} />
      <div style={{ position: "absolute", inset: band, borderRadius: r - band, background: "#020202" }} />
      <div style={{ position: "absolute", left: band + bezel, top: band + bezel, width: PW, height: PH, borderRadius: r - band - bezel, overflow: "hidden", background: "#000" }}>
        {children}
        <div style={{ position: "absolute", inset: 0, borderRadius: r - band - bezel, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)", background: "linear-gradient(120deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 28%)", pointerEvents: "none" }} />
      </div>
    </div>
  );
};

const at = (sec: number) => Math.round((sec - 14) * 30); // seconds in the owner's recording -> frames of the "run" clip
const STEPS = [["Walk", "Walk"], ["beans,", "5 beans"], ["brew", "Brew"], ["frame", "Frame"], ["dance.", "Dance"]] as const;

/**
 * The Play run, from the owner's own screen recording of holorra.xyz (19 Nov 2026), cut to the
 * line: Play pressed, the walk, a bean, the brew close-up, the framed shot, the dance, the finish
 * card. Then the same quest on a phone (the owner's phone recording).
 */
export const Play: React.FC = () => {
  const { f, rel, dur } = useCue("play");
  const cuts: [number, number, number, number][] = [
    // [scene frame, recording second, origin x%, origin y%]
    [0, 15.9, 50, 46], [rel("Walk") - 2, 33.2, 50, 50], [rel("Collect") - 2, 40.4, 55, 50], [rel("brew") - 4, 74.2, 50, 50],
    [rel("frame") - 2, 78.4, 52, 46], [rel("and") - 2, 52.4, 52, 52], [rel("floor") - 12, 44.2, 50, 56], [rel("On") - 6, 83.2, 46, 44],
  ];
  const tShot = rel("shot,"), tFloor = rel("floor"), tVoxel = rel("voxel"), tPhone = rel("phone,"), tOn = rel("On");
  const flash = interpolate(f, [tShot - 1, tShot + 2, tShot + 12], [0, 0.85, 0], clamp);
  const grid = interpolate(f, [tFloor, tFloor + 20, tOn - 14, tOn - 4], [0, 1, 1, 0], clamp);
  const ph = pop(f, tPhone - 14), pho = interpolate(f, [tPhone - 14, tPhone - 4], [0, 1], clamp);
  return (
    <Fill tone="dark" grid={false}>
      {cuts.map(([from, sec, ox, oy], i) => {
        const len = (cuts[i + 1]?.[0] ?? dur) - from;
        return <Sequence key={i} from={from} durationInFrames={len} layout="none"><AbsoluteFill><Plate name="run" from={at(sec)} dur={len} z0={1.12} z1={1.18} ox={ox} oy={oy} /></AbsoluteFill></Sequence>;
      })}
      {/* the voxel floor: a perspective grid laid over the ground while the line says so */}
      <AbsoluteFill style={{ opacity: grid * 0.55, perspective: 900, pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: -600, right: -600, top: 560, height: 1400, transform: "rotateX(66deg)", transformOrigin: "50% 0",
          backgroundImage: `linear-gradient(${C.accent} 2px, transparent 2px), linear-gradient(90deg, ${C.accent} 2px, transparent 2px)`, backgroundSize: "70px 70px",
          maskImage: "linear-gradient(180deg, transparent 0%, #000 22%, #000 70%, transparent 100%)", WebkitMaskImage: "linear-gradient(180deg, transparent 0%, #000 22%, #000 70%, transparent 100%)" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,11,10,0.45) 0%, rgba(11,11,10,0) 20%, rgba(11,11,10,0) 66%, rgba(11,11,10,0.8) 100%)" }} />
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <Finder x={60} y={60} w={1800} h={960} p={1} arm={46} weight={4} rec />
      <In at={4} style={{ position: "absolute", left: 150, top: 98 }}><Kicker color={C.ink} size={20}>Play mode · the scene quest</Kicker></In>
      <div style={{ position: "absolute", right: 130, top: 100, fontFamily: mono, fontSize: 16, color: C.ink2, letterSpacing: "0.04em" }}>our own screen recording · holorra.xyz · 19 Nov 2026</div>
      <div style={{ position: "absolute", left: 130, top: 170, display: "flex", flexDirection: "column", gap: 12 }}>
        {STEPS.map(([cue, label], i) => {
          const t = rel(cue) - 2, p = pop(f, t), o = interpolate(f, [t, t + 8], [0, 1], clamp);
          const out = interpolate(f, [tOn - 12, tOn - 2], [1, 0], clamp);
          return (
            <div key={label} style={{ opacity: o * out, transform: `translateX(${(1 - p) * -30}px)`, display: "flex", alignItems: "center", gap: 14, background: "rgba(11,11,10,0.82)", border: `1px solid ${C.lineStrong}`, borderRadius: 8, padding: "10px 18px 10px 12px", width: "fit-content" }}>
              <span style={{ width: 30, height: 30, borderRadius: 6, background: C.accent, color: C.accentInk, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontWeight: 700, fontSize: 20 }}>✓</span>
              <span style={{ fontFamily: sans, fontWeight: 600, fontSize: 30, letterSpacing: "-0.03em", color: C.ink }}>{label}</span>
              <span style={{ fontFamily: mono, fontSize: 16, color: C.ink3 }}>0{i + 1}</span>
            </div>
          );
        })}
      </div>
      <Card at={tVoxel - 10} out={tOn - 12} left={1190} top={700} width={600} accent={C.accent}>
        <Kicker color={C.ink3} size={15}>VoxelCollision · @manycore/aholo-viewer</Kicker>
        <div style={{ fontSize: 46, fontWeight: 600, letterSpacing: "-0.04em", marginTop: 8 }}>A 5 cm voxel grid</div>
        <div style={{ fontFamily: mono, fontSize: 19, color: C.ink2, marginTop: 6 }}>of the same capture, under her feet</div>
      </Card>
      {/* the same quest on a phone: the owner's full iPhone screen recording, uncropped, in an iPhone 15 Pro body */}
      <div style={{ position: "absolute", left: 1310, top: 64 + (1 - ph) * 90, opacity: pho, transform: `rotate(${(1 - ph) * 4}deg)`, transformOrigin: "50% 100%" }}>
        <Phone><Sequence from={tPhone - 14} layout="none"><Plate name="phone" from={205} x={0} y={0} w={PW} h={PH} dur={200} z0={1} z1={1} /></Sequence></Phone>
      </div>
      <In at={tPhone - 2} style={{ position: "absolute", left: 130, top: 790 }}>
        <div style={{ fontFamily: sans, fontWeight: 500, fontSize: 84, letterSpacing: "-0.045em", lineHeight: 1.04, color: C.ink, textShadow: "0 6px 40px rgba(0,0,0,0.8)" }}>On a phone, your <span style={{ color: C.accent }}>thumb</span><br />does the walking.</div>
      </In>
    </Fill>
  );
};
