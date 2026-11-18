import type { Metadata } from "next";
import type { ReactNode } from "react";
import { A, C, DocArticle, Fig, H2, OL, P, Table } from "@/components/docs/prose";
import { T, type L } from "@/lib/i18n";

export const metadata: Metadata = { title: "How it works" };

const STAGES: [string, L, L, ReactNode][] = [
  [
    "01",
    { en: "Generate the world", zh: "生成世界" },
    {
      en: "SpatialGen (prompt or image) or Aholo Reality (video, photos, Insta360)",
      zh: "SpatialGen（提示词或图片）或 Aholo Reality（视频、照片、Insta360）",
    },
    "world.generations.create · world.reconstructions.create",
  ],
  [
    "02",
    { en: "Split the parts", zh: "拆分部件" },
    {
      en: "Lux3D mesh from text or images, split into semantic parts, given joints from a sentence",
      zh: "用 Lux3D 从文本或图片生成网格，拆分为语义部件，再用一句话赋予关节",
    },
    "textTo3d · imgTo3d · partSplit · articulationAnimation",
  ],
  [
    "03",
    { en: "Rig the actors", zh: "为角色绑骨" },
    {
      en: "Skeleton and skin weights on a static humanoid, then official clips retargeted onto it",
      zh: "为静态人形网格加上骨骼与蒙皮权重，再把官方动作片段重定向上去",
    },
    "humanoidAutoRig · humanoidAnimationRetarget",
  ],
  [
    "04",
    { en: "Direct the scene", zh: "导演场景" },
    {
      en: "Camera keyframes, Catmull-Rom playback, a storyboard pack for LuxReal",
      zh: "镜头关键帧、Catmull-Rom 样条回放、交给 LuxReal 的分镜包",
    },
    <T key="c" en="in the studio · LuxReal hand-off" zh="在创作台内完成 · 交接给 LuxReal" />,
  ],
];

