import type { Metadata } from "next";
import { A, C, Callout, DocArticle, Fig, H2, Kbd, OL, P, Table, UL } from "@/components/docs/prose";

export const metadata: Metadata = { title: "Play mode" };

export default function PlayDoc() {
  return (
    <DocArticle
      href="/docs/play"
      title="Play mode"
      lead={
        <>
          <strong>Press Play and the studio becomes a one-minute scene quest.</strong> You steer the auto-rigged Lux3D actor in
          third person, walk it through the splat loft on its voxel floor, and use the espresso machine Lux3D generated and
          articulated. Every moving part is a real result.
        </>
      }
    >
      <P>
        Start from the <strong>Play</strong> button at the top of the stage, or open <A href="/studio?play=1">/studio?play=1</A>{" "}
        to start the quest as soon as the world and the actor have loaded. Exit leaves play mode and keeps the camera where it
        is.
      </P>

      <H2 id="quest">The quest</H2>
      <OL>
        <li>
          <strong>Walk to the espresso machine.</strong> The step completes once the actor is within about a metre of it.
        </li>
        <li>
          <strong>Brew a coffee.</strong> Press <Kbd>E</Kbd> near the machine. The actor turns to face it and plays{" "}
          <C>Interact</C>; the camera cuts to a close-up for about three seconds while <C>hood_top_joint</C> swings the hood
          up and <C>drawer_front_joint</C> slides the drawer out, then blends back.
        </li>
        <li>
          <strong>Frame the shot.</strong> Press <Kbd>K</Kbd>. The current view is added to the camera path as a keyframe,
          with a reference frame captured from the canvas.
        </li>
        <li>
          <strong>Celebrate.</strong> Press <Kbd>F</Kbd> and the actor plays <C>Dance_Loop</C>. The quest panel shows
          &ldquo;Scene wrapped&rdquo; with Play again and Done.
        </li>
      </OL>
      <Fig
        src="/landing/play-wrapped.jpg"
        alt="The quest panel showing all four steps done and the Scene wrapped banner"
        caption="All four steps done. The keyframe you took is now on the camera path below the stage."
      />

      <H2 id="controls">Controls</H2>
      <Table
        head={["Input", "Action"]}
        rows={[
          [<><Kbd>W</Kbd> <Kbd>A</Kbd> <Kbd>S</Kbd> <Kbd>D</Kbd></>, <>Walk (<C>Walk_Loop</C>)</>],
          [<Kbd key="s">Shift</Kbd>, <>Jog (<C>Jog_Fwd_Loop</C>)</>],
          ["Drag", "Look around"],
          [<Kbd key="e">E</Kbd>, "Brew, when the prompt shows next to the machine"],
          [<Kbd key="k">K</Kbd>, "Add the current view as a keyframe"],
          [<Kbd key="f">F</Kbd>, "Cheer"],
        ]}
      />
      <P>
        Outside play mode the same walk keys work in the third- and first-person camera modes, and <Kbd>Q</Kbd> /{" "}
        <Kbd>E</Kbd> change height in orbit and path modes.
      </P>

      <H2 id="phones">On phones and tablets</H2>
      <UL>
        <li>
          <strong>Joystick:</strong> a thumb stick appears bottom left in the walk modes. A light push walks, a full push jogs.
        </li>
        <li>
          <strong>Buttons:</strong> Brew, Frame and Cheer sit bottom right, standing in for <Kbd>E</Kbd>, <Kbd>K</Kbd> and{" "}
          <Kbd>F</Kbd>.
        </li>
        <li>
          <strong>Look:</strong> drag anywhere else on the stage. The stage uses pointer events with{" "}
          <C>touch-action: none</C>, so dragging does not scroll the page.
        </li>
      </UL>
      <P>Touch controls show on coarse pointers and on screens up to 900 px wide.</P>

      <H2 id="expand">Expand</H2>
      <P>
        The <strong>Expand</strong> button at the right end of the stage toolbar hides the docks, header and timeline and
        gives the render the whole screen. It uses the browser&apos;s fullscreen API where it is allowed and falls back to a
        fixed full-window stage elsewhere (for example in iOS Safari). Press <Kbd>Esc</Kbd> or the same button to return.
      </P>

      <H2 id="how">How it is built</H2>
      <UL>
        <li>
          <strong>The machine</strong> is the URDF from <C>articulationAnimation</C>, assembled at runtime by{" "}
          <C>loadUrdfAssembly</C>. Each frame resets the link transforms and applies the joint values, so brewing is the same
          code path as the joint sliders on the <A href="/lab">bench</A>.
        </li>
        <li>
          <strong>The actor</strong> is one skinned GLB with eight retargeted clips. Clip choice is a small state machine:
          forced <C>Interact</C> for 2 s after brewing and <C>Dance_Loop</C> for 3 s after cheering, otherwise idle, walk or
          jog from your input.
        </li>
        <li>
          <strong>Quest state</strong> lives in a ref read by the render loop, and only step changes reach React, so the
          overlay does not re-render at frame rate.
        </li>
      </UL>

      <Callout>
        The quest is built around the Designer Smart Loft, where the machine stands on the voxel floor. In other worlds you can
        still walk the actor, take keyframes and cheer.
      </Callout>
    </DocArticle>
  );
}
