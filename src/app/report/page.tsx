"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LUX3D_HERO_BLUEPRINTS } from "@/config/aholo-presets";
import { HUMANOID_ANIMATION_GROUPS } from "@/config/humanoid-animations";
import { Glyph } from "@/components/brand/Glyph";
import LangSwitch, { useLang } from "@/components/brand/LangSwitch";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { T, tx, type L } from "@/lib/i18n";
import {
  ESPRESSO_JOINTS,
  ESPRESSO_PARTS,
  ESPRESSO_PROMPT,
  LUX3D_RESULTS as LX,
  RETARGET_CLIPS,
} from "@/config/lux3d-results";

const TOTAL = 8;
const CLIP_TOTAL = HUMANOID_ANIMATION_GROUPS.reduce((n, g) => n + g.clips.length, 0);

/* Facts measured from the hosted assets (lod-meta.json, voxel grids), not from config labels.
 * Chinese world names match `titleZh` in src/config/aholo-presets.ts. */
const WORLDS: { title: L; format: L; splats: L; collision: L }[] = [
  {
    title: { en: "Designer Smart Loft", zh: "设计师智能公寓" },
    format: { en: "Direct .spz", zh: "直接加载 .spz" },
    splats: { en: "single file", zh: "单文件" },
    collision: { en: "Voxel walk · 336×112×296 · 5 cm", zh: "体素碰撞行走 · 336×112×296 · 5 cm" },
  },
  {
    title: { en: "Juguo Urban Plaza", zh: "聚果城市广场" },
    format: { en: "Chunk-LOD + .ply sky", zh: "分块 LOD + .ply 天空" },
    splats: { en: "41.8M · 5 levels · 528 chunks", zh: "41.8M · 5 级 · 528 个分块" },
    collision: { en: "Voxel walk · 1392×332×2336 · 20 cm", zh: "体素碰撞行走 · 1392×332×2336 · 20 cm" },
  },
  {
    title: { en: "Grand Transit Concourse", zh: "交通枢纽大厅" },
    format: { en: "Chunk-LOD + .sog env", zh: "分块 LOD + .sog 环境" },
    splats: { en: "32.7M · 5 levels · SH degree 2", zh: "32.7M · 5 级 · SH 2 阶" },
    collision: { en: "Free camera", zh: "自由视角" },
  },
  {
    title: { en: "Object Turntable", zh: "物体转台" },
    format: { en: "Direct .sog", zh: "直接加载 .sog" },
    splats: { en: "single object capture", zh: "单个物体采集" },
    collision: { en: "Free camera", zh: "自由视角" },
  },
  {
    title: { en: "Coffee Bar · SpatialGen (ours)", zh: "咖啡吧 · SpatialGen（我们生成）" },
    format: { en: "Direct .spz, Z-up", zh: "直接加载 .spz，Z 轴向上" },
    splats: { en: "266,895 · 625 s", zh: "266,895 · 625 s" },
    collision: { en: "Fixed floor height", zh: "固定地面高度" },
  },
];

const PIPELINE: { n: string; verb: L; tool: string; calls: (string | L)[]; out: L }[] = [
  {
    n: "01",
    verb: { en: "Generate the world", zh: "生成世界" },
    tool: "Aholo SpatialGen · Aholo Reality",
    calls: ["world.generations.create", "world.reconstructions.create", "world.retrieve · world.list"],
    out: { en: "3DGS world as .spz / .ply, streamed into the stage", zh: "3DGS 世界（.spz / .ply），流式加载到舞台" },
  },
  {
    n: "02",
    verb: { en: "Split the parts", zh: "拆分部件" },
    tool: "Aholo Lux3D",
    calls: ["textTo3d · imgTo3d · imageToFourView", "partSplit.create", "articulationAnimation.create", "materialTransfer · multiFormatExport"],
    out: { en: "PBR mesh with semantic sub-parts and joints", zh: "带语义子部件和关节的 PBR 网格" },
  },
  {
    n: "03",
    verb: { en: "Rig the actors", zh: "绑定角色" },
    tool: "Aholo Lux3D",
    calls: ["humanoidAutoRig.create", "humanoidAnimationRetarget.create"],
    out: {
      en: `Rigged humanoid with up to 10 of ${CLIP_TOTAL} clips per job`,
      zh: `绑骨的人形角色，每个任务最多 10 个动作片段（共 ${CLIP_TOTAL} 个）`,
    },
  },
  {
    n: "04",
    verb: { en: "Direct the scene", zh: "导演场景" },
    tool: "Aholo Viewer · LuxReal",
    calls: [
      { en: "keyframes · Catmull-Rom spline", zh: "关键帧 · Catmull-Rom 样条" },
      { en: "storyboard JSON export", zh: "分镜 JSON 导出" },
      { en: "LuxReal create-video hand-off", zh: "交给 LuxReal create-video" },
    ],
    out: { en: "Camera path, reference frames and shot prompts", zh: "镜头路径、参考帧和镜头提示词" },
  },
];

