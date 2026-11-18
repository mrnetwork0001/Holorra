import type { Metadata } from "next";
import { A, C, DocArticle, Fig, H2, OL, P, Table } from "@/components/docs/prose";

export const metadata: Metadata = { title: "How it works" };

const STAGES = [
  ["01", "Generate the world", "SpatialGen (prompt or image) or Aholo Reality (video, photos, Insta360)", "world.generations.create · world.reconstructions.create"],
  ["02", "Split the parts", "Lux3D mesh from text or images, split into semantic parts, given joints from a sentence", "textTo3d · imgTo3d · partSplit · articulationAnimation"],
  ["03", "Rig the actors", "Skeleton and skin weights on a static humanoid, then official clips retargeted onto it", "humanoidAutoRig · humanoidAnimationRetarget"],
  ["04", "Direct the scene", "Camera keyframes, Catmull-Rom playback, a storyboard pack for LuxReal", "in the studio · LuxReal hand-off"],
];

export default function HowItWorks() {
  return (
    <DocArticle
      href="/docs/how-it-works"
      title="How it works"
      lead={
        <>
          <strong>Four stages, one stage.</strong> Holorra chains the Aholo World and Lux3D APIs so the output of each step
          lands on the same WebGL scene as the next: a world to stand in, props that open, an actor that moves, and a camera
          that records it.
        </>
      }
    >
      <div className="mt-10 grid border-l border-t border-line sm:grid-cols-2">
        {STAGES.map(([n, title, body, calls]) => (
          <div key={n} className="border-b border-r border-line bg-canvas/60 p-5">
            <div className="font-mono text-[12px] text-accent">{n}</div>
            <div className="mt-3 text-[16px] font-medium text-ink">{title}</div>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{body}</p>
            <div className="mt-3 font-mono text-[11.5px] leading-relaxed text-ink-3">{calls}</div>
          </div>
        ))}
      </div>

      <H2 id="one-scene">The life of one scene</H2>
      <P>Here is the espresso machine you meet in the studio, followed from prompt to shot. Every step was a real job.</P>
      <OL>
        <li>
          <strong>Prompt to mesh.</strong> <C>lux3d.textTo3d.create</C> with the G1 engine returned a 229,788-triangle mesh
          with three PBR maps in 343 s (task 8353478). The same prompt on G1-Turbo took 151 s (task 8353472).
        </li>
        <li>
          <strong>Mesh to parts.</strong> <C>lux3d.partSplit.create</C> on the G1 result returned four sub-meshes with the
          same total triangle count in 118 s (task 8354166).
        </li>
        <li>
          <strong>Parts to joints.</strong> <C>lux3d.articulationAnimation.create</C> with &ldquo;The top brewing hood hinges
          open upward about its back edge while the front capsule drawer slides out&rdquo; returned a URDF in 298 s (task
          8354168): a revolute hood hinge (0 to 90°) and a prismatic drawer (0 to 0.233).
        </li>
        <li>
          <strong>Into the world.</strong> The studio reads that URDF at runtime, assembles the links and places the machine
          on the loft floor it finds in the voxel collision grid. In the SpatialGen coffee bar it stands on a table.
        </li>
        <li>
          <strong>An actor to use it.</strong> A G1-Turbo character in a strict T-pose was auto-rigged with 52 joints (task
          8355123), then given eight official clips by <C>humanoidAnimationRetarget</C> (task 8359816).
        </li>
        <li>
          <strong>Play and direct.</strong> In <A href="/docs/play">play mode</A> you walk the actor to the machine and press
          E: the hood and drawer open on the URDF joints while the actor plays <C>Interact</C>. Press K and the shot becomes
          a keyframe on the <A href="/docs/director">camera path</A>, ready for LuxReal.
        </li>
      </OL>

      <Fig
        src="/landing/play-brew.jpg"
        alt="Close-up of the articulated espresso machine with its drawer open during play mode"
        caption="Step 6 in the studio: the brew close-up, with the drawer out on drawer_front_joint."
      />

      <H2 id="layout">The studio at a glance</H2>
      <Table
        head={["Area", "What it holds"]}
        rows={[
          [<strong key="h">Header</strong>, "The five world tabs, links to the report and MCP hub, render settings, and the API key field (COM or CN region)."],
          [<strong key="l">Left dock</strong>, "World, Lux3D and Scene tabs: SpatialGen and Reality jobs, every Lux3D method, the stage prop list, material transfer and export."],
          [<strong key="s">Stage</strong>, "The WebGL2 viewport. Toolbar: Play, camera mode (orbit, third person, first person, path), Keyframe, reset camera, Expand."],
          [<strong key="r">Right dock</strong>, "Parts (explode, articulation, part list), Actor (clip library and retargeting) and the Co-director."],
          [<strong key="b">Timeline</strong>, "The camera path: keyframes, Play path, copy prompt, storyboard JSON, Open in LuxReal."],
        ]}
      />
      <P>
        On screens up to 900 px wide the docks move into a left drawer behind the burger button and the stage takes the full
        width. See <A href="/docs/play">Play mode</A> for the touch controls.
      </P>
    </DocArticle>
  );
}
