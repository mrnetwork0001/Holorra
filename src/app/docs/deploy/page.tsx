import type { Metadata } from "next";
import { A, C, Callout, DocArticle, H2, OL, P, Pre, Table, UL } from "@/components/docs/prose";
import { REPO_URL } from "@/components/docs/nav";
import { T } from "@/lib/i18n";

export const metadata: Metadata = { title: "Self-hosting & deployment" };

export default function DeployDoc() {
  return (
    <DocArticle
      href="/docs/deploy"
      title={<T en="Self-hosting & deployment" zh="自托管与部署" />}
      lead={
        <T
          en={
            <>
              <strong>One Next.js app, no database, one optional secret.</strong> Holorra runs anywhere Node 20 runs. Without a key
              it is fully explorable; with <C>AHOLO_API_KEY</C> set, the server can start live jobs too.
            </>
          }
          zh={
            <>
              <strong>一个 Next.js 应用，无需数据库，只有一个可选的密钥。</strong>能运行 Node 20 的地方就能运行 Holorra。没有密钥也能完整体验；设置{" "}
              <C>AHOLO_API_KEY</C> 后，服务端还能发起实时任务。
            </>
          }
        />
      }
    >
      <H2 id="local">
        <T en="Run it locally" zh="本地运行" />
      </H2>
      <Pre title="terminal">{`git clone ${REPO_URL}.git
cd Holorra
npm install
cp .env.example .env.local      # optional: add AHOLO_API_KEY
npm run verify:aholo            # SDK exports + CDN asset check
npm run build && npm start      # http://localhost:3000`}</Pre>
      <Callout tone="warn">
        <T
          en={
            <>
              <strong>Use a production build, not <C>next dev</C>.</strong> In dev mode React Fast Refresh instruments the
              viewer&apos;s splat worker and the stage fails with <C>$RefreshReg$ is not defined</C>.
            </>
          }
          zh={
            <>
              <strong>请使用生产构建，不要用 <C>next dev</C>。</strong>开发模式下，React Fast Refresh 会向查看器的 splat worker
              注入代码，舞台随即报错 <C>$RefreshReg$ is not defined</C>。
            </>
          }
        />
      </Callout>

      <H2 id="env">
        <T en="Environment" zh="环境变量" />
      </H2>
      <Table
        head={["Variable", "Default", "What it does"]}
        rows={[
          [
            <C key="k">AHOLO_API_KEY</C>,
            <T key="ku" en="unset" zh="未设置" />,
            <T
              key="kd"
              en="Server-side Aholo key for live jobs. Unset: the app runs on hosted worlds, stored results and labelled previews."
              zh="服务端用于实时任务的 Aholo 密钥。未设置时，应用使用托管世界、已存储的结果和带标注的预览运行。"
            />,
          ],
          [
            <C key="r">AHOLO_REGION</C>,
            <C key="c">com</C>,
            <T
              key="rd"
              en={
                <>
                  <C>com</C> uses api.aholo.ai; <C>cn</C> uses api.aholo.cn.
                </>
              }
              zh={
                <>
                  <C>com</C> 使用 api.aholo.ai；<C>cn</C> 使用 api.aholo.cn。
                </>
              }
            />,
          ],
          [
            <C key="d">NEXT_DIST_DIR</C>,
            <C key="n">.next</C>,
            <T
              key="dd"
              en="Optional build folder name, for side-by-side builds on one machine."
              zh="可选的构建目录名，用于在同一台机器上并存多个构建。"
            />,
          ],
        ]}
      />
      <P>
        <T
          en={
            <>
              Visitors can still bring their own key in the studio header; it is sent per request and overrides the server key for
              that request only.
            </>
          }
          zh="访客仍可以在创作台顶栏填入自己的密钥；它随每次请求发送，只在该次请求中覆盖服务端密钥。"
        />
      </P>

      <H2 id="vercel">
        <T en="Deploy on Vercel" zh="部署到 Vercel" />
      </H2>
      <OL>
        <li>
          <T
            en="Import the GitHub repository. The framework preset is Next.js; keep the default build and output settings."
            zh="导入 GitHub 仓库。框架预设为 Next.js，构建与输出设置保持默认即可。"
          />
        </li>
        <li>
          <T
            en={
              <>
                Add <C>AHOLO_API_KEY</C> (and <C>AHOLO_REGION</C> if you use the CN region) under Environment Variables, or leave
                it empty to run in no-key mode.
              </>
            }
            zh={
              <>
                在 Environment Variables 中添加 <C>AHOLO_API_KEY</C>（使用 CN 区域时再加上 <C>AHOLO_REGION</C>），也可以留空，以无密钥模式运行。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                Deploy, then open <C>/api/aholo/status</C> to confirm the SDK versions and whether a key is present.
              </>
            }
            zh={
              <>
                部署完成后打开 <C>/api/aholo/status</C>，确认 SDK 版本以及是否检测到密钥。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                Check <C>/studio</C>, <C>/studio?play=1</C>, <C>/lab</C> and <C>/report</C> load, and that a world streams in.
              </>
            }
            zh={
              <>
                检查 <C>/studio</C>、<C>/studio?play=1</C>、<C>/lab</C> 和 <C>/report</C> 能正常加载，并确认有世界成功流式加载进来。
              </>
            }
          />
        </li>
      </OL>
      <P>
        <T
          en={
            <>
              The mirrored results in <C>public/assets</C> total about 135 MB (the largest file is 22 MB) and are served as static
              files. Hosted worlds stream from Manycore&apos;s CDN, not from your deployment.
            </>
          }
          zh={
            <>
              <C>public/assets</C> 中镜像的结果共约 135 MB（最大的文件 22 MB），以静态文件形式提供。托管世界从 Manycore 的 CDN
              流式加载，不经过你的部署。
            </>
          }
        />
      </P>

      <H2 id="quirks">
        <T en="Things that will bite you" zh="容易踩的坑" />
      </H2>
      <UL>
        <li>
          <T
            en={
              <>
                <strong>Worker URLs.</strong> Next.js rewrites <C>new URL(..., import.meta.url)</C> to relative URLs, which break
                the viewer&apos;s blob-module workers and leave every splat load hanging. <C>next.config.ts</C> sets{" "}
                <C>module.parser.javascript.url = true</C> for client builds to keep them absolute.
              </>
            }
            zh={
              <>
                <strong>Worker URL。</strong>Next.js 会把 <C>new URL(..., import.meta.url)</C> 改写为相对 URL，这会破坏查看器基于 blob
                模块的 worker，让每次高斯点加载都一直挂起。<C>next.config.ts</C> 在客户端构建中设置了{" "}
                <C>module.parser.javascript.url = true</C>，以保持绝对 URL。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Client-only viewer.</strong> @manycore/aholo-viewer is ESM-only and needs WebGL2 and Web Workers, so the
                stage is imported with <C>dynamic(..., {"{ ssr: false }"})</C> and listed in <C>transpilePackages</C>.
              </>
            }
            zh={
              <>
                <strong>查看器只能在客户端运行。</strong>@manycore/aholo-viewer 仅提供 ESM 版本，并依赖 WebGL2 和 Web Workers，因此舞台通过{" "}
                <C>dynamic(..., {"{ ssr: false }"})</C> 引入，并列在 <C>transpilePackages</C> 中。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Absolute splat URLs.</strong> Pass <C>new URL(url, location.href).href</C> to the splat loader; the
                worker cannot resolve <C>/assets/...</C>.
              </>
            }
            zh={
              <>
                <strong>高斯点文件要用绝对 URL。</strong>传给 splat loader 的应是 <C>new URL(url, location.href).href</C>；worker 无法解析{" "}
                <C>/assets/...</C>。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Animation reset order.</strong> <C>AnimationAction.reset()</C> sets <C>active = false</C>; call it
                before setting <C>active</C> and <C>weight</C>.
              </>
            }
            zh={
              <>
                <strong>动画重置顺序。</strong><C>AnimationAction.reset()</C> 会设置 <C>active = false</C>，所以要先调用它，再设置{" "}
                <C>active</C> 和 <C>weight</C>。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Up axes.</strong> Aholo worlds are −Y up, glTF is +Y up, SpatialGen output is +Z up. See{" "}
                <A href="/docs/worlds">Worlds & the stage</A>.
              </>
            }
            zh={
              <>
                <strong>朝上的坐标轴。</strong>Aholo 世界以 −Y 为上，glTF 以 +Y 为上，SpatialGen 输出以 +Z 为上。见
                <A href="/docs/worlds">世界与舞台</A>。
              </>
            }
          />
        </li>
      </UL>

      <H2 id="map">
        <T en="Repository map" zh="仓库结构" />
      </H2>
      <Pre>{`src/app/                 routes: / (landing), /studio, /lab, /report, /mcp, /docs
src/app/api/aholo/       server routes: lux3d, world, tasks, asset, director, status
src/components/stage/    AholoHybridStage: the WebGL2 stage, play mode, drop-ins
src/components/docks/    creation dock, inspector, camera-path timeline
src/components/lab/      GLB and URDF viewers for /lab
src/config/              world presets, actors, props, clip library, real results
src/lib/                 SDK clients, URDF assembly, voxel collision, LuxReal export
public/assets/           mirrored Lux3D and SpatialGen results
docs/                    architecture, SDK reference, design system, report PDF
.mcp.json                Aholo MCP server for Claude Code / Cursor`}</Pre>
    </DocArticle>
  );
}
