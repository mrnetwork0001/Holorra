import type { Metadata } from "next";
import { A, C, Callout, DocArticle, Fig, H2, Kbd, OL, P, Table, UL } from "@/components/docs/prose";
import { T } from "@/lib/i18n";

export const metadata: Metadata = { title: "Play mode" };

export default function PlayDoc() {
  return (
    <DocArticle
      href="/docs/play"
      title={<T en="Play mode" zh="游玩模式" />}
      lead={
        <T
          en={
            <>
              <strong>Press Play and the studio becomes a one-minute scene quest.</strong> You steer the auto-rigged Lux3D actor in
              third person, walk it through the splat loft on its voxel floor, and use the espresso machine Lux3D generated and
              articulated. Every moving part is a real result.
            </>
          }
          zh={
            <>
              <strong>按下「游玩」，创作台就变成一个一分钟的场景任务。</strong>你以第三人称操控自动绑骨的 Lux3D
              角色，沿体素地面穿过高斯泼溅构成的 Loft，并使用由 Lux3D 生成并完成关节化的意式咖啡机。每个会动的部件都是真实结果。
            </>
          }
        />
      }
    >
      <P>
        <T
          en={
            <>
              Start from the <strong>Play</strong> button at the top of the stage, or open <A href="/studio?play=1">/studio?play=1</A>{" "}
              to start the quest as soon as the world and the actor have loaded. Exit leaves play mode and keeps the camera where it
              is.
            </>
          }
          zh={
            <>
              点击舞台顶部的<strong>游玩</strong>按钮开始，或打开 <A href="/studio?play=1">/studio?play=1</A>
              ，世界和角色加载完成后任务会自动开始。点「退出」离开游玩模式，镜头保持在当前位置。
            </>
          }
        />
      </P>

      <H2 id="quest">
        <T en="The quest" zh="任务流程" />
      </H2>
      <OL>
        <li>
          <T
            en={
              <>
                <strong>Walk to the espresso machine.</strong> The step completes once the actor is within about a metre of it.
              </>
            }
            zh={
              <>
                <strong>走到咖啡机旁。</strong>角色走到距离咖啡机约一米以内时，这一步即完成。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Brew a coffee.</strong> Press <Kbd>E</Kbd> near the machine. The actor turns to face it and plays{" "}
                <C>Interact</C>; the camera cuts to a close-up for about three seconds while <C>hood_top_joint</C> swings the hood
                up and <C>drawer_front_joint</C> slides the drawer out, then blends back.
              </>
            }
            zh={
              <>
                <strong>冲一杯咖啡。</strong>在咖啡机附近按 <Kbd>E</Kbd>。角色转身面向咖啡机并播放 <C>Interact</C>
                ；镜头切到约三秒的特写，<C>hood_top_joint</C> 把盖子向上翻开，<C>drawer_front_joint</C>{" "}
                把抽屉滑出，随后镜头平滑切回。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Frame the shot.</strong> Press <Kbd>K</Kbd>. The current view is added to the camera path as a keyframe,
                with a reference frame captured from the canvas.
              </>
            }
            zh={
              <>
                <strong>构图取景。</strong>按 <Kbd>K</Kbd>。当前视角会作为关键帧加入镜头路径，并附带一张从画布截取的参考帧。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Celebrate.</strong> Press <Kbd>F</Kbd> and the actor plays <C>Dance_Loop</C>. The quest panel shows
                &ldquo;Scene wrapped&rdquo; with Play again and Done.
              </>
            }
            zh={
              <>
                <strong>庆祝。</strong>按 <Kbd>F</Kbd>，角色播放 <C>Dance_Loop</C>。任务面板显示「本场杀青」，并提供「再玩一次」和「完成」。
              </>
            }
          />
        </li>
      </OL>
      <Fig
        src="/landing/play-wrapped.jpg"
        alt="The quest panel showing all four steps done and the Scene wrapped banner"
        caption={
          <T
            en="All four steps done. The keyframe you took is now on the camera path below the stage."
            zh="四个步骤全部完成。你拍下的关键帧已经出现在舞台下方的镜头路径上。"
          />
        }
      />

      <H2 id="controls">
        <T en="Controls" zh="操作方式" />
      </H2>
      <Table
        head={["Input", "Action"]}
        rows={[
          [
            <>
              <Kbd>W</Kbd> <Kbd>A</Kbd> <Kbd>S</Kbd> <Kbd>D</Kbd>
            </>,
            <T key="w" en={<>Walk (<C>Walk_Loop</C>)</>} zh={<>行走（<C>Walk_Loop</C>）</>} />,
          ],
          [<Kbd key="s">Shift</Kbd>, <T key="j" en={<>Jog (<C>Jog_Fwd_Loop</C>)</>} zh={<>慢跑（<C>Jog_Fwd_Loop</C>）</>} />],
          [<T key="d" en="Drag" zh="拖动" />, <T key="l" en="Look around" zh="环顾四周" />],
          [<Kbd key="e">E</Kbd>, <T key="b" en="Brew, when the prompt shows next to the machine" zh="冲咖啡（在咖啡机旁出现提示时）" />],
          [<Kbd key="k">K</Kbd>, <T key="f" en="Add the current view as a keyframe" zh="把当前视角添加为关键帧" />],
          [<Kbd key="f">F</Kbd>, <T key="c" en="Cheer" zh="欢呼" />],
        ]}
      />
      <P>
        <T
          en={
            <>
              Outside play mode the same walk keys work in the third- and first-person camera modes, and <Kbd>Q</Kbd> /{" "}
              <Kbd>E</Kbd> change height in orbit and path modes.
            </>
          }
          zh={
            <>
              在游玩模式之外，同样的行走按键在第三人称和第一人称镜头模式下也能用；在环绕和镜头路径模式下，<Kbd>Q</Kbd> /{" "}
              <Kbd>E</Kbd> 用于调整高度。
            </>
          }
        />
      </P>

      <H2 id="phones">
        <T en="On phones and tablets" zh="手机与平板" />
      </H2>
      <UL>
        <li>
          <T
            en={
              <>
                <strong>Joystick:</strong> a thumb stick appears bottom left in the walk modes. A light push walks, a full push jogs.
              </>
            }
            zh={
              <>
                <strong>摇杆：</strong>在行走模式下，左下角会出现一个拇指摇杆。轻推为行走，推到底为慢跑。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Buttons:</strong> Brew, Frame and Cheer sit bottom right, standing in for <Kbd>E</Kbd>, <Kbd>K</Kbd> and{" "}
                <Kbd>F</Kbd>.
              </>
            }
            zh={
              <>
                <strong>按钮：</strong>右下角有「冲咖啡」「取景」「欢呼」三个按钮，分别对应 <Kbd>E</Kbd>、<Kbd>K</Kbd> 和{" "}
                <Kbd>F</Kbd>。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Look:</strong> drag anywhere else on the stage. The stage uses pointer events with{" "}
                <C>touch-action: none</C>, so dragging does not scroll the page.
              </>
            }
            zh={
              <>
                <strong>视角：</strong>在舞台其他任意位置拖动即可。舞台使用 pointer 事件并设置了{" "}
                <C>touch-action: none</C>，拖动时页面不会滚动。
              </>
            }
          />
        </li>
      </UL>
      <P>
        <T
          en="Touch controls show on coarse pointers and on screens up to 900 px wide."
          zh="触控操作会在粗精度指针设备（如触屏）以及宽度不超过 900 px 的屏幕上显示。"
        />
      </P>

      <H2 id="expand">
        <T en="Expand" zh="全屏" />
      </H2>
      <P>
        <T
          en={
            <>
              The <strong>Expand</strong> button at the right end of the stage toolbar hides the docks, header and timeline and
              gives the render the whole screen. It uses the browser&apos;s fullscreen API where it is allowed and falls back to a
              fixed full-window stage elsewhere (for example in iOS Safari). Press <Kbd>Esc</Kbd> or the same button to return.
            </>
          }
          zh={
            <>
              舞台工具栏最右侧的<strong>全屏</strong>按钮会隐藏两侧面板、顶栏和时间轴，让渲染画面占满整个屏幕。浏览器允许时使用全屏
              API，否则（例如在 iOS Safari 中）退回为铺满窗口的固定舞台。按 <Kbd>Esc</Kbd> 或再次点击该按钮即可返回。
            </>
          }
        />
      </P>

      <H2 id="how">
        <T en="How it is built" zh="实现方式" />
      </H2>
      <UL>
        <li>
          <T
            en={
              <>
                <strong>The machine</strong> is the URDF from <C>articulationAnimation</C>, assembled at runtime by{" "}
                <C>loadUrdfAssembly</C>. Each frame resets the link transforms and applies the joint values, so brewing is the same
                code path as the joint sliders on the <A href="/lab">bench</A>.
              </>
            }
            zh={
              <>
                <strong>咖啡机</strong>来自 <C>articulationAnimation</C> 返回的 URDF，运行时由 <C>loadUrdfAssembly</C>{" "}
                组装。每一帧都会先重置连杆变换，再应用关节值，因此冲咖啡和<A href="/lab">测试台</A>上的关节滑块走的是同一条代码路径。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>The actor</strong> is one skinned GLB with eight retargeted clips. Clip choice is a small state machine:
                forced <C>Interact</C> for 2 s after brewing and <C>Dance_Loop</C> for 3 s after cheering, otherwise idle, walk or
                jog from your input.
              </>
            }
            zh={
              <>
                <strong>角色</strong>是一个带八个重定向动作片段的蒙皮 GLB。播放哪个片段由一个小型状态机决定：冲咖啡后强制播放{" "}
                <C>Interact</C> 2 s，欢呼后播放 <C>Dance_Loop</C> 3 s，其余时间根据你的输入在待机、行走和慢跑之间切换。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Quest state</strong> lives in a ref read by the render loop, and only step changes reach React, so the
                overlay does not re-render at frame rate.
              </>
            }
            zh={
              <>
                <strong>任务状态</strong>保存在由渲染循环读取的 ref 中，只有步骤变化才会通知 React，因此浮层不会按帧率重新渲染。
              </>
            }
          />
        </li>
      </UL>

      <Callout>
        <T
          en={
            <>
              The quest is built around the Designer Smart Loft, where the machine stands on the voxel floor. In other worlds you can
              still walk the actor, take keyframes and cheer.
            </>
          }
          zh={
            <>
              任务围绕 Designer Smart Loft 设计，咖啡机就立在它的体素地面上。在其他世界中，你仍然可以操控角色行走、拍关键帧和欢呼。
            </>
          }
        />
      </Callout>
    </DocArticle>
  );
}
