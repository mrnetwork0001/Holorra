/**
 * Assemble a Lux3D articulationAnimation result (robot.urdf + per-link GLBs)
 * inside any @manycore/aholo-viewer scene, and drive its joints.
 * Used by the studio stage to place the real articulated espresso machine.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type AholoModule = typeof import("@manycore/aholo-viewer");

export interface UrdfJoint {
  name: string;
  type: string;
  parent: string;
  child: string;
  xyz: [number, number, number];
  axis: [number, number, number];
  lower: number;
  upper: number;
}

export interface UrdfLink {
  name: string;
  mesh: string;
}

export interface UrdfAssembly {
  /** add this to the scene; contains the whole kinematic tree */
  root: any;
  /** one frame per link (child links are nested under their parents) */
  frames: Record<string, any>;
  links: UrdfLink[];
  joints: UrdfJoint[];
  /** set a joint by name to f01 ∈ [0,1] of its URDF limit range */
  setJoint: (name: string, f01: number) => void;
}

export function parseUrdf(xml: string): { links: UrdfLink[]; joints: UrdfJoint[] } {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const nums = (s: string | null | undefined, d: [number, number, number]) =>
    (s ? s.trim().split(/\s+/).map(Number) : d) as [number, number, number];
  const links = [...doc.querySelectorAll("link")].map((l) => ({
    name: l.getAttribute("name") || "",
    mesh: l.querySelector("visual geometry mesh")?.getAttribute("filename") || "",
  }));
  const joints = [...doc.querySelectorAll("joint")].map((j) => ({
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

export async function loadUrdfAssembly(Aholo: AholoModule, urdfUrl: string, signal?: AbortSignal): Promise<UrdfAssembly> {
  const base = urdfUrl.slice(0, urdfUrl.lastIndexOf("/") + 1);
  const { links, joints } = parseUrdf(await (await fetch(urdfUrl, { signal })).text());
  const meshes = await Promise.all(
    links.map(async (l) => {
      const buf = await (await fetch(base + l.mesh, { signal })).arrayBuffer();
      const gltf = await Aholo.GLTFLoader.loadGLTF(buf, { textureLoader: Aholo.downloadTexture });
      return gltf.scene as any;
    })
  );
  const frames: Record<string, any> = {};
  links.forEach((l, i) => {
    const f = new Aholo.Object3D();
    f.add(meshes[i]);
    frames[l.name] = f;
  });
  const root = new Aholo.Object3D();
  const childOf = new Set(joints.map((j) => j.child));
  links.filter((l) => !childOf.has(l.name)).forEach((l) => root.add(frames[l.name]));
  for (const j of joints) {
    frames[j.parent]?.add(frames[j.child]);
    frames[j.child]?.position.set(j.xyz[0], j.xyz[1], j.xyz[2]);
  }
  const byName = Object.fromEntries(joints.map((j) => [j.name, j]));
  const setJoint = (name: string, f01: number) => {
    const j = byName[name];
    const fr = j && frames[j.child];
    if (!j || !fr || j.type === "fixed") return;
    const v = j.lower + (j.upper - j.lower) * Math.max(0, Math.min(1, f01));
    if (j.type === "prismatic") {
      fr.position.set(j.xyz[0] + j.axis[0] * v, j.xyz[1] + j.axis[1] * v, j.xyz[2] + j.axis[2] * v);
    } else {
      const ax = j.axis.map(Math.abs);
      const k = ax.indexOf(Math.max(...ax));
      const s = Math.sign(j.axis[k]) * v;
      fr.rotation.set(k === 0 ? s : 0, k === 1 ? s : 0, k === 2 ? s : 0);
    }
  };
  return { root, frames, links, joints, setJoint };
}

/**
 * Walk "down" from (x, startY, z) until the voxel grid reports solid.
 * downSign is +1 for OpenCV (-Y up) worlds, -1 for Y-up worlds.
 * Returns the first solid y, or null if none within maxDrop metres.
 */
export function findFloorY(
  isPointSolid: (x: number, y: number, z: number) => boolean,
  x: number,
  startY: number,
  z: number,
  { downSign = 1, step = 0.025, maxDrop = 4 } = {}
): number | null {
  for (let d = 0; d <= maxDrop; d += step) {
    const y = startY + downSign * d;
    if (isPointSolid(x, y, z)) return y;
  }
  return null;
}