const RUBRIC: { criterion: L; weight: string; how: L }[] = [
  {
    criterion: { en: "Use of Manycore tools", zh: "Manycore 工具使用" },
    weight: "30%",
    how: {
      en: "The stage runs on @manycore/aholo-viewer (direct splats, chunk-LOD, GLTF skinning). Server routes under /api/aholo call the official World, Lux3D and Asset clients: all 10 Lux3D methods plus SpatialGen and Reality. Eleven live jobs ran through those routes: ten Lux3D (textTo3d ×3, partSplit, articulationAnimation, humanoidAutoRig ×2, humanoidAnimationRetarget ×2) and one SpatialGen world, now world 05 in the studio; every Lux3D result is inspectable on /lab. @manycore/aholo-sdk-mcp is pre-wired for agents.",
      zh: "舞台基于 @manycore/aholo-viewer 运行（直接加载高斯点、分块 LOD、GLTF 蒙皮）。/api/aholo 下的服务端路由调用官方 World、Lux3D 和 Asset 客户端，覆盖全部 10 个 Lux3D 方法以及 SpatialGen 和 Reality。经这些路由实际运行了 11 个任务：10 个 Lux3D 任务（textTo3d ×3、partSplit、articulationAnimation、humanoidAutoRig ×2、humanoidAnimationRetarget ×2）和 1 个 SpatialGen 世界，即创作台中的世界 05；每个 Lux3D 结果都可在 /lab 查看。@manycore/aholo-sdk-mcp 已为智能体预先配置好。",
    },
  },
  {
    criterion: { en: "Fun and engagement", zh: "趣味性与参与感" },
    weight: "25%",
    how: {
      en: "Press Play for a one-minute scene quest: walk the Lux3D actor to the articulated espresso machine, brew (the URDF joints open in a camera close-up), frame the shot, celebrate. Text to 3D results drop into the world when ready, phones get a joystick, and Expand gives the render the full screen. Opens with no generation wait.",
      zh: "进入游玩模式即开始一分钟的场景任务：操控 Lux3D 角色走到关节化的意式咖啡机前冲咖啡（镜头特写下 URDF 关节逐一打开），构图取景，然后庆祝。文生 3D 结果完成后会投放到场景中，手机端提供虚拟摇杆，展开后渲染画面占满全屏。打开即玩，无需等待生成。",
    },
  },
  {
    criterion: { en: "Innovation", zh: "创新性" },
    weight: "20%",
    how: {
      en: "Radiance-field worlds and part-split, articulated, rigged meshes share one stage, with a camera director that hands shots to LuxReal and an MCP co-director that plans tool calls from plain language.",
      zh: "辐射场世界与经过部件拆分、关节化和绑骨的网格同处一个舞台；镜头导演把镜头交给 LuxReal，MCP AI 副导演则根据自然语言规划工具调用。",
    },
  },
  {
    criterion: { en: "Completeness", zh: "完成度" },
    weight: "20%",
    how: {
      en: "Studio, landing page, Lux3D bench, MCP hub, a 13-page /docs section and this report ship in one Next.js app, with bring-your-own-key support (x-aholo-api-key, COM / CN regions) and five export formats.",
      zh: "创作台、首页、Lux3D 测试台、MCP 中心、13 页的 /docs 文档和本报告都集成在同一个 Next.js 应用中，支持自带 API 密钥（x-aholo-api-key，COM / CN 区域）和 5 种导出格式。",
    },
  },
  {
    criterion: { en: "Reach", zh: "传播度" },
    weight: "5%",
    how: {
      en: "Copyable .mcp.json for Claude Code and Cursor, a share-ready landing page, and the #Manycorehackathon tag on every page.",
      zh: "可直接复制的 .mcp.json（适用于 Claude Code 和 Cursor）、便于分享的首页，且每个页面都带有 #Manycorehackathon 标签。",
    },
  },
];

/* Lux3D returns the parts unnamed; `reading` in lux3d-results.ts is our English description. */
const PART_READING_ZH: Record<string, string> = {
  part_0: "主体",
  part_1: "侧面旋钮",
  part_2: "顶部",
  part_3: "外壳",
};

/* ---------------------------------------------------------------- slide chrome */

