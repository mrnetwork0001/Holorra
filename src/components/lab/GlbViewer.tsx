"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Minimal @manycore/aholo-viewer GLB inspector used by /lab.
 * Loads one GLB, frames it from known bounds, turntables it, plays its
 * animation clips (articulation / retargeted clips, incl. skinned meshes),
 * and can explode multi-mesh files (Lux3D part split) along part centroids.
 */
export interface GlbViewerProps {
  src: string;
  /** bounding box of the model in its own units (from the GLB accessors) */
  bounds: { min: [number, number, number]; max: [number, number, number] };
  autoRotate?: boolean;
  /** 0–1, separates mesh nodes radially from the model centre */
  explode?: number;
  /** play the clip whose name contains this (case-insensitive); "first" plays clip 0 */
  clip?: string | "first" | null;
  className?: string;
  /** measured centre of each mesh node (file order); drives explode directions when given */
  partCenters?: [number, number, number][];
  onStats?: (s: { meshes: number; clips: string[] }) => void;
}

export default function GlbViewer({
  src,
  bounds,
  autoRotate = true,
  explode = 0,
  clip = null,
  className = "",
  partCenters,
  onStats,
}: GlbViewerProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const explodeRef = useRef(explode);
  explodeRef.current = explode;
  const rotateRef = useRef(autoRotate);
  rotateRef.current = autoRotate;
  const clipRef = useRef<string | null>(clip);
  clipRef.current = clip;
  const selectClipRef = useRef<((name: string | null) => void) | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [progress, setProgress] = useState(0);

  // switch clips in place once the model is loaded
  useEffect(() => {
    selectClipRef.current?.(clip);
  }, [clip]);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const abort = new AbortController();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let viewer: any = null;
    let raf = 0;
    let visible = true;
    let started = false;

    const start = async () => {
      started = true;
      try {
        const Aholo = await import("@manycore/aholo-viewer");
        if (abort.signal.aborted) return;
        host.innerHTML = "";
        viewer = Aholo.createViewer(`glb-${Math.random().toString(36).slice(2)}`, host, { antialiasing: true, alpha: false });
        if (viewer.config?.coordinateSystem?.enabled) viewer.config.coordinateSystem.enabled.set(false);

        const size = [bounds.max[0] - bounds.min[0], bounds.max[1] - bounds.min[1], bounds.max[2] - bounds.min[2]];
        const center = [(bounds.max[0] + bounds.min[0]) / 2, (bounds.max[1] + bounds.min[1]) / 2, (bounds.max[2] + bounds.min[2]) / 2];
        const radius = Math.max(size[0], size[1], size[2]) * 0.62;

        const rect = host.getBoundingClientRect();
        const camera = new Aholo.PerspectiveCamera(30, Math.max(0.3, rect.width / Math.max(1, rect.height)), radius * 0.05, radius * 60);
        camera.up.set(0, 1, 0);
        const dist = (radius / Math.tan((30 * Math.PI) / 360)) * 1.55;
        camera.position.set(center[0] + dist * 0.55, center[1] + dist * 0.28, center[2] + dist * 0.8);
        camera.lookAt(new Aholo.Vector3(center[0], center[1], center[2]));
        viewer.setCamera(camera);
        Aholo.setViewerConfig(viewer, {
          pipeline: {
            Background: { background: { active: Aholo.BackgroundMode.BasicBackground, basic: { color: new Aholo.Color(0.043, 0.043, 0.039) } }, ground: { enabled: false } },
            TAA: { enabled: false },
          },
        });

        const scene = viewer.getScene();
        scene.add(new Aholo.AmbientLight(0xffffff, 0.38));
        const key = new Aholo.DirectionalLight(0xffffff, 1.05);
        key.position.set(2, 3, 2.5);
        scene.add(key);
        const rim = new Aholo.DirectionalLight(0xffd9c4, 0.45);
        rim.position.set(-2.5, 1.5, -2);
        scene.add(rim);

        // fetch with progress
        const res = await fetch(src, { signal: abort.signal });
        const total = Number(res.headers.get("content-length")) || 0;
        const reader = res.body!.getReader();
        const chunks: Uint8Array[] = [];
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          got += value.length;
          if (total) setProgress(got / total);
        }
        const buf = new Uint8Array(got);
        let off = 0;
        for (const c of chunks) {
          buf.set(c, off);
          off += c.length;
        }
        if (abort.signal.aborted) return;

        const gltf = await Aholo.GLTFLoader.loadGLTF(buf.buffer, { textureLoader: Aholo.downloadTexture });
        if (abort.signal.aborted) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const model = gltf.scene as any;
        const root = new Aholo.Object3D();
        root.add(model);
        scene.add(root);

        // parts for explode: every node that carries geometry, with its centroid direction
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: { node: any; base: [number, number, number]; dir: [number, number, number] }[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const visit = (n: any) => {
          if (n?.geometry) {
            const g = n.geometry;
            if (!g.boundingBox && g.computeBoundingBox) g.computeBoundingBox();
            const bb = g.boundingBox;
            const c = bb
              ? [(bb.min.x + bb.max.x) / 2, (bb.min.y + bb.max.y) / 2, (bb.min.z + bb.max.z) / 2]
              : [0, 0, 0];
            const d = [c[0] - center[0], c[1] - center[1], c[2] - center[2]];
            const len = Math.hypot(d[0], d[1], d[2]) || 1;
            parts.push({
              node: n,
              base: [n.position.x, n.position.y, n.position.z],
              dir: [(d[0] / len) * radius * 0.5, (d[1] / len) * radius * 0.5, (d[2] / len) * radius * 0.5],
            });
          }
          (n?.children || []).forEach(visit);
        };
        visit(model);
        if (partCenters && partCenters.length === parts.length) {
          parts.forEach((p, i) => {
            const c = partCenters[i];
            const d = [c[0] - center[0], c[1] - center[1], c[2] - center[2]];
            const len = Math.hypot(d[0], d[1], d[2]) || 1;
            p.dir = [(d[0] / len) * radius * 0.5, (d[1] / len) * radius * 0.5, (d[2] / len) * radius * 0.5];
          });
        }

        // animation (articulation or retargeted clips; skinned meshes need binding)
        const clips = (gltf.animations || []) as { name: string }[];
        if (clips.length && clip) {
          const plugin = new Aholo.Animation.AnimationPlugin();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          plugin.registerToViewer({ viewer } as any);
          const mixer = new Aholo.Animation.AnimationMixer(model);
          plugin.add(mixer);
          const bound = new WeakSet<object>();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          gltf.skeletons?.forEach((meshes: any, sk: any) => {
            const skeleton = new Aholo.Animation.Skeleton(sk.bones, sk.inverseBindMatrices);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            meshes.forEach((m: any) => {
              if (bound.has(m)) return;
              bound.add(m);
              plugin.bindSkinned(m, skeleton, mixer);
            });
          });
          // one action per clip; switching only flips weights (no reload)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const actions = clips.map((c) => ({ name: c.name, action: mixer.clipAction(c as any) as any }));
          actions.forEach(({ action }) => {
            action.active = false;
            action.weight = 0;
          });
          selectClipRef.current = (want: string | null) => {
            const pick =
              !want || want === "first"
                ? actions[0]
                : actions.find((a) => a.name.toLowerCase() === want.toLowerCase()) ??
                  actions.find((a) => a.name.toLowerCase().includes(want.toLowerCase())) ??
                  actions[0];
            actions.forEach(({ action }) => {
              action.active = false;
              action.weight = 0;
            });
            pick.action.reset(); // reset() also sets active=false, so it must come first
            pick.action.active = true;
            pick.action.weight = 1;
          };
          selectClipRef.current(clipRef.current);
        }
        onStats?.({ meshes: parts.length, clips: clips.map((c) => c.name) });
        setState("ready");

        let ang = 0;
        let last = performance.now();
        const tick = (now: number) => {
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          if (rotateRef.current) ang += dt * 0.35;
          root.rotation.y = ang;
          const e = explodeRef.current;
          if (parts.length > 1) {
            for (const p of parts) p.node.position.set(p.base[0] + p.dir[0] * e, p.base[1] + p.dir[1] * e, p.base[2] + p.dir[2] * e);
          }
          viewer.render();
          if (visible) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        const io = new IntersectionObserver(([en]) => {
          const was = visible;
          visible = en.isIntersecting;
          if (visible && !was) {
            last = performance.now();
            raf = requestAnimationFrame(tick);
          }
        });
        io.observe(host);
        abort.signal.addEventListener("abort", () => io.disconnect());
      } catch (e) {
        if (!abort.signal.aborted) {
          console.error(e);
          setState("error");
        }
      }
    };

    // only start downloading when the viewer is about to scroll into view
    const lazy = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting && !started) {
          lazy.disconnect();
          void start();
        }
      },
      { rootMargin: "600px 0px" }
    );
    lazy.observe(host);
    abort.signal.addEventListener("abort", () => lazy.disconnect());

    const onResize = () => {
      if (viewer && !viewer.isDestroyed) {
        viewer.resize();
      }
    };
    window.addEventListener("resize", onResize);
    return () => {
      abort.abort();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      try {
        if (viewer && !viewer.isDestroyed) viewer.destroy();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-canvas ${className}`}>
      <div ref={ref} className="absolute inset-0" />
      {state !== "ready" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          {state === "loading" ? (
            <>
              <div className="h-px w-32 overflow-hidden bg-line-strong">
                <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <span className="font-mono text-[11px] text-ink-3 tabular">loading GLB {Math.round(progress * 100)}%</span>
            </>
          ) : (
            <span className="font-mono text-[11px] text-err">Could not load this GLB.</span>
          )}
        </div>
      )}
    </div>
  );
}
