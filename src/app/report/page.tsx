"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LUX3D_HERO_BLUEPRINTS } from "@/config/aholo-presets";
import { HUMANOID_ANIMATION_GROUPS } from "@/config/humanoid-animations";
import { Glyph } from "@/components/brand/Glyph";
import { Logo, LogoMark } from "@/components/brand/Logo";
import {
  ESPRESSO_JOINTS,
  ESPRESSO_PARTS,
  ESPRESSO_PROMPT,
  LUX3D_RESULTS as LX,
  RETARGET_CLIPS,
} from "@/config/lux3d-results";

const TOTAL = 8;
const CLIP_TOTAL = HUMANOID_ANIMATION_GROUPS.reduce((n, g) => n + g.clips.length, 0);

/* Facts measured from the hosted assets (lod-meta.json, voxel grids), not from config labels. */
const WORLDS = [
  {
    title: "Designer Smart Loft",
    format: "Direct .spz",
    splats: "single file",
    collision: "Voxel walk · 336×112×296 · 5 cm",
  },
  {
    title: "Juguo Urban Plaza",
    format: "Chunk-LOD + .ply sky",
    splats: "41.8M · 5 levels · 528 chunks",
    collision: "Voxel walk · 1392×332×2336 · 20 cm",
  },
  {
    title: "Grand Transit Concourse",
    format: "Chunk-LOD + .sog env",
    splats: "32.7M · 5 levels · SH degree 2",
    collision: "Free camera",
  },
  {
    title: "Object Turntable",
    format: "Direct .sog",
    splats: "single object capture",
    collision: "Free camera",
  },
];

const PIPELINE = [
  {
    n: "01",
    verb: "Generate the world",
    tool: "Aholo SpatialGen · Aholo Reality",
    calls: ["world.generations.create", "world.reconstructions.create", "world.retrieve · world.list"],
    out: "3DGS world as .spz / .ply, streamed into the stage",
  },
  {
    n: "02",
    verb: "Split the parts",
    tool: "Aholo Lux3D",
    calls: ["textTo3d · imgTo3d · imageToFourView", "partSplit.create", "articulationAnimation.create", "materialTransfer · multiFormatExport"],
    out: "PBR mesh with semantic sub-parts and joints",
  },
  {
    n: "03",
    verb: "Rig the actors",
    tool: "Aholo Lux3D",
    calls: ["humanoidAutoRig.create", "humanoidAnimationRetarget.create"],
    out: `Rigged humanoid with up to 10 of ${CLIP_TOTAL} clips per job`,
  },
  {
    n: "04",
    verb: "Direct the scene",
    tool: "Aholo Viewer · LuxReal",
    calls: ["keyframes · Catmull-Rom spline", "storyboard JSON export", "LuxReal create-video hand-off"],
    out: "Camera path, reference frames and shot prompts",
  },
];

const RUBRIC = [
  {
    criterion: "Use of Manycore tools",
    weight: "30%",
    how: "The stage runs on @manycore/aholo-viewer (direct splats, chunk-LOD, GLTF skinning). Server routes under /api/aholo call the official World, Lux3D and Asset clients: all 10 Lux3D methods plus SpatialGen and Reality. Nine live Lux3D jobs ran through those routes (textTo3d ×3, partSplit, articulationAnimation, humanoidAutoRig ×2, humanoidAnimationRetarget); every result is inspectable on /lab. @manycore/aholo-sdk-mcp is pre-wired for agents.",
  },
  {
    criterion: "Fun and engagement",
    weight: "25%",
    how: "Opens on four hosted 3DGS worlds with no generation wait. Explode and recolor parts, toggle joints, walk an actor in first or third person, and fly a recorded camera path.",
  },
  {
    criterion: "Innovation",
    weight: "20%",
    how: "Radiance-field worlds and part-split, articulated, rigged meshes share one stage, with a camera director that hands shots to LuxReal and an MCP co-director that plans tool calls from plain language.",
  },
  {
    criterion: "Completeness",
    weight: "20%",
    how: "Studio, landing page, Lux3D bench, MCP hub and this report ship in one Next.js app, with bring-your-own-key support (x-aholo-api-key, COM / CN regions) and five export formats.",
  },
  {
    criterion: "Reach",
    weight: "5%",
    how: "Copyable .mcp.json for Claude Code and Cursor, a share-ready landing page, and the #Manycorehackathon tag on every page.",
  },
];

