import type { Metadata } from "next";
import { A, C, Callout, DocArticle, H2, OL, P, Pre, Table, UL } from "@/components/docs/prose";
import { T } from "@/lib/i18n";

export const metadata: Metadata = { title: "MCP & co-director" };

export default function McpDoc() {
  return (
    <DocArticle
      href="/docs/mcp"
      title={<T en="MCP & co-director" zh="MCP 与 AI 副导演" />}
      lead={
        <T
          en={
            <>
              <strong>The same Aholo APIs, driven from your editor or from a sentence.</strong> Holorra ships a ready{" "}
              <C>.mcp.json</C> for the official <C>@manycore/aholo-sdk-mcp</C> server, and the studio&apos;s co-director turns a
              plain-language brief into an ordered plan of those MCP tool calls.
            </>
          }
          zh={
            <>
              <strong>同一套 Aholo API，既能在编辑器里调用，也能用一句话驱动。</strong>Holorra 为官方 <C>@manycore/aholo-sdk-mcp</C>{" "}
              服务器准备了现成的 <C>.mcp.json</C>；创作台里的 AI 副导演则把一段自然语言描述转成按顺序排列的 MCP 工具调用计划。
            </>
          }
        />
      }
    >
      <H2 id="setup">
        <T en="Use Aholo MCP in Claude Code or Cursor" zh="在 Claude Code 或 Cursor 中使用 Aholo MCP" />
      </H2>
      <P>
        <T
          en={
            <>
              The repository root contains this file. Put your key in place of the placeholder (or set it in your shell) and open the
              project in an MCP client.
            </>
          }
          zh="代码仓库根目录下就有这个文件。把占位符换成你的密钥（或在 shell 中设置），再用 MCP 客户端打开项目即可。"
        />
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
        <T
          en={
            <>
              The <A href="/mcp">MCP hub</A> has copy buttons for Claude Code, Claude Desktop and Cursor, plus a playground that shows
              each tool&apos;s schema and sample arguments.
            </>
          }
          zh={
            <>
              <A href="/mcp">MCP 中心</A>提供 Claude Code、Claude Desktop 和 Cursor 的一键复制按钮，还有一个演练场，可以查看每个工具的 schema
              和示例参数。
            </>
          }
        />
      </P>

      <H2 id="tools">
        <T en="What the server exposes" zh="服务器提供的工具" />
      </H2>
      <P>
        <T
          en="@manycore/aholo-sdk-mcp 1.10.0 registers 26 tools in three families:"
          zh="@manycore/aholo-sdk-mcp 1.10.0 注册了 26 个工具，分为三类："
        />
      </P>
      <Table
        head={["Family", "Tools"]}
        rows={[
          [
            <strong key="w">
              <T en="World" zh="世界" />
            </strong>,
            <T
              key="wt"
              en={
                <>
                  <C>world_generate</C>, <C>world_reconstruct</C>, <C>world_reconstruct_space</C> / <C>_object</C> and their{" "}
                  <C>_from_files</C> variants, <C>world_get</C>, <C>world_list</C>, <C>world_wait_for</C>,{" "}
                  <C>world_inspect_local_media</C>
                </>
              }
              zh={
                <>
                  <C>world_generate</C>、<C>world_reconstruct</C>、<C>world_reconstruct_space</C> / <C>_object</C> 及其{" "}
                  <C>_from_files</C> 变体、<C>world_get</C>、<C>world_list</C>、<C>world_wait_for</C>、
                  <C>world_inspect_local_media</C>
                </>
              }
            />,
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
          [
            <strong key="a">
              <T en="Assets" zh="资产" />
            </strong>,
            <C key="u">upload_asset</C>,
          ],
        ]}
      />
      <UL>
        <li>
          <T
            en={
              <>
                <strong>Long jobs do not block.</strong> Submit returns a task or world ID at once; check with{" "}
                <C>lux3d_get_task</C> / <C>world_get</C>, and only wait when you mean to.
              </>
            }
            zh={
              <>
                <strong>长任务不会阻塞。</strong>提交后立即返回任务 ID 或世界 ID；用 <C>lux3d_get_task</C> / <C>world_get</C>{" "}
                查询进度，只在确实需要时才等待。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Local files stay local.</strong> File tools take a <C>localPath</C>; the server uploads it, so binaries do
                not pass through the MCP protocol.
              </>
            }
            zh={
              <>
                <strong>本地文件留在本地。</strong>文件类工具接收 <C>localPath</C>，由服务器负责上传，二进制数据不经过 MCP 协议。
              </>
            }
          />
        </li>
      </UL>

      <H2 id="co-director">
        <T en="The in-app co-director" zh="应用内的 AI 副导演" />
      </H2>
      <P>
        <T
          en={
            <>
              Open <strong>Co-director</strong> in the studio&apos;s right dock and describe the scene. For example:
            </>
          }
          zh={
            <>
              在创作台右侧面板中打开 <strong>AI 副导演</strong>，描述你想要的场景。例如：
            </>
          }
        />
      </P>
      <Pre>{`"Walk the actor to the espresso machine and open the hood."`}</Pre>
      <OL>
        <li>
          <T
            en={
              <>
                <strong>Plan:</strong> <C>POST /api/aholo/director</C> reads the brief and returns an ordered list of MCP tool calls,
                each with its SDK method, arguments and a one-line rationale.
              </>
            }
            zh={
              <>
                <strong>规划：</strong><C>POST /api/aholo/director</C> 读取描述，返回一组按顺序排列的 MCP 工具调用，每条都附有对应的 SDK
                方法、参数和一句话理由。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Apply:</strong> the stage is updated to match the plan: world, prop, explode level, articulation, actor clip,
                camera mode, and camera-path playback.
              </>
            }
            zh={
              <>
                <strong>应用：</strong>舞台按计划更新，包括世界、道具、爆炸程度、关节化、角色动作片段、镜头模式和镜头路径回放。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Receipts:</strong> each planned call is listed with its tool name, SDK method and arguments.
              </>
            }
            zh={
              <>
                <strong>调用回执：</strong>逐条列出计划中的每个调用，以及它的工具名、SDK 方法和参数。
              </>
            }
          />
        </li>
      </OL>
      <Callout>
        <T
          en={
            <>
              The planner is deterministic: it matches keywords (worlds, props, actions, clip names) to tool calls, so the same
              brief always gives the same plan and it needs no LLM key. Briefs can be in English or Chinese. It plans; it does
              not run the jobs. To run them, use the Lux3D and World tabs or an MCP client.
            </>
          }
          zh={
            <>
              规划器是确定性的：它把关键词（世界、道具、动作、动作片段名称）匹配到工具调用，所以同样的描述总会得到同样的计划，也不需要
              LLM 密钥。中英文描述都可以。它只做规划，不会实际运行任务。要运行任务，请使用 Lux3D 和世界标签页，或 MCP 客户端。
            </>
          }
        />
      </Callout>
    </DocArticle>
  );
}
