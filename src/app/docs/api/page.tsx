import type { Metadata } from "next";
import { A, C, Callout, DocArticle, H2, H3, P, Pre, Table } from "@/components/docs/prose";

export const metadata: Metadata = { title: "HTTP API" };

export default function ApiDoc() {
  return (
    <DocArticle
      href="/docs/api"
      title="HTTP API"
      lead={
        <>
          <strong>The studio talks to Aholo only through these routes.</strong> They live under <C>/api/aholo/*</C>, run on the
          server, and call the official SDKs with either the server key or the caller&apos;s <C>x-aholo-api-key</C> header.
          Any client can use them the same way.
        </>
      }
    >
      <H2 id="auth">Authentication</H2>
      <Table
        head={["Header", "Meaning"]}
        rows={[
          [<C key="k">x-aholo-api-key</C>, <>An Aholo key. Takes precedence over <C>AHOLO_API_KEY</C> on the server.</>],
          [<C key="r">x-aholo-region</C>, <><C>com</C> (api.aholo.ai, default) or <C>cn</C> (api.aholo.cn). Falls back to <C>AHOLO_REGION</C>.</>],
        ]}
      />
      <P>
        With no key from either source, routes answer without calling Aholo and say so in <C>executionMode</C>.
      </P>
      <Table
        head={["executionMode", "Meaning"]}
        rows={[
          [<C key="1">LIVE_AHOLO_CLOUD_SDK</C>, "A real SDK call was made with a key"],
          [<C key="2">INSTANT_STAGE_BLUEPRINT</C>, "No key: a preview response for a Lux3D method"],
          [<C key="3">VERIFIED_MANYCORE_CDN_PRESET</C>, "No key: a world request answered with a hosted world"],
        ]}
      />

      <H2 id="routes">Routes</H2>
      <Table
        head={["Route", "Does"]}
        rows={[
          [<C key="s">GET /api/aholo/status</C>, "SDK versions, whether a key is present and where it came from (header, env, none), region, and preset counts"],
          [<C key="l">POST /api/aholo/lux3d</C>, "Starts any of the ten Lux3D methods; returns a task ID"],
          [<C key="t">GET /api/aholo/tasks</C>, <><C>?taskId=</C> retrieves one Lux3D task; with no query, lists the 15 most recent</>],
          [<C key="w">POST /api/aholo/world</C>, "Starts a SpatialGen generation or an Aholo Reality reconstruction"],
          [<C key="g">GET /api/aholo/world</C>, <><C>?worldId=</C> retrieves one world; with no query, returns the hosted presets and your 10 latest worlds</>],
          [<C key="d">POST /api/aholo/director</C>, "Turns a brief into an ordered MCP tool plan and a stage mutation"],
          [<C key="a">GET /api/aholo/asset</C>, <><C>?url=</C> streams a result file from an allowlisted Aholo host</>],
        ]}
      />

      <H2 id="lux3d">POST /api/aholo/lux3d</H2>
      <P>
        The body names an <C>operation</C> plus that method&apos;s fields. Operations: <C>textTo3d</C>, <C>imgTo3d</C>,{" "}
        <C>imageToFourView</C>, <C>multimodalToImage</C>, <C>partSplit</C>, <C>articulationAnimation</C>,{" "}
        <C>humanoidAutoRig</C>, <C>humanoidAnimationRetarget</C>, <C>materialTransfer</C>, <C>multiFormatExport</C>.
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
      <H3>Fields by operation</H3>
      <Table
        head={["Operation", "Fields"]}
        rows={[
          [<C key="1">textTo3d</C>, <><C>prompt</C>, <C>version</C> (G1 or G1-Turbo)</>],
          [<C key="2">imgTo3d</C>, <><C>img</C>, <C>version</C>, <C>faceCount</C> (10k to 300k, default 200k), <C>enablePbr</C></>],
          [<C key="3">imageToFourView</C>, <><C>img</C> and/or <C>prompt</C></>],
          [<C key="4">multimodalToImage</C>, <><C>prompt</C> and/or <C>img</C></>],
          [<C key="5">partSplit</C>, <C key="g">glbUrl</C>],
          [<C key="6">articulationAnimation</C>, <><C>glbUrl</C>, <C>prompt</C></>],
          [<C key="7">humanoidAutoRig</C>, <C key="m">modelUrl</C>],
          [<C key="8">humanoidAnimationRetarget</C>, <><C>rigModelUrl</C>, <C>animationIds</C> (1 to 10), <C>animationOutputMode</C> (default combined), <C>outFormat</C> (default glb)</>],
          [<C key="9">materialTransfer</C>, <><C>meshUrl</C>, <C>img</C> (reference image); version is fixed to v3.0-standard</>],
          [<C key="10">multiFormatExport</C>, <><C>modelUrl</C>, <C>outputFormat</C>: any of usdz, fbx_zip, obj_zip, stl, 3mf</>],
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
        Lux3D result files live on hosts that do not send CORS headers, so the studio loads them through this proxy. It is
        deliberately narrow:
      </P>
      <Table
        head={["Rule", "Value"]}
        rows={[
          ["Scheme", "https only, no credentials in the URL, port 443"],
          ["Hosts", <>holo-cos.aholo3d.cn, and kujiale.com, myqcloud.com, aholo.ai, aholo.cn with their subdomains</>],
          ["Redirects", "At most 3, and every hop is checked against the same allowlist"],
          ["Limits", "60 s timeout, 120 MB per file (declared and streamed)"],
        ]}
      />
      <P>
        See the source in <C>src/app/api/aholo/asset/route.ts</C>. Status and key handling are in{" "}
        <C>src/lib/aholo-server.ts</C>; for the deploy settings, read <A href="/docs/deploy">Self-hosting</A>.
      </P>

      <Callout>
        Keys never reach the browser from the server. A key the user pastes is sent only to Holorra&apos;s own routes, which
        pass it to the Aholo SDK for that one request and do not store it.
      </Callout>
    </DocArticle>
  );
}
