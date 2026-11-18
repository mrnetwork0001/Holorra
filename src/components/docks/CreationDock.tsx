"use client";

import type { ActorId } from "@/config/aholo-presets";
import React, { useEffect, useState } from "react";
import {
  AHOLO_WORLD_PRESETS,
  LUX3D_HERO_BLUEPRINTS,
  AHOLO_RIGGED_ACTORS,
  type AholoWorldPreset,
  type Lux3dHeroAssetBlueprint,
} from "@/config/aholo-presets";
import type { PartOverrideState } from "@/components/stage/AholoHybridStage";
import { Glyph, type GlyphName } from "@/components/brand/Glyph";
import type { PendingJob } from "@/lib/spawned-assets";
import { T, tx } from "@/lib/i18n";
import { useLang } from "@/components/brand/LangSwitch";

export interface ApiReceiptLog {
  id: string;
  timestamp: string;
  sdkPackage: string;
  sdkMethod: string;
  taskIdOrWorldId: string;
  statusLabel: string;
  executionMode: string;
}

/** A Lux3D generation the studio should follow until its model can drop into the stage. */
export interface SubmittedJob {
  taskId: number;
  label: string;
  method: string;
  /** true when the job really went to the Aholo cloud (not a no-key preview) */
  live: boolean;
}

/** First words of a prompt, for labels on the stage and in the dock. */
export function shortLabel(prompt: string, max = 48) {
  const t = prompt.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 24))}…`;
}

function mmss(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export interface CreationDockProps {
  activeWorldPreset: AholoWorldPreset;
  onSelectWorldPreset: (preset: AholoWorldPreset) => void;
  activeHeroBlueprint: Lux3dHeroAssetBlueprint;
  onSelectHeroBlueprint: (bp: Lux3dHeroAssetBlueprint) => void;
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  partOverrides: Record<string, PartOverrideState>;
  onTogglePartVisible: (partId: string) => void;
  actorId: ActorId;
  receipts: ApiReceiptLog[];
  onAddReceipt: (receipt: ApiReceiptLog) => void;
  apiKey: string;
  region: "com" | "cn";
  /** called after a Text to 3D job is accepted (live or preview) */
  onJobSubmitted?: (job: SubmittedJob) => void;
  /** live jobs the studio is polling, shown under the Text to 3D button */
  pendingJobs?: PendingJob[];
}

/* ---------------------------------------------------------------------------
 * Small presentational helpers (shared look for both docks)
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
        {meta != null && <span className="font-mono text-[10.5px] text-ink-3 tabular">{meta}</span>}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <span className="text-[12px] text-ink-2">{children}</span>
      {hint && <span className="text-[11px] text-ink-3">{hint}</span>}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-md border border-line bg-canvas p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 h-7 rounded-[4px] text-[12px] transition-colors max-[900px]:h-9 ${
              active ? "bg-hover text-ink" : "text-ink-3 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
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

/** A list row that marks the active item with an accent rule on its left edge. */
function SelectRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left rounded-md px-3 py-2.5 transition-colors ${
        active ? "bg-hover" : "hover:bg-raised"
      }`}
    >
      {active && <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-accent" />}
      {children}
    </button>
  );
}

/** How a receipt was produced, in plain words (`zh` is the same label in Simplified Chinese). */
export function describeExecutionMode(mode: string): { label: string; zh: string; live: boolean } {
  switch (mode) {
    case "LIVE_AHOLO_CLOUD_SDK":
      return { label: "live", zh: "实时", live: true };
    case "INSTANT_STAGE_BLUEPRINT":
    case "STAGE_BLUEPRINT":
      return { label: "preview", zh: "预览", live: false };
    case "VERIFIED_MANYCORE_CDN_PRESET":
    case "MANYCORE_OSS_CDN":
      return { label: "cdn preset", zh: "CDN 预设", live: false };
    case "MCP_AGENT_PLAN":
      return { label: "plan", zh: "规划", live: false };
    default: {
      const label = mode.toLowerCase().replace(/_/g, " ");
      const zh = label.includes("cached")
        ? "缓存结果"
        : label === "lux3d result"
          ? "Lux3D 结果"
          : label;
      return { label, zh, live: false };
    }
  }
}

const EXPORT_FORMATS = [
  { id: "usdz", label: "USDZ" },
  { id: "fbx_zip", label: "FBX" },
  { id: "obj_zip", label: "OBJ" },
  { id: "stl", label: "STL" },
  { id: "3mf", label: "3MF" },
];

