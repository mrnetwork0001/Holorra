"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Plays a Lux3D articulationAnimation result: reads the returned URDF at runtime,
 * loads each link's GLB into @manycore/aholo-viewer, places child links at their
 * joint origins and drives revolute / prismatic joints within the URDF limits.
 */

interface UrdfJoint {
  name: string;
  type: "revolute" | "prismatic" | "fixed" | string;
  parent: string;
  child: string;
  xyz: [number, number, number];
  axis: [number, number, number];
  lower: number;
  upper: number;
}

function parseUrdf(xml: string) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const links = [...doc.querySelectorAll("link")].map((l) => ({
    name: l.getAttribute("name") || "",
    mesh: l.querySelector("visual geometry mesh")?.getAttribute("filename") || "",
  }));
  const nums = (s: string | null | undefined, d: [number, number, number]) =>
    (s ? s.trim().split(/\s+/).map(Number) : d) as [number, number, number];
  const joints: UrdfJoint[] = [...doc.querySelectorAll("joint")].map((j) => ({
    name: j.getAttribute("name") || "",
    type: j.getAttribute("type") || "fixed",
    parent: j.querySelector("parent")?.getAttribute("link") || "",
    child: j.querySelector("child")?.getAttribute("link") || "",
    xyz: nums(j.querySelector("origin")?.getAttribute("xyz"), [0, 0, 0]),
    axis: nums(j.querySelector("axis")?.getAttribute("xyz"), [1, 0, 0]),
    lower: Number(j.querySelector("limit")?.getAttribute("lower") ?? 0),
    upper: Number(j.querySelector("limit")?.getAttribute("upper") ?? 0),
  }));
  return { links, joints };
}

export interface JointState {
  name: string;
  type: string;
  lower: number;
  upper: number;
}

