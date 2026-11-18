import type { Metadata } from "next";
import { ESPRESSO_PROMPT, SPATIALGEN_RESULT as SG } from "@/config/lux3d-results";
import { A, C, Callout, DocArticle, H2, P, Table } from "@/components/docs/prose";

export const metadata: Metadata = { title: "Real results" };

const RUNS: [string, string, string, string][] = [
  ["8353472", "textTo3d · G1-Turbo", "Espresso machine, 252,226 tris, 2 maps", "151 s"],
  ["8353478", "textTo3d · G1", "Same prompt, 229,788 tris, 3 PBR maps", "343 s"],
  ["8354166", "partSplit", "G1 mesh into 4 parts, same triangle count", "118 s"],
  ["8354168", "articulationAnimation", "URDF: revolute hood hinge (0 to 90°), prismatic drawer (0 to 0.233)", "298 s"],
  ["8353484", "textTo3d · G1-Turbo", "Courier character in an A-pose (attempt 1)", "119 s"],
  ["8354170", "humanoidAutoRig", "Attempt 1 rejected: RIG_ELIGIBILITY_FAILED", "315 s"],
  ["8354807", "textTo3d · G1-Turbo", "Character in a strict T-pose (attempt 2)", "≤ 197 s"],
  ["8355123", "humanoidAutoRig", "52-joint skeleton with skin weights", "81 s"],
  ["8355366", "humanoidAnimationRetarget", "First retarget: 5 clips (superseded)", "≤ 17 s"],
  ["8359816", "humanoidAnimationRetarget", "8 clips incl. Interact, Yes, Dance_Loop (the actor you play)", "≤ 17 s"],
];

export default function ResultsDoc() {
  return (
    <DocArticle
      href="/docs/results"
      title="Real results"
      lead={
        <>
          <strong>Eleven live Aholo jobs, every result inside the app.</strong> Ten Lux3D jobs and one SpatialGen world ran
          through Holorra&apos;s own <C>/api/aholo</C> routes on 18 November 2026. Their outputs are mirrored into the
          repository, so the app never depends on expiring result links.
        </>
      }
    >
      <H2 id="lux3d">Lux3D jobs</H2>
      <P>
        Times are wall-clock from submit to status 3 as seen by a 15 s poller, so they are accurate to about 15 s;
        &ldquo;≤&rdquo; marks an upper bound.
      </P>
      <Table
        head={["Task", "Method", "Result", "Time"]}
        rows={RUNS.map(([t, m, r, s]) => [
          <span key="t" className="font-mono tabular text-ink">{t}</span>,
          <C key="m">{m}</C>,
          r,
          <span key="s" className="font-mono tabular">{s}</span>,
        ])}
      />
      <P>
        The espresso prompt: &ldquo;{ESPRESSO_PROMPT}&rdquo;
      </P>

      <H2 id="spatialgen">SpatialGen world</H2>
      <Table
        head={["World", "Method", "Result", "Time"]}
        rows={[
          [
            <span key="w" className="font-mono text-ink">{SG.worldId}</span>,
            <C key="m">{SG.method}</C>,
            `${SG.title}, ${SG.splats.toLocaleString("en-US")} splats, ${SG.sizeMB} MB .spz, Z-up`,
            <span key="s" className="font-mono tabular">{SG.seconds} s</span>,
          ],
        ]}
      />
      <P>The prompt: &ldquo;{SG.input}&rdquo;</P>

      <H2 id="where">Where to see them</H2>
      <Table
        head={["Place", "What is there"]}
        rows={[
          [<A key="l" href="/lab">/lab</A>, "Every Lux3D result in a live viewer: turntable, explode, joint sliders, clip switching, the G1 vs G1-Turbo comparison, and both rig attempts."],
          [<A key="s" href="/studio">/studio</A>, "The articulated espresso machine and the retargeted actor in the worlds; the coffee bar as world 05."],
          [<A key="r" href="/report">/report</A>, "The same results as slides, with the process and comparisons."],
          [<C key="c">src/config/lux3d-results.ts</C>, "Task IDs, prompts, times, triangle counts and bounds, read from each GLB."],
          [<C key="a">public/assets/lux3d/</C>, "Web copies: textures resized to 1024 px JPEG with glTF-Transform, geometry untouched."],
        ]}
      />

      <Callout>
        Nothing on this page is a mock-up. If a number cannot be traced to a task ID, the GLB itself or the poller log, it is
        not here.
      </Callout>
    </DocArticle>
  );
}
