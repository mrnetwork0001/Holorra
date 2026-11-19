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
import { T, tx } from "@/lib/i18n";
import { publicAssetUrl } from "@/lib/public-url";
import { failureReceipt, type SubmittedJob } from "@/components/docks/CreationDock";
import { useLang } from "@/components/brand/LangSwitch";

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
  /** live jobs the studio should follow until they finish */
  onJobSubmitted?: (job: SubmittedJob) => void;
  apiKey: string;
  region: "com" | "cn";
}

/** Finish overrides for a selected part: real-world material tones, not brand colours. */
const PBR_FINISH_SWATCHES = [
  { name: "Brushed steel", zh: "拉丝钢", hex: "#C9CCD1" },
  { name: "Titanium", zh: "钛", hex: "#8E969F" },
  { name: "Graphite", zh: "石墨", hex: "#45464A" },
  { name: "Matte white", zh: "哑光白", hex: "#E8E6E1" },
  { name: "Brass", zh: "黄铜", hex: "#C3A05B" },
  { name: "Oxide red", zh: "氧化红", hex: "#B4472F" },
  { name: "Teal enamel", zh: "青绿珐琅", hex: "#2F7D78" },
  { name: "Signal orange", zh: "信号橙", hex: "#FF6A2B" },
];

const EXPLODE_STOPS = [
  { label: "Closed", zh: "闭合", val: 0 },
  { label: "Inspect", zh: "检视", val: 35 },
  { label: "Service", zh: "检修", val: 65 },
  { label: "CAD", zh: "CAD", val: 100 },
];

const DIRECTOR_PRESETS = [
  "Explode the espresso machine parts to 75%, open its articulated hood, and make the actor dance",
  "Switch to the Juguo Urban Plaza world, spawn the Aegis patrol drone, and split parts to 50%",
  "Switch to Grand Transit Concourse, load the ChronoGate holo-kiosk, and run a cinematic camera flythrough",
  "Reset: close the espresso machine and make the actor stand still",
];

/** Chinese copy for the animation categories in src/config/humanoid-animations.ts, keyed by group id. */
const ANIMATION_GROUP_ZH: Record<string, { label: string; short: string }> = {
  locomotion: { label: "移动与穿越", short: "移动" },
  parkour: { label: "跑酷与特技", short: "跑酷" },
  social: { label: "社交、对话与表演", short: "社交" },
  interaction: { label: "物体交互与劳作", short: "交互" },
  combat: { label: "战斗：近战、远程与魔法", short: "战斗" },
  damage: { label: "受击反应与怪物", short: "受击" },
};

/**
 * Chinese copy for the English text this dock puts in the co-director trace
 * (the example prompts, the boot plan and the planner's summary line).
 * The planner reads English keywords, so state and requests stay in English;
 * only the displayed copy switches. Unknown text is shown as is.
 */
const DIRECTOR_TEXT_ZH: Record<string, string> = {
  [DIRECTOR_PRESETS[0]]: "把咖啡机部件爆炸到 75%，打开铰链顶盖，再让角色跳支舞",
  [DIRECTOR_PRESETS[1]]: "切换到 Juguo Urban Plaza 世界，放出 Aegis 巡逻无人机，并把部件拆分到 50%",
  [DIRECTOR_PRESETS[2]]: "切换到 Grand Transit Concourse，载入 ChronoGate 全息信息亭，播放一段电影感的飞越镜头",
  [DIRECTOR_PRESETS[3]]: "复位：合上咖啡机，让角色站好不动",
  "Initialize hybrid 3DGS loft stage with segmented Lux3D appliance & rigged Lux3D actor":
    "初始化混合 3DGS 阁楼舞台：载入已拆分部件的 Lux3D 家电和已绑骨的 Lux3D 角色",
  "Boot plan: hosted loft world plus the 4-part articulated espresso machine and the rigged Lux3D actor.":
    "启动规划：托管的阁楼世界，加上 4 个部件的关节化咖啡机和已绑骨的 Lux3D 角色。",
  "Stream the indoor loft splat scene and its voxel collision grid.":
    "流式加载室内阁楼的高斯点场景及其体素碰撞网格。",
  "Segment the hero mesh into semantic parts for explosion and joints.":
    "把主体网格拆分成语义部件，用于爆炸视图和关节。",
};

