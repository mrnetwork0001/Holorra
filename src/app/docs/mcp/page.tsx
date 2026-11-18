import type { Metadata } from "next";
import { A, C, Callout, DocArticle, H2, OL, P, Pre, Table, UL } from "@/components/docs/prose";

export const metadata: Metadata = { title: "MCP & co-director" };

export default function McpDoc() {
  return (
    <DocArticle
      href="/docs/mcp"
      title="MCP & co-director"
      lead={
        <>
          <strong>The same Aholo APIs, driven from your editor or from a sentence.</strong> Holorra ships a ready{" "}
          <C>.mcp.json</C> for the official <C>@manycore/aholo-sdk-mcp</C> server, and the studio&apos;s co-director turns a
          plain-language brief into an ordered plan of those MCP tool calls.
        </>
      }
    >
      <H2 id="setup">Use Aholo MCP in Claude Code or Cursor</H2>
      <P>
        The repository root contains this file. Put your key in place of the placeholder (or set it in your shell) and open the
        project in an MCP client.
      </P>
      <Pre title=".mcp.json">{`{
  "mcpServers": {
    "aholo-sdk-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@manycore/aholo-sdk-mcp"],
      "env": { "AHOLO_API_KEY": "<your key>", "AHOLO_REGION": "com" }
    }
  }
}`}</Pre>
      <P>
        The <A href="/mcp">MCP hub</A> has copy buttons for Claude Code, Claude Desktop and Cursor, plus a playground that shows
        each tool&apos;s schema and sample arguments.
      </P>

      <H2 id="tools">What the server exposes</H2>
      <P>@manycore/aholo-sdk-mcp 1.10.0 registers 26 tools in three families:</P>
      <Table
        head={["Family", "Tools"]}
        rows={[
          [
            <strong key="w">World</strong>,
            <>
              <C>world_generate</C>, <C>world_reconstruct</C>, <C>world_reconstruct_space</C> / <C>_object</C> and their{" "}
              <C>_from_files</C> variants, <C>world_get</C>, <C>world_list</C>, <C>world_wait_for</C>,{" "}
              <C>world_inspect_local_media</C>
            </>,
          ],
          [
            <strong key="l">Lux3D</strong>,
            <>
              <C>lux3d_text_to_3d</C>, <C>lux3d_img_to_3d</C>, <C>lux3d_img_to_3d_from_file</C>,{" "}
              <C>lux3d_image_to_four_view</C>, <C>lux3d_multimodal_to_image</C>, <C>lux3d_part_split</C>,{" "}
              <C>lux3d_articulation_animation</C>, <C>lux3d_humanoid_auto_rig</C>, <C>lux3d_humanoid_animation_retarget</C>,{" "}
              <C>lux3d_material_transfer</C>, <C>lux3d_multi_format_export</C>, <C>lux3d_get_task</C>,{" "}
              <C>lux3d_list_tasks</C>, <C>lux3d_wait_for_task</C>
            </>,
          ],
          [<strong key="a">Assets</strong>, <C key="u">upload_asset</C>],
        ]}
      />
      <UL>
        <li>
          <strong>Long jobs do not block.</strong> Submit returns a task or world ID at once; check with{" "}
          <C>lux3d_get_task</C> / <C>world_get</C>, and only wait when you mean to.
        </li>
        <li>
          <strong>Local files stay local.</strong> File tools take a <C>localPath</C>; the server uploads it, so binaries do
          not pass through the MCP protocol.
        </li>
      </UL>

      <H2 id="co-director">The in-app co-director</H2>
      <P>
        Open <strong>Co-director</strong> in the studio&apos;s right dock and describe the scene. For example:
      </P>
      <Pre>{`"Walk the actor to the espresso machine and open the hood."`}</Pre>
      <OL>
        <li>
          <strong>Plan:</strong> <C>POST /api/aholo/director</C> reads the brief and returns an ordered list of MCP tool calls,
          each with its SDK method, arguments and a one-line rationale.
        </li>
        <li>
          <strong>Apply:</strong> the stage is updated to match the plan: world, prop, explode level, articulation, actor clip,
          camera mode, and camera-path playback.
        </li>
        <li>
          <strong>Receipts:</strong> each planned call is listed with its tool name, SDK method and arguments.
        </li>
      </OL>
      <Callout>
        The planner is deterministic: it matches keywords (worlds, props, actions, clip names) to tool calls, so the same
        brief always gives the same plan and it needs no LLM key. It plans; it does not run the jobs. To run them, use the
        Lux3D and World tabs or an MCP client.
      </Callout>
    </DocArticle>
  );
}
