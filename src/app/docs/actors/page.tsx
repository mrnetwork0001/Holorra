import type { Metadata } from "next";
import { HUMANOID_ANIMATION_GROUPS } from "@/config/humanoid-animations";
import { CHARACTER_TPOSE_PROMPT, RETARGET_CLIPS } from "@/config/lux3d-results";
import { A, C, Callout, DocArticle, H2, OL, P, Table } from "@/components/docs/prose";

export const metadata: Metadata = { title: "Actors & animation" };

const TOTAL = HUMANOID_ANIMATION_GROUPS.reduce((n, g) => n + g.clips.length, 0);

export default function ActorsDoc() {
  return (
    <DocArticle
      href="/docs/actors"
      title="Actors & animation"
      lead={
        <>
          <strong>The actor you play was generated, rigged and animated by Lux3D.</strong> A static character mesh went through{" "}
          <C>humanoidAutoRig</C> for a skeleton and <C>humanoidAnimationRetarget</C> for clips, and now walks the worlds on
          their voxel floors.
        </>
      }
    >
      <H2 id="pipeline">From prompt to playable actor</H2>
      <OL>
        <li>
          <strong>Mesh.</strong> <C>textTo3d</C> on G1-Turbo with a prompt that asks for a strict T-pose (task 8354807):
          &ldquo;{CHARACTER_TPOSE_PROMPT}&rdquo;
        </li>
        <li>
          <strong>Skeleton.</strong> <C>humanoidAutoRig</C> added 52 joints and skin weights in 81 s (task 8355123).
        </li>
        <li>
          <strong>Clips.</strong> <C>humanoidAnimationRetarget</C> put eight official clips on that rig in one combined GLB
          (task 8359816, at most 17 s).
        </li>
      </OL>
      <P>
        Our first character, a courier in an A-pose, was rejected by the rigger with <C>RIG_ELIGIBILITY_FAILED</C> (task
        8354170). Regenerating it in a strict T-pose fixed that. Both attempts are on the <A href="/lab">bench</A>.
      </P>

      <H2 id="clips">The eight clips on the actor</H2>
      <P>
        The combined GLB names its clips <C>animation_1</C> to <C>animation_8</C>. They follow the order we requested; the
        five clips shared with an earlier retarget have identical lengths, which confirmed the mapping. The stage renames them
        on load.
      </P>
      <Table
        head={["Clip in the file", "Lux3D animation", "Length", "Used for"]}
        rows={RETARGET_CLIPS.map((c) => [
          <C key="c">{c.clip}</C>,
          <C key="i">{c.id}</C>,
          <span key="s" className="font-mono tabular">{c.seconds} s</span>,
          (
            {
              Idle_Loop: "standing still",
              Walk_Loop: "walking",
              Jog_Fwd_Loop: "Shift or a full joystick push",
              Interact: "brewing (E)",
              Chest_Open: "Actor tab",
              Yes: "Actor tab",
              Dance_Loop: "cheering (F)",
              Sword_Attack: "Actor tab",
            } as Record<string, string>
          )[c.id] ?? "",
        ])}
      />

      <H2 id="library">The full clip library</H2>
      <P>
        The Actor tab lists all {TOTAL} official Lux3D humanoid animations, searchable and grouped. Selecting one plays it if it
        is already on the actor, and calls <C>humanoidAnimationRetarget</C> for it (live with a key, a preview receipt
        without). One retarget job takes 1 to 10 animation IDs.
      </P>
      <Table
        head={["Group", "Clips", "Examples"]}
        rows={HUMANOID_ANIMATION_GROUPS.map((g) => [
          g.label,
          <span key="n" className="font-mono tabular">{g.clips.length}</span>,
          g.clips
            .slice(0, 3)
            .map((c) => c.id)
            .join(", "),
        ])}
      />

      <H2 id="stage">On the stage</H2>
      <P>
        The actor is placed at the world&apos;s <C>actorSpot</C> (or just ahead of the spawn point) and dropped onto the voxel
        floor. Its glTF is flipped into the −Y-up frame, scaled to the preset height and driven by{" "}
        <C>Animation.AnimationMixer</C> from @manycore/aholo-viewer, one action per clip. Switching clips resets the next
        action before activating it, because <C>AnimationAction.reset()</C> in the viewer also deactivates the action.
      </P>

      <Callout>
        Manycore&apos;s demo robot and human GLBs were removed from the actor list: their root scales (1.78e-5 and 0.0035) made
        them invisible on this stage. The Lux3D actor is the only actor, and it is a real result.
      </Callout>
    </DocArticle>
  );
}
