import Link from "next/link";
import { Glyph, type GlyphName } from "@/components/brand/Glyph";
import { Logo } from "@/components/brand/Logo";
import ExplodeDemo from "@/components/landing/ExplodeDemo";
import AmbientField from "@/components/landing/AmbientField";
import PipelineLoop from "@/components/landing/PipelineLoop";
import { CountUp, Reveal } from "@/components/landing/Reveal";
import SiteNav from "@/components/brand/SiteNav";
import { HUMANOID_ANIMATION_GROUPS } from "@/config/humanoid-animations";
import { SPATIALGEN_PROMPT, SPATIALGEN_RESULT as SG } from "@/config/lux3d-results";
import { T } from "@/lib/i18n";
import type { ReactNode } from "react";

const STUDIO = "/studio";
const PLAY = "/studio?play=1";
const ANIMATION_TOTAL = HUMANOID_ANIMATION_GROUPS.reduce((n, g) => n + g.clips.length, 0);
const GROUP_ZH: Record<string, string> = {
  locomotion: "移动与穿行",
  parkour: "跑酷与特技",
  social: "社交、对话与表演",
  interaction: "物体交互与工作",
  combat: "战斗：近战、远程与魔法",
  damage: "受击反应与怪物",
};

/* ----------------------------------------------------------------------------
 * Content (every number here is real: preset count, lod-meta.json, SDK exports)
 * ------------------------------------------------------------------------- */

const FIGURES: { value: string; key: string; label: ReactNode }[] = [
  { value: "5", key: "worlds", label: <T en="3DGS worlds, one generated with SpatialGen" zh="个 3DGS 世界，其中一个由 SpatialGen 生成" /> },
  { value: "41.8M", key: "splats", label: <T en="splats in the largest LOD stream" zh="个高斯点，最大的 LOD 流式场景" /> },
  { value: "10", key: "lux3d", label: <T en="Lux3D capabilities wired in" zh="项 Lux3D 能力全部接入" /> },
  { value: String(ANIMATION_TOTAL), key: "clips", label: <T en="retargetable humanoid clips" zh="个可重定向的人形动作" /> },
  { value: "11", key: "jobs", label: <T en="live Aholo jobs, every result in the app" zh="个实时 Aholo 任务，结果全部在应用中" /> },
];

const PIPELINE: { n: string; title: ReactNode; glyph: GlyphName; body: ReactNode; calls: string[] }[] = [
  {
    n: "01",
    title: <T en="Generate the world" zh="生成世界" />,
    glyph: "world",
    body: (
      <T
        en="Prompt or photograph a space with SpatialGen, or reconstruct one from video, photos or Insta360 footage with Aholo Reality. Our coffee bar came back from one sentence in 625 s, ready to walk."
        zh="用 SpatialGen 从提示词或照片生成空间，或用 Aholo Reality 从视频、照片、Insta360 素材重建。我们的咖啡吧只用一句话、625 秒就生成了，可以直接走进去。"
      />
    ),
    calls: ["world.generations.create", "world.reconstructions.create"],
  },
  {
    n: "02",
    title: <T en="Split the parts" zh="拆分部件" />,
    glyph: "split",
    body: (
      <T
        en="Forge props with Lux3D G1 or G1-Turbo, break them into semantic sub-meshes, and give them joints from one sentence. Finished models drop into the world you are standing in."
        zh="用 Lux3D G1 或 G1-Turbo 生成道具，拆分成语义部件，再用一句话为它加上关节。生成好的模型会直接投放到你所在的世界里。"
      />
    ),
    calls: ["textTo3d", "imgTo3d", "partSplit", "articulationAnimation"],
  },
  {
    n: "03",
    title: <T en="Rig the actors" zh="绑定角色" />,
    glyph: "rig",
    body: (
      <T
        en={`Auto-rig a humanoid mesh, retarget any of the ${ANIMATION_TOTAL} Lux3D clips onto it, then play it through the world on its voxel floor.`}
        zh={`为人形网格自动绑骨，把 ${ANIMATION_TOTAL} 个 Lux3D 动作中的任意一个重定向上去，再操控它在体素地面上穿行整个世界。`}
      />
    ),
    calls: ["humanoidAutoRig", "humanoidAnimationRetarget"],
  },
  {
    n: "04",
    title: <T en="Direct the scene" zh="导演场景" />,
    glyph: "spline",
    body: (
      <T
        en="Drop camera keyframes in the stage, play them back as a smooth spline, and export a storyboard pack for LuxReal video."
        zh="在舞台中打下镜头关键帧，按平滑样条回放，再导出分镜包交给 LuxReal 生成视频。"
      />
    ),
    calls: ["Catmull-Rom path", "storyboard JSON", "LuxReal"],
  },
];

const WORLDS = [
  {
    id: "smart-loft-indoor",
    code: "W-01",
    title: "Designer Smart Loft",
    zh: "设计师智能公寓",
    img: "/landing/world-loft.jpg" as string | null,
    format: ".spz",
    detail: <T en="Indoor apartment with a 336 × 112 × 296 voxel collision grid at 5 cm." zh="室内公寓，带 336 × 112 × 296 的 5 cm 体素碰撞网格。" />,
  },
  {
    id: "juguo-urban-plaza",
    code: "W-02",
    title: "Juguo Urban Plaza",
    zh: "聚果城市广场",
    img: null,
    format: "chunk-LOD · .ply sky",
    detail: <T en="41.8M splats across 5 LOD levels in 528 chunk files, with a 20 cm collision grid." zh="4180 万个高斯点，分布在 5 级 LOD、528 个分块文件中，带 20 cm 碰撞网格。" />,
  },
  {
    id: "huochezhan-concourse",
    code: "W-03",
    title: "Grand Transit Concourse",
    zh: "交通枢纽大厅",
    img: "/landing/world-concourse.jpg",
    format: "chunk-LOD · .sog env",
    detail: <T en="32.7M splats with degree-2 spherical harmonics, wrapped in a .sog environment." zh="3270 万个高斯点，二阶球谐，外围是 .sog 环境。" />,
  },
  {
    id: "sculpted-bear-studio",
    code: "W-04",
    title: "Object Turntable",
    zh: "物体转台",
    img: "/landing/world-bear.jpg",
    format: ".sog",
    detail: <T en="A single dense object capture for close inspection next to meshes." zh="单个高密度物体扫描，可以和网格放在一起近距离对比。" />,
  },
];

/** Play mode, captured from the studio (Designer Smart Loft, third person). */
const PLAY_STEPS = [
  {
    src: "/landing/play-near.jpg",
    step: <T en="Walk" zh="行走" />,
    alt: "Walk to the espresso machine",
    title: <T en="Walk to the espresso machine" zh="走到咖啡机前" />,
    meta: <T en="WASD, Shift to jog · Walk_Loop / Jog_Fwd_Loop on the voxel floor" zh="WASD 移动，Shift 慢跑 · 在体素地面上播放 Walk_Loop / Jog_Fwd_Loop" />,
  },
  {
    src: "/landing/play-brew.jpg",
    step: <T en="Brew" zh="冲咖啡" />,
    alt: "Press E to brew a coffee",
    title: <T en="Press E to brew a coffee" zh="按 E 冲一杯咖啡" />,
    meta: <T en="The camera cuts in as hood_top_joint and drawer_front_joint open" zh="hood_top_joint 与 drawer_front_joint 打开时镜头切入特写" />,
  },
  {
    src: "/landing/play-wrapped.jpg",
    step: <T en="Wrap" zh="收工" />,
    alt: "Frame the shot, then celebrate",
    title: <T en="Frame the shot, then celebrate" zh="构图取景，然后庆祝" />,
    meta: <T en="K drops a keyframe · F plays Dance_Loop · scene wrapped" zh="K 打关键帧 · F 播放 Dance_Loop · 场景杀青" />,
  },
];

