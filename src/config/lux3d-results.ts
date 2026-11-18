/**
 * Real Lux3D jobs run through Holorra's own /api/aholo/lux3d route
 * (@manycore/aholo-sdk-lux3d@1.10.0, region com) on 2026-11-18.
 * Outputs are mirrored into /public/assets/lux3d so the app never depends on
 * expiring result URLs. Times are wall-clock from submit to status 3 as seen
 * by our poller (15 s polling interval, so ±15 s). Triangle / texture counts
 * and bounds are read from each GLB's own accessors.
 */
export interface Lux3dResult {
  id: string;
  label: string;
  method: string;
  taskId: number;
  engine?: "G1" | "G1-Turbo";
  input: string;
  seconds: number;
  file: string;
  sizeMB: number;
  triangles?: number;
  textureMaps?: number;
  meshes?: number;
  clips?: string[];
  joints?: number;
  /** set when a downstream step rejected this asset */
  rigFailure?: string;
  bounds: { min: [number, number, number]; max: [number, number, number] };
}

export const ESPRESSO_PROMPT =
  "A modular espresso machine with a brushed titanium body, a hinged brewing hood on top, a sliding capsule drawer at the front and a rotary dial on the side. Product design, clean hard-surface geometry.";

export const CHARACTER_TPOSE_PROMPT =
  "A realistic adult person standing in a strict T-pose, both arms straight out horizontally at shoulder height, palms down, legs straight and slightly apart, fitted plain clothing and simple shoes, full body, facing forward, no accessories, no props, no hat.";

export const CHARACTER_PROMPT =
  "A full-body stylized courier character standing in an A-pose, arms slightly away from the body, simple jacket, trousers and boots, neutral expression, game-ready.";

/** Per-part geometry of the part-split result, measured from the GLB (file order).
 *  Lux3D returns the parts unnamed (part_0…part_3); `reading` is our description. */
export const ESPRESSO_PARTS: { material: string; reading: string; triangles: number; center: [number, number, number] }[] = [
  { material: "part_0", reading: "Main body", triangles: 95310, center: [-0.014, -0.046, -0.006] },
  { material: "part_1", reading: "Side dial", triangles: 1489, center: [0.118, 0.073, -0.012] },
  { material: "part_2", reading: "Top section", triangles: 59340, center: [-0.013, 0.16, -0.005] },
  { material: "part_3", reading: "Outer shell", triangles: 73649, center: [0.001, -0.047, 0.025] },
];

export const ARTICULATION_PROMPT =
  "The top brewing hood hinges open upward about its back edge while the front capsule drawer slides out.";

/** Joints exactly as returned in the articulation result's robot.urdf. */
export const ESPRESSO_JOINTS = [
  { name: "hood_top_joint", type: "revolute", child: "hood_top", limit: "0° – 90°", axis: "−x (hinge)" },
  { name: "drawer_front_joint", type: "prismatic", child: "drawer_front", limit: "0 – 0.233", axis: "+z (slide)" },
  { name: "drawer_handle_joint", type: "fixed", child: "drawer_handle", limit: "—", axis: "follows drawer" },
];

/** The combined retarget GLB names its clips animation_1…5; they map to our request order. */
export const RETARGET_CLIPS = [
  { clip: "animation_1", id: "Idle_Loop", seconds: 2.5 },
  { clip: "animation_2", id: "Walk_Loop", seconds: 1.33 },
  { clip: "animation_3", id: "Jog_Fwd_Loop", seconds: 0.93 },
  { clip: "animation_4", id: "Dance_Loop", seconds: 1.0 },
  { clip: "animation_5", id: "Sword_Attack", seconds: 1.53 },
];

