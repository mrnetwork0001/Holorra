"use client";

import type { ActorId } from "@/config/aholo-presets";
import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  AHOLO_WORLD_PRESETS,
  LUX3D_HERO_BLUEPRINTS,
  AHOLO_RIGGED_ACTORS,
  type AholoWorldPreset,
  type Lux3dHeroAssetBlueprint,
} from "@/config/aholo-presets";
import type { HumanoidAnimationId } from "@/config/humanoid-animations";
import type {
  PartOverrideState,
  StageCameraMode,
} from "@/components/stage/AholoHybridStage";
import Link from "next/link";
import StudioHeader from "@/components/header/StudioHeader";
import CreationDock, { type ApiReceiptLog, type SubmittedJob } from "@/components/docks/CreationDock";
import InspectorDock from "@/components/docks/InspectorDock";
import LuxRealTimeline from "@/components/docks/LuxRealTimeline";
import { MobileDrawer } from "@/components/brand/MobileDrawer";
import { Glyph } from "@/components/brand/Glyph";
import type { CameraKeyframe } from "@/lib/luxreal-exporter";
import type { DirectorStageMutation } from "@/app/api/aholo/director/route";
import type { PendingJob, SpawnedAsset } from "@/lib/spawned-assets";
import { T, tx, type L } from "@/lib/i18n";
import { useLang } from "@/components/brand/LangSwitch";

const AholoHybridStage = dynamic(
  () => import("@/components/stage/AholoHybridStage"),
  { ssr: false }
);

/** ≤ 900px is the phone/tablet layout (docs/MOBILE.md): docks live in a left drawer. */
const MOBILE_QUERY = "(max-width: 900px)";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

/** Without an API key, Text to 3D drops this stored real Lux3D result instead (labelled as cached). */
const CACHED_LUX3D_RESULT = {
  url: "/assets/lux3d/espresso-g1turbo.glb",
  label: "Cached Lux3D result · task 8353472 (no API key)",
  source: "cached" as const,
};
/** The same label in both languages, for the stage's drop-in toast. */
const CACHED_LUX3D_LABEL: L = {
  en: CACHED_LUX3D_RESULT.label,
  zh: "Lux3D 缓存结果 · 任务 8353472（未配置 API 密钥）",
};

