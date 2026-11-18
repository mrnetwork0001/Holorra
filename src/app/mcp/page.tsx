"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { AHOLO_MCP_TOOL_CATALOG } from "@/config/humanoid-animations";
import { Glyph } from "@/components/brand/Glyph";
import { Logo } from "@/components/brand/Logo";

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

function CopyButton({ text, label }: { text: string; label: string }) {
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
      aria-label={label}
    >
      <Glyph name={copied ? "check" : "copy"} size={14} className={copied ? "text-ok" : ""} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function AholoMcpHubPage() {
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
          <Link href="/" aria-label="Holorra home">
            <Logo size={20} />
          </Link>
          <span className="hidden h-4 w-px bg-line sm:block" />
          <Link href="/studio" className="btn btn-ghost btn-sm">
            <Glyph name="back" size={14} />
            Back to studio
          </Link>
          <span className="ml-auto hidden font-mono text-[11.5px] text-ink-3 md:block">@manycore/aholo-sdk-mcp 1.10.0</span>
          <Link href="/report" className="btn btn-sm">
            <Glyph name="doc" size={14} />
            Project report
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-4 pb-20 pt-14">
        {/* ------------------------------------------------------------ 01 Connect */}
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="label">
              <span className="text-accent">01</span> — Connect an agent
            </div>
            <h1 className="mt-3 font-serif text-[46px] leading-[1.02] tracking-[-0.01em] text-ink">
              Drive Aholo from your coding agent.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
              Holorra ships a <span className="font-mono text-[13.5px] text-ink">.mcp.json</span> for Manycore&apos;s
              official MCP server. It gives Claude Code, Cursor or any MCP client the World tools (SpatialGen and Reality),
              the Lux3D tools (generation, part split, articulation, rigging, retargeting, materials, export) and asset
              upload, all billed to your own Aholo key.
            </p>

            <div className="mt-6">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="label">Claude Code, one line</span>
                <CopyButton text={CLI_COMMAND} label="Copy command" />
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-line bg-surface p-3 font-mono text-[12px] leading-relaxed text-ink">
                <span className="select-none text-ink-3">$ </span>
                {CLI_COMMAND}
              </pre>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <a href="https://labs.aholo.ai/api-docs" target="_blank" rel="noreferrer" className="btn btn-sm">
                Aholo OpenAPI docs
                <Glyph name="external" size={13} className="text-ink-3" />
              </a>
              <a href="https://aholojs.dev/" target="_blank" rel="noreferrer" className="btn btn-sm">
                Aholo Viewer docs
                <Glyph name="external" size={13} className="text-ink-3" />
              </a>
              <a href="https://labs.aholo.ai/api-keys" target="_blank" rel="noreferrer" className="btn btn-sm">
                <Glyph name="key" size={14} className="text-ink-3" />
                Get an API key
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
                <CopyButton text={CLAUDE_CODE_MCP_CONFIG} label="Copy .mcp.json" />
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.7] text-ink">
                {CLAUDE_CODE_MCP_CONFIG}
              </pre>
              <div className="grid grid-cols-3 border-t border-line text-[12px]">
                {[
                  ["Transport", "stdio via npx"],
                  ["Regions", "com · cn"],
                  ["Tools on server", String(SERVER_TOOL_COUNT)],
                ].map(([k, v]) => (
                  <div key={k} className="border-r border-line px-4 py-3 last:border-r-0">
                    <div className="label">{k}</div>
                    <div className="mt-1 font-mono text-ink tabular">{v}</div>
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
                <span className="text-accent">02</span> — Tool playground
              </div>
              <h2 className="mt-2 font-serif text-[34px] leading-tight text-ink">Inspect a tool before your agent calls it.</h2>
            </div>
            <p className="max-w-md text-[13px] leading-relaxed text-ink-3">
              {AHOLO_MCP_TOOL_CATALOG.length} of the {SERVER_TOOL_COUNT} tools in @manycore/aholo-sdk-mcp, with the SDK
              method each one wraps and sample arguments.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Tool list */}
            <nav className="lg:col-span-4" aria-label="MCP tools">
              <div className="max-h-[640px] space-y-5 overflow-y-auto pr-2">
                {groups.map(([module, tools]) => (
                  <div key={module}>
                    <div className="label mb-1.5">{module}</div>
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
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{selectedTool.description}</p>
              </div>
              <div className="p-5">
                <div className="label mb-2">Sample arguments</div>
                <pre className="overflow-x-auto rounded-md border border-line bg-canvas p-4 font-mono text-[12px] leading-relaxed text-ink">
                  {JSON.stringify(selectedTool.sampleArgs, null, 2)}
                </pre>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={handleSimulateTool} disabled={isExecuting} className="btn btn-primary">
                    <Glyph name={isExecuting ? "loader" : "chat"} size={15} />
                    {isExecuting ? "Planning…" : "Send to co-director"}
                  </button>
                  <span className="text-[12px] text-ink-3">
                    Returns the co-director&apos;s tool plan. No cloud job is started.
                  </span>
                </div>

                {toolResult && (
                  <div className="mt-5">
                    <div className="label mb-2">Planner response</div>
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
