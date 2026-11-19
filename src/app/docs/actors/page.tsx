import type { Metadata } from "next";
import { HUMANOID_ANIMATION_GROUPS } from "@/config/humanoid-animations";
import { CHARACTER_TPOSE_PROMPT, RETARGET_CLIPS } from "@/config/lux3d-results";
import { A, C, Callout, DocArticle, H2, OL, P, Table } from "@/components/docs/prose";
import { T, type L } from "@/lib/i18n";

export const metadata: Metadata = { title: "Actors & animation" };

const TOTAL = HUMANOID_ANIMATION_GROUPS.reduce((n, g) => n + g.clips.length, 0);

/** What each retargeted clip is used for on the stage, keyed by Lux3D animation ID. */
const USED_FOR: Record<string, L> = {
  Idle_Loop: { en: "standing still", zh: "站立不动" },
  Walk_Loop: { en: "walking", zh: "行走" },
  Jog_Fwd_Loop: { en: "Shift or a full joystick push", zh: "按住 Shift 或摇杆推到底" },
  Interact: { en: "brewing (E)", zh: "冲咖啡（E）" },
  Chest_Open: { en: "Actor tab", zh: "角色标签页" },
  Yes: { en: "Actor tab", zh: "角色标签页" },
  Dance_Loop: { en: "cheering (F)", zh: "欢呼（F）" },
  Sword_Attack: { en: "Actor tab", zh: "角色标签页" },
};

/** Chinese group labels, keyed by HUMANOID_ANIMATION_GROUPS[].id. */
const GROUP_ZH: Record<string, string> = {
  locomotion: "移动与穿越",
  parkour: "跑酷与杂技",
  social: "社交、对话与表演",
  interaction: "物体交互与劳作",
  combat: "战斗：近战、远程与魔法",
  damage: "受击反应与怪物",
};

