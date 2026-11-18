import type { Metadata } from "next";
import { A, C, Callout, DocArticle, H2, OL, P, Pre, Table, UL } from "@/components/docs/prose";
import { REPO_URL } from "@/components/docs/nav";

export const metadata: Metadata = { title: "Self-hosting & deployment" };

export default function DeployDoc() {
  return (
    <DocArticle
      href="/docs/deploy"
      title="Self-hosting & deployment"
      lead={
        <>
          <strong>One Next.js app, no database, one optional secret.</strong> Holorra runs anywhere Node 20 runs. Without a key
          it is fully explorable; with <C>AHOLO_API_KEY</C> set, the server can start live jobs too.
        </>
      }
    >
      <H2 id="local">Run it locally</H2>
      <Pre title="terminal">{`git clone ${REPO_URL}.git
cd Holorra
npm install
cp .env.example .env.local      # optional: add AHOLO_API_KEY
npm run verify:aholo            # SDK exports + CDN asset check
npm run build && npm start      # http://localhost:3000`}</Pre>
      <Callout tone="warn">
        <strong>Use a production build, not <C>next dev</C>.</strong> In dev mode React Fast Refresh instruments the
        viewer&apos;s splat worker and the stage fails with <C>$RefreshReg$ is not defined</C>.
      </Callout>

      <H2 id="env">Environment</H2>
      <Table
        head={["Variable", "Default", "What it does"]}
        rows={[
          [<C key="k">AHOLO_API_KEY</C>, "unset", "Server-side Aholo key for live jobs. Unset: the app runs on hosted worlds, stored results and labelled previews."],
          [<C key="r">AHOLO_REGION</C>, <C key="c">com</C>, <><C>com</C> uses api.aholo.ai; <C>cn</C> uses api.aholo.cn.</>],
          [<C key="d">NEXT_DIST_DIR</C>, <C key="n">.next</C>, "Optional build folder name, for side-by-side builds on one machine."],
        ]}
      />
      <P>
        Visitors can still bring their own key in the studio header; it is sent per request and overrides the server key for
        that request only.
      </P>

      <H2 id="vercel">Deploy on Vercel</H2>
      <OL>
        <li>Import the GitHub repository. The framework preset is Next.js; keep the default build and output settings.</li>
        <li>
          Add <C>AHOLO_API_KEY</C> (and <C>AHOLO_REGION</C> if you use the CN region) under Environment Variables, or leave
          it empty to run in no-key mode.
        </li>
        <li>Deploy, then open <C>/api/aholo/status</C> to confirm the SDK versions and whether a key is present.</li>
        <li>
          Check <C>/studio</C>, <C>/studio?play=1</C>, <C>/lab</C> and <C>/report</C> load, and that a world streams in.
        </li>
      </OL>
      <P>
        The mirrored results in <C>public/assets</C> total about 135 MB (the largest file is 22 MB) and are served as static
        files. Hosted worlds stream from Manycore&apos;s CDN, not from your deployment.
      </P>

      <H2 id="quirks">Things that will bite you</H2>
      <UL>
        <li>
          <strong>Worker URLs.</strong> Next.js rewrites <C>new URL(..., import.meta.url)</C> to relative URLs, which break
          the viewer&apos;s blob-module workers and leave every splat load hanging. <C>next.config.ts</C> sets{" "}
          <C>module.parser.javascript.url = true</C> for client builds to keep them absolute.
        </li>
        <li>
          <strong>Client-only viewer.</strong> @manycore/aholo-viewer is ESM-only and needs WebGL2 and Web Workers, so the
          stage is imported with <C>dynamic(..., {"{ ssr: false }"})</C> and listed in <C>transpilePackages</C>.
        </li>
        <li>
          <strong>Absolute splat URLs.</strong> Pass <C>new URL(url, location.href).href</C> to the splat loader; the
          worker cannot resolve <C>/assets/...</C>.
        </li>
        <li>
          <strong>Animation reset order.</strong> <C>AnimationAction.reset()</C> sets <C>active = false</C>; call it
          before setting <C>active</C> and <C>weight</C>.
        </li>
        <li>
          <strong>Up axes.</strong> Aholo worlds are −Y up, glTF is +Y up, SpatialGen output is +Z up. See{" "}
          <A href="/docs/worlds">Worlds & the stage</A>.
        </li>
      </UL>

      <H2 id="map">Repository map</H2>
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