/** The finished task's GLB: an https output URL ending in .glb (JSON outputs are ignored). */
function pickGlbUrl(outputs: unknown): string | null {
  if (!Array.isArray(outputs)) return null;
  const urls = outputs
    .map((o) =>
      o && typeof o === "object" && typeof (o as { content?: unknown }).content === "string"
        ? (o as { content: string }).content.trim()
        : ""
    )
    .filter((c) => /^https:\/\//i.test(c));
  return urls.find((u) => u.split("?")[0].toLowerCase().endsWith(".glb")) ?? null;
}

const DRAWER_LINKS: { href: string; label: L; glyph: "back" | "mesh" | "doc" | "plug" }[] = [
  { href: "/", label: { en: "Home", zh: "首页" }, glyph: "back" },
  { href: "/lab", label: { en: "Lux3D bench", zh: "Lux3D 测试台" }, glyph: "mesh" },
  { href: "/report", label: { en: "Report", zh: "报告" }, glyph: "doc" },
  { href: "/mcp", label: { en: "MCP hub", zh: "MCP 中心" }, glyph: "plug" },
  { href: "/docs", label: { en: "Docs", zh: "文档" }, glyph: "doc" },
];

export default function HolorraStudioPage() {
  // UI language for attributes; the ref lets callbacks read it without new dependencies
  const lang = useLang();
  const langRef = useRef(lang);
  langRef.current = lang;

  // Active World, Hero Blueprint & Actor state
  const [activeWorldPreset, setActiveWorldPreset] = useState<AholoWorldPreset>(
    AHOLO_WORLD_PRESETS[0]
  );
  const [activeHeroBlueprint, setActiveHeroBlueprint] =
    useState<Lux3dHeroAssetBlueprint>(
      LUX3D_HERO_BLUEPRINTS[AHOLO_WORLD_PRESETS[0].defaultHeroAssetId]
    );
  const [actorId, setActorId] = useState<ActorId>(
    AHOLO_WORLD_PRESETS[0].defaultActorId
  );
  const [activeAnimationId, setActiveAnimationId] =
    useState<HumanoidAnimationId>("Idle_Loop");

  // Lux3D Part-Splitter & Articulation state
  const [explodePercent, setExplodePercent] = useState<number>(0);
  const [articulateActive, setArticulateActive] = useState<boolean>(true);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [partOverrides, setPartOverrides] = useState<
    Record<string, PartOverrideState>
  >({});

  // Camera & LuxReal Keyframe Sequencer state
  const [cameraMode, setCameraMode] = useState<StageCameraMode>("orbit");
  const [keyframes, setKeyframes] = useState<CameraKeyframe[]>(
    AHOLO_WORLD_PRESETS[0].defaultKeyframes
  );
  const [isPlayingSpline, setIsPlayingSpline] = useState<boolean>(false);

  // Splatting render pipeline controls
  const [splatExposure, setSplatExposure] = useState<number>(1.0);
  const [radialSort, setRadialSort] = useState<boolean>(true);

  // API Gateway config & receipt logs
  const [apiKey, setApiKey] = useState<string>("");
  const [region, setRegion] = useState<"com" | "cn">("com");
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [receipts, setReceipts] = useState<ApiReceiptLog[]>([
    {
      id: "boot-world",
      timestamp: "BOOT",
      sdkPackage: "@manycore/aholo-viewer@1.14.0",
      sdkMethod: "SplatLoader.parseSplatData (.spz)",
      taskIdOrWorldId: "room/scene.7c26e842.spz",
      statusLabel: "STREAMING",
      executionMode: "MANYCORE_OSS_CDN",
    },
    {
      id: "boot-split",
      timestamp: "BOOT",
      sdkPackage: "@manycore/aholo-sdk-lux3d@1.10.0",
      sdkMethod: "lux3d.partSplit.create",
      taskIdOrWorldId: "espresso blueprint (6 procedural parts)",
      statusLabel: "PREVIEW",
      executionMode: "STAGE_BLUEPRINT",
    },
    {
      id: "boot-rig",
      timestamp: "BOOT",
      sdkPackage: "@manycore/aholo-viewer@1.14.0",
      sdkMethod: "GLTFLoader.loadGLTF (Lux3D rigged actor)",
      taskIdOrWorldId: "character-animated.glb (retarget task 8359816 · 8 clips)",
      statusLabel: "LOADED",
      executionMode: "LUX3D_RESULT",
    },
  ]);

  useEffect(() => {
    const savedKey = localStorage.getItem("holorra_aholo_api_key") || "";
    const savedRegion =
      (localStorage.getItem("holorra_aholo_region") as "com" | "cn") || "com";
    if (savedKey) setApiKey(savedKey);
    if (savedRegion === "cn" || savedRegion === "com") setRegion(savedRegion);

    fetch("/api/aholo/status")
      .then((r) => r.json())
      .then((d) => {
        if (d?.auth?.hasApiKey) setHasServerKey(true);
      })
      .catch(() => {});
  }, []);

  const handleSaveApiConfig = (newKey: string, newRegion: "com" | "cn") => {
    setApiKey(newKey);
    setRegion(newRegion);
    localStorage.setItem("holorra_aholo_api_key", newKey);
    localStorage.setItem("holorra_aholo_region", newRegion);
  };

  const handleSelectWorldPreset = useCallback((preset: AholoWorldPreset) => {
    setActiveWorldPreset(preset);
    const defaultHero = LUX3D_HERO_BLUEPRINTS[preset.defaultHeroAssetId];
    if (defaultHero) setActiveHeroBlueprint(defaultHero);
    setActorId(preset.defaultActorId);
    setKeyframes(preset.defaultKeyframes);
    setSelectedPartId(null);
    setIsPlayingSpline(false);
  }, []);

  // Deep links from the landing page: /studio?world=<preset id> and /studio?play=1
  const [autoPlay, setAutoPlay] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const preset = AHOLO_WORLD_PRESETS.find((w) => w.id === q.get("world"));
    if (preset) handleSelectWorldPreset(preset);
    if (q.get("play") === "1") setAutoPlay(true);
  }, [handleSelectWorldPreset]);

  const handleTogglePartVisible = useCallback((partId: string) => {
    setPartOverrides((prev) => {
      const cur = prev[partId] ?? { visible: true };
      return {
        ...prev,
        [partId]: { ...cur, visible: !cur.visible },
      };
    });
  }, []);

  const handleSetPartColor = useCallback((partId: string, colorHex: string) => {
    setPartOverrides((prev) => {
      const cur = prev[partId] ?? { visible: true };
      return {
        ...prev,
        [partId]: { ...cur, colorHex },
      };
    });
  }, []);

  const handleResetParts = useCallback(() => {
    setPartOverrides({});
    setExplodePercent(0);
    setSelectedPartId(null);
  }, []);

  // ---------------------------------------------------------------- generate → drops into the stage
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);

  const handleAddReceipt = useCallback((receipt: ApiReceiptLog) => {
    setReceipts((prev) => [receipt, ...prev.slice(0, 24)]);
    // a request the API refused also shows on the stage for 8 s, so a failed click is never silent
    if (receipt.statusLabel === "FAILED") {
      const id = -Date.now();
      setPendingJobs((prev) => [
        { taskId: id, label: `${receipt.sdkMethod}: ${receipt.taskIdOrWorldId}`, method: receipt.sdkMethod, startedAt: Date.now(), status: "failed" },
        ...prev,
      ]);
      window.setTimeout(() => setPendingJobs((prev) => prev.filter((p) => p.taskId !== id)), 8000);
    }
  }, []);
  const [spawnedAssets, setSpawnedAssets] = useState<SpawnedAsset[]>([]);
  const pendingJobsRef = useRef(pendingJobs);
  pendingJobsRef.current = pendingJobs;
  const handledTasksRef = useRef<Set<number>>(new Set());
  const timersRef = useRef<number[]>([]);
  useEffect(() => () => timersRef.current.forEach((t) => window.clearTimeout(t)), []);
  const later = useCallback((fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  }, []);

  const handleJobSubmitted = useCallback(
    (job: SubmittedJob) => {
      if (job.live) {
        setPendingJobs((prev) =>
          prev.some((p) => p.taskId === job.taskId)
            ? prev
            : [...prev, { taskId: job.taskId, label: job.label, method: job.method, startedAt: Date.now(), status: "running" }]
        );
        return;
      }
      // No API key: the preview drops a stored real Lux3D result, and says so.
      later(() => {
        setSpawnedAssets((prev) => [
          ...prev,
          { id: `cached-${Date.now()}`, ...CACHED_LUX3D_RESULT, label: tx(langRef.current, CACHED_LUX3D_LABEL) },
        ]);
        handleAddReceipt({
          id: `rcpt_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          sdkPackage: "@manycore/aholo-viewer@1.14.0",
          sdkMethod: "GLTFLoader.loadGLTF (cached Lux3D result)",
          taskIdOrWorldId: "task_8353472 · cached result dropped (no API key)",
          statusLabel: "DROPPED · no API key",
          executionMode: "INSTANT_STAGE_BLUEPRINT",
        });
      }, 2500);
    },
    [handleAddReceipt, later]
  );

  // Poll live jobs every 10 s with the same BYOK headers the docks send.
  const hasRunningJobs = pendingJobs.some((j) => j.status === "running");
  useEffect(() => {
    if (!hasRunningJobs) return;
    let cancelled = false;
    const headers: Record<string, string> = { "x-aholo-region": region };
    if (apiKey) headers["x-aholo-api-key"] = apiKey;

    const fail = (job: PendingJob, why: string) => {
      setPendingJobs((prev) => prev.map((p) => (p.taskId === job.taskId ? { ...p, status: "failed" } : p)));
      handleAddReceipt({
        id: `rcpt_${Date.now()}_${job.taskId}`,
        timestamp: new Date().toLocaleTimeString(),
        sdkPackage: "@manycore/aholo-sdk-lux3d@1.10.0",
        sdkMethod: "lux3d.tasks.retrieve",
        taskIdOrWorldId: `task_${job.taskId} · ${why.toLowerCase()}`,
        statusLabel: why,
        executionMode: "LIVE_AHOLO_CLOUD_SDK",
      });
      later(() => setPendingJobs((prev) => prev.filter((p) => p.taskId !== job.taskId)), 8000);
    };

    const poll = async () => {
      for (const job of pendingJobsRef.current.filter((j) => j.status === "running")) {
        if (handledTasksRef.current.has(job.taskId)) continue;
        try {
          const d = await (await fetch(`/api/aholo/tasks?taskId=${job.taskId}`, { headers })).json();
          const task = d?.task;
          if (cancelled || !task) continue;
          if (task.status === 3) {
            handledTasksRef.current.add(job.taskId);
            const glb = pickGlbUrl(task.outputs);
            if (!glb) {
              // finished, but the result is not a mesh (images, a URDF pack, an export archive…)
              setPendingJobs((prev) => prev.filter((p) => p.taskId !== job.taskId));
              handleAddReceipt({
                id: `rcpt_${Date.now()}_${job.taskId}`,
                timestamp: new Date().toLocaleTimeString(),
                sdkPackage: "@manycore/aholo-sdk-lux3d@1.10.0",
                sdkMethod: job.method,
                taskIdOrWorldId: `task_${job.taskId} · done, see the task on labs.aholo.ai`,
                statusLabel: "SUCCEEDED (3)",
                executionMode: "LIVE_AHOLO_CLOUD_SDK",
              });
              continue;
            }
            setSpawnedAssets((prev) =>
              prev.some((a) => a.id === `task-${job.taskId}`)
                ? prev
                : [
                    ...prev,
                    {
                      id: `task-${job.taskId}`,
                      url: `/api/aholo/asset?url=${encodeURIComponent(glb)}`,
                      label: job.label,
                      source: "live",
                      taskId: job.taskId,
                    },
                  ]
            );
            setPendingJobs((prev) => prev.filter((p) => p.taskId !== job.taskId));
            handleAddReceipt({
              id: `rcpt_${Date.now()}_${job.taskId}`,
              timestamp: new Date().toLocaleTimeString(),
              sdkPackage: "@manycore/aholo-sdk-lux3d@1.10.0",
              sdkMethod: "lux3d.tasks.retrieve",
              taskIdOrWorldId: `task_${job.taskId} · done, dropped into stage`,
              statusLabel: "SUCCEEDED (3) · dropped into stage",
              executionMode: "LIVE_AHOLO_CLOUD_SDK",
            });
          } else if (task.status === 4 || task.status === 6) {
            handledTasksRef.current.add(job.taskId);
            fail(job, task.status === 4 ? "FAILED (4)" : "CANCELED (6)");
          }
        } catch {
          // transient network error: try again on the next tick
        }
      }
    };
    void poll();
    const id = window.setInterval(poll, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [hasRunningJobs, apiKey, region, handleAddReceipt, later]);

  const handleCaptureKeyframe = useCallback(
    (pose: {
      position: [number, number, number];
      target: [number, number, number];
      snapshotDataUrl?: string;
    }) => {
      setKeyframes((prev) => [
        ...prev,
        {
          id: `kf_${Date.now()}`,
          label: `Captured view ${String(prev.length + 1).padStart(2, "0")}`,
          labelZh: `捕获视角 ${String(prev.length + 1).padStart(2, "0")}`,
          position: pose.position,
          target: pose.target,
          durationSec: 3.0,
          luxrealPrompt: `Cinematic 3DGS camera move focusing on ${activeHeroBlueprint.name} (${explodePercent}% part-split) and ${AHOLO_RIGGED_ACTORS[actorId].name}`,
          snapshotDataUrl: pose.snapshotDataUrl,
        },
      ]);
    },
    [activeHeroBlueprint.name, explodePercent, actorId]
  );

  const handleDeleteKeyframe = useCallback((id: string) => {
    setKeyframes((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const handleApplyDirectorMutation = useCallback(
    (m: DirectorStageMutation) => {
      if (m.switchWorldPresetId) {
        const found = AHOLO_WORLD_PRESETS.find(
          (p) => p.id === m.switchWorldPresetId
        );
        if (found) handleSelectWorldPreset(found);
      }
      if (
        m.switchHeroBlueprintId &&
        LUX3D_HERO_BLUEPRINTS[m.switchHeroBlueprintId]
      ) {
        setActiveHeroBlueprint(LUX3D_HERO_BLUEPRINTS[m.switchHeroBlueprintId]);
      }
      if (typeof m.explodePercent === "number") {
        setExplodePercent(m.explodePercent);
      }
      if (typeof m.articulateActive === "boolean") {
        setArticulateActive(m.articulateActive);
      }
      if (m.switchActorId) {
        setActorId(m.switchActorId);
      }
      if (m.triggerAnimationId) {
        setActiveAnimationId(m.triggerAnimationId);
      }
      if (m.cameraMode) {
        setCameraMode(m.cameraMode);
      }
      if (m.playCameraSpline) {
        setIsPlayingSpline(true);
      }
    },
    [handleSelectWorldPreset]
  );

  // ---------------------------------------------------------------- mobile drawer (≤ 900px)
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPane, setDrawerPane] = useState<"create" | "inspect">("create");
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  // Leaving the phone layout (rotate / resize) must not leave a hidden drawer "open".
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);
  /** In the drawer, choices that change what the stage shows also close it. */
  const thenClose = useCallback(
    <A extends unknown[]>(fn: (...args: A) => void) =>
      (...args: A) => {
        fn(...args);
        if (isMobile) setDrawerOpen(false);
      },
    [isMobile]
  );

  const creationDock = (
    <CreationDock
      activeWorldPreset={activeWorldPreset}
      onSelectWorldPreset={thenClose(handleSelectWorldPreset)}
      activeHeroBlueprint={activeHeroBlueprint}
      onSelectHeroBlueprint={thenClose((bp: Lux3dHeroAssetBlueprint) => {
        setActiveHeroBlueprint(bp);
        setSelectedPartId(null);
      })}
      selectedPartId={selectedPartId}
      onSelectPart={setSelectedPartId}
      partOverrides={partOverrides}
      onTogglePartVisible={handleTogglePartVisible}
      actorId={actorId}
      receipts={receipts}
      onAddReceipt={handleAddReceipt}
      apiKey={apiKey}
      region={region}
      onJobSubmitted={thenClose(handleJobSubmitted)}
      pendingJobs={pendingJobs}
    />
  );

  const inspectorDock = (
    <InspectorDock
      onJobSubmitted={handleJobSubmitted}
      activeHeroBlueprint={activeHeroBlueprint}
      explodePercent={explodePercent}
      onExplodePercentChange={setExplodePercent}
      articulateActive={articulateActive}
      onArticulateToggle={setArticulateActive}
      selectedPartId={selectedPartId}
      onSelectPart={setSelectedPartId}
      partOverrides={partOverrides}
      onTogglePartVisible={handleTogglePartVisible}
      onSetPartColor={handleSetPartColor}
      onResetParts={handleResetParts}
      actorId={actorId}
      onSelectActor={thenClose(setActorId)}
      activeAnimationId={activeAnimationId}
      onSelectAnimation={thenClose(setActiveAnimationId)}
      cameraMode={cameraMode}
      onCameraModeChange={thenClose(setCameraMode)}
      onApplyDirectorMutation={thenClose(handleApplyDirectorMutation)}
      onAddReceipt={handleAddReceipt}
      apiKey={apiKey}
      region={region}
    />
  );

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-canvas text-ink max-[900px]:overflow-x-hidden max-[900px]:overflow-y-auto">
      {/* Header: brand, world switcher, navigation, render + key settings (+ burger ≤ 900px) */}
      <StudioHeader
        activeWorldPreset={activeWorldPreset}
        onSelectWorldPreset={handleSelectWorldPreset}
        apiKey={apiKey}
        region={region}
        hasServerKey={hasServerKey}
        onSaveApiConfig={handleSaveApiConfig}
        splatExposure={splatExposure}
        onExposureChange={setSplatExposure}
        radialSort={radialSort}
        onRadialSortChange={setRadialSort}
        menuOpen={drawerOpen}
        onToggleMenu={() => setDrawerOpen((o) => !o)}
      />

      {/* Phone / tablet: both docks live in the left drawer behind the burger */}
      {isMobile && (
        <MobileDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          footer={
            <nav aria-label={tx(lang, { en: "Pages", zh: "页面" })} className="grid grid-cols-2 gap-1.5">
              {DRAWER_LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={closeDrawer} className="btn btn-ghost justify-start px-2">
                  <Glyph name={l.glyph} size={14} />
                  <T en={l.label.en} zh={l.label.zh} />
                </Link>
              ))}
            </nav>
          }
        >
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-line p-3">
              <div
                role="tablist"
                aria-label={tx(lang, { en: "Dock", zh: "面板" })}
                className="grid grid-cols-2 gap-1 rounded-md border border-line bg-canvas p-0.5"
              >
                {(
                  [
                    { id: "create", label: { en: "Create", zh: "创建" }, glyph: "mesh" },
                    { id: "inspect", label: { en: "Inspect", zh: "检视" }, glyph: "split" },
                  ] as const
                ).map((p) => {
                  const active = drawerPane === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setDrawerPane(p.id)}
                      className={`flex h-9 items-center justify-center gap-2 rounded-[4px] text-[14px] transition-colors ${
                        active ? "bg-hover text-ink" : "text-ink-3 hover:text-ink"
                      }`}
                    >
                      <Glyph name={p.glyph} size={14} className={active ? "text-accent" : ""} />
                      <T en={p.label.en} zh={p.label.zh} />
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Both docks stay mounted so their tab / form state survives switching. */}
            <div
              className={`min-h-0 flex-1 [&>*]:w-full! [&>*]:min-w-0 [&>*]:border-r-0! ${drawerPane === "create" ? "flex" : "hidden"}`}
            >
              {creationDock}
            </div>
            <div
              className={`min-h-0 flex-1 [&>*]:w-full! [&>*]:min-w-0 [&>*]:border-l-0! ${drawerPane === "inspect" ? "flex" : "hidden"}`}
            >
              {inspectorDock}
            </div>
          </div>
        </MobileDrawer>
      )}

      {/* Workspace: left dock 300px · stage · right dock 340px (stage + timeline only ≤ 900px) */}
      <div className="flex flex-1 min-h-0 overflow-hidden max-[900px]:min-h-fit max-[900px]:flex-col max-[900px]:overflow-visible">
        {/* Left dock (create). The wrapper owns the width; the dock fills it. */}
        {!isMobile && (
          <div className="flex w-[300px] shrink-0 min-h-0 bg-surface border-r border-line max-[900px]:hidden [&>*]:w-full! [&>*]:min-w-0 [&>*]:border-r-0!">
            {creationDock}
          </div>
        )}

        {/* Stage + camera path timeline */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-canvas">
          <div className="flex-1 relative min-h-0 max-[900px]:min-h-[56dvh]">
            <AholoHybridStage
              worldPreset={activeWorldPreset}
              heroBlueprint={activeHeroBlueprint}
              explodePercent={explodePercent}
              articulateActive={articulateActive}
              selectedPartId={selectedPartId}
              onSelectPart={setSelectedPartId}
              partOverrides={partOverrides}
              actorId={actorId}
              activeAnimationId={activeAnimationId}
              cameraMode={cameraMode}
              onCameraModeChange={setCameraMode}
              keyframes={keyframes}
              isPlayingSpline={isPlayingSpline}
              onSplineFinish={() => setIsPlayingSpline(false)}
              onCaptureKeyframe={handleCaptureKeyframe}
              splatExposure={splatExposure}
              radialSort={radialSort}
              spawnedAssets={spawnedAssets}
              pendingJobs={pendingJobs}
              autoPlay={autoPlay}
            />
          </div>

          <LuxRealTimeline
            worldPresetId={activeWorldPreset.id}
            worldTitle={activeWorldPreset.title}
            heroAssetName={activeHeroBlueprint.name}
            actorName={AHOLO_RIGGED_ACTORS[actorId].name}
            activeAnimationClip={activeAnimationId}
            partExplosionPercent={explodePercent}
            keyframes={keyframes}
            isPlayingSpline={isPlayingSpline}
            onTogglePlaySpline={() => setIsPlayingSpline((prev) => !prev)}
            onDeleteKeyframe={handleDeleteKeyframe}
          />
        </main>

        {/* Right dock (inspect: parts, rig, co-director). Wrapper owns the width. */}
        {!isMobile && (
          <div className="flex w-[340px] shrink-0 min-h-0 bg-surface border-l border-line max-[900px]:hidden [&>*]:w-full! [&>*]:min-w-0 [&>*]:border-l-0!">
            {inspectorDock}
          </div>
        )}
      </div>
    </div>
  );
}
