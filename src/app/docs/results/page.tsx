import type { Metadata } from "next";
import { ESPRESSO_PROMPT, SPATIALGEN_RESULT as SG } from "@/config/lux3d-results";
import { A, C, Callout, DocArticle, H2, P, Table } from "@/components/docs/prose";
import { T, type L } from "@/lib/i18n";

export const metadata: Metadata = { title: "Real results" };

const RUNS: [string, string, L, string][] = [
  ["8353472", "textTo3d · G1-Turbo", { en: "Espresso machine, 252,226 tris, 2 maps", zh: "意式咖啡机，252,226 个三角面，2 张贴图" }, "151 s"],
  ["8353478", "textTo3d · G1", { en: "Same prompt, 229,788 tris, 3 PBR maps", zh: "同一提示词，229,788 个三角面，3 张 PBR 贴图" }, "343 s"],
  ["8354166", "partSplit", { en: "G1 mesh into 4 parts, same triangle count", zh: "把 G1 网格拆成 4 个部件，三角面数不变" }, "118 s"],
  [
    "8354168",
    "articulationAnimation",
    {
      en: "URDF: revolute hood hinge (0 to 90°), prismatic drawer (0 to 0.233)",
      zh: "URDF：顶盖铰链为旋转关节（0 至 90°），抽屉为滑动关节（0 至 0.233）",
    },
    "298 s",
  ],
  ["8353484", "textTo3d · G1-Turbo", { en: "Courier character in an A-pose (attempt 1)", zh: "A-pose 的快递员角色（第 1 次尝试）" }, "119 s"],
  ["8354170", "humanoidAutoRig", { en: "Attempt 1 rejected: RIG_ELIGIBILITY_FAILED", zh: "第 1 次尝试被拒：RIG_ELIGIBILITY_FAILED" }, "315 s"],
  ["8354807", "textTo3d · G1-Turbo", { en: "Character in a strict T-pose (attempt 2)", zh: "严格 T-pose 的角色（第 2 次尝试）" }, "≤ 197 s"],
  ["8355123", "humanoidAutoRig", { en: "52-joint skeleton with skin weights", zh: "52 个关节的骨骼，带蒙皮权重" }, "81 s"],
  ["8355366", "humanoidAnimationRetarget", { en: "First retarget: 5 clips (superseded)", zh: "首次重定向：5 个动作片段（已被取代）" }, "≤ 17 s"],
  [
    "8359816",
    "humanoidAnimationRetarget",
    {
      en: "8 clips incl. Interact, Yes, Dance_Loop (the actor you play)",
      zh: "8 个动作片段，含 Interact、Yes、Dance_Loop（即你操控的角色）",
    },
    "≤ 17 s",
  ],
];

