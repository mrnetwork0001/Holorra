"use client";

import { useEffect, useRef } from "react";

/**
 * Page-wide living background, deliberately quiet:
 *  - a faint field of drifting splat points with depth parallax on scroll
 *    (a few in the accent color),
 *  - a hairline grid that only appears around the cursor,
 *  - fine animated film grain (CSS, see .film-grain in globals.css).
 * Fixed behind the content; paused in background tabs; static under reduced motion.
 */
export default function AmbientField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const grid = gridRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let seed = 23;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const COUNT = 220;
    const pts = Array.from({ length: COUNT }, () => ({
      x: rnd(),
      y: rnd() * 1.6,
      z: 0.25 + rnd() * 0.75, // depth: 1 near, 0.25 far
      vx: (rnd() - 0.5) * 0.004,
      vy: -0.004 - rnd() * 0.006,
      acc: rnd() < 0.05,
      ph: rnd() * Math.PI * 2,
    }));

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      if (!grid) return;
      grid.style.setProperty("--mx", `${e.clientX}px`);
      grid.style.setProperty("--my", `${e.clientY}px`);
      grid.style.opacity = "1";
    };
    const onLeave = () => {
      if (grid) grid.style.opacity = "0";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    const draw = (t: number, dt: number) => {
      const scroll = window.scrollY;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx * dt * p.z;
        p.y += p.vy * dt * p.z;
        if (p.y < -0.1) p.y += 1.7;
        if (p.x < -0.05) p.x += 1.1;
        if (p.x > 1.05) p.x -= 1.1;
        // depth parallax: near points move more with scroll
        const sy = (((p.y * h - scroll * 0.18 * p.z) % (h * 1.6)) + h * 1.6) % (h * 1.6) - h * 0.3;
        const sx = p.x * w + Math.sin(t * 0.0004 + p.ph) * 6 * p.z;
        const r = 0.6 + p.z * 1.5;
        const a = p.acc ? 0.55 : 0.08 + p.z * 0.16;
        ctx.fillStyle = p.acc ? `rgba(255,106,43,${a})` : `rgba(236,233,226,${a})`;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      draw(now, dt);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    };
    const onVis = () => {
      if (!document.hidden && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    if (reduced) draw(0, 0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div
        ref={gridRef}
        className="absolute inset-0 hairline-grid opacity-0 transition-opacity duration-700"
        style={{
          maskImage: "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), black, transparent)",
          WebkitMaskImage: "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), black, transparent)",
        }}
      />
      <div className="film-grain absolute inset-0" />
    </div>
  );
}
