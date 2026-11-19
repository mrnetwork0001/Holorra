import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { scene, wordAt } from "../timing";
import { C, mono, sans, serif, TONE, Tone } from "../theme";
import { clamp, expo, pop, soft } from "../ui/motion";
import { clip } from "../ui/Footage";

/** Scene-local frame and word cues: rel("word", n) is when the nth "word" is spoken, scene-local. */
export function useCue(id: string) {
  const s = scene(id);
  const f = useCurrentFrame();
  const rel = (w: string, n = 0) => wordAt(id, w, n) - s.from;
  return { s, f, rel, dur: s.durationInFrames };
}

/** A full scene background in one of the three tones, with a faint stage grid. */
export const Fill: React.FC<{ tone: Tone; children: React.ReactNode; grid?: boolean }> = ({ tone, children, grid = true }) => {
  const t = TONE[tone];
  const g = tone === "dark" ? "rgba(236,233,226,0.04)" : "rgba(11,11,10,0.05)";
  return (
    <AbsoluteFill style={{ background: t.bg, color: t.ink, fontFamily: sans, overflow: "hidden" }}>
      {grid ? <AbsoluteFill style={{ backgroundImage: `linear-gradient(${g} 1px, transparent 1px), linear-gradient(90deg, ${g} 1px, transparent 1px)`, backgroundSize: "96px 96px", backgroundPosition: "-1px -1px" }} /> : null}
      {children}
    </AbsoluteFill>
  );
};

export const Kicker: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties; dot?: string }> = ({ children, color, size = 18, style, dot }) => (
  <div style={{ fontFamily: mono, fontSize: size, letterSpacing: "0.16em", textTransform: "uppercase", color, display: "flex", alignItems: "center", gap: 12, ...style }}>
    {dot ? <span style={{ width: 10, height: 10, borderRadius: 5, background: dot }} /> : null}
    {children}
  </div>
);

/** Fade, rise and un-blur for any block. */
export const In: React.FC<{ at: number; dur?: number; y?: number; x?: number; children: React.ReactNode; style?: React.CSSProperties; out?: number }> = ({ at, dur = 16, y = 24, x = 0, children, style, out }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: expo });
  const o = out != null ? interpolate(f, [out, out + 10], [1, 0], clamp) : 1;
  return <div style={{ opacity: p * o, transform: `translate(${(1 - p) * x}px, ${(1 - p) * y}px)`, filter: p < 1 ? `blur(${(1 - p) * 7}px)` : undefined, ...style }}>{children}</div>;
};

/** A card that pops in at `at`. */
export const Card: React.FC<{ at: number; left: number; top: number; width: number; tone?: Tone; accent?: string; children: React.ReactNode; style?: React.CSSProperties; out?: number }> = ({ at, left, top, width, tone = "dark", accent, children, style, out }) => {
  const f = useCurrentFrame();
  const p = pop(f, at);
  const o = interpolate(f, [at, at + 8], [0, 1], clamp) * (out != null ? interpolate(f, [out, out + 10], [1, 0], clamp) : 1);
  const dark = tone === "dark";
  return (
    <div style={{
      position: "absolute", left, top, width, opacity: o, transform: `translateY(${(1 - p) * 26}px) scale(${0.95 + 0.05 * p})`, transformOrigin: "50% 100%",
      background: dark ? "rgba(18,18,16,0.94)" : "#ffffff", color: dark ? C.ink : C.canvas, padding: "20px 24px", borderRadius: 8,
      boxShadow: dark ? "0 0 0 1px rgba(236,233,226,0.14), 0 30px 70px rgba(0,0,0,0.55)" : "0 0 0 1px rgba(11,11,10,0.1), 0 26px 60px rgba(11,11,10,0.18)",
      borderTop: accent ? `3px solid ${accent}` : undefined, fontFamily: sans, ...style,
    }}>{children}</div>
  );
};

/** Big tight sans display type. */
export const Display: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ children, size = 100, style }) => (
  <div style={{ fontFamily: sans, fontWeight: 500, fontSize: size, letterSpacing: "-0.045em", lineHeight: 1.03, ...style }}>{children}</div>
);

export const Mono: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 22, color, style }) => (
  <span style={{ fontFamily: mono, fontSize: size, color, fontVariantNumeric: "tabular-nums", ...style }}>{children}</span>
);

/**
 * The film's motif, from the Holorra mark: four viewfinder corners that frame a rect. `p` draws
 * them in; `spread` pushes them apart, as the parts of an exploded view.
 */
