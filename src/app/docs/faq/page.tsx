import type { Metadata } from "next";
import { A, C, Callout, DocArticle, H2, H3, P, Table, UL } from "@/components/docs/prose";

export const metadata: Metadata = { title: "Limits & FAQ" };

const FAQ: [string, React.ReactNode][] = [
  [
    "Do I need an API key to try it?",
    <>No. Worlds, play mode, explode, articulation, the actor, the camera path and the bench all work without one. A key is only
    needed to start new Aholo jobs.</>,
  ],
  [
    "Why does a live job take minutes?",
    <>Generation runs on Aholo&apos;s cloud. Our runs took 81 s to 343 s for Lux3D and 625 s for a SpatialGen world. The studio
    stays playable while you wait, and Text to 3D results drop into the scene when they are done.</>,
  ],
  [
    "Which browsers work?",
    <>Any browser with WebGL2 and module Web Workers: current Chrome, Edge, Safari and Firefox. The chunk-LOD worlds are heavy;
    on phones the loft and coffee bar are the smoothest.</>,
  ],
  [
    "Can I use my own model?",
    <>Yes. Send a GLB URL to part split, articulation, auto-rig or export from the Lux3D tab. Hosts must be reachable by the Aholo
    API.</>,
  ],
  [
    "Why is there only one actor?",
    <>Manycore&apos;s demo GLBs had root scales of 1.78e-5 and 0.0035 and rendered invisibly on this stage, so we removed them
    rather than ship a broken option. The actor you get is our own Lux3D result.</>,
  ],
];

export default function FaqDoc() {
  return (
    <DocArticle
      href="/docs/faq"
      title="Limits & FAQ"
      lead={
        <>
          <strong>What we ask you to trust, stated plainly.</strong> This page lists what is a real Aholo output, what is a
          preview, how keys are handled, and what does not work yet.
        </>
      }
    >
      <H2 id="real">Real or preview</H2>
      <Table
        head={["In the app", "Status"]}
        rows={[
          ["Worlds 01 to 04", "Real: Manycore-hosted splats and voxel grids, streamed from the CDN"],
          ["World 05, coffee bar", "Real: our SpatialGen job (world 3FO4K4V99KMD), mirrored into the repo"],
          ["Espresso machine, parts and joints", "Real: Lux3D tasks 8353478, 8354166 and 8354168"],
          ["The actor and its eight clips", "Real: Lux3D tasks 8354807, 8355123 and 8359816"],
          ["Patrol drone and holo-terminal props", <><strong key="p">Procedural previews</strong>, hand-built and labelled in the app</>],
          ["Text to 3D drop-in without a key", <><strong key="c">Cached</strong>: the stored G1-Turbo result of task 8353472, labelled</>],
          ["Other jobs without a key", <><strong key="v">Preview</strong> receipts; nothing is sent to Aholo</>],
          ["Co-director", "Real plan, deterministic keyword planner; it does not start jobs"],
          ["LuxReal video", "Hand-off only: Holorra exports the prompt, camera data and frames"],
        ]}
      />

      <H2 id="keys">How keys are handled</H2>
      <UL>
        <li>
          <strong>Server key</strong> (<C>AHOLO_API_KEY</C>) stays on the server. It is never sent to the browser, and{" "}
          <C>/api/aholo/status</C> reports only whether one is present.
        </li>
        <li>
          <strong>Your key</strong>, if you paste one, is stored in your browser&apos;s local storage and sent only to
          Holorra&apos;s own <C>/api/aholo/*</C> routes as <C>x-aholo-api-key</C>. The routes pass it to the SDK for that
          request and do not log or store it.
        </li>
        <li>
          <strong>The asset proxy is not an open proxy:</strong> https only, a fixed list of Aholo result hosts, every redirect
          re-checked, 60 s and 120 MB limits. See <A href="/docs/api#asset">HTTP API</A>.
        </li>
        <li>
          <strong>The repository</strong> contains no keys; <C>.env.local</C> is git-ignored and <C>.mcp.json</C> ships a
          placeholder.
        </li>
      </UL>

      <H2 id="limits">Known limitations</H2>
      <UL>
        <li>
          <strong>Collision</strong> exists only in the loft and the plaza. The concourse, turntable and coffee bar use a fixed
          floor height, so you can walk through their walls.
        </li>
        <li>
          <strong>New SpatialGen worlds</strong> are not added to the world tabs automatically; adding one means mirroring its
          splat file and writing a preset, as we did for world 05.
        </li>
        <li>
          <strong>Drop-ins</strong> are cosmetic: they fall and settle but are not saved with the scene and do not collide
          with the actor.
        </li>
        <li>
          <strong>Retarget results</strong> come back as one GLB with generic clip names (<C>animation_1</C>...); the
          studio maps them by request order.
        </li>
        <li>
          <strong>Heavy worlds on phones.</strong> The 41.8M-splat plaza streams by LOD but can be slow on older devices.
        </li>
      </UL>

      <H2 id="faq">FAQ</H2>
      {FAQ.map(([q, a]) => (
        <div key={q}>
          <H3>{q}</H3>
          <P>{a}</P>
        </div>
      ))}

      <Callout tone="warn">
        Hackathon software, built for the Manycore Aholo Global 3D AI Hackathon. Live jobs spend credits on the key&apos;s
        account.
      </Callout>
    </DocArticle>
  );
}
