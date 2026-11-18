import Link from "next/link";
import { Glyph, type GlyphName } from "@/components/brand/Glyph";
import { Logo } from "@/components/brand/Logo";
import ExplodeDemo from "@/components/landing/ExplodeDemo";
import AmbientField from "@/components/landing/AmbientField";
import PipelineLoop from "@/components/landing/PipelineLoop";
import { CountUp, Reveal } from "@/components/landing/Reveal";
import SiteNav from "@/components/brand/SiteNav";
import { HUMANOID_ANIMATION_GROUPS } from "@/config/humanoid-animations";

const STUDIO = "/studio";
const ANIMATION_TOTAL = HUMANOID_ANIMATION_GROUPS.reduce((n, g) => n + g.clips.length, 0);

/* ----------------------------------------------------------------------------
 * Content (every number here is real: preset count, lod-meta.json, SDK exports)
 * ------------------------------------------------------------------------- */

const FIGURES = [
  { value: "4", label: "3DGS worlds, live on load" },
  { value: "41.8M", label: "splats in the largest LOD stream" },
  { value: "10", label: "Lux3D capabilities wired in" },
  { value: String(ANIMATION_TOTAL), label: "retargetable humanoid clips" },
  { value: "9", label: "live Lux3D jobs, all on the bench" },
];

const PIPELINE: { n: string; title: string; glyph: GlyphName; body: string; calls: string[] }[] = [
  {
    n: "01",
    title: "Generate the world",
    glyph: "world",
    body: "Prompt or photograph a space with SpatialGen, or reconstruct one from video, photos or Insta360 footage with Aholo Reality. It streams in as a walkable Gaussian Splatting field.",
    calls: ["world.generations.create", "world.reconstructions.create"],
  },
  {
    n: "02",
    title: "Split the parts",
    glyph: "split",
    body: "Forge props with Lux3D G1 or G1-Turbo, break them into semantic sub-meshes, and give them joints from one sentence.",
    calls: ["textTo3d", "imgTo3d", "partSplit", "articulationAnimation"],
  },
  {
    n: "03",
    title: "Rig the actors",
    glyph: "rig",
    body: `Auto-rig a humanoid mesh, retarget any of the ${ANIMATION_TOTAL} Lux3D clips onto it, and walk it through the world with voxel collision.`,
    calls: ["humanoidAutoRig", "humanoidAnimationRetarget"],
  },
  {
    n: "04",
    title: "Direct the scene",
    glyph: "spline",
    body: "Drop camera keyframes in the stage, play them back as a smooth spline, and export a storyboard pack for LuxReal video.",
    calls: ["Catmull-Rom path", "storyboard JSON", "LuxReal"],
  },
];

const WORLDS = [
  {
    code: "W-01",
    title: "Designer Smart Loft",
    img: "/landing/world-loft.jpg" as string | null,
    format: ".spz",
    detail: "Indoor apartment with a 336 × 112 × 296 voxel collision grid at 5 cm.",
  },
  {
    code: "W-02",
    title: "Juguo Urban Plaza",
    img: null,
    format: "chunk-LOD · .ply sky",
    detail: "41.8M splats across 5 LOD levels in 528 chunk files, with a 20 cm collision grid.",
  },
  {
    code: "W-03",
    title: "Grand Transit Concourse",
    img: "/landing/world-concourse.jpg",
    format: "chunk-LOD · .sog env",
    detail: "32.7M splats with degree-2 spherical harmonics, wrapped in a .sog environment.",
  },
  {
    code: "W-04",
    title: "Object Turntable",
    img: "/landing/world-bear.jpg",
    format: ".sog",
    detail: "A single dense object capture for close inspection next to meshes.",
  },
];