const CONTROLS: { keys: string[]; label: string; zh: string }[] = [
  { keys: ["W", "A", "S", "D"], label: "walk", zh: "行走" },
  { keys: ["Shift"], label: "jog", zh: "慢跑" },
  { keys: ["Drag"], label: "look", zh: "环顾" },
  { keys: ["E"], label: "brew", zh: "冲咖啡" },
  { keys: ["K"], label: "frame", zh: "取景" },
  { keys: ["F"], label: "cheer", zh: "欢呼" },
  { keys: ["1–8"], label: "emotes", zh: "动作" },
];

const DROP_STEPS: { glyph: GlyphName; key: string; title: ReactNode; body: ReactNode }[] = [
  {
    glyph: "generate",
    key: "submit",
    title: <T en="Submit" zh="提交" />,
    body: (
      <T
        en={
          <>
            Text to 3D calls <span className="font-mono text-ink">lux3d.textTo3d.create</span> through /api/aholo/lux3d.
          </>
        }
        zh={
          <>
            文生 3D 通过 /api/aholo/lux3d 调用 <span className="font-mono text-ink">lux3d.textTo3d.create</span>。
          </>
        }
      />
    ),
  },
  {
    glyph: "loader",
    key: "track",
    title: <T en="Track" zh="跟踪" />,
    body: (
      <T
        en={
          <>
            A timer chip on the stage follows <span className="font-mono text-ink">lux3d.tasks.retrieve</span>, polled every 10 s.
          </>
        }
        zh={
          <>
            舞台上的计时标签每 10 秒轮询一次 <span className="font-mono text-ink">lux3d.tasks.retrieve</span>。
          </>
        }
      />
    ),
  },
  {
    glyph: "download",
    key: "fetch",
    title: <T en="Fetch" zh="获取" />,
    body: (
      <T
        en="The finished GLB comes in through an allowlisted asset proxy, so no expiring links reach the browser."
        zh="生成好的 GLB 经由白名单资源代理取回，过期链接不会直接暴露给浏览器。"
      />
    ),
  },
  {
    glyph: "voxel",
    key: "drop",
    title: <T en="Drop" zh="投放" />,
    body: (
      <T
        en="Scaled to about 70 cm, it falls in front of you onto the floor found in the voxel grid and bounces to rest."
        zh="模型缩放到约 70 cm，落在你面前由体素网格找到的地面上，弹几下后停稳。"
      />
    ),
  },
];

/** Stills of the real Lux3D results (captured from /lab, see src/config/lux3d-results.ts). */
const RESULT_FIGS = [
  { src: "/landing/lux3d/turbo.jpg", title: "Espresso machine · G1-Turbo", zh: "咖啡机 · G1-Turbo", meta: "textTo3d · task 8353472 · 151 s · 252k tris" },
  { src: "/landing/lux3d/g1.jpg", title: "Same prompt · G1", zh: "同一提示词 · G1", meta: "textTo3d · task 8353478 · 343 s · 230k tris · 3 PBR maps" },
  { src: "/landing/lux3d/parts.jpg", title: "Part split · 4 parts, exploded", zh: "部件拆分 · 4 个部件，爆炸视图", meta: "partSplit · task 8354166 · 118 s" },
  { src: "/landing/lux3d/artic-open.jpg", title: "“The hood hinges open”", zh: "「顶盖铰链打开」", meta: "articulationAnimation · task 8354168 · 298 s · URDF" },
  { src: "/landing/lux3d/char-rejected.jpg", title: "Attempt 1 · rig rejected", zh: "第 1 次 · 绑骨被拒", meta: "humanoidAutoRig · RIG_ELIGIBILITY_FAILED" },
  { src: "/landing/lux3d/char-rigged.jpg", title: "Attempt 2 · auto-rigged", zh: "第 2 次 · 自动绑骨成功", meta: "humanoidAutoRig · task 8355123 · 81 s · 52 joints" },
  { src: "/landing/lux3d/char-walk.jpg", title: "Retargeted · Walk_Loop", zh: "已重定向 · Walk_Loop", meta: "humanoidAnimationRetarget · task 8359816 · 8 clips" },
];