export const Finder: React.FC<{ x: number; y: number; w: number; h: number; p?: number; spread?: number; color?: string; arm?: number; weight?: number; rec?: boolean }> = ({ x, y, w, h, p = 1, spread = 0, color = C.accent, arm = 54, weight = 5, rec }) => {
  const f = useCurrentFrame();
  const a = arm * p, s = spread;
  const c = (cx: number, cy: number, sx: number, sy: number, k: number) => (
    <path key={k} d={`M${cx + sx * a} ${cy} L${cx} ${cy} L${cx} ${cy + sy * a}`} transform={`translate(${-sx * s} ${-sy * s})`} />
  );
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }} width={1920} height={1080} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="square" opacity={Math.min(1, p * 2)}>
      {c(x, y, 1, 1, 0)}{c(x + w, y, -1, 1, 1)}{c(x + w, y + h, -1, -1, 2)}{c(x, y + h, 1, -1, 3)}
      {rec ? <circle cx={x + 34} cy={y + 34} r={9} fill={color} stroke="none" opacity={Math.floor(f / 15) % 2 ? 1 : 0.25} /> : null}
    </svg>
  );
};

/** Holorra's mark (src/components/brand/Logo.tsx, 24-unit grid): the corners draw, then the splat lands. */
export const Mark: React.FC<{ size: number; p?: number; stroke?: string; fill?: string; style?: React.CSSProperties }> = ({ size, p = 1, stroke = C.ink, fill = C.accent, style }) => {
  const d = interpolate(p, [0, 0.6], [0, 1], clamp), e = interpolate(p, [0.45, 1], [0, 1], { ...clamp, easing: expo });
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={style}>
      <path d="M2.5 7.5v-5h5M16.5 2.5h5v5M21.5 16.5v5h-5M7.5 21.5h-5v-5" stroke={stroke} strokeWidth="1.6" strokeLinecap="square" strokeDasharray="10" strokeDashoffset={10 * (1 - d)} />
      <ellipse cx="12" cy="12" rx={6.2 * e} ry={3.1 * e} transform={`rotate(${-28 - (1 - e) * 60} 12 12)`} fill={fill} />
    </svg>
  );
};

/** Parts of an exploded view: each child sits `d` away from its place until `p` reaches 1. */
export const Part: React.FC<{ p: number; dx?: number; dy?: number; rot?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ p, dx = 0, dy = 0, rot = 0, children, style }) => (
  <div style={{ transform: `translate(${(1 - p) * dx}px, ${(1 - p) * dy}px) rotate(${(1 - p) * rot}deg)`, opacity: interpolate(p, [0, 0.35], [0, 1], clamp), ...style }}>{children}</div>
);

/** A recorded clip covering a box, with a slow push. `from` is the clip frame to start at; holds its last frame. */
export const Plate: React.FC<{ name: string; from?: number; x?: number; y?: number; w?: number; h?: number; z0?: number; z1?: number; ox?: number; oy?: number; dur?: number; radius?: number; rate?: number; style?: React.CSSProperties; freezeAt?: number }> = ({ name, from = 0, x = 0, y = 0, w = 1920, h = 1080, z0 = 1, z1 = 1.06, ox = 50, oy = 50, dur = 300, radius = 0, rate = 1, style, freezeAt }) => {
  const f = useCurrentFrame();
  const c = clip(name);
  const z = interpolate(f, [0, dur], [z0, z1], { ...clamp, easing: soft });
  if (!c) return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: C.raised, color: C.ink3, fontFamily: mono, fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: radius, ...style }}>footage “{name}” pending</div>;
  const last = Math.max(0, Math.floor((c.durationFrames - 3 - from) / rate));
  const stop = Math.min(last, freezeAt ?? Infinity);
  const v = <OffthreadVideo src={staticFile(c.file)} startFrom={from} playbackRate={rate} muted style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${ox}% ${oy}%` }} />;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", borderRadius: radius, background: "#000", ...style }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${z})`, transformOrigin: `${ox}% ${oy}%` }}>
        {f >= stop ? <Freeze frame={stop}>{v}</Freeze> : v}
      </div>
    </div>
  );
};

/** A big figure with a mono label under it. */
export const Stat: React.FC<{ at: number; figure: React.ReactNode; label: React.ReactNode; color?: string; size?: number; muted?: string; style?: React.CSSProperties }> = ({ at, figure, label, color, size = 120, muted = C.ink2, style }) => (
  <In at={at} style={style}>
    <div style={{ fontFamily: sans, fontWeight: 500, fontSize: size, letterSpacing: "-0.05em", lineHeight: 1, color, fontVariantNumeric: "tabular-nums" }}>{figure}</div>
    <div style={{ fontFamily: mono, fontSize: 19, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, marginTop: 12 }}>{label}</div>
  </In>
);

export { serif };
