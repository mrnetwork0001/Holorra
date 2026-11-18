"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll motion for the landing page.
 * <Reveal>     fades + lifts its content in once it enters the viewport.
 *              variant="title" wipes a headline up from a mask; "figure" unmasks an image.
 *              Children with style={{"--i": n}} inside a variant="stagger" Reveal arrive in sequence.
 * <CountUp>    counts a figure such as "41.8M" up from zero when it scrolls into view.
 * <ScrollProgress> a 1px accent line across the top that tracks page progress.
 * All of it is disabled under prefers-reduced-motion (see globals.css).
 */
export function Reveal({
  children,
  variant = "fade",
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  variant?: "fade" | "title" | "figure" | "stagger";
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "ol" | "ul" | "dl" | "h2" | "p";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      data-reveal={variant}
      data-shown={shown ? "true" : "false"}
      className={className}
      style={delay ? ({ transitionDelay: `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {/* The title wipe clips an inner span, never the observed element itself:
          a fully clipped target never reports as intersecting in Chrome. */}
      {variant === "title" ? <span className="reveal-inner block">{children}</span> : children}
    </Tag>
  );
}

export function CountUp({ value, className = "" }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const match = value.match(/^([\d.]+)(.*)$/);
  const target = match ? parseFloat(match[1]) : NaN;
  const decimals = match && match[1].includes(".") ? match[1].split(".")[1].length : 0;
  const suffix = match ? match[2] : "";
  const [text, setText] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || Number.isNaN(target)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setText((0).toFixed(decimals) + suffix);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const dur = 1400;
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        setText((target * eased).toFixed(decimals) + suffix);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, decimals, suffix]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} aria-hidden="true" className="absolute inset-x-0 bottom-[-1px] h-px origin-left bg-accent" style={{ transform: "scaleX(0)" }} />;
}
