import Link from "next/link";
import SiteNav from "@/components/brand/SiteNav";
import { Glyph } from "@/components/brand/Glyph";
import { ArticulationBench, ClipBench, PartsBench, ResultViewer } from "@/components/lab/LabViewers";
import {
  ARTICULATION_PROMPT,
  CHARACTER_PROMPT,
  CHARACTER_TPOSE_PROMPT,
  RETARGET_CLIPS,
  ESPRESSO_JOINTS,
  ESPRESSO_PARTS,
  ESPRESSO_PROMPT,
  LUX3D_RESULTS,
} from "@/config/lux3d-results";

export const metadata = {
  title: "Lux3D bench — Holorra",
  description: "Real Lux3D outputs generated through Holorra, inspected live in @manycore/aholo-viewer.",
};

const R = LUX3D_RESULTS;

function Block({ n, name, title, lead, children }: { n: string; name: string; title: string; lead: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-t border-line">
      <div className="landing-wrap grid gap-x-10 gap-y-6 py-16 sm:py-20 lg:grid-cols-[200px_1fr]">
        <div className="label flex items-center gap-2 self-start pt-2 lg:sticky lg:top-20">
          <span className="text-accent">{n}</span>
          <span className="h-px w-5 bg-line-strong" />
          {name}
        </div>
        <div className="min-w-0">
          <h2 className="max-w-3xl font-serif text-[34px] leading-[1.05] tracking-[-0.01em] text-ink sm:text-[44px]">{title}</h2>
          <div className="mt-4 max-w-2xl text-[16px] leading-relaxed text-ink-2">{lead}</div>
          <div className="mt-10">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Pending({ label, taskId, method }: { label: string; taskId: number; method: string }) {
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 border border-dashed border-line-strong bg-surface">
      <Glyph name="loader" size={18} className="text-ink-3" />
      <div className="text-[14px] text-ink">{label}</div>
      <div className="font-mono text-[11px] text-ink-3">
        {method} · task {taskId} · running
      </div>
    </div>
  );
}

export default function LabPage() {
  const runs = Object.values(R);
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SiteNav
        current="/lab"
        links={[
          { label: "Home", href: "/" },
          { label: "Studio", href: "/studio" },
          { label: "Lux3D bench", href: "/lab" },
          { label: "MCP", href: "/mcp" },
        ]}
      />

      <main>
        <section className="landing-wrap pb-14 pt-16 sm:pt-20">
          <div className="label flex items-center gap-2">
            <span className="dot dot-live" />
            Lux3D bench
          </div>
          <h1 className="mt-5 max-w-4xl font-serif text-[44px] leading-[1] tracking-[-0.015em] text-ink sm:text-[64px]">
            Real Lux3D output, inspected live.
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-2">
            Every model on this page was generated through Holorra&apos;s own <span className="font-mono text-[15px] text-ink">/api/aholo/lux3d</span>{" "}
            route with the official <span className="font-mono text-[15px] text-ink">@manycore/aholo-sdk-lux3d</span> on 18 November 2026, then
            loaded here in <span className="font-mono text-[15px] text-ink">@manycore/aholo-viewer</span>. Task IDs, timings and geometry stats
            are measured, not estimated.
          </p>

          {/* run log */}
          <div className="mt-12 overflow-x-auto">
            <table className="table-scroll w-full min-w-[760px] border-collapse text-left max-[900px]:min-w-0">
              <thead>
                <tr className="border-y border-line">
                  {["Task", "Method", "Engine", "Result", "Time", "Geometry"].map((h) => (
                    <th key={h} className="label py-3 pr-5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-b border-line">
                    <td className="py-3 pr-5 font-mono text-[12px] text-ink-2 tabular">{r.taskId}</td>
                    <td className="py-3 pr-5 font-mono text-[12px] text-ink">{r.method}</td>
                    <td className="py-3 pr-5 font-mono text-[12px] text-ink-2">{r.engine ?? "—"}</td>
                    <td className="py-3 pr-5 text-[13px] text-ink">{r.label}</td>
                    <td className="py-3 pr-5 font-mono text-[12px] text-ink tabular">{r.seconds} s</td>
                    <td className="py-3 pr-5 font-mono text-[12px] text-ink-2 tabular">
                      {r.triangles ? `${r.triangles.toLocaleString("en-US")} tris` : ""}
                      {r.meshes && r.meshes > 1 ? ` · ${r.meshes} parts` : ""}
                      {r.clips?.length ? ` · ${r.clips.length} clips` : ""}
                      {r.joints ? ` · ${r.joints} joints` : ""}
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-line">
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink-2 tabular">8354170</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink">lux3d.humanoidAutoRig.create</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink-2">—</td>
                  <td className="py-3 pr-5 text-[13px] text-ink">Rig of attempt-1 courier</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink tabular">315 s</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-err">failed · RIG_ELIGIBILITY_FAILED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <Block
          n="01"
          name="Engines"
          title="G1-Turbo drafts, G1 finishes."
          lead={
            <>
              One prompt, two engines. G1-Turbo returned in {R.espressoTurbo.seconds} s; G1 took {R.espressoG1.seconds} s and delivered an
              embedded PBR set ({R.espressoG1.textureMaps} texture maps against {R.espressoTurbo.textureMaps}).
              <span className="mt-3 block font-mono text-[12.5px] leading-relaxed text-ink-3">&ldquo;{ESPRESSO_PROMPT}&rdquo;</span>
            </>
          }
        >
          <div className="grid gap-6 md:grid-cols-2">
            <ResultViewer result={R.espressoTurbo} />
            <ResultViewer result={R.espressoG1} />
          </div>
        </Block>

        <Block
          n="02"
          name="Part split"
          title="One fused mesh in, four parts out."
          lead={
            <>
              <span className="font-mono text-[14px] text-ink">lux3d.partSplit</span> took the G1 mesh and returned it as{" "}
              {R.espressoParts.meshes} separate meshes in {R.espressoParts.seconds} s. The triangle count is unchanged, so this is a segmentation
              of the same surface, not a regeneration. Drag to explode it.
            </>
          }
        >
          <PartsBench result={R.espressoParts} parts={ESPRESSO_PARTS} />
        </Block>

        <Block
          n="03"
          name="Articulation"
          title="“The hood hinges open.”"
          lead={
            <>
              <span className="font-mono text-[14px] text-ink">lux3d.articulationAnimation</span> took the same G1 mesh and one sentence,
              and in {R.espressoArticulated.seconds} s returned a URDF robot: four named links and the two joints the sentence asked for, a
              revolute hood hinge and a prismatic drawer slide, with limits.
              <span className="mt-3 block font-mono text-[12.5px] leading-relaxed text-ink-3">&ldquo;{ARTICULATION_PROMPT}&rdquo;</span>
            </>
          }
        >
          <ArticulationBench result={R.espressoArticulated} joints={ESPRESSO_JOINTS} />
        </Block>

        <Block
          n="04"
          name="Character"
          title="Static mesh to rigged, animated actor."
          lead={
            <>
              A text prompt makes the character, <span className="font-mono text-[14px] text-ink">humanoidAutoRig</span> gives it a skeleton,
              and <span className="font-mono text-[14px] text-ink">humanoidAnimationRetarget</span> maps official clips onto it.
              <span className="mt-3 block font-mono text-[12.5px] leading-relaxed text-ink-3">Attempt 1: &ldquo;{CHARACTER_PROMPT}&rdquo;</span>
              <span className="mt-2 block font-mono text-[12.5px] leading-relaxed text-ink-3">Attempt 2: &ldquo;{CHARACTER_TPOSE_PROMPT}&rdquo;</span>
            </>
          }
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <ResultViewer result={R.characterStatic} aspect="aspect-[3/4]" />
              <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
                <span className="text-err">Attempt 1, rejected.</span> The stylised courier came back fine, but{" "}
                <span className="font-mono text-[12px] text-ink">humanoidAutoRig</span> refused it with{" "}
                <span className="font-mono text-[12px] text-ink">RIG_ELIGIBILITY_FAILED</span>.
              </p>
            </div>
            <div>
              <ResultViewer result={R.characterRigged} aspect="aspect-[3/4]" />
              <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
                <span className="text-ok">Attempt 2, rigged.</span> Regenerated in a strict T-pose; the auto-rig accepted it in{" "}
                {R.characterRigged.seconds} s and returned a {R.characterRigged.joints}-joint skeleton with skin weights.
              </p>
            </div>
            <div>
              <ClipBench result={R.characterAnimated} clips={RETARGET_CLIPS} />
              <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
                Five official clips retargeted in one job. The GLB names them animation_1…5; we map them in the order requested.
              </p>
            </div>
          </div>
        </Block>

        <section className="border-t border-line">
          <div className="landing-wrap flex flex-wrap items-center gap-4 py-14">
            <Link href="/studio" className="btn btn-primary btn-lg">
              Launch App
            </Link>
            <Link href="/report" className="btn btn-lg">
              Project report
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
