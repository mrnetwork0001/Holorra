import type { Metadata } from "next";
import { A, C, Callout, DocArticle, H2, OL, P, Pre, Table } from "@/components/docs/prose";

export const metadata: Metadata = { title: "Camera director" };

export default function DirectorDoc() {
  return (
    <DocArticle
      href="/docs/director"
      title="Camera director"
      lead={
        <>
          <strong>Block the shot in 3D, then hand it to LuxReal.</strong> Keyframes store where the camera is, what it looks
          at, how long the shot lasts and what it should look like. Holorra plays them back as a smooth path over the live
          stage and exports a storyboard pack for LuxReal&apos;s video creator.
        </>
      }
    >
      <H2 id="keyframes">Keyframes</H2>
      <P>
        Press <strong>Keyframe</strong> on the stage toolbar (or <C>K</C> in walk modes). Each keyframe records the camera
        position and look-at target, a 3 s duration, a shot prompt written from the current prop, explode level and actor,
        and a reference frame captured from the WebGL canvas. Every world starts with three hand-written keyframes, and the
        trash icon removes one.
      </P>
      <Table
        head={["Field", "Meaning"]}
        rows={[
          [<C key="p">position</C>, "Camera position in stage coordinates (−Y up)"],
          [<C key="t">target</C>, "The point the camera looks at"],
          [<C key="d">durationSec</C>, "How long the shot lasts on playback and in the storyboard"],
          [<C key="l">luxrealPrompt</C>, "The shot description for LuxReal"],
          [<C key="s">snapshotDataUrl</C>, "The reference frame, when one was captured"],
        ]}
      />

      <H2 id="playback">Playback</H2>
      <P>
        <strong>Play path</strong> flies the camera through the keyframes on a Catmull-Rom spline. Position and target are
        interpolated separately, so the camera both moves and turns smoothly; the curve passes through every keyframe. The
        Path camera mode previews the same path. The code is <C>evaluateCameraSpline</C> in{" "}
        <C>src/lib/luxreal-exporter.ts</C>.
      </P>

      <H2 id="export">Export for LuxReal</H2>
      <OL>
        <li>
          <strong>Copy prompt</strong> copies a master video prompt: the world, the hero prop and its explode level, the
          actor and its clip, then one line per shot.
        </li>
        <li>
          <strong>Storyboard JSON</strong> downloads the full pack with schema <C>manycore.aholo.luxreal.storyboard.v1</C>.
        </li>
        <li>
          <strong>Open in LuxReal</strong> opens <A href="https://www.luxreal.com/create-video?createType=8">LuxReal&apos;s video
          creator</A>; paste the prompt and use the reference frames.
        </li>
      </OL>
      <Pre title="storyboard.json (shape)">{`{
  "schema": "manycore.aholo.luxreal.storyboard.v1",
  "worldTitle": "Designer Smart Loft",
  "heroAssetName": "Espresso machine (Lux3D)",
  "actorName": "...",
  "activeAnimationClip": "Idle_Loop",
  "partExplosionPercent": 0,
  "totalDurationSec": 9.5,
  "luxrealPortalUrl": "https://www.luxreal.com/create-video?createType=8",
  "masterVideoPrompt": "[LuxReal 3D-Consistent Scene Brief] World: ...",
  "shots": [
    { "shotNumber": 1, "label": "Entrance wide", "durationSec": 3,
      "cameraPosition": [-4.2, 0.8, 1.2], "cameraLookAt": [...],
      "luxrealPrompt": "...", "hasKeyframeSnapshot": true }
  ]
}`}</Pre>

      <Callout>
        Holorra does not call LuxReal itself. It prepares the prompt, the camera data and the reference frames; the last step,
        pasting them into LuxReal, is yours.
      </Callout>
    </DocArticle>
  );
}
