import type { Metadata } from "next";
import { A, C, Callout, DocArticle, H2, KV, OL, P } from "@/components/docs/prose";
import { REPO_URL, docByHref } from "@/components/docs/nav";
import { T } from "@/lib/i18n";

export const metadata: Metadata = { title: "Welcome to Holorra" };

const READING = ["/docs/how-it-works", "/docs/play", "/docs/parts", "/docs/actors", "/docs/generation", "/docs/faq"].map(docByHref);

export default function DocsHome() {
  return (
    <DocArticle
      href="/docs"
      title={<T en="Welcome to Holorra" zh="欢迎使用 Holorra" />}
      lead={
        <T
          en={
            <>
              <strong>Holorra is a browser studio that turns generated 3D into directed scenes.</strong> It puts walkable 3D
              Gaussian Splatting worlds, part-split and articulated Lux3D props, an auto-rigged actor you can play, and a camera
              director on one WebGL2 stage. Everything runs on the official Manycore Aholo SDKs.
            </>
          }
          zh={
            <>
              <strong>Holorra 是一个浏览器端创作台，把生成的 3D 内容变成可以导演的场景。</strong>它把可行走的 3D
              高斯泼溅（3DGS）世界、经过部件拆分与关节化的 Lux3D 道具、一个可操控的自动绑骨角色，以及镜头导演工具，放在同一个
              WebGL2 舞台上。全部基于 Manycore 官方 Aholo SDK 运行。
            </>
          }
        />
      }
    >
      <P>
        <T
          en={
            <>
              Generated 3D usually ends as one fused mesh in an empty room. Holorra treats it as the start of a scene:{" "}
              <strong>the world is generated, the props come apart and move, the actor walks and acts, and the camera is directed.</strong>{" "}
              Every result you see in the app came back from a real Aholo API call made through Holorra&apos;s own routes.
            </>
          }
          zh={
            <>
              生成的 3D 内容，通常止步于空房间里一个融成一体的网格。Holorra 把它当作场景的起点：
              <strong>世界由 AI 生成，道具能拆开、能活动，角色能走动、能表演，镜头由你来导演。</strong>
              应用里看到的每个结果，都来自经 Holorra 自己的服务端路由发出的真实 Aholo API 调用。
            </>
          }
        />
      </P>
      <ul className="mt-6 space-y-3 pl-5 text-[16.5px] text-ink-2 [list-style:disc] marker:text-ink-3">
        <li>
          <strong className="font-medium text-ink">SpatialGen</strong>
          <T en=" - a world from a sentence" zh="：一句话生成一个世界" />
        </li>
        <li>
          <strong className="font-medium text-ink">Lux3D</strong>
          <T en=" - objects that come apart, move and act" zh="：能拆开、能活动、能表演的物体" />
        </li>
        <li>
          <strong className="font-medium text-ink">Holorra</strong>
          <T en=" - the stage where they become a scene" zh="：让它们组成场景的舞台" />
        </li>
      </ul>

      <H2 id="where">
        <T en="Where everything lives" zh="功能入口一览" />
      </H2>
      <KV
        rows={[
          [<T key="l" en="Landing page" zh="首页" />, <A key="l" href="/">/</A>],
          [<T key="s" en="Studio" zh="创作台" />, <A key="s" href="/studio">/studio</A>],
          [<T key="p" en="Play the scene quest" zh="游玩场景任务" />, <A key="p" href="/studio?play=1">/studio?play=1</A>],
          [<T key="w" en="Open a world directly" zh="直接打开某个世界" />, <><A href="/studio?world=spatialgen-coffee-bar">/studio?world=spatialgen-coffee-bar</A></>],
          [
            <T key="b" en="Lux3D bench (every real result, live in 3D)" zh="Lux3D 测试台（所有真实结果，实时 3D 查看）" />,
            <A key="b" href="/lab">/lab</A>,
          ],
          [
            <T key="r" en="Project report deck" zh="项目报告演示稿" />,
            <>
              <A href="/report">/report</A>
              <T en=" - prints to PDF, one slide per page" zh="：可打印为 PDF，每页一张幻灯片" />
            </>,
          ],
          [<T key="m" en="MCP hub" zh="MCP 中心" />, <A key="m" href="/mcp">/mcp</A>],
          [<T key="st" en="SDK and key status" zh="SDK 与密钥状态" />, <A key="st" href="/api/aholo/status">/api/aholo/status</A>],
          [<T key="g" en="Source" zh="源代码" />, <A key="g" href={REPO_URL}>mrnetwork0001/Holorra</A>],
          [<T key="h" en="Hashtag" zh="话题标签" />, <C key="h">#Manycorehackathon</C>],
        ]}
      />

      <H2 id="stack">
        <T en="The stack, in one paragraph" zh="一段话讲清技术栈" />
      </H2>
      <P>
        <T
          en={
            <>
              The stage is <strong>@manycore/aholo-viewer 1.14.0</strong> on WebGL2. It streams chunk-LOD splats, loads{" "}
              <C>.spz</C>, <C>.sog</C> and <C>.ply</C> files directly, renders glTF meshes with skinning and animation, and
              composites splats with tone mapping. A Next.js 15 app serves the studio plus server routes under{" "}
              <C>/api/aholo/*</C> that call <strong>@manycore/aholo-sdk-world</strong> (SpatialGen and Aholo Reality),{" "}
              <strong>@manycore/aholo-sdk-lux3d</strong> (all ten Lux3D methods) and <strong>@manycore/aholo-sdk-asset</strong>.
              Keys stay on the server: either <C>AHOLO_API_KEY</C> or a key the user pastes in the studio, sent per request as{" "}
              <C>x-aholo-api-key</C>. <strong>@manycore/aholo-sdk-mcp</strong> is pre-wired in <C>.mcp.json</C>, so Claude Code
              or Cursor can drive the same APIs from an editor.
            </>
          }
          zh={
            <>
              舞台基于运行在 WebGL2 上的 <strong>@manycore/aholo-viewer 1.14.0</strong>。它以分块 LOD 流式加载高斯点，直接加载{" "}
              <C>.spz</C>、<C>.sog</C> 和 <C>.ply</C> 文件，渲染带蒙皮和动画的 glTF 网格，并通过色调映射合成高斯点。Next.js 15
              应用负责提供创作台页面，以及 <C>/api/aholo/*</C> 下的服务端路由；这些路由调用{" "}
              <strong>@manycore/aholo-sdk-world</strong>（SpatialGen 与 Aholo Reality）、
              <strong>@manycore/aholo-sdk-lux3d</strong>（全部十个 Lux3D 方法）和 <strong>@manycore/aholo-sdk-asset</strong>
              。密钥只在服务端使用：要么是 <C>AHOLO_API_KEY</C>，要么是用户在创作台中粘贴的密钥，随每次请求以{" "}
              <C>x-aholo-api-key</C> 发送。<strong>@manycore/aholo-sdk-mcp</strong> 已预先配置在 <C>.mcp.json</C> 中，Claude Code
              或 Cursor 可以直接在编辑器里驱动同一套 API。
            </>
          }
        />
      </P>

      <H2 id="reading-order">
        <T en="Reading order" zh="阅读顺序" />
      </H2>
      <P>
        <T
          en="If you are evaluating Holorra, this order gives the fastest complete picture:"
          zh="如果你正在评估 Holorra，按下面的顺序阅读，能最快了解全貌："
        />
      </P>
      <OL>
        {READING.map((d) => (
          <li key={d.href}>
            <A href={d.href}>
              <T en={d.title} zh={d.zh.title} />
            </A>
            <T en={` - ${d.blurb}`} zh={`：${d.zh.blurb}`} />
          </li>
        ))}
      </OL>

      <Callout>
        <T
          en={
            <>
              Built for the Manycore Aholo Global 3D AI Hackathon. Without an API key the studio runs on Manycore-hosted worlds and
              on stored results from real jobs; anything that is a preview rather than a Lux3D output is labelled as one in the
              app.
            </>
          }
          zh={
            <>
              为 Manycore Aholo 全球 3D AI 黑客松打造。没有 API 密钥时，创作台使用 Manycore 托管的世界，以及真实任务保存下来的结果；凡是预览而非
              Lux3D 输出的内容，应用中都会明确标注。
            </>
          }
        />
      </Callout>
    </DocArticle>
  );
}