export default function HowItWorks() {
  return (
    <DocArticle
      href="/docs/how-it-works"
      title={<T en="How it works" zh="工作原理" />}
      lead={
        <T
          en={
            <>
              <strong>Four stages, one stage.</strong> Holorra chains the Aholo World and Lux3D APIs so the output of each step
              lands on the same WebGL scene as the next: a world to stand in, props that open, an actor that moves, and a camera
              that records it.
            </>
          }
          zh={
            <>
              <strong>四个阶段，一个舞台。</strong>Holorra 串联 Aholo World 与 Lux3D API，让每一步的输出都落在同一个 WebGL
              场景里，供下一步接着用：一个可以站进去的世界，能打开的道具，会动的角色，以及把这一切记录下来的镜头。
            </>
          }
        />
      }
    >
      <div className="mt-10 grid border-l border-t border-line sm:grid-cols-2">
        {STAGES.map(([n, title, body, calls]) => (
          <div key={n} className="border-b border-r border-line bg-canvas/60 p-5">
            <div className="font-mono text-[12px] text-accent">{n}</div>
            <div className="mt-3 text-[16px] font-medium text-ink">
              <T en={title.en} zh={title.zh} />
            </div>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">
              <T en={body.en} zh={body.zh} />
            </p>
            <div className="mt-3 font-mono text-[11.5px] leading-relaxed text-ink-3">{calls}</div>
          </div>
        ))}
      </div>

      <H2 id="one-scene">
        <T en="The life of one scene" zh="一个场景的完整历程" />
      </H2>
      <P>
        <T
          en="Here is the espresso machine you meet in the studio, followed from prompt to shot. Every step was a real job."
          zh="下面以创作台里的那台意式咖啡机为例，从提示词一路跟到成片镜头。每一步都是真实任务。"
        />
      </P>
      <OL>
        <li>
          <T
            en={
              <>
                <strong>Prompt to mesh.</strong> <C>lux3d.textTo3d.create</C> with the G1 engine returned a 229,788-triangle mesh
                with three PBR maps in 343 s (task 8353478). The same prompt on G1-Turbo took 151 s (task 8353472).
              </>
            }
            zh={
              <>
                <strong>提示词到网格。</strong>使用 G1 引擎调用 <C>lux3d.textTo3d.create</C>，343 s 后返回一个 229,788
                个三角面、带三张 PBR 贴图的网格（任务 8353478）。同一提示词用 G1-Turbo 耗时 151 s（任务 8353472）。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Mesh to parts.</strong> <C>lux3d.partSplit.create</C> on the G1 result returned four sub-meshes with the
                same total triangle count in 118 s (task 8354166).
              </>
            }
            zh={
              <>
                <strong>网格到部件。</strong>对 G1 结果调用 <C>lux3d.partSplit.create</C>，118 s
                后返回四个子网格，三角面总数保持不变（任务 8354166）。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Parts to joints.</strong> <C>lux3d.articulationAnimation.create</C> with &ldquo;The top brewing hood hinges
                open upward about its back edge while the front capsule drawer slides out&rdquo; returned a URDF in 298 s (task
                8354168): a revolute hood hinge (0 to 90°) and a prismatic drawer (0 to 0.233).
              </>
            }
            zh={
              <>
                <strong>部件到关节。</strong>以提示词「The top brewing hood hinges open upward about its back edge while the front
                capsule drawer slides out」（顶部冲泡盖沿后缘向上翻开，同时前方胶囊抽屉滑出）调用{" "}
                <C>lux3d.articulationAnimation.create</C>，298 s 后返回一个 URDF（任务 8354168）：盖子是一个旋转关节铰链（0 到
                90°），抽屉是一个滑动关节（0 到 0.233）。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Into the world.</strong> The studio reads that URDF at runtime, assembles the links and places the machine
                on the loft floor it finds in the voxel collision grid. In the SpatialGen coffee bar it stands on a table.
              </>
            }
            zh={
              <>
                <strong>放进世界。</strong>创作台在运行时读取这个 URDF，组装各个连杆，并把咖啡机放到从体素碰撞网格中找到的 Loft
                地面上。在 SpatialGen 咖啡吧里，它立在一张桌子上。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>An actor to use it.</strong> A G1-Turbo character in a strict T-pose was auto-rigged with 52 joints (task
                8355123), then given eight official clips by <C>humanoidAnimationRetarget</C> (task 8359816).
              </>
            }
            zh={
              <>
                <strong>让角色来用它。</strong>一个严格 T-pose 的 G1-Turbo 角色经自动绑骨得到 52 个关节（任务
                8355123），再通过 <C>humanoidAnimationRetarget</C> 获得八个官方动作片段（任务 8359816）。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Play and direct.</strong> In <A href="/docs/play">play mode</A> you walk the actor to the machine and press
                E: the hood and drawer open on the URDF joints while the actor plays <C>Interact</C>. Press K and the shot becomes
                a keyframe on the <A href="/docs/director">camera path</A>, ready for LuxReal.
              </>
            }
            zh={
              <>
                <strong>游玩与导演。</strong>在<A href="/docs/play">游玩模式</A>中，操控角色走到咖啡机旁按 E：盖子和抽屉沿 URDF
                关节打开，角色同时播放 <C>Interact</C>。按 K，当前画面就成为<A href="/docs/director">镜头路径</A>上的一个关键帧，可直接交给
                LuxReal。
              </>
            }
          />
        </li>
      </OL>

      <Fig
        src="/landing/play-brew.jpg"
        alt="Close-up of the articulated espresso machine with its drawer open during play mode"
        caption={
          <T
            en="Step 6 in the studio: the brew close-up, with the drawer out on drawer_front_joint."
            zh="创作台中的第 6 步：冲咖啡特写，抽屉沿 drawer_front_joint 滑出。"
          />
        }
      />

      <H2 id="layout">
        <T en="The studio at a glance" zh="创作台概览" />
      </H2>
      <Table
        head={["Area", "What it holds"]}
        rows={[
          [
            <strong key="h">
              <T en="Header" zh="顶栏" />
            </strong>,
            <T
              key="hv"
              en="The five world tabs, links to the report and MCP hub, render settings, and the API key field (COM or CN region)."
              zh="五个世界标签页、报告与 MCP 中心的链接、渲染设置，以及 API 密钥输入框（COM 或 CN 区域）。"
            />,
          ],
          [
            <strong key="l">
              <T en="Left dock" zh="左侧面板" />
            </strong>,
            <T
              key="lv"
              en="World, Lux3D and Scene tabs: SpatialGen and Reality jobs, every Lux3D method, the stage prop list, material transfer and export."
              zh="世界、Lux3D、场景三个标签页：SpatialGen 与 Reality 任务、全部 Lux3D 方法、舞台道具列表、材质迁移与导出。"
            />,
          ],
          [
            <strong key="s">
              <T en="Stage" zh="舞台" />
            </strong>,
            <T
              key="sv"
              en="The WebGL2 viewport. Toolbar: Play, camera mode (orbit, third person, first person, path), Keyframe, reset camera, Expand."
              zh="WebGL2 视口。工具栏：游玩、镜头模式（环绕、第三人称、第一人称、镜头路径）、关键帧、重置镜头、全屏。"
            />,
          ],
          [
            <strong key="r">
              <T en="Right dock" zh="右侧面板" />
            </strong>,
            <T
              key="rv"
              en="Parts (explode, articulation, part list), Actor (clip library and retargeting) and the Co-director."
              zh="部件（爆炸视图、关节化、部件列表）、角色（动作库与动画重定向）以及 AI 副导演。"
            />,
          ],
          [
            <strong key="b">
              <T en="Timeline" zh="时间轴" />
            </strong>,
            <T
              key="bv"
              en="The camera path: keyframes, Play path, copy prompt, storyboard JSON, Open in LuxReal."
              zh="镜头路径：关键帧、播放路径、复制提示词、分镜 JSON、在 LuxReal 中打开。"
            />,
          ],
        ]}
      />
      <P>
        <T
          en={
            <>
              On screens up to 900 px wide the docks move into a left drawer behind the burger button and the stage takes the full
              width. See <A href="/docs/play">Play mode</A> for the touch controls.
            </>
          }
          zh={
            <>
              在宽度不超过 900 px 的屏幕上，两侧面板会收进左侧抽屉（点汉堡菜单按钮打开），舞台占满整个宽度。触控操作见
              <A href="/docs/play">游玩模式</A>。
            </>
          }
        />
      </P>
    </DocArticle>
  );
}