export default function ActorsDoc() {
  return (
    <DocArticle
      href="/docs/actors"
      title={<T en="Actors & animation" zh="角色与动画" />}
      lead={
        <T
          en={
            <>
              <strong>The actor you play was generated, rigged and animated by Lux3D.</strong> A static character mesh went through{" "}
              <C>humanoidAutoRig</C> for a skeleton and <C>humanoidAnimationRetarget</C> for clips, and now walks the worlds on
              their voxel floors.
            </>
          }
          zh={
            <>
              <strong>你操控的角色由 Lux3D 生成、绑骨并赋予动画。</strong>一个静态角色网格先经过 <C>humanoidAutoRig</C>{" "}
              获得骨骼，再经过 <C>humanoidAnimationRetarget</C> 获得动作片段，如今能在各个世界的体素地面上行走。
            </>
          }
        />
      }
    >
      <H2 id="pipeline">
        <T en="From prompt to playable actor" zh="从提示词到可操控角色" />
      </H2>
      <OL>
        <li>
          <T
            en={
              <>
                <strong>Mesh.</strong> <C>textTo3d</C> on G1-Turbo with a prompt that asks for a strict T-pose (task 8354807):
                &ldquo;{CHARACTER_TPOSE_PROMPT}&rdquo;
              </>
            }
            zh={
              <>
                <strong>网格。</strong>用 G1-Turbo 调用 <C>textTo3d</C>，提示词要求严格的 T-pose（任务 8354807）：「
                {CHARACTER_TPOSE_PROMPT}」（大意：一名写实风格的成年人，严格 T-pose，双臂在肩高处水平伸直、掌心向下，双腿伸直并略微分开，穿合身的素色衣服和简单的鞋子，全身，面朝前方，无配饰、无道具、不戴帽子。）
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Skeleton.</strong> <C>humanoidAutoRig</C> added 52 joints and skin weights in 81 s (task 8355123).
              </>
            }
            zh={
              <>
                <strong>骨骼。</strong>
                <C>humanoidAutoRig</C> 用 81 s 添加了 52 个关节和蒙皮权重（任务 8355123）。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Clips.</strong> <C>humanoidAnimationRetarget</C> put eight official clips on that rig in one combined GLB
                (task 8359816, at most 17 s).
              </>
            }
            zh={
              <>
                <strong>动作片段。</strong>
                <C>humanoidAnimationRetarget</C> 把八个官方动作片段重定向到这套骨骼上，合并为一个 GLB（任务 8359816，耗时不超过 17
                s）。
              </>
            }
          />
        </li>
      </OL>
      <P>
        <T
          en={
            <>
              Our first character, a courier in an A-pose, was rejected by the rigger with <C>RIG_ELIGIBILITY_FAILED</C> (task
              8354170). Regenerating it in a strict T-pose fixed that. Both attempts are on the <A href="/lab">bench</A>.
            </>
          }
          zh={
            <>
              我们的第一个角色是一个 A-pose 的快递员，被绑骨服务以 <C>RIG_ELIGIBILITY_FAILED</C> 拒绝（任务
              8354170）。改为严格 T-pose 重新生成后，问题就解决了。两次尝试都可以在<A href="/lab">测试台</A>上查看。
            </>
          }
        />
      </P>

      <H2 id="clips">
        <T en="The eight clips on the actor" zh="角色身上的八个动作片段" />
      </H2>
      <P>
        <T
          en={
            <>
              The combined GLB names its clips <C>animation_1</C> to <C>animation_8</C>. They follow the order we requested; the
              five clips shared with an earlier retarget have identical lengths, which confirmed the mapping. The stage renames them
              on load.
            </>
          }
          zh={
            <>
              合并后的 GLB 把动作片段命名为 <C>animation_1</C> 到 <C>animation_8</C>
              ，顺序与我们请求的顺序一致；其中与早先一次重定向重合的五个片段时长完全相同，印证了这一对应关系。舞台在加载时会为它们重新命名。
            </>
          }
        />
      </P>
      <Table
        head={["Clip in the file", "Lux3D animation", "Length", "Used for"]}
        rows={RETARGET_CLIPS.map((c) => {
          const use = USED_FOR[c.id];
          return [
            <C key="c">{c.clip}</C>,
            <C key="i">{c.id}</C>,
            <span key="s" className="font-mono tabular">{c.seconds} s</span>,
            use ? <T key="u" en={use.en} zh={use.zh} /> : "",
          ];
        })}
      />

      <H2 id="library">
        <T en="The full clip library" zh="完整动作库" />
      </H2>
      <P>
        <T
          en={
            <>
              The Actor tab lists all {TOTAL} official Lux3D humanoid animations, searchable and grouped. The eight already on the actor are
              tagged ready and play at a click. The others are tagged as needing a retarget: selecting one and pressing Retarget
              calls <C>humanoidAnimationRetarget</C> for it (live with a key, a preview receipt without). One retarget job takes 1
              to 10 animation IDs.
            </>
          }
          zh={
            <>
              角色标签页列出全部 {TOTAL} 个官方 Lux3D 人形动画，支持搜索并按类别分组。已在角色身上的八个标为「可播放」，点击即播；其余标为「需重定向」，选中后点击「重定向」才会调用{" "}
              <C>humanoidAnimationRetarget</C>（有密钥时为实时调用，没有密钥时返回预览回执）。一个重定向任务可包含 1 到 10 个动画 ID。
            </>
          }
        />
      </P>
      <Table
        head={["Group", "Clips", "Examples"]}
        rows={HUMANOID_ANIMATION_GROUPS.map((g) => [
          <T key="g" en={g.label} zh={GROUP_ZH[g.id] ?? g.label} />,
          <span key="n" className="font-mono tabular">{g.clips.length}</span>,
          g.clips
            .slice(0, 3)
            .map((c) => c.id)
            .join(", "),
        ])}
      />

      <H2 id="stage">
        <T en="On the stage" zh="在舞台上" />
      </H2>
      <P>
        <T
          en={
            <>
              The actor is placed at the world&apos;s <C>actorSpot</C> (or just ahead of the spawn point) and dropped onto the voxel
              floor. Its glTF is flipped into the −Y-up frame, scaled to the preset height and driven by{" "}
              <C>Animation.AnimationMixer</C> from @manycore/aholo-viewer, one action per clip. Switching clips resets the next
              action before activating it, because <C>AnimationAction.reset()</C> in the viewer also deactivates the action.
            </>
          }
          zh={
            <>
              角色放在世界的 <C>actorSpot</C>（或出生点正前方），再落到体素地面上。它的 glTF 被翻转到 −Y
              向上的坐标系，缩放到预设高度，并由 @manycore/aholo-viewer 的 <C>Animation.AnimationMixer</C>{" "}
              驱动，每个动作片段对应一个 action。切换片段时，会先重置下一个 action 再激活它，因为查看器中的{" "}
              <C>AnimationAction.reset()</C> 也会把 action 停用。
            </>
          }
        />
      </P>

      <Callout>
        <T
          en={
            <>
              Manycore&apos;s demo robot and human GLBs were removed from the actor list: their root scales (1.78e-5 and 0.0035) made
              them invisible on this stage. The Lux3D actor is the only actor, and it is a real result.
            </>
          }
          zh={
            <>
              Manycore 的演示机器人和人物 GLB 已从角色列表中移除：它们的根节点缩放（1.78e-5 和 0.0035）导致它们在这个舞台上看不见。Lux3D
              角色是唯一的角色，而且是真实结果。
            </>
          }
        />
      </Callout>
    </DocArticle>
  );
}
