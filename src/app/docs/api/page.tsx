import type { Metadata } from "next";
import { A, C, Callout, DocArticle, H2, H3, P, Pre, Table } from "@/components/docs/prose";
import { T } from "@/lib/i18n";

export const metadata: Metadata = { title: "HTTP API" };

export default function ApiDoc() {
  return (
    <DocArticle
      href="/docs/api"
      title="HTTP API"
      lead={
        <T
          en={
            <>
              <strong>The studio talks to Aholo only through these routes.</strong> They live under <C>/api/aholo/*</C>, run on the
              server, and call the official SDKs with either the server key or the caller&apos;s <C>x-aholo-api-key</C> header.
              Any client can use them the same way.
            </>
          }
          zh={
            <>
              <strong>创作台只通过这些接口与 Aholo 通信。</strong>它们位于 <C>/api/aholo/*</C> 下，在服务端运行，使用服务端密钥或调用方的{" "}
              <C>x-aholo-api-key</C> 请求头调用官方 SDK。任何客户端都可以用同样的方式调用它们。
            </>
          }
        />
      }
    >
      <H2 id="auth">
        <T en="Authentication" zh="认证" />
      </H2>
      <Table
        head={["Header", "Meaning"]}
        rows={[
          [
            <C key="k">x-aholo-api-key</C>,
            <T
              key="kd"
              en={
                <>
                  An Aholo key. Takes precedence over <C>AHOLO_API_KEY</C> on the server.
                </>
              }
              zh={
                <>
                  Aholo 密钥，优先于服务端的 <C>AHOLO_API_KEY</C>。
                </>
              }
            />,
          ],
          [
            <C key="r">x-aholo-region</C>,
            <T
              key="rd"
              en={
                <>
                  <C>com</C> (api.aholo.ai, default) or <C>cn</C> (api.aholo.cn). Falls back to <C>AHOLO_REGION</C>.
                </>
              }
              zh={
                <>
                  <C>com</C>（api.aholo.ai，默认）或 <C>cn</C>（api.aholo.cn）。未提供时回退到 <C>AHOLO_REGION</C>。
                </>
              }
            />,
          ],
        ]}
      />
      <P>
        <T
          en={
            <>
              With no key from either source, routes answer without calling Aholo and say so in <C>executionMode</C>.
            </>
          }
          zh={
            <>
              两种来源都没有密钥时，接口不调用 Aholo 直接返回响应，并在 <C>executionMode</C> 中注明。
            </>
          }
        />
      </P>
      <Table
        head={["executionMode", "Meaning"]}
        rows={[
          [<C key="1">LIVE_AHOLO_CLOUD_SDK</C>, <T key="d1" en="A real SDK call was made with a key" zh="使用密钥发起了真实的 SDK 调用" />],
          [<C key="2">INSTANT_STAGE_BLUEPRINT</C>, <T key="d2" en="No key: a preview response for a Lux3D method" zh="无密钥：Lux3D 方法返回预览响应" />],
          [
            <C key="3">VERIFIED_MANYCORE_CDN_PRESET</C>,
            <T key="d3" en="No key: a world request answered with a hosted world" zh="无密钥：用托管世界响应世界请求" />,
          ],
        ]}
      />

      <H2 id="routes">
        <T en="Routes" zh="接口" />
      </H2>
      <Table
        head={["Route", "Does"]}
        rows={[
          [
            <C key="s">GET /api/aholo/status</C>,
            <T
              key="sd"
              en="SDK versions, whether a key is present and where it came from (header, env, none), region, and preset counts"
              zh="SDK 版本、是否有密钥及其来源（header、env、none）、区域，以及预设数量"
            />,
          ],
          [
            <C key="l">POST /api/aholo/lux3d</C>,
            <T key="ld" en="Starts any of the ten Lux3D methods; returns a task ID" zh="启动十个 Lux3D 方法中的任意一个，返回任务 ID" />,
          ],
          [
            <C key="t">GET /api/aholo/tasks</C>,
            <T
              key="td"
              en={
                <>
                  <C>?taskId=</C> retrieves one Lux3D task; with no query, lists the 15 most recent
                </>
              }
              zh={
                <>
                  带 <C>?taskId=</C> 时查询单个 Lux3D 任务；不带查询参数时列出最近的 15 个任务
                </>
              }
            />,
          ],
          [
            <C key="w">POST /api/aholo/world</C>,
            <T key="wd" en="Starts a SpatialGen generation or an Aholo Reality reconstruction" zh="启动 SpatialGen 世界生成或 Aholo Reality 重建" />,
          ],
          [
            <C key="g">GET /api/aholo/world</C>,
            <T
              key="gd"
              en={
                <>
                  <C>?worldId=</C> retrieves one world; with no query, returns the hosted presets and your 10 latest worlds
                </>
              }
              zh={
                <>
                  带 <C>?worldId=</C> 时查询单个世界；不带查询参数时返回托管预设和你最近的 10 个世界
                </>
              }
            />,
          ],
          [
            <C key="d">POST /api/aholo/director</C>,
            <T
              key="dd"
              en="Turns a brief into an ordered MCP tool plan and a stage mutation"
              zh="把一段描述转成按顺序排列的 MCP 工具计划，以及一次舞台变更"
            />,
          ],
          [
            <C key="a">GET /api/aholo/asset</C>,
            <T
              key="ad"
              en={
                <>
                  <C>?url=</C> streams a result file from an allowlisted Aholo host
                </>
              }
              zh={
                <>
                  带 <C>?url=</C>，从白名单内的 Aholo 主机流式传输结果文件
                </>
              }
            />,
          ],
        ]}
      />

      <H2 id="lux3d">POST /api/aholo/lux3d</H2>
      <P>
        <T
          en={
            <>
              The body names an <C>operation</C> plus that method&apos;s fields. Operations: <C>textTo3d</C>, <C>imgTo3d</C>,{" "}
              <C>imageToFourView</C>, <C>multimodalToImage</C>, <C>partSplit</C>, <C>articulationAnimation</C>,{" "}
              <C>humanoidAutoRig</C>, <C>humanoidAnimationRetarget</C>, <C>materialTransfer</C>, <C>multiFormatExport</C>.
            </>
          }
          zh={
            <>
              请求体包含 <C>operation</C> 以及该方法对应的字段。可用的 operation：<C>textTo3d</C>、<C>imgTo3d</C>、
              <C>imageToFourView</C>、<C>multimodalToImage</C>、<C>partSplit</C>、<C>articulationAnimation</C>、
              <C>humanoidAutoRig</C>、<C>humanoidAnimationRetarget</C>、<C>materialTransfer</C>、<C>multiFormatExport</C>。
            </>
          }
        />
      </P>
      <Pre title="request">{`curl -X POST http://localhost:3010/api/aholo/lux3d \\
  -H 'content-type: application/json' \\
  -H 'x-aholo-api-key: <your key>' \\
  -d '{"operation":"textTo3d","prompt":"A brass desk lamp","version":"G1-Turbo"}'`}</Pre>
      <Pre title="response">{`{
  "ok": true,
  "executionMode": "LIVE_AHOLO_CLOUD_SDK",
  "sdkMethod": "lux3d.textTo3d.create",
  "taskId": 8353472,
  "status": 1
}`}</Pre>
      <H3>
        <T en="Fields by operation" zh="各 operation 的字段" />
      </H3>
      <Table
        head={["Operation", "Fields"]}
        rows={[
          [
            <C key="1">textTo3d</C>,
            <T
              key="f1"
              en={
                <>
                  <C>prompt</C>, <C>version</C> (G1 or G1-Turbo)
                </>
              }
              zh={
                <>
                  <C>prompt</C>、<C>version</C>（G1 或 G1-Turbo）
                </>
              }
            />,
          ],
          [
            <C key="2">imgTo3d</C>,
            <T
              key="f2"
              en={
                <>
                  <C>img</C>, <C>version</C>, <C>faceCount</C> (10k to 300k, default 200k), <C>enablePbr</C>
                </>
              }
              zh={
                <>
                  <C>img</C>、<C>version</C>、<C>faceCount</C>（10k 至 300k，默认 200k）、<C>enablePbr</C>
                </>
              }
            />,
          ],
          [
            <C key="3">imageToFourView</C>,
            <T
              key="f3"
              en={
                <>
                  <C>img</C> and/or <C>prompt</C>
                </>
              }
              zh={
                <>
                  <C>img</C> 和/或 <C>prompt</C>
                </>
              }
            />,
          ],
          [
            <C key="4">multimodalToImage</C>,
            <T
              key="f4"
              en={
                <>
                  <C>prompt</C> and/or <C>img</C>
                </>
              }
              zh={
                <>
                  <C>prompt</C> 和/或 <C>img</C>
                </>
              }
            />,
          ],
          [<C key="5">partSplit</C>, <C key="g">glbUrl</C>],
          [<C key="6">articulationAnimation</C>, <><C>glbUrl</C>, <C>prompt</C></>],
          [<C key="7">humanoidAutoRig</C>, <C key="m">modelUrl</C>],
          [
            <C key="8">humanoidAnimationRetarget</C>,
            <T
              key="f8"
              en={
                <>
                  <C>rigModelUrl</C>, <C>animationIds</C> (1 to 10), <C>animationOutputMode</C> (default combined), <C>outFormat</C>{" "}
                  (default glb)
                </>
              }
              zh={
                <>
                  <C>rigModelUrl</C>、<C>animationIds</C>（1 至 10 个）、<C>animationOutputMode</C>（默认 combined）、<C>outFormat</C>
                  （默认 glb）
                </>
              }
            />,
          ],
          [
            <C key="9">materialTransfer</C>,
            <T
              key="f9"
              en={
                <>
                  <C>meshUrl</C>, <C>img</C> (reference image); version is fixed to v3.0-standard
                </>
              }
              zh={
                <>
                  <C>meshUrl</C>、<C>img</C>（参考图）；version 固定为 v3.0-standard
                </>
              }
            />,
          ],
          [
            <C key="10">multiFormatExport</C>,
            <T
              key="f10"
              en={
                <>
                  <C>modelUrl</C>, <C>outputFormat</C>: any of usdz, fbx_zip, obj_zip, stl, 3mf
                </>
              }
              zh={
                <>
                  <C>modelUrl</C>、<C>outputFormat</C>：可选 usdz、fbx_zip、obj_zip、stl、3mf
                </>
              }
            />,
          ],
        ]}
      />

      <H2 id="world">POST /api/aholo/world</H2>
      <Pre title="generate">{`{ "action": "generate", "prompt": "A cozy Scandinavian coffee bar ...", "imageUrl": "https://..." }`}</Pre>
      <Pre title="reconstruct">{`{
  "action": "reconstruct",
  "resources": [{ "url": "https://.../walkthrough.mp4", "type": "video" }],
  "scene": "space",            // or "model"
  "taskQuality": "normal",     // low | normal | high
  "useMask": false
}`}</Pre>

      <H2 id="asset">GET /api/aholo/asset</H2>
      <P>
        <T
          en={
            <>
              Lux3D result files live on hosts that do not send CORS headers, so the studio loads them through this proxy. It is
              deliberately narrow:
            </>
          }
          zh="Lux3D 结果文件所在的主机不返回 CORS 响应头，所以创作台通过这个代理加载它们。代理的放行范围刻意收得很窄："
        />
      </P>
      <Table
        head={["Rule", "Value"]}
        rows={[
          [
            <T key="sl" en="Scheme" zh="协议" />,
            <T key="sv" en="https only, no credentials in the URL, port 443" zh="仅限 https，URL 中不得携带凭据，端口 443" />,
          ],
          [
            <T key="hl" en="Hosts" zh="主机" />,
            <T
              key="hv"
              en={<>holo-cos.aholo3d.cn, and kujiale.com, myqcloud.com, aholo.ai, aholo.cn with their subdomains</>}
              zh={<>holo-cos.aholo3d.cn，以及 kujiale.com、myqcloud.com、aholo.ai、aholo.cn 及其子域名</>}
            />,
          ],
          [
            <T key="rl" en="Redirects" zh="重定向" />,
            <T key="rv" en="At most 3, and every hop is checked against the same allowlist" zh="最多 3 次，每一跳都按同一份白名单校验" />,
          ],
          [
            <T key="ll" en="Limits" zh="限制" />,
            <T key="lv" en="60 s timeout, 120 MB per file (declared and streamed)" zh="超时 60 s，单个文件上限 120 MB（声明大小和实际传输量都会检查）" />,
          ],
        ]}
      />
      <P>
        <T
          en={
            <>
              See the source in <C>src/app/api/aholo/asset/route.ts</C>. Status and key handling are in{" "}
              <C>src/lib/aholo-server.ts</C>; for the deploy settings, read <A href="/docs/deploy">Self-hosting</A>.
            </>
          }
          zh={
            <>
              源码见 <C>src/app/api/aholo/asset/route.ts</C>。状态与密钥处理在 <C>src/lib/aholo-server.ts</C>{" "}
              中；部署设置请阅读<A href="/docs/deploy">自托管与部署</A>。
            </>
          }
        />
      </P>

      <Callout>
        <T
          en={
            <>
              Keys never reach the browser from the server. A key the user pastes is sent only to Holorra&apos;s own routes, which
              pass it to the Aholo SDK for that one request and do not store it.
            </>
          }
          zh={
            <>
              服务端的密钥永远不会发送到浏览器。用户粘贴的密钥只会发往 Holorra 自己的接口，接口仅在该次请求中把它交给 Aholo
              SDK，不做保存。
            </>
          }
        />
      </Callout>
    </DocArticle>
  );
}
