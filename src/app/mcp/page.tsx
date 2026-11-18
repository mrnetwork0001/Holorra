"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AHOLO_MCP_TOOL_CATALOG } from "@/config/humanoid-animations";
import { Glyph } from "@/components/brand/Glyph";
import { Logo } from "@/components/brand/Logo";
import { useLang } from "@/components/brand/LangSwitch";
import { T, tx, type L } from "@/lib/i18n";

/** Tool count of the official @manycore/aholo-sdk-mcp 1.10.0 server. */
const SERVER_TOOL_COUNT = 26;

const CLAUDE_CODE_MCP_CONFIG = `{
  "mcpServers": {
    "aholo-sdk-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@manycore/aholo-sdk-mcp"],
      "env": {
        "AHOLO_API_KEY": "YOUR_AHOLO_API_KEY",
        "AHOLO_REGION": "com"
      }
    }
  }
}`;

const CLI_COMMAND =
  "claude mcp add aholo -e AHOLO_API_KEY=your_key -e AHOLO_REGION=com -- npx -y @manycore/aholo-sdk-mcp";

/** Chinese labels for the catalog's module groups (the English module string stays the key). */
const MODULE_ZH: Record<string, string> = {
  "World (SpatialGen & Reality)": "世界（SpatialGen 与 Reality）",
  "Lux3D Generation": "Lux3D 生成",
  "Lux3D Part-Split & Rigging": "Lux3D 部件拆分与绑骨",
  "Asset & Tasks": "资产与任务",
};

/** Chinese copy of each catalog tool description, by tool name; falls back to the English description. */
const TOOL_DESC_ZH: Record<string, string> = {
  world_generate: "通过 Aholo SpatialGen，用文本提示词和/或单张参考图生成 3D 高斯泼溅（3DGS）世界。",
  world_reconstruct_space:
    "通过 Aholo Reality，用视频（.mp4/.mov）、Insta360 全景（.insv）或至少 20 张照片重建完整的室内或室外 3DGS 场景。",
  world_reconstruct_object: "把现实中的实物产品或雕塑重建为高密度 3DGS 模型，并用前景蒙版分割出主体。",
  world_get: "按 worldId 查询 SpatialGen 或 Reality 任务的实时进度（0.0-1.0）和产物地址（.ply、.spz、AI 全景图）。",
  world_list: "分页列出工作区中已生成和已重建的 3DGS 世界。",
  lux3d_text_to_3d: "用 G1 或 G1-Turbo，直接从自然语言描述生成水密的 PBR 3D 网格（.glb / .zip）。",
  lux3d_img_to_3d: "把单张参考图或一组多视角图片转换为 10k-300k 面的 PBR 3D 资产，支持 AI 尺寸预测。",
  lux3d_image_to_four_view: "在生成 3D 之前，根据提示词或概念图合成视角一致的正交四视图（角色或道具设定图）。",
  lux3d_multimodal_to_image: "生成影棚布光的参考概念图，专为后续的 Lux3D 重建优化。",
  lux3d_part_split: "按语义把一个整体 GLB 模型拆成独立、干净的子网格，便于爆炸视图、编辑或 3D 打印。",
  lux3d_articulation_animation: "推断 3D 物体上的铰链、滑轨等运动关节，并根据文本提示词生成开合动画。",
  lux3d_humanoid_auto_rig: "为静态角色 GLB 网格自动计算完整的人形骨骼和蒙皮权重。",
  lux3d_humanoid_animation_retarget: "从 85 个 Lux3D 官方动捕预设中选 1 到 10 个动画，重定向到已绑骨的人形 GLB/FBX 上。",
  lux3d_material_transfer: "把参考材质照片的高分辨率 PBR 外观迁移到目标 3D GLB 网格上（v3.0-standard）。",
  lux3d_multi_format_export: "把 Lux3D 模型转换为 CAD、AR、游戏引擎和 3D 打印常用格式（USDZ、OBJ、FBX、STL、3MF）。",
  upload_asset: "把本地图片、视频、.insv 全景或 .glb 网格直接上传到 Manycore CDN，供后续 Aholo 任务使用。",
  lux3d_get_task: "查询任意 Lux3D taskId 的状态（0=初始化，1=进行中，3=成功，4=失败）和产物的 CDN 下载地址。",
};

function CopyButton({ text, label }: { text: string; label: L }) {
  const lang = useLang();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="btn btn-ghost btn-sm"
      aria-label={tx(lang, label)}
    >
      <Glyph name={copied ? "check" : "copy"} size={14} className={copied ? "text-ok" : ""} />
      {copied ? <T en="Copied" zh="已复制" /> : <T en="Copy" zh="复制" />}
    </button>
  );
}