/* ---------------------------------------------------------------- slide chrome */

function Slide({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <section className="report-slide relative mx-auto flex w-full min-w-[1040px] max-w-[1280px] flex-col overflow-hidden rounded-lg border border-line bg-surface px-14 pb-8 pt-6 aspect-[16/9]">
      <header className="flex items-center justify-between border-b border-line pb-3">
        <span className="flex items-center gap-2">
          <LogoMark size={15} />
          <span className="label">Holorra · Project report</span>
        </span>
        <span className="font-mono text-[11px] text-ink-3 tabular">
          {String(n).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col pt-7">{children}</div>
    </section>
  );
}

function SlideTitle({ n, section, title, lead }: { n: number; section: string; title: React.ReactNode; lead?: React.ReactNode }) {
  return (
    <div className="mb-7 max-w-4xl">
      <div className="label">
        <span className="text-accent">{String(n).padStart(2, "0")}</span> — {section}
      </div>
      <h2 className="mt-2 font-serif text-[40px] leading-[1.05] tracking-[-0.01em] text-ink">{title}</h2>
      {lead && <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{lead}</p>}
    </div>
  );
}

function Figure({ src, alt, caption, className = "" }: { src: string; alt: string; caption: React.ReactNode; className?: string }) {
  return (
    <figure className={`flex min-h-0 flex-col ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="min-h-0 w-full flex-1 rounded-md border border-line object-cover" />
      <figcaption className="mt-2 text-[11.5px] leading-snug text-ink-3">{caption}</figcaption>
    </figure>
  );
}

/* ---------------------------------------------------------------- page */

export default function ProjectReportDeckPage() {
  const [splitPct, setSplitPct] = useState<number>(60);
  const [engine, setEngine] = useState<"G1-Turbo" | "G1">("G1");

  const hero = LUX3D_HERO_BLUEPRINTS["cyber-barista-station"];

  // Phones/tablets: scale the fixed 16:9 slides to the screen width instead of
  // scrolling the page sideways (docs/MOBILE.md). Print always resets to 1.
  const deckRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    const fit = () => {
      const avail = el.clientWidth - 32;
      el.style.setProperty("--deck-zoom", String(Math.min(1, Math.max(0.2, avail / 1040))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Print setup: one 16:9 slide per page, no screen chrome. */}
      <style>{`
        @media screen { .report-slide { zoom: var(--deck-zoom, 1); } }
        @media print {
          @page { size: 13.333in 7.5in; margin: 0; }
          .report-slide { zoom: 1 !important; }
          .report-deck { padding: 0 !important; gap: 0 !important; overflow: visible !important; max-width: none !important; }
          .report-slide {
            width: 13.333in !important; height: 7.5in !important; min-height: 0 !important;
            max-width: none !important; aspect-ratio: auto !important;
            margin: 0 !important; border: 0 !important; border-radius: 0 !important;
          }
          .report-slide:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      {/* Top bar (hidden in print) */}
      <div className="no-print sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex h-12 max-w-[1280px] items-center gap-4 px-4">
          <Link href="/" aria-label="Holorra home">
            <Logo size={20} />
          </Link>
          <span className="hidden h-4 w-px bg-line sm:block" />
          <Link href="/studio" className="btn btn-ghost btn-sm">
            <Glyph name="back" size={14} />
            <span className="max-[600px]:hidden">Back to studio</span>
            <span className="min-[601px]:hidden">Studio</span>
          </Link>
          <span className="ml-auto hidden text-[12px] text-ink-3 md:block">Project report · 8 slides · prints one slide per page</span>
          <Link href="/mcp" className="btn btn-sm hide-mobile">
            <Glyph name="plug" size={14} />
            MCP hub
          </Link>
          <button type="button" onClick={() => window.print()} className="btn btn-primary btn-sm">
            <Glyph name="print" size={14} />
            Export PDF
          </button>
        </div>
      </div>

      <div ref={deckRef} className="report-deck mx-auto flex max-w-[1312px] flex-col gap-8 overflow-x-auto px-4 py-8 max-[900px]:gap-4 max-[900px]:py-4">
        {/* ============================================================ 01 COVER */}
        <Slide n={1}>
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-10 grid-cols-12">
            <div className="flex flex-col col-span-5">
              <div className="label">Manycore Aholo Global 3D AI Hackathon</div>
              <h1 className="mt-5 font-serif text-[88px] leading-[0.92] tracking-[-0.02em] text-ink">Holorra</h1>
              <p className="mt-3 font-serif text-[30px] italic leading-[1.1] text-ink-2">
                A directing stage for generated 3D worlds.
              </p>
              <p className="mt-6 text-[15px] leading-relaxed text-ink-2">
                Holorra places generated assets inside walkable 3D Gaussian Splatting worlds, takes them apart into
                semantic parts, rigs characters to move through the space, and records camera paths for AI video.
                Every stage runs on the Manycore Aholo SDKs.
              </p>
              <dl className="mt-auto grid grid-cols-[96px_1fr] gap-x-4 gap-y-2.5 border-t border-line pt-5 text-[12.5px]">
                <dt className="label pt-0.5">Tagline</dt>
                <dd className="text-ink">Generate the world. Split the parts. Rig the actors. Direct the scene.</dd>
                <dt className="label pt-0.5">Built on</dt>
                <dd className="font-mono text-[11.5px] leading-relaxed text-ink-2">
                  aholo-viewer 1.14.0 · sdk-world 1.5.0 · sdk-lux3d 1.10.0 · sdk-asset 1.4.0 · sdk-mcp 1.10.0
                </dd>
                <dt className="label pt-0.5">Date</dt>
                <dd className="text-ink-2">November 2026</dd>
              </dl>
            </div>
            <Figure
              className="col-span-7"
              src="/landing/world-loft.jpg"
              alt="Indoor loft interior rendered as 3D Gaussian splats"
              caption={
                <>
                  <span className="text-ink-2">Fig. 1</span> — Designer Smart Loft, a Gaussian Splatting interior streamed
                  from Manycore&apos;s CDN and rendered live in @manycore/aholo-viewer.
                </>
              }
            />
          </div>
        </Slide>

        {/* ============================================================ 02 PROBLEM */}
        <Slide n={2}>
          <SlideTitle
            n={2}
            section="Problem"
            title="Generated 3D usually stops at a statue in an empty room."
            lead="Text-to-3D returns a mesh. It floats in a grey void, it is fused into one shell, it cannot move, and there is no way to film it. Holorra treats the generated asset as the start of a scene."
          />
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-line-strong">
                <th className="label w-[16%] pb-2.5 font-medium">Gap</th>
                <th className="label w-[38%] pb-2.5 font-medium">Typical text-to-3D output</th>
                <th className="label pb-2.5 font-medium">In Holorra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["Place", "A lone .glb on a grey grid, with no room, street or light.", "Inside a walkable 3DGS world from SpatialGen or Reality, with voxel collision on floors and walls."],
                ["Parts", "One fused shell. Doors do not open and nothing separates for printing.", "Semantic sub-meshes from lux3d.partSplit that can be exploded, isolated and recolored."],
                ["Motion", "Static props; characters locked in a T-pose.", "Joints from a sentence via articulationAnimation; humanoidAutoRig plus " + CLIP_TOTAL + " retargetable clips."],
                ["Camera", "A turntable at best.", "Keyframed camera paths with shot prompts, exported as a LuxReal storyboard."],
              ].map(([gap, typical, holorra]) => (
                <tr key={gap} className="align-top">
                  <td className="py-3.5 pr-4 font-medium text-ink">{gap}</td>
                  <td className="py-3.5 pr-6 text-ink-3">{typical}</td>
                  <td className="py-3.5 text-ink">{holorra}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-auto grid grid-cols-1 items-end gap-8 border-t border-line pt-6 grid-cols-12">
            <p className="font-serif text-[30px] italic leading-[1.15] text-ink col-span-8">
              A generated asset should be the start of a scene, not the end of a pipeline.
            </p>
            <p className="text-[12.5px] leading-relaxed text-ink-3 col-span-4">
              Holorra chains SpatialGen or Reality, Lux3D and the Aholo Viewer so the same asset can be placed, opened
              up, animated and filmed without leaving the browser.
            </p>
          </div>
        </Slide>

        {/* ============================================================ 03 ARCHITECTURE */}
        <Slide n={3}>
          <SlideTitle
            n={3}
            section="Architecture"
            title="One stage, four verbs, the full Aholo stack."
            lead="Each step maps to official SDK calls and hands its output to the next step on the same WebGL2 stage."
          />
          <div className="grid grid-cols-1 border-y border-line grid-cols-4 divide-x divide-line">
            {PIPELINE.map((p) => (
              <div key={p.n} className="flex flex-col py-4 px-5 first:pl-0 last:pr-0">
                <div className="font-mono text-[12px] text-accent">{p.n}</div>
                <div className="mt-1 text-[16px] font-semibold text-ink">{p.verb}</div>
                <div className="mt-0.5 text-[12.5px] text-ink-3">{p.tool}</div>
                <ul className="mt-3 space-y-1 font-mono text-[11.5px] text-ink-2">
                  {p.calls.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <div className="mt-auto pt-4 text-[12.5px] text-ink-2">
                  <span className="text-ink-3">Output · </span>
                  {p.out}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 text-[12.5px] grid-cols-3">
            {[
              ["Client", "Next.js App Router. @manycore/aholo-viewer is loaded client-only and runs splat decoding and sorting in Web Workers."],
              ["Server", "/api/aholo/world, lux3d, tasks, director, status. Each wraps the official SDK client; the key comes from AHOLO_API_KEY or the x-aholo-api-key header."],
              ["Agent", "@manycore/aholo-sdk-mcp in .mcp.json for Claude Code and Cursor, plus an in-app co-director that turns a brief into an ordered tool plan."],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="label mb-1">{k}</div>
                <p className="leading-relaxed text-ink-2">{v}</p>
              </div>
            ))}
          </div>
        </Slide>

        {/* ============================================================ 04 STAGE */}
        <Slide n={4}>
          <SlideTitle
            n={4}
            section="The stage"
            title="Four hosted worlds, playable without waiting for generation."
            lead="Live jobs take minutes, so the studio opens on Gaussian Splatting scenes hosted on Manycore's CDN while new worlds and assets render in the background."
          />
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 grid-cols-12">
            <div className="grid min-h-0 grid-rows-2 gap-4 col-span-4">
              <Figure
                src="/landing/world-concourse.jpg"
                alt="Rail yard and market stalls rendered as Gaussian splats"
                caption={<><span className="text-ink-2">Fig. 2</span> — Grand Transit Concourse, chunk-LOD stream.</>}
              />
              <Figure
                src="/landing/world-bear.jpg"
                alt="Teddy bear object splat"
                caption={<><span className="text-ink-2">Fig. 3</span> — Object turntable, .sog capture.</>}
              />
            </div>
            <div className="col-span-8">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line-strong">
                    <th className="label pb-2.5 font-medium">World</th>
                    <th className="label pb-2.5 font-medium">Format</th>
                    <th className="label pb-2.5 font-medium">Splats</th>
                    <th className="label pb-2.5 font-medium">Navigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {WORLDS.map((w) => (
                    <tr key={w.title} className="align-top">
                      <td className="py-3 pr-3 font-medium text-ink">{w.title}</td>
                      <td className="py-3 pr-3 font-mono text-[11.5px] text-ink-2">{w.format}</td>
                      <td className="py-3 pr-3 font-mono text-[11.5px] text-ink-2 tabular">{w.splats}</td>
                      <td className="py-3 font-mono text-[11.5px] text-ink-2 tabular">{w.collision}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-[12px] leading-relaxed text-ink-3">
                Splat totals and grid sizes are read from each world&apos;s lod-meta.json and voxel metadata. Chunk-LOD
                worlds stream by camera distance under a fixed on-screen splat budget.
              </p>
            </div>
          </div>
        </Slide>

        {/* ============================================================ 05 ITERATION 1 */}
        <Slide n={5}>
          <SlideTitle
            n={5}
            section="Asset iteration 1"
            title="Same prompt, two engines."
            lead={
              <>
                Both meshes came from one text prompt through Holorra&apos;s own route. G1-Turbo returned a usable draft in{" "}
                {LX.espressoTurbo.seconds} s; G1 took {LX.espressoG1.seconds} s and embedded a full PBR texture set. The studio drafts with
                Turbo and spends G1 only on the hero asset.
              </>
            }
          />
          <div className="grid min-h-0 flex-1 grid-cols-12 gap-8">
            <Figure
              className="col-span-4"
              src="/landing/lux3d/turbo.jpg"
              alt="Espresso machine generated with Lux3D G1-Turbo"
              caption={<>G1-Turbo · task {LX.espressoTurbo.taskId}</>}
            />
            <Figure
              className="col-span-4"
              src="/landing/lux3d/g1.jpg"
              alt="Espresso machine generated with Lux3D G1"
              caption={<>G1 · task {LX.espressoG1.taskId}</>}
            />
            <div className="col-span-4 flex min-h-0 flex-col">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line-strong">
                    <th className="label pb-2 font-medium" />
                    <th className="label pb-2 font-medium">G1-Turbo</th>
                    <th className="label pb-2 font-medium">G1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-mono text-[12px]">
                  {[
                    ["Wall clock", `${LX.espressoTurbo.seconds} s`, `${LX.espressoG1.seconds} s`],
                    ["Triangles", LX.espressoTurbo.triangles?.toLocaleString("en-US"), LX.espressoG1.triangles?.toLocaleString("en-US")],
                    ["Texture maps", String(LX.espressoTurbo.textureMaps), `${LX.espressoG1.textureMaps} (PBR)`],
                    ["GLB size", `${LX.espressoTurbo.sizeMB} MB`, `${LX.espressoG1.sizeMB} MB`],
                    ["Role", "draft, placement", "hero, partSplit input"],
                  ].map(([k, a, b]) => (
                    <tr key={k}>
                      <td className="py-2.5 pr-3 font-sans text-[12.5px] text-ink-3">{k}</td>
                      <td className="py-2.5 pr-3 text-ink-2">{a}</td>
                      <td className="py-2.5 text-ink">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <blockquote className="mt-5 border-l-2 border-accent pl-3 text-[12.5px] leading-relaxed text-ink-2">
                <span className="label mb-1 block">Prompt (both engines)</span>
                &ldquo;{ESPRESSO_PROMPT}&rdquo;
              </blockquote>
              <p className="mt-auto pt-3 text-[11px] text-ink-3">
                Times are submit-to-success as seen by a 15 s poller. Geometry read from the returned GLBs.
              </p>
            </div>
          </div>
        </Slide>

        {/* ============================================================ 06 ITERATION 2 */}
        <Slide n={6}>
          <SlideTitle
            n={6}
            section="Asset iteration 2"
            title="From a fused shell to parts that move."
            lead={
              <>
                <span className="font-mono text-[13.5px] text-ink">partSplit</span> segmented the G1 mesh into 4 parts with the
                same {LX.espressoParts.triangles?.toLocaleString("en-US")} triangles.{" "}
                <span className="font-mono text-[13.5px] text-ink">articulationAnimation</span> turned one sentence into a URDF
                with exactly the two joints it asked for.
              </>
            }
          />
          <div className="grid min-h-0 flex-1 grid-cols-12 gap-6">
            <Figure
              className="col-span-3"
              src="/landing/lux3d/g1.jpg"
              alt="Unsplit G1 espresso machine"
              caption="Before · one fused mesh"
            />
            <Figure
              className="col-span-4"
              src="/landing/lux3d/parts.jpg"
              alt="The part-split result, exploded"
              caption={<>partSplit · 4 parts · task {LX.espressoParts.taskId} · {LX.espressoParts.seconds} s</>}
            />
            <Figure
              className="col-span-5"
              src="/landing/lux3d/artic-open.jpg"
              alt="The articulated result with the hood open and the drawer out"
              caption={<>articulationAnimation · URDF · task {LX.espressoArticulated.taskId} · {LX.espressoArticulated.seconds} s</>}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-10">
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-line-strong">
                  <th className="label pb-1.5 font-medium">Part</th>
                  <th className="label pb-1.5 font-medium">Our reading</th>
                  <th className="label pb-1.5 text-right font-medium">Tris</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ESPRESSO_PARTS.map((p) => (
                  <tr key={p.material}>
                    <td className="py-1.5 font-mono text-[11.5px] text-ink-3">{p.material}</td>
                    <td className="py-1.5 text-ink">{p.reading}</td>
                    <td className="py-1.5 text-right font-mono text-[11.5px] text-ink-2 tabular">{p.triangles.toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-line-strong">
                  <th className="label pb-1.5 font-medium">URDF joint</th>
                  <th className="label pb-1.5 font-medium">Type</th>
                  <th className="label pb-1.5 font-medium">Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ESPRESSO_JOINTS.map((j) => (
                  <tr key={j.name}>
                    <td className="py-1.5 font-mono text-[11.5px] text-ink">{j.child}</td>
                    <td className="py-1.5 font-mono text-[11.5px] text-ink-2">{j.type}</td>
                    <td className="py-1.5 font-mono text-[11.5px] text-ink-2">{j.limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Slide>

        {/* ============================================================ 07 ITERATION 3 */}
        <Slide n={7}>
          <SlideTitle
            n={7}
            section="Asset iteration 3"
            title="A character that failed, then walked."
            lead={
              <>
                The first character was refused by the auto-rig. Regenerated in a strict T-pose it rigged in {LX.characterRigged.seconds} s,
                and one retarget job mapped five official clips onto its {LX.characterRigged.joints}-joint skeleton.
              </>
            }
          />
          <div className="grid min-h-0 flex-1 grid-cols-12 gap-8">
            <div className="col-span-7 grid min-h-0 grid-cols-3 gap-4">
              <Figure
                src="/landing/lux3d/char-rejected.jpg"
                alt="First character attempt"
                caption={
                  <>
                    <span className="text-err">Attempt 1</span> · RIG_ELIGIBILITY_FAILED
                  </>
                }
              />
              <Figure
                src="/landing/lux3d/char-rigged.jpg"
                alt="Second character attempt, auto-rigged"
                caption={
                  <>
                    <span className="text-ok">Attempt 2</span> · humanoidAutoRig · {LX.characterRigged.seconds} s
                  </>
                }
              />
              <Figure
                src="/landing/lux3d/char-walk.jpg"
                alt="The rigged character playing the retargeted walk clip"
                caption={<>Retarget · Walk_Loop · task {LX.characterAnimated.taskId}</>}
              />
            </div>
            <div className="col-span-5 flex min-h-0 flex-col">
              <table className="w-full border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-line-strong">
                    <th className="label pb-1.5 font-medium">Retargeted clip</th>
                    <th className="label pb-1.5 font-medium">In GLB</th>
                    <th className="label pb-1.5 text-right font-medium">Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {RETARGET_CLIPS.map((c) => (
                    <tr key={c.id}>
                      <td className="py-1.5 font-mono text-[11.5px] text-ink">{c.id}</td>
                      <td className="py-1.5 font-mono text-[11.5px] text-ink-3">{c.clip}</td>
                      <td className="py-1.5 text-right font-mono text-[11.5px] text-ink-2 tabular">{c.seconds} s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-5 flex items-center gap-2 text-[14px] font-semibold text-ink">
                <Glyph name="spline" size={15} className="text-ink-3" />
                Then the camera
              </div>
              <ol className="mt-2 space-y-1.5 text-[12.5px]">
                {[
                  ["Keyframe", "position, look-at, duration, shot prompt"],
                  ["Playback", "Catmull-Rom flythrough over the live stage"],
                  ["Export", "storyboard JSON → LuxReal create-video"],
                ].map(([a, b], i) => (
                  <li key={a} className="grid grid-cols-[20px_74px_1fr] gap-2">
                    <span className="font-mono text-[11px] text-accent">{i + 1}</span>
                    <span className="text-ink">{a}</span>
                    <span className="text-ink-2">{b}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-auto pt-3 text-[11px] text-ink-3">
                The retarget GLB names its clips animation_1…5; mapped here in the order requested. All {CLIP_TOTAL} official clips are
                selectable in the studio.
              </p>
            </div>
          </div>
        </Slide>

        {/* ============================================================ 08 RUBRIC */}
        <Slide n={8}>
          <SlideTitle
            n={8}
            section="Judging criteria"
            title="How Holorra maps to the rubric."
            lead="Scored 70% by the expert panel and 30% by the community panel."
          />
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-line-strong">
                <th className="label w-[22%] pb-2.5 font-medium">Criterion</th>
                <th className="label w-[9%] pb-2.5 font-medium">Weight</th>
                <th className="label pb-2.5 font-medium">In Holorra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {RUBRIC.map((r) => (
                <tr key={r.criterion} className="align-top">
                  <td className="py-3 pr-4 font-medium text-ink">{r.criterion}</td>
                  <td className="py-3 pr-4 font-mono text-ink tabular">{r.weight}</td>
                  <td className="py-3 leading-relaxed text-ink-2">{r.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-6 border-t border-line pt-4">
            <div className="text-[12.5px]">
              <div className="label mb-1">Prize tracks</div>
              <div className="text-ink-2">
                Special Award / First Prize · Spatial Design · Gaming · Film &amp; TV · Technical Excellence
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[12px] text-ink-2">/studio · /lab · /mcp · #Manycorehackathon</span>
              <Link href="/studio" className="no-print btn btn-primary btn-sm">
                Open the studio
              </Link>
            </div>
          </div>
        </Slide>
      </div>
    </div>
  );
}
