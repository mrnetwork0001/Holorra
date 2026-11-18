"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Lux3dResult } from "@/config/lux3d-results";

const GlbViewer = dynamic(() => import("@/components/lab/GlbViewer"), { ssr: false });
const ArticulatedViewer = dynamic(() => import("@/components/lab/ArticulatedViewer"), { ssr: false });

/** Articulation bench: the real URDF result, auto-looping or driven by joint sliders. */
export function ArticulationBench({
  result,
  joints,
}: {
  result: Lux3dResult;
  joints: { name: string; type: string; child: string; limit: string; axis: string }[];
}) {
  const [manual, setManual] = useState<Record<string, number> | null>(null);
  const moving = joints.filter((j) => j.type !== "fixed");
  return (
    <div className="grid border border-line lg:grid-cols-[1.3fr_1fr]">
      <ArticulatedViewer
        urdf={result.file}
        bounds={result.bounds}
        manual={manual}
        className="aspect-[4/3] w-full border-b border-line lg:border-b-0 lg:border-r"
      />
      <div className="bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="label">Joints</span>
          <button
            type="button"
            className={`btn btn-sm ${manual ? "" : "!border-accent !text-accent"}`}
            onClick={() => setManual(manual ? null : Object.fromEntries(moving.map((j) => [j.name, 0.6])))}
          >
            {manual ? "Auto loop" : "Looping"}
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {moving.map((j) => (
            <div key={j.name}>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[12px] text-ink">{j.name}</span>
                <span className="font-mono text-[11px] text-ink-3">
                  {j.type} · {j.limit}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                aria-label={j.name}
                value={Math.round((manual?.[j.name] ?? 0.6) * 100)}
                onChange={(e) => setManual({ ...(manual ?? Object.fromEntries(moving.map((m) => [m.name, 0.6]))), [j.name]: Number(e.target.value) / 100 })}
                className="mt-2 w-full"
              />
            </div>
          ))}
        </div>
        <table className="mt-6 w-full border-collapse text-left">
          <thead>
            <tr className="border-y border-line">
              <th className="label py-2 pr-3 font-medium">Joint</th>
              <th className="label py-2 pr-3 font-medium">Type</th>
              <th className="label py-2 font-medium">Axis</th>
            </tr>
          </thead>
          <tbody>
            {joints.map((j) => (
              <tr key={j.name} className="border-b border-line">
                <td className="py-2.5 pr-3 font-mono text-[12px] text-ink">{j.child}</td>
                <td className="py-2.5 pr-3 font-mono text-[12px] text-ink-2">{j.type}</td>
                <td className="py-2.5 font-mono text-[12px] text-ink-2">{j.axis}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-[12.5px] leading-relaxed text-ink-3">
          Link names, joint types, axes and limits are read live from the robot.urdf Lux3D returned.
        </p>
      </div>
    </div>
  );
}

/** A captioned live viewer for one Lux3D result. */
export function ResultViewer({
  result,
  clip = null,
  aspect = "aspect-[4/3]",
}: {
  result: Lux3dResult;
  clip?: string | "first" | null;
  aspect?: string;
}) {
  return (
    <figure className="border border-line bg-surface">
      <GlbViewer src={result.file} bounds={result.bounds} clip={clip} className={`w-full ${aspect}`} />
      <figcaption className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line px-4 py-3">
        <span className="text-[14px] text-ink">{result.label}</span>
        <span className="font-mono text-[11px] text-ink-3">task {result.taskId}</span>
        <span className="ml-auto font-mono text-[11px] text-ink-2 tabular">
          {result.seconds} s{result.triangles ? ` · ${(result.triangles / 1000).toFixed(0)}k tris` : ""}
          {result.textureMaps ? ` · ${result.textureMaps} maps` : ""}
        </span>
      </figcaption>
    </figure>
  );
}

/** Retargeted character: one skinned GLB, eight clips, switchable in place. */
export function ClipBench({
  result,
  clips,
}: {
  result: Lux3dResult;
  clips: { clip: string; id: string; seconds: number }[];
}) {
  const [active, setActive] = useState(clips[1]?.clip ?? clips[0].clip);
  return (
    <figure className="border border-line bg-surface">
      <GlbViewer src={result.file} bounds={result.bounds} clip={active} className="aspect-[3/4] w-full" />
      <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-3">
        {clips.map((c) => (
          <button
            key={c.clip}
            type="button"
            onClick={() => setActive(c.clip)}
            className={`btn btn-sm font-mono ${active === c.clip ? "!border-accent !text-accent" : ""}`}
          >
            {c.id}
          </button>
        ))}
      </div>
      <figcaption className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-line px-4 py-3">
        <span className="text-[14px] text-ink">{result.label}</span>
        <span className="font-mono text-[11px] text-ink-3">task {result.taskId}</span>
        <span className="ml-auto font-mono text-[11px] text-ink-2 tabular">
          ≤{result.seconds} s · {result.joints} joints
        </span>
      </figcaption>
    </figure>
  );
}

/** Part-split bench: live explode of the real 4-part GLB plus its measured part table. */
export function PartsBench({
  result,
  parts,
}: {
  result: Lux3dResult;
  parts: { material: string; reading: string; triangles: number; center: [number, number, number] }[];
}) {
  const [explode, setExplode] = useState(0.55);
  const [spin, setSpin] = useState(true);
  return (
    <div className="grid border border-line lg:grid-cols-[1.3fr_1fr]">
      <GlbViewer
        src={result.file}
        bounds={result.bounds}
        explode={explode}
        autoRotate={spin}
        partCenters={parts.map((p) => p.center)}
        className="aspect-[4/3] w-full border-b border-line lg:border-b-0 lg:border-r"
      />
      <div className="bg-surface p-5 sm:p-6">
        <div className="flex items-baseline justify-between">
          <label htmlFor="lab-explode" className="label">
            Explode
          </label>
          <span className="font-mono text-[13px] text-ink tabular">{Math.round(explode * 100)}%</span>
        </div>
        <input
          id="lab-explode"
          type="range"
          min={0}
          max={100}
          value={Math.round(explode * 100)}
          onChange={(e) => setExplode(Number(e.target.value) / 100)}
          className="mt-3 w-full"
        />
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn btn-sm" onClick={() => setExplode(0)}>
            Assembled
          </button>
          <button type="button" className="btn btn-sm" onClick={() => setExplode(0.55)}>
            Exploded
          </button>
          <button type="button" className="btn btn-sm btn-ghost ml-auto" onClick={() => setSpin((s) => !s)}>
            {spin ? "Pause turntable" : "Turntable"}
          </button>
        </div>

        <table className="mt-6 w-full border-collapse text-left">
          <thead>
            <tr className="border-y border-line">
              <th className="label py-2 pr-3 font-medium">Part</th>
              <th className="label py-2 pr-3 font-medium">Our reading</th>
              <th className="label py-2 text-right font-medium">Tris</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p.material} className="border-b border-line">
                <td className="py-2.5 pr-3 font-mono text-[12px] text-ink-2">{p.material}</td>
                <td className="py-2.5 pr-3 text-[13px] text-ink">{p.reading}</td>
                <td className="py-2.5 text-right font-mono text-[12px] text-ink-2 tabular">{p.triangles.toLocaleString("en-US")}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2.5 pr-3 text-[13px] text-ink-3" colSpan={2}>
                Total (same as the unsplit G1 mesh)
              </td>
              <td className="py-2.5 text-right font-mono text-[12px] text-accent tabular">
                {parts.reduce((n, p) => n + p.triangles, 0).toLocaleString("en-US")}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-4 text-[12.5px] leading-relaxed text-ink-3">
          Lux3D returns the parts as unnamed materials. The readings are our description of each part&apos;s position and size.
        </p>
      </div>
    </div>
  );
}
