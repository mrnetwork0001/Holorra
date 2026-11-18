"use client";

import type { ActorId } from "@/config/aholo-presets";
import React, { useEffect, useRef, useState, useCallback } from "react";
import type {
  AholoWorldPreset,
  Lux3dHeroAssetBlueprint,
} from "@/config/aholo-presets";
import { AHOLO_RIGGED_ACTORS } from "@/config/aholo-presets";
import * as sfx from "@/lib/stage-audio";
import type { HumanoidAnimationId } from "@/config/humanoid-animations";
import {
  loadVoxelCollisionFromCdn,
  type VoxelCollisionEngine,
} from "@/lib/voxel-collision";
import {
  evaluateCameraSpline,
  type CameraKeyframe,
} from "@/lib/luxreal-exporter";
import { Glyph, type GlyphName } from "@/components/brand/Glyph";
import { findFloorY, loadUrdfAssembly, type UrdfAssembly } from "@/lib/urdf-assembly";
import type { PendingJob, SpawnedAsset } from "@/lib/spawned-assets";
import { T, tx, type L } from "@/lib/i18n";
import { useLang } from "@/components/brand/LangSwitch";

/** Scene quest: a short play loop around the real Lux3D assets. */
const QUEST_STEPS: readonly { key: string; title: L; hint: L }[] = [
  {
    key: "walk",
    title: { en: "Walk to the espresso machine", zh: "走到咖啡机旁" },
    hint: { en: "WASD or the joystick", zh: "WASD 或摇杆" },
  },
  {
    key: "brew",
    title: { en: "Brew a coffee", zh: "冲一杯咖啡" },
    hint: { en: "Press E near the machine", zh: "在咖啡机旁按 E" },
  },
  {
    key: "frame",
    title: { en: "Frame the shot", zh: "构图取景" },
    hint: { en: "Press K to add a keyframe", zh: "按 K 添加关键帧" },
  },
  { key: "cheer", title: { en: "Celebrate", zh: "庆祝一下" }, hint: { en: "Press F", zh: "按 F" } },
];

