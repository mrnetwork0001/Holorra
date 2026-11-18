"use client";

import type { ActorId } from "@/config/aholo-presets";
import React, { useEffect, useRef, useState, useCallback } from "react";
import type {
  AholoWorldPreset,
  Lux3dHeroAssetBlueprint,
} from "@/config/aholo-presets";
import { AHOLO_RIGGED_ACTORS } from "@/config/aholo-presets";
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

const CAMERA_MODES: { id: StageCameraMode; label: string; glyph: GlyphName; hint: string }[] = [
  { id: "orbit", label: "Orbit", glyph: "orbit", hint: "Orbit the stage" },
  { id: "walk-third", label: "Third person", glyph: "walk", hint: "Walk the actor with WASD" },
  { id: "walk-first", label: "First person", glyph: "eye", hint: "First-person walk with voxel collision" },
  { id: "spline", label: "Path", glyph: "spline", hint: "Camera path view" },
];

/** Display-only: shorten the voxel status strings set by the loader. */
function describeVoxelStatus(status: string): { label: string; active: boolean } {
  if (status.startsWith("Voxel Octree Active")) {
    const res = status.match(/@\s*([\d.]+)\s*m/);
    const cm = res ? Math.round(parseFloat(res[1]) * 100) : null;
    return { label: cm ? `collision ${cm} cm` : "collision on", active: true };
  }
  if (/Streaming|Loading/.test(status)) return { label: "collision loading", active: false };
  return { label: "no collision", active: false };
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
}: AholoHybridStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Status & HUD state
  const [loadingText, setLoadingText] = useState<string>("Initializing @manycore/aholo-viewer WebGL2 Engine...");
  const [loadProgress, setLoadProgress] = useState<number>(15);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
      }
    } catch {
      snapshotDataUrl = undefined;
    }

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
  }, [onCaptureKeyframe]);

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
    setLoadingText(`Booting @manycore/aholo-viewer (${worldPreset.title})...`);

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
              floorY: worldPreset.pose.py + 0.91,
              yawDeg: undefined,
            }
          : null;
        let realAssembly: UrdfAssembly | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const realBasePos: Record<string, [number, number, number]> = {};
        if (heroBlueprint.real && realPlacement) {
          heroRoot.position.set(realPlacement.at[0], realPlacement.floorY, realPlacement.at[1]);
          heroRoot.scale.setScalar(1);
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
              voxelCollisionRef.current = engine;
              const solid = (x: number, y: number, z: number) => engine.isWorldPointSolid(x, y, z);
              if (realPlacement) {
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
              const ax = worldPreset.pose.px + spawnFwd[0] * 2.6 - spawnRight[0] * 0.15;
              const az = worldPreset.pose.pz + spawnFwd[1] * 2.6 - spawnRight[1] * 0.15;
              actorFloorRef.current = actorFloorRef.current ?? { x: ax, z: az, y: worldPreset.pose.py + 0.91 };
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
          setLoadingText(`Streaming 3DGS Splat (${worldPreset.splatCountLabel})...`);
          const ft =
            Aholo.SplatLoader.detectSplatFileType(worldPreset.primarySplatUrl, new Uint8Array()) ??
            Aholo.SplatLoader.SplatFileType.SPZ;
          const splatData = await Aholo.SplatLoader.parseSplatData(
            ft,
            worldPreset.primarySplatUrl,
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
          scene.add(primarySplat);
        } else if (worldPreset.splatMode === "lod" && worldPreset.lodMetaUrl) {
          if (worldPreset.envSplatUrl) {
            setLoadingText("Loading 3DGS Sky & Environment Radiance Layer...");
            const envFt =
              Aholo.SplatLoader.detectSplatFileType(worldPreset.envSplatUrl, new Uint8Array()) ??
              Aholo.SplatLoader.SplatFileType.PLY;
            const envData = await Aholo.SplatLoader.parseSplatData(
              envFt,
              worldPreset.envSplatUrl,
              Aholo.SplatLoader.SplatPackType.Compressed,
              { signal }
            );
            if (signal.aborted) return;
            envSplat = await Aholo.SplatUtils.createSplat(envData);
            if (signal.aborted) {
              envSplat.destroy();
              return;
            }
            scene.add(envSplat);
          }

          setLoadProgress(60);
          setLoadingText(`Connecting Chunk-LOD 3DGS Stream (${worldPreset.splatCountLabel})...`);
          const metaRes = await fetch(worldPreset.lodMetaUrl, { signal });
          const metaJson = await metaRes.json();
          if (signal.aborted) return;

          lodSplat = new Aholo.SplatUtils.LodSplat(
            metaJson,
            {
              minLevel: Math.max(0, (metaJson.levels || 4) - 1),
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
          scene.add(lodSplat.container);
          lodSplat.tick(camera);
          lodSplat.start();
        }

        setLoadProgress(100);
        setIsReady(true);

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
            const open = articulateRef.current ? 0.5 - 0.5 * Math.cos(tSec * 1.3) : 0;
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
            if (keysPressed.has("KeyE") || keysPressed.has("Space")) upInput -= 1; // -Y is up in OpenCV
            if (keysPressed.has("KeyQ")) upInput += 1;

            const isMoving = fwdInput !== 0 || rightInput !== 0;
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
                const resolved = voxelCollisionRef.current.filterHorizontalMove(
                  p.px,
                  p.py,
                  p.pz,
                  nextX,
                  nextZ,
                  0.24
                );
                p.px = resolved.x;
                p.pz = resolved.z;
              } else {
                p.px = nextX;
                p.pz = nextZ;
              }
              p.py += upInput * moveSpeed * 0.65 * dt;
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
              const targetKey = actorConfig.clipMap
                ? isMoving
                  ? actorKeys.find((k) => k.includes("walk")) || actorKeys[0]
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
                actorRoot.position.set(p.px, p.py + 0.91, p.pz);
                actorRoot.rotation.y = p.yaw;
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
        setErrorMsg(
          err instanceof Error ? err.message : "Failed to initialize @manycore/aholo-viewer"
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
    <div className="relative h-full w-full select-none overflow-hidden bg-canvas">
      {/* @manycore/aholo-viewer WebGL2 canvas mount */}
      <div ref={containerRef} className="h-full w-full cursor-grab touch-none active:cursor-grabbing" />

      {/* Top-left: telemetry */}
      <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5 max-[900px]:left-2 max-[900px]:top-2">
        <div className="flex h-7 items-center gap-2.5 rounded-[6px] border border-line bg-surface/95 px-2.5 font-mono text-[11px] text-ink-2 tabular max-[900px]:h-10">
          <span className="flex items-center gap-1.5 text-ink">
            <span className={`dot ${isReady ? "dot-live" : ""}`} />
            {fps} fps
          </span>
          <HudDivider className="max-[600px]:hidden" />
          <span className="max-[600px]:hidden">{worldPreset.splatCountLabel}</span>
          <HudDivider className="max-[600px]:hidden" />
          <span className={`max-[600px]:hidden ${voxel.active ? "text-ink-2" : "text-ink-3"}`} title={voxelStatus}>
            {voxel.label}
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
            {actor.name}
            <span className="font-mono text-[11px] text-ink-3">{activeAnimationId}</span>
            {actorLoaded && <Glyph name="check" size={12} className="text-ok" title="Actor loaded" />}
          </span>
        </div>
      </div>

      {/* Top-right: camera mode + keyframe capture */}
      <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 max-[900px]:right-2 max-[900px]:top-2">
        <div
          role="radiogroup"
          aria-label="Camera mode"
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
                title={item.hint}
                aria-label={item.label}
                className={`flex h-7 items-center gap-1.5 rounded-[4px] px-2 text-[12px] transition-colors max-[900px]:h-9 max-[900px]:w-9 max-[900px]:justify-center max-[900px]:px-0 ${
                  active ? "bg-raised text-ink" : "text-ink-3 hover:text-ink"
                }`}
              >
                <Glyph name={item.glyph} size={14} className={active ? "text-accent" : ""} />
                <span className="hidden 2xl:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleTakeKeyframeSnapshot}
          title="Add the current view to the camera path"
          aria-label="Add keyframe"
          className="btn btn-sm h-8 border-line bg-surface/95 max-[900px]:h-10 max-[600px]:w-10 max-[600px]:px-0"
        >
          <Glyph name="keyframe" size={12} className="text-accent" />
          <span className="max-[600px]:hidden">Keyframe</span>
        </button>

        <button
          type="button"
          onClick={handleResetCamera}
          title="Reset camera to the spawn pose"
          aria-label="Reset camera"
          className="btn btn-sm btn-icon h-8 w-8 border-line bg-surface/95 max-[900px]:h-10 max-[900px]:w-10"
        >
          <Glyph name="reset" size={14} />
        </button>
      </div>

      {/* Bottom: part quick-select + control hints */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-end justify-between gap-2 max-[900px]:bottom-2 max-[900px]:left-2 max-[900px]:right-2">
        <div className="pointer-events-auto flex h-8 max-w-full items-center gap-1 overflow-x-auto rounded-[6px] border border-line bg-surface/95 px-1.5 max-[900px]:h-11">
          <span className="label px-1 max-[600px]:hidden">Parts</span>
          <button
            type="button"
            onClick={() => onSelectPart(null)}
            className={`h-6 shrink-0 rounded-[4px] border px-1.5 font-mono text-[11px] transition-colors max-[900px]:h-9 max-[900px]:px-2.5 ${
              selectedPartId === null ? "border-accent text-ink" : "border-transparent text-ink-3 hover:text-ink"
            }`}
          >
            All
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
            <span className="kbd">Drag</span> look
          </span>
          <span className="flex items-center gap-1">
            <span className="kbd">W</span>
            <span className="kbd">A</span>
            <span className="kbd">S</span>
            <span className="kbd">D</span> move
          </span>
          <span className="flex items-center gap-1">
            <span className="kbd">Q</span>
            <span className="kbd">E</span> height
          </span>
          <span className="flex items-center gap-1">
            <span className="kbd">Scroll</span> zoom
          </span>
        </div>
      </div>

      {/* Camera path playback indicator */}
      {isPlayingSpline && (
        <div className="absolute bottom-14 left-1/2 z-20 flex h-7 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[6px] border border-line bg-surface/95 px-2.5 text-[12px] text-ink max-[900px]:bottom-16">
          <Glyph name="record" size={12} className="text-accent" />
          Playing camera path
          <span className="font-mono text-[11px] text-ink-3 tabular">{splineProgress}%</span>
          <span className="relative h-[2px] w-24 overflow-hidden rounded bg-line">
            <span className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${splineProgress}%` }} />
          </span>
        </div>
      )}

      {/* Loading overlay while the splat streams */}
      {!isReady && !errorMsg && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-canvas">
          <div className="w-80 max-w-[calc(100%-24px)] rounded-[8px] border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <span className="label">Loading world</span>
              <span className="font-mono text-[11px] text-ink-3 tabular">{loadProgress}%</span>
            </div>
            <div className="mt-2 text-[13px] text-ink">{worldPreset.title}</div>
            <div className="mt-0.5 truncate text-[12px] text-ink-3" title={loadingText}>
              {loadingText}
            </div>
            <div className="mt-3 h-[2px] w-full overflow-hidden rounded bg-line">
              <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${loadProgress}%` }} />
            </div>
            <div className="mt-2 font-mono text-[10.5px] text-ink-3">Streaming from the Manycore CDN</div>
          </div>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-canvas/95 p-6">
          <div className="w-full max-w-md rounded-[8px] border border-line bg-surface p-4">
            <div className="flex items-center gap-2 text-[13px] font-medium text-err">
              <Glyph name="info" size={15} />
              The stage could not start
            </div>
            <p className="mt-2 font-mono text-[12px] leading-relaxed text-ink-2">{errorMsg}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={handleResetCamera} className="btn btn-sm btn-ghost">
                Reset camera
              </button>
              <button type="button" onClick={() => window.location.reload()} className="btn btn-sm">
                <Glyph name="refresh" size={13} />
                Reload
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
