import type { Metadata } from "next";
import { A, C, Callout, DocArticle, Fig, H2, H3, OL, P, Table, UL } from "@/components/docs/prose";

export const metadata: Metadata = { title: "Live generation" };

export default function GenerationDoc() {
  return (
    <DocArticle
      href="/docs/generation"
      title="Live generation"
      lead={
        <>
          <strong>Every Aholo World and Lux3D method is one click away in the studio.</strong> The left dock sends jobs through
          Holorra&apos;s server routes to the official SDKs, shows a receipt for each call, and follows Lux3D jobs until their
          result can drop into the scene.
        </>
      }
    >
      <H2 id="keys">Keys and regions</H2>
      <P>
        A live job needs an Aholo API key from <A href="https://labs.aholo.ai">labs.aholo.ai</A> (or labs.aholo.cn). There are
        two ways to provide one:
      </P>
      <UL>
        <li>
          <strong>Server:</strong> set <C>AHOLO_API_KEY</C> (and optionally <C>AHOLO_REGION=cn</C>) in the environment.
        </li>
        <li>
          <strong>Bring your own:</strong> paste a key under <strong>API key</strong> in the studio header and pick COM or CN.
          It is kept in your browser&apos;s local storage and sent per request as <C>x-aholo-api-key</C> and{" "}
          <C>x-aholo-region</C>. A header key takes precedence over the server key, so jobs run on your own credits.
        </li>
      </UL>
      <P>
        Without any key, nothing is sent to Aholo. Requests return a labelled preview instead (see the last section).
      </P>

      <H2 id="world">World: SpatialGen and Aholo Reality</H2>
      <Table
        head={["In the World tab", "SDK call", "Inputs"]}
        rows={[
          ["Generate a world", <C key="g">world.generations.create</C>, "A prompt, an image URL, or both"],
          ["Reconstruct a space or object", <C key="r">world.reconstructions.create</C>, "Media URLs: video, 20+ photos or Insta360 .insv; scene model or space; quality low, normal or high; optional mask"],
        ]}
      />
      <P>
        The World tab takes media by URL. To start from local files, use the MCP server&apos;s <C>upload_asset</C> or{" "}
        <C>world_reconstruct_*_from_files</C> tools (see <A href="/docs/mcp">MCP & co-director</A>). Worlds take minutes: our
        coffee bar took 625 s. A finished world returns splat files; that is how world 05 joined the studio&apos;s presets.
        Your recent worlds are listed by <C>GET /api/aholo/world</C>.
      </P>
      <Fig
        src="/landing/spatialgen-pano.jpg"
        alt="The 360° panorama SpatialGen returned for the coffee bar"
        caption="The panorama SpatialGen returned alongside the coffee bar's splats (world 3FO4K4V99KMD)."
      />

      <H2 id="lux3d">Lux3D: all ten methods</H2>
      <Table
        head={["Method", "What it does"]}
        rows={[
          [<C key="1">textTo3d</C>, "Text to a textured mesh, engine G1 or G1-Turbo"],
          [<C key="2">imgTo3d</C>, "One or more images to a mesh; 10k to 300k faces, PBR maps optional"],
          [<C key="3">imageToFourView</C>, "An orthographic four-view sheet from an image or prompt"],
          [<C key="4">multimodalToImage</C>, "Concept art from a prompt and/or image"],
          [<C key="5">partSplit</C>, "A GLB split into semantic parts"],
          [<C key="6">articulationAnimation</C>, "Joints and motion from a sentence, returned as URDF"],
          [<C key="7">humanoidAutoRig</C>, "Skeleton and skin weights on a static humanoid"],
          [<C key="8">humanoidAnimationRetarget</C>, "1 to 10 official clips onto a rigged humanoid"],
          [<C key="9">materialTransfer</C>, <>A new PBR texture set from a reference image (<C>v3.0-standard</C>)</>],
          [<C key="10">multiFormatExport</C>, "usdz, fbx_zip, obj_zip, stl, 3mf"],
        ]}
      />
      <P>
        Task status codes follow the SDK: 0 initialising, 1 running, 3 succeeded, 4 failed, 6 cancelled.
      </P>

      <H2 id="drop-in">Drop-in: the result lands in your world</H2>
      <P>You can keep playing while a Text to 3D job runs. When it finishes, the model appears in front of you.</P>
      <OL>
        <li>
          <strong>Submit:</strong> Text to 3D calls <C>lux3d.textTo3d.create</C> and the studio starts following the task.
        </li>
        <li>
          <strong>Track:</strong> a chip on the stage shows the job and its elapsed time. The studio polls{" "}
          <C>/api/aholo/tasks?taskId=</C> every 10 s.
        </li>
        <li>
          <strong>Fetch:</strong> the finished GLB is loaded through <C>/api/aholo/asset</C>, an allowlisted proxy (see{" "}
          <A href="/docs/faq">Limits & FAQ</A>), so result hosts never need CORS and links never leak to third parties.
        </li>
        <li>
          <strong>Drop:</strong> the model is scaled to about 70 cm, placed 1.6 m ahead of the camera, and falls from 1.8 m
          onto the floor found in the voxel grid, bouncing to rest. A toast names the task.
        </li>
      </OL>
      <Fig
        src="/landing/drop-in.jpg"
        alt="A generated espresso machine dropped onto the floor of the coffee bar"
        caption="A drop-in in the coffee bar. This one is the cached result used when no key is set, and the toast says so."
      />

      <H2 id="no-key">Without a key</H2>
      <UL>
        <li>
          <strong>Text to 3D</strong> drops our stored G1-Turbo espresso machine (task 8353472) and labels it{" "}
          <em>cached</em>, so the flow can be tried end to end.
        </li>
        <li>
          <strong>Other Lux3D methods</strong> return a receipt marked <em>preview</em> and update the stage where it can
          (for example selecting the matching prop).
        </li>
        <li>
          <strong>World requests</strong> are answered by the closest hosted world (plaza, station or loft, by keyword) and
          marked <em>cdn preset</em>.
        </li>
      </UL>

      <H3>Receipts</H3>
      <P>
        Every call adds a receipt to the dock with the SDK package, method, task or world ID, status and mode (live, preview,
        cached or cdn preset). That log is the quickest way to see what really ran.
      </P>

      <Callout>
        Live jobs spend credits on the key&apos;s account. A G1 mesh took 343 s for us and a SpatialGen world 625 s; keep the
        tab open while they run.
      </Callout>
    </DocArticle>
  );
}
