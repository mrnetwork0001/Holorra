import type { Metadata } from "next";
import { ESPRESSO_JOINTS, ESPRESSO_PARTS } from "@/config/lux3d-results";
import { A, C, Callout, DocArticle, Fig, H2, P, Table, UL } from "@/components/docs/prose";
import { T } from "@/lib/i18n";

export const metadata: Metadata = { title: "Parts & articulation" };

/** Chinese for the derived strings in the config tables (keyed by the English value). */
const PART_READING_ZH: Record<string, string> = {
  "Main body": "主体",
  "Side dial": "侧面旋钮",
  "Top section": "顶部",
  "Outer shell": "外壳",
};
const JOINT_TYPE_ZH: Record<string, string> = {
  revolute: "旋转关节（revolute）",
  prismatic: "滑动关节（prismatic）",
  fixed: "固定关节（fixed）",
};
const JOINT_AXIS_ZH: Record<string, string> = {
  "−x (hinge)": "−x（铰链）",
  "+z (slide)": "+z（滑动）",
  "follows drawer": "随抽屉移动",
};

export default function PartsDoc() {
  return (
    <DocArticle
      href="/docs/parts"
      title={<T en="Parts & articulation" zh="部件拆分与关节化" />}
      lead={
        <T
          en={
            <>
              <strong>A generated object should come apart and move.</strong> <C>lux3d.partSplit</C> breaks a mesh into semantic
              sub-meshes, and <C>lux3d.articulationAnimation</C> gives it joints from one sentence. Holorra lets you explode,
              isolate, recolor and hinge the result on the stage.
            </>
          }
          zh={
            <>
              <strong>生成的物体应该能拆开，也能动起来。</strong>
              <C>lux3d.partSplit</C> 把网格拆成语义子网格，<C>lux3d.articulationAnimation</C>{" "}
              用一句话为它加上关节。在 Holorra 的舞台上，你可以对结果做爆炸视图、单独显示、改色，并让铰链动起来。
            </>
          }
        />
      }
    >
      <H2 id="split">
        <T en="Part split" zh="部件拆分" />
      </H2>
      <P>
        <T
          en={
            <>
              Select the stage prop in the right dock and press <strong>Run part split</strong>, or send any GLB URL to{" "}
              <C>partSplit</C> from the Lux3D tab. Lux3D returns the parts as separate, unnamed meshes. On the G1 espresso machine
              (task 8354166) it returned four, with the same 229,788 triangles as the unsplit mesh:
            </>
          }
          zh={
            <>
              在右侧面板中选中舞台道具并点击<strong>运行部件拆分</strong>，或在 Lux3D 标签页中把任意 GLB URL 发给{" "}
              <C>partSplit</C>。Lux3D 返回的部件是彼此独立、没有命名的网格。对 G1 意式咖啡机（任务
              8354166），它返回了四个部件，三角面总数与拆分前相同，都是 229,788：
            </>
          }
        />
      </P>
      <Table
        head={["Part", "Our reading", "Triangles"]}
        rows={ESPRESSO_PARTS.map((p) => [
          <C key="m">{p.material}</C>,
          <T key="r" en={p.reading} zh={PART_READING_ZH[p.reading] ?? p.reading} />,
          <span key="t" className="font-mono tabular">{p.triangles.toLocaleString("en-US")}</span>,
        ])}
      />
      <Fig
        src="/landing/lux3d/parts.jpg"
        alt="The four parts of the espresso machine pulled apart"
        caption={
          <T
            en="The part-split result, exploded on the bench. Try it live at /lab."
            zh="部件拆分结果在测试台上的爆炸视图。可在 /lab 实时体验。"
          />
        }
      />

      <H2 id="explode">
        <T en="Explode, isolate, recolor" zh="爆炸、单独显示、改色" />
      </H2>
      <UL>
        <li>
          <T
            en={
              <>
                <strong>Explode (0 to 100%)</strong> pushes every part away from the model origin along the line through its
                bounding-box centre. Presets: Closed 0, Inspect 35, Service 65, CAD 100.
              </>
            }
            zh={
              <>
                <strong>爆炸视图（0 到 100%）</strong>
                ：沿模型原点与各部件包围盒中心的连线，把每个部件向外推开。预设：闭合 0、检视 35、检修 65、CAD 100。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Isolate:</strong> click a part on the stage or in the part list to select it; the eye toggles hide and show
                it.
              </>
            }
            zh={
              <>
                <strong>单独显示：</strong>在舞台上或部件列表中点击某个部件即可选中；点眼睛图标可隐藏或显示它。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Recolor:</strong> pick a swatch for the selected part to override its material colour on the stage. Reset
                clears every override.
              </>
            }
            zh={
              <>
                <strong>改色：</strong>为选中的部件选一个色块，即可在舞台上覆盖它的材质颜色。「重置」会清除所有覆盖。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Material transfer:</strong> the Lux3D tab sends a model and a reference image to{" "}
                <C>lux3d.materialTransfer.create</C> (version <C>v3.0-standard</C>) for a new PBR texture set.
              </>
            }
            zh={
              <>
                <strong>材质迁移：</strong>Lux3D 标签页把模型和一张参考图发送给{" "}
                <C>lux3d.materialTransfer.create</C>（版本 <C>v3.0-standard</C>），生成一套新的 PBR 贴图。
              </>
            }
          />
        </li>
      </UL>

      <H2 id="articulation">
        <T en="Articulation from a sentence" zh="一句话完成关节化" />
      </H2>
      <P>
        <T
          en={
            <>
              Type how the object should move and press <strong>Animate from prompt</strong>. We asked: &ldquo;The top brewing hood
              hinges open upward about its back edge while the front capsule drawer slides out.&rdquo; Lux3D returned a{" "}
              <C>robot.urdf</C> with one GLB per link (task 8354168, 298 s):
            </>
          }
          zh={
            <>
              输入物体应该如何运动，然后点击<strong>按提示词生成动画</strong>。我们的提示词是：「The top brewing hood hinges open
              upward about its back edge while the front capsule drawer slides out.」（顶部冲泡盖沿后缘向上翻开，同时前方胶囊抽屉滑出。）Lux3D
              返回了一个 <C>robot.urdf</C>，每个连杆对应一个 GLB（任务 8354168，298 s）：
            </>
          }
        />
      </P>
      <Table
        head={["Joint", "Type", "Child link", "Limit", "Axis"]}
        rows={ESPRESSO_JOINTS.map((j) => [
          <C key="n">{j.name}</C>,
          <T key="t" en={j.type} zh={JOINT_TYPE_ZH[j.type] ?? j.type} />,
          j.child,
          j.limit,
          <T key="a" en={j.axis} zh={JOINT_AXIS_ZH[j.axis] ?? j.axis} />,
        ])}
      />
      <P>
        <T
          en={
            <>
              The stage reads that URDF at runtime (<C>src/lib/urdf-assembly.ts</C>), builds the link tree with each joint&apos;s
              origin, and drives the revolute and prismatic joints every frame. While articulation is on, the joints swing through
              their range; in <A href="/docs/play">play mode</A>, brewing opens them.
            </>
          }
          zh={
            <>
              舞台在运行时读取这个 URDF（<C>src/lib/urdf-assembly.ts</C>
              ），按每个关节的原点构建连杆树，并逐帧驱动旋转关节和滑动关节。开启关节动画时，各关节会在活动范围内往复运动；在
              <A href="/docs/play">游玩模式</A>中，冲咖啡会把它们打开。
            </>
          }
        />
      </P>

      <H2 id="export">
        <T en="Export" zh="导出" />
      </H2>
      <P>
        <T
          en={
            <>
              <C>lux3d.multiFormatExport.create</C> converts a result to <C>usdz</C>, <C>fbx_zip</C>, <C>obj_zip</C>,{" "}
              <C>stl</C> or <C>3mf</C>, for AR Quick Look, game engines and 3D printing. Pick formats in the Export block of the
              Lux3D tab.
            </>
          }
          zh={
            <>
              <C>lux3d.multiFormatExport.create</C> 可以把结果转换为 <C>usdz</C>、<C>fbx_zip</C>、<C>obj_zip</C>、
              <C>stl</C> 或 <C>3mf</C>，用于 AR Quick Look、游戏引擎和 3D 打印。在 Lux3D 标签页的「导出」区域选择格式。
            </>
          }
        />
      </P>

      <Callout>
        <T
          en={
            <>
              Two of the three stage props (the patrol drone and the holo-terminal) are hand-built procedural previews used to show
              the inspector in other worlds. The app labels them &ldquo;procedural preview&rdquo;; only the espresso machine is a
              Lux3D output.
            </>
          }
          zh={
            <>
              三个舞台道具中有两个（巡逻无人机和全息终端）是手工搭建的程序化预览，用来在其他世界中展示部件检视面板。应用中会把它们标注为「程序化预览」；只有意式咖啡机是
              Lux3D 的输出。
            </>
          }
        />
      </Callout>
    </DocArticle>
  );
}
