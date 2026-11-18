import type { Metadata } from "next";
import { ESPRESSO_JOINTS, ESPRESSO_PARTS } from "@/config/lux3d-results";
import { A, C, Callout, DocArticle, Fig, H2, P, Table, UL } from "@/components/docs/prose";

export const metadata: Metadata = { title: "Parts & articulation" };

export default function PartsDoc() {
  return (
    <DocArticle
      href="/docs/parts"
      title="Parts & articulation"
      lead={
        <>
          <strong>A generated object should come apart and move.</strong> <C>lux3d.partSplit</C> breaks a mesh into semantic
          sub-meshes, and <C>lux3d.articulationAnimation</C> gives it joints from one sentence. Holorra lets you explode,
          isolate, recolor and hinge the result on the stage.
        </>
      }
    >
      <H2 id="split">Part split</H2>
      <P>
        Select the stage prop in the right dock and press <strong>Run part split</strong>, or send any GLB URL to{" "}
        <C>partSplit</C> from the Lux3D tab. Lux3D returns the parts as separate, unnamed meshes. On the G1 espresso machine
        (task 8354166) it returned four, with the same 229,788 triangles as the unsplit mesh:
      </P>
      <Table
        head={["Part", "Our reading", "Triangles"]}
        rows={ESPRESSO_PARTS.map((p) => [
          <C key="m">{p.material}</C>,
          p.reading,
          <span key="t" className="font-mono tabular">{p.triangles.toLocaleString("en-US")}</span>,
        ])}
      />
      <Fig
        src="/landing/lux3d/parts.jpg"
        alt="The four parts of the espresso machine pulled apart"
        caption="The part-split result, exploded on the bench. Try it live at /lab."
      />

      <H2 id="explode">Explode, isolate, recolor</H2>
      <UL>
        <li>
          <strong>Explode (0 to 100%)</strong> pushes every part away from the model origin along the line through its
          bounding-box centre. Presets: Closed 0, Inspect 35, Service 65, CAD 100.
        </li>
        <li>
          <strong>Isolate:</strong> click a part on the stage or in the part list to select it; the eye toggles hide and show
          it.
        </li>
        <li>
          <strong>Recolor:</strong> pick a swatch for the selected part to override its material colour on the stage. Reset
          clears every override.
        </li>
        <li>
          <strong>Material transfer:</strong> the Lux3D tab sends a model and a reference image to{" "}
          <C>lux3d.materialTransfer.create</C> (version <C>v3.0-standard</C>) for a new PBR texture set.
        </li>
      </UL>

      <H2 id="articulation">Articulation from a sentence</H2>
      <P>
        Type how the object should move and press <strong>Animate from prompt</strong>. We asked: &ldquo;The top brewing hood
        hinges open upward about its back edge while the front capsule drawer slides out.&rdquo; Lux3D returned a{" "}
        <C>robot.urdf</C> with one GLB per link (task 8354168, 298 s):
      </P>
      <Table
        head={["Joint", "Type", "Child link", "Limit", "Axis"]}
        rows={ESPRESSO_JOINTS.map((j) => [<C key="n">{j.name}</C>, j.type, j.child, j.limit, j.axis])}
      />
      <P>
        The stage reads that URDF at runtime (<C>src/lib/urdf-assembly.ts</C>), builds the link tree with each joint&apos;s
        origin, and drives the revolute and prismatic joints every frame. While articulation is on, the joints swing through
        their range; in <A href="/docs/play">play mode</A>, brewing opens them.
      </P>

      <H2 id="export">Export</H2>
      <P>
        <C>lux3d.multiFormatExport.create</C> converts a result to <C>usdz</C>, <C>fbx_zip</C>, <C>obj_zip</C>,{" "}
        <C>stl</C> or <C>3mf</C>, for AR Quick Look, game engines and 3D printing. Pick formats in the Export block of the
        Lux3D tab.
      </P>

      <Callout>
        Two of the three stage props (the patrol drone and the holo-terminal) are hand-built procedural previews used to show
        the inspector in other worlds. The app labels them &ldquo;procedural preview&rdquo;; only the espresso machine is a
        Lux3D output.
      </Callout>
    </DocArticle>
  );
}