/** Stills of the real Lux3D results (captured from /lab, see src/config/lux3d-results.ts). */
const RESULT_FIGS = [
  { src: "/landing/lux3d/turbo.jpg", title: "Espresso machine · G1-Turbo", meta: "textTo3d · task 8353472 · 151 s · 252k tris" },
  { src: "/landing/lux3d/g1.jpg", title: "Same prompt · G1", meta: "textTo3d · task 8353478 · 343 s · 230k tris · 3 PBR maps" },
  { src: "/landing/lux3d/parts.jpg", title: "Part split · 4 parts, exploded", meta: "partSplit · task 8354166 · 118 s" },
  { src: "/landing/lux3d/artic-open.jpg", title: "“The hood hinges open”", meta: "articulationAnimation · task 8354168 · 298 s · URDF" },
  { src: "/landing/lux3d/char-rejected.jpg", title: "Attempt 1 · rig rejected", meta: "humanoidAutoRig · RIG_ELIGIBILITY_FAILED" },
  { src: "/landing/lux3d/char-rigged.jpg", title: "Attempt 2 · auto-rigged", meta: "humanoidAutoRig · task 8355123 · 81 s · 52 joints" },
  { src: "/landing/lux3d/char-walk.jpg", title: "Retargeted · Walk_Loop", meta: "humanoidAnimationRetarget · task 8355366 · 5 clips" },
];