export default function AholoMcpHubPage() {
  const lang = useLang();
  const [selectedTool, setSelectedTool] = useState(AHOLO_MCP_TOOL_CATALOG[0]);
  const [toolResult, setToolResult] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, typeof AHOLO_MCP_TOOL_CATALOG>();
    for (const t of AHOLO_MCP_TOOL_CATALOG) {
      const list = map.get(t.module) ?? [];
      list.push(t);
      map.set(t.module, list);
    }
    return [...map.entries()];
  }, []);

  const handleSimulateTool = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch("/api/aholo/director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Run ${selectedTool.name} (${selectedTool.sdkMethod})`,
        }),
      });
      const data = await res.json();
      setToolResult(
        JSON.stringify(
          {
            jsonrpc: "2.0",
            mcpServer: "@manycore/aholo-sdk-mcp@1.10.0",
            tool: selectedTool.name,
            sdkMethod: selectedTool.sdkMethod,
            inputArguments: selectedTool.sampleArgs,
            response: data,
          },
          null,
          2
        )
      );
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex h-12 max-w-[1200px] items-center gap-4 px-4">
          <Link href="/" aria-label={tx(lang, { en: "Holorra home", zh: "Holorra 首页" })}>
            <Logo size={20} />
          </Link>
          <span className="hidden h-4 w-px bg-line sm:block" />
          <Link href="/studio" className="btn btn-ghost btn-sm">
            <Glyph name="back" size={14} />
            <T en="Back to studio" zh="返回创作台" />
          </Link>
          <span className="ml-auto hidden font-mono text-[11.5px] text-ink-3 md:block">@manycore/aholo-sdk-mcp 1.10.0</span>
          <Link href="/report" className="btn btn-sm">
            <Glyph name="doc" size={14} />
            <T en="Project report" zh="项目报告" />
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-4 pb-20 pt-14">
        {/* ------------------------------------------------------------ 01 Connect */}
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="label">
              <span className="text-accent">01</span> <T en="— Connect an agent" zh="接入智能体" />
            </div>
            <h1 className="mt-3 font-serif text-[46px] leading-[1.02] tracking-[-0.01em] text-ink">
              <T en="Drive Aholo from your coding agent." zh="用你的编程智能体驱动 Aholo。" />
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
              <T
                en={
                  <>
                    Holorra ships a <span className="font-mono text-[13.5px] text-ink">.mcp.json</span> for Manycore&apos;s
                    official MCP server. It gives Claude Code, Cursor or any MCP client the World tools (SpatialGen and Reality),
                    the Lux3D tools (generation, part split, articulation, rigging, retargeting, materials, export) and asset
                    upload, all billed to your own Aholo key.
                  </>
                }
                zh={
                  <>
                    Holorra 为 Manycore 官方 MCP 服务器准备了一份 <span className="font-mono text-[13.5px] text-ink">.mcp.json</span>。接入后，Claude
                    Code、Cursor 或任何 MCP 客户端都能调用世界工具（SpatialGen 与 Reality）、Lux3D
                    工具（生成、部件拆分、关节化、绑骨、动画重定向、材质、导出）和资产上传，费用全部计入你自己的 Aholo 密钥。
                  </>
                }
              />
            </p>

            <div className="mt-6">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="label">
                  <T en="Claude Code, one line" zh="Claude Code 一行命令接入" />
                </span>
                <CopyButton text={CLI_COMMAND} label={{ en: "Copy command", zh: "复制命令" }} />
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-line bg-surface p-3 font-mono text-[12px] leading-relaxed text-ink">
                <span className="select-none text-ink-3">$ </span>
                {CLI_COMMAND}
              </pre>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <a href="https://labs.aholo.ai/api-docs" target="_blank" rel="noreferrer" className="btn btn-sm">
                <T en="Aholo OpenAPI docs" zh="Aholo OpenAPI 文档" />
                <Glyph name="external" size={13} className="text-ink-3" />
              </a>
              <a href="https://aholojs.dev/" target="_blank" rel="noreferrer" className="btn btn-sm">
                <T en="Aholo Viewer docs" zh="Aholo Viewer 文档" />
                <Glyph name="external" size={13} className="text-ink-3" />
              </a>
              <a href="https://labs.aholo.ai/api-keys" target="_blank" rel="noreferrer" className="btn btn-sm">
                <Glyph name="key" size={14} className="text-ink-3" />
                <T en="Get an API key" zh="获取 API 密钥" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="panel overflow-hidden">
              <div className="flex h-10 items-center justify-between border-b border-line pl-4 pr-1.5">
                <span className="flex items-center gap-2 font-mono text-[12px] text-ink-2">
                  <Glyph name="terminal" size={14} className="text-ink-3" />
                  .mcp.json
                </span>
                <CopyButton text={CLAUDE_CODE_MCP_CONFIG} label={{ en: "Copy .mcp.json", zh: "复制 .mcp.json" }} />
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.7] text-ink">
                {CLAUDE_CODE_MCP_CONFIG}
              </pre>
              <div className="grid grid-cols-3 border-t border-line text-[12px]">
                {(
                  [
                    [{ en: "Transport", zh: "传输方式" }, { en: "stdio via npx", zh: "stdio（npx 启动）" }],
                    [{ en: "Regions", zh: "区域" }, { en: "com · cn", zh: "com · cn" }],
                    [{ en: "Tools on server", zh: "服务器工具数" }, { en: String(SERVER_TOOL_COUNT), zh: String(SERVER_TOOL_COUNT) }],
                  ] as [L, L][]
                ).map(([k, v]) => (
                  <div key={k.en} className="border-r border-line px-4 py-3 last:border-r-0">
                    <div className="label">
                      <T en={k.en} zh={k.zh} />
                    </div>
                    <div className="mt-1 font-mono text-ink tabular">
                      <T en={v.en} zh={v.zh} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ 02 Playground */}
        <section className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <div>
              <div className="label">
                <span className="text-accent">02</span> <T en="— Tool playground" zh="工具试验场" />
              </div>
              <h2 className="mt-2 font-serif text-[34px] leading-tight text-ink">
                <T en="Inspect a tool before your agent calls it." zh="让智能体调用之前，先看清每个工具。" />
              </h2>
            </div>
            <p className="max-w-md text-[13px] leading-relaxed text-ink-3">
              <T
                en={
                  <>
                    {AHOLO_MCP_TOOL_CATALOG.length} of the {SERVER_TOOL_COUNT} tools in @manycore/aholo-sdk-mcp, with the SDK
                    method each one wraps and sample arguments.
                  </>
                }
                zh={
                  <>
                    收录 @manycore/aholo-sdk-mcp 全部 {SERVER_TOOL_COUNT} 个工具中的 {AHOLO_MCP_TOOL_CATALOG.length} 个，并列出每个工具封装的
                    SDK 方法和示例参数。
                  </>
                }
              />
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Tool list */}
            <nav className="lg:col-span-4" aria-label={tx(lang, { en: "MCP tools", zh: "MCP 工具" })}>
              <div className="max-h-[640px] space-y-5 overflow-y-auto pr-2">
                {groups.map(([module, tools]) => (
                  <div key={module}>
                    <div className="label mb-1.5">
                      <T en={module} zh={MODULE_ZH[module] ?? module} />
                    </div>
                    <ul>
                      {tools.map((tool) => {
                        const active = selectedTool.name === tool.name;
                        return (
                          <li key={tool.name}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTool(tool);
                                setToolResult(null);
                              }}
                              className={`relative w-full rounded-md px-3 py-2 text-left transition ${
                                active ? "bg-raised" : "hover:bg-surface"
                              }`}
                            >
                              {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded bg-accent" />}
                              <div className={`font-mono text-[12.5px] ${active ? "text-ink" : "text-ink-2"}`}>{tool.name}</div>
                              <div className="mt-0.5 truncate font-mono text-[11px] text-ink-3">{tool.sdkMethod}</div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </nav>

            {/* Inspector */}
            <div className="panel flex flex-col lg:col-span-8">
              <div className="border-b border-line p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-mono text-[16px] text-ink">{selectedTool.name}</h3>
                  <span className="chip">{selectedTool.sdkMethod}</span>
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                  <T en={selectedTool.description} zh={TOOL_DESC_ZH[selectedTool.name] ?? selectedTool.description} />
                </p>
              </div>
              <div className="p-5">
                <div className="label mb-2">
                  <T en="Sample arguments" zh="示例参数" />
                </div>
                <pre className="overflow-x-auto rounded-md border border-line bg-canvas p-4 font-mono text-[12px] leading-relaxed text-ink">
                  {JSON.stringify(selectedTool.sampleArgs, null, 2)}
                </pre>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={handleSimulateTool} disabled={isExecuting} className="btn btn-primary">
                    <Glyph name={isExecuting ? "loader" : "chat"} size={15} />
                    {isExecuting ? <T en="Planning…" zh="规划中…" /> : <T en="Send to co-director" zh="发送给 AI 副导演" />}
                  </button>
                  <span className="text-[12px] text-ink-3">
                    <T
                      en="Returns the co-director's tool plan. No cloud job is started."
                      zh="返回 AI 副导演的工具调用计划，不会启动云端任务。"
                    />
                  </span>
                </div>

                {toolResult && (
                  <div className="mt-5">
                    <div className="label mb-2">
                      <T en="Planner response" zh="规划器响应" />
                    </div>
                    <pre className="max-h-72 overflow-auto rounded-md border border-line bg-canvas p-4 font-mono text-[11.5px] leading-relaxed text-ink-2">
                      {toolResult}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
