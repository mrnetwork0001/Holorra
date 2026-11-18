"use client";

import type { ActorId } from "@/config/aholo-presets";
import React, { useState, useMemo } from "react";
import {
  AHOLO_RIGGED_ACTORS,
  type Lux3dHeroAssetBlueprint,
} from "@/config/aholo-presets";
import {
  HUMANOID_ANIMATION_GROUPS,
  type HumanoidAnimationId,
} from "@/config/humanoid-animations";
import type {
  PartOverrideState,
  StageCameraMode,
} from "@/components/stage/AholoHybridStage";
import type { ApiReceiptLog } from "@/components/docks/CreationDock";
import type {
  McpDirectorStep,
  DirectorStageMutation,
} from "@/app/api/aholo/director/route";
import { Glyph, type GlyphName } from "@/components/brand/Glyph";

export interface InspectorDockProps {
  activeHeroBlueprint: Lux3dHeroAssetBlueprint;
  explodePercent: number;
  onExplodePercentChange: (pct: number) => void;
  articulateActive: boolean;
  onArticulateToggle: (val: boolean) => void;
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  partOverrides: Record<string, PartOverrideState>;
  onTogglePartVisible: (partId: string) => void;
  onSetPartColor: (partId: string, colorHex: string) => void;
  onResetParts: () => void;
  actorId: ActorId;
  onSelectActor: (id: ActorId) => void;
  activeAnimationId: HumanoidAnimationId;
  onSelectAnimation: (animId: HumanoidAnimationId) => void;
  cameraMode: StageCameraMode;
  onCameraModeChange: (mode: StageCameraMode) => void;
  onApplyDirectorMutation: (mutation: DirectorStageMutation) => void;
  onAddReceipt: (receipt: ApiReceiptLog) => void;
  apiKey: string;
  region: "com" | "cn";
}

/** Finish overrides for a selected part: real-world material tones, not brand colours. */
const PBR_FINISH_SWATCHES = [
  { name: "Brushed steel", hex: "#C9CCD1" },
  { name: "Titanium", hex: "#8E969F" },
  { name: "Graphite", hex: "#45464A" },
  { name: "Matte white", hex: "#E8E6E1" },
  { name: "Brass", hex: "#C3A05B" },
  { name: "Oxide red", hex: "#B4472F" },
  { name: "Teal enamel", hex: "#2F7D78" },
  { name: "Signal orange", hex: "#FF6A2B" },
];

const EXPLODE_STOPS = [
  { label: "Closed", val: 0 },
  { label: "Inspect", val: 35 },
  { label: "Service", val: 65 },
  { label: "CAD", val: 100 },
];

const DIRECTOR_PRESETS = [
  "Explode the espresso synthesizer parts to 75%, open its articulated hood, and make the robot dance",
  "Switch to the Juguo Urban Plaza world, spawn the Aegis patrol turret, and split parts to 50%",
  "Switch to Grand Transit Concourse, load the ChronoGate holo-kiosk, and run a cinematic camera flythrough",
];

/* ---------------------------------------------------------------------------
 * Presentational helpers (match CreationDock)
 * ------------------------------------------------------------------------- */

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 py-4 border-b border-line">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="label">{title}</h3>
        {meta != null && <div className="font-mono text-[10.5px] text-ink-3 tabular">{meta}</div>}
      </div>
      {children}
    </section>
  );
}

function RunButton({
  label,
  method,
  glyph,
  onClick,
  busy,
  primary,
}: {
  label: string;
  method: string;
  glyph: GlyphName;
  onClick: () => void;
  busy?: boolean;
  primary?: boolean;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className={`btn w-full ${primary ? "btn-primary" : ""}`}
      >
        <Glyph name={busy ? "loader" : glyph} size={14} />
        <span>{label}</span>
      </button>
      <div className="mt-1.5 font-mono text-[10.5px] text-ink-3 truncate">{method}</div>
    </div>
  );
}