function ResultFig({ src, title, meta, i, tall = false }: { src: string; title: string; meta: string; i: number; tall?: boolean }) {
  return (
    <figure style={{ "--i": i } as React.CSSProperties}>
      <div className={`overflow-hidden border border-line bg-canvas ${tall ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={title} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <figcaption className="mt-3">
        <div className="text-[14px] text-ink">{title}</div>
        <div className="mt-0.5 font-mono text-[11.5px] text-ink-3">{meta}</div>
      </figcaption>
    </figure>
  );
}

const STACK = [
  ["@manycore/aholo-viewer", "1.14.0", "WebGL2 stage: splat loading, chunk-LOD streaming, GLTF meshes, skeletal animation, tone-mapped compositing."],
  ["@manycore/aholo-sdk-world", "1.5.0", "SpatialGen generation and Aholo Reality reconstruction, with task status and history."],
  ["@manycore/aholo-sdk-lux3d", "1.10.0", "All 10 Lux3D methods: generation, four-view, concept art, part split, articulation, rig, retarget, material, export."],
  ["@manycore/aholo-sdk-asset", "1.4.0", "Uploads local media to Aholo's CDN for generation and reconstruction jobs."],
  ["@manycore/aholo-sdk-mcp", "1.10.0", "The Aholo MCP server, pre-wired in .mcp.json for Claude Code, Cursor and the in-app co-director."],
  ["LuxReal", "hand-off", "Camera paths and shot prompts exported as a storyboard pack for LuxReal's video creator."],
];

const TRY: { title: string; body: React.ReactNode }[] = [
  { title: "Launch the app", body: "The Smart Loft streams in from Manycore's CDN. No sign-up, no key." },
  { title: "Switch worlds", body: "Use the world tabs in the header to move between the four scenes." },
  { title: "Explode a prop", body: "Drag the explode control, select a part to isolate or recolor it, toggle articulation." },
  {
    title: "Walk it",
    body: (
      <>
        Choose third or first person and move with <span className="kbd">W</span> <span className="kbd">A</span>{" "}
        <span className="kbd">S</span> <span className="kbd">D</span>. <span className="kbd">Q</span>{" "}
        <span className="kbd">E</span> change height.
      </>
    ),
  },
  { title: "Direct a shot", body: "Add keyframes at a few viewpoints, play the path, then export the storyboard or open LuxReal." },
  { title: "Go live", body: "Add your labs.aholo.ai key under API key to send real SpatialGen and Lux3D jobs to your own account." },
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
  name: string;
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

function Figure({ src, alt, caption, n }: { src: string; alt: string; caption: React.ReactNode; n: number }) {
  return (
    <figure>
      <Reveal variant="figure" className="overflow-hidden border border-line bg-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="block h-auto w-full" />
      </Reveal>
      <figcaption className="mt-3 flex gap-3 text-[13px] text-ink-3">
        <span className="font-mono text-ink-2">Fig. {n}</span>
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
      <div className="mt-4 font-mono text-[11px] text-ink-2">528 chunks · 5 levels · 41.8M splats</div>
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
                Manycore Aholo Global 3D AI Hackathon
              </div>
              <h1
                className="rise mt-6 font-serif text-[46px] leading-[0.98] tracking-[-0.015em] text-ink sm:text-[64px] lg:text-[60px] xl:text-[72px]"
                style={{ "--d": "80ms" } as React.CSSProperties}
              >
                A directing stage for <br className="hidden sm:block" />
                <em className="text-ink-2">generated</em> 3D worlds.
              </h1>
              <p
                className="rise mt-7 max-w-xl text-[18px] leading-relaxed text-ink-2"
                style={{ "--d": "180ms" } as React.CSSProperties}
              >
                Holorra puts walkable Gaussian Splatting worlds, part-split and articulated props, rigged actors and a
                camera director on one WebGL stage in your browser. It is built on the Manycore Aholo stack.
              </p>
              <div className="rise mt-9 flex flex-wrap gap-3" style={{ "--d": "260ms" } as React.CSSProperties}>
                <Link href={STUDIO} className="btn btn-primary btn-lg">
                  Launch App
                </Link>
                <Link href="/report" className="btn btn-lg">
                  Read the report
                </Link>
              </div>
              <div
                className="rise mt-10 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11.5px] text-ink-3"
                style={{ "--d": "340ms" } as React.CSSProperties}
              >
                <span>WebGL2</span>
                <span>3D Gaussian Splatting</span>
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
              alt="The Holorra studio with a Gaussian Splatting loft on the stage, creation dock on the left and part inspector on the right."
              caption="The studio running the Designer Smart Loft. Real capture of the app, no mock-up."
            />
          </div>

          {/* figures strip */}
          <Reveal as="dl" variant="stagger" className="mt-16 grid grid-cols-2 border-l border-t border-line sm:grid-cols-3 lg:grid-cols-5">
            {FIGURES.map((f, i) => (
              <div
                key={f.label}
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
          name="Problem"
          title="Generated 3D usually ends as a statue in an empty room."
          lead="Text-to-3D gives you a mesh. It floats in a grey void, it is fused into one shell, it cannot move, and nobody can film it. Holorra treats a generated asset as the start of a scene."
        >
          <div className="grid border-t border-line md:grid-cols-2">
            {[
              ["Place", "A lone .glb on a grey grid.", "Props sit inside a photoreal splat world with collision you can walk on."],
              ["Parts", "One fused shell. Nothing opens.", "Semantic sub-meshes you can explode, isolate, recolor and hinge."],
              ["Motion", "Characters frozen in a T-pose.", `Auto-rigged actors with ${ANIMATION_TOTAL} retargetable clips.`],
              ["Camera", "A turntable at best.", "Keyframed camera paths that export to LuxReal for video."],
            ].map(([k, before, after]) => (
              <div key={k} className="grid grid-cols-[88px_1fr] gap-4 border-b border-line py-5 md:odd:pr-8 md:even:border-l md:even:pl-8">
                <div className="label pt-0.5">{k}</div>
                <div>
                  <div className="text-[14px] text-ink-3 line-through decoration-line-strong">{before}</div>
                  <div className="mt-1 text-[15px] text-ink">{after}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* -------------------------------------------------------------- pipeline */}
        <Section
          id="pipeline"
          n="02"
          name="Pipeline"
          title={
            <>
              Generate the world. Split the parts. Rig the actors. <span className="text-accent">Direct the scene.</span>
            </>
          }
          lead="Four stages, each backed by real Manycore SDK calls behind Holorra's /api/aholo routes. Every stage hands its output to the next on the same stage."
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
          n="03"
          name="Results"
          title="Real Lux3D output, not mock-ups."
          lead={
            <>
              Nine jobs ran through Holorra&apos;s own <span className="font-mono text-[15px] text-ink">/api/aholo/lux3d</span> route on
              18 November. Every image below is the asset Lux3D returned, rendered in @manycore/aholo-viewer, with its real task ID and
              wall-clock time.
            </>
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
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/lab" className="btn btn-lg">
              <Glyph name="mesh" size={16} />
              Inspect them live on the bench
            </Link>
            <span className="text-[13px] text-ink-3">Turntable, explode, joint sliders and clip switching on the real files.</span>
          </div>
        </Section>

        {/* -------------------------------------------------------------- worlds */}
        <Section
          id="worlds"
          n="04"
          name="Worlds"
          title="Four splat worlds, playable the moment it loads."
          lead="Live generation takes minutes, so Holorra opens on Gaussian Splatting scenes hosted on Manycore's CDN. Explore right away while your own jobs render."
        >
          <Reveal variant="stagger" className="grid gap-x-6 gap-y-12 sm:grid-cols-2">
            {WORLDS.map((w, i) => (
              <Link key={w.code} href={STUDIO} className="group block" style={{ "--i": i } as React.CSSProperties}>
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
                  <h3 className="text-[17px] font-medium text-ink group-hover:text-accent">{w.title}</h3>
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
          n="05"
          name="Hybrid stage"
          title="Radiance fields and meshes on one stage."
          lead="Splats carry the world's look; meshes carry everything you want to touch. Both render in a single @manycore/aholo-viewer scene, lights on the meshes and tone-mapped compositing on the splats."
        >
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <Figure
              n={2}
              src="/landing/hybrid-concourse.jpg"
              alt="A Gaussian Splatting rail yard with exploded mesh parts in front of it"
              caption="A 32.7M-splat LOD stream with exploded mesh parts in the same scene."
            />
            <ul className="divide-y divide-line border-y border-line self-start">
              {(
                [
                  ["lod", "Chunk-LOD streaming", "Loads splat chunks by distance and keeps each frame inside a splat budget."],
                  ["splat", "Direct splat files", ".spz, .sog and .ply for single scenes and object captures."],
                  ["voxel", "Voxel collision", "Sparse grids so actors stand on floors and stop at walls."],
                  ["mesh", "PBR meshes", "GLTF props and rigged characters lit inside the splat world."],
                ] as [GlyphName, string, string][]
              ).map(([g, t, b]) => (
                <li key={t} className="flex gap-4 py-4">
                  <Glyph name={g} size={18} className="mt-0.5 text-ink-2" />
                  <div>
                    <div className="text-[15px] text-ink">{t}</div>
                    <div className="mt-0.5 text-[14px] leading-relaxed text-ink-2">{b}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section
          n="06"
          name="Parts"
          title="Take any generated object apart."
          lead={
            <>
              <span className="font-mono text-[15px] text-ink">lux3d.partSplit</span> returns an object&apos;s semantic
              sub-meshes. Explode them to inspect, isolate or recolor one, then describe its motion in plain language with{" "}
              <span className="font-mono text-[15px] text-ink">lux3d.articulationAnimation</span>. Try the control below.
            </>
          }
        >
          <ExplodeDemo />
        </Section>

        <Section
          n="07"
          name="Actors"
          title={`${ANIMATION_TOTAL} clips, any character.`}
          lead={
            <>
              <span className="font-mono text-[15px] text-ink">humanoidAutoRig</span> puts a skeleton in a static mesh;{" "}
              <span className="font-mono text-[15px] text-ink">humanoidAnimationRetarget</span> maps up to ten official
              Lux3D clips onto it per job. Drive the actor with WASD in first or third person.
            </>
          }
        >
          <table className="table-scroll w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-line">
                <th className="label py-3 pr-4 font-medium">Category</th>
                <th className="label w-16 py-3 pr-4 text-right font-medium">Clips</th>
                <th className="label hidden py-3 font-medium md:table-cell">Examples</th>
              </tr>
            </thead>
            <tbody>
              {HUMANOID_ANIMATION_GROUPS.map((g) => (
                <tr key={g.id} className="border-b border-line">
                  <td className="py-3.5 pr-4 text-[15px] text-ink">{g.label}</td>
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
                <td className="py-3.5 pr-4 text-[15px] text-ink-2">Total</td>
                <td className="py-3.5 pr-4 text-right font-mono text-[15px] text-accent tabular">{ANIMATION_TOTAL}</td>
                <td className="hidden md:table-cell" />
              </tr>
            </tbody>
          </table>
        </Section>

        <Section
          n="08"
          name="Director"
          title="Block the shot in 3D. Render it in LuxReal."
          lead="Each keyframe stores a camera position, look-at target, duration and shot prompt. Holorra plays them back as a Catmull-Rom flythrough over the live stage, grabs a reference frame per keyframe, and exports a storyboard pack for LuxReal's video creator."
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
                [70, 200, "01", "Entrance wide", "3.0s"],
                [440, 125, "02", "Hero appliance", "3.5s"],
                [830, 70, "03", "Rigged character", "3.0s"],
              ].map(([x, y, n, t, d]) => (
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
                    {n} · {t} · {d}
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
                ["keyframe", "Add keyframe"],
                ["play", "Play path"],
                ["export", "Export storyboard"],
                ["external", "Open in LuxReal"],
              ] as [GlyphName, string][]
            ).map(([g, t]) => (
              <span key={t} className="chip">
                <Glyph name={g} size={12} />
                {t}
              </span>
            ))}
          </div>
        </Section>

        <Section
          n="09"
          name="Co-director"
          title="Describe the scene. Get the tool plan."
          lead="The in-app co-director turns a plain-language brief into an ordered plan of Aholo MCP tool calls and updates the stage to match. The same MCP server is pre-configured in .mcp.json, so Claude Code or Cursor can drive SpatialGen and Lux3D directly."
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
                <p className="text-ink">&ldquo;Put a robot in the loft and open the espresso machine.&rdquo;</p>
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
                  Open the MCP hub
                </Link>
              </div>
            </div>
          </div>
        </Section>

        {/* -------------------------------------------------------------- stack */}
        <Section
          id="stack"
          n="10"
          name="Stack"
          title="Official SDKs across the whole stack."
          lead={
            <>
              No reimplemented renderer. The stage runs on @manycore/aholo-viewer, and server routes under{" "}
              <span className="font-mono text-[15px] text-ink">/api/aholo/*</span> call the official World, Lux3D and
              Asset clients with your key.
            </>
          }
        >
          <table className="table-scroll w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-line">
                <th className="label py-3 pr-6 font-medium">Package</th>
                <th className="label py-3 pr-6 font-medium">Version</th>
                <th className="label hidden py-3 font-medium md:table-cell">Role in Holorra</th>
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
              <span className="text-ink">Bring your own key.</span> Paste a labs.aholo.ai or labs.aholo.cn key in the
              studio. It is sent per request as <span className="font-mono text-ink">x-aholo-api-key</span> with a COM / CN
              region switch, so jobs run on your own credits.
            </p>
          </div>
        </Section>

        {/* -------------------------------------------------------------- try */}
        <Section
          id="try"
          n="11"
          name="Try it"
          title="A one-minute tour."
          lead="Everything below works without an API key. Add one at the end to send live generation jobs."
        >
          <Reveal as="ol" variant="stagger" className="grid border-t border-line md:grid-cols-2">
            {TRY.map((s, i) => (
              <li
                key={s.title}
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
              Step onto the stage.
            </h2>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
              A Gaussian Splatting world is already loaded and waiting. Walk in, take something apart, frame your first shot.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={STUDIO} className="btn btn-primary btn-lg">
                Launch App
              </Link>
              <Link href="/report" className="btn btn-lg">
                Project report
              </Link>
              <Link href="/mcp" className="btn btn-lg btn-ghost">
                MCP hub
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------------------------------------- footer */}
      <footer className="border-t border-line">
        <div className="landing-wrap flex flex-wrap items-center gap-x-8 gap-y-4 py-8 text-[13px] text-ink-3">
          <Logo size={18} />
          <span>Built for the Manycore Aholo Global 3D AI Hackathon · #Manycorehackathon</span>
          <div className="ml-auto flex flex-wrap items-center gap-5">
            <Link href={STUDIO} className="hover:text-ink">
              Studio
            </Link>
            <Link href="/report" className="hover:text-ink">
              Report
            </Link>
            <Link href="/mcp" className="hover:text-ink">
              MCP
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