export const LUX3D_RESULTS: Record<string, Lux3dResult> = {
  espressoTurbo: {
    id: "espressoTurbo",
    label: "Espresso machine · G1-Turbo",
    method: "lux3d.textTo3d.create",
    taskId: 8353472,
    engine: "G1-Turbo",
    input: ESPRESSO_PROMPT,
    seconds: 151,
    file: "/assets/lux3d/espresso-g1turbo.glb",
    sizeMB: 17.4,
    triangles: 252226,
    textureMaps: 2,
    meshes: 1,
    bounds: { min: [-0.175, -0.294, -0.225], max: [0.175, 0.294, 0.225] },
  },
  espressoG1: {
    id: "espressoG1",
    label: "Espresso machine · G1",
    method: "lux3d.textTo3d.create",
    taskId: 8353478,
    engine: "G1",
    input: ESPRESSO_PROMPT,
    seconds: 343,
    file: "/assets/lux3d/espresso-g1.glb",
    sizeMB: 14.6,
    triangles: 229788,
    textureMaps: 3,
    meshes: 1,
    bounds: { min: [-0.13, -0.21, -0.169], max: [0.13, 0.21, 0.169] },
  },
  espressoParts: {
    id: "espressoParts",
    label: "Espresso machine · part split",
    method: "lux3d.partSplit.create",
    taskId: 8354166,
    input: "espresso-g1.glb (task 8353478)",
    seconds: 118,
    file: "/assets/lux3d/espresso-g1-parts.glb",
    sizeMB: 14.7,
    triangles: 229788,
    textureMaps: 3,
    meshes: 4,
    bounds: { min: [-0.13, -0.21, -0.169], max: [0.13, 0.21, 0.169] },
  },
  espressoArticulated: {
    id: "espressoArticulated",
    label: "Espresso machine · articulated",
    method: "lux3d.articulationAnimation.create",
    taskId: 8354168,
    input: `espresso-g1.glb + "${"The top brewing hood hinges open upward about its back edge while the front capsule drawer slides out."}"`,
    seconds: 298,
    file: "/assets/lux3d/articulated/robot.urdf",
    sizeMB: 30.1,
    meshes: 4,
    bounds: { min: [-0.13, 0, -0.17], max: [0.13, 0.42, 0.4] },
  },
  characterTpose: {
    id: "characterTpose",
    label: "Character · T-pose mesh",
    method: "lux3d.textTo3d.create",
    taskId: 8354807,
    engine: "G1-Turbo",
    input: CHARACTER_TPOSE_PROMPT,
    seconds: 197, // upper bound: not polled continuously (submitted 19:26:09, seen done 19:29:26)
    file: "/assets/lux3d/character-tpose.glb",
    sizeMB: 16.9,
    triangles: 284608,
    textureMaps: 2,
    meshes: 1,
    bounds: { min: [-0.806, -0.825, -0.156], max: [0.806, 0.825, 0.156] },
  },
  characterRigged: {
    id: "characterRigged",
    label: "Character · auto-rigged",
    method: "lux3d.humanoidAutoRig.create",
    taskId: 8355123,
    input: "character-tpose.glb (task 8354807)",
    seconds: 81,
    file: "/assets/lux3d/character-rigged.glb",
    sizeMB: 36.4,
    triangles: 284608,
    textureMaps: 2,
    meshes: 1,
    joints: 52,
    bounds: { min: [-0.806, -0.825, -0.156], max: [0.806, 0.825, 0.156] },
  },
  characterAnimated: {
    id: "characterAnimated",
    label: "Character · 5 retargeted clips",
    method: "lux3d.humanoidAnimationRetarget.create",
    taskId: 8355366,
    input: "character-rigged.glb (task 8355123) · Idle_Loop, Walk_Loop, Jog_Fwd_Loop, Dance_Loop, Sword_Attack",
    seconds: 17, // upper bound from the 15 s poll
    file: "/assets/lux3d/character-animated.glb",
    sizeMB: 36.8,
    triangles: 284608,
    textureMaps: 2,
    meshes: 1,
    joints: 52,
    clips: ["animation_1", "animation_2", "animation_3", "animation_4", "animation_5"],
    bounds: { min: [-0.806, -0.825, -0.156], max: [0.806, 0.825, 0.156] },
  },
  characterStatic: {
    id: "characterStatic",
    label: "Courier character · rig rejected",
    rigFailure: "RIG_ELIGIBILITY_FAILED (humanoidAutoRig task 8354170)",
    method: "lux3d.textTo3d.create",
    taskId: 8353484,
    engine: "G1-Turbo",
    input: CHARACTER_PROMPT,
    seconds: 119,
    file: "/assets/lux3d/character-static.glb",
    sizeMB: 17.1,
    triangles: 283002,
    textureMaps: 2,
    meshes: 1,
    bounds: { min: [-0.536, -0.9, -0.199], max: [0.536, 0.9, 0.199] },
  },
};