const BEAN_COUNT = 5;
const BEST_KEY = "holorra_best_ms";
/** Keys 1–8 play the actor's eight retargeted Lux3D clips (ids as requested from humanoidAnimationRetarget). */
const EMOTES: { key: string; id: string; ms: number }[] = [
  { key: "idle_loop", id: "Idle_Loop", ms: 2500 },
  { key: "walk_loop", id: "Walk_Loop", ms: 2700 },
  { key: "jog_fwd_loop", id: "Jog_Fwd_Loop", ms: 2800 },
  { key: "interact", id: "Interact", ms: 2000 },
  { key: "chest_open", id: "Chest_Open", ms: 1370 },
  { key: "yes", id: "Yes", ms: 2500 },
  { key: "dance_loop", id: "Dance_Loop", ms: 4000 },
  { key: "sword_attack", id: "Sword_Attack", ms: 1530 },
];
function formatRunTime(ms: number): string {
  const s = Math.max(0, ms) / 1000;
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`;
}

const CAMERA_MODES: { id: StageCameraMode; label: L; glyph: GlyphName; hint: L }[] = [
  { id: "orbit", label: { en: "Orbit", zh: "环绕" }, glyph: "orbit", hint: { en: "Orbit the stage", zh: "环绕查看舞台" } },
  {
    id: "walk-third",
    label: { en: "Third person", zh: "第三人称" },
    glyph: "walk",
    hint: { en: "Walk the actor with WASD", zh: "用 WASD 操控角色行走" },
  },
  {
    id: "walk-first",
    label: { en: "First person", zh: "第一人称" },
    glyph: "eye",
    hint: { en: "First-person walk with voxel collision", zh: "第一人称行走，带体素碰撞" },
  },
  { id: "spline", label: { en: "Path", zh: "镜头路径" }, glyph: "spline", hint: { en: "Camera path view", zh: "镜头路径视角" } },
];

/** Display-only Chinese names for config actors (config `name` stays English). */
const ACTOR_NAME_ZH: Partial<Record<ActorId, string>> = { lux3d: "Lux3D 角色" };

/** Display-only: shorten the voxel status strings set by the loader. */
function describeVoxelStatus(status: string): { label: L; title: L; active: boolean } {
  if (status.startsWith("Voxel Octree Active")) {
    const res = status.match(/@\s*([\d.]+)\s*m/);
    const cm = res ? Math.round(parseFloat(res[1]) * 100) : null;
    return {
      label: cm ? { en: `collision ${cm} cm`, zh: `体素碰撞 ${cm} cm` } : { en: "collision on", zh: "体素碰撞已开启" },
      title: { en: status, zh: status.replace(/^Voxel Octree Active\s*\((.*)\)\s*$/, "体素八叉树已启用（$1）") },
      active: true,
    };
  }
  if (/Streaming|Loading/.test(status)) {
    return {
      label: { en: "collision loading", zh: "体素碰撞加载中" },
      title: { en: status, zh: "正在加载体素碰撞八叉树…" },
      active: false,
    };
  }
  return {
    label: { en: "no collision", zh: "无体素碰撞" },
    title: { en: status, zh: status === "Free Boundary Walk" ? "体素碰撞加载失败，自由行走" : "无体素碰撞，自由飞行" },
    active: false,
  };
}

export type StageCameraMode = "orbit" | "walk-third" | "walk-first" | "spline";

export interface PartOverrideState {
  visible: boolean;
  colorHex?: string;
}

export interface AholoHybridStageProps {
  worldPreset: AholoWorldPreset;
  heroBlueprint: Lux3dHeroAssetBlueprint;
  explodePercent: number;
  articulateActive: boolean;
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  partOverrides: Record<string, PartOverrideState>;
  actorId: ActorId;
  activeAnimationId: HumanoidAnimationId;
  cameraMode: StageCameraMode;
  onCameraModeChange: (mode: StageCameraMode) => void;
  keyframes: CameraKeyframe[];
  isPlayingSpline: boolean;
  onSplineFinish: () => void;
  onCaptureKeyframe: (pose: {
    position: [number, number, number];
    target: [number, number, number];
    snapshotDataUrl?: string;
  }) => void;
  splatExposure: number;
  radialSort: boolean;
  /** finished Lux3D models to drop onto the floor in front of the camera */
  spawnedAssets?: SpawnedAsset[];
  /** Lux3D jobs still running, shown as live timers on the stage */
  pendingJobs?: PendingJob[];
  /** start the scene quest as soon as the world and actor are loaded (/studio?play=1) */
  autoPlay?: boolean;
}

export default function AholoHybridStage({
  worldPreset,
  heroBlueprint,
  explodePercent,
  articulateActive,
  selectedPartId,
  onSelectPart,
  partOverrides,
  actorId,
  activeAnimationId,
  cameraMode,
  onCameraModeChange,
  keyframes,
  isPlayingSpline,
  onSplineFinish,
  onCaptureKeyframe,
  splatExposure,
  radialSort,
  spawnedAssets = [],
  pendingJobs = [],
  autoPlay = false,
}: AholoHybridStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // UI language for attributes only; bilingual state is stored as { en, zh } so effects never depend on it
  const lang = useLang();

  // Status & HUD state
  const [loadingText, setLoadingText] = useState<L>({
    en: "Initializing @manycore/aholo-viewer WebGL2 Engine...",
    zh: "正在初始化 @manycore/aholo-viewer WebGL2 引擎…",
  });
  const [loadProgress, setLoadProgress] = useState<number>(15);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<L | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [voxelStatus, setVoxelStatus] = useState<string>("Loading Octree...");
  const [actorLoaded, setActorLoaded] = useState<boolean>(false);
  const [hudPose, setHudPose] = useState<{ x: number; y: number; z: number; yaw: number }>({
    x: worldPreset.pose.px,
    y: worldPreset.pose.py,
    z: worldPreset.pose.pz,
    yaw: worldPreset.pose.yaw,
  });
  const [splineProgress, setSplineProgress] = useState<number>(0);

  // Mutable live refs for the 60fps render loop
  const explodeRef = useRef(explodePercent);
  explodeRef.current = explodePercent;

  const articulateRef = useRef(articulateActive);
  articulateRef.current = articulateActive;

  const selectedPartRef = useRef(selectedPartId);
  selectedPartRef.current = selectedPartId;

  const partOverridesRef = useRef(partOverrides);
  partOverridesRef.current = partOverrides;

  const cameraModeRef = useRef(cameraMode);
  cameraModeRef.current = cameraMode;

  const activeAnimRef = useRef(activeAnimationId);
  activeAnimRef.current = activeAnimationId;

  const isPlayingSplineRef = useRef(isPlayingSpline);
  isPlayingSplineRef.current = isPlayingSpline;

  const keyframesRef = useRef(keyframes);
  keyframesRef.current = keyframes;

  // Refs to viewer and active camera pose for snapshot/reset
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerInstanceRef = useRef<any>(null);
  const poseStateRef = useRef({
    px: worldPreset.pose.px,
    py: worldPreset.pose.py,
    pz: worldPreset.pose.pz,
    yaw: worldPreset.pose.yaw,
    pitch: worldPreset.pose.pitch,
    distance: worldPreset.pose.thirdPersonDistance || 3.2,
    targetX: worldPreset.pose.lookAt[0],
    targetY: worldPreset.pose.lookAt[1],
    targetZ: worldPreset.pose.lookAt[2],
  });

  const voxelCollisionRef = useRef<VoxelCollisionEngine | null>(null);
  const actorFloorRef = useRef<{ x: number; z: number; y: number } | null>(null);

  // ---- play mode (scene quest), touch joystick and Lux3D drop-ins
  const [play, setPlay] = useState<{ active: boolean; step: number; near: boolean; wrapped: boolean }>({
    active: false,
    step: 0,
    near: false,
    wrapped: false,
  });
  const playRef = useRef({
    active: false, step: 0, near: false, interactAt: -1e9, cheerAt: -1e9, wrappedAt: -1e9,
    startAt: 0, beans: 0, emoteKey: "", emoteUntil: 0, runId: 0,
  });
  // false until the player first moves in a run: shows the "how to walk" hint and holds the clock
  const [moved, setMoved] = useState(false);
  // bean hunt + run timer + finish card
  const [beansUi, setBeansUi] = useState(0);
  const [clock, setClock] = useState(0);
  const [run, setRun] = useState<{ ms: number; beans: number; best: number | null; isBest: boolean } | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const [emoteLabel, setEmoteLabel] = useState<string | null>(null);
  const lastShotRef = useRef<string | null>(null);
  const langRef = useRef(lang);
  langRef.current = lang;
  const [soundOn, setSoundOn] = useState(false);
  useEffect(() => setSoundOn(sfx.initSoundPreference()), []);
  const actionRef = useRef<{ interact: boolean; cheer: boolean }>({ interact: false, cheer: false });
  const joyRef = useRef({ x: 0, y: 0 });
  const joyKnobRef = useRef<HTMLDivElement | null>(null);
  const spawnedRef = useRef<SpawnedAsset[]>(spawnedAssets);
  spawnedRef.current = spawnedAssets;
  const [toast, setToast] = useState<{ text: string; source: "live" | "cached" } | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [touchUi, setTouchUi] = useState(false);
  // Expand: native fullscreen of the stage, or a full-window view where unsupported (iOS Safari)
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState<"off" | "fullscreen" | "window">("off");
  const toggleExpand = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    if (expanded === "window") {
      setExpanded("off");
      return;
    }
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => setExpanded("window"));
    } else {
      setExpanded("window");
    }
  }, [expanded]);
  useEffect(() => {
    const onFs = () => setExpanded(document.fullscreenElement === rootRef.current ? "fullscreen" : "off");
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);
  useEffect(() => {
    // the viewer listens for window resize; nudge it whenever the stage changes size
    const id = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
    if (expanded !== "window") return () => window.clearTimeout(id);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setExpanded("off");
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse), (max-width: 900px)");
    const on = () => setTouchUi(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    if (!pendingJobs.length) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [pendingJobs.length]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const advanceQuest = useCallback((from: number) => {
    const q = playRef.current;
    if (!q.active || q.step !== from) return;
    q.step = from + 1;
    const wrapped = q.step >= QUEST_STEPS.length;
    if (wrapped) {
      q.wrappedAt = performance.now();
      const ms = Math.round(q.wrappedAt - (q.startAt || q.wrappedAt));
      // only a run with every bean counts for the best time
      let best: number | null = null;
      let isBest = false;
      try {
        const prev = Number(localStorage.getItem(BEST_KEY)) || null;
        best = prev;
        if (q.beans >= BEAN_COUNT && (!prev || ms < prev)) {
          localStorage.setItem(BEST_KEY, String(ms));
          best = ms;
          isBest = true;
        }
      } catch {
        /* private mode: no best time */
      }
      setRun({ ms, beans: q.beans, best, isBest });
      sfx.fanfare();
      void buildFinishCardRef.current(ms, q.beans);
    } else {
      sfx.chime(q.step * 2);
    }
    setPlay((s) => ({ ...s, step: q.step, wrapped }));
  }, []);

  const startPlay = useCallback(() => {
    playRef.current = {
      active: true, step: 0, near: false, interactAt: -1e9, cheerAt: -1e9, wrappedAt: -1e9,
      // the clock starts on the first step, not on the click
      startAt: 0, beans: 0, emoteKey: "", emoteUntil: 0, runId: playRef.current.runId + 1,
    };
    setMoved(false);
    // keys go to the stage: a focused prompt box or select would swallow W A S D
    (document.activeElement as HTMLElement | null)?.blur?.();
    setBeansUi(0);
    setClock(0);
    setRun(null);
    setCard(null);
    lastShotRef.current = null;
    setPlay({ active: true, step: 0, near: false, wrapped: false });
    onCameraModeChange("walk-third");
  }, [onCameraModeChange]);

  const autoPlayedRef = useRef(false);
  useEffect(() => {
    if (!autoPlay || autoPlayedRef.current || !isReady || !actorLoaded) return;
    autoPlayedRef.current = true;
    startPlay();
  }, [autoPlay, isReady, actorLoaded, startPlay]);

  const stopPlay = useCallback(() => {
    playRef.current.active = false;
    setPlay({ active: false, step: 0, near: false, wrapped: false });
    setRun(null);
    setCard(null);
  }, []);

  // run clock, shown in the quest panel while a run is in progress
  useEffect(() => {
    if (!play.active || play.wrapped) return;
    const id = window.setInterval(
      () => setClock(playRef.current.startAt ? performance.now() - playRef.current.startAt : 0),
      100
    );
    return () => window.clearInterval(id);
  }, [play.active, play.wrapped]);
  useEffect(() => {
    if (!emoteLabel) return;
    const id = window.setTimeout(() => setEmoteLabel(null), 1400);
    return () => window.clearTimeout(id);
  }, [emoteLabel]);

  /** Finish card: the player's own framed shot with the run's time and beans, as a 1200×630 image. */
  const buildFinishCard = useCallback(
    async (ms: number, beans: number) => {
      try {
        const zh = langRef.current === "zh";
        const W = 1200;
        const H = 630;
        const cv = document.createElement("canvas");
        cv.width = W;
        cv.height = H;
        const g = cv.getContext("2d");
        if (!g) return;
        g.fillStyle = "#0B0B0A";
        g.fillRect(0, 0, W, H);
        const shot = lastShotRef.current ?? containerRef.current?.querySelector("canvas")?.toDataURL("image/jpeg", 0.85);
        if (shot) {
          const img = new Image();
          await new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
            img.src = shot;
          });
          if (img.naturalWidth) {
            const k = Math.max(W / img.naturalWidth, H / img.naturalHeight);
            const w = img.naturalWidth * k;
            const h = img.naturalHeight * k;
            g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
          }
        }
        const grad = g.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "rgba(11,11,10,0.55)");
        grad.addColorStop(0.45, "rgba(11,11,10,0.15)");
        grad.addColorStop(1, "rgba(11,11,10,0.92)");
        g.fillStyle = grad;
        g.fillRect(0, 0, W, H);
        const sans = getComputedStyle(document.body).fontFamily || "sans-serif";
        const mono = `ui-monospace, Menlo, monospace`;
        g.textBaseline = "alphabetic";
        // viewfinder corners
        g.strokeStyle = "#ECE9E2";
        g.lineWidth = 3;
        for (const [x, y, dx, dy] of [[40, 40, 1, 1], [W - 40, 40, -1, 1], [40, H - 40, 1, -1], [W - 40, H - 40, -1, -1]] as const) {
          g.beginPath();
          g.moveTo(x + dx * 44, y);
          g.lineTo(x, y);
          g.lineTo(x, y + dy * 44);
          g.stroke();
        }
        g.fillStyle = "#FF6A2B";
        g.font = `600 22px ${mono}`;
        g.fillText(zh ? "HOLORRA · 本场杀青" : "HOLORRA · SCENE WRAPPED", 72, 96);
        g.fillStyle = "#ECE9E2";
        g.font = `600 120px ${mono}`;
        g.fillText(formatRunTime(ms), 68, H - 150);
        g.font = `500 30px ${sans}`;
        g.fillStyle = "#ECE9E2";
        g.fillText(
          zh
            ? `咖啡豆 ${beans}/${BEAN_COUNT} · ${worldPreset.titleZh ?? worldPreset.title}`
            : `${beans}/${BEAN_COUNT} coffee beans · ${worldPreset.title}`,
          72,
          H - 100
        );
        g.font = `400 22px ${sans}`;
        g.fillStyle = "#A9A59B";
        g.fillText(
          zh ? "我在 AI 生成的 3D 世界里冲了一杯咖啡。你来试试？" : "I brewed a coffee inside a generated 3D world. Beat my time?",
          72,
          H - 62
        );
        g.textAlign = "right";
        g.font = `500 22px ${mono}`;
        g.fillStyle = "#ECE9E2";
        g.fillText("holorra.xyz", W - 72, H - 100);
        g.fillStyle = "#FF6A2B";
        g.fillText("#Manycorehackathon", W - 72, H - 62);
        setCard(cv.toDataURL("image/jpeg", 0.9));
      } catch {
        setCard(null);
      }
    },
    [worldPreset.title, worldPreset.titleZh]
  );
  const buildFinishCardRef = useRef(buildFinishCard);
  buildFinishCardRef.current = buildFinishCard;

  const handleResetCamera = useCallback(() => {
    poseStateRef.current = {
      px: worldPreset.pose.px,
      py: worldPreset.pose.py,
      pz: worldPreset.pose.pz,
      yaw: worldPreset.pose.yaw,
      pitch: worldPreset.pose.pitch,
      distance: worldPreset.pose.thirdPersonDistance || 3.2,
      targetX: worldPreset.pose.lookAt[0],
      targetY: worldPreset.pose.lookAt[1],
      targetZ: worldPreset.pose.lookAt[2],
    };
  }, [worldPreset]);

  const handleTakeKeyframeSnapshot = useCallback(() => {
    const p = poseStateRef.current;
    const forwardX = -Math.sin(p.yaw) * Math.cos(p.pitch);
    const forwardY = Math.sin(p.pitch);
    const forwardZ = -Math.cos(p.yaw) * Math.cos(p.pitch);

    let snapshotDataUrl: string | undefined;
    try {
      const canvas = containerRef.current?.querySelector("canvas");
      if (canvas) {
        snapshotDataUrl = canvas.toDataURL("image/jpeg", 0.75);
        // the finish card uses the player's own shot, at higher quality
        if (playRef.current.active) lastShotRef.current = canvas.toDataURL("image/jpeg", 0.9);
      }
    } catch {
      snapshotDataUrl = undefined;
    }
    sfx.shutter();

    onCaptureKeyframe({
      position: [
        Number(p.px.toFixed(3)),
        Number(p.py.toFixed(3)),
        Number(p.pz.toFixed(3)),
      ],
      target: [
        Number((p.px + forwardX * 2.5).toFixed(3)),
        Number((p.py + forwardY * 2.5).toFixed(3)),
        Number((p.pz + forwardZ * 2.5).toFixed(3)),
      ],
      snapshotDataUrl,
    });
    advanceQuest(2);
  }, [onCaptureKeyframe, advanceQuest]);
  const keyframeShotRef = useRef(handleTakeKeyframeSnapshot);
  keyframeShotRef.current = handleTakeKeyframeSnapshot;
  const triggerEmote = useCallback((i: number) => {
    const e = EMOTES[i];
    if (!e) return;
    playRef.current.emoteKey = e.key;
    playRef.current.emoteUntil = performance.now() + e.ms;
    sfx.emote();
    setEmoteLabel(`${i + 1} · ${e.id}`);
  }, []);
  const triggerEmoteRef = useRef(triggerEmote);
  triggerEmoteRef.current = triggerEmote;

  // Update viewer splatting tone mapping / sorting config on the fly
  useEffect(() => {
    let cancelled = false;
    async function syncViewerConfig() {
      if (!viewerInstanceRef.current) return;
      const Aholo = await import("@manycore/aholo-viewer");
      if (cancelled || !viewerInstanceRef.current) return;
      Aholo.setViewerConfig(viewerInstanceRef.current, {
        pipeline: {
          Splatting: {
            enabled: true,
            sort: { radial: radialSort },
            composite: {
              enabled: true,
              highPrecisionEnabled: true,
              toneMapping: Aholo.ToneMapping.Neutral,
              exposure: splatExposure,
            },
          },
        },
      });
      viewerInstanceRef.current.render();
    }
    void syncViewerConfig();
    return () => {
      cancelled = true;
    };
  }, [splatExposure, radialSort]);

  // Master @manycore/aholo-viewer lifecycle effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const abortController = new AbortController();
    const { signal } = abortController;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let viewer: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lodSplat: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let primarySplat: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let envSplat: any = null;
    let rafId = 0;

    setIsReady(false);
    setErrorMsg(null);
    setActorLoaded(false);
    setLoadProgress(12);
    setLoadingText({
      en: `Booting @manycore/aholo-viewer (${worldPreset.title})...`,
      zh: `正在启动 @manycore/aholo-viewer（${worldPreset.titleZh ?? worldPreset.title}）…`,
    });

    poseStateRef.current = {
      px: worldPreset.pose.px,
      py: worldPreset.pose.py,
      pz: worldPreset.pose.pz,
      yaw: worldPreset.pose.yaw,
      pitch: worldPreset.pose.pitch,
      distance: worldPreset.pose.thirdPersonDistance || 3.2,
      targetX: worldPreset.pose.lookAt[0],
      targetY: worldPreset.pose.lookAt[1],
      targetZ: worldPreset.pose.lookAt[2],
    };

    // Keyboard & Mouse state
    const keysPressed = new Set<string>();
    let isPointerDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return;
      }
      const walking = cameraModeRef.current === "walk-third" || cameraModeRef.current === "walk-first";
      if (walking && !e.repeat) {
        if (e.code === "KeyE") actionRef.current.interact = true;
        if (e.code === "KeyF") actionRef.current.cheer = true;
        if (e.code === "KeyK") keyframeShotRef.current();
        // 1–8: play one of the actor's eight retargeted Lux3D clips
        const n = /^Digit([1-8])$/.exec(e.code);
        if (n) triggerEmoteRef.current(Number(n[1]) - 1);
      }
      keysPressed.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.code);
    };

    // Pointer events cover mouse, touch and pen, so phones can drag to look.
    const onMouseDown = (e: PointerEvent) => {
      if (e.button === 0) {
        isPointerDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        try {
          container.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    };
    const onMouseUp = () => {
      isPointerDragging = false;
    };
    const onMouseMove = (e: PointerEvent) => {
      if (!isPointerDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      const sensitivity = 0.0032;
      poseStateRef.current.yaw -= dx * sensitivity;
      poseStateRef.current.pitch = Math.max(
        -Math.PI / 2 + 0.08,
        Math.min(Math.PI / 2 - 0.08, poseStateRef.current.pitch + dy * sensitivity)
      );
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = poseStateRef.current;
      const forwardX = -Math.sin(p.yaw) * Math.cos(p.pitch);
      const forwardY = Math.sin(p.pitch);
      const forwardZ = -Math.cos(p.yaw) * Math.cos(p.pitch);
      const step = -e.deltaY * 0.0022;
      p.px += forwardX * step;
      p.py += forwardY * step;
      p.pz += forwardZ * step;
      p.distance = Math.max(1.2, Math.min(8.0, p.distance + e.deltaY * 0.002));
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    container.addEventListener("pointerdown", onMouseDown);
    window.addEventListener("pointerup", onMouseUp);
    window.addEventListener("pointercancel", onMouseUp);
    window.addEventListener("pointermove", onMouseMove);
    container.addEventListener("wheel", onWheel, { passive: false });

    async function initAholoStage() {
      try {
        const Aholo = await import("@manycore/aholo-viewer");
        if (signal.aborted) return;

        // Clear any leftover children inside container
        container!.innerHTML = "";

        viewer = Aholo.createViewer("holorra-hybrid-viewer", container!, {
          antialiasing: true,
          alpha: false,
        });
        viewerInstanceRef.current = viewer;

        if (viewer.config?.coordinateSystem?.enabled) {
          viewer.config.coordinateSystem.enabled.set(false);
        }

        const rect = container!.getBoundingClientRect();
        const aspect = Math.max(0.5, rect.width / Math.max(1, rect.height));
        const camera = new Aholo.PerspectiveCamera(60, aspect, 0.08, 200_000);
        camera.up.set(
          worldPreset.pose.up[0],
          worldPreset.pose.up[1],
          worldPreset.pose.up[2]
        );
        camera.position.set(worldPreset.pose.px, worldPreset.pose.py, worldPreset.pose.pz);
        camera.lookAt(
          new Aholo.Vector3(
            worldPreset.pose.lookAt[0],
            worldPreset.pose.lookAt[1],
            worldPreset.pose.lookAt[2]
          )
        );

        viewer.setCamera(camera);
        Aholo.setViewerConfig(viewer, {
          pipeline: {
            Background: {
              background: {
                active: Aholo.BackgroundMode.BasicBackground,
                basic: {
                  color: new Aholo.Color(0.024, 0.028, 0.04),
                },
              },
              ground: {
                enabled: false,
              },
            },
            Splatting: {
              enabled: true,
              sort: { radial: radialSort },
              composite: {
                enabled: true,
                highPrecisionEnabled: true,
                toneMapping: Aholo.ToneMapping.Neutral,
                exposure: splatExposure,
              },
            },
            TAA: {
              enabled: false,
            },
          },
        });

        const scene = viewer.getScene();

        // 1. Add Studio Lighting for Hybrid PBR & Part-Split Meshes
        const lightGroup = new Aholo.Object3D();
        const ambient = new Aholo.AmbientLight(0xffffff, 0.6);
        const keyLight = new Aholo.DirectionalLight(0xfff4e8, 1.15);
        keyLight.position.set(1.5, -2.5, 1.8);
        const rimLight = new Aholo.DirectionalLight(0xffd9c4, 0.4);
        rimLight.position.set(-2.0, 1.2, -1.5);
        lightGroup.add(ambient);
        lightGroup.add(keyLight);
        lightGroup.add(rimLight);
        scene.add(lightGroup);

        // 2. Build Procedural + Part-Split Hero Asset Hierarchy inside the 3DGS Scene
        const TAU = Math.PI * 2;
        function buildSurfaceGeometry(
          wSeg: number,
          hSeg: number,
          sample: (u: number, v: number) => [number, number, number, number, number, number]
        ) {
          const positions: number[] = [];
          const normals: number[] = [];
          const uvs: number[] = [];
          const indices: number[] = [];
          for (let y = 0; y <= hSeg; y++) {
            for (let x = 0; x <= wSeg; x++) {
              const u = x / wSeg;
              const v = y / hSeg;
              const [px, py, pz, nx, ny, nz] = sample(u, v);
              positions.push(px, py, pz);
              normals.push(nx, ny, nz);
              uvs.push(u, 1 - v);
            }
          }
          const row = wSeg + 1;
          for (let y = 0; y < hSeg; y++) {
            for (let x = 0; x < wSeg; x++) {
              const a = x + row * y;
              const b = a + row;
              indices.push(a, b, a + 1, b, b + 1, a + 1);
            }
          }
          const geom = new Aholo.BufferGeometry();
          geom.setIndex(indices);
          geom.setAttribute("position", new Aholo.BufferAttribute(new Float32Array(positions), 3));
          geom.setAttribute("normal", new Aholo.BufferAttribute(new Float32Array(normals), 3));
          geom.setAttribute("uv", new Aholo.BufferAttribute(new Float32Array(uvs), 2));
          geom.computeBoundingSphere();
          return geom;
        }

        /** A plain sharp-edged box (the part geometries are rounded), centred on the origin. */
        function createBoxGeometry(w: number, h: number, d: number) {
          const x = w / 2, y = h / 2, z = d / 2;
          // prettier-ignore
          const faces: [number[], number[][]][] = [
            [[1, 0, 0], [[x, -y, -z], [x, y, -z], [x, y, z], [x, -y, z]]],
            [[-1, 0, 0], [[-x, -y, z], [-x, y, z], [-x, y, -z], [-x, -y, -z]]],
            [[0, 1, 0], [[-x, y, -z], [-x, y, z], [x, y, z], [x, y, -z]]],
            [[0, -1, 0], [[-x, -y, z], [-x, -y, -z], [x, -y, -z], [x, -y, z]]],
            [[0, 0, 1], [[x, -y, z], [x, y, z], [-x, y, z], [-x, -y, z]]],
            [[0, 0, -1], [[-x, -y, -z], [-x, y, -z], [x, y, -z], [x, -y, -z]]],
          ];
          const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
          faces.forEach(([n, vs], f) => {
            vs.forEach((v, i) => {
              pos.push(...v);
              nor.push(...n);
              uv.push(i === 1 || i === 2 ? 1 : 0, i >= 2 ? 1 : 0);
            });
            const b = f * 4;
            idx.push(b, b + 1, b + 2, b, b + 2, b + 3, b, b + 2, b + 1, b, b + 3, b + 2); // both windings: visible from any side
          });
          const geom = new Aholo.BufferGeometry();
          geom.setIndex(idx);
          geom.setAttribute("position", new Aholo.BufferAttribute(new Float32Array(pos), 3));
          geom.setAttribute("normal", new Aholo.BufferAttribute(new Float32Array(nor), 3));
          geom.setAttribute("uv", new Aholo.BufferAttribute(new Float32Array(uv), 2));
          geom.computeBoundingSphere();
          return geom;
        }

        function createPartGeometry(
          type: "box" | "cylinder" | "sphere" | "torus",
          dims: [number, number, number]
        ) {
          if (type === "torus") {
            const R = dims[0];
            const r = dims[1];
            return buildSurfaceGeometry(22, 16, (u, v) => {
              const phi = u * TAU;
              const theta = -v * TAU;
              const cp = Math.cos(phi);
              const sp = Math.sin(phi);
              const ct = Math.cos(theta);
              const st = Math.sin(theta);
              return [
                (R + r * ct) * cp,
                (R + r * ct) * sp,
                r * st,
                ct * cp,
                ct * sp,
                st,
              ];
            });
          }
          if (type === "sphere") {
            const rad = dims[0];
            return buildSurfaceGeometry(18, 16, (u, v) => {
              const phi = u * TAU;
              const theta = v * Math.PI;
              const st = Math.sin(theta);
              const x = -Math.cos(phi) * st;
              const y = Math.cos(theta);
              const z = Math.sin(phi) * st;
              return [x * rad, y * rad, z * rad, x, y, z];
            });
          }
          // Rounded-box / super-ellipsoid surface for clean single-geometry part meshes
          const [wx, hy, dz] = dims.map((d) => d * 0.5);
          return buildSurfaceGeometry(18, 14, (u, v) => {
            const phi = u * TAU;
            const theta = (v - 0.5) * Math.PI;
            const cp = Math.cos(phi);
            const sp = Math.sin(phi);
            const ct = Math.cos(theta);
            const st = Math.sin(theta);
            const sgn = (n: number) => (n >= 0 ? 1 : -1);
            const powSigned = (n: number, p: number) => sgn(n) * Math.pow(Math.abs(n), p);
            const nx = powSigned(ct * cp, 0.35);
            const ny = powSigned(st, 0.35);
            const nz = powSigned(ct * sp, 0.35);
            return [nx * wx, ny * hy, nz * dz, ct * cp, st, ct * sp];
          });
        }

        const heroRoot = new Aholo.Object3D();
        heroRoot.position.set(
          heroBlueprint.worldPosition[0],
          heroBlueprint.worldPosition[1],
          heroBlueprint.worldPosition[2]
        );
        heroRoot.scale.setScalar(heroBlueprint.worldScale);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const partMeshRecords: { spec: typeof heroBlueprint.parts[number]; mesh: any; material: any }[] = [];

        // Real Lux3D articulation result: Y-up metres, flipped into the OpenCV (-Y up) world,
        // standing on the floor 'placement' (refined by the voxel grid once it loads).
        const spawnYaw = worldPreset.pose.yaw;
        const spawnFwd: [number, number] = [-Math.sin(spawnYaw), -Math.cos(spawnYaw)];
        const spawnRight: [number, number] = [Math.cos(spawnYaw), -Math.sin(spawnYaw)];
        const realPlacement = heroBlueprint.real
          ? heroBlueprint.real.placements[worldPreset.id] ?? {
              at: [
                worldPreset.pose.px + spawnFwd[0] * 1.1 - spawnRight[0] * 0.3,
                worldPreset.pose.pz + spawnFwd[1] * 1.1 - spawnRight[1] * 0.3,
              ] as [number, number],
              floorY: worldPreset.floorY ?? worldPreset.pose.py + 0.91,
              yawDeg: undefined,
            }
          : null;
        let realAssembly: UrdfAssembly | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const realBasePos: Record<string, [number, number, number]> = {};
        if (heroBlueprint.real && realPlacement) {
          heroRoot.position.set(realPlacement.at[0], realPlacement.floorY, realPlacement.at[1]);
          heroRoot.scale.setScalar(1);
          if ("plinth" in realPlacement && realPlacement.plinth) {
            // a display plinth under the prop, standing on open floor (+Y is down)
            const ph = realPlacement.plinth;
            const plinth = new Aholo.Mesh(
              createBoxGeometry(0.46, ph, 0.46),
              new Aholo.MeshPhongMaterial({ color: 0x2a2825, specular: 0x333333, shininess: 18 })
            );
            plinth.position.set(realPlacement.at[0], realPlacement.floorY + ph / 2, realPlacement.at[1]);
            scene.add(plinth);
          }
          // face the spawn camera unless the placement says otherwise
          heroRoot.rotation.y =
            realPlacement.yawDeg !== undefined
              ? (realPlacement.yawDeg * Math.PI) / 180
              : Math.atan2(-spawnFwd[0], -spawnFwd[1]) + Math.PI;
          const flip = new Aholo.Object3D();
          flip.rotation.x = Math.PI;
          heroRoot.add(flip);
          loadUrdfAssembly(Aholo, heroBlueprint.real.urdf, signal)
            .then((a) => {
              if (signal.aborted) return;
              for (const [name, fr] of Object.entries(a.frames)) {
                realBasePos[name] = [fr.position.x, fr.position.y, fr.position.z];
              }
              flip.add(a.root);
              realAssembly = a;
            })
            .catch(() => {
              /* non-fatal: the world still renders */
            });
        }

        for (const partSpec of heroBlueprint.real ? [] : heroBlueprint.parts) {
          const geom = createPartGeometry(partSpec.geometryType, partSpec.dimensions);
          const mat = new Aholo.MeshPhongMaterial({
            color: partSpec.defaultColor,
            specular: 0xffffff,
            shininess: 85,
          });
          const mesh = new Aholo.Mesh(geom, mat);
          mesh.position.set(
            partSpec.baseOffset[0],
            partSpec.baseOffset[1],
            partSpec.baseOffset[2]
          );
          heroRoot.add(mesh);
          partMeshRecords.push({ spec: partSpec, mesh, material: mat });
        }
        scene.add(heroRoot);

        // 3. Load Sparse Octree Voxel Collision Grid (if preset provides one)
        voxelCollisionRef.current = null;
        actorFloorRef.current = null;
        if (worldPreset.voxelMetaUrl && worldPreset.voxelBinUrl) {
          setVoxelStatus("Streaming Sparse Octree...");
          loadVoxelCollisionFromCdn(worldPreset.voxelMetaUrl, worldPreset.voxelBinUrl, signal)
            .then((engine) => {
              if (signal.aborted) return;
              engine.setMirrorXY(Boolean(worldPreset.mirrorXY));
              voxelCollisionRef.current = engine;
              const solid = (x: number, y: number, z: number) => engine.isWorldPointSolid(x, y, z);
              if (realPlacement && !("plinth" in realPlacement && realPlacement.plinth)) {
                const fy = findFloorY(solid, realPlacement.at[0], worldPreset.pose.py, realPlacement.at[1]);
                if (fy !== null && Math.abs(fy - realPlacement.floorY) < 0.6) heroRoot.position.y = fy;
              }
              if (actorFloorRef.current) {
                const a = actorFloorRef.current;
                const fy = findFloorY(solid, a.x, worldPreset.pose.py, a.z);
                if (fy !== null && Math.abs(fy - a.y) < 0.6) a.y = fy;
              }
              const stats = engine.getStats();
              setVoxelStatus(
                `Voxel Octree Active (${stats.dimensions.join("×")} @ ${stats.voxelResolutionMeters}m)`
              );
            })
            .catch(() => {
              if (!signal.aborted) setVoxelStatus("Free Boundary Walk");
            });
        } else {
          setVoxelStatus("Free Spatial Flight");
        }

        // 4. Load Rigged Third-Person Humanoid Actor (.glb) via GLTFLoader + AnimationPlugin
        const actorConfig = AHOLO_RIGGED_ACTORS[actorId];
        const actorRoot = new Aholo.Object3D();
        const animPlugin = new Aholo.Animation.AnimationPlugin();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        animPlugin.registerToViewer({ viewer } as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let actorMixer: any = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const actorActions: Record<string, any> = {};
        let currentClipKey = "";

        async function loadRiggedActorGlb() {
          try {
            const resp = await fetch(actorConfig.glbUrl, { signal });
            if (!resp.ok || signal.aborted) return;
            const arrayBuf = await resp.arrayBuffer();
            if (signal.aborted) return;
            const gltf = await Aholo.GLTFLoader.loadGLTF(arrayBuf, {
              textureLoader: Aholo.downloadTexture,
            });
            if (signal.aborted) return;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const model = gltf.scene as any;
            actorMixer = new Aholo.Animation.AnimationMixer(model);
            animPlugin.add(actorMixer);

            const boundSet = new WeakSet<object>();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            gltf.skeletons?.forEach((skinnedMeshes: any, iSkeleton: any) => {
              const skeleton = new Aholo.Animation.Skeleton(
                iSkeleton.bones,
                iSkeleton.inverseBindMatrices
              );
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              skinnedMeshes.forEach((skinnedMesh: any) => {
                if (boundSet.has(skinnedMesh)) return;
                boundSet.add(skinnedMesh);
                animPlugin.bindSkinned(skinnedMesh, skeleton, actorMixer);
              });
            });

            model.scale.setScalar(actorConfig.scale ?? 0.75);
            const body = new Aholo.Object3D();
            if (actorConfig.upAxis === "y") body.rotation.x = Math.PI; // glTF Y-up → OpenCV
            body.add(model);
            actorRoot.add(body);
            if (actorConfig.upAxis === "y") {
              // beside the hero prop, ~1.5 m ahead of the spawn camera, on the floor
              const ax = worldPreset.actorSpot?.[0] ?? worldPreset.pose.px + spawnFwd[0] * 2.6 - spawnRight[0] * 0.15;
              const az = worldPreset.actorSpot?.[1] ?? worldPreset.pose.pz + spawnFwd[1] * 2.6 - spawnRight[1] * 0.15;
              actorFloorRef.current = actorFloorRef.current ?? {
                x: ax,
                z: az,
                y: worldPreset.floorY ?? worldPreset.pose.py + 0.91,
              };
              actorRoot.position.set(ax, actorFloorRef.current.y, az);
              actorRoot.rotation.y = Math.atan2(-spawnFwd[0], -spawnFwd[1]) + Math.PI;
            } else {
              actorRoot.position.set(
                heroBlueprint.worldPosition[0] + 0.85,
                heroBlueprint.worldPosition[1] + 0.35,
                heroBlueprint.worldPosition[2] + 0.45
              );
            }
            scene.add(actorRoot);

            const clips = gltf.animations || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            clips.forEach((clip: any) => {
              const act = actorMixer.clipAction(clip);
              act.active = false;
              act.weight = 0;
              const mapped = actorConfig.clipMap?.[clip.name] ?? clip.name;
              actorActions[mapped.toLowerCase()] = act;
            });

            const firstKey = actorActions["idle_loop"] ? "idle_loop" : Object.keys(actorActions)[0];
            if (firstKey) {
              // aholo-viewer AnimationAction has no play(); reset() also sets active=false,
              // so reset first, then activate.
              actorActions[firstKey].reset();
              actorActions[firstKey].active = true;
              actorActions[firstKey].weight = 1;
              currentClipKey = firstKey;
            }
            setActorLoaded(true);
          } catch {
            // Non-fatal if offline
          }
        }
        void loadRiggedActorGlb();

        // 5. Load 3D Gaussian Splatting World (Direct .spz/.sog/.ply OR Chunk-LOD Stream)
        setLoadProgress(38);
        if (worldPreset.splatMode === "direct" && worldPreset.primarySplatUrl) {
          setLoadingText({
            en: `Streaming 3DGS Splat (${worldPreset.splatCountLabel})...`,
            zh: `正在流式加载 3DGS 高斯点（${worldPreset.splatCountLabel}）…`,
          });
          const ft =
            Aholo.SplatLoader.detectSplatFileType(worldPreset.primarySplatUrl, new Uint8Array()) ??
            Aholo.SplatLoader.SplatFileType.SPZ;
          const splatData = await Aholo.SplatLoader.parseSplatData(
            ft,
            // absolute: the splat worker runs from a blob: URL and cannot resolve app-relative paths
            new URL(worldPreset.primarySplatUrl, window.location.href).href,
            Aholo.SplatLoader.SplatPackType.Compressed,
            { signal }
          );
          if (signal.aborted) return;
          setLoadProgress(82);
          primarySplat = await Aholo.SplatUtils.createSplat(splatData);
          if (signal.aborted) {
            primarySplat.destroy();
            return;
          }
          if (worldPreset.upAxis === "z") {
            // SpatialGen worlds are Z-up: rotate +Z onto the stage's -Y (OpenCV) up axis
            const upFix = new Aholo.Object3D();
            upFix.rotation.x = Math.PI / 2;
            upFix.add(primarySplat);
            scene.add(upFix);
          } else if (worldPreset.mirrorXY) {
            // this world is stored +Y up: turn it half a turn about Z into the stage's −Y-up frame
            const flipFix = new Aholo.Object3D();
            flipFix.rotation.z = Math.PI;
            flipFix.add(primarySplat);
            scene.add(flipFix);
          } else {
            scene.add(primarySplat);
          }
        } else if (worldPreset.splatMode === "lod" && worldPreset.lodMetaUrl) {
          if (worldPreset.envSplatUrl) {
            setLoadingText({
              en: "Loading 3DGS Sky & Environment Radiance Layer...",
              zh: "正在加载 3DGS 天空与环境辐射层…",
            });
            const envFt =
              Aholo.SplatLoader.detectSplatFileType(worldPreset.envSplatUrl, new Uint8Array()) ??
              Aholo.SplatLoader.SplatFileType.PLY;
            const envData = await Aholo.SplatLoader.parseSplatData(
              envFt,
              new URL(worldPreset.envSplatUrl, window.location.href).href,
              Aholo.SplatLoader.SplatPackType.Compressed,
              { signal }
            );
            if (signal.aborted) return;
            envSplat = await Aholo.SplatUtils.createSplat(envData);
            if (signal.aborted) {
              envSplat.destroy();
              return;
            }
            if (worldPreset.mirrorXY) {
              const envFix = new Aholo.Object3D();
              envFix.rotation.z = Math.PI;
              envFix.add(envSplat);
              scene.add(envFix);
            } else {
              scene.add(envSplat);
            }
          }

          setLoadProgress(60);
          setLoadingText({
            en: `Connecting Chunk-LOD 3DGS Stream (${worldPreset.splatCountLabel})...`,
            zh: `正在连接分块 LOD 3DGS 流（${worldPreset.splatCountLabel}）…`,
          });
          const metaRes = await fetch(worldPreset.lodMetaUrl, { signal });
          const metaJson = await metaRes.json();
          if (signal.aborted) return;

          lodSplat = new Aholo.SplatUtils.LodSplat(
            metaJson,
            {
              // level 0 is the finest: admit every level and let the splat budget decide
              minLevel: 0,
              movingMinLevel: 1,
              maxBudget: worldPreset.lodBudgetSplats || 3_500_000,
              pixelLimitEnabled: true,
              schedulerParallelCounts: 8,
            },
            Aholo.createViewerContext(viewer),
            async (chunkUrl: string) => {
              const ft =
                Aholo.SplatLoader.detectSplatFileType(chunkUrl, new Uint8Array()) ??
                Aholo.SplatLoader.SplatFileType.SPZ;
              return Aholo.SplatLoader.parseSplatData(
                ft,
                chunkUrl,
                Aholo.SplatLoader.SplatPackType.Compressed,
                { signal }
              );
            }
          );
          if (worldPreset.mirrorXY) {
            // stored +Y up: half a turn about Z into the stage's −Y-up frame (see the preset)
            const lodFix = new Aholo.Object3D();
            lodFix.rotation.z = Math.PI;
            lodFix.add(lodSplat.container);
            scene.add(lodFix);
          } else {
            scene.add(lodSplat.container);
          }
          lodSplat.tick(camera);
          lodSplat.start();
        }

        setLoadProgress(100);
        setIsReady(true);

        // 5b. Lux3D drop-ins (feature: generate, then it lands in the world)
        let lastSpawnCheck = 0;
        const spawnLoaded = new Set<string>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const drops: { holder: any; floor: number; y: number; vy: number; bounces: number; settled: boolean; x: number; z: number; vx: number; vz: number; landed: boolean }[] = [];
        let stepAccum = 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const beans: { mesh: any; x: number; z: number; y: number; got: boolean }[] = [];
        let beansStamp = -1;
        const beanGeom = createPartGeometry("sphere", [0.085, 0.085, 0.085]);
        const dropAsset = async (asset: SpawnedAsset) => {
          try {
            const res = await fetch(asset.url, { signal });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const buf = await res.arrayBuffer();
            if (signal.aborted) return;
            const gltf = await Aholo.GLTFLoader.loadGLTF(buf, { textureLoader: Aholo.downloadTexture });
            if (signal.aborted) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const model = gltf.scene as any;
            const lo = [Infinity, Infinity, Infinity];
            const hi = [-Infinity, -Infinity, -Infinity];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const visit = (n: any) => {
              const bb = n?.geometry?.getBoundingBox?.();
              if (bb) {
                lo[0] = Math.min(lo[0], bb.min.x); lo[1] = Math.min(lo[1], bb.min.y); lo[2] = Math.min(lo[2], bb.min.z);
                hi[0] = Math.max(hi[0], bb.max.x); hi[1] = Math.max(hi[1], bb.max.y); hi[2] = Math.max(hi[2], bb.max.z);
              }
              (n?.children || []).forEach(visit);
            };
            visit(model);
            if (!Number.isFinite(lo[0])) {
              lo.splice(0, 3, -0.5, 0, -0.5);
              hi.splice(0, 3, 0.5, 1, 0.5);
            }
            const size = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) || 1;
            const k = 0.7 / size; // about 70 cm across: prop scale next to the actor
            model.scale.setScalar(k);
            model.position.set((-(lo[0] + hi[0]) / 2) * k, -lo[1] * k, (-(lo[2] + hi[2]) / 2) * k);
            const flip = new Aholo.Object3D();
            flip.rotation.x = Math.PI; // glTF Y-up → OpenCV -Y up
            flip.add(model);
            const holder = new Aholo.Object3D();
            holder.add(flip);
            const pp = poseStateRef.current;
            const fx = -Math.sin(pp.yaw);
            const fz = -Math.cos(pp.yaw);
            const side = ((drops.length % 3) - 1) * 0.65;
            const x = pp.px + fx * 1.6 + Math.cos(pp.yaw) * side;
            const z = pp.pz + fz * 1.6 - Math.sin(pp.yaw) * side;
            let floor = worldPreset.floorY ?? pp.py + 0.91;
            const eng = voxelCollisionRef.current;
            if (eng) {
              const fy = findFloorY((a, b, c) => eng.isWorldPointSolid(a, b, c), x, pp.py, z);
              if (fy !== null && Math.abs(fy - floor) < 0.6) floor = fy;
            }
            holder.position.set(x, floor - 1.8, z);
            holder.rotation.y = Math.atan2(fx, fz);
            scene.add(holder);
            drops.push({ holder, floor, y: floor - 1.8, vy: 0, bounces: 0, settled: false, x, z, vx: 0, vz: 0, landed: false });
            setToast({ text: asset.label, source: asset.source });
          } catch {
            // a failed drop must never break the stage
          }
        };

        // read-only-ish hook for automated end-to-end tests (bean, drop and pose state)
        (window as unknown as { __holorraStage?: unknown }).__holorraStage = {
          pose: () => poseStateRef.current,
          solid: (x: number, y: number, z: number) => voxelCollisionRef.current?.isWorldPointSolid(x, y, z) ?? null,
          hero: () => ({ x: heroRoot.position.x, z: heroRoot.position.z }),
          beans: () => beans.map((b) => ({ x: b.x, z: b.z, got: b.got })),
          drops: () => drops.map((d) => ({ x: d.x, z: d.z, y: d.y, floor: d.floor, landed: d.landed, settled: d.settled })),
        };

        // 6. 60fps Spatial Render & Simulation Loop
        let lastTime = performance.now();
        let frameCounter = 0;
        let fpsTimer = lastTime;
        let hudTimer = lastTime;
        let splineStartTime = 0;

        const tickFrame = (now: number) => {
          if (signal.aborted || !viewer) return;
          const dt = Math.min(0.1, (now - lastTime) * 0.001);
          lastTime = now;

          frameCounter++;
          if (now - fpsTimer >= 600) {
            setFps(Math.min(120, Math.round((frameCounter * 1000) / (now - fpsTimer))));
            frameCounter = 0;
            fpsTimer = now;
          }

          // A. Update Lux3D Hero Part-Split Explosion & Articulation Kinematics
          const explodeRatio = explodeRef.current * 0.01;
          const tSec = now * 0.001;
          const overrides = partOverridesRef.current;
          const activeSelectedPart = selectedPartRef.current;

          if (realAssembly && heroBlueprint.real) {
            const a: UrdfAssembly = realAssembly;
            for (const [name, fr] of Object.entries(a.frames)) {
              const b = realBasePos[name];
              if (b) fr.position.set(b[0], b[1], b[2]);
              fr.rotation.set(0, 0, 0);
            }
            // articulation toggle drives the real URDF joints (hood hinge, drawer slide)
            const sb = (now - playRef.current.interactAt) / 1000;
            const ease01 = (x: number) => x * x * (3 - 2 * x);
            const brewOpen =
              sb < 0 ? 0 : sb < 0.9 ? ease01(sb / 0.9) : sb < 4.6 ? 1 : sb < 5.5 ? 1 - ease01((sb - 4.6) / 0.9) : 0;
            const open =
              brewOpen > 0
                ? brewOpen
                : articulateRef.current && !playRef.current.active
                  ? 0.5 - 0.5 * Math.cos(tSec * 1.3)
                  : 0;
            for (const j of heroBlueprint.real.joints) a.setJoint(j.name, open * j.max);
            for (const spec of heroBlueprint.parts) {
              const fr = spec.link ? a.frames[spec.link] : null;
              if (!fr) continue;
              const ov = overrides[spec.id];
              fr.visible = ov ? ov.visible : true;
              fr.position.set(
                fr.position.x + spec.explodeDirection[0] * explodeRatio,
                fr.position.y + spec.explodeDirection[1] * explodeRatio,
                fr.position.z + spec.explodeDirection[2] * explodeRatio
              );
            }
          }

          for (const item of partMeshRecords) {
            const { spec, mesh, material } = item;
            const ov = overrides[spec.id];
            mesh.visible = ov ? ov.visible : true;

            // Color & selection highlight
            if (ov?.colorHex) {
              const hexNum = parseInt(ov.colorHex.replace("#", ""), 16);
              if (!Number.isNaN(hexNum)) {
                material.color.setHex(hexNum);
              }
            } else if (activeSelectedPart === spec.id) {
              const pulse = 0.5 + 0.5 * Math.sin(tSec * 6);
              material.color.setHex(pulse > 0.5 ? 0xffffff : spec.defaultColor);
            } else {
              material.color.setHex(spec.defaultColor);
            }

            // Compute exploded + articulated offset
            let ox = spec.baseOffset[0] + spec.explodeDirection[0] * explodeRatio;
            const oy = spec.baseOffset[1] + spec.explodeDirection[1] * explodeRatio;
            let oz = spec.baseOffset[2] + spec.explodeDirection[2] * explodeRatio;

            mesh.rotation.set(0, 0, 0);

            if (articulateRef.current) {
              const wave = 0.5 + 0.5 * Math.sin(tSec * 2.4);
              if (spec.articulationType === "hinge-x") {
                mesh.rotation.x = -spec.articulationRange * wave;
              } else if (spec.articulationType === "hinge-y") {
                mesh.rotation.y = spec.articulationRange * wave;
              } else if (spec.articulationType === "slide-z") {
                oz += spec.articulationRange * wave;
              } else if (spec.articulationType === "spin-y") {
                mesh.rotation.z = (tSec * 2.2) % (Math.PI * 2);
              }
            }

            // Subtle floating turntable rotation on heroRoot when in object showcase
            if (worldPreset.id === "sculpted-bear-studio") {
              ox += Math.sin(tSec * 0.6) * 2;
            }
            mesh.position.set(ox, oy, oz);
          }

          // B. Camera & WASD Walk / Spline Update
          const p = poseStateRef.current;
          const mode = cameraModeRef.current;

          if (isPlayingSplineRef.current && keyframesRef.current.length >= 2) {
            if (splineStartTime === 0) splineStartTime = now;
            const totalDurationMs =
              keyframesRef.current.reduce((acc, k) => acc + k.durationSec, 0) * 1000;
            const elapsed = now - splineStartTime;
            const norm = Math.min(1, elapsed / Math.max(1000, totalDurationMs));
            setSplineProgress(Math.round(norm * 100));

            const frame = evaluateCameraSpline(keyframesRef.current, norm);
            p.px = frame.position[0];
            p.py = frame.position[1];
            p.pz = frame.position[2];
            camera.position.set(p.px, p.py, p.pz);
            camera.lookAt(
              new Aholo.Vector3(frame.target[0], frame.target[1], frame.target[2])
            );

            if (norm >= 1) {
              splineStartTime = 0;
              onSplineFinish();
            }
          } else {
            splineStartTime = 0;

            // Process WASD / Arrow movement
            const moveSpeed = keysPressed.has("ShiftLeft") ? 4.8 : 2.3;
            let fwdInput = 0;
            let rightInput = 0;
            let upInput = 0;
            if (keysPressed.has("KeyW") || keysPressed.has("ArrowUp")) fwdInput += 1;
            if (keysPressed.has("KeyS") || keysPressed.has("ArrowDown")) fwdInput -= 1;
            if (keysPressed.has("KeyD") || keysPressed.has("ArrowRight")) rightInput += 1;
            if (keysPressed.has("KeyA") || keysPressed.has("ArrowLeft")) rightInput -= 1;
            const allowFly = mode === "orbit" || mode === "spline";
            if (allowFly && (keysPressed.has("KeyE") || keysPressed.has("Space"))) upInput -= 1; // -Y is up in OpenCV
            if (allowFly && keysPressed.has("KeyQ")) upInput += 1;
            fwdInput = Math.max(-1, Math.min(1, fwdInput + joyRef.current.y));
            rightInput = Math.max(-1, Math.min(1, rightInput + joyRef.current.x));
            if (now - playRef.current.interactAt < 2000) {
              fwdInput = 0;
              rightInput = 0;
            }

            const isMoving = Math.abs(fwdInput) > 0.12 || Math.abs(rightInput) > 0.12;
            if (isMoving || upInput !== 0) {
              const sinY = Math.sin(p.yaw);
              const cosY = Math.cos(p.yaw);
              const dx = (-sinY * fwdInput + cosY * rightInput) * moveSpeed * dt;
              const dz = (-cosY * fwdInput - sinY * rightInput) * moveSpeed * dt;
              const nextX = p.px + dx;
              const nextZ = p.pz + dz;

              if (
                (mode === "walk-first" || mode === "walk-third") &&
                voxelCollisionRef.current
              ) {
                const eng = voxelCollisionRef.current;
                // If the capsule already overlaps the grid where it stands (e.g. a spawn pose
                // within 24 cm of a wall), let it walk out instead of pinning it in place.
                const stuck = eng.filterHorizontalMove(p.px, p.py, p.pz, p.px, p.pz, 0.24).collided;
                if (stuck) {
                  p.px = nextX;
                  p.pz = nextZ;
                } else {
                  const resolved = eng.filterHorizontalMove(p.px, p.py, p.pz, nextX, nextZ, 0.24);
                  p.px = resolved.x;
                  p.pz = resolved.z;
                }
              } else {
                p.px = nextX;
                p.pz = nextZ;
              }
              p.py += upInput * moveSpeed * 0.65 * dt;
              if (mode === "walk-first" || mode === "walk-third") {
                if (playRef.current.active && !playRef.current.startAt && isMoving) {
                  playRef.current.startAt = now;
                  setMoved(true);
                }
                const fast = keysPressed.has("ShiftLeft") || Math.hypot(joyRef.current.x, joyRef.current.y) > 0.95;
                stepAccum += Math.hypot(dx, dz);
                if (stepAccum > (fast ? 0.95 : 0.62)) {
                  stepAccum = 0;
                  sfx.step(fast);
                }
              }
            }

            // Scene quest: proximity to the real prop, E to brew, F to cheer
            const q = playRef.current;
            if (heroBlueprint.real) {
              const dist = Math.hypot(heroRoot.position.x - p.px, heroRoot.position.z - p.pz);
              const near = (mode === "walk-third" || mode === "walk-first") && dist < 1.05;
              if (near !== q.near) {
                q.near = near;
                setPlay((st) => ({ ...st, near }));
              }
              if (near) advanceQuest(0);
            }
            if (actionRef.current.interact) {
              actionRef.current.interact = false;
              if (q.near && heroBlueprint.real && now - q.interactAt > 5600) {
                q.interactAt = now;
                sfx.brew();
                advanceQuest(1);
              }
            }
            if (actionRef.current.cheer) {
              actionRef.current.cheer = false;
              q.cheerAt = now;
              advanceQuest(3);
            }

            // Switch actor animation clip based on movement or Inspector selection
            const actorKeys = Object.keys(actorActions);
            if (actorKeys.length > 0) {
              const requestedAnim = activeAnimRef.current.toLowerCase();
              const wantWalk =
                isMoving ||
                requestedAnim.includes("walk") ||
                requestedAnim.includes("jog") ||
                requestedAnim.includes("sprint") ||
                requestedAnim.includes("dance") ||
                requestedAnim.includes("sword") ||
                requestedAnim.includes("jump");
              if (isMoving) q.emoteUntil = 0; // walking cancels an emote
              const forced =
                now - q.interactAt < 2000
                  ? "interact"
                  : now - q.cheerAt < 3000
                    ? "dance_loop"
                    : now < q.emoteUntil
                      ? q.emoteKey
                      : null;
              const sprint =
                keysPressed.has("ShiftLeft") || Math.hypot(joyRef.current.x, joyRef.current.y) > 0.95;
              const targetKey = actorConfig.clipMap
                ? forced && actorActions[forced]
                  ? forced
                  : isMoving
                  ? (sprint && actorActions["jog_fwd_loop"] ? "jog_fwd_loop" : actorKeys.find((k) => k.includes("walk"))) ||
                    actorKeys[0]
                  : actorActions[requestedAnim]
                    ? requestedAnim
                    : actorKeys.find((k) => k.includes("idle")) || actorKeys[0]
                : actorKeys.find((k) =>
                    wantWalk ? k.includes("walk") || k.includes("run") : k.includes("idle")
                  ) || actorKeys[0];

              if (targetKey && targetKey !== currentClipKey) {
                if (actorActions[currentClipKey]) {
                  actorActions[currentClipKey].active = false;
                  actorActions[currentClipKey].weight = 0;
                }
                actorActions[targetKey].reset(); // reset() deactivates; activate after
                actorActions[targetKey].active = true;
                actorActions[targetKey].weight = 1;
                currentClipKey = targetKey;
              }

              // Procedural root motion only for demo actors without real clips
              if (actorConfig.clipMap) {
                // real retargeted clips carry their own motion
              } else if (requestedAnim.includes("dance")) {
                actorRoot.rotation.y = tSec * 2.8;
              } else if (requestedAnim.includes("jump") || requestedAnim.includes("ninja")) {
                actorRoot.position.y =
                  heroBlueprint.worldPosition[1] + 0.35 - Math.abs(Math.sin(tSec * 4.5)) * 0.35;
              }
            }

            if (mode !== "walk-third" && actorConfig.upAxis === "y" && actorFloorRef.current) {
              actorRoot.position.y = actorFloorRef.current.y;
            }
            if (mode === "walk-third") {
              // Position actor at p.px, p.py, p.pz and place third-person camera behind
              if (actorConfig.upAxis === "y") {
                actorRoot.position.set(p.px, worldPreset.floorY ?? p.py + 0.91, p.pz);
                actorRoot.rotation.y =
                  now - q.interactAt < 2200
                    ? Math.atan2(-(heroRoot.position.x - p.px), -(heroRoot.position.z - p.pz))
                    : p.yaw;
              } else {
                actorRoot.position.set(p.px, p.py + 0.45, p.pz);
                actorRoot.rotation.y = p.yaw + Math.PI;
              }
              const camDist = p.distance * 0.65;
              const camX = p.px + Math.sin(p.yaw) * Math.cos(p.pitch) * camDist;
              const camY = p.py - Math.sin(p.pitch) * camDist - 0.35;
              const camZ = p.pz + Math.cos(p.yaw) * Math.cos(p.pitch) * camDist;
              camera.position.set(camX, camY, camZ);
              camera.lookAt(new Aholo.Vector3(p.px, p.py - 0.15, p.pz));
            } else {
              // First-person or Orbit look vector
              const forwardX = -Math.sin(p.yaw) * Math.cos(p.pitch);
              const forwardY = Math.sin(p.pitch);
              const forwardZ = -Math.cos(p.yaw) * Math.cos(p.pitch);
              camera.position.set(p.px, p.py, p.pz);
              camera.lookAt(
                new Aholo.Vector3(
                  p.px + forwardX * 3.0,
                  p.py + forwardY * 3.0,
                  p.pz + forwardZ * 3.0
                )
              );
            }
          }

          // Brew close-up: cut the camera to the machine for ~3 s, blending in and out
          if (heroBlueprint.real && !isPlayingSplineRef.current) {
            const ct = (now - playRef.current.interactAt) / 1000 - 0.25;
            if (ct > 0 && ct < 3.0) {
              const hx = heroRoot.position.x;
              const hz = heroRoot.position.z;
              const fy = heroRoot.position.y;
              const dx = camera.position.x - hx;
              const dz = camera.position.z - hz;
              const L = Math.hypot(dx, dz) || 1;
              const tx = hx + (dx / L) * 0.8 + (-dz / L) * 0.3;
              const tz = hz + (dz / L) * 0.8 + (dx / L) * 0.3;
              const ty = fy - 0.55; // 55 cm above the floor (-Y up)
              const sm = (x: number) => x * x * (3 - 2 * x);
              const w = ct < 0.35 ? sm(ct / 0.35) : ct > 2.65 ? sm((3.0 - ct) / 0.35) : 1;
              camera.position.set(
                camera.position.x + (tx - camera.position.x) * w,
                camera.position.y + (ty - camera.position.y) * w,
                camera.position.z + (tz - camera.position.z) * w
              );
              camera.lookAt(new Aholo.Vector3(hx, fy - 0.2, hz));
            }
          }

          // Lux3D drop-ins: load new results, then let them fall onto the floor and settle
          if (now - lastSpawnCheck > 400) {
            lastSpawnCheck = now;
            for (const a of spawnedRef.current) {
              if (!spawnLoaded.has(a.id)) {
                spawnLoaded.add(a.id);
                void dropAsset(a);
              }
            }
          }
          const walkingNow = mode === "walk-third" || mode === "walk-first";
          for (const d of drops) {
            // Kick: walking into a landed model sends it sliding and tumbling away from the actor
            if (d.landed && walkingNow) {
              const kx = d.x - p.px;
              const kz = d.z - p.pz;
              const kd = Math.hypot(kx, kz);
              if (kd < 0.55 && Math.hypot(d.vx, d.vz) < 0.6) {
                const fast = keysPressed.has("ShiftLeft") || Math.hypot(joyRef.current.x, joyRef.current.y) > 0.95;
                const sp = fast ? 5.2 : 3.2;
                const nx = kd > 0.01 ? kx / kd : -Math.sin(p.yaw);
                const nz = kd > 0.01 ? kz / kd : -Math.cos(p.yaw);
                d.vx = nx * sp;
                d.vz = nz * sp;
                d.vy = -(fast ? 3.4 : 2.2); // hop (−Y is up)
                d.bounces = 0;
                d.settled = false;
                sfx.kick();
              }
            }
            if (d.settled) continue;
            d.vy += 9.8 * dt; // +Y is down in the OpenCV world
            d.y += d.vy * dt;
            if (d.y >= d.floor) {
              d.y = d.floor;
              if (Math.abs(d.vy) > 0.8) sfx.thud(Math.min(1, Math.abs(d.vy) / 5));
              d.vy = -d.vy * 0.32;
              d.bounces += 1;
              d.landed = true;
              if (Math.abs(d.vy) < 0.25) d.vy = 0;
            }
            // horizontal slide with floor friction; walls in the voxel grid bounce it back
            const hs = Math.hypot(d.vx, d.vz);
            if (hs > 0) {
              let nx2 = d.x + d.vx * dt;
              let nz2 = d.z + d.vz * dt;
              const eng2 = voxelCollisionRef.current;
              if (eng2 && eng2.isWorldPointSolid(nx2, d.floor - 0.35, nz2)) {
                d.vx = -d.vx * 0.45;
                d.vz = -d.vz * 0.45;
                nx2 = d.x;
                nz2 = d.z;
              }
              d.x = nx2;
              d.z = nz2;
              const dec = (d.y >= d.floor - 0.01 ? 3.2 : 0.4) * dt;
              const ns = Math.max(0, hs - dec);
              d.vx *= ns / hs;
              d.vz *= ns / hs;
              d.holder.rotation.y += hs * dt * 2.2;
            } else if (!d.landed) {
              d.holder.rotation.y += dt * 1.6;
            }
            if (d.landed && d.vy === 0 && d.y >= d.floor && Math.hypot(d.vx, d.vz) < 0.05) {
              d.vx = 0;
              d.vz = 0;
              d.settled = true;
            }
            d.holder.position.set(d.x, d.y, d.z);
          }

          // Bean hunt: five coffee beans placed on reachable floor when a run starts
          const qb = playRef.current;
          if (qb.active && qb.runId !== beansStamp) {
            beansStamp = qb.runId;
            for (const b of beans) scene.remove(b.mesh);
            beans.length = 0;
            const eng3 = voxelCollisionRef.current;
            const baseFloor = worldPreset.floorY ?? p.py + 0.91;
            const sources: [number, number][] = [[p.px, p.pz]];
            const clear = (x0: number, z0: number, x1: number, z1: number) => {
              if (!eng3) return true;
              const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.12);
              let cx = x0;
              let cz = z0;
              for (let i = 1; i <= n; i++) {
                const tx2 = x0 + ((x1 - x0) * i) / n;
                const tz2 = z0 + ((z1 - z0) * i) / n;
                // a spawn pose can overlap the grid; the walker is let out of it, so the test is too
                const stuckHere = eng3.filterHorizontalMove(cx, p.py, cz, cx, cz, 0.24).collided;
                if (!stuckHere && eng3.filterHorizontalMove(cx, p.py, cz, tx2, tz2, 0.24).collided) return false;
                cx = tx2;
                cz = tz2;
              }
              return true;
            };
            const maxR = eng3 ? 6.5 : 2.4;
            for (let i = 0; i < 600 && beans.length < BEAN_COUNT; i++) {
              const ang = i * 2.39996 + 0.7;
              const r = 1.1 + ((i * 7) % 11) * ((maxR - 1.1) / 10);
              const origin = sources[i % sources.length];
              const x = origin[0] + Math.cos(ang) * r;
              const z = origin[1] + Math.sin(ang) * r;
              const area = worldPreset.beanArea;
              if (area && (x < area[0] || x > area[1] || z < area[2] || z > area[3])) continue;
              if (Math.hypot(x - heroRoot.position.x, z - heroRoot.position.z) < 0.9) continue;
              if (Math.hypot(x - p.px, z - p.pz) < 1.0) continue;
              if (beans.some((b) => Math.hypot(b.x - x, b.z - z) < (area ? 1.1 : 1.4))) continue;
              let fy = baseFloor;
              if (eng3) {
                const f = findFloorY((a, b, c) => eng3.isWorldPointSolid(a, b, c), x, p.py, z);
                if (f === null || Math.abs(f - baseFloor) > 0.25) continue;
                fy = f;
                if (!clear(origin[0], origin[1], x, z)) continue;
              }
              const mat = new Aholo.MeshPhongMaterial({ color: 0xff7a35, specular: 0xffffff, shininess: 90 });
              const mesh = new Aholo.Mesh(beanGeom, mat);
              mesh.scale.set(0.8, 1.25, 0.8);
              mesh.position.set(x, fy - 0.85, z);
              scene.add(mesh);
              beans.push({ mesh, x, z, y: fy - 0.85, got: false });
              sources.push([x, z]);
            }
          }
          if (!qb.active && beans.length) {
            for (const b of beans) scene.remove(b.mesh);
            beans.length = 0;
            beansStamp = -1;
          }
          for (let i = 0; i < beans.length; i++) {
            const b = beans[i];
            if (b.got) continue;
            b.mesh.rotation.y = tSec * 2.2 + i;
            b.mesh.position.y = b.y + Math.sin(tSec * 2.4 + i * 1.3) * 0.06;
            if (walkingNow && Math.hypot(b.x - p.px, b.z - p.pz) < 0.6) {
              b.got = true;
              scene.remove(b.mesh);
              qb.beans += 1;
              sfx.pickup(qb.beans);
              setBeansUi(qb.beans);
            }
          }

          if (lodSplat) {
            lodSplat.tick(camera);
          }

          viewer.render();

          if (now - hudTimer >= 250) {
            setHudPose({
              x: Number(p.px.toFixed(2)),
              y: Number(p.py.toFixed(2)),
              z: Number(p.pz.toFixed(2)),
              yaw: Number(((p.yaw * 180) / Math.PI).toFixed(0)),
            });
            hudTimer = now;
          }

          rafId = requestAnimationFrame(tickFrame);
        };

        rafId = requestAnimationFrame(tickFrame);
      } catch (err: unknown) {
        if (signal.aborted) return;
        // raw SDK error text stays as-is in both languages
        setErrorMsg(
          err instanceof Error
            ? { en: err.message, zh: err.message }
            : { en: "Failed to initialize @manycore/aholo-viewer", zh: "@manycore/aholo-viewer 初始化失败" }
        );
      }
    }

    void initAholoStage();

    const onResize = () => {
      if (viewer && !viewer.isDestroyed) {
        viewer.resize();
        viewer.render();
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      abortController.abort();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      container.removeEventListener("pointerdown", onMouseDown);
      window.removeEventListener("pointerup", onMouseUp);
      window.removeEventListener("pointercancel", onMouseUp);
      window.removeEventListener("pointermove", onMouseMove);
      container.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      try {
        if (lodSplat) lodSplat.destroy();
        if (primarySplat) primarySplat.destroy();
        if (envSplat) envSplat.destroy();
        if (viewer && !viewer.isDestroyed) viewer.destroy();
      } catch {
        // Ignore cleanup errors on fast scene switch
      }
      viewerInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldPreset.id, heroBlueprint.id, actorId]);

  const actor = AHOLO_RIGGED_ACTORS[actorId];
  const voxel = describeVoxelStatus(voxelStatus);

  return (
    <div
      ref={rootRef}
      className={`@container relative h-full w-full select-none overflow-hidden bg-canvas ${
        expanded === "window" ? "!fixed inset-0 z-[90] !h-[100dvh] !w-screen" : ""
      }`}
    >
      {/* @manycore/aholo-viewer WebGL2 canvas mount */}
      <div ref={containerRef} className="h-full w-full cursor-grab touch-none active:cursor-grabbing" />

      {/* Top-left: telemetry */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5 max-[900px]:left-2 max-[900px]:top-[58px]">
        <div className="flex h-7 items-center gap-2.5 rounded-[6px] border border-line bg-surface/95 px-2.5 font-mono text-[11px] text-ink-2 tabular max-[900px]:h-8 max-[600px]:hidden">
          <span className="flex items-center gap-1.5 text-ink">
            <span className={`dot ${isReady ? "dot-live" : ""}`} />
            {fps} fps
          </span>
          <HudDivider className="max-[600px]:hidden @max-[720px]:hidden" />
          <span className="max-[600px]:hidden @max-[720px]:hidden">{worldPreset.splatCountLabel}</span>
          <HudDivider className="max-[600px]:hidden @max-[900px]:hidden" />
          <span className={`max-[600px]:hidden @max-[900px]:hidden ${voxel.active ? "text-ink-2" : "text-ink-3"}`} title={tx(lang, voxel.title)}>
            <T en={voxel.label.en} zh={voxel.label.zh} />
          </span>
        </div>

        <div className="hide-mobile flex h-7 items-center gap-3 rounded-[6px] border border-line bg-surface/95 px-2.5 font-mono text-[11px] text-ink-3 tabular">
          <span>
            x <span className="text-ink-2">{hudPose.x.toFixed(2)}</span>
          </span>
          <span>
            y <span className="text-ink-2">{hudPose.y.toFixed(2)}</span>
          </span>
          <span>
            z <span className="text-ink-2">{hudPose.z.toFixed(2)}</span>
          </span>
          <span>
            yaw <span className="text-ink-2">{hudPose.yaw}°</span>
          </span>
          <HudDivider />
          <span className="flex items-center gap-1.5 font-sans text-[12px] text-ink-2">
            <Glyph name="rig" size={13} className="text-ink-3" />
            <T en={actor.name} zh={ACTOR_NAME_ZH[actor.id] ?? actor.name} />
            <span className="font-mono text-[11px] text-ink-3">{activeAnimationId}</span>
            {actorLoaded && (
              <Glyph name="check" size={12} className="text-ok" title={tx(lang, { en: "Actor loaded", zh: "角色已加载" })} />
            )}
          </span>
        </div>

        {play.active && !play.wrapped && (
          <div className="pointer-events-auto w-64 rounded-[6px] border border-line bg-surface/95 p-2.5 max-[900px]:w-auto max-[900px]:max-w-[calc(100vw-24px)]">
            <div className="flex items-center justify-between">
              <span className="label">
                <T en="Scene quest" zh="场景任务" />
              </span>
              <span className="font-mono text-[11px] text-ink-3 tabular">
                {Math.min(play.step, QUEST_STEPS.length)}/{QUEST_STEPS.length}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3 font-mono text-[12px] tabular">
              <span className="text-ink" aria-label={tx(lang, { en: "Run time", zh: "用时" })}>
                {formatRunTime(run ? run.ms : clock)}
              </span>
              <span className={`flex items-center gap-1 ${beansUi >= BEAN_COUNT ? "text-accent" : "text-ink-2"}`}>
                <Glyph name="bean" size={12} />
                {beansUi}/{BEAN_COUNT}
                <span className="font-sans text-[11px] text-ink-3 max-[900px]:hidden">
                  <T en="beans" zh="咖啡豆" />
                </span>
              </span>
            </div>
            <ol className="mt-2 space-y-1.5 max-[900px]:hidden">
              {QUEST_STEPS.map((q, i) => {
                const done = play.step > i;
                const current = play.step === i;
                return (
                  <li key={q.key} className="flex items-start gap-2">
                    <span
                      className={`mt-[2px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
                        done ? "border-accent bg-accent text-accent-ink" : current ? "border-accent" : "border-line-strong"
                      }`}
                    >
                      {done && <Glyph name="check" size={10} strokeWidth={2.4} />}
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-[12px] ${done ? "text-ink-3 line-through" : current ? "text-ink" : "text-ink-2"}`}>
                        <T en={q.title.en} zh={q.title.zh} />
                      </span>
                      {current && (
                        <span className="block font-mono text-[10.5px] text-ink-3">
                          <T en={q.hint.en} zh={q.hint.zh} />
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className="mt-1.5 text-[12px] text-ink min-[901px]:hidden">
              {play.step < QUEST_STEPS.length ? (
                <T en={QUEST_STEPS[play.step].title.en} zh={QUEST_STEPS[play.step].title.zh} />
              ) : (
                <T en="Scene wrapped" zh="本场杀青" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Top-right: camera mode + keyframe capture */}
      <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 max-[900px]:left-2 max-[900px]:right-2 max-[900px]:top-2 max-[900px]:flex-wrap max-[900px]:justify-end">
        <button
          type="button"
          onClick={play.active ? stopPlay : startPlay}
          title={
            play.active
              ? tx(lang, { en: "Leave play mode", zh: "退出游玩模式" })
              : tx(lang, {
                  en: "Play: walk the Lux3D actor through a short scene quest",
                  zh: "游玩：操控 Lux3D 角色完成一段简短的场景任务",
                })
          }
          aria-label={play.active ? tx(lang, { en: "Exit play mode", zh: "退出游玩" }) : tx(lang, { en: "Play", zh: "游玩" })}
          className={`btn btn-sm h-8 max-[900px]:h-10 max-[400px]:w-10 max-[400px]:justify-center max-[400px]:px-0 ${play.active ? "border-line bg-surface/95" : "btn-primary"}`}
        >
          <Glyph name={play.active ? "stop" : "play"} size={11} />
          <span className="max-[400px]:hidden">{play.active ? <T en="Exit" zh="退出" /> : <T en="Play" zh="游玩" />}</span>
        </button>
        <div
          role="radiogroup"
          aria-label={tx(lang, { en: "Camera mode", zh: "视角模式" })}
          className="flex h-8 items-center gap-0.5 rounded-[6px] border border-line bg-surface/95 p-0.5 max-[900px]:h-10"
        >
          {CAMERA_MODES.map((item) => {
            const active = cameraMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onCameraModeChange(item.id)}
                title={tx(lang, item.hint)}
                aria-label={tx(lang, item.label)}
                className={`flex h-7 items-center gap-1.5 rounded-[4px] px-2 text-[12px] transition-colors max-[900px]:h-9 max-[900px]:w-9 max-[900px]:justify-center max-[900px]:px-0 ${
                  active ? "bg-raised text-ink" : "text-ink-3 hover:text-ink"
                }`}
              >
                <Glyph name={item.glyph} size={14} className={active ? "text-accent" : ""} />
                <span className="hidden @min-[1180px]:inline">
                  <T en={item.label.en} zh={item.label.zh} />
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleTakeKeyframeSnapshot}
          title={tx(lang, { en: "Add the current view to the camera path", zh: "把当前视角加入镜头路径" })}
          aria-label={tx(lang, { en: "Add keyframe", zh: "添加关键帧" })}
          className="btn btn-sm h-8 border-line bg-surface/95 max-[900px]:h-10 max-[600px]:w-10 max-[600px]:px-0"
        >
          <Glyph name="keyframe" size={12} className="text-accent" />
          <span className="max-[600px]:hidden">
            <T en="Keyframe" zh="关键帧" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sfx.setSoundEnabled(!soundOn);
            setSoundOn(!soundOn);
          }}
          title={soundOn ? tx(lang, { en: "Sound on", zh: "声音已开启" }) : tx(lang, { en: "Sound off", zh: "声音已关闭" })}
          aria-label={soundOn ? tx(lang, { en: "Turn sound off", zh: "关闭声音" }) : tx(lang, { en: "Turn sound on", zh: "开启声音" })}
          aria-pressed={soundOn}
          className={`btn btn-sm btn-icon h-8 w-8 border-line bg-surface/95 max-[900px]:h-10 max-[900px]:w-10 ${soundOn ? "text-accent" : ""}`}
        >
          <Glyph name={soundOn ? "sound" : "mute"} size={14} />
        </button>

        <button
          type="button"
          onClick={handleResetCamera}
          title={tx(lang, { en: "Reset camera to the spawn pose", zh: "把视角重置到出生点" })}
          aria-label={tx(lang, { en: "Reset camera", zh: "重置视角" })}
          className="btn btn-sm btn-icon h-8 w-8 border-line bg-surface/95 max-[900px]:h-10 max-[900px]:w-10 max-[600px]:hidden"
        >
          <Glyph name="reset" size={14} />
        </button>

        <button
          type="button"
          onClick={toggleExpand}
          title={
            expanded === "off"
              ? tx(lang, { en: "Expand the stage", zh: "全屏显示舞台" })
              : tx(lang, { en: "Exit expanded view (Esc)", zh: "退出全屏（Esc）" })
          }
          aria-label={
            expanded === "off"
              ? tx(lang, { en: "Expand the stage", zh: "全屏显示舞台" })
              : tx(lang, { en: "Exit expanded view", zh: "退出全屏" })
          }
          aria-pressed={expanded !== "off"}
          className="btn btn-sm h-8 min-w-8 justify-center border-line bg-surface/95 px-2 max-[900px]:h-10 max-[900px]:min-w-10"
        >
          <Glyph name={expanded === "off" ? "expand" : "collapse"} size={14} />
          <span className="hidden @min-[760px]:inline">
            {expanded === "off" ? <T en="Expand" zh="全屏" /> : <T en="Exit" zh="退出" />}
          </span>
        </button>
      </div>

      {/* Bottom: part quick-select + control hints */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-end justify-between gap-2 max-[900px]:bottom-2 max-[900px]:left-2 max-[900px]:right-2">
        <div
          className={`pointer-events-auto flex h-8 max-w-full items-center gap-1 overflow-x-auto rounded-[6px] border border-line bg-surface/95 px-1.5 max-[900px]:h-11 ${
            touchUi && (cameraMode === "walk-third" || cameraMode === "walk-first") ? "hidden" : ""
          }`}
        >
          <span className="label px-1 max-[600px]:hidden">
            <T en="Parts" zh="部件" />
          </span>
          <button
            type="button"
            onClick={() => onSelectPart(null)}
            className={`h-6 shrink-0 rounded-[4px] border px-1.5 font-mono text-[11px] transition-colors max-[900px]:h-9 max-[900px]:px-2.5 ${
              selectedPartId === null ? "border-accent text-ink" : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            <T en="All" zh="全部" />
          </button>
          {heroBlueprint.parts.map((part, idx) => {
            const active = selectedPartId === part.id;
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => onSelectPart(active ? null : part.id)}
                title={part.name}
                className={`flex h-6 shrink-0 items-center gap-1 rounded-[4px] border px-1.5 font-mono text-[11px] tabular transition-colors max-[900px]:h-9 max-[900px]:px-2 ${
                  active ? "border-accent text-ink" : "border-transparent text-ink-3 hover:text-ink"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-[2px]"
                  style={{ backgroundColor: partOverrides[part.id]?.colorHex || part.defaultColorHex }}
                />
                {String(idx + 1).padStart(2, "0")}
              </button>
            );
          })}
        </div>

        <div className="hide-mobile hidden h-8 items-center gap-3 rounded-[6px] border border-line bg-surface/95 px-2.5 text-[11px] text-ink-3 md:flex">
          <span className="flex items-center gap-1">
            <span className="kbd">
              <T en="Drag" zh="拖动" />
            </span>{" "}
            <T en="look" zh="环视" />
          </span>
          <span className="flex items-center gap-1">
            <span className="kbd">W</span>
            <span className="kbd">A</span>
            <span className="kbd">S</span>
            <span className="kbd">D</span> <T en="move" zh="移动" />
          </span>
          {cameraMode === "walk-third" || cameraMode === "walk-first" ? (
            <>
              <span className="flex items-center gap-1">
                <span className="kbd">Shift</span> <T en="jog" zh="小跑" />
              </span>
              <span className="flex items-center gap-1">
                <span className="kbd">E</span> <T en="brew" zh="冲咖啡" />
              </span>
              <span className="flex items-center gap-1">
                <span className="kbd">K</span> <T en="frame" zh="取景" />
              </span>
              <span className="flex items-center gap-1">
                <span className="kbd">F</span> <T en="cheer" zh="欢呼" />
              </span>
              <span className="flex items-center gap-1">
                <span className="kbd">1</span>–<span className="kbd">8</span> <T en="emotes" zh="动作" />
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="kbd">Q</span>
                <span className="kbd">E</span> <T en="height" zh="升降" />
              </span>
              <span className="flex items-center gap-1">
                <span className="kbd">
                  <T en="Scroll" zh="滚轮" />
                </span>{" "}
                <T en="zoom" zh="缩放" />
              </span>
            </>
          )}
        </div>
      </div>

      {/* Camera path playback indicator */}
      {isPlayingSpline && (
        <div className="absolute bottom-14 left-1/2 z-20 flex h-7 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[6px] border border-line bg-surface/95 px-2.5 text-[12px] text-ink max-[900px]:bottom-16">
          <Glyph name="record" size={12} className="text-accent" />
          <T en="Playing camera path" zh="正在播放镜头路径" />
          <span className="font-mono text-[11px] text-ink-3 tabular">{splineProgress}%</span>
          <span className="relative h-[2px] w-24 overflow-hidden rounded bg-line">
            <span className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${splineProgress}%` }} />
          </span>
        </div>
      )}

      {/* Start of a run: say how to move, until the first step */}
      {play.active && !play.wrapped && !moved && isReady && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[min(340px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[8px] border border-accent bg-surface/95 p-4 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
            <T en="You are the actor" zh="你就是这个角色" />
          </div>
          {touchUi ? (
            <div className="mt-2 text-[15px] text-ink">
              <T en="Push the joystick to walk. Drag the scene to look." zh="推动摇杆行走，拖动画面环顾四周。" />
            </div>
          ) : (
            <>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {["W", "A", "S", "D"].map((k) => (
                  <span key={k} className="kbd !h-7 !min-w-7 !text-[13px]">
                    {k}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-[15px] text-ink">
                <T en="Hold W to walk. Drag the scene to look around." zh="按住 W 行走，拖动画面环顾四周。" />
              </div>
            </>
          )}
          <div className="mt-1.5 text-[12px] text-ink-3">
            <T en="The clock starts with your first step." zh="迈出第一步时开始计时。" />
          </div>
        </div>
      )}

      {/* Emote just triggered (keys 1–8) */}
      {emoteLabel && (
        <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 flex h-8 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[6px] border border-line bg-surface/95 px-3 font-mono text-[12px] text-ink">
          <Glyph name="rig" size={13} className="text-accent" />
          {emoteLabel}
        </div>
      )}

      {/* Brew prompt when the actor is next to the real machine */}
      {play.near && !touchUi && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 z-20 flex h-9 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[6px] border border-accent bg-surface/95 px-3 text-[13px] text-ink">
          <span className="kbd">E</span> <T en="Brew a coffee" zh="冲一杯咖啡" />
        </div>
      )}

      {/* Quest complete */}
      {play.wrapped && (
        <div className="absolute left-1/2 top-[88px] z-20 w-[min(360px,calc(100%-24px))] -translate-x-1/2 rounded-[8px] border border-line bg-surface/95 p-4 text-center max-[900px]:top-14">
          <div className="font-mono text-[11px] text-accent">
            <T en="SCENE WRAPPED" zh="本场杀青" />
          </div>
          {run && (
            <div className="mt-1.5 flex items-baseline justify-center gap-3">
              <span className="font-mono text-[28px] leading-none text-ink tabular">{formatRunTime(run.ms)}</span>
              <span className={`flex items-center gap-1 font-mono text-[13px] ${run.beans >= BEAN_COUNT ? "text-accent" : "text-ink-2"}`}>
                <Glyph name="bean" size={13} />
                {run.beans}/{BEAN_COUNT}
              </span>
            </div>
          )}
          <div className="mt-1.5 text-[12px] text-ink-3">
            {run && run.isBest ? (
              <span className="text-accent">
                <T en="New best time with all five beans." zh="集齐五颗咖啡豆，刷新最佳成绩。" />
              </span>
            ) : run && run.beans < BEAN_COUNT ? (
              <T
                en={`Find all ${BEAN_COUNT} beans for a ranked time.`}
                zh={`集齐 ${BEAN_COUNT} 颗咖啡豆才计入最佳成绩。`}
              />
            ) : run && run.best ? (
              <T en={`Best: ${formatRunTime(run.best)}`} zh={`最佳成绩：${formatRunTime(run.best)}`} />
            ) : (
              <T en="Walked, brewed, framed and celebrated." zh="走位、冲咖啡、取景、庆祝，全部完成。" />
            )}
          </div>
          {card && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card} alt={tx(lang, { en: "Your finish card", zh: "你的成绩卡" })} className="mt-3 w-full rounded-[4px] border border-line" />
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {card && (
              <a href={card} download="holorra-scene-wrapped.jpg" className="btn btn-sm">
                <Glyph name="download" size={12} />
                <T en="Save card" zh="保存成绩卡" />
              </a>
            )}
            {run && (
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  lang === "zh"
                    ? `我在 AI 生成的 3D 世界里冲了一杯咖啡：${formatRunTime(run.ms)}，咖啡豆 ${run.beans}/${BEAN_COUNT}。你来试试？ #Manycorehackathon`
                    : `I brewed a coffee inside a generated 3D world in ${formatRunTime(run.ms)} with ${run.beans}/${BEAN_COUNT} beans. Beat my time? #Manycorehackathon`
                )}&url=${encodeURIComponent("https://holorra.xyz/studio?play=1")}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm"
              >
                <Glyph name="external" size={12} />
                <T en="Post on X" zh="发到 X" />
              </a>
            )}
            <button type="button" className="btn btn-sm btn-primary" onClick={startPlay}>
              <T en="Play again" zh="再玩一次" />
            </button>
            <button type="button" className="btn btn-sm" onClick={stopPlay}>
              <T en="Done" zh="完成" />
            </button>
          </div>
        </div>
      )}

      {/* Lux3D jobs still generating */}
      {pendingJobs.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-14 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5 max-[900px]:top-16">
          {pendingJobs.slice(0, 3).map((j) => {
            const secs = Math.max(0, Math.floor((nowTick - j.startedAt) / 1000));
            return (
              <div
                key={j.taskId}
                className="flex h-8 max-w-[min(420px,calc(100vw-24px))] items-center gap-2 rounded-[6px] border border-line bg-surface/95 px-2.5 text-[12px]"
              >
                {j.status === "failed" ? (
                  <Glyph name="cross" size={12} className="text-err" />
                ) : (
                  <Glyph name="loader" size={12} className="text-accent" />
                )}
                <span className="truncate text-ink">{j.label}</span>
                <span className="shrink-0 font-mono text-[11px] text-ink-3 tabular">
                  {j.status === "failed" ? (
                    <T en="failed" zh="失败" />
                  ) : (
                    `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* A new Lux3D model just landed */}
      {toast && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 z-20 flex h-9 max-w-[min(480px,calc(100vw-24px))] -translate-x-1/2 items-center gap-2 rounded-[6px] border border-line bg-surface/95 px-3 text-[12.5px] max-[900px]:bottom-20">
          <Glyph name="mesh" size={14} className="text-accent" />
          <span className="shrink-0 text-ink">
            <T en="Dropped into the scene" zh="已投放到场景" />
          </span>
          <span className="truncate text-ink-2">{toast.text}</span>
          <span className="chip shrink-0">
            {toast.source === "live" ? <T en="live" zh="实时" /> : <T en="cached" zh="缓存结果" />}
          </span>
        </div>
      )}

      {/* Touch: joystick + actions while walking */}
      {touchUi && (cameraMode === "walk-third" || cameraMode === "walk-first") && (
        <>
          <div
            className="absolute bottom-4 left-4 z-30 h-28 w-28 touch-none rounded-full border border-line-strong bg-surface/70"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              const r = e.currentTarget.getBoundingClientRect();
              const move = (cx: number, cy: number) => {
                const R = r.width / 2 - 14;
                let dx = cx - (r.left + r.width / 2);
                let dy = cy - (r.top + r.height / 2);
                const len = Math.hypot(dx, dy);
                if (len > R) {
                  dx = (dx / len) * R;
                  dy = (dy / len) * R;
                }
                joyRef.current = { x: dx / R, y: -dy / R };
                if (joyKnobRef.current) joyKnobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
              };
              move(e.clientX, e.clientY);
              const el = e.currentTarget;
              const onMove = (ev: PointerEvent) => move(ev.clientX, ev.clientY);
              const onUp = () => {
                joyRef.current = { x: 0, y: 0 };
                if (joyKnobRef.current) joyKnobRef.current.style.transform = "translate(0px, 0px)";
                el.removeEventListener("pointermove", onMove);
                el.removeEventListener("pointerup", onUp);
                el.removeEventListener("pointercancel", onUp);
              };
              el.addEventListener("pointermove", onMove);
              el.addEventListener("pointerup", onUp);
              el.addEventListener("pointercancel", onUp);
            }}
            aria-label={tx(lang, { en: "Move", zh: "移动" })}
            role="slider"
          >
            <div
              ref={joyKnobRef}
              className="pointer-events-none absolute left-1/2 top-1/2 -ml-6 -mt-6 h-12 w-12 rounded-full border border-accent bg-raised"
            />
          </div>
          <div className="absolute bottom-4 right-4 z-30 flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={() => (actionRef.current.interact = true)}
              className={`btn h-14 w-14 rounded-full p-0 text-[12px] ${play.near ? "btn-primary" : ""}`}
              aria-label={tx(lang, { en: "Brew", zh: "冲咖啡" })}
            >
              <T en="Brew" zh="冲咖啡" />
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTakeKeyframeSnapshot}
                className="btn h-11 w-11 rounded-full p-0"
                aria-label={tx(lang, { en: "Frame the shot", zh: "构图取景" })}
              >
                <Glyph name="keyframe" size={14} className="text-accent" />
              </button>
              <button
                type="button"
                onClick={() => (actionRef.current.cheer = true)}
                className="btn h-11 w-11 rounded-full p-0 text-[11px]"
                aria-label={tx(lang, { en: "Celebrate", zh: "庆祝" })}
              >
                <T en="Cheer" zh="欢呼" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Loading overlay while the splat streams */}
      {!isReady && !errorMsg && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-canvas">
          <div className="w-80 max-w-[calc(100%-24px)] rounded-[8px] border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="label">
                <T en="Loading world" zh="正在加载世界" />
              </span>
              <span className="font-mono text-[11px] text-ink-3 tabular">{loadProgress}%</span>
            </div>
            <div className="mt-2 text-[13px] text-ink">
              <T en={worldPreset.title} zh={worldPreset.titleZh ?? worldPreset.title} />
            </div>
            <div className="mt-0.5 truncate text-[12px] text-ink-3" title={tx(lang, loadingText)}>
              <T en={loadingText.en} zh={loadingText.zh} />
            </div>
            <div className="mt-3 h-[2px] w-full overflow-hidden rounded bg-line">
              <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${loadProgress}%` }} />
            </div>
            <div className="mt-2 font-mono text-[10.5px] text-ink-3">
              <T en="Streaming from the Manycore CDN" zh="从 Manycore CDN 流式加载" />
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-canvas/95 p-6">
          <div className="w-full max-w-md rounded-[8px] border border-line bg-surface p-4">
            <div className="flex items-center gap-2 text-[13px] font-medium text-err">
              <Glyph name="info" size={15} />
              <T en="The stage could not start" zh="舞台无法启动" />
            </div>
            <p className="mt-2 font-mono text-[12px] leading-relaxed text-ink-2">
              <T en={errorMsg.en} zh={errorMsg.zh} />
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={handleResetCamera} className="btn btn-sm btn-ghost">
                <T en="Reset camera" zh="重置视角" />
              </button>
              <button type="button" onClick={() => window.location.reload()} className="btn btn-sm">
                <Glyph name="refresh" size={13} />
                <T en="Reload" zh="重新加载" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HudDivider({ className = "" }: { className?: string }) {
  return <span className={`h-3 w-px bg-line ${className}`} aria-hidden="true" />;
}