function Slide({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <section className="report-slide relative mx-auto flex w-full min-w-[1040px] max-w-[1280px] flex-col overflow-hidden rounded-lg border border-line bg-surface px-14 pb-8 pt-6 aspect-[16/9]">
      <header className="flex items-center justify-between border-b border-line pb-3">
        <span className="flex items-center gap-2">
          <LogoMark size={15} />
          <span className="label">
            <T en="Holorra · Project report" zh="Holorra · 项目报告" />
          </span>
        </span>
        <span className="font-mono text-[11px] text-ink-3 tabular">
          {String(n).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col pt-7">{children}</div>
    </section>
  );
}

function SlideTitle({ n, section, title, lead }: { n: number; section: React.ReactNode; title: React.ReactNode; lead?: React.ReactNode }) {
  return (
    <div className="mb-7 max-w-4xl">
      <div className="label">
        <span className="text-accent">{String(n).padStart(2, "0")}</span>
        <T en=" — " zh=" · " />
        {section}
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
  const lang = useLang();

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
          <Link href="/" aria-label={tx(lang, { en: "Holorra home", zh: "Holorra 首页" })}>
            <Logo size={20} />
          </Link>
          <span className="hidden h-4 w-px bg-line sm:block" />
          <Link href="/studio" className="btn btn-ghost btn-sm">
            <Glyph name="back" size={14} />
            <span className="max-[600px]:hidden">
              <T en="Back to studio" zh="返回创作台" />
            </span>
            <span className="min-[601px]:hidden">
              <T en="Studio" zh="创作台" />
            </span>
          </Link>
          <span className="ml-auto hidden text-[12px] text-ink-3 md:block">
            <T en="Project report · 8 slides · prints one slide per page" zh="项目报告 · 共 8 页 · 打印时每页一张" />
          </span>
          <Link href="/mcp" className="btn btn-sm hide-mobile">
            <Glyph name="plug" size={14} />
            <T en="MCP hub" zh="MCP 中心" />
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-primary btn-sm"
            aria-label={tx(lang, { en: "Export PDF", zh: "导出 PDF" })}
          >
            <Glyph name="print" size={14} />
            {/* icon-only on narrow phones so the language switch still fits */}
            <span className="max-[480px]:hidden">
              <T en="Export PDF" zh="导出 PDF" />
            </span>
          </button>
          <LangSwitch size="sm" className="no-print" />
        </div>
      </div>

      <div ref={deckRef} className="report-deck mx-auto flex max-w-[1312px] flex-col gap-8 overflow-x-auto px-4 py-8 max-[900px]:gap-4 max-[900px]:py-4">
        {/* ============================================================ 01 COVER */}
        <Slide n={1}>
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-10 grid-cols-12">
            <div className="flex flex-col col-span-5">
              <div className="label">
                <T en="Manycore Aholo Global 3D AI Hackathon" zh="Manycore Aholo 全球 3D AI 黑客松" />
              </div>
              <h1 className="mt-5 font-serif text-[88px] leading-[0.92] tracking-[-0.02em] text-ink">Holorra</h1>
              <p className="mt-3 font-serif text-[30px] italic leading-[1.1] text-ink-2">
                <T
                  en="A directing stage for generated 3D worlds."
                  zh={<span className="not-italic">为生成式 3D 世界打造的导演舞台。</span>}
                />
              </p>
              <p className="mt-6 text-[15px] leading-relaxed text-ink-2">
                <T
                  en={
                    <>
                      Holorra places generated assets inside walkable 3D Gaussian Splatting worlds, takes them apart into
                      semantic parts, rigs characters to move through the space, and records camera paths for AI video.
                      Every stage runs on the Manycore Aholo SDKs.
                    </>
                  }
                  zh="Holorra 把生成的资产放进可行走的 3D 高斯泼溅世界，按语义拆分为部件，为角色绑骨，让它们在空间中走动，并录制用于 AI 视频的镜头路径。每个环节都运行在 Manycore Aholo SDK 之上。"
                />
              </p>
              <dl className="mt-auto grid grid-cols-[96px_1fr] gap-x-4 gap-y-2.5 border-t border-line pt-5 text-[12.5px]">
                <dt className="label pt-0.5">
                  <T en="Tagline" zh="标语" />
                </dt>
                <dd className="text-ink">
                  <T
                    en="Generate the world. Split the parts. Rig the actors. Direct the scene."
                    zh="生成世界。拆分部件。绑定角色。导演场景。"
                  />
                </dd>
                <dt className="label pt-0.5">
                  <T en="Built on" zh="技术栈" />
                </dt>
                <dd className="font-mono text-[11.5px] leading-relaxed text-ink-2">
                  aholo-viewer 1.14.0 · sdk-world 1.5.0 · sdk-lux3d 1.10.0 · sdk-asset 1.4.0 · sdk-mcp 1.10.0
                </dd>
                <dt className="label pt-0.5">
                  <T en="Date" zh="日期" />
                </dt>
                <dd className="text-ink-2">
                  <T en="November 2026" zh="2026 年 11 月" />
                </dd>
              </dl>
            </div>
            <Figure
              className="col-span-7"
              src="/landing/world-loft.jpg"
              alt={tx(lang, {
                en: "Indoor loft interior rendered as 3D Gaussian splats",
                zh: "以 3D 高斯点渲染的室内公寓",
              })}
              caption={
                <T
                  en={
                    <>
                      <span className="text-ink-2">Fig. 1</span> — Designer Smart Loft, a Gaussian Splatting interior streamed
                      from Manycore&apos;s CDN and rendered live in @manycore/aholo-viewer.
                    </>
                  }
                  zh={
                    <>
                      <span className="text-ink-2">图 1</span> · 设计师智能公寓：从 Manycore CDN 流式加载的高斯泼溅室内场景，在
                      @manycore/aholo-viewer 中实时渲染。
                    </>
                  }
                />
              }
            />
          </div>
        </Slide>

        {/* ============================================================ 02 PROBLEM */}
        <Slide n={2}>
          <SlideTitle
            n={2}
            section={<T en="Problem" zh="问题" />}
            title={<T en="Generated 3D usually stops at a statue in an empty room." zh="生成式 3D 往往止步于空房间里的一尊雕像。" />}
            lead={
              <T
                en="Text-to-3D returns a mesh. It floats in a grey void, it is fused into one shell, it cannot move, and there is no way to film it. Holorra treats the generated asset as the start of a scene."
                zh="文生 3D 只返回一个网格：它悬浮在灰色虚空里，熔成一整块外壳，不能动，也没法拍。Holorra 把生成的资产当作一个场景的起点。"
              />
            }
          />
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-line-strong">
                <th className="label w-[16%] pb-2.5 font-medium">
                  <T en="Gap" zh="缺口" />
                </th>
                <th className="label w-[38%] pb-2.5 font-medium">
                  <T en="Typical text-to-3D output" zh="常见的文生 3D 输出" />
                </th>
                <th className="label pb-2.5 font-medium">
                  <T en="In Holorra" zh="在 Holorra 中" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(
                [
                  [
                    { en: "Place", zh: "空间" },
                    { en: "A lone .glb on a grey grid, with no room, street or light.", zh: "灰色网格上孤零零的一个 .glb，没有房间、街道，也没有灯光。" },
                    {
                      en: "Inside a walkable 3DGS world from SpatialGen or Reality, with voxel collision on floors and walls.",
                      zh: "置于 SpatialGen 或 Reality 生成的可行走 3DGS 世界中，地面和墙面带体素碰撞。",
                    },
                  ],
                  [
                    { en: "Parts", zh: "部件" },
                    { en: "One fused shell. Doors do not open and nothing separates for printing.", zh: "一整块熔合的外壳。门打不开，也无法拆件打印。" },
                    {
                      en: "Semantic sub-meshes from lux3d.partSplit that can be exploded, isolated and recolored.",
                      zh: "lux3d.partSplit 输出语义子网格，可做爆炸视图、单独显示和改色。",
                    },
                  ],
                  [
                    { en: "Motion", zh: "运动" },
                    { en: "Static props; characters locked in a T-pose.", zh: "道具静止不动，角色定格在 T-pose。" },
                    {
                      en: "Joints from a sentence via articulationAnimation; humanoidAutoRig plus " + CLIP_TOTAL + " retargetable clips.",
                      zh: `一句话经 articulationAnimation 生成关节；humanoidAutoRig 自动绑骨，另有 ${CLIP_TOTAL} 个可重定向的动作片段。`,
                    },
                  ],
                  [
                    { en: "Camera", zh: "镜头" },
                    { en: "A turntable at best.", zh: "最多是一个转台展示。" },
                    {
                      en: "Keyframed camera paths with shot prompts, exported as a LuxReal storyboard.",
                      zh: "带镜头提示词的关键帧镜头路径，导出为 LuxReal 分镜。",
                    },
                  ],
                ] as [L, L, L][]
              ).map(([gap, typical, holorra]) => (
                <tr key={gap.en} className="align-top">
                  <td className="py-3.5 pr-4 font-medium text-ink">
                    <T en={gap.en} zh={gap.zh} />
                  </td>
                  <td className="py-3.5 pr-6 text-ink-3">
                    <T en={typical.en} zh={typical.zh} />
                  </td>
                  <td className="py-3.5 text-ink">
                    <T en={holorra.en} zh={holorra.zh} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-auto grid grid-cols-1 items-end gap-8 border-t border-line pt-6 grid-cols-12">
            <p className="font-serif text-[30px] italic leading-[1.15] text-ink col-span-8">
              <T
                en="A generated asset should be the start of a scene, not the end of a pipeline."
                zh={<span className="not-italic">生成的资产应当是场景的起点，而不是流水线的终点。</span>}
              />
            </p>
            <p className="text-[12.5px] leading-relaxed text-ink-3 col-span-4">
              <T
                en={
                  <>
                    Holorra chains SpatialGen or Reality, Lux3D and the Aholo Viewer so the same asset can be placed, opened
                    up, animated and filmed without leaving the browser.
                  </>
                }
                zh="Holorra 串联 SpatialGen 或 Reality、Lux3D 与 Aholo Viewer，同一个资产无需离开浏览器，就能完成摆放、拆解、动画和拍摄。"
              />
            </p>
          </div>
        </Slide>

        {/* ============================================================ 03 ARCHITECTURE */}
        <Slide n={3}>
          <SlideTitle
            n={3}
            section={<T en="Architecture" zh="架构" />}
            title={<T en="One stage, four verbs, the full Aholo stack." zh="一个舞台，四个动作，完整的 Aholo 技术栈。" />}
            lead={
              <T
                en="Each step maps to official SDK calls and hands its output to the next step on the same WebGL2 stage."
                zh="每一步都对应官方 SDK 调用，并在同一个 WebGL2 舞台上把产出交给下一步。"
              />
            }
          />
          <div className="grid grid-cols-1 border-y border-line grid-cols-4 divide-x divide-line">
            {PIPELINE.map((p) => (
              <div key={p.n} className="flex flex-col py-4 px-5 first:pl-0 last:pr-0">
                <div className="font-mono text-[12px] text-accent">{p.n}</div>
                <div className="mt-1 text-[16px] font-semibold text-ink">
                  <T en={p.verb.en} zh={p.verb.zh} />
                </div>
                <div className="mt-0.5 text-[12.5px] text-ink-3">{p.tool}</div>
                <ul className="mt-3 space-y-1 font-mono text-[11.5px] text-ink-2">
                  {p.calls.map((c) => (
                    <li key={typeof c === "string" ? c : c.en}>{typeof c === "string" ? c : <T en={c.en} zh={c.zh} />}</li>
                  ))}
                </ul>
                <div className="mt-auto pt-4 text-[12.5px] text-ink-2">
                  <span className="text-ink-3">
                    <T en="Output · " zh="产出 · " />
                  </span>
                  <T en={p.out.en} zh={p.out.zh} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 text-[12.5px] grid-cols-3">
            {(
              [
                [
                  { en: "Client", zh: "客户端" },
                  {
                    en: "Next.js App Router. @manycore/aholo-viewer is loaded client-only and runs splat decoding and sorting in Web Workers.",
                    zh: "Next.js App Router。@manycore/aholo-viewer 仅在客户端加载，高斯点的解码与排序在 Web Worker 中运行。",
                  },
                ],
                [
                  { en: "Server", zh: "服务端" },
                  {
                    en: "/api/aholo/world, lux3d, tasks, director, status. Each wraps the official SDK client; the key comes from AHOLO_API_KEY or the x-aholo-api-key header.",
                    zh: "/api/aholo/world、lux3d、tasks、director、status。每个路由都封装官方 SDK 客户端；密钥来自 AHOLO_API_KEY 或 x-aholo-api-key 请求头。",
                  },
                ],
                [
                  { en: "Agent", zh: "智能体" },
                  {
                    en: "@manycore/aholo-sdk-mcp in .mcp.json for Claude Code and Cursor, plus an in-app co-director that turns a brief into an ordered tool plan.",
                    zh: "在 .mcp.json 中为 Claude Code 和 Cursor 配置 @manycore/aholo-sdk-mcp；应用内另有 AI 副导演，把一段需求转成有序的工具调用计划。",
                  },
                ],
              ] as [L, L][]
            ).map(([k, v]) => (
              <div key={k.en}>
                <div className="label mb-1">
                  <T en={k.en} zh={k.zh} />
                </div>
                <p className="leading-relaxed text-ink-2">
                  <T en={v.en} zh={v.zh} />
                </p>
              </div>
            ))}
          </div>
        </Slide>

        {/* ============================================================ 04 STAGE */}
        <Slide n={4}>
          <SlideTitle
            n={4}
            section={<T en="The stage" zh="舞台" />}
            title={<T en="Five worlds, playable without waiting. One we generated." zh="五个世界，打开即玩。其中一个由我们生成。" />}
            lead={
              <T
                en="Live jobs take minutes, so the studio opens on four Gaussian Splatting scenes hosted on Manycore's CDN. The fifth came from one SpatialGen prompt through Holorra's own route."
                zh="实时任务需要几分钟，所以创作台一打开就是托管在 Manycore CDN 上的四个高斯泼溅场景。第五个由一条 SpatialGen 提示词经 Holorra 自己的路由生成。"
              />
            }
          />
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 grid-cols-12">
            <div className="grid min-h-0 grid-rows-2 gap-4 col-span-4">
              <Figure
                src="/landing/world-concourse.jpg"
                alt={tx(lang, {
                  en: "Rail yard and market stalls rendered as Gaussian splats",
                  zh: "以高斯点渲染的铁路站场与集市摊位",
                })}
                caption={
                  <T
                    en={<><span className="text-ink-2">Fig. 2</span> — Grand Transit Concourse, chunk-LOD stream.</>}
                    zh={<><span className="text-ink-2">图 2</span> · 交通枢纽大厅，分块 LOD 流式加载。</>}
                  />
                }
              />
              <Figure
                src="/landing/world-cafe.jpg"
                alt={tx(lang, {
                  en: "The SpatialGen coffee bar with the Lux3D actor and espresso machine",
                  zh: "SpatialGen 生成的咖啡吧，内有 Lux3D 角色和意式咖啡机",
                })}
                caption={
                  <T
                    en={<><span className="text-ink-2">Fig. 3</span> — Coffee bar, generated with SpatialGen (world 3FO4K4V99KMD).</>}
                    zh={<><span className="text-ink-2">图 3</span> · 咖啡吧，由 SpatialGen 生成（世界 3FO4K4V99KMD）。</>}
                  />
                }
              />
            </div>
            <div className="col-span-8">
              <table className="w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line-strong">
                    <th className="label pb-2.5 font-medium">
                      <T en="World" zh="世界" />
                    </th>
                    <th className="label pb-2.5 font-medium">
                      <T en="Format" zh="格式" />
                    </th>
                    <th className="label pb-2.5 font-medium">
                      <T en="Splats" zh="高斯点" />
                    </th>
                    <th className="label pb-2.5 font-medium">
                      <T en="Navigation" zh="漫游方式" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {WORLDS.map((w) => (
                    <tr key={w.title.en} className="align-top">
                      <td className="py-3 pr-3 font-medium text-ink">
                        <T en={w.title.en} zh={w.title.zh} />
                      </td>
                      <td className="py-3 pr-3 font-mono text-[11.5px] text-ink-2">
                        <T en={w.format.en} zh={w.format.zh} />
                      </td>
                      <td className="py-3 pr-3 font-mono text-[11.5px] text-ink-2 tabular">
                        <T en={w.splats.en} zh={w.splats.zh} />
                      </td>
                      <td className="py-3 font-mono text-[11.5px] text-ink-2 tabular">
                        <T en={w.collision.en} zh={w.collision.zh} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-[12px] leading-relaxed text-ink-3">
                <T
                  en={
                    <>
                      Splat totals and grid sizes are read from each world&apos;s lod-meta.json and voxel metadata. Chunk-LOD
                      worlds stream by camera distance under a fixed on-screen splat budget.
                    </>
                  }
                  zh="高斯点总数和网格尺寸读取自各世界的 lod-meta.json 与体素元数据。分块 LOD 世界按相机距离流式加载，屏幕上的高斯点数量控制在固定预算内。"
                />
              </p>
            </div>
          </div>
        </Slide>

        {/* ============================================================ 05 ITERATION 1 */}
        <Slide n={5}>
          <SlideTitle
            n={5}
            section={<T en="Asset iteration 1" zh="资产迭代 1" />}
            title={<T en="Same prompt, two engines." zh="同一提示词，两个引擎。" />}
            lead={
              <T
                en={
                  <>
                    Both meshes came from one text prompt through Holorra&apos;s own route. G1-Turbo returned a usable draft in{" "}
                    {LX.espressoTurbo.seconds} s; G1 took {LX.espressoG1.seconds} s and embedded a full PBR texture set. The studio drafts with
                    Turbo and spends G1 only on the hero asset.
                  </>
                }
                zh={
                  <>
                    两个网格都由同一条文本提示词经 Holorra 自己的路由生成。G1-Turbo 用 {LX.espressoTurbo.seconds} s 返回可用的草稿；G1
                    用时 {LX.espressoG1.seconds} s，并内嵌整套 PBR 贴图。创作台先用 Turbo 打草稿，只为主角资产动用 G1。
                  </>
                }
              />
            }
          />
          <div className="grid min-h-0 flex-1 grid-cols-12 gap-8">
            <Figure
              className="col-span-4"
              src="/landing/lux3d/turbo.jpg"
              alt={tx(lang, { en: "Espresso machine generated with Lux3D G1-Turbo", zh: "Lux3D G1-Turbo 生成的意式咖啡机" })}
              caption={<T en={<>G1-Turbo · task {LX.espressoTurbo.taskId}</>} zh={<>G1-Turbo · 任务 {LX.espressoTurbo.taskId}</>} />}
            />
            <Figure
              className="col-span-4"
              src="/landing/lux3d/g1.jpg"
              alt={tx(lang, { en: "Espresso machine generated with Lux3D G1", zh: "Lux3D G1 生成的意式咖啡机" })}
              caption={<T en={<>G1 · task {LX.espressoG1.taskId}</>} zh={<>G1 · 任务 {LX.espressoG1.taskId}</>} />}
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
                  {(
                    [
                      [{ en: "Wall clock", zh: "实测耗时" }, `${LX.espressoTurbo.seconds} s`, `${LX.espressoG1.seconds} s`],
                      [{ en: "Triangles", zh: "三角面数" }, LX.espressoTurbo.triangles?.toLocaleString("en-US"), LX.espressoG1.triangles?.toLocaleString("en-US")],
                      [{ en: "Texture maps", zh: "贴图数" }, String(LX.espressoTurbo.textureMaps), `${LX.espressoG1.textureMaps} (PBR)`],
                      [{ en: "GLB size", zh: "GLB 大小" }, `${LX.espressoTurbo.sizeMB} MB`, `${LX.espressoG1.sizeMB} MB`],
                      [
                        { en: "Role", zh: "用途" },
                        <T key="a" en="draft, placement" zh="草稿、摆放" />,
                        <T key="b" en="hero, partSplit input" zh="主角资产、partSplit 输入" />,
                      ],
                    ] as [L, React.ReactNode, React.ReactNode][]
                  ).map(([k, a, b]) => (
                    <tr key={k.en}>
                      <td className="py-2.5 pr-3 font-sans text-[12.5px] text-ink-3">
                        <T en={k.en} zh={k.zh} />
                      </td>
                      <td className="py-2.5 pr-3 text-ink-2">{a}</td>
                      <td className="py-2.5 text-ink">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <blockquote className="mt-5 border-l-2 border-accent pl-3 text-[12.5px] leading-relaxed text-ink-2">
                <span className="label mb-1 block">
                  <T en="Prompt (both engines)" zh="提示词（两个引擎共用）" />
                </span>
                &ldquo;{ESPRESSO_PROMPT}&rdquo;
              </blockquote>
              <p className="mt-auto pt-3 text-[11px] text-ink-3">
                <T
                  en="Times are submit-to-success as seen by a 15 s poller. Geometry read from the returned GLBs."
                  zh="耗时为从提交到成功的时间，由 15 s 间隔的轮询记录。几何数据读取自返回的 GLB。"
                />
              </p>
            </div>
          </div>
        </Slide>

        {/* ============================================================ 06 ITERATION 2 */}
        <Slide n={6}>
          <SlideTitle
            n={6}
            section={<T en="Asset iteration 2" zh="资产迭代 2" />}
            title={<T en="From a fused shell to parts that move." zh="从一整块外壳，到能动的部件。" />}
            lead={
              <T
                en={
                  <>
                    <span className="font-mono text-[13.5px] text-ink">partSplit</span> segmented the G1 mesh into 4 parts with the
                    same {LX.espressoParts.triangles?.toLocaleString("en-US")} triangles.{" "}
                    <span className="font-mono text-[13.5px] text-ink">articulationAnimation</span> turned one sentence into a URDF
                    with exactly the two joints it asked for.
                  </>
                }
                zh={
                  <>
                    <span className="font-mono text-[13.5px] text-ink">partSplit</span> 将 G1 网格拆成 4 个部件，三角面数不变，仍为{" "}
                    {LX.espressoParts.triangles?.toLocaleString("en-US")}。
                    <span className="font-mono text-[13.5px] text-ink">articulationAnimation</span> 把一句话变成
                    URDF，恰好生成句中要求的两个关节。
                  </>
                }
              />
            }
          />
          <div className="grid min-h-0 flex-1 grid-cols-12 gap-6">
            <Figure
              className="col-span-3"
              src="/landing/lux3d/g1.jpg"
              alt={tx(lang, { en: "Unsplit G1 espresso machine", zh: "未拆分的 G1 意式咖啡机" })}
              caption={<T en="Before · one fused mesh" zh="拆分前 · 一整块网格" />}
            />
            <Figure
              className="col-span-4"
              src="/landing/lux3d/parts.jpg"
              alt={tx(lang, { en: "The part-split result, exploded", zh: "部件拆分结果（爆炸视图）" })}
              caption={
                <T
                  en={<>partSplit · 4 parts · task {LX.espressoParts.taskId} · {LX.espressoParts.seconds} s</>}
                  zh={<>partSplit · 4 个部件 · 任务 {LX.espressoParts.taskId} · {LX.espressoParts.seconds} s</>}
                />
              }
            />
            <Figure
              className="col-span-5"
              src="/landing/lux3d/artic-open.jpg"
              alt={tx(lang, {
                en: "The articulated result with the hood open and the drawer out",
                zh: "关节化结果：顶盖打开，抽屉拉出",
              })}
              caption={
                <T
                  en={<>articulationAnimation · URDF · task {LX.espressoArticulated.taskId} · {LX.espressoArticulated.seconds} s</>}
                  zh={<>articulationAnimation · URDF · 任务 {LX.espressoArticulated.taskId} · {LX.espressoArticulated.seconds} s</>}
                />
              }
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-10">
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-line-strong">
                  <th className="label pb-1.5 font-medium">
                    <T en="Part" zh="部件" />
                  </th>
                  <th className="label pb-1.5 font-medium">
                    <T en="Our reading" zh="我们的解读" />
                  </th>
                  <th className="label pb-1.5 text-right font-medium">
                    <T en="Tris" zh="三角面" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ESPRESSO_PARTS.map((p) => (
                  <tr key={p.material}>
                    <td className="py-1.5 font-mono text-[11.5px] text-ink-3">{p.material}</td>
                    <td className="py-1.5 text-ink">
                      <T en={p.reading} zh={PART_READING_ZH[p.material] ?? p.reading} />
                    </td>
                    <td className="py-1.5 text-right font-mono text-[11.5px] text-ink-2 tabular">{p.triangles.toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-line-strong">
                  <th className="label pb-1.5 font-medium">
                    <T en="URDF joint" zh="URDF 关节" />
                  </th>
                  <th className="label pb-1.5 font-medium">
                    <T en="Type" zh="类型" />
                  </th>
                  <th className="label pb-1.5 font-medium">
                    <T en="Range" zh="范围" />
                  </th>
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
            section={<T en="Asset iteration 3" zh="资产迭代 3" />}
            title={<T en="A character that failed, then walked." zh="一个先失败、再走起来的角色。" />}
            lead={
              <T
                en={
                  <>
                    The first character was refused by the auto-rig. Regenerated in a strict T-pose it rigged in {LX.characterRigged.seconds} s,
                    and one retarget job mapped eight official clips onto its {LX.characterRigged.joints}-joint skeleton.
                  </>
                }
                zh={
                  <>
                    第一个角色被自动绑骨拒绝。改用严格 T-pose 重新生成后，{LX.characterRigged.seconds} s
                    即完成绑骨；一次动画重定向任务就把 8 个官方动作片段映射到它含 {LX.characterRigged.joints} 个关节的骨架上。
                  </>
                }
              />
            }
          />
          <div className="grid min-h-0 flex-1 grid-cols-12 gap-8">
            <div className="col-span-7 grid min-h-0 grid-cols-3 gap-4">
              <Figure
                src="/landing/lux3d/char-rejected.jpg"
                alt={tx(lang, { en: "First character attempt", zh: "第一次生成的角色" })}
                caption={
                  <>
                    <span className="text-err">
                      <T en="Attempt 1" zh="第 1 次" />
                    </span>{" "}
                    · RIG_ELIGIBILITY_FAILED
                  </>
                }
              />
              <Figure
                src="/landing/lux3d/char-rigged.jpg"
                alt={tx(lang, { en: "Second character attempt, auto-rigged", zh: "第二次生成的角色，已自动绑骨" })}
                caption={
                  <>
                    <span className="text-ok">
                      <T en="Attempt 2" zh="第 2 次" />
                    </span>{" "}
                    · humanoidAutoRig · {LX.characterRigged.seconds} s
                  </>
                }
              />
              <Figure
                src="/landing/lux3d/char-walk.jpg"
                alt={tx(lang, {
                  en: "The rigged character playing the retargeted walk clip",
                  zh: "绑骨后的角色播放重定向的行走动作片段",
                })}
                caption={
                  <T
                    en={<>Retarget · Walk_Loop · task {LX.characterAnimated.taskId}</>}
                    zh={<>动画重定向 · Walk_Loop · 任务 {LX.characterAnimated.taskId}</>}
                  />
                }
              />
            </div>
            <div className="col-span-5 flex min-h-0 flex-col">
              <table className="w-full border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-line-strong">
                    <th className="label pb-1.5 font-medium">
                      <T en="Retargeted clip" zh="重定向动作片段" />
                    </th>
                    <th className="label pb-1.5 font-medium">
                      <T en="In GLB" zh="GLB 内名称" />
                    </th>
                    <th className="label pb-1.5 text-right font-medium">
                      <T en="Length" zh="时长" />
                    </th>
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
                <T en="Then the camera" zh="接下来是镜头" />
              </div>
              <ol className="mt-2 space-y-1.5 text-[12.5px]">
                {(
                  [
                    [
                      { en: "Keyframe", zh: "关键帧" },
                      { en: "position, look-at, duration, shot prompt", zh: "位置、注视点、时长、镜头提示词" },
                    ],
                    [
                      { en: "Playback", zh: "回放" },
                      { en: "Catmull-Rom flythrough over the live stage", zh: "在实时舞台上做 Catmull-Rom 飞行漫游" },
                    ],
                    [
                      { en: "Export", zh: "导出" },
                      { en: "storyboard JSON → LuxReal create-video", zh: "分镜 JSON → LuxReal create-video" },
                    ],
                  ] as [L, L][]
                ).map(([a, b], i) => (
                  <li key={a.en} className="grid grid-cols-[20px_74px_1fr] gap-2">
                    <span className="font-mono text-[11px] text-accent">{i + 1}</span>
                    <span className="text-ink">
                      <T en={a.en} zh={a.zh} />
                    </span>
                    <span className="text-ink-2">
                      <T en={b.en} zh={b.zh} />
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-auto pt-3 text-[11px] text-ink-3">
                <T
                  en={
                    <>
                      The retarget GLB names its clips animation_1…8; mapped here in the order requested. All {CLIP_TOTAL} official clips are
                      selectable in the studio.
                    </>
                  }
                  zh={
                    <>
                      重定向 GLB 把动作片段命名为 animation_1…8，此处按请求顺序对应。全部 {CLIP_TOTAL} 个官方动作片段都可在创作台中选用。
                    </>
                  }
                />
              </p>
            </div>
          </div>
        </Slide>

        {/* ============================================================ 08 RUBRIC */}
        <Slide n={8}>
          <SlideTitle
            n={8}
            section={<T en="Judging criteria" zh="评审标准" />}
            title={<T en="How Holorra maps to the rubric." zh="Holorra 如何对应评分细则。" />}
            lead={
              <T
                en="Scored 70% by the expert panel and 30% by the community panel."
                zh="评分构成：专家评审占 70%，社区评审占 30%。"
              />
            }
          />
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-line-strong">
                <th className="label w-[22%] pb-2.5 font-medium">
                  <T en="Criterion" zh="评分项" />
                </th>
                <th className="label w-[9%] pb-2.5 font-medium">
                  <T en="Weight" zh="权重" />
                </th>
                <th className="label pb-2.5 font-medium">
                  <T en="In Holorra" zh="在 Holorra 中" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {RUBRIC.map((r) => (
                <tr key={r.criterion.en} className="align-top">
                  <td className="py-3 pr-4 font-medium text-ink">
                    <T en={r.criterion.en} zh={r.criterion.zh} />
                  </td>
                  <td className="py-3 pr-4 font-mono text-ink tabular">{r.weight}</td>
                  <td className="py-3 leading-relaxed text-ink-2">
                    <T en={r.how.en} zh={r.how.zh} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-6 border-t border-line pt-4">
            <div className="text-[12.5px]">
              <div className="label mb-1">
                <T en="Prize tracks" zh="奖项赛道" />
              </div>
              <div className="text-ink-2">
                <T
                  en={<>Special Award / First Prize · Spatial Design · Gaming · Film &amp; TV · Technical Excellence</>}
                  zh="特别奖 / 一等奖 · 空间设计 · 游戏 · 影视 · 技术卓越"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[12px] text-ink-2">holorra.xyz · /studio?play=1 · /lab · /docs · #Manycorehackathon</span>
              <Link href="/studio" className="no-print btn btn-primary btn-sm">
                <T en="Open the studio" zh="打开创作台" />
              </Link>
            </div>
          </div>
        </Slide>
      </div>
    </div>
  );
}