export default function CreationDock({
  activeWorldPreset,
  onSelectWorldPreset,
  activeHeroBlueprint,
  onSelectHeroBlueprint,
  selectedPartId,
  onSelectPart,
  partOverrides,
  onTogglePartVisible,
  actorId,
  receipts,
  onAddReceipt,
  apiKey,
  region,
  onJobSubmitted,
  pendingJobs = [],
}: CreationDockProps) {
  const lang = useLang();
  const [activeTab, setActiveTab] = useState<"world" | "lux3d" | "scene">("lux3d");

  // World SpatialGen & Reality state
  const [worldMode, setWorldMode] = useState<"generate" | "reconstruct">("generate");
  const [worldPrompt, setWorldPrompt] = useState(
    "Sunlit designer smart loft with open kitchen island, glass partition, and oak floor"
  );
  const [worldRefImage, setWorldRefImage] = useState("");
  const [reconVideoUrl, setReconVideoUrl] = useState(
    "https://labs.aholo.ai/samples/smart-loft-walkthrough.mp4"
  );
  const [reconType, setReconType] = useState<"video" | "insv" | "image">("video");
  const [reconQuality, setReconQuality] = useState<"low" | "normal" | "high">("high");
  const [reconScene, setReconScene] = useState<"space" | "model">("space");
  const [isSubmittingWorld, setIsSubmittingWorld] = useState(false);

  // Lux3D Forge state
  const [luxPrompt, setLuxPrompt] = useState(activeHeroBlueprint.sourcePrompt);
  const [luxVersion, setLuxVersion] = useState<"G1" | "G1-Turbo">("G1");
  const [luxFaceCount, setLuxFaceCount] = useState<number>(200_000);
  const [luxEnablePbr, setLuxEnablePbr] = useState<boolean>(true);
  const [materialImgUrl, setMaterialImgUrl] = useState(
    "https://labs.aholo.ai/samples/anodized-brushed-titanium.jpg"
  );
  const [exportFormats, setExportFormats] = useState<string[]>([
    "usdz",
    "fbx_zip",
    "stl",
    "3mf",
  ]);
  const [isSubmittingLux, setIsSubmittingLux] = useState(false);

  // tick once a second while jobs are running so the elapsed timers move
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (pendingJobs.length === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [pendingJobs.length]);

  const buildHeaders = () => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "x-aholo-region": region,
    };
    if (apiKey) h["x-aholo-api-key"] = apiKey;
    return h;
  };

  const handleDispatchWorldJob = async () => {
    setIsSubmittingWorld(true);
    try {
      const res = await fetch("/api/aholo/world", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          action: worldMode,
          prompt: worldPrompt,
          imageUrl: worldRefImage || undefined,
          name: "Holorra 3DGS Capture",
          resourceUrl: reconVideoUrl,
          resourceType: reconType,
          taskQuality: reconQuality,
          scene: reconScene,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onAddReceipt({
          id: `rcpt_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          sdkPackage: data.sdkPackage || "@manycore/aholo-sdk-world@1.5.0",
          sdkMethod: data.sdkMethod,
          taskIdOrWorldId: String(data.worldId),
          statusLabel: data.status || "SUCCEEDED",
          executionMode: data.executionMode,
        });
        if (data.matchedPresetId) {
          const found = AHOLO_WORLD_PRESETS.find((p) => p.id === data.matchedPresetId);
          if (found) onSelectWorldPreset(found);
        }
      }
    } finally {
      setIsSubmittingWorld(false);
    }
  };

  const handleDispatchLux3dJob = async (
    operation:
      | "textTo3d"
      | "imageToFourView"
      | "multimodalToImage"
      | "materialTransfer"
      | "multiFormatExport"
  ) => {
    setIsSubmittingLux(true);
    try {
      const res = await fetch("/api/aholo/lux3d", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          operation,
          prompt: luxPrompt,
          version: luxVersion,
          faceCount: luxFaceCount,
          enablePbr: luxEnablePbr,
          img: materialImgUrl,
          meshUrl: "https://labs.aholo.ai/stage/active-hero-model.glb",
          modelUrl: "https://labs.aholo.ai/stage/active-hero-model.glb",
          outputFormat:
            operation === "multiFormatExport"
              ? exportFormats
              : ["glb", "zip"],
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onAddReceipt({
          id: `rcpt_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          sdkPackage: data.sdkPackage || "@manycore/aholo-sdk-lux3d@1.10.0",
          sdkMethod: data.sdkMethod,
          taskIdOrWorldId: `task_${data.taskId}`,
          statusLabel: data.status === 3 ? "SUCCEEDED (3)" : "RUNNING (1)",
          executionMode: data.executionMode,
        });
        if (operation === "textTo3d" && data.taskId != null) {
          // the studio follows the job and drops the finished model into the stage
          onJobSubmitted?.({
            taskId: Number(data.taskId),
            label: shortLabel(luxPrompt),
            method: data.sdkMethod || "lux3d.textTo3d.create",
            live: data.executionMode === "LIVE_AHOLO_CLOUD_SDK",
          });
        } else if (data.matchedBlueprintId && LUX3D_HERO_BLUEPRINTS[data.matchedBlueprintId]) {
          onSelectHeroBlueprint(LUX3D_HERO_BLUEPRINTS[data.matchedBlueprintId]);
        }
      }
    } finally {
      setIsSubmittingLux(false);
    }
  };

  const toggleExportFormat = (fmt: string) => {
    setExportFormats((prev) =>
      prev.includes(fmt) ? prev.filter((f) => f !== fmt) : [...prev, fmt]
    );
  };

  const tabs: { id: typeof activeTab; label: React.ReactNode; glyph: GlyphName }[] = [
    { id: "world", label: <T en="World" zh="世界" />, glyph: "world" },
    { id: "lux3d", label: "Lux3D", glyph: "mesh" },
    { id: "scene", label: <T en="Scene" zh="场景" />, glyph: "layers" },
  ];

  const actor = AHOLO_RIGGED_ACTORS[actorId];

  return (
    <aside className="w-[300px] bg-surface border-r border-line flex flex-col h-full shrink-0 select-none overflow-hidden">
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
        {/* ------------------------------------------------------------ WORLD */}
        {activeTab === "world" && (
          <>
            <Section title={<T en="New world" zh="新建世界" />} meta="aholo-sdk-world 1.5">
              <Segmented
                value={worldMode}
                onChange={setWorldMode}
                options={[
                  { value: "generate", label: <T en="Generate" zh="生成" /> },
                  { value: "reconstruct", label: <T en="Reconstruct" zh="重建" /> },
                ]}
              />
              <p className="mt-2.5 text-[12px] leading-relaxed text-ink-3">
                {worldMode === "generate" ? (
                  <T
                    en="SpatialGen builds a 3DGS world from a prompt and up to one reference image."
                    zh="SpatialGen 根据提示词和至多 1 张参考图生成 3DGS 世界。"
                  />
                ) : (
                  <T
                    en="Aholo Reality rebuilds a real space or object from video, Insta360 or 20+ photos."
                    zh="Aholo Reality 用视频、Insta360 全景或 20 张以上照片重建真实空间或物体。"
                  />
                )}
              </p>

              <div className="mt-4 space-y-3">
                {worldMode === "generate" ? (
                  <>
                    <div>
                      <FieldLabel><T en="Prompt" zh="提示词" /></FieldLabel>
                      <textarea
                        rows={3}
                        value={worldPrompt}
                        onChange={(e) => setWorldPrompt(e.target.value)}
                        className="field resize-none leading-relaxed"
                      />
                    </div>
                    <div>
                      <FieldLabel hint={<T en="optional" zh="可选" />}>
                        <T en="Reference image URL" zh="参考图 URL" />
                      </FieldLabel>
                      <input
                        type="text"
                        value={worldRefImage}
                        onChange={(e) => setWorldRefImage(e.target.value)}
                        placeholder="https://"
                        className="field font-mono text-[12px]"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <FieldLabel><T en="Capture URL" zh="采集素材 URL" /></FieldLabel>
                      <input
                        type="text"
                        value={reconVideoUrl}
                        onChange={(e) => setReconVideoUrl(e.target.value)}
                        className="field font-mono text-[12px]"
                      />
                    </div>
                    <div>
                      <FieldLabel><T en="Source type" zh="素材类型" /></FieldLabel>
                      <Segmented
                        value={reconType}
                        onChange={setReconType}
                        options={[
                          { value: "video", label: <T en="Video" zh="视频" /> },
                          { value: "insv", label: "Insta360" },
                          { value: "image", label: <T en="Photos" zh="照片" /> },
                        ]}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <FieldLabel><T en="Quality" zh="质量" /></FieldLabel>
                        <select
                          value={reconQuality}
                          onChange={(e) =>
                            setReconQuality(e.target.value as "low" | "normal" | "high")
                          }
                          className="field"
                        >
                          <option value="low">{tx(lang, { en: "Low · fast", zh: "低 · 快速" })}</option>
                          <option value="normal">{tx(lang, { en: "Normal", zh: "标准" })}</option>
                          <option value="high">{tx(lang, { en: "High", zh: "高" })}</option>
                        </select>
                      </div>
                      <div>
                        <FieldLabel><T en="Subject" zh="重建对象" /></FieldLabel>
                        <select
                          value={reconScene}
                          onChange={(e) => setReconScene(e.target.value as "space" | "model")}
                          className="field"
                        >
                          <option value="space">{tx(lang, { en: "Space", zh: "空间" })}</option>
                          <option value="model">{tx(lang, { en: "Object", zh: "物体" })}</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <RunButton
                  primary
                  glyph={worldMode === "generate" ? "world" : "reconstruct"}
                  label={
                    worldMode === "generate" ? (
                      <T en="Generate world" zh="生成世界" />
                    ) : (
                      <T en="Reconstruct world" zh="重建世界" />
                    )
                  }
                  method={
                    worldMode === "generate"
                      ? "world.generations.create"
                      : "world.reconstructions.create"
                  }
                  onClick={handleDispatchWorldJob}
                  busy={isSubmittingWorld}
                />
              </div>
            </Section>

            <Section title={<T en="Hosted worlds" zh="托管世界" />} meta="Manycore CDN">
              <div className="-mx-1 space-y-0.5">
                {AHOLO_WORLD_PRESETS.map((preset) => (
                  <SelectRow
                    key={preset.id}
                    active={preset.id === activeWorldPreset.id}
                    onClick={() => onSelectWorldPreset(preset)}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] text-ink truncate">{preset.title}</span>
                      <span className="font-mono text-[10.5px] text-ink-3 shrink-0">
                        {preset.splatMode === "lod" ? "LOD" : <T en="direct" zh="直接加载" />}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink-3 truncate">
                      {preset.splatCountLabel}
                    </div>
                  </SelectRow>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* ------------------------------------------------------------ LUX3D */}
        {activeTab === "lux3d" && (
          <>
            <Section
              title={<T en="Stage prop" zh="舞台道具" />}
              meta={
                <T
                  en={`${Object.keys(LUX3D_HERO_BLUEPRINTS).length} props`}
                  zh={`${Object.keys(LUX3D_HERO_BLUEPRINTS).length} 个道具`}
                />
              }
            >
              <div className="-mx-1 space-y-0.5">
                {Object.values(LUX3D_HERO_BLUEPRINTS).map((bp) => (
                  <SelectRow
                    key={bp.id}
                    active={bp.id === activeHeroBlueprint.id}
                    onClick={() => {
                      onSelectHeroBlueprint(bp);
                      setLuxPrompt(bp.sourcePrompt);
                      setLuxVersion(bp.lux3dVersion);
                    }}
                  >
                    <div className="text-[13px] text-ink truncate">{bp.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-ink-3 tabular">
                      {bp.procedural ? (
                        <span>
                          <T
                            en={`procedural preview / ${bp.parts.length} parts`}
                            zh={`程序化预览 / ${bp.parts.length} 个部件`}
                          />
                        </span>
                      ) : (
                        <>
                          <span>{bp.lux3dVersion}</span>
                          <span className="text-line-strong">/</span>
                          <span>
                            <T en={`${bp.parts.length} parts`} zh={`${bp.parts.length} 个部件`} />
                          </span>
                          <span className="text-line-strong">/</span>
                          <span>
                            <T
                              en={`${(bp.totalFaces / 1000).toFixed(1)}k faces`}
                              zh={`${(bp.totalFaces / 1000).toFixed(1)}k 面`}
                            />
                          </span>
                        </>
                      )}
                    </div>
                  </SelectRow>
                ))}
              </div>
            </Section>

            <Section title={<T en="Generate" zh="生成" />} meta="aholo-sdk-lux3d 1.10">
              <div className="space-y-3">
                <div>
                  <FieldLabel><T en="Prompt" zh="提示词" /></FieldLabel>
                  <textarea
                    rows={4}
                    value={luxPrompt}
                    onChange={(e) => setLuxPrompt(e.target.value)}
                    className="field resize-none leading-relaxed"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <FieldLabel><T en="Engine" zh="引擎" /></FieldLabel>
                    <select
                      value={luxVersion}
                      onChange={(e) => setLuxVersion(e.target.value as "G1" | "G1-Turbo")}
                      className="field font-mono text-[12px]"
                    >
                      <option value="G1">G1</option>
                      <option value="G1-Turbo">G1-Turbo</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel><T en="Face budget" zh="面数预算" /></FieldLabel>
                    <select
                      value={luxFaceCount}
                      onChange={(e) => setLuxFaceCount(Number(e.target.value))}
                      className="field font-mono text-[12px] tabular"
                    >
                      <option value={50000}>50k</option>
                      <option value={150000}>150k</option>
                      <option value={200000}>200k</option>
                      <option value={300000}>300k</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-[12px] text-ink-2">
                    <T en="PBR metallic / roughness maps" zh="PBR 金属度 / 粗糙度贴图" />
                  </span>
                  <input
                    type="checkbox"
                    checked={luxEnablePbr}
                    onChange={(e) => setLuxEnablePbr(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--color-accent)]"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <RunButton
                    primary
                    glyph="generate"
                    label={<T en="Text to 3D" zh="文生 3D" />}
                    method="textTo3d"
                    onClick={() => handleDispatchLux3dJob("textTo3d")}
                    busy={isSubmittingLux}
                  />
                  <RunButton
                    glyph="fourview"
                    label={<T en="Four views" zh="四视图" />}
                    method="imageToFourView"
                    onClick={() => handleDispatchLux3dJob("imageToFourView")}
                    busy={isSubmittingLux}
                  />
                </div>
                {pendingJobs.length > 0 && (
                  <ul className="space-y-1.5" aria-live="polite">
                    {pendingJobs.map((j) => {
                      const failed = j.status === "failed";
                      return (
                        <li key={j.taskId} className="card px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Glyph
                              name={failed ? "cross" : "loader"}
                              size={13}
                              className={failed ? "text-err" : "text-accent"}
                            />
                            <span className="min-w-0 flex-1 truncate text-[12px] text-ink">{j.label}</span>
                            <span className="font-mono text-[11px] text-ink-2 tabular">{mmss(now - j.startedAt)}</span>
                          </div>
                          <div className="mt-1 truncate font-mono text-[10.5px] text-ink-3">
                            {failed ? (
                              <T en={`task ${j.taskId} · failed`} zh={`任务 ${j.taskId} · 失败`} />
                            ) : (
                              <T
                                en={`task ${j.taskId} · drops into the stage when ready`}
                                zh={`任务 ${j.taskId} · 完成后自动投放到舞台`}
                              />
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Section>

            <Section title={<T en="Material transfer" zh="材质迁移" />} meta="v3.0-standard">
              <div className="space-y-3">
                <div>
                  <FieldLabel><T en="Reference image URL" zh="参考图 URL" /></FieldLabel>
                  <input
                    type="text"
                    value={materialImgUrl}
                    onChange={(e) => setMaterialImgUrl(e.target.value)}
                    className="field font-mono text-[12px]"
                  />
                </div>
                <RunButton
                  glyph="material"
                  label={<T en="Transfer material" zh="迁移材质" />}
                  method="lux3d.materialTransfer.create"
                  onClick={() => handleDispatchLux3dJob("materialTransfer")}
                  busy={isSubmittingLux}
                />
              </div>
            </Section>

            <Section
              title={<T en="Export" zh="导出" />}
              meta={<T en={`${exportFormats.length} selected`} zh={`已选 ${exportFormats.length} 种`} />}
            >
              <div className="grid grid-cols-5 gap-1.5">
                {EXPORT_FORMATS.map((fmt) => {
                  const on = exportFormats.includes(fmt.id);
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => toggleExportFormat(fmt.id)}
                      aria-pressed={on}
                      className={`chip h-7 justify-center cursor-pointer transition-colors max-[900px]:h-9 ${
                        on ? "chip-accent" : "hover:text-ink hover:border-line-strong"
                      }`}
                    >
                      {fmt.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <RunButton
                  glyph="export"
                  label={
                    exportFormats.length ? (
                      <T
                        en={`Export ${exportFormats.length} format${exportFormats.length > 1 ? "s" : ""}`}
                        zh={`导出 ${exportFormats.length} 种格式`}
                      />
                    ) : (
                      <T en="Select a format" zh="请选择格式" />
                    )
                  }
                  method="lux3d.multiFormatExport.create"
                  onClick={() => handleDispatchLux3dJob("multiFormatExport")}
                  busy={isSubmittingLux || exportFormats.length === 0}
                />
              </div>
            </Section>
          </>
        )}

        {/* ------------------------------------------------------------ SCENE */}
        {activeTab === "scene" && (
          <>
            <Section title={<T en="Scene graph" zh="场景图" />}>
              <ul className="space-y-1 text-[12.5px]">
                <li className="flex items-start gap-2.5 rounded-md px-2 py-2">
                  <Glyph name="splat" size={14} className="mt-0.5 text-ink-3" />
                  <div className="min-w-0">
                    <div className="text-ink truncate">{activeWorldPreset.title}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink-3 truncate">
                      {activeWorldPreset.splatCountLabel}
                      {activeWorldPreset.voxelMetaUrl ? <T en=" · voxel collision" zh=" · 体素碰撞" /> : ""}
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-2.5 rounded-md px-2 py-2">
                  <Glyph name="rig" size={14} className="mt-0.5 text-ink-3" />
                  <div className="min-w-0">
                    <div className="text-ink truncate">{actor.name}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink-3">
                      <T
                        en={`skinned mesh · ${actor.clipCount} clips`}
                        zh={`蒙皮网格 · ${actor.clipCount} 个动作片段`}
                      />
                    </div>
                  </div>
                </li>
                <li className="rounded-md px-2 py-2">
                  <div className="flex items-start gap-2.5">
                    <Glyph name="split" size={14} className="mt-0.5 text-ink-3" />
                    <div className="min-w-0">
                      <div className="text-ink truncate">{activeHeroBlueprint.name}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-ink-3">
                        <T
                          en={`${activeHeroBlueprint.parts.length} parts`}
                          zh={`${activeHeroBlueprint.parts.length} 个部件`}
                        />
                      </div>
                    </div>
                  </div>
                  <ul className="mt-2 ml-[6px] border-l border-line pl-2 space-y-px">
                    {activeHeroBlueprint.parts.map((part) => {
                      const isSelected = selectedPartId === part.id;
                      const isVisible = partOverrides[part.id]?.visible ?? true;
                      return (
                        <li
                          key={part.id}
                          className={`relative flex items-center gap-2 rounded-[4px] pl-2 pr-1 transition-colors ${
                            isSelected ? "bg-hover" : "hover:bg-raised"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute -left-[9px] top-1 bottom-1 w-[2px] bg-accent" />
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectPart(isSelected ? null : part.id)}
                            className="flex flex-1 min-w-0 items-center gap-2 h-7 text-left max-[900px]:h-10"
                          >
                            <span
                              className="h-2 w-2 shrink-0 rounded-[2px]"
                              style={{
                                backgroundColor:
                                  partOverrides[part.id]?.colorHex || part.defaultColorHex,
                              }}
                            />
                            <span
                              className={`font-mono text-[11px] truncate ${
                                isVisible ? "text-ink-2" : "text-ink-3 line-through"
                              }`}
                            >
                              {part.name}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onTogglePartVisible(part.id)}
                            title={
                              isVisible
                                ? tx(lang, { en: "Hide part", zh: "隐藏部件" })
                                : tx(lang, { en: "Show part", zh: "显示部件" })
                            }
                            className="flex h-6 w-6 items-center justify-center rounded text-ink-3 hover:text-ink max-[900px]:h-10 max-[900px]:w-10"
                          >
                            <Glyph name={isVisible ? "eye" : "eye-off"} size={13} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              </ul>
            </Section>

            <Section title={<T en="Activity" zh="调用回执" />} meta={receipts.length}>
              {receipts.length === 0 ? (
                <p className="text-[12px] text-ink-3">
                  <T en="No SDK calls yet." zh="还没有 SDK 调用。" />
                </p>
              ) : (
                <ol className="space-y-px">
                  {receipts.map((r) => {
                    const mode = describeExecutionMode(r.executionMode);
                    return (
                      <li key={r.id} className="border-b border-line py-2 last:border-b-0">
                        <div className="flex items-baseline justify-between gap-2 font-mono text-[11px]">
                          <span className="text-ink truncate">{r.sdkMethod}</span>
                          <span className="shrink-0 text-ink-3 tabular">{r.timestamp}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="font-mono text-[10.5px] text-ink-3 truncate">
                            {r.taskIdOrWorldId}
                          </span>
                          <span
                            className={`chip h-[18px] text-[10px] ${mode.live ? "chip-accent" : ""}`}
                          >
                            {mode.live && <span className="dot dot-live" />}
                            <T en={mode.label} zh={mode.zh} />
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Section>
          </>
        )}
      </div>
    </aside>
  );
}
