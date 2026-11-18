import type { Metadata } from "next";
import { A, C, Callout, DocArticle, H2, KV, OL, P } from "@/components/docs/prose";
import { REPO_URL, docByHref } from "@/components/docs/nav";

export const metadata: Metadata = { title: "Welcome to Holorra" };

const READING = ["/docs/how-it-works", "/docs/play", "/docs/parts", "/docs/actors", "/docs/generation", "/docs/faq"].map(docByHref);

export default function DocsHome() {
  return (
    <DocArticle
      href="/docs"
      title="Welcome to Holorra"
      lead={
        <>
          <strong>Holorra is a browser studio that turns generated 3D into directed scenes.</strong> It puts walkable 3D
          Gaussian Splatting worlds, part-split and articulated Lux3D props, an auto-rigged actor you can play, and a camera
          director on one WebGL2 stage. Everything runs on the official Manycore Aholo SDKs.
        </>
      }
    >
      <P>
        Generated 3D usually ends as one fused mesh in an empty room. Holorra treats it as the start of a scene:{" "}
        <strong>the world is generated, the props come apart and move, the actor walks and acts, and the camera is directed.</strong>{" "}
        Every result you see in the app came back from a real Aholo API call made through Holorra&apos;s own routes.
      </P>
      <ul className="mt-6 space-y-3 pl-5 text-[16.5px] text-ink-2 [list-style:disc] marker:text-ink-3">
        <li>
          <strong className="font-medium text-ink">SpatialGen</strong> - a world from a sentence
        </li>
        <li>
          <strong className="font-medium text-ink">Lux3D</strong> - objects that come apart, move and act
        </li>
        <li>
          <strong className="font-medium text-ink">Holorra</strong> - the stage where they become a scene
        </li>
      </ul>

      <H2 id="where">Where everything lives</H2>
      <KV
        rows={[
          ["Landing page", <A key="l" href="/">/</A>],
          ["Studio", <A key="s" href="/studio">/studio</A>],
          ["Play the scene quest", <A key="p" href="/studio?play=1">/studio?play=1</A>],
          ["Open a world directly", <><A href="/studio?world=spatialgen-coffee-bar">/studio?world=spatialgen-coffee-bar</A></>],
          ["Lux3D bench (every real result, live in 3D)", <A key="b" href="/lab">/lab</A>],
          ["Project report deck", <><A href="/report">/report</A> - prints to PDF, one slide per page</>],
          ["MCP hub", <A key="m" href="/mcp">/mcp</A>],
          ["SDK and key status", <A key="st" href="/api/aholo/status">/api/aholo/status</A>],
          ["Source", <A key="g" href={REPO_URL}>mrnetwork0001/Holorra</A>],
          ["Hashtag", <C key="h">#Manycorehackathon</C>],
        ]}
      />

      <H2 id="stack">The stack, in one paragraph</H2>
      <P>
        The stage is <strong>@manycore/aholo-viewer 1.14.0</strong> on WebGL2. It streams chunk-LOD splats, loads{" "}
        <C>.spz</C>, <C>.sog</C> and <C>.ply</C> files directly, renders glTF meshes with skinning and animation, and
        composites splats with tone mapping. A Next.js 15 app serves the studio plus server routes under{" "}
        <C>/api/aholo/*</C> that call <strong>@manycore/aholo-sdk-world</strong> (SpatialGen and Aholo Reality),{" "}
        <strong>@manycore/aholo-sdk-lux3d</strong> (all ten Lux3D methods) and <strong>@manycore/aholo-sdk-asset</strong>.
        Keys stay on the server: either <C>AHOLO_API_KEY</C> or a key the user pastes in the studio, sent per request as{" "}
        <C>x-aholo-api-key</C>. <strong>@manycore/aholo-sdk-mcp</strong> is pre-wired in <C>.mcp.json</C>, so Claude Code
        or Cursor can drive the same APIs from an editor.
      </P>

      <H2 id="reading-order">Reading order</H2>
      <P>If you are evaluating Holorra, this order gives the fastest complete picture:</P>
      <OL>
        {READING.map((d) => (
          <li key={d.href}>
            <A href={d.href}>{d.title}</A> - {d.blurb}
          </li>
        ))}
      </OL>

      <Callout>
        Built for the Manycore Aholo Global 3D AI Hackathon. Without an API key the studio runs on Manycore-hosted worlds and
        on stored results from real jobs; anything that is a preview rather than a Lux3D output is labelled as one in the
        app.
      </Callout>
    </DocArticle>
  );
}