export default function InspectorDock({
  activeHeroBlueprint,
  explodePercent,
  onExplodePercentChange,
  articulateActive,
  onArticulateToggle,
  selectedPartId,
  onSelectPart,
  partOverrides,
  onTogglePartVisible,
  onSetPartColor,
  onResetParts,
  actorId,
  onSelectActor,
  activeAnimationId,
  onSelectAnimation,
  cameraMode,
  onCameraModeChange,
  onApplyDirectorMutation,
  onAddReceipt,
  apiKey,
  region,
}: InspectorDockProps) {
  const [activeTab, setActiveTab] = useState<"parts" | "rig" | "mcp">("parts");

  // Part Split & Articulation state
  const [articulationPrompt, setArticulationPrompt] = useState(
    activeHeroBlueprint.articulationPrompt
  );
  const [isCallingPartApi, setIsCallingPartApi] = useState(false);

  // Humanoid Rig & 85 Animations state
  const [animSearch, setAnimSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCallingRigApi, setIsCallingRigApi] = useState(false);

  // MCP Spatial Co-Director state
  const [directorInput, setDirectorInput] = useState(DIRECTOR_PRESETS[0]);
  const [isRunningDirector, setIsRunningDirector] = useState(false);
  const [directorLogs, setDirectorLogs] = useState<
    {
      id: string;
      prompt: string;
      summary: string;
      steps: McpDirectorStep[];
    }[]
  >([
    {
      id: "init-plan",
      prompt: "Initialize hybrid 3DGS loft stage with segmented Lux3D appliance & rigged Lux3D actor",
      summary: "Boot plan: hosted loft world plus the 4-part articulated espresso machine and the rigged Lux3D actor.",
      steps: [
        {
          step: 1,
          mcpTool: "world_generate",
          sdkMethod: "world.generations.create",
          arguments: { prompt: "Designer Smart Loft 3DGS (.spz)", region: "com" },
          rationale: "Stream the indoor loft splat scene and its voxel collision grid.",
        },
        {
          step: 2,
          mcpTool: "lux3d_part_split",
          sdkMethod: "lux3d.partSplit.create",
          arguments: { glbUrl: "https://labs.aholo.ai/stage/kinetix-espresso.glb" },
          rationale: "Segment the hero mesh into semantic parts for explosion and joints.",
        },
      ],
    },
  ]);

  const buildHeaders = () => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "x-aholo-region": region,
    };
    if (apiKey) h["x-aholo-api-key"] = apiKey;
    return h;
  };

  const triggerPartOrArticulationSdk = async (
    operation: "partSplit" | "articulationAnimation"
  ) => {
    setIsCallingPartApi(true);
    try {
      const res = await fetch("/api/aholo/lux3d", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          operation,
          glbUrl: "https://labs.aholo.ai/stage/active-hero-model.glb",
          prompt: articulationPrompt,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onAddReceipt({
          id: `rcpt_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          sdkPackage: "@manycore/aholo-sdk-lux3d@1.10.0",
          sdkMethod: data.sdkMethod,
          taskIdOrWorldId: `task_${data.taskId}`,
          statusLabel: data.status === 3 ? "SUCCEEDED (3)" : "RUNNING (1)",
          executionMode: data.executionMode,
        });
        if (operation === "partSplit" && explodePercent === 0) {
          onExplodePercentChange(60);
        }
        if (operation === "articulationAnimation") {
          onArticulateToggle(true);
        }
      }
    } finally {
      setIsCallingPartApi(false);
    }
  };

  const triggerRigOrRetargetSdk = async (
    operation: "humanoidAutoRig" | "humanoidAnimationRetarget",
    animId?: HumanoidAnimationId
  ) => {
    setIsCallingRigApi(true);
    const clip = animId || activeAnimationId;
    try {
      const res = await fetch("/api/aholo/lux3d", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          operation,
          // the cloud cannot fetch app-relative paths: use the actor's public rig URL
          modelUrl: AHOLO_RIGGED_ACTORS[actorId].sourceRigUrl ?? AHOLO_RIGGED_ACTORS[actorId].glbUrl,
          rigModelUrl: AHOLO_RIGGED_ACTORS[actorId].sourceRigUrl ?? AHOLO_RIGGED_ACTORS[actorId].glbUrl,
          animationIds: [clip, "Idle_Loop"],
          animationOutputMode: "combined",
          outFormat: "glb",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onAddReceipt({
          id: `rcpt_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          sdkPackage: "@manycore/aholo-sdk-lux3d@1.10.0",
          sdkMethod: data.sdkMethod,
          taskIdOrWorldId: `task_${data.taskId}`,
          statusLabel: data.status === 3 ? "SUCCEEDED (3)" : "RUNNING (1)",
          executionMode: data.executionMode,
        });
      }
    } finally {
      setIsCallingRigApi(false);
    }
  };

  const handleRunDirectorPrompt = async (customPrompt?: string) => {
    const promptToRun = (customPrompt ?? directorInput).trim();
    if (!promptToRun) return;
    setIsRunningDirector(true);
    try {
      const res = await fetch("/api/aholo/director", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ prompt: promptToRun }),
      });
      const data = await res.json();
      if (data.ok) {
        setDirectorLogs((prev) => [
          {
            id: `dir_${Date.now()}`,
            prompt: promptToRun,
            summary: data.summary,
            steps: data.steps,
          },
          ...prev,
        ]);
        if (data.mutation) {
          onApplyDirectorMutation(data.mutation);
        }
        for (const step of data.steps as McpDirectorStep[]) {
          onAddReceipt({
            id: `rcpt_${Date.now()}_${step.step}`,
            timestamp: new Date().toLocaleTimeString(),
            sdkPackage: "@manycore/aholo-sdk-mcp@1.10.0",
            sdkMethod: step.sdkMethod,
            taskIdOrWorldId: `mcp_step_${step.step}`,
            statusLabel: "PLANNED",
            executionMode: "MCP_AGENT_PLAN",
          });
        }
      }
    } finally {
      setIsRunningDirector(false);
    }
  };

  const filteredAnimationGroups = useMemo(() => {
    const q = animSearch.trim().toLowerCase();
    return HUMANOID_ANIMATION_GROUPS.filter(
      (g) => selectedCategory === "all" || g.id === selectedCategory
    )
      .map((g) => ({
        ...g,
        clips: g.clips.filter(
          (c) =>
            !q ||
            c.id.toLowerCase().includes(q) ||
            c.label.toLowerCase().includes(q) ||
            c.recommendedUse.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.clips.length > 0);
  }, [animSearch, selectedCategory]);

  const totalClips = HUMANOID_ANIMATION_GROUPS.reduce((n, g) => n + g.clips.length, 0);
  const totalFaces = activeHeroBlueprint.parts.reduce((n, p) => n + p.faceCount, 0);
  const isWalking = cameraMode === "walk-third";

  const tabs: { id: typeof activeTab; label: string; glyph: GlyphName }[] = [
    { id: "parts", label: "Parts", glyph: "split" },
    { id: "rig", label: "Actor", glyph: "rig" },
    { id: "mcp", label: "Co-director", glyph: "chat" },
  ];

  return (
    <aside className="w-[340px] bg-surface border-l border-line flex flex-col h-full shrink-0 select-none overflow-hidden">
      {/* Tabs */}
      <nav className="flex items-center gap-5 px-4 border-b border-line shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className="tab"
            data-active={activeTab === t.id}
            onClick={() => setActiveTab(t.id)}
          >
            <Glyph name={t.glyph} size={14} />
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto">
        {/* ------------------------------------------------------------ PARTS */}
        {activeTab === "parts" && (
          <>
            {/* Prop header */}
            <div className="flex items-start justify-between gap-3 px-4 py-4 border-b border-line">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-ink truncate">
                  {activeHeroBlueprint.name}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-ink-3 tabular">
                  {activeHeroBlueprint.procedural
                    ? `procedural preview · ${activeHeroBlueprint.parts.length} parts`
                    : `${activeHeroBlueprint.lux3dVersion} · ${activeHeroBlueprint.parts.length} parts · ${(totalFaces / 1000).toFixed(1)}k faces`}
                </div>
              </div>
              <button
                type="button"
                onClick={onResetParts}
                title="Reset explode, visibility and finishes"
                className="btn btn-ghost btn-sm -mr-2"
              >
                <Glyph name="reset" size={13} />
                Reset
              </button>
            </div>

            <Section
              title="Explode"
              meta={<span className="text-[12px] text-ink">{explodePercent}%</span>}
            >
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={explodePercent}
                onChange={(e) => onExplodePercentChange(Number(e.target.value))}
                aria-label="Explode amount"
                className="w-full"
              />
              <div className="mt-2 grid grid-cols-4 rounded-md border border-line bg-canvas p-0.5">
                {EXPLODE_STOPS.map((stop) => {
                  const active = explodePercent === stop.val;
                  return (
                    <button
                      key={stop.val}
                      type="button"
                      onClick={() => onExplodePercentChange(stop.val)}
                      className={`h-8 rounded-[4px] leading-none transition-colors max-[900px]:h-10 ${
                        active ? "bg-hover text-ink" : "text-ink-3 hover:text-ink"
                      }`}
                    >
                      <span className="block font-mono text-[11px] tabular">{stop.val}</span>
                      <span className="block mt-0.5 text-[10px]">{stop.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4">
                <RunButton
                  primary
                  glyph="split"
                  label="Run part split"
                  method="lux3d.partSplit.create"
                  onClick={() => triggerPartOrArticulationSdk("partSplit")}
                  busy={isCallingPartApi}
                />
              </div>
            </Section>

            <Section
              title="Articulation"
              meta={
                <button
                  type="button"
                  onClick={() => onArticulateToggle(!articulateActive)}
                  className={`inline-flex items-center gap-1.5 rounded-[4px] border px-1.5 h-[22px] font-mono text-[10.5px] transition-colors ${
                    articulateActive
                      ? "border-accent/45 text-accent"
                      : "border-line text-ink-3 hover:text-ink hover:border-line-strong"
                  }`}
                >
                  <Glyph name={articulateActive ? "pause" : "play"} size={10} />
                  {articulateActive ? "playing" : "paused"}
                </button>
              }
            >
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={articulationPrompt}
                  onChange={(e) => setArticulationPrompt(e.target.value)}
                  aria-label="Describe the motion"
                  className="field resize-none leading-relaxed"
                />
                <RunButton
                  glyph="hinge"
                  label="Animate from prompt"
                  method="lux3d.articulationAnimation.create"
                  onClick={() => triggerPartOrArticulationSdk("articulationAnimation")}
                  busy={isCallingPartApi}
                />
              </div>
            </Section>

            <Section title="Parts" meta={activeHeroBlueprint.parts.length}>
              <ul className="-mx-2 space-y-px">
                {activeHeroBlueprint.parts.map((part) => {
                  const isSelected = selectedPartId === part.id;
                  const isVisible = partOverrides[part.id]?.visible ?? true;
                  const activeColor = partOverrides[part.id]?.colorHex || part.defaultColorHex;

                  return (
                    <li
                      key={part.id}
                      className={`relative rounded-md transition-colors ${
                        isSelected ? "bg-hover" : "hover:bg-raised"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-accent" />
                      )}
                      <div className="flex items-center gap-2 pl-2.5 pr-1">
                        <button
                          type="button"
                          onClick={() => onSelectPart(isSelected ? null : part.id)}
                          className="flex flex-1 min-w-0 items-center gap-2.5 h-9 text-left"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: activeColor }}
                          />
                          <span
                            className={`font-mono text-[11.5px] truncate ${
                              isVisible ? "text-ink" : "text-ink-3 line-through"
                            }`}
                          >
                            {part.name}
                          </span>
                        </button>
                        <span className="font-mono text-[10.5px] text-ink-3 tabular w-11 text-right">
                          {activeHeroBlueprint.procedural ? "—" : `${(part.faceCount / 1000).toFixed(1)}k`}
                        </span>
                        <button
                          type="button"
                          onClick={() => onTogglePartVisible(part.id)}
                          title={isVisible ? "Hide part" : "Show part"}
                          className="flex h-7 w-7 items-center justify-center rounded text-ink-3 hover:text-ink max-[900px]:h-10 max-[900px]:w-10"
                        >
                          <Glyph name={isVisible ? "eye" : "eye-off"} size={14} />
                        </button>
                      </div>

                      {isSelected && (
                        <div className="px-2.5 pb-3 pt-0.5 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-[12px] text-ink-2">
                            <span>{part.semanticRole}</span>
                            <span className="text-line-strong">·</span>
                            <span className="font-mono text-[11px] text-ink-3">
                              {part.articulationType === "none" ? "fixed" : part.articulationType}
                            </span>
                          </div>
                          <div>
                            <div className="label mb-1.5">Finish</div>
                            <div className="flex items-center gap-1.5">
                              {PBR_FINISH_SWATCHES.map((sw) => {
                                const on = activeColor.toLowerCase() === sw.hex.toLowerCase();
                                return (
                                  <button
                                    key={sw.hex}
                                    type="button"
                                    title={sw.name}
                                    aria-label={sw.name}
                                    onClick={() => onSetPartColor(part.id, sw.hex)}
                                    className={`h-5 w-5 rounded-[3px] border transition ${
                                      on
                                        ? "border-ink ring-1 ring-ink ring-offset-1 ring-offset-hover"
                                        : "border-black/30 hover:border-ink-2"
                                    }`}
                                    style={{ backgroundColor: sw.hex }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Section>
          </>
        )}

        {/* ------------------------------------------------------------ ACTOR */}
        {activeTab === "rig" && (
          <>
            <Section title="Actor">
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(AHOLO_RIGGED_ACTORS) as ActorId[]).map((id) => {
                  const actor = AHOLO_RIGGED_ACTORS[id];
                  const active = actorId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onSelectActor(id)}
                      className={`relative rounded-md border px-3 py-2.5 text-left transition-colors ${
                        active
                          ? "border-line-strong bg-hover"
                          : "border-line hover:bg-raised"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-accent" />
                      )}
                      <div className="text-[12.5px] text-ink truncate">
                        {actor.name.split("—")[0].trim()}
                      </div>
                      <div className="mt-0.5 text-[11px] text-ink-3 truncate">{actor.role}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onCameraModeChange(isWalking ? "orbit" : "walk-third")}
                  className={`btn ${isWalking ? "border-accent/50 text-accent" : ""}`}
                >
                  <Glyph name="walk" size={14} />
                  {isWalking ? "Stop walking" : "Walk"}
                </button>
                <button
                  type="button"
                  onClick={() => triggerRigOrRetargetSdk("humanoidAutoRig")}
                  disabled={isCallingRigApi}
                  className="btn"
                >
                  <Glyph name={isCallingRigApi ? "loader" : "rig"} size={14} />
                  Auto-rig
                </button>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {["W", "A", "S", "D"].map((k) => (
                    <span key={k} className="kbd">
                      {k}
                    </span>
                  ))}
                  <span className="ml-1.5 text-[11px] text-ink-3">move</span>
                </div>
                <span className="font-mono text-[10.5px] text-ink-3">humanoidAutoRig</span>
              </div>
            </Section>

            <Section title="Animations" meta={`${totalClips} clips`}>
              <div className="relative">
                <Glyph
                  name="search"
                  size={13}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
                />
                <input
                  type="text"
                  value={animSearch}
                  onChange={(e) => setAnimSearch(e.target.value)}
                  placeholder="Search clips"
                  className="field pl-8"
                />
              </div>

              <div className="mt-2 grid grid-cols-4 rounded-md border border-line bg-canvas p-0.5">
                {[{ id: "all", label: "All", count: totalClips }, ...HUMANOID_ANIMATION_GROUPS.map((g) => ({
                  id: g.id,
                  label: g.label.split(/[ ,&]/)[0],
                  count: g.clips.length,
                }))].map((c) => {
                  const active = selectedCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.id)}
                      aria-pressed={active}
                      className={`h-9 min-w-0 rounded-[4px] leading-none transition-colors ${
                        active ? "bg-hover text-ink" : "text-ink-3 hover:text-ink"
                      }`}
                    >
                      <span className="block truncate px-1 text-[11px]">{c.label}</span>
                      <span className="block mt-0.5 font-mono text-[10px] text-ink-3 tabular">{c.count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-1">
                {filteredAnimationGroups.length === 0 && (
                  <p className="py-4 text-[12px] text-ink-3">No clips match “{animSearch}”.</p>
                )}
                {filteredAnimationGroups.map((group) => (
                  <div key={group.id}>
                    <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-surface px-4 pt-3 pb-1.5">
                      <span className="label">{group.label}</span>
                      <span className="font-mono text-[10.5px] text-ink-3 tabular">
                        {group.clips.length}
                      </span>
                    </div>
                    <ul className="-mx-2 space-y-px">
                      {group.clips.map((clip) => {
                        const active = activeAnimationId === clip.id;
                        return (
                          <li key={clip.id}>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectAnimation(clip.id);
                                void triggerRigOrRetargetSdk("humanoidAnimationRetarget", clip.id);
                              }}
                              title={`${clip.label} · ${clip.recommendedUse}`}
                              className={`relative flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors ${
                                active ? "bg-hover" : "hover:bg-raised"
                              }`}
                            >
                              {active && (
                                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-accent" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-mono text-[11.5px] text-ink truncate">{clip.id}</div>
                                <div className="text-[11px] text-ink-3 truncate">{clip.recommendedUse}</div>
                              </div>
                              {active ? (
                                <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] text-accent">
                                  <span className="dot dot-live" />
                                  on stage
                                </span>
                              ) : (
                                clip.loop && (
                                  <span className="shrink-0 font-mono text-[10px] text-ink-3">loop</span>
                                )
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-3 font-mono text-[10.5px] text-ink-3">
                Selecting a clip calls humanoidAnimationRetarget
              </p>
            </Section>
          </>
        )}

        {/* ------------------------------------------------------------ CO-DIRECTOR */}
        {activeTab === "mcp" && (
          <>
            <Section title="Brief" meta="aholo-sdk-mcp">
              <p className="text-[12px] leading-relaxed text-ink-3">
                Describe a change in plain language. The co-director plans the Aholo MCP tool calls
                and applies the result to the stage.
              </p>
              <div className="mt-3 space-y-3">
                <textarea
                  rows={4}
                  value={directorInput}
                  onChange={(e) => setDirectorInput(e.target.value)}
                  placeholder="e.g. Split the drone to 50% and have the actor walk to it"
                  className="field resize-none leading-relaxed"
                />
                <RunButton
                  primary
                  glyph="enter"
                  label={isRunningDirector ? "Planning" : "Plan and apply"}
                  method="POST /api/aholo/director"
                  onClick={() => handleRunDirectorPrompt()}
                  busy={isRunningDirector}
                />
              </div>

              <div className="mt-4">
                <div className="label mb-1.5">Try</div>
                <ul className="-mx-2 space-y-px">
                  {DIRECTOR_PRESETS.map((presetPrompt) => (
                    <li key={presetPrompt}>
                      <button
                        type="button"
                        onClick={() => {
                          setDirectorInput(presetPrompt);
                          void handleRunDirectorPrompt(presetPrompt);
                        }}
                        className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-[12px] leading-snug text-ink-2 transition-colors hover:bg-raised hover:text-ink"
                      >
                        <Glyph name="chat" size={13} className="mt-[2px] text-ink-3" />
                        <span>{presetPrompt}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>

            <Section title="Tool trace" meta={directorLogs.length}>
              <ol className="space-y-4">
                {directorLogs.map((log) => (
                  <li key={log.id}>
                    <div className="text-[12.5px] leading-snug text-ink">{log.prompt}</div>
                    <div className="mt-1 text-[11.5px] leading-snug text-ink-3">{log.summary}</div>
                    <ol className="mt-2 border-l border-line pl-3 space-y-2">
                      {log.steps.map((st) => (
                        <li key={st.step} className="font-mono text-[11px]">
                          <div className="flex items-baseline gap-2">
                            <span className="text-ink-3 tabular">{String(st.step).padStart(2, "0")}</span>
                            <span className="text-ink truncate">{st.mcpTool}</span>
                          </div>
                          <div className="pl-6 text-[10.5px] text-ink-3 truncate">{st.sdkMethod}</div>
                          <div className="pl-6 mt-0.5 font-sans text-[11.5px] leading-snug text-ink-2">
                            {st.rationale}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ol>
            </Section>
          </>
        )}
      </div>
    </aside>
  );
}
