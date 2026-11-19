import Link from "next/link";
import SiteNav from "@/components/brand/SiteNav";
import { Glyph } from "@/components/brand/Glyph";
import { T } from "@/lib/i18n";
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
  SPATIALGEN_RESULT as SG,
} from "@/config/lux3d-results";

export const metadata = {
  title: "Lux3D bench — Holorra",
  description: "Real Lux3D outputs generated through Holorra, inspected live in @manycore/aholo-viewer.",
};

const R = LUX3D_RESULTS;

function Block({ n, name, title, lead, children }: { n: string; name: React.ReactNode; title: React.ReactNode; lead: React.ReactNode; children: React.ReactNode }) {
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
        <T en={<>{method} · task {taskId} · running</>} zh={<>{method} · 任务 {taskId} · 运行中</>} />
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
          { label: "Docs", href: "/docs" },
        ]}
      />

      <main>
        <section className="landing-wrap pb-14 pt-16 sm:pt-20">
          <div className="label flex items-center gap-2">
            <span className="dot dot-live" />
            <T en="Lux3D bench" zh="Lux3D 测试台" />
          </div>
          <h1 className="mt-5 max-w-4xl font-serif text-[44px] leading-[1] tracking-[-0.015em] text-ink sm:text-[64px]">
            <T en="Real Lux3D output, inspected live." zh="Lux3D 真实结果，实时检视。" />
          </h1>
          <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-2">
            <T
              en={
                <>
                  Every model on this page was generated through Holorra&apos;s own <span className="font-mono text-[15px] text-ink">/api/aholo/lux3d</span>{" "}
                  route with the official <span className="font-mono text-[15px] text-ink">@manycore/aholo-sdk-lux3d</span> on 18 November 2026, then
                  loaded here in <span className="font-mono text-[15px] text-ink">@manycore/aholo-viewer</span>. Task IDs, timings and geometry stats
                  are measured, not estimated.
                </>
              }
              zh={
                <>
                  本页每个模型都在 2026 年 11 月 18 日通过 Holorra 自己的 <span className="font-mono text-[15px] text-ink">/api/aholo/lux3d</span>{" "}
                  路由、调用官方 <span className="font-mono text-[15px] text-ink">@manycore/aholo-sdk-lux3d</span> 生成，再用{" "}
                  <span className="font-mono text-[15px] text-ink">@manycore/aholo-viewer</span> 加载到这里。任务 ID、耗时和几何统计全部是实测值，不是估算。
                </>
              }
            />
          </p>

          {/* run log */}
          <div className="mt-12 overflow-x-auto">
            <table className="table-scroll w-full min-w-[760px] border-collapse text-left max-[900px]:min-w-0">
              <thead>
                <tr className="border-y border-line">
                  {[
                    { en: "Task", zh: "任务" },
                    { en: "Method", zh: "方法" },
                    { en: "Engine", zh: "引擎" },
                    { en: "Result", zh: "结果" },
                    { en: "Time", zh: "耗时" },
                    { en: "Geometry", zh: "几何" },
                  ].map((h) => (
                    <th key={h.en} className="label py-3 pr-5 font-medium">
                      <T en={h.en} zh={h.zh} />
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
                      <T
                        en={
                          <>
                            {[
                              r.triangles ? `${r.triangles.toLocaleString("en-US")} tris` : "",
                              r.meshes && r.meshes > 1 ? `${r.meshes} parts` : "",
                              r.clips?.length ? `${r.clips.length} clips` : "",
                              r.joints ? `${r.joints} joints` : "",
                            ].filter(Boolean).join(" · ")}
                          </>
                        }
                        zh={
                          <>
                            {[
                              r.triangles ? `${r.triangles.toLocaleString("en-US")} 个三角面` : "",
                              r.meshes && r.meshes > 1 ? `${r.meshes} 个部件` : "",
                              r.clips?.length ? `${r.clips.length} 个动作片段` : "",
                              r.joints ? `${r.joints} 个关节` : "",
                            ].filter(Boolean).join(" · ")}
                          </>
                        }
                      />
                    </td>
                  </tr>
                ))}
                <tr className="border-b border-line">
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink-2 tabular">8354170</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink">lux3d.humanoidAutoRig.create</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink-2">—</td>
                  <td className="py-3 pr-5 text-[13px] text-ink">
                    <T en="Rig of attempt-1 courier" zh="为第 1 次尝试的快递员角色绑骨" />
                  </td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink tabular">315 s</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-err">
                    <T en="failed" zh="失败" /> · RIG_ELIGIBILITY_FAILED
                  </td>
                </tr>
                <tr className="border-b border-line">
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink-2 tabular">8355366</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink">lux3d.humanoidAnimationRetarget.create</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink-2">—</td>
                  <td className="py-3 pr-5 text-[13px] text-ink">
                    <T en="First retarget (5 clips), superseded by 8359816" zh="首次动画重定向（5 个动作片段），已由 8359816 取代" />
                  </td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink tabular">17 s</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink-2">
                    <T en="52 joints · 5 clips" zh="52 个关节 · 5 个动作片段" />
                  </td>
                </tr>
                <tr className="border-b border-line">
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink-2">{SG.worldId}</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink">world.generations.create</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink-2">SpatialGen</td>
                  <td className="py-3 pr-5 text-[13px] text-ink">
                    <T
                      en={
                        <>
                          {SG.title} world,{" "}
                          <Link href="/studio?world=spatialgen-coffee-bar" className="text-accent hover:underline">
                            world 05 in the studio
                          </Link>
                        </>
                      }
                      zh={
                        <>
                          {SG.title} 世界，即
                          <Link href="/studio?world=spatialgen-coffee-bar" className="text-accent hover:underline">
                            创作台里的世界 05
                          </Link>
                        </>
                      }
                    />
                  </td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink tabular">{SG.seconds} s</td>
                  <td className="py-3 pr-5 font-mono text-[12px] text-ink-2 tabular"><T en={`${SG.splats.toLocaleString("en-US")} splats`} zh={`${SG.splats.toLocaleString("en-US")} 个高斯点`} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <Block
          n="01"
          name={<T en="Engines" zh="引擎" />}
          title={<T en="G1-Turbo drafts, G1 finishes." zh="G1-Turbo 打草稿，G1 出成品。" />}
          lead={
            <>
              <T
                en={
                  <>
                    One prompt, two engines. G1-Turbo returned in {R.espressoTurbo.seconds} s; G1 took {R.espressoG1.seconds} s and delivered an
                    embedded PBR set ({R.espressoG1.textureMaps} texture maps against {R.espressoTurbo.textureMaps}).
                  </>
                }
                zh={
                  <>
                    同一条提示词，两个引擎。G1-Turbo 用时 {R.espressoTurbo.seconds} s 返回；G1 用时 {R.espressoG1.seconds} s，交付了一套内嵌的
                    PBR 贴图（{R.espressoG1.textureMaps} 张纹理贴图，G1-Turbo 只有 {R.espressoTurbo.textureMaps} 张）。
                  </>
                }
              />
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
          name={<T en="Part split" zh="部件拆分" />}
          title={<T en="One fused mesh in, four parts out." zh="输入一个整体网格，输出四个部件。" />}
          lead={
            <T
              en={
                <>
                  <span className="font-mono text-[14px] text-ink">lux3d.partSplit</span> took the G1 mesh and returned it as{" "}
                  {R.espressoParts.meshes} separate meshes in {R.espressoParts.seconds} s. The triangle count is unchanged, so this is a segmentation
                  of the same surface, not a regeneration. Drag to explode it.
                </>
              }
              zh={
                <>
                  <span className="font-mono text-[14px] text-ink">lux3d.partSplit</span> 接收 G1 网格，用时 {R.espressoParts.seconds} s
                  把它拆成 {R.espressoParts.meshes} 个独立网格返回。三角面数没有变化，说明这是对同一表面的分割，而不是重新生成。拖动滑块即可爆炸展开。
                </>
              }
            />
          }
        >
          <PartsBench result={R.espressoParts} parts={ESPRESSO_PARTS} />
        </Block>

        <Block
          n="03"
          name={<T en="Articulation" zh="关节化" />}
          title={<T en="“The hood hinges open.”" zh="「顶盖沿铰链掀开。」" />}
          lead={
            <>
              <T
                en={
                  <>
                    <span className="font-mono text-[14px] text-ink">lux3d.articulationAnimation</span> took the same G1 mesh and one sentence,
                    and in {R.espressoArticulated.seconds} s returned a URDF robot: four named links and the two joints the sentence asked for, a
                    revolute hood hinge and a prismatic drawer slide, with limits.
                  </>
                }
                zh={
                  <>
                    <span className="font-mono text-[14px] text-ink">lux3d.articulationAnimation</span> 接收同一个 G1 网格和一句话，用时{" "}
                    {R.espressoArticulated.seconds} s 返回一个 URDF 机器人：4 个具名连杆，以及这句话要求的 2 个关节，即顶盖铰链（旋转关节）和抽屉滑轨（滑动关节），并带运动限位。
                  </>
                }
              />
              <span className="mt-3 block font-mono text-[12.5px] leading-relaxed text-ink-3">&ldquo;{ARTICULATION_PROMPT}&rdquo;</span>
            </>
          }
        >
          <ArticulationBench result={R.espressoArticulated} joints={ESPRESSO_JOINTS} />
        </Block>

        <Block
          n="04"
          name={<T en="Character" zh="角色" />}
          title={<T en="Static mesh to rigged, animated actor." zh="从静态网格到绑好骨、能动起来的角色。" />}
          lead={
            <>
              <T
                en={
                  <>
                    A text prompt makes the character, <span className="font-mono text-[14px] text-ink">humanoidAutoRig</span> gives it a skeleton,
                    and <span className="font-mono text-[14px] text-ink">humanoidAnimationRetarget</span> maps official clips onto it.
                  </>
                }
                zh={
                  <>
                    一条文本提示词生成角色，<span className="font-mono text-[14px] text-ink">humanoidAutoRig</span> 为它装上骨骼，
                    <span className="font-mono text-[14px] text-ink">humanoidAnimationRetarget</span> 再把官方动作片段映射到它身上。
                  </>
                }
              />
              <span className="mt-3 block font-mono text-[12.5px] leading-relaxed text-ink-3">
                <T en="Attempt 1: " zh="第 1 次尝试：" />
                &ldquo;{CHARACTER_PROMPT}&rdquo;
              </span>
              <span className="mt-2 block font-mono text-[12.5px] leading-relaxed text-ink-3">
                <T en="Attempt 2: " zh="第 2 次尝试：" />
                &ldquo;{CHARACTER_TPOSE_PROMPT}&rdquo;
              </span>
            </>
          }
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <div>
              <ResultViewer result={R.characterStatic} aspect="aspect-[3/4]" />
              <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
                <T
                  en={
                    <>
                      <span className="text-err">Attempt 1, rejected.</span> The stylised courier came back fine, but{" "}
                      <span className="font-mono text-[12px] text-ink">humanoidAutoRig</span> refused it with{" "}
                      <span className="font-mono text-[12px] text-ink">RIG_ELIGIBILITY_FAILED</span>.
                    </>
                  }
                  zh={
                    <>
                      <span className="text-err">第 1 次尝试，被拒。</span>风格化的快递员模型本身生成正常，但{" "}
                      <span className="font-mono text-[12px] text-ink">humanoidAutoRig</span> 以{" "}
                      <span className="font-mono text-[12px] text-ink">RIG_ELIGIBILITY_FAILED</span> 拒绝了它。
                    </>
                  }
                />
              </p>
            </div>
            <div>
              <ResultViewer result={R.characterRigged} aspect="aspect-[3/4]" />
              <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
                <T
                  en={
                    <>
                      <span className="text-ok">Attempt 2, rigged.</span> Regenerated in a strict T-pose; the auto-rig accepted it in{" "}
                      {R.characterRigged.seconds} s and returned a {R.characterRigged.joints}-joint skeleton with skin weights.
                    </>
                  }
                  zh={
                    <>
                      <span className="text-ok">第 2 次尝试，绑骨成功。</span>改为严格的 T-pose 重新生成后，自动绑骨用时 {R.characterRigged.seconds} s
                      接受了它，返回一副带蒙皮权重、共 {R.characterRigged.joints} 个关节的骨骼。
                    </>
                  }
                />
              </p>
            </div>
            <div>
              <ClipBench result={R.characterAnimated} clips={RETARGET_CLIPS} />
              <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
                <T
                  en="Eight official clips retargeted in one 17 s job, including Interact and Chest_Open for the studio's play mode. The GLB names them animation_1…8; we map them in the order requested."
                  zh="一个 17 s 的任务就完成了 8 个官方动作片段的重定向，其中 Interact 和 Chest_Open 用于创作台的游玩模式。GLB 里这些片段名为 animation_1…8，我们按请求时的顺序一一对应。"
                />
              </p>
            </div>
          </div>
        </Block>

        <section className="border-t border-line">
          <div className="landing-wrap flex flex-wrap items-center gap-4 py-14">
            <Link href="/studio" className="btn btn-primary btn-lg">
              <T en="Launch App" zh="启动应用" />
            </Link>
            <Link href="/report" className="btn btn-lg">
              <T en="Project report" zh="项目报告" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
