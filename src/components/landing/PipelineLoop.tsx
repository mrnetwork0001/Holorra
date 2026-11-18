"use client";

import { useEffect, useRef, useState } from "react";
import { T } from "@/lib/i18n";

/**
 * Hero visual: one continuous loop through Holorra's four stages.
 * ~1,000 particles morph between formations on a slowly orbiting camera:
 *   01 splat world → 02 object that splits into parts (lid hinges open)
 *   03 rigged figure walking → 04 camera flying a keyframed path.
 * Pure 2D canvas, paused offscreen / in background tabs, static under reduced motion.
 */

type V3 = [number, number, number];

const N = 1000;
const PHASE_DUR = 4.2; // seconds per stage
const MORPH = 1.1; // seconds of each stage spent morphing in

const PHASES = [
  { n: "01", title: "Generate the world", zh: "生成世界", short: "世界", call: "world.generations.create" },
  { n: "02", title: "Split the parts", zh: "拆分部件", short: "部件", call: "lux3d.partSplit · articulationAnimation" },
  { n: "03", title: "Rig the actors", zh: "绑定角色", short: "角色", call: "lux3d.humanoidAutoRig · retarget" },
  { n: "04", title: "Direct the scene", zh: "导演场景", short: "场景", call: "camera path → LuxReal" },
];

// --------------------------------------------------------------------------- math
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** bone vector of length L hanging down, swung by angle a in the y–z plane */
const swing = (L: number, a: number): V3 => [0, -L * Math.cos(a), L * Math.sin(a)];

function catmull(p0: V3, p1: V3, p2: V3, p3: V3, t: number): V3 {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (i: 0 | 1 | 2) =>
    0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3);
  return [f(0), f(1), f(2)];
}