export default function ResultsDoc() {
  return (
    <DocArticle
      href="/docs/results"
      title={<T en="Real results" zh="真实结果" />}
      lead={
        <T
          en={
            <>
              <strong>Eleven live Aholo jobs, every result inside the app.</strong> Ten Lux3D jobs and one SpatialGen world ran
              through Holorra&apos;s own <C>/api/aholo</C> routes on 18 November 2026. Their outputs are mirrored into the
              repository, so the app never depends on expiring result links.
            </>
          }
          zh={
            <>
              <strong>11 个实时 Aholo 任务，每个结果都能在应用里看到。</strong>2026 年 11 月 18 日，10 个 Lux3D 任务和 1 个 SpatialGen
              世界经由 Holorra 自己的 <C>/api/aholo</C> 接口运行完成。产出已镜像到代码仓库中，应用因此不依赖会过期的结果链接。
            </>
          }
        />
      }
    >
      <H2 id="lux3d">
        <T en="Lux3D jobs" zh="Lux3D 任务" />
      </H2>
      <P>
        <T
          en={
            <>
              Times are wall-clock from submit to status 3 as seen by a 15 s poller, so they are accurate to about 15 s;
              &ldquo;≤&rdquo; marks an upper bound.
            </>
          }
          zh={
            <>
              耗时为从提交到状态 3 的实际时间，由每 15 s 轮询一次的脚本观测，因此精度约为 15 s；「≤」表示上限。
            </>
          }
        />
      </P>
      <Table
        head={["Task", "Method", "Result", "Time"]}
        rows={RUNS.map(([t, m, r, s]) => [
          <span key="t" className="font-mono tabular text-ink">{t}</span>,
          <C key="m">{m}</C>,
          <T key="r" en={r.en} zh={r.zh} />,
          <span key="s" className="font-mono tabular">{s}</span>,
        ])}
      />
      <P>
        <T en={<>The espresso prompt: &ldquo;{ESPRESSO_PROMPT}&rdquo;</>} zh={<>意式咖啡机的提示词：「{ESPRESSO_PROMPT}」</>} />
      </P>

      <H2 id="spatialgen">
        <T en="SpatialGen world" zh="SpatialGen 世界" />
      </H2>
      <Table
        head={["World", "Method", "Result", "Time"]}
        rows={[
          [
            <span key="w" className="font-mono text-ink">{SG.worldId}</span>,
            <C key="m">{SG.method}</C>,
            <T
              key="r"
              en={`${SG.title}, ${SG.splats.toLocaleString("en-US")} splats, ${SG.sizeMB} MB .spz, Z-up`}
              zh={`北欧风咖啡吧（${SG.title}），${SG.splats.toLocaleString("en-US")} 个高斯点，${SG.sizeMB} MB .spz，Z 轴朝上`}
            />,
            <span key="s" className="font-mono tabular">{SG.seconds} s</span>,
          ],
        ]}
      />
      <P>
        <T en={<>The prompt: &ldquo;{SG.input}&rdquo;</>} zh={<>提示词：「{SG.input}」</>} />
      </P>

      <H2 id="where">
        <T en="Where to see them" zh="在哪里查看" />
      </H2>
      <Table
        head={["Place", "What is there"]}
        rows={[
          [
            <A key="l" href="/lab">/lab</A>,
            <T
              key="ld"
              en="Every Lux3D result in a live viewer: turntable, explode, joint sliders, clip switching, the G1 vs G1-Turbo comparison, and both rig attempts."
              zh="在实时查看器中展示每个 Lux3D 结果：转台、爆炸视图、关节滑块、动作片段切换、G1 与 G1-Turbo 对比，以及两次绑骨尝试。"
            />,
          ],
          [
            <A key="s" href="/studio">/studio</A>,
            <T
              key="sd"
              en="The articulated espresso machine and the retargeted actor in the worlds; the coffee bar as world 05."
              zh="关节化的意式咖啡机和完成动画重定向的角色都放在世界里；咖啡吧即世界 05。"
            />,
          ],
          [
            <A key="r" href="/report">/report</A>,
            <T key="rd" en="The same results as slides, with the process and comparisons." zh="以幻灯片形式呈现同样的结果，并附上过程与对比。" />,
          ],
          [
            <C key="c">src/config/lux3d-results.ts</C>,
            <T
              key="cd"
              en="Task IDs, prompts, times, triangle counts and bounds, read from each GLB."
              zh="任务 ID、提示词、耗时，以及从各个 GLB 读取的三角面数和包围盒。"
            />,
          ],
          [
            <C key="a">public/assets/lux3d/</C>,
            <T
              key="ad"
              en="Web copies: textures resized to 1024 px JPEG with glTF-Transform, geometry untouched."
              zh="网页用副本：用 glTF-Transform 把纹理缩放为 1024 px JPEG，几何体保持不变。"
            />,
          ],
        ]}
      />

      <Callout>
        <T
          en={
            <>
              Nothing on this page is a mock-up. If a number cannot be traced to a task ID, the GLB itself or the poller log, it is
              not here.
            </>
          }
          zh={
            <>
              本页没有任何虚构的示意数据。凡是无法追溯到任务 ID、GLB 文件本身或轮询日志的数字，都不会出现在这里。
            </>
          }
        />
      </Callout>
    </DocArticle>
  );
}