export default function ArticulatedViewer({
  urdf,
  bounds,
  className = "",
  /** manual joint values 0–1 by joint name; when null the joints loop automatically */
  manual = null,
  onJoints,
}: {
  urdf: string;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  className?: string;
  manual?: Record<string, number> | null;
  onJoints?: (j: JointState[]) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const manualRef = useRef(manual);
  manualRef.current = manual;
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [progress, setProgress] = useState(0);

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
      setState("loading");
      try {
        const Aholo = await import("@manycore/aholo-viewer");
        const base = urdf.slice(0, urdf.lastIndexOf("/") + 1);
        const { links, joints } = parseUrdf(await (await fetch(urdf, { signal: abort.signal })).text());
        onJoints?.(joints.filter((j) => j.type !== "fixed").map((j) => ({ name: j.name, type: j.type, lower: j.lower, upper: j.upper })));

        host.innerHTML = "";
        viewer = Aholo.createViewer(`urdf-${Math.random().toString(36).slice(2)}`, host, { antialiasing: true, alpha: false });
        if (viewer.config?.coordinateSystem?.enabled) viewer.config.coordinateSystem.enabled.set(false);
        const size = [0, 1, 2].map((k) => bounds.max[k] - bounds.min[k]);
        const center = [0, 1, 2].map((k) => (bounds.max[k] + bounds.min[k]) / 2);
        const radius = Math.max(...size) * 0.62;
        const rect = host.getBoundingClientRect();
        const camera = new Aholo.PerspectiveCamera(30, Math.max(0.3, rect.width / Math.max(1, rect.height)), radius * 0.05, radius * 60);
        camera.up.set(0, 1, 0);
        const dist = (radius / Math.tan((30 * Math.PI) / 360)) * 1.55;
        camera.position.set(center[0] + dist * 0.62, center[1] + dist * 0.3, center[2] + dist * 0.72);
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

        // load every link mesh with combined progress
        const totals: number[] = links.map(() => 0);
        const gots: number[] = links.map(() => 0);
        const loadLink = async (i: number) => {
          const res = await fetch(base + links[i].mesh, { signal: abort.signal });
          totals[i] = Number(res.headers.get("content-length")) || 0;
          const reader = res.body!.getReader();
          const chunks: Uint8Array[] = [];
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            gots[i] += value.length;
            const t = totals.reduce((a, b) => a + b, 0);
            if (t) setProgress(gots.reduce((a, b) => a + b, 0) / t);
          }
          const buf = new Uint8Array(gots[i]);
          let off = 0;
          for (const c of chunks) {
            buf.set(c, off);
            off += c.length;
          }
          const gltf = await Aholo.GLTFLoader.loadGLTF(buf.buffer, { textureLoader: Aholo.downloadTexture });
          return gltf.scene;
        };
        const meshes = await Promise.all(links.map((_, i) => loadLink(i)));
        if (abort.signal.aborted) return;

        // build the kinematic tree
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const frames: Record<string, any> = {};
        links.forEach((l, i) => {
          const f = new Aholo.Object3D();
          f.add(meshes[i]);
          frames[l.name] = f;
        });
        const childOf = new Set(joints.map((j) => j.child));
        const turntable = new Aholo.Object3D();
        scene.add(turntable);
        links.filter((l) => !childOf.has(l.name)).forEach((l) => turntable.add(frames[l.name]));
        for (const j of joints) {
          frames[j.parent]?.add(frames[j.child]);
          frames[j.child]?.position.set(j.xyz[0], j.xyz[1], j.xyz[2]);
        }
        setState("ready");

        const moving = joints.filter((j) => j.type === "revolute" || j.type === "prismatic");
        const apply = (j: UrdfJoint, f01: number) => {
          const v = j.lower + (j.upper - j.lower) * f01;
          const fr = frames[j.child];
          if (!fr) return;
          if (j.type === "prismatic") {
            fr.position.set(j.xyz[0] + j.axis[0] * v, j.xyz[1] + j.axis[1] * v, j.xyz[2] + j.axis[2] * v);
          } else {
            // rotate about the joint axis (axes here are within ~1° of a principal axis)
            const ax = j.axis.map(Math.abs);
            const k = ax.indexOf(Math.max(...ax));
            const s = Math.sign(j.axis[k]) * v;
            fr.rotation.set(k === 0 ? s : 0, k === 1 ? s : 0, k === 2 ? s : 0);
          }
        };

        const smooth = (x: number) => x * x * (3 - 2 * x);
        let t = 0;
        let ang = -0.5;
        let last = performance.now();
        const tick = (now: number) => {
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          t += dt;
          const m = manualRef.current;
          if (!m) ang += dt * 0.25;
          turntable.rotation.y = ang;
          // loop: closed 1s · open 1.6s · hold 1.4s · close 1.6s
          const c = t % 5.6;
          const open = c < 1 ? 0 : c < 2.6 ? smooth((c - 1) / 1.6) : c < 4 ? 1 : smooth(1 - (c - 4) / 1.6);
          moving.forEach((j, i) => {
            const auto = Math.max(0, Math.min(1, open * 1.15 - i * 0.15));
            apply(j, m && m[j.name] !== undefined ? m[j.name] : auto * (j.type === "revolute" ? 0.8 : 1));
          });
          viewer.render();
          if (visible) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        const io2 = new IntersectionObserver(([en]) => {
          const was = visible;
          visible = en.isIntersecting;
          if (visible && !was) {
            last = performance.now();
            raf = requestAnimationFrame(tick);
          }
        });
        io2.observe(host);
        abort.signal.addEventListener("abort", () => io2.disconnect());
      } catch (e) {
        if (!abort.signal.aborted) {
          console.error(e);
          setState("error");
        }
      }
    };

    // only start downloading when the viewer is about to scroll into view
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting && !started) {
          io.disconnect();
          void start();
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(host);

    return () => {
      abort.abort();
      io.disconnect();
      cancelAnimationFrame(raf);
      try {
        if (viewer && !viewer.isDestroyed) viewer.destroy();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urdf]);

  return (
    <div className={`relative overflow-hidden bg-canvas ${className}`}>
      <div ref={ref} className="absolute inset-0" />
      {state !== "ready" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          {state === "error" ? (
            <span className="font-mono text-[11px] text-err">Could not load the articulated model.</span>
          ) : (
            <>
              <div className="h-px w-32 overflow-hidden bg-line-strong">
                <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <span className="font-mono text-[11px] text-ink-3 tabular">loading 4 links {Math.round(progress * 100)}%</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
