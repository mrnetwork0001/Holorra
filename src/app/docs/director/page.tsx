import type { Metadata } from "next";
import { A, C, Callout, DocArticle, H2, OL, P, Pre, Table } from "@/components/docs/prose";
import { T } from "@/lib/i18n";

export const metadata: Metadata = { title: "Camera director" };

export default function DirectorDoc() {
  return (
    <DocArticle
      href="/docs/director"
      title={<T en="Camera director" zh="镜头导演" />}
      lead={
        <T
          en={
            <>
              <strong>Block the shot in 3D, then hand it to LuxReal.</strong> Keyframes store where the camera is, what it looks
              at, how long the shot lasts and what it should look like. Holorra plays them back as a smooth path over the live
              stage and exports a storyboard pack for LuxReal&apos;s video creator.
            </>
          }
          zh={
            <>
              <strong>先在 3D 中调度好镜头，再交给 LuxReal。</strong>关键帧记录镜头在哪里、看向哪里、持续多久，以及画面应该是什么样子。Holorra
              在实时舞台上把它们回放成一条平滑路径，并为 LuxReal 的视频创作工具导出分镜包。
            </>
          }
        />
      }
    >
      <H2 id="keyframes">
        <T en="Keyframes" zh="关键帧" />
      </H2>
      <P>
        <T
          en={
            <>
              Press <strong>Keyframe</strong> on the stage toolbar (or <C>K</C> in walk modes). Each keyframe records the camera
              position and look-at target, a 3 s duration, a shot prompt written from the current prop, explode level and actor,
              and a reference frame captured from the WebGL canvas. Every world starts with three hand-written keyframes, and the
              trash icon removes one.
            </>
          }
          zh={
            <>
              点击舞台工具栏上的<strong>关键帧</strong>（行走模式下按 <C>K</C>
              ）。每个关键帧会记录镜头位置和注视目标、3 s 时长、一段根据当前道具、爆炸程度和角色写出的镜头提示词，以及一张从 WebGL
              画布截取的参考帧。每个世界初始自带三个手写的关键帧，点垃圾桶图标可删除其中一个。
            </>
          }
        />
      </P>
      <Table
        head={["Field", "Meaning"]}
        rows={[
          [<C key="p">position</C>, <T key="pv" en="Camera position in stage coordinates (−Y up)" zh="舞台坐标系中的镜头位置（−Y 向上）" />],
          [<C key="t">target</C>, <T key="tv" en="The point the camera looks at" zh="镜头注视的点" />],
          [
            <C key="d">durationSec</C>,
            <T key="dv" en="How long the shot lasts on playback and in the storyboard" zh="该镜头在回放和分镜中的持续时长" />,
          ],
          [<C key="l">luxrealPrompt</C>, <T key="lv" en="The shot description for LuxReal" zh="给 LuxReal 的镜头描述" />],
          [<C key="s">snapshotDataUrl</C>, <T key="sv" en="The reference frame, when one was captured" zh="参考帧（如已截取）" />],
        ]}
      />

      <H2 id="playback">
        <T en="Playback" zh="回放" />
      </H2>
      <P>
        <T
          en={
            <>
              <strong>Play path</strong> flies the camera through the keyframes on a Catmull-Rom spline. Position and target are
              interpolated separately, so the camera both moves and turns smoothly; the curve passes through every keyframe. The
              Path camera mode previews the same path. The code is <C>evaluateCameraSpline</C> in{" "}
              <C>src/lib/luxreal-exporter.ts</C>.
            </>
          }
          zh={
            <>
              <strong>播放路径</strong>让镜头沿 Catmull-Rom
              样条依次飞过各个关键帧。位置和注视目标分别插值，因此镜头的移动和转向都很平滑；曲线会经过每一个关键帧。「镜头路径」模式预览的是同一条路径。实现代码是{" "}
              <C>src/lib/luxreal-exporter.ts</C> 中的 <C>evaluateCameraSpline</C>。
            </>
          }
        />
      </P>

      <H2 id="export">
        <T en="Export for LuxReal" zh="导出到 LuxReal" />
      </H2>
      <OL>
        <li>
          <T
            en={
              <>
                <strong>Copy prompt</strong> copies a master video prompt: the world, the hero prop and its explode level, the
                actor and its clip, then one line per shot.
              </>
            }
            zh={
              <>
                <strong>复制提示词</strong>：复制一段总视频提示词，依次包含世界、主道具及其爆炸程度、角色及其动作片段，然后每个镜头一行。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Storyboard JSON</strong> downloads the full pack with schema <C>manycore.aholo.luxreal.storyboard.v1</C>.
              </>
            }
            zh={
              <>
                <strong>分镜 JSON</strong>：下载完整的分镜包，schema 为 <C>manycore.aholo.luxreal.storyboard.v1</C>。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Open in LuxReal</strong> opens <A href="https://www.luxreal.com/create-video?createType=8">LuxReal&apos;s video
                creator</A>; paste the prompt and use the reference frames.
              </>
            }
            zh={
              <>
                <strong>在 LuxReal 中打开</strong>：打开 <A href="https://www.luxreal.com/create-video?createType=8">LuxReal
                的视频创作页</A>，粘贴提示词并使用参考帧。
              </>
            }
          />
        </li>
      </OL>
      <Pre title="storyboard.json (shape)">{`{
  "schema": "manycore.aholo.luxreal.storyboard.v1",
  "worldTitle": "Designer Smart Loft",
  "heroAssetName": "Espresso machine (Lux3D)",
  "actorName": "...",
  "activeAnimationClip": "Idle_Loop",
  "partExplosionPercent": 0,
  "totalDurationSec": 9.5,
  "luxrealPortalUrl": "https://www.luxreal.com/create-video?createType=8",
  "masterVideoPrompt": "[LuxReal 3D-Consistent Scene Brief] World: ...",
  "shots": [
    { "shotNumber": 1, "label": "Entrance wide", "durationSec": 3,
      "cameraPosition": [-4.2, 0.8, 1.2], "cameraLookAt": [...],
      "luxrealPrompt": "...", "hasKeyframeSnapshot": true }
  ]
}`}</Pre>

      <Callout>
        <T
          en={
            <>
              Holorra does not call LuxReal itself. It prepares the prompt, the camera data and the reference frames; the last step,
              pasting them into LuxReal, is yours.
            </>
          }
          zh={
            <>
              Holorra 本身不会调用 LuxReal。它负责准备提示词、镜头数据和参考帧；最后一步，把它们粘贴进 LuxReal，由你来完成。
            </>
          }
        />
      </Callout>
    </DocArticle>
  );
}
