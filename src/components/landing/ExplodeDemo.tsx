"use client";

import { useState } from "react";
import { T } from "@/lib/i18n";
import { AHOLO_WORLD_PRESETS, LUX3D_HERO_BLUEPRINTS } from "@/config/aholo-presets";

const blueprint = LUX3D_HERO_BLUEPRINTS[AHOLO_WORLD_PRESETS[0].defaultHeroAssetId];
const STOPS = [
  { v: 0, label: "Closed" },
  { v: 35, label: "Inspect" },
  { v: 65, label: "Service" },
  { v: 100, label: "Full" },
];

const pretty = (name: string) => name.replace(/^\d+_/, "").replace(/_/g, " ");

export default function ExplodeDemo() {
  const [explode, setExplode] = useState(35);
  const [selected, setSelected] = useState<string | null>(blueprint.parts[1]?.id ?? null);

  const parts = blueprint.parts;
  const gap = 5 + explode * 0.5;
  const offset = ((parts.length - 1) * gap) / 2;
  const active = parts.find((p) => p.id === selected) ?? null;

  return (
    <div className="grid border border-line lg:grid-cols-[1.15fr_1fr]">
      {/* Isometric exploded stack */}
      <div className="relative min-h-[400px] overflow-hidden border-b border-line bg-canvas hairline-grid lg:border-b-0 lg:border-r">
        <div
          className="absolute left-1/2 top-1/2"
          style={{ transformStyle: "preserve-3d", transform: "translate(-50%, -50%) rotateX(58deg) rotateZ(-38deg)" }}
        >
          {parts.map((p, i) => {
            const isSel = p.id === selected;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(isSel ? null : p.id)}
                aria-label={`Select ${pretty(p.name)}`}
                className="absolute left-0 top-0 rounded-[3px] transition-[transform,background-color,border-color] duration-500 ease-out"
                style={{
                  width: 220,
                  height: 150,
                  marginLeft: -110,
                  marginTop: -75,
                  transform: `translateZ(${i * gap - offset}px)`,
                  background: isSel
                    ? "color-mix(in srgb, var(--color-accent) 24%, var(--color-surface))"
                    : "color-mix(in srgb, var(--color-hover) 92%, transparent)",
                  border: `1px solid ${
                    isSel ? "var(--color-accent)" : "color-mix(in srgb, var(--color-ink-3) 70%, transparent)"
                  }`,
                }}
              >
                <span
                  className="absolute left-2.5 top-1.5 font-mono text-[10.5px]"
                  style={{ color: isSel ? "var(--color-accent)" : "var(--color-ink-2)" }}
                >
                  P{i + 1}
                </span>
              </button>
            );
          })}
        </div>
        <div className="absolute left-3 top-3 font-mono text-[11px] text-ink-3 tabular">
          explode <span className="text-ink">{String(explode).padStart(3, " ")}%</span> · {parts.length} parts
        </div>
        <div className="absolute bottom-3 left-3 right-3 font-mono text-[11px] text-ink-3">
          <T
            en="Illustration of the studio control. The real one runs inside the WebGL stage."
            zh="创作台控件示意。真实控件运行在 WebGL 舞台中。"
          />
        </div>
      </div>

      {/* Controls + hierarchy */}
      <div className="bg-surface p-5 sm:p-6">
        <div className="flex items-baseline justify-between">
          <label htmlFor="explode" className="label">
            <T en="Explode" zh="爆炸视图" />
          </label>
          <span className="font-mono text-[13px] text-ink tabular">{explode}%</span>
        </div>
        <input
          id="explode"
          type="range"
          min={0}
          max={100}
          value={explode}
          onChange={(e) => setExplode(Number(e.target.value))}
          className="mt-3 w-full"
        />
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {STOPS.map((s) => (
            <button
              key={s.v}
              type="button"
              onClick={() => setExplode(s.v)}
              className={`btn btn-sm w-full font-mono ${explode === s.v ? "!border-accent !text-accent" : ""}`}
            >
              {s.v}%
            </button>
          ))}
        </div>

        <div className="label mt-6">
          <T en="Part hierarchy" zh="部件层级" />
        </div>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {parts.map((p, i) => {
            const isSel = p.id === selected;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelected(isSel ? null : p.id)}
                  className={`flex w-full items-center gap-3 border-l-2 px-2.5 py-2 text-left transition-colors ${
                    isSel ? "border-accent bg-hover" : "border-transparent hover:bg-raised"
                  }`}
                >
                  <span className="w-5 font-mono text-[11px] text-ink-3 tabular">{String(i + 1).padStart(2, "0")}</span>
                  <span className={`truncate text-[13px] ${isSel ? "text-ink" : "text-ink-2"}`}>{pretty(p.name)}</span>
                  <span className="ml-auto font-mono text-[11px] text-ink-3">{p.articulationType}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 min-h-[2.75rem] text-[13px] leading-relaxed text-ink-2">
          {active ? (
            <>
              <span className="text-ink">{pretty(active.name)}</span>
              <T en={<>, {active.semanticRole.toLowerCase()}. </>} zh="。" />
              {active.articulationType !== "none" ? (
                <T
                  en={
                    <>
                      Moves as <span className="font-mono text-ink">{active.articulationType}</span>.
                    </>
                  }
                  zh={
                    <>
                      运动方式：<span className="font-mono text-ink">{active.articulationType}</span>。
                    </>
                  }
                />
              ) : (
                <T en="Fixed part." zh="固定部件。" />
              )}
            </>
          ) : (
            <T en="Select a part to isolate it." zh="选择一个部件即可单独显示。" />
          )}
        </p>
      </div>
    </div>
  );
}