// --------------------------------------------------------------------------- static formations
let seed = 11;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const gauss = () => {
  const u = 1 - rnd();
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const R = Array.from({ length: N }, () => [rnd(), rnd(), rnd(), rnd(), rnd()]);

const BLOBS: [V3, number][] = [
  [[-0.85, -0.42, -0.55], 0.22],
  [[0.75, -0.5, -0.7], 0.2],
  [[0.95, -0.55, 0.45], 0.16],
  [[-0.55, -0.6, 0.55], 0.14],
];

const WORLD: V3[] = R.map(([a, b, c], i) => {
  const k = i % 10;
  if (k < 5) return [-1.5 + a * 3, -0.72 + gauss() * 0.008, -1.1 + b * 2.2];
  if (k < 7) return [-1.5 + a * 3, -0.72 + b * 1.45, -1.12 + gauss() * 0.01];
  if (k < 8) return [-1.52 + gauss() * 0.01, -0.72 + b * 1.45, -1.1 + a * 2.2];
  const [ctr, s] = BLOBS[Math.floor(c * BLOBS.length)];
  return [ctr[0] + gauss() * s * 0.6, ctr[1] + Math.abs(gauss()) * s * 0.7, ctr[2] + gauss() * s * 0.6];
});
const WORLD_SIZE = R.map(([, , , d], i) => (i % 10 < 5 ? 2.0 : 2.8) + d * 2.2);
/** per-stage camera zoom (world / object / figure / director), blended during morphs */
const ZOOM = [0.6, 0.66, 0.92, 0.6];

// Object: box surface samples, classified into parts.
const HX = 0.55;
const HY = 0.4;
const HZ = 0.4;
const BOX_CY = -0.3;
type Part = 0 | 1 | 2 | 3 | 4; // lid, drawer, left, right, body
const OBJ: { p: V3; part: Part }[] = R.map(([a, b, c]) => {
  const face = Math.floor(a * 6);
  const u = b * 2 - 1;
  const v = c * 2 - 1;
  let p: V3;
  if (face === 0) p = [u * HX, HY, v * HZ];
  else if (face === 1) p = [u * HX, -HY, v * HZ];
  else if (face === 2) p = [u * HX, v * HY, HZ];
  else if (face === 3) p = [u * HX, v * HY, -HZ];
  else if (face === 4) p = [HX, u * HY, v * HZ];
  else p = [-HX, u * HY, v * HZ];
  let part: Part = 4;
  if (p[1] > HY - 0.13) part = 0;
  else if (p[2] > HZ - 0.02 && p[1] < 0.02 && Math.abs(p[0]) < 0.33) part = 1;
  else if (p[0] < -HX + 0.1) part = 2;
  else if (p[0] > HX - 0.1) part = 3;
  return { p, part };
});

function explodePart(p: V3, part: Part, e: number): V3 {
  if (part === 0) {
    // lid hinges about the back-top edge, then lifts slightly
    const a = -e * 1.05;
    const qy = p[1] - HY;
    const qz = p[2] + HZ;
    const y = qy * Math.cos(a) - qz * Math.sin(a);
    const z = qy * Math.sin(a) + qz * Math.cos(a);
    return [p[0], y + HY + e * 0.1, z - HZ];
  }
  if (part === 1) return [p[0], p[1], p[2] + e * 0.48];
  if (part === 2) return [p[0] - e * 0.3, p[1], p[2]];
  if (part === 3) return [p[0] + e * 0.3, p[1], p[2]];
  return [p[0], p[1] - e * 0.04, p[2]];
}
const objPos = (i: number, e: number): V3 => {
  const { p, part } = OBJ[i];
  const q = explodePart(p, part, e);
  return [q[0], q[1] + BOX_CY, q[2]];
};

// Figure: particles distributed along bones.
const BONES = 12;
const FIG = R.map(([a, b, c], i) => ({ bone: i % (BONES + 1), u: a, ang: b * Math.PI * 2, rad: c }));

function skeleton(t: number) {
  const w = t * 3.6;
  const P: V3 = [0, -0.06 + 0.025 * Math.abs(Math.sin(w)), 0];
  const C = add(P, [0, 0.36, 0]);
  const Nk = add(C, [0, 0.08, 0]);
  const H = add(Nk, [0, 0.13, 0]);
  const SL = add(C, [-0.17, -0.01, 0]);
  const SR = add(C, [0.17, -0.01, 0]);
  const arm = 0.55 * Math.sin(w);
  const EL = add(SL, swing(0.25, -arm));
  const HL = add(EL, swing(0.23, -arm * 1.25 - 0.25));
  const ER = add(SR, swing(0.25, arm));
  const HR = add(ER, swing(0.23, arm * 1.25 - 0.25));
  const HPL = add(P, [-0.09, 0, 0]);
  const HPR = add(P, [0.09, 0, 0]);
  const leg = 0.5 * Math.sin(w);
  const KL = add(HPL, swing(0.32, leg));
  const FL = add(KL, swing(0.32, leg - Math.max(0, Math.sin(w + 1.2)) * 0.7));
  const KR = add(HPR, swing(0.32, -leg));
  const FR = add(KR, swing(0.32, -leg - Math.max(0, Math.sin(w + 1.2 + Math.PI)) * 0.7));
  const bones: [V3, V3, number][] = [
    [P, C, 0.07],
    [C, Nk, 0.04],
    [SL, SR, 0.035],
    [SL, EL, 0.035],
    [EL, HL, 0.03],
    [SR, ER, 0.035],
    [ER, HR, 0.03],
    [HPL, HPR, 0.05],
    [HPL, KL, 0.045],
    [KL, FL, 0.04],
    [HPR, KR, 0.045],
    [KR, FR, 0.04],
  ];
  const joints = [P, C, Nk, SL, SR, EL, ER, HL, HR, HPL, HPR, KL, KR, FL, FR];
  return { bones, joints, head: H };
}

function figPos(i: number, sk: ReturnType<typeof skeleton>): V3 {
  const f = FIG[i];
  if (f.bone === BONES) {
    // head sphere
    const th = f.ang;
    const ph = Math.acos(2 * f.u - 1);
    const r = 0.1;
    return [sk.head[0] + r * Math.sin(ph) * Math.cos(th), sk.head[1] + r * Math.cos(ph), sk.head[2] + r * Math.sin(ph) * Math.sin(th)];
  }
  const [a, b, r] = sk.bones[f.bone];
  const c = lerp3(a, b, f.u);
  const rr = r * Math.sqrt(f.rad);
  return [c[0] + Math.cos(f.ang) * rr, c[1], c[2] + Math.sin(f.ang) * rr];
}

// Camera path for stage 04 (world coordinates).
const PATH: V3[] = [
  [-1.25, 0.15, 1.05],
  [-1.25, 0.15, 1.05],
  [-0.15, 0.42, 1.25],
  [0.95, 0.28, 0.6],
  [1.25, 0.5, -0.55],
  [1.25, 0.5, -0.55],
];
const pathAt = (u: number): V3 => {
  const segs = PATH.length - 3;
  const x = clamp01(u) * segs;
  const s = Math.min(segs - 1, Math.floor(x));
  return catmull(PATH[s], PATH[s + 1], PATH[s + 2], PATH[s + 3], x - s);
};

// --------------------------------------------------------------------------- component
function sprite(rgb: string, soft: boolean) {
  const s = 32;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const g = cv.getContext("2d")!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(soft ? 0.25 : 0.55, `rgba(${rgb},${soft ? 0.45 : 0.9})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return cv;
}

export default function PipelineLoop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const clockRef = useRef<HTMLSpanElement | null>(null);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const INK = "236,233,226";
    const ACC = "255,106,43";
    const sInk = sprite(INK, true);
    const sInkHard = sprite(INK, false);
    const sAcc = sprite(ACC, false);

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const pos: V3[] = Array.from({ length: N }, (_, i) => [...WORLD[i]] as V3);
    const proj = new Float32Array(N * 3);
    let lastPhase = -1;

    const formation = (k: number, i: number, tau: number, tGlobal: number, sk: ReturnType<typeof skeleton>): V3 => {
      if (k === 1) return objPos(i, smooth(1.3, 3.3, tau));
      if (k === 2) return figPos(i, sk);
      return WORLD[i];
    };

    const draw = (tSec: number) => {
      const cycle = PHASE_DUR * 4;
      const tc = tSec % cycle;
      const k = Math.floor(tc / PHASE_DUR);
      const tau = tc - k * PHASE_DUR;
      const prev = (k + 3) % 4;
      if (k !== lastPhase) {
        lastPhase = k;
        setPhase(k);
      }

      // camera
      const yaw = -0.6 + tSec * 0.16;
      const pitch = 0.34;
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const zm = ease(clamp01(tau / MORPH));
      const zoom = ZOOM[prev] + (ZOOM[k] - ZOOM[prev]) * zm;
      const scale = Math.min(w * 0.42, h * 0.62) * zoom;
      const ox = w / 2;
      const oy = h * 0.53;
      const project = (p: V3, out: Float32Array, o: number) => {
        const x1 = p[0] * cy - p[2] * sy;
        const z1 = p[0] * sy + p[2] * cy;
        const y2 = p[1] * cp - z1 * sp;
        const z2 = p[1] * sp + z1 * cp;
        const persp = 3.4 / (3.4 - z2);
        out[o] = ox + x1 * scale * persp;
        out[o + 1] = oy - y2 * scale * persp;
        out[o + 2] = persp;
      };
      const tmp = new Float32Array(3);
      const P2 = (p: V3) => {
        project(p, tmp, 0);
        return [tmp[0], tmp[1]] as const;
      };

      const sk = skeleton(tSec);
      const skPrev = skeleton(tSec);
      for (let i = 0; i < N; i++) {
        const target = formation(k, i, tau, tSec, sk);
        const delay = R[i][4] * 0.35;
        const m = ease(clamp01((tau - delay) / (MORPH - 0.35)));
        if (m < 1) {
          const from = formation(prev, i, PHASE_DUR, tSec, skPrev);
          pos[i] = lerp3(from, target, m);
        } else {
          pos[i] = target;
        }
        project(pos[i], proj, i * 3);
      }

      ctx.clearRect(0, 0, w, h);

      // ---------------- overlays drawn under particles
      if (k === 1 && tau > 0.6) {
        // body + lid outline
        const e = smooth(1.3, 3.3, tau);
        const a = clamp01((tau - 0.6) / 0.6);
        const corners = (part: Part, yLo: number, yHi: number, xs = HX, zs = HZ) => {
          const c: V3[] = [];
          for (const yy of [yLo, yHi]) for (const [xx, zz] of [[-xs, -zs], [xs, -zs], [xs, zs], [-xs, zs]] as const) c.push(explodePart([xx, yy, zz], part, e));
          return c.map((q) => [q[0], q[1] + BOX_CY, q[2]] as V3);
        };
        const box = (c: V3[], stroke: string) => {
          ctx.strokeStyle = stroke;
          ctx.beginPath();
          const idx = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
          for (const [s, t2] of idx) {
            const [x1, y1] = P2(c[s]);
            const [x2, y2] = P2(c[t2]);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          }
          ctx.stroke();
        };
        ctx.lineWidth = 1;
        box(corners(4, -HY, HY - 0.13, HX - 0.1, HZ), `rgba(${INK},${0.22 * a})`);
        box(corners(0, HY - 0.13, HY), `rgba(${ACC},${0.85 * a})`);
        box(corners(1, -HY + 0.06, 0.02, 0.33, HZ).map((q) => [q[0], q[1], q[2]] as V3), `rgba(${INK},${0.4 * a})`);
      }

      if (k === 3) {
        const a = clamp01((tau - 0.4) / 0.6);
        // path
        ctx.setLineDash([4, 5]);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = `rgba(${INK},${0.45 * a})`;
        ctx.beginPath();
        for (let s = 0; s <= 60; s++) {
          const [x, y] = P2(pathAt(s / 60));
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        // keyframes
        for (const kp of [PATH[1], PATH[2], PATH[3], PATH[4]]) {
          const [x, y] = P2(kp);
          ctx.strokeStyle = `rgba(${ACC},${a})`;
          ctx.fillStyle = "rgba(11,11,10,1)";
          ctx.beginPath();
          ctx.moveTo(x, y - 6);
          ctx.lineTo(x + 6, y);
          ctx.lineTo(x, y + 6);
          ctx.lineTo(x - 6, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        // camera + frustum
        const u = smooth(0.5, PHASE_DUR - 0.3, tau);
        const cam = pathAt(u);
        const look: V3 = [0, -0.4, 0];
        const [cxp, cyp] = P2(cam);
        const [lx, ly] = P2(look);
        ctx.strokeStyle = `rgba(${ACC},${0.35 * a})`;
        ctx.beginPath();
        const dx = lx - cxp;
        const dy = ly - cyp;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const spread = 26;
        ctx.moveTo(cxp, cyp);
        ctx.lineTo(lx + nx * spread, ly + ny * spread);
        ctx.moveTo(cxp, cyp);
        ctx.lineTo(lx - nx * spread, ly - ny * spread);
        ctx.stroke();
        ctx.fillStyle = `rgba(${INK},${a})`;
        ctx.fillRect(cxp - 6, cyp - 4.5, 10, 9);
        ctx.beginPath();
        ctx.moveTo(cxp + 4, cyp - 2.5);
        ctx.lineTo(cxp + 8, cyp - 4.5);
        ctx.lineTo(cxp + 8, cyp + 4.5);
        ctx.lineTo(cxp + 4, cyp + 2.5);
        ctx.fill();
      }

      // ---------------- particles
      const morphing = tau < MORPH;
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < N; i++) {
        const x = proj[i * 3];
        const y = proj[i * 3 + 1];
        const pz = proj[i * 3 + 2];
        let size: number;
        let alpha: number;
        let spr = sInk;
        if (k === 0 || k === 3) {
          size = WORLD_SIZE[i] * pz * (k === 3 ? 0.9 : 1);
          alpha = (k === 3 ? 0.42 : 0.72) * (0.55 + R[i][3] * 0.45);
        } else {
          size = 1.5 * pz + 0.4;
          alpha = 0.75;
          spr = sInkHard;
          if (k === 1 && OBJ[i].part === 0 && tau > 1.2) spr = sAcc;
        }
        if (morphing) size *= 0.9;
        ctx.globalAlpha = alpha;
        ctx.drawImage(spr, x - size, y - size, size * 2, size * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // ---------------- rig overlay on top
      if (k === 2 && tau > 0.8) {
        const a = clamp01((tau - 0.8) / 0.5);
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(${INK},${0.55 * a})`;
        ctx.beginPath();
        for (const [b0, b1] of sk.bones) {
          const [x1, y1] = P2(b0);
          const [x2, y2] = P2(b1);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
        ctx.fillStyle = `rgba(${ACC},${a})`;
        for (const j of sk.joints) {
          const [x, y] = P2(j);
          ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
        }
      }

      // progress + clock (direct DOM writes; no React re-render per frame)
      barsRef.current.forEach((el, i) => {
        if (!el) return;
        const f = i < k ? 1 : i === k ? tau / PHASE_DUR : 0;
        el.style.transform = `scaleX(${f})`;
      });
      if (clockRef.current) {
        const total = Math.floor(tSec * 24);
        const ss = Math.floor(total / 24) % 60;
        const mm = Math.floor(total / 24 / 60) % 60;
        const ff = total % 24;
        clockRef.current.textContent = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
      }
    };

    let raf = 0;
    let running = true;
    let visible = true;
    let tAccum = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tAccum += dt;
      draw(tAccum);
      if (running && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduced) start();
    });
    io.observe(canvas);
    const onVis = () => {
      if (!document.hidden && visible && !reduced) start();
    };
    document.addEventListener("visibilitychange", onVis);

    if (reduced) {
      draw(PHASE_DUR * 1 + 3.6); // static frame: exploded object
    } else {
      start();
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const p = PHASES[phase];

  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden border border-line bg-canvas/60">
      <div className="absolute inset-0 hairline-grid opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]" />
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />

      {/* viewfinder corners */}
      {[
        "left-3 top-3 border-l border-t",
        "right-3 top-3 border-r border-t",
        "left-3 bottom-3 border-l border-b",
        "right-3 bottom-3 border-r border-b",
      ].map((c) => (
        <span key={c} className={`pointer-events-none absolute h-4 w-4 border-ink-3 ${c}`} />
      ))}

      {/* stage label */}
      <div className="absolute left-6 top-6 right-28">
        <div key={phase} className="animate-[stageIn_.5s_ease-out_both]">
          <div className="font-mono text-[11px] text-accent">{p.n}</div>
          <div className="mt-1 text-[17px] font-medium text-ink">
            <T en={p.title} zh={p.zh} />
          </div>
          <div className="mt-0.5 font-mono text-[11px] text-ink-3">{p.call}</div>
        </div>
      </div>

      {/* timecode */}
      <div className="absolute right-6 top-6 flex items-center gap-2 font-mono text-[11px] text-ink-2 tabular">
        <span className="dot dot-live" />
        <span ref={clockRef}>00:00:00</span>
      </div>

      {/* stage progress */}
      <div className="absolute bottom-6 left-6 right-6 grid grid-cols-4 gap-2">
        {PHASES.map((s, i) => (
          <div key={s.n}>
            <div className="h-px w-full overflow-hidden bg-line-strong">
              <span
                ref={(el) => {
                  barsRef.current[i] = el;
                }}
                className="block h-full w-full origin-left bg-accent"
                style={{ transform: "scaleX(0)" }}
              />
            </div>
            <div className={`mt-2 truncate font-mono text-[10.5px] ${i === phase ? "text-ink" : "text-ink-3"}`}>
              {s.n} <T en={s.title.split(" ").pop()} zh={s.short} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