function directorTextZh(text: string): string {
  const known = DIRECTOR_TEXT_ZH[text];
  if (known) return known;
  const planned = text.match(
    /^Planned (\d+) Aholo MCP tool call\(s\) and updated the stage to match\. Run the jobs from the Lux3D and World tabs or an MCP client\.$/
  );
  if (planned) {
    return `已规划 ${planned[1]} 个 Aholo MCP 工具调用，舞台已同步更新。可在 Lux3D、世界标签页或 MCP 客户端中运行这些任务。`;
  }
  return text;
}

/* ---------------------------------------------------------------------------
 * Presentational helpers (match CreationDock)
 * ------------------------------------------------------------------------- */

function Section({
  title,
  meta,
  children,
}: {
  title: React.ReactNode;
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
  label: React.ReactNode;
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
  onJobSubmitted,
  apiKey,
  region,
}: InspectorDockProps) {
  const lang = useLang();
  const [activeTab, setActiveTab] = useState<"parts" | "rig" | "mcp">("parts");

  // Part Split & Articulation state
  const [articulationPrompt, setArticulationPrompt] = useState(
    activeHeroBlueprint.articulationPrompt
  );
  const [isCallingPartApi, setIsCallingPartApi] = useState(false);

  // Humanoid Rig & 85 Animations state
  const [animSearch, setAnimSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ready");
  const [clipPageRaw, setClipPage] = useState(0);
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
          arguments: { glbUrl: "https://holorra.xyz/assets/lux3d/espresso-g1.glb" },
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
    // the cloud needs a URL it can fetch: the prop's real mesh. Preview props have none.
    const glbUrl = activeHeroBlueprint.modelPath ? publicAssetUrl(activeHeroBlueprint.modelPath) : undefined;
    try {
      const res = await fetch("/api/aholo/lux3d", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          operation,
          glbUrl,
          previewOnly: !glbUrl,
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
        if (data.executionMode === "LIVE_AHOLO_CLOUD_SDK" && data.taskId != null) {
          onJobSubmitted?.({ taskId: Number(data.taskId), label: `${activeHeroBlueprint.name} · ${operation}`, method: data.sdkMethod, live: true });
        }
      } else {
        onAddReceipt(failureReceipt(`lux3d.${operation}.create`, data.error));
      }
    } catch (err) {
      onAddReceipt(failureReceipt(`lux3d.${operation}.create`, err));
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
        if (data.executionMode === "LIVE_AHOLO_CLOUD_SDK" && data.taskId != null) {
          onJobSubmitted?.({
            taskId: Number(data.taskId),
            label: operation === "humanoidAutoRig" ? "Auto-rig" : `Retarget ${clip}`,
            method: data.sdkMethod,
            live: true,
          });
        }
      } else {
        onAddReceipt(failureReceipt(`lux3d.${operation}.create`, data.error));
      }
    } catch (err) {
      onAddReceipt(failureReceipt(`lux3d.${operation}.create`, err));
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

  // Clips already baked into this actor's GLB play instantly; the rest need a Retarget job first.
  const readyClips = useMemo(
    () => new Set(Object.values(AHOLO_RIGGED_ACTORS[actorId].clipMap ?? {}).map((c) => c.toLowerCase())),
    [actorId]
  );
  const isReady = (id: string) => readyClips.has(id.toLowerCase());

  const filteredAnimationGroups = useMemo(() => {
    const q = animSearch.trim().toLowerCase();
    // a search looks through every clip, whatever filter is on
    const cat = q && selectedCategory === "ready" ? "all" : selectedCategory;
    return HUMANOID_ANIMATION_GROUPS.filter(
      (g) => cat === "all" || cat === "ready" || g.id === cat
    )
      .map((g) => ({
        ...g,
        clips: g.clips.filter(
          (c) =>
            (cat !== "ready" || readyClips.has(c.id.toLowerCase())) &&
            (!q ||
            c.id.toLowerCase().includes(q) ||
            c.label.toLowerCase().includes(q) ||
            c.recommendedUse.toLowerCase().includes(q))
        ),
      }))
      .filter((g) => g.clips.length > 0);
  }, [animSearch, selectedCategory, readyClips]);

  const totalClips = HUMANOID_ANIMATION_GROUPS.reduce((n, g) => n + g.clips.length, 0);

  // Six clips per page, so the list never needs a long scroll.
  const CLIPS_PER_PAGE = 6;
  const matchedClips = filteredAnimationGroups.reduce((n, g) => n + g.clips.length, 0);
  const clipPages = Math.max(1, Math.ceil(matchedClips / CLIPS_PER_PAGE));
  const clipPage = Math.min(clipPageRaw, clipPages - 1);
  const pagedAnimationGroups = useMemo(() => {
    const from = clipPage * CLIPS_PER_PAGE;
    const to = from + CLIPS_PER_PAGE;
    let i = 0;
    return filteredAnimationGroups
      .map((g) => {
        const start = i;
        i += g.clips.length;
        return { ...g, total: g.clips.length, clips: g.clips.slice(Math.max(0, from - start), Math.max(0, to - start)) };
      })
      .filter((g) => g.clips.length > 0);
  }, [filteredAnimationGroups, clipPage]);
  const totalFaces = activeHeroBlueprint.parts.reduce((n, p) => n + p.faceCount, 0);
  const isWalking = cameraMode === "walk-third";

  const tabs: { id: typeof activeTab; label: React.ReactNode; glyph: GlyphName }[] = [
    { id: "parts", label: <T en="Parts" zh="部件" />, glyph: "split" },
    { id: "rig", label: <T en="Actor" zh="角色" />, glyph: "rig" },
    { id: "mcp", label: <T en="Co-director" zh="AI 副导演" />, glyph: "chat" },
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
                  <T en={activeHeroBlueprint.name} zh={activeHeroBlueprint.nameZh ?? activeHeroBlueprint.name} />
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-ink-3 tabular">
                  {activeHeroBlueprint.procedural ? (
                    <T
                      en={`procedural preview · ${activeHeroBlueprint.parts.length} parts`}
                      zh={`程序化预览 · ${activeHeroBlueprint.parts.length} 个部件`}
                    />
                  ) : (
                    <T
                      en={`${activeHeroBlueprint.lux3dVersion} · ${activeHeroBlueprint.parts.length} parts · ${(totalFaces / 1000).toFixed(1)}k faces`}
                      zh={`${activeHeroBlueprint.lux3dVersion} · ${activeHeroBlueprint.parts.length} 个部件 · ${(totalFaces / 1000).toFixed(1)}k 面`}
                    />
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onResetParts}
                title={tx(lang, {
                  en: "Reset explode, visibility and finishes",
                  zh: "重置爆炸视图、显隐和表面材质",
                })}
                className="btn btn-ghost btn-sm -mr-2"
              >
                <Glyph name="reset" size={13} />
                <T en="Reset" zh="重置" />
              </button>
            </div>

            <Section
              title={<T en="Explode" zh="爆炸视图" />}
              meta={<span className="text-[12px] text-ink">{explodePercent}%</span>}
            >
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={explodePercent}
                onChange={(e) => onExplodePercentChange(Number(e.target.value))}
                aria-label={tx(lang, { en: "Explode amount", zh: "爆炸程度" })}
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
                      <span className="block mt-0.5 text-[10px]">
                        <T en={stop.label} zh={stop.zh} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4">
                <RunButton
                  primary
                  glyph="split"
                  label={<T en="Run part split" zh="运行部件拆分" />}
                  method="lux3d.partSplit.create"
                  onClick={() => triggerPartOrArticulationSdk("partSplit")}
                  busy={isCallingPartApi}
                />
              </div>
            </Section>

            <Section
              title={<T en="Articulation" zh="关节化" />}
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
                  {articulateActive ? <T en="playing" zh="播放中" /> : <T en="paused" zh="已暂停" />}
                </button>
              }
            >
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={articulationPrompt}
                  onChange={(e) => setArticulationPrompt(e.target.value)}
                  aria-label={tx(lang, { en: "Describe the motion", zh: "描述要做的动作" })}
                  className="field resize-none leading-relaxed"
                />
                <RunButton
                  glyph="hinge"
                  label={<T en="Animate from prompt" zh="按提示词生成动画" />}
                  method="lux3d.articulationAnimation.create"
                  onClick={() => triggerPartOrArticulationSdk("articulationAnimation")}
                  busy={isCallingPartApi}
                />
              </div>
            </Section>

            <Section title={<T en="Parts" zh="部件" />} meta={activeHeroBlueprint.parts.length}>
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
                          title={
                            isVisible
                              ? tx(lang, { en: "Hide part", zh: "隐藏部件" })
                              : tx(lang, { en: "Show part", zh: "显示部件" })
                          }
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
                              {part.articulationType === "none" ? (
                                <T en="fixed" zh="固定" />
                              ) : (
                                part.articulationType
                              )}
                            </span>
                          </div>
                          <div>
                            <div className="label mb-1.5">
                              <T en="Finish" zh="表面材质" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              {PBR_FINISH_SWATCHES.map((sw) => {
                                const on = activeColor.toLowerCase() === sw.hex.toLowerCase();
                                return (
                                  <button
                                    key={sw.hex}
                                    type="button"
                                    title={tx(lang, { en: sw.name, zh: sw.zh })}
                                    aria-label={tx(lang, { en: sw.name, zh: sw.zh })}
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
            <Section title={<T en="Actor" zh="角色" />}>
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
                  {isWalking ? <T en="Stop walking" zh="停止行走" /> : <T en="Walk" zh="行走" />}
                </button>
                <button
                  type="button"
                  onClick={() => triggerRigOrRetargetSdk("humanoidAutoRig")}
                  disabled={isCallingRigApi}
                  className="btn"
                >
                  <Glyph name={isCallingRigApi ? "loader" : "rig"} size={14} />
                  <T en="Auto-rig" zh="自动绑骨" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => triggerRigOrRetargetSdk("humanoidAnimationRetarget", activeAnimationId)}
                disabled={isCallingRigApi}
                title="lux3d.humanoidAnimationRetarget.create"
                className="btn mt-2 w-full"
              >
                <Glyph name={isCallingRigApi ? "loader" : "generate"} size={14} />
                <T en="Retarget" zh="重定向" /> <span className="font-mono text-[11.5px]">{activeAnimationId}</span>
              </button>
              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {["W", "A", "S", "D"].map((k) => (
                    <span key={k} className="kbd">
                      {k}
                    </span>
                  ))}
                  <span className="ml-1.5 text-[11px] text-ink-3">
                    <T en="move" zh="移动" />
                  </span>
                </div>
                <span className="font-mono text-[10.5px] text-ink-3">humanoidAutoRig</span>
              </div>
            </Section>

            <Section
              title={<T en="Animations" zh="动画" />}
              meta={<T en={`${totalClips} clips`} zh={`${totalClips} 个动作片段`} />}
            >
              <div className="relative">
                <Glyph
                  name="search"
                  size={13}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
                />
                <input
                  type="text"
                  value={animSearch}
                  onChange={(e) => {
                    setAnimSearch(e.target.value);
                    setClipPage(0);
                  }}
                  placeholder={tx(lang, { en: "Search clips", zh: "搜索动作片段（英文）" })}
                  className="field pl-8"
                />
              </div>

              <div className="mt-2 grid grid-cols-4 rounded-md border border-line bg-canvas p-0.5">
                {[{ id: "ready", label: "Ready", zh: "可播放", count: readyClips.size }, { id: "all", label: "All", zh: "全部", count: totalClips }, ...HUMANOID_ANIMATION_GROUPS.map((g) => ({
                  id: g.id,
                  label: g.label.split(/[ ,&]/)[0],
                  zh: ANIMATION_GROUP_ZH[g.id]?.short ?? g.label.split(/[ ,&]/)[0],
                  count: g.clips.length,
                }))].map((c) => {
                  const active = selectedCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(c.id);
                        setClipPage(0);
                      }}
                      aria-pressed={active}
                      className={`h-9 min-w-0 rounded-[4px] leading-none transition-colors ${
                        active ? "bg-hover text-ink" : "text-ink-3 hover:text-ink"
                      }`}
                    >
                      <span className="block truncate px-1 text-[11px]">
                        <T en={c.label} zh={c.zh} />
                      </span>
                      <span className="block mt-0.5 font-mono text-[10px] text-ink-3 tabular">{c.count}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-1">
                {filteredAnimationGroups.length === 0 && (
                  <p className="py-4 text-[12px] text-ink-3">
                    <T
                      en={<>No clips match “{animSearch}”.</>}
                      zh={<>没有匹配「{animSearch}」的动作片段。</>}
                    />
                  </p>
                )}
                {pagedAnimationGroups.map((group) => (
                  <div key={group.id}>
                    <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between bg-surface px-4 pt-3 pb-1.5">
                      <span className="label">
                        <T en={group.label} zh={ANIMATION_GROUP_ZH[group.id]?.label ?? group.label} />
                      </span>
                      <span className="font-mono text-[10.5px] text-ink-3 tabular">
                        {group.total}
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
                                <div className={`font-mono text-[11.5px] truncate ${isReady(clip.id) ? "text-ink" : "text-ink-2"}`}>{clip.id}</div>
                                <div className="text-[11px] text-ink-3 truncate">{clip.recommendedUse}</div>
                              </div>
                              {!isReady(clip.id) ? (
                                <span className={`shrink-0 font-mono text-[10px] ${active ? "text-accent" : "text-ink-3"}`}>
                                  <T en="needs retarget" zh="需重定向" />
                                </span>
                              ) : active ? (
                                <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] text-accent">
                                  <span className="dot dot-live" />
                                  <T en="on stage" zh="舞台中" />
                                </span>
                              ) : (
                                <span className="shrink-0 font-mono text-[10px] text-ok">
                                  <T en="ready" zh="可播放" />
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
              {!isReady(activeAnimationId) && (
                <p role="status" className="mt-3 rounded-md border border-line-strong bg-raised px-3 py-2 text-[12px] leading-snug text-ink-2">
                  <T
                    en={<><span className="font-mono text-ink">{activeAnimationId}</span> is not on this actor yet, so she keeps her current pose. Press <b>Retarget</b> above to generate it with Lux3D (a live job, about 6 credits), or pick a clip marked <span className="text-ok">ready</span>.</>}
                    zh={<><span className="font-mono text-ink">{activeAnimationId}</span> 尚未烘焙到当前角色，所以角色保持原动作。点击上方「重定向」用 Lux3D 生成（实时任务，约 6 积分），或选择标有<span className="text-ok">可播放</span>的片段。</>}
                  />
                </p>
              )}
              {clipPages > 1 && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={clipPage === 0}
                    onClick={() => setClipPage(clipPage - 1)}
                  >
                    <T en="Previous" zh="上一页" />
                  </button>
                  <span className="font-mono text-[11px] text-ink-3 tabular" aria-live="polite">
                    <T
                      en={`Page ${clipPage + 1} of ${clipPages} · ${matchedClips} clips`}
                      zh={`第 ${clipPage + 1} / ${clipPages} 页 · 共 ${matchedClips} 个`}
                    />
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={clipPage >= clipPages - 1}
                    onClick={() => setClipPage(clipPage + 1)}
                  >
                    <T en="Next" zh="下一页" />
                  </button>
                </div>
              )}
              <p className="mt-3 font-mono text-[10.5px] text-ink-3">
                <T
                  en="Ready clips play instantly. The others are the rest of Lux3D's 85 presets: Retarget sends one to humanoidAnimationRetarget."
                  zh="「可播放」片段可立即播放；其余为 Lux3D 85 个预设中的其他动作，点击「重定向」会调用 humanoidAnimationRetarget。"
                />
              </p>
            </Section>
          </>
        )}

        {/* ------------------------------------------------------------ CO-DIRECTOR */}
        {activeTab === "mcp" && (
          <>
            <Section title={<T en="Brief" zh="导演指令" />} meta="aholo-sdk-mcp">
              <p className="text-[12px] leading-relaxed text-ink-3">
                <T
                  en={
                    <>
                      Describe a change in plain language. The co-director plans the Aholo MCP tool calls
                      and applies the result to the stage.
                    </>
                  }
                  zh="用自然语言描述想要的改动，AI 副导演会规划 Aholo MCP 工具调用，并把结果应用到舞台上。中英文描述都可以。"
                />
              </p>
              <div className="mt-3 space-y-3">
                <textarea
                  rows={4}
                  value={directorInput}
                  onChange={(e) => setDirectorInput(e.target.value)}
                  placeholder={tx(lang, {
                    en: "e.g. Split the drone to 50% and have the actor walk to it",
                    zh: "例如：把咖啡机拆开，让角色走过去跳个舞",
                  })}
                  className="field resize-none leading-relaxed"
                />
                <RunButton
                  primary
                  glyph="enter"
                  label={
                    isRunningDirector ? (
                      <T en="Planning" zh="规划中" />
                    ) : (
                      <T en="Plan and apply" zh="规划并应用" />
                    )
                  }
                  method="POST /api/aholo/director"
                  onClick={() => handleRunDirectorPrompt()}
                  busy={isRunningDirector}
                />
              </div>

              <div className="mt-4">
                <div className="label mb-1.5">
                  <T en="Try" zh="试试" />
                </div>
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
                        <span>
                          <T en={presetPrompt} zh={directorTextZh(presetPrompt)} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Section>

            <Section title={<T en="Tool trace" zh="工具调用记录" />} meta={directorLogs.length}>
              <ol className="space-y-4">
                {directorLogs.map((log) => (
                  <li key={log.id}>
                    <div className="text-[12.5px] leading-snug text-ink">
                      <T en={log.prompt} zh={directorTextZh(log.prompt)} />
                    </div>
                    <div className="mt-1 text-[11.5px] leading-snug text-ink-3">
                      <T en={log.summary} zh={directorTextZh(log.summary)} />
                    </div>
                    <ol className="mt-2 border-l border-line pl-3 space-y-2">
                      {log.steps.map((st) => (
                        <li key={st.step} className="font-mono text-[11px]">
                          <div className="flex items-baseline gap-2">
                            <span className="text-ink-3 tabular">{String(st.step).padStart(2, "0")}</span>
                            <span className="text-ink truncate">{st.mcpTool}</span>
                          </div>
                          <div className="pl-6 text-[10.5px] text-ink-3 truncate">{st.sdkMethod}</div>
                          <div className="pl-6 mt-0.5 font-sans text-[11.5px] leading-snug text-ink-2">
                            <T en={st.rationale} zh={directorTextZh(st.rationale)} />
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
