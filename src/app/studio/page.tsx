"use client";

import type { ActorId } from "@/config/aholo-presets";
import React, { useState, useEffect, useCallback } from "react";
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
import CreationDock, { type ApiReceiptLog } from "@/components/docks/CreationDock";
import InspectorDock from "@/components/docks/InspectorDock";
import LuxRealTimeline from "@/components/docks/LuxRealTimeline";
import { MobileDrawer } from "@/components/brand/MobileDrawer";
import { Glyph } from "@/components/brand/Glyph";
import type { CameraKeyframe } from "@/lib/luxreal-exporter";
import type { DirectorStageMutation } from "@/app/api/aholo/director/route";

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

const DRAWER_LINKS = [
  { href: "/", label: "Home", glyph: "back" as const },
  { href: "/lab", label: "Lux3D bench", glyph: "mesh" as const },
  { href: "/report", label: "Report", glyph: "doc" as const },
  { href: "/mcp", label: "MCP hub", glyph: "plug" as const },
];

export default function HolorraStudioPage() {
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
      sdkMethod: "GLTFLoader.loadGLTF (pre-rigged actor)",
      taskIdOrWorldId: "robot.0765006a.glb (idle / walk / fall)",
      statusLabel: "LOADED",
      executionMode: "MANYCORE_OSS_CDN",
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

  const handleAddReceipt = useCallback((receipt: ApiReceiptLog) => {
    setReceipts((prev) => [receipt, ...prev.slice(0, 24)]);
  }, []);

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
    />
  );

  const inspectorDock = (
    <InspectorDock
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
            <nav aria-label="Pages" className="grid grid-cols-2 gap-1.5">
              {DRAWER_LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={closeDrawer} className="btn btn-ghost justify-start px-2">
                  <Glyph name={l.glyph} size={14} />
                  {l.label}
                </Link>
              ))}
            </nav>
          }
        >
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-line p-3">
              <div role="tablist" aria-label="Dock" className="grid grid-cols-2 gap-1 rounded-md border border-line bg-canvas p-0.5">
                {(
                  [
                    { id: "create", label: "Create", glyph: "mesh" },
                    { id: "inspect", label: "Inspect", glyph: "split" },
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
                      {p.label}
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