function ResultFig({ src, title, zh, meta, i, tall = false }: { src: string; title: string; zh: string; meta: string; i: number; tall?: boolean }) {
  return (
    <figure style={{ "--i": i } as React.CSSProperties}>
      <div className={`overflow-hidden border border-line bg-canvas ${tall ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <figcaption className="mt-3">
        <div className="text-[14px] text-ink">
          <T en={title} zh={zh} />
        </div>
        <div className="mt-0.5 font-mono text-[11.5px] text-ink-3">{meta}</div>
      </figcaption>
    </figure>
  );
}

const STACK: [string, ReactNode, ReactNode][] = [
  ["@manycore/aholo-viewer", "1.14.0", <T key="v" en="WebGL2 stage: splat loading, chunk-LOD streaming, GLTF meshes, skeletal animation, tone-mapped compositing." zh="WebGL2 舞台：高斯点加载、分块 LOD 流式加载、GLTF 网格、骨骼动画、色调映射合成。" />],
  ["@manycore/aholo-sdk-world", "1.5.0", <T key="w" en="SpatialGen generation and Aholo Reality reconstruction, with task status and history." zh="SpatialGen 世界生成与 Aholo Reality 重建，含任务状态与历史。" />],
  ["@manycore/aholo-sdk-lux3d", "1.10.0", <T key="l" en="All 10 Lux3D methods: generation, four-view, concept art, part split, articulation, rig, retarget, material, export." zh="全部 10 个 Lux3D 方法：生成、四视图、概念图、部件拆分、关节化、绑骨、动画重定向、材质迁移、导出。" />],
  ["@manycore/aholo-sdk-asset", "1.4.0", <T key="a" en="Asset client for staging media on Aholo's CDN; local-file uploads run through the MCP upload_asset tool." zh="资源客户端，用于把素材暂存到 Aholo CDN；本地文件上传通过 MCP 的 upload_asset 工具完成。" />],
  ["@manycore/aholo-sdk-mcp", "1.10.0", <T key="m" en="The Aholo MCP server, pre-wired in .mcp.json for Claude Code, Cursor and the in-app co-director." zh="Aholo MCP 服务，已在 .mcp.json 中为 Claude Code、Cursor 和应用内 AI 副导演配置好。" />],
  ["LuxReal", <T key="h" en="hand-off" zh="交接" />, <T key="x" en="Camera paths and shot prompts exported as a storyboard pack for LuxReal's video creator." zh="镜头路径与镜头提示词导出为分镜包，交给 LuxReal 的视频创作工具。" />],
];

const TRY: { key: string; title: ReactNode; body: ReactNode }[] = [
  {
    key: "launch",
    title: <T en="Launch the app" zh="启动应用" />,
    body: <T en="The Smart Loft streams in from Manycore's CDN. No sign-up, no key." zh="智能公寓从群核的 CDN 流式加载。无需注册，无需密钥。" />,
  },
  {
    key: "play",
    title: <T en="Press Play" zh="点击 Play" />,
    body: (
      <T
        en={
          <>
            Walk to the espresso machine with <span className="kbd">W</span> <span className="kbd">A</span>{" "}
            <span className="kbd">S</span> <span className="kbd">D</span>, brew with <span className="kbd">E</span>, frame with{" "}
            <span className="kbd">K</span>, cheer with <span className="kbd">F</span>. Phones get a joystick.
          </>
        }
        zh={
          <>
            用 <span className="kbd">W</span> <span className="kbd">A</span> <span className="kbd">S</span>{" "}
            <span className="kbd">D</span> 走到咖啡机前，按 <span className="kbd">E</span> 冲咖啡，<span className="kbd">K</span>{" "}
            取景，<span className="kbd">F</span> 欢呼。手机上有虚拟摇杆。
          </>
        }
      />
    ),
  },
  {
    key: "worlds",
    title: <T en="Switch worlds" zh="切换世界" />,
    body: <T en="Five scenes in the header tabs, including the coffee bar SpatialGen generated." zh="顶部标签里有五个场景，包括 SpatialGen 生成的咖啡吧。" />,
  },
  {
    key: "explode",
    title: <T en="Explode a prop" zh="爆炸一个道具" />,
    body: <T en="Drag the explode control, select a part to hide or recolor it, toggle articulation." zh="拖动爆炸视图控件，选中部件可隐藏或改色，也可开关关节动画。" />,
  },
  {
    key: "drop",
    title: <T en="Drop in a model" zh="投放一个模型" />,
    body: (
      <T
        en="Press Text to 3D. The model lands in front of you when the job finishes; without a key a cached result drops in."
        zh="点击文生 3D，任务完成后模型会落在你面前；没有密钥时投放的是缓存结果。"
      />
    ),
  },
  {
    key: "direct",
    title: <T en="Direct a shot" zh="导演一个镜头" />,
    body: <T en="Add keyframes at a few viewpoints, play the path, then export the storyboard or open LuxReal." zh="在几个视角打关键帧，回放镜头路径，再导出分镜或打开 LuxReal。" />,
  },
  {
    key: "expand",
    title: <T en="Expand the stage" zh="全屏舞台" />,
    body: <T en="The Expand button in the stage toolbar hides the panels and shows only the render. Esc returns." zh="舞台工具栏的全屏按钮会隐藏所有面板，只显示渲染画面。按 Esc 返回。" />,
  },
  {
    key: "live",
    title: <T en="Go live" zh="运行实时任务" />,
    body: (
      <T
        en="Add your labs.aholo.ai key under API key to send real SpatialGen and Lux3D jobs to your own account."
        zh="在 API 密钥里填入你的 labs.aholo.ai 密钥，就能用自己的账户发送真实的 SpatialGen 和 Lux3D 任务。"
      />
    ),
  },
];

/* ----------------------------------------------------------------------------
 * Building blocks
 * ------------------------------------------------------------------------- */

/** Editorial section: numbered label in a left rail, content on the right. */
function Section({
  id,
  n,
  name,
  title,
  lead,
  children,
  className = "",
}: {
  id?: string;
  n: string;
  name: ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`border-t border-line ${className}`}>
      <div className="landing-wrap grid gap-x-10 gap-y-6 py-20 sm:py-28 lg:grid-cols-[200px_1fr]">
        <div className="self-start lg:sticky lg:top-24">
          <Reveal className="label flex items-center gap-2 pt-3">
            <span className="text-accent">{n}</span>
            <span className="h-px w-5 bg-line-strong" />
            {name}
          </Reveal>
        </div>
        <div className="min-w-0">
          <Reveal variant="title" as="h2" className="max-w-3xl font-serif text-[38px] leading-[1.02] tracking-[-0.01em] text-ink sm:text-[52px]">
            {title}
          </Reveal>
          {lead && (
            <Reveal as="p" delay={120} className="mt-5 max-w-2xl text-[17px] leading-relaxed text-ink-2">
              {lead}
            </Reveal>
          )}
          {children && (
            <Reveal delay={200} className="mt-12">
              {children}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function Figure({ src, alt, caption, n, w, h }: { src: string; alt: string; caption: React.ReactNode; n: number; w: number; h: number }) {
  return (
    <figure>
      <Reveal variant="figure" className="overflow-hidden border border-line bg-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* width/height reserve the space, so anchor links land right before the image loads */}
        <img src={src} alt={alt} width={w} height={h} loading="lazy" className="block h-auto w-full" />
      </Reveal>
      <figcaption className="mt-3 flex gap-3 text-[13px] text-ink-3">
        <span className="font-mono text-ink-2">
          <T en={`Fig. ${n}`} zh={`图 ${n}`} />
        </span>
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}

/** Chunk-LOD pyramid for the plaza, drawn from its real lod-meta.json. */
function LodGraphic() {
  const levels = [4, 9, 15, 23, 33];
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-[5px] bg-canvas hairline-grid">
      {levels.map((cells, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-5 text-right font-mono text-[10px] text-ink-3">L{4 - i}</span>
          <div className="flex gap-[3px]">
            {Array.from({ length: cells }).map((_, j) => (
              <span
                key={j}
                className="h-3.5 w-2 rounded-[1px]"
                style={{
                  background: i === levels.length - 1 && j % 7 === 3 ? "var(--color-accent)" : "var(--color-ink-3)",
                  opacity: i === levels.length - 1 && j % 7 === 3 ? 1 : 0.25 + i * 0.13,
                }}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="mt-4 font-mono text-[11px] text-ink-2">
        <T en="528 chunks · 5 levels · 41.8M splats" zh="528 个分块 · 5 级 · 4180 万个高斯点" />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Page
 * ------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <div className="landing-root relative min-h-screen bg-canvas text-ink">
      <AmbientField />
      <div className="relative z-10">
      {/* -------------------------------------------------------------- header */}
      <SiteNav
        progress
        links={[
          { label: "Pipeline", href: "#pipeline" },
          { label: "Results", href: "#results" },
          { label: "Worlds", href: "#worlds" },
          { label: "Features", href: "#features" },
          { label: "Lux3D bench", href: "/lab" },
          { label: "Docs", href: "/docs" },
        ]}
      />

      <main>
        {/* -------------------------------------------------------------- hero */}
        <section className="landing-wrap pb-16 pt-16 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
            {/* left: message */}
            <div>
              <div className="rise label flex items-center gap-2">
                <span className="dot dot-live" />
                <T en="Manycore Aholo Global 3D AI Hackathon" zh="群核 Aholo 全球 3D AI 黑客松" />
              </div>
              <h1
                className="rise mt-6 font-serif text-[46px] leading-[0.98] tracking-[-0.015em] text-ink sm:text-[64px] lg:text-[60px] xl:text-[72px]"
                style={{ "--d": "80ms" } as React.CSSProperties}
              >
                <T
                  en={
                    <>
                      A directing stage for <br className="hidden sm:block" />
                      <em className="text-ink-2">generated</em> 3D worlds.
                    </>
                  }
                  zh={
                    <>
                      为<em className="text-ink-2">生成式</em> 3D 世界
                      <br className="hidden sm:block" />
                      打造的导演舞台。
                    </>
                  }
                />
              </h1>
              <p
                className="rise mt-7 max-w-xl text-[18px] leading-relaxed text-ink-2"
                style={{ "--d": "180ms" } as React.CSSProperties}
              >
                <T
                  en="Holorra puts walkable Gaussian Splatting worlds, part-split and articulated props, a rigged actor you play and a camera director on one WebGL stage in your browser. It is built on the Manycore Aholo stack."
                  zh="Holorra 把可行走的高斯泼溅世界、可拆分可活动的道具、由你操控的绑骨角色和镜头导演，放进浏览器里的同一个 WebGL 舞台。完全基于群核 Aholo 技术栈构建。"
                />
              </p>
              <div className="rise mt-9 flex flex-wrap gap-3" style={{ "--d": "260ms" } as React.CSSProperties}>
                <Link href={STUDIO} className="btn btn-primary btn-lg">
                  <T en="Launch App" zh="启动应用" />
                </Link>
                <Link href={PLAY} className="btn btn-lg">
                  <Glyph name="play" size={12} />
                  <T en="Play the scene" zh="开始游玩" />
                </Link>
                <Link href="/report" className="btn btn-lg btn-ghost">
                  <T en="Read the report" zh="阅读报告" />
                </Link>
              </div>
              <div
                className="rise mt-10 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11.5px] text-ink-3"
                style={{ "--d": "340ms" } as React.CSSProperties}
              >
                <span>WebGL2</span>
                <span>
                  <T en="3D Gaussian Splatting" zh="3D 高斯泼溅" />
                </span>
                <span>SpatialGen</span>
                <span>Lux3D</span>
                <span>Aholo MCP</span>
                <span>LuxReal</span>
              </div>
            </div>
            {/* right: continuous pipeline loop */}
            <div className="rise" style={{ "--d": "220ms" } as React.CSSProperties}>
              <PipelineLoop />
            </div>
          </div>

          <div className="mt-20">
            <Figure
              n={1}
              src="/landing/studio.jpg"
              w={2400}
              h={1440}
              alt="The Holorra studio on the SpatialGen coffee bar world, with the Lux3D actor and espresso machine on the stage, creation dock on the left and part inspector on the right."
              caption={
                <T
                  en="The studio in the coffee bar SpatialGen generated from one sentence, with the Lux3D actor and espresso machine. Real capture of the app, no mock-up."
                  zh="创作台中的咖啡吧（由 SpatialGen 用一句话生成），里面是 Lux3D 角色和咖啡机。应用真实截图，不是效果图。"
                />
              }
            />
          </div>

          {/* figures strip */}
          <Reveal as="dl" variant="stagger" className="mt-16 grid grid-cols-2 border-l border-t border-line sm:grid-cols-3 lg:grid-cols-5">
            {FIGURES.map((f, i) => (
              <div
                key={f.key}
                className="flex flex-col border-b border-r border-line bg-canvas/70 px-5 py-6"
                style={{ "--i": i } as React.CSSProperties}
              >
                <dt className="order-2 mt-2 text-[13px] leading-snug text-ink-3">{f.label}</dt>
                <dd className="font-mono text-[34px] leading-none tracking-[-0.02em] text-ink tabular">
                  <CountUp value={f.value} />
                </dd>
              </div>
            ))}
          </Reveal>
        </section>

        {/* -------------------------------------------------------------- problem */}
        <Section
          n="01"
          name={<T en="Problem" zh="问题" />}
          title={<T en="Generated 3D usually ends as a statue in an empty room." zh="生成的 3D 模型，往往只是空房间里的一尊雕像。" />}
          lead={
            <T
              en="Text-to-3D gives you a mesh. It floats in a grey void, it is fused into one shell, it cannot move, and nobody can film it. Holorra treats a generated asset as the start of a scene."
              zh="文生 3D 给你的是一个网格：飘在灰色虚空里，融成一整块外壳，不能动，也没法拍。Holorra 把生成的资产当作一个场景的起点。"
            />
          }
        >
          <div className="grid border-t border-line md:grid-cols-2">
            {[
              {
                k: "Place",
                kz: "场景",
                before: <T en="A lone .glb on a grey grid." zh="灰色网格上孤零零的一个 .glb。" />,
                after: <T en="Props sit inside a photoreal splat world with collision you can walk on." zh="道具放进照片级的高斯泼溅世界，带碰撞，可以走进去。" />,
              },
              {
                k: "Parts",
                kz: "部件",
                before: <T en="One fused shell. Nothing opens." zh="融成一整块外壳，什么都打不开。" />,
                after: <T en="Semantic sub-meshes you can explode, hide, recolor and hinge." zh="语义部件可以爆炸、隐藏、改色，还能加铰链。" />,
              },
              {
                k: "Motion",
                kz: "动作",
                before: <T en="Characters frozen in a T-pose." zh="角色僵在 T-pose。" />,
                after: (
                  <T
                    en={`An auto-rigged actor you play, with ${ANIMATION_TOTAL} retargetable clips.`}
                    zh={`自动绑骨的角色由你操控，有 ${ANIMATION_TOTAL} 个可重定向的动作。`}
                  />
                ),
              },
              {
                k: "Camera",
                kz: "镜头",
                before: <T en="A turntable at best." zh="顶多是个转台展示。" />,
                after: <T en="Keyframed camera paths that export to LuxReal for video." zh="关键帧镜头路径，可导出给 LuxReal 生成视频。" />,
              },
            ].map(({ k, kz, before, after }) => (
              <div key={k} className="grid grid-cols-[88px_1fr] gap-4 border-b border-line py-5 md:odd:pr-8 md:even:border-l md:even:pl-8">
                <div className="label pt-0.5">
                  <T en={k} zh={kz} />
                </div>
                <div>
                  <div className="text-[14px] text-ink-3 line-through decoration-line-strong">{before}</div>
                  <div className="mt-1 text-[15px] text-ink">{after}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* -------------------------------------------------------------- play */}
        <Section
          id="play"
          n="02"
          name={<T en="Play" zh="游玩" />}
          title={
            <T
              en={
                <>
                  Don&apos;t just look at the scene. <span className="text-accent">Play it.</span>
                </>
              }
              zh={
                <>
                  别只看场景，<span className="text-accent">玩起来。</span>
                </>
              }
            />
          }
          lead={
            <T
              en="Press Play and the studio turns into a short scene quest. You steer the auto-rigged Lux3D actor through the splat loft and work the espresso machine Lux3D generated and articulated. Nothing is faked: the hood and drawer move on the joints in the returned URDF, and the actor plays its retargeted clips."
              zh="点击 Play，创作台就变成一个简短的场景任务。你操控自动绑骨的 Lux3D 角色穿过高斯泼溅公寓，使用由 Lux3D 生成并完成关节化的咖啡机。没有任何造假：顶盖和抽屉沿返回的 URDF 关节运动，角色播放的是重定向后的动作。"
            />
          }
        >
          <Reveal variant="stagger" className="grid gap-6 md:grid-cols-3">
            {PLAY_STEPS.map((f, i) => (
              <figure key={f.src} style={{ "--i": i } as React.CSSProperties}>
                <div className="relative aspect-[5/4] overflow-hidden border border-line bg-canvas">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.src} alt={f.alt} loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-[4px] bg-accent px-2 py-0.5 font-mono text-[11px] text-accent-ink">
                    {String(i + 1).padStart(2, "0")} {f.step}
                  </span>
                </div>
                <figcaption className="mt-3">
                  <div className="text-[15px] text-ink">{f.title}</div>
                  <div className="mt-0.5 font-mono text-[11.5px] text-ink-3">{f.meta}</div>
                </figcaption>
              </figure>
            ))}
          </Reveal>
          <div className="mt-10 grid gap-8 border-t border-line pt-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="label">
                <T en="Controls" zh="操作方式" />
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                {CONTROLS.map((c) => (
                  <li key={c.label} className="flex items-center gap-1.5 text-[14px] text-ink-2">
                    {c.keys.map((k) => (
                      <span key={k} className="kbd">
                        {k}
                      </span>
                    ))}
                    <span className="ml-1">
                      <T en={c.label} zh={c.zh} />
                    </span>
                  </li>
                ))}
              </ul>
              <ul className="mt-6 space-y-3 text-[14px] leading-relaxed text-ink-2">
                <li className="flex gap-3">
                  <Glyph name="walk" size={16} className="mt-0.5 text-ink-3" />
                  <span>
                    <T
                      en={
                        <>
                          <span className="text-ink">On a phone</span>, a thumb joystick walks the actor and Brew, Frame and Cheer
                          buttons sit beside it.
                        </>
                      }
                      zh={
                        <>
                          <span className="text-ink">在手机上</span>，用拇指摇杆操控角色行走，旁边是冲咖啡、取景和欢呼按钮。
                        </>
                      }
                    />
                  </span>
                </li>
                <li className="flex gap-3">
                  <Glyph name="expand" size={16} className="mt-0.5 text-ink-3" />
                  <span>
                    <T
                      en={
                        <>
                          <span className="text-ink">Expand</span> hides every panel and gives the render the whole screen.
                        </>
                      }
                      zh={
                        <>
                          <span className="text-ink">全屏</span>会隐藏所有面板，整个屏幕只留渲染画面。
                        </>
                      }
                    />
                  </span>
                </li>
                <li className="flex gap-3">
                  <Glyph name="spline" size={16} className="mt-0.5 text-ink-3" />
                  <span>
                    <T
                      en={
                        <>
                          <span className="text-ink">Your keyframe stays</span> on the camera path, ready to play back or send to
                          LuxReal.
                        </>
                      }
                      zh={
                        <>
                          <span className="text-ink">你打的关键帧会保留</span>在镜头路径上，可以回放，也可以交给 LuxReal。
                        </>
                      }
                    />
                  </span>
                </li>
                <li className="flex gap-3">
                  <Glyph name="bean" size={16} className="mt-0.5 text-ink-3" />
                  <span>
                    <T
                      en={
                        <>
                          <span className="text-ink">Five coffee beans and a clock.</span> Hunt the beans hidden around the loft; a run with all five sets your best time.
                        </>
                      }
                      zh={
                        <>
                          <span className="text-ink">五颗咖啡豆，一只计时器。</span>在公寓里找出藏起来的咖啡豆，集齐五颗的成绩才计入最佳时间。
                        </>
                      }
                    />
                  </span>
                </li>
                <li className="flex gap-3">
                  <Glyph name="rig" size={16} className="mt-0.5 text-ink-3" />
                  <span>
                    <T
                      en={
                        <>
                          <span className="text-ink">Keys 1 to 8 are emotes:</span> every clip Lux3D retargeted onto the actor, from a sword swing to a dance.
                        </>
                      }
                      zh={
                        <>
                          <span className="text-ink">数字键 1 到 8 是动作：</span>Lux3D 重定向到角色上的每个动作片段，从挥剑到跳舞。
                        </>
                      }
                    />
                  </span>
                </li>
                <li className="flex gap-3">
                  <Glyph name="mesh" size={16} className="mt-0.5 text-ink-3" />
                  <span>
                    <T
                      en={
                        <>
                          <span className="text-ink">Kick what you generate.</span> Walk into a dropped model and it slides and tumbles across the floor.
                        </>
                      }
                      zh={
                        <>
                          <span className="text-ink">生成的模型可以踢。</span>走过去撞上投放的模型，它会在地面上滑动翻滚。
                        </>
                      }
                    />
                  </span>
                </li>
                <li className="flex gap-3">
                  <Glyph name="sound" size={16} className="mt-0.5 text-ink-3" />
                  <span>
                    <T
                      en={
                        <>
                          <span className="text-ink">Sound, if you want it:</span> footsteps, the machine's hiss and a chime per step, all synthesized in the browser.
                        </>
                      }
                      zh={
                        <>
                          <span className="text-ink">想要的话还有声音：</span>脚步声、咖啡机的嘶嘶声、每一步的提示音，全部在浏览器里合成。
                        </>
                      }
                    />
                  </span>
                </li>
                <li className="flex gap-3">
                  <Glyph name="shot" size={16} className="mt-0.5 text-ink-3" />
                  <span>
                    <T
                      en={
                        <>
                          <span className="text-ink">A finish card</span> turns the shot you framed into a poster with your time, ready to save or post on X.
                        </>
                      }
                      zh={
                        <>
                          <span className="text-ink">成绩卡</span>把你取景的镜头做成带成绩的海报，可以保存或发到 X。
                        </>
                      }
                    />
                  </span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col justify-between gap-6 border-line lg:border-l lg:pl-8">
              <p className="font-serif text-[30px] leading-[1.1] text-ink sm:text-[36px]">
                <T
                  en="Walk in, brew a coffee, frame the shot, then beat your own time. No key needed."
                  zh="走进去，冲杯咖啡，拍下这个镜头，再刷新自己的成绩。无需密钥。"
                />
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={PLAY} className="btn btn-primary btn-lg">
                  <Glyph name="play" size={12} />
                  <T en="Play the scene" zh="开始游玩" />
                </Link>
                <Link href={STUDIO} className="btn btn-lg btn-ghost">
                  <T en="Open the studio" zh="打开创作台" />
                </Link>
              </div>
            </div>
          </div>
        </Section>

        {/* -------------------------------------------------------------- pipeline */}
        <Section
          id="pipeline"
          n="03"
          name={<T en="Pipeline" zh="流程" />}
          title={
            <T
              en={
                <>
                  Generate the world. Split the parts. Rig the actors. <span className="text-accent">Direct the scene.</span>
                </>
              }
              zh={
                <>
                  生成世界，拆分部件，绑定角色，<span className="text-accent">导演场景。</span>
                </>
              }
            />
          }
          lead={
            <T
              en="Four stages, each backed by real Manycore SDK calls behind Holorra's /api/aholo routes. Every stage hands its output to the next on the same stage."
              zh="四个阶段，每一步都由 Holorra 的 /api/aholo 接口背后真实的群核 SDK 调用支撑。每个阶段的产出都在同一个舞台上交给下一个阶段。"
            />
          }
        >
          <Reveal as="ol" variant="stagger" className="grid border-l border-t border-line sm:grid-cols-2 xl:grid-cols-4">
            {PIPELINE.map((p, i) => (
              <li
                key={p.n}
                className="group flex flex-col border-b border-r border-line bg-canvas/70 p-6 transition-colors hover:bg-surface"
                style={{ "--i": i } as React.CSSProperties}
              >
                <div className="flex items-center justify-between text-ink-2">
                  <Glyph name={p.glyph} size={22} className="transition-colors group-hover:text-accent" />
                  <span className="font-mono text-[12px] text-ink-3">{p.n}</span>
                </div>
                <h3 className="mt-8 text-[17px] font-medium text-ink">{p.title}</h3>
                <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-2">{p.body}</p>
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {p.calls.map((c) => (
                    <span key={c} className="chip">
                      {c}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </Reveal>
        </Section>

        {/* -------------------------------------------------------------- results */}
        <Section
          id="results"
          n="04"
          name={<T en="Results" zh="成果" />}
          title={<T en="Real Lux3D output, not mock-ups." zh="真实的 Lux3D 产出，不是效果图。" />}
          lead={
            <T
              en={
                <>
                  Ten Lux3D jobs and one SpatialGen world ran through Holorra&apos;s own{" "}
                  <span className="font-mono text-[15px] text-ink">/api/aholo</span> routes on 18 November. Every image below is what
                  the API returned, rendered in @manycore/aholo-viewer, with its real task ID and wall-clock time.
                </>
              }
              zh={
                <>
                  11 月 18 日，10 个 Lux3D 任务和 1 个 SpatialGen 世界经由 Holorra 自己的{" "}
                  <span className="font-mono text-[15px] text-ink">/api/aholo</span> 接口运行完成。下面每张图都是 API
                  实际返回的结果，在 @manycore/aholo-viewer 中渲染，并标注真实的任务 ID 和耗时。
                </>
              }
            />
          }
        >
          <Reveal variant="stagger" className="grid gap-6 sm:grid-cols-2">
            {RESULT_FIGS.slice(0, 4).map((f, i) => (
              <ResultFig key={f.src} {...f} i={i} />
            ))}
          </Reveal>
          <Reveal variant="stagger" className="mt-6 grid gap-6 sm:grid-cols-3">
            {RESULT_FIGS.slice(4).map((f, i) => (
              <ResultFig key={f.src} {...f} i={i} tall />
            ))}
          </Reveal>
          <Reveal variant="figure" className="mt-12">
            <figure>
              <div className="relative aspect-[2/1] overflow-hidden border border-line bg-canvas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/spatialgen-pano.jpg"
                  alt="The 360° panorama SpatialGen returned for the coffee bar world"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="mt-3 grid gap-2 md:grid-cols-[1fr_1.4fr] md:gap-8">
                <div>
                  <div className="text-[14px] text-ink">
                    SpatialGen · <T en={SG.title} zh="北欧风咖啡吧" />
                  </div>
                  <div className="mt-0.5 font-mono text-[11.5px] text-ink-3">
                    {SG.method} · world {SG.worldId} · {SG.seconds} s · {SG.splats.toLocaleString("en-US")} splats
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-ink-3">
                  <T
                    en={
                      <>
                        <span className="text-ink-2">Prompt:</span> &ldquo;{SPATIALGEN_PROMPT}&rdquo; The panorama above came back
                        with the splat file; the splats are world 05 in the studio.
                      </>
                    }
                    zh={
                      <>
                        <span className="text-ink-2">提示词：</span>「{SPATIALGEN_PROMPT}」上面的全景图和高斯点文件一起返回；这些高斯点就是创作台里的世界 05。
                      </>
                    }
                  />
                </p>
              </figcaption>
            </figure>
          </Reveal>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/lab" className="btn btn-lg">
              <Glyph name="mesh" size={16} />
              <T en="Inspect them live on the bench" zh="在测试台上实时查看" />
            </Link>
            <span className="text-[13px] text-ink-3">
              <T
                en="Turntable, explode, joint sliders and clip switching on the real files."
                zh="基于真实文件的转台、爆炸视图、关节滑块和动作切换。"
              />
            </span>
          </div>
        </Section>

        {/* -------------------------------------------------------------- drop-in */}
        <Section
          n="05"
          name={<T en="Drop-in" zh="投放" />}
          title={<T en="Generate a model. It lands at your feet." zh="生成一个模型，它就落在你脚边。" />}
          lead={
            <T
              en="Keep playing while Lux3D works. When the job finishes, the model appears in front of the camera in whatever world you are in, falls to the floor and settles. The wait becomes part of the scene."
              zh="Lux3D 生成期间你可以继续玩。任务完成后，模型会出现在你当前所在世界的镜头前，落到地面并停稳。等待本身也成了场景的一部分。"
            />
          }
        >
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <Figure
              n={2}
              src="/landing/drop-in.jpg"
              w={1400}
              h={1131}
              alt="A generated espresso machine dropped onto the floor of the SpatialGen coffee bar next to the Lux3D actor"
              caption={
                <T
                  en="A Lux3D model dropped into the SpatialGen coffee bar. Without a key, Holorra drops the stored G1-Turbo result from task 8353472 and labels it cached."
                  zh="一个 Lux3D 模型投放到 SpatialGen 咖啡吧中。没有密钥时，Holorra 投放的是任务 8353472 存下来的 G1-Turbo 结果，并标注为缓存结果。"
                />
              }
            />
            <Reveal as="ol" variant="stagger" className="self-start border-t border-line">
              {DROP_STEPS.map((d, i) => (
                <li
                  key={d.key}
                  className="grid grid-cols-[28px_1fr] gap-3 border-b border-line py-4"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <Glyph name={d.glyph} size={18} className="mt-0.5 text-ink-2" />
                  <div>
                    <div className="flex items-baseline gap-2 text-[15px] text-ink">
                      <span className="font-mono text-[12px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                      {d.title}
                    </div>
                    <div className="mt-0.5 text-[14px] leading-relaxed text-ink-2">{d.body}</div>
                  </div>
                </li>
              ))}
            </Reveal>
          </div>
        </Section>

        {/* -------------------------------------------------------------- worlds */}
        <Section
          id="worlds"
          n="06"
          name={<T en="Worlds" zh="世界" />}
          title={<T en="Five splat worlds. We generated one of them." zh="五个高斯泼溅世界，其中一个是我们生成的。" />}
          lead={
            <T
              en="Live generation takes minutes, so Holorra opens on four Gaussian Splatting scenes hosted on Manycore's CDN. The fifth came from a single SpatialGen prompt through Holorra's own /api/aholo/world route. Each card opens its world in the studio."
              zh="实时生成需要几分钟，所以 Holorra 一打开就是托管在群核 CDN 上的四个高斯泼溅场景。第五个来自一句 SpatialGen 提示词，经由 Holorra 自己的 /api/aholo/world 接口生成。点击卡片即可在创作台中打开对应世界。"
            />
          }
        >
          <Reveal variant="figure" className="mb-12">
            <Link href={`${STUDIO}?world=spatialgen-coffee-bar`} className="group grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="relative aspect-[16/10] overflow-hidden border border-line bg-canvas">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/world-cafe.jpg"
                  alt="The SpatialGen coffee bar rendered in the Holorra stage with the Lux3D actor and espresso machine"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"
                />
                <span className="chip chip-accent absolute left-3 top-3">
                  <T en="Generated with SpatialGen" zh="由 SpatialGen 生成" />
                </span>
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[12px] text-ink-3">W-05</span>
                  <h3 className="text-[20px] font-medium text-ink group-hover:text-accent">
                    <T en="Coffee Bar · SpatialGen" zh="咖啡吧 · SpatialGen" />
                  </h3>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  <T
                    en={
                      <>
                        One sentence in, a walkable world out: {SG.splats.toLocaleString("en-US")} splats in {SG.seconds} s, saved as
                        a {SG.sizeMB} MB .spz. SpatialGen returns it Z-up, so the stage turns it into Aholo&apos;s −Y-up frame and
                        places the Lux3D espresso machine on its table.
                      </>
                    }
                    zh={
                      <>
                        输入一句话，得到一个可行走的世界：{SG.seconds} 秒生成 {SG.splats.toLocaleString("en-US")} 个高斯点，保存为{" "}
                        {SG.sizeMB} MB 的 .spz。SpatialGen 输出为 Z 轴朝上，舞台会把它转换到 Aholo 的 −Y 朝上坐标系，并把 Lux3D
                        咖啡机放到桌面上。
                      </>
                    }
                  />
                </p>
                <dl className="mt-5 grid grid-cols-3 border-l border-t border-line">
                  {[
                    ["world", "世界", SG.worldId],
                    ["time", "耗时", `${SG.seconds} s`],
                    ["splats", "高斯点", `${Math.round(SG.splats / 1000)}K`],
                  ].map(([k, kz, v]) => (
                    <div key={k} className="border-b border-r border-line px-3 py-2.5">
                      <dt className="label">
                        <T en={k} zh={kz} />
                      </dt>
                      <dd className="mt-1 truncate font-mono text-[13px] text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Link>
          </Reveal>
          <Reveal variant="stagger" className="grid gap-x-6 gap-y-12 sm:grid-cols-2">
            {WORLDS.map((w, i) => (
              <Link key={w.code} href={`${STUDIO}?world=${w.id}`} className="group block" style={{ "--i": i } as React.CSSProperties}>
                <div className="relative aspect-[16/10] overflow-hidden border border-line bg-canvas">
                  {w.img ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={w.img}
                      alt={`${w.title} rendered in the Holorra stage`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]"
                    />
                  ) : (
                    <LodGraphic />
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="font-mono text-[12px] text-ink-3">{w.code}</span>
                  <h3 className="text-[17px] font-medium text-ink group-hover:text-accent">
                    <T en={w.title} zh={w.zh} />
                  </h3>
                  <span className="ml-auto font-mono text-[12px] text-ink-3">{w.format}</span>
                </div>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{w.detail}</p>
              </Link>
            ))}
          </Reveal>
        </Section>

        {/* -------------------------------------------------------------- features */}
        <Section
          id="features"
          n="07"
          name={<T en="Hybrid stage" zh="混合舞台" />}
          title={<T en="Radiance fields and meshes on one stage." zh="辐射场与网格，同台呈现。" />}
          lead={
            <T
              en="Splats carry the world's look; meshes carry everything you want to touch. Both render in a single @manycore/aholo-viewer scene, lights on the meshes and tone-mapped compositing on the splats."
              zh="高斯点负责世界的外观，网格负责一切你想触碰的东西。两者在同一个 @manycore/aholo-viewer 场景中渲染：网格有灯光，高斯点做色调映射合成。"
            />
          }
        >
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <Figure
              n={3}
              src="/landing/hybrid-concourse.jpg"
              w={1400}
              h={1187}
              alt="A Gaussian Splatting rail yard with exploded mesh parts in front of it"
              caption={
                <T
                  en="A 32.7M-splat LOD stream with exploded mesh parts in the same scene."
                  zh="3270 万个高斯点的 LOD 流式场景，同一场景中有爆炸展开的网格部件。"
                />
              }
            />
            <ul className="divide-y divide-line border-y border-line self-start">
              {(
                [
                  ["lod", "Chunk-LOD streaming", "分块 LOD 流式加载", "Loads splat chunks by distance and keeps each frame inside a splat budget.", "按距离加载高斯点分块，让每一帧都控制在高斯点预算内。"],
                  ["splat", "Direct splat files", "直接加载高斯点文件", ".spz, .sog and .ply for single scenes and object captures.", "单个场景和物体扫描支持 .spz、.sog 和 .ply。"],
                  ["voxel", "Voxel collision", "体素碰撞", "Sparse grids so actors stand on floors and stop at walls.", "稀疏网格让角色站在地面上、碰到墙会停下。"],
                  ["mesh", "PBR meshes", "PBR 网格", "GLTF props and rigged characters lit inside the splat world.", "GLTF 道具和绑骨角色在高斯泼溅世界中被照亮。"],
                ] as [GlyphName, string, string, string, string][]
              ).map(([g, t, tz, b, bz]) => (
                <li key={t} className="flex gap-4 py-4">
                  <Glyph name={g} size={18} className="mt-0.5 text-ink-2" />
                  <div>
                    <div className="text-[15px] text-ink">
                      <T en={t} zh={tz} />
                    </div>
                    <div className="mt-0.5 text-[14px] leading-relaxed text-ink-2">
                      <T en={b} zh={bz} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section
          n="08"
          name={<T en="Parts" zh="部件" />}
          title={<T en="Take any generated object apart." zh="把任何生成的物体拆开。" />}
          lead={
            <T
              en={
                <>
                  <span className="font-mono text-[15px] text-ink">lux3d.partSplit</span> returns an object&apos;s semantic
                  sub-meshes. Explode them to inspect, hide or recolor one, then describe its motion in plain language with{" "}
                  <span className="font-mono text-[15px] text-ink">lux3d.articulationAnimation</span>. Try the control below.
                </>
              }
              zh={
                <>
                  <span className="font-mono text-[15px] text-ink">lux3d.partSplit</span>{" "}
                  返回物体的语义部件。爆炸展开查看、隐藏或改色，再用一句大白话通过{" "}
                  <span className="font-mono text-[15px] text-ink">lux3d.articulationAnimation</span> 描述它怎么动。试试下面的控件。
                </>
              }
            />
          }
        >
          <ExplodeDemo />
        </Section>

        <Section
          n="09"
          name={<T en="Actors" zh="角色" />}
          title={<T en={`${ANIMATION_TOTAL} clips, any character.`} zh={`${ANIMATION_TOTAL} 个动作，任意角色。`} />}
          lead={
            <T
              en={
                <>
                  <span className="font-mono text-[15px] text-ink">humanoidAutoRig</span> puts a skeleton in a static mesh;{" "}
                  <span className="font-mono text-[15px] text-ink">humanoidAnimationRetarget</span> maps up to ten official
                  Lux3D clips onto it per job. The actor you play went through both: a G1-Turbo character, rigged with 52 joints
                  and given eight clips.
                </>
              }
              zh={
                <>
                  <span className="font-mono text-[15px] text-ink">humanoidAutoRig</span> 为静态网格装上骨骼；
                  <span className="font-mono text-[15px] text-ink">humanoidAnimationRetarget</span> 每个任务最多可把 10 个官方
                  Lux3D 动作重定向上去。你操控的角色两步都走过：一个 G1-Turbo 角色，绑定了 52 个关节，配上 8 个动作。
                </>
              }
            />
          }
        >
          <table className="table-scroll w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-line">
                <th className="label py-3 pr-4 font-medium">
                  <T en="Category" zh="类别" />
                </th>
                <th className="label w-16 py-3 pr-4 text-right font-medium">
                  <T en="Clips" zh="动作数" />
                </th>
                <th className="label hidden py-3 font-medium md:table-cell">
                  <T en="Examples" zh="示例" />
                </th>
              </tr>
            </thead>
            <tbody>
              {HUMANOID_ANIMATION_GROUPS.map((g) => (
                <tr key={g.id} className="border-b border-line">
                  <td className="py-3.5 pr-4 text-[15px] text-ink">
                    <T en={g.label} zh={GROUP_ZH[g.id] ?? g.label} />
                  </td>
                  <td className="py-3.5 pr-4 text-right font-mono text-[15px] text-ink tabular">{g.clips.length}</td>
                  <td className="hidden py-3.5 md:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {g.clips.slice(0, 4).map((c) => (
                        <span key={c.id} className="chip">
                          {c.id}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              <tr>
                <td className="py-3.5 pr-4 text-[15px] text-ink-2">
                  <T en="Total" zh="合计" />
                </td>
                <td className="py-3.5 pr-4 text-right font-mono text-[15px] text-accent tabular">{ANIMATION_TOTAL}</td>
                <td className="hidden md:table-cell" />
              </tr>
            </tbody>
          </table>
        </Section>

        <Section
          n="10"
          name={<T en="Director" zh="导演" />}
          title={<T en="Block the shot in 3D. Render it in LuxReal." zh="在 3D 里排好镜头，交给 LuxReal 出片。" />}
          lead={
            <T
              en="Each keyframe stores a camera position, look-at target, duration and shot prompt. Holorra plays them back as a Catmull-Rom flythrough over the live stage, grabs a reference frame per keyframe, and exports a storyboard pack for LuxReal's video creator."
              zh="每个关键帧记录镜头位置、注视点、时长和镜头提示词。Holorra 在实时舞台上以 Catmull-Rom 样条飞行回放，为每个关键帧截取参考画面，并导出分镜包交给 LuxReal 的视频创作工具。"
            />
          }
        >
          <div className="border border-line bg-canvas">
            <svg viewBox="0 0 900 260" className="block w-full" role="img" aria-label="A camera path through three keyframes">
              <defs>
                <pattern id="grid" width="45" height="45" patternUnits="userSpaceOnUse">
                  <path d="M45 0H0V45" fill="none" stroke="var(--color-line)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="900" height="260" fill="url(#grid)" />
              <path
                id="cam-path"
                d="M70 200 C190 70 330 50 440 125 S690 225 830 70"
                fill="none"
                stroke="var(--color-ink-3)"
                strokeWidth="1.5"
                strokeDasharray="5 6"
              />
              {[
                [70, 200, "01", "Entrance wide", "3.0s", "入口全景"],
                [440, 125, "02", "Hero appliance", "3.5s", "主角家电"],
                [830, 70, "03", "Rigged character", "3.0s", "绑骨角色"],
              ].map(([x, y, n, t, d, tz]) => (
                <g key={n as string} transform={`translate(${x} ${y})`}>
                  <path d="M0 -8 L8 0 L0 8 L-8 0 Z" fill="var(--color-canvas)" stroke="var(--color-accent)" strokeWidth="1.5" />
                  <text
                    x={(x as number) > 700 ? -14 : 14}
                    y={-14}
                    textAnchor={(x as number) > 700 ? "end" : "start"}
                    fill="var(--color-ink-2)"
                    fontSize="12"
                    fontFamily="var(--font-plex-mono), monospace"
                  >
                    <tspan className="i18n-en">
                      {n} · {t} · {d}
                    </tspan>
                    <tspan className="i18n-zh">
                      {n} · {tz} · {d}
                    </tspan>
                  </text>
                </g>
              ))}
              <g>
                <rect x="-9" y="-6" width="14" height="12" fill="var(--color-ink)" />
                <path d="M5 -3 L11 -6 L11 6 L5 3 Z" fill="var(--color-ink)" />
                <animateMotion dur="7s" repeatCount="indefinite" rotate="auto">
                  <mpath href="#cam-path" />
                </animateMotion>
              </g>
            </svg>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {(
              [
                ["keyframe", "Add keyframe", "添加关键帧"],
                ["play", "Play path", "播放路径"],
                ["export", "Export storyboard", "导出分镜"],
                ["external", "Open in LuxReal", "在 LuxReal 中打开"],
              ] as [GlyphName, string, string][]
            ).map(([g, t, tz]) => (
              <span key={t} className="chip">
                <Glyph name={g} size={12} />
                <T en={t} zh={tz} />
              </span>
            ))}
          </div>
        </Section>

        <Section
          n="11"
          name={<T en="Co-director" zh="AI 副导演" />}
          title={<T en="Describe the scene. Get the tool plan." zh="描述场景，拿到工具调用计划。" />}
          lead={
            <T
              en="The in-app co-director turns a plain-language brief into an ordered plan of Aholo MCP tool calls and updates the stage to match. The same MCP server is pre-configured in .mcp.json, so Claude Code or Cursor can drive SpatialGen and Lux3D directly."
              zh="应用内的 AI 副导演把一段大白话描述转成有序的 Aholo MCP 工具调用计划，并相应更新舞台。同一个 MCP 服务已在 .mcp.json 中配置好，Claude Code 或 Cursor 可以直接驱动 SpatialGen 和 Lux3D。"
            />
          }
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="border border-line bg-surface">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <Glyph name="terminal" size={14} className="text-ink-3" />
                <span className="font-mono text-[12px] text-ink-3">.mcp.json</span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-relaxed text-ink-2">
                {`{
  "mcpServers": {
    "aholo-sdk-mcp": {
      "command": "npx",
      "args": ["-y", "@manycore/aholo-sdk-mcp"],
      "env": { "AHOLO_API_KEY": "…" }
    }
  }
}`}
              </pre>
            </div>
            <div className="border border-line bg-surface">
              <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
                <Glyph name="chat" size={14} className="text-ink-3" />
                <span className="font-mono text-[12px] text-ink-3">brief → plan</span>
              </div>
              <div className="space-y-3 p-5 text-[13px]">
                <p className="text-ink">
                  <T
                    en="“Walk the actor to the espresso machine and open the hood.”"
                    zh="「让角色走到咖啡机前，打开顶盖。」"
                  />
                </p>
                <ol className="space-y-1.5 font-mono text-[12px] text-ink-2">
                  <li>
                    <span className="text-ink-3">1</span> lux3d_humanoid_animation_retarget
                  </li>
                  <li>
                    <span className="text-ink-3">2</span> lux3d_part_split
                  </li>
                  <li>
                    <span className="text-ink-3">3</span> lux3d_articulation_animation
                  </li>
                </ol>
                <Link href="/mcp" className="btn btn-sm mt-2">
                  <Glyph name="plug" size={14} />
                  <T en="Open the MCP hub" zh="打开 MCP 中心" />
                </Link>
              </div>
            </div>
          </div>
        </Section>

        {/* -------------------------------------------------------------- stack */}
        <Section
          id="stack"
          n="12"
          name={<T en="Stack" zh="技术栈" />}
          title={<T en="Official SDKs across the whole stack." zh="全栈使用官方 SDK。" />}
          lead={
            <T
              en={
                <>
                  No reimplemented renderer. The stage runs on @manycore/aholo-viewer, and server routes under{" "}
                  <span className="font-mono text-[15px] text-ink">/api/aholo/*</span> call the official World, Lux3D and
                  Asset clients with your key.
                </>
              }
              zh={
                <>
                  没有自研渲染器。舞台运行在 @manycore/aholo-viewer 上，服务端{" "}
                  <span className="font-mono text-[15px] text-ink">/api/aholo/*</span> 接口用你的密钥调用官方的 World、Lux3D 和
                  Asset 客户端。
                </>
              }
            />
          }
        >
          <table className="table-scroll w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-line">
                <th className="label py-3 pr-6 font-medium">
                  <T en="Package" zh="包" />
                </th>
                <th className="label py-3 pr-6 font-medium">
                  <T en="Version" zh="版本" />
                </th>
                <th className="label hidden py-3 font-medium md:table-cell">
                  <T en="Role in Holorra" zh="在 Holorra 中的作用" />
                </th>
              </tr>
            </thead>
            <tbody>
              {STACK.map(([pkg, ver, role]) => (
                <tr key={pkg} className="border-b border-line align-top">
                  <td className="py-4 pr-6 font-mono text-[13px] text-ink">{pkg}</td>
                  <td className="py-4 pr-6 font-mono text-[13px] text-ink-2 tabular">{ver}</td>
                  <td className="hidden py-4 text-[14px] leading-relaxed text-ink-2 md:table-cell">{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 flex gap-4 border-l-2 border-accent pl-5">
            <Glyph name="key" size={18} className="mt-0.5 text-ink-2" />
            <p className="max-w-3xl text-[14px] leading-relaxed text-ink-2">
              <T
                en={
                  <>
                    <span className="text-ink">Bring your own key.</span> Paste a labs.aholo.ai or labs.aholo.cn key in the
                    studio. It is sent per request as <span className="font-mono text-ink">x-aholo-api-key</span> with a COM / CN
                    region switch, so jobs run on your own credits.
                  </>
                }
                zh={
                  <>
                    <span className="text-ink">使用你自己的密钥。</span>在创作台中粘贴 labs.aholo.ai 或 labs.aholo.cn 的密钥，每次请求通过{" "}
                    <span className="font-mono text-ink">x-aholo-api-key</span> 发送，并可切换 COM / CN 区域，任务消耗的是你自己的额度。
                  </>
                }
              />
            </p>
          </div>
        </Section>

        {/* -------------------------------------------------------------- try */}
        <Section
          id="try"
          n="13"
          name={<T en="Try it" zh="试一试" />}
          title={<T en="A one-minute tour." zh="一分钟上手。" />}
          lead={
            <T
              en="Everything below works without an API key. Add one at the end to send live generation jobs."
              zh="下面所有操作都不需要 API 密钥。最后再加上密钥，就能发送实时生成任务。"
            />
          }
        >
          <Reveal as="ol" variant="stagger" className="grid border-t border-line md:grid-cols-2">
            {TRY.map((s, i) => (
              <li
                key={s.key}
                className="grid grid-cols-[40px_1fr] gap-3 border-b border-line py-5 md:odd:pr-8 md:even:border-l md:even:pl-8"
                style={{ "--i": i } as React.CSSProperties}
              >
                <span className="font-mono text-[13px] text-accent tabular">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="text-[15px] text-ink">{s.title}</div>
                  <div className="mt-1 text-[14px] leading-relaxed text-ink-2">{s.body}</div>
                </div>
              </li>
            ))}
          </Reveal>
        </Section>

        {/* -------------------------------------------------------------- closing */}
        <section className="border-t border-line">
          <div className="landing-wrap py-24 sm:py-32">
            <h2 className="max-w-4xl font-serif text-[48px] leading-[1] tracking-[-0.015em] text-ink sm:text-[76px]">
              <T en="Step onto the stage." zh="走上舞台。" />
            </h2>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
              <T
                en="A Gaussian Splatting world is already loaded and waiting. Walk in, brew a coffee, take something apart, frame your first shot."
                zh="一个高斯泼溅世界已经加载好在等你。走进去，冲杯咖啡，拆开点什么，拍下你的第一个镜头。"
              />
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={STUDIO} className="btn btn-primary btn-lg">
                <T en="Launch App" zh="启动应用" />
              </Link>
              <Link href={PLAY} className="btn btn-lg">
                <Glyph name="play" size={12} />
                <T en="Play the scene" zh="开始游玩" />
              </Link>
              <Link href="/report" className="btn btn-lg btn-ghost">
                <T en="Project report" zh="项目报告" />
              </Link>
              <Link href="/docs" className="btn btn-lg btn-ghost">
                <T en="Read the docs" zh="阅读文档" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------------------------------------- footer */}
      <footer className="border-t border-line">
        <div className="landing-wrap flex flex-wrap items-center gap-x-8 gap-y-4 py-8 text-[13px] text-ink-3">
          <Logo size={18} />
          <span>
            <T en="Built for the Manycore Aholo Global 3D AI Hackathon" zh="为群核 Aholo 全球 3D AI 黑客松打造" /> · #Manycorehackathon
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-5">
            <Link href={STUDIO} className="hover:text-ink">
              <T en="Studio" zh="创作台" />
            </Link>
            <Link href="/report" className="hover:text-ink">
              <T en="Report" zh="报告" />
            </Link>
            <Link href="/mcp" className="hover:text-ink">
              MCP
            </Link>
            <Link href="/docs" className="hover:text-ink">
              <T en="Docs" zh="文档" />
            </Link>
            <a href="https://labs.aholo.ai" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-ink">
              Aholo Labs <Glyph name="external" size={12} />
            </a>
            <a href="https://aholojs.dev" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-ink">
              aholojs.dev <Glyph name="external" size={12} />
            </a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
