export interface InitialCameraPose {
  px: number;
  py: number;
  pz: number;
  lookAt: [number, number, number];
  yaw: number;
  pitch: number;
  thirdPersonDistance: number;
  up: [number, number, number];
}

export interface HeroSubPartSpec {
  id: string;
  name: string;
  semanticRole: string;
  geometryType: "box" | "cylinder" | "sphere" | "torus";
  dimensions: [number, number, number];
  baseOffset: [number, number, number];
  explodeDirection: [number, number, number];
  articulationType: "none" | "hinge-x" | "hinge-y" | "slide-z" | "spin-y";
  articulationRange: number;
  defaultColor: number;
  defaultColorHex: string;
  faceCount: number;
  /** URDF link this part maps to, when the blueprint is a real Lux3D result */
  link?: string;
}

export interface Lux3dHeroAssetBlueprint {
  id: string;
  name: string;
  /** 简体中文 display name for the 中 / EN switch */
  nameZh?: string;
  /** /public path of the real Lux3D mesh; live jobs on this prop send its public URL. Unset: preview only. */
  modelPath?: string;
  tagline: string;
  lux3dVersion: "G1" | "G1-Turbo";
  sourcePrompt: string;
  articulationPrompt: string;
  totalFaces: number;
  pbrEnabled: boolean;
  worldPosition: [number, number, number];
  worldScale: number;
  parts: HeroSubPartSpec[];
  /** true for the hand-built placeholder props (not Lux3D output) */
  procedural?: boolean;
  /**
   * Real Lux3D articulationAnimation result (URDF + link GLBs, Y-up metres).
   * The stage flips it into the OpenCV (-Y up) world and stands it on the floor.
   */
  real?: {
    urdf: string;
    /** [x, z] spot per world id, plus the floor y used if the voxel probe fails */
    /** plinth: stand the prop on a display plinth this tall (m) on open floor; floorY is then the plinth top */
    placements: Record<string, { at: [number, number]; floorY: number; yawDeg?: number; plinth?: number }>;
    /** joint names driven by the articulation toggle, 0..1 of their URDF range */
    joints: { name: string; max: number }[];
  };
}

export interface AholoWorldPreset {
  id: string;
  code: string;
  title: string;
  /** 简体中文 title for the 中 / EN switch */
  titleZh?: string;
  /**
   * This world's splat and voxel grid are stored +Y up. The stage keeps one −Y-up (OpenCV) frame,
   * so both are turned half a turn about Z (x → −x, y → −y); poses below are in the stage frame.
   */
  mirrorXY?: boolean;
  /** keep the bean hunt inside this well-reconstructed area: [minX, maxX, minZ, maxZ] */
  beanArea?: [number, number, number, number];
  subtitle: string;
  category: "Indoor" | "Outdoor" | "Architecture" | "Object";
  sourceEngine: string;
  splatMode: "direct" | "lod";
  primarySplatUrl?: string;
  envSplatUrl?: string;
  lodMetaUrl?: string;
  lodBudgetSplats?: number;
  voxelMetaUrl?: string;
  voxelBinUrl?: string;
  splatCountLabel: string;
  /** "z" for SpatialGen output (Z-up); the stage rotates it into the OpenCV (-Y up) frame */
  upAxis?: "z";
  /** floor height in the stage frame when there is no voxel grid to probe */
  floorY?: number;
  /** [x, z] where the actor stands, when the default spot (ahead of the camera) is not suitable */
  actorSpot?: [number, number];
  pose: InitialCameraPose;
  defaultHeroAssetId: string;
  defaultActorId: ActorId;
  defaultKeyframes: {
    id: string;
    label: string;
    labelZh?: string;
    position: [number, number, number];
    target: [number, number, number];
    durationSec: number;
    luxrealPrompt: string;
  }[];
}

export const AHOLO_OSS_BASE = "https://holo-cos.aholo3d.cn/aholo-opensource/gs_file";

export type ActorId = "lux3d";

export interface RiggedActor {
  id: ActorId;
  name: string;
  role: string;
  glbUrl: string;
  rigMethod: string;
  clipCount: number;
  heightMeters: number;
  /** "y" for standard glTF (Y-up) models that must be flipped into the OpenCV stage */
  upAxis?: "y";
  /** model scale applied in the stage */
  scale?: number;
  /** metres from the model origin down to the soles, after scale (0 when the origin is at the feet) */
  feetBelowOrigin?: number;
  /** generic clip names in the GLB → official Lux3D clip ids */
  clipMap?: Record<string, string>;
  /** public URL of the rigged model, for live retarget jobs (the cloud cannot fetch app-relative paths) */
  sourceRigUrl?: string;
}

export const AHOLO_RIGGED_ACTORS: Record<ActorId, RiggedActor> = {
  lux3d: {
    id: "lux3d",
    name: "Lux3D actor",
    role: "Generated, auto-rigged and retargeted with Lux3D",
    glbUrl: "/assets/lux3d/character-animated.glb",
    rigMethod: "lux3d.humanoidAutoRig + humanoidAnimationRetarget",
    clipCount: 8,
    heightMeters: 1.65,
    upAxis: "y",
    scale: 1,
    feetBelowOrigin: 0.8,
    // humanoidAutoRig task 8355123 output
    sourceRigUrl: "https://qhsmodel.kujiale.com/ai-generate/3/8355173-1.glb",
    clipMap: {
      animation_1: "Idle_Loop",
      animation_2: "Walk_Loop",
      animation_3: "Jog_Fwd_Loop",
      animation_4: "Interact",
      animation_5: "Chest_Open",
      animation_6: "Yes",
      animation_7: "Dance_Loop",
      animation_8: "Sword_Attack",
    },
  },
};

export const LUX3D_HERO_BLUEPRINTS: Record<string, Lux3dHeroAssetBlueprint> = {
  "cyber-barista-station": {
    id: "cyber-barista-station",
    name: "Espresso machine (Lux3D)",
    nameZh: "意式咖啡机（Lux3D）",
    modelPath: "/assets/lux3d/espresso-g1.glb",
    tagline: "4 URDF links · hinge + slide",
    lux3dVersion: "G1",
    sourcePrompt:
      "A modular espresso machine with a brushed titanium body, a hinged brewing hood on top, a sliding capsule drawer at the front and a rotary dial on the side. Product design, clean hard-surface geometry.",
    articulationPrompt:
      "The top brewing hood hinges open upward about its back edge while the front capsule drawer slides out.",
    totalFaces: 233_950,
    pbrEnabled: true,
    worldPosition: [-2.23, 1.912, 0.87],
    worldScale: 1,
    real: {
      urdf: "/assets/lux3d/articulated/robot.urdf",
      placements: {
        // loft: on a 0.75 m display plinth on open marble floor (floor y = 0.36 in the stage frame)
        "smart-loft-indoor": { at: [4.0, -1.6], floorY: -0.39, plinth: 0.75 },
        // SpatialGen coffee bar: on the table top measured in the generated splat
        // (flat patch at z = -0.46, 0.69 m above the floor -> y = 0.46 in the stage frame)
        "spatialgen-coffee-bar": { at: [0.65, -0.9], floorY: 0.46 },
        // object turntable: on a plinth to the right of the bear (floor y = 0.41)
        "sculpted-bear-studio": { at: [1.15, -0.62], floorY: -0.19, plinth: 0.6 },
      },
      joints: [
        { name: "hood_top_joint", max: 0.8 },
        { name: "drawer_front_joint", max: 1 },
      ],
    },
    parts: [
      {
        id: "base",
        name: "base",
        semanticRole: "Body, dial and drip tray",
        geometryType: "box",
        dimensions: [0, 0, 0],
        baseOffset: [0, 0, 0],
        explodeDirection: [0, -0.06, -0.08],
        articulationType: "none",
        articulationRange: 0,
        defaultColor: 0x8fa3b5,
        defaultColorHex: "#8FA3B5",
        faceCount: 175_072,
        link: "base",
      },
      {
        id: "hood_top",
        name: "hood_top",
        semanticRole: "Top hood · revolute, 0–90°",
        geometryType: "box",
        dimensions: [0, 0, 0],
        baseOffset: [0, 0, 0],
        explodeDirection: [0, 0.16, -0.04],
        articulationType: "hinge-x",
        articulationRange: 1.57,
        defaultColor: 0xd9d4c7,
        defaultColorHex: "#D9D4C7",
        faceCount: 50_021,
        link: "hood_top",
      },
      {
        id: "drawer_front",
        name: "drawer_front",
        semanticRole: "Capsule drawer · prismatic, 0–0.23 m",
        geometryType: "box",
        dimensions: [0, 0, 0],
        baseOffset: [0, 0, 0],
        explodeDirection: [0, 0.02, 0.14],
        articulationType: "slide-z",
        articulationRange: 0.233,
        defaultColor: 0xc79a4a,
        defaultColorHex: "#C79A4A",
        faceCount: 8_409,
        link: "drawer_front",
      },
      {
        id: "drawer_handle",
        name: "drawer_handle",
        semanticRole: "Drawer handle · fixed to drawer",
        geometryType: "box",
        dimensions: [0, 0, 0],
        baseOffset: [0, 0, 0],
        explodeDirection: [0, 0, 0.06],
        articulationType: "none",
        articulationRange: 0,
        defaultColor: 0xa8544a,
        defaultColorHex: "#A8544A",
        faceCount: 448,
        link: "drawer_handle",
      },
    ],
  },
  "aegis-guardian-mech": {
    id: "aegis-guardian-mech",
    procedural: true,
    name: "Aegis-IX Tactical Patrol Drone",
    nameZh: "Aegis-IX 战术巡逻无人机",
    tagline: "6 parts · articulated drone",
    lux3dVersion: "G1",
    sourcePrompt:
      "Futuristic autonomous patrol drone turret with articulated gull-wing shield plates, rotating radar halo, extendable optical scanner, and armored pedestal",
    articulationPrompt:
      "Both lateral armor shields deploy outward while the upper radar halo spins 360 degrees and the optical sensor extends forward",
    totalFaces: 242_000,
    pbrEnabled: true,
    worldPosition: [-22.85, 0.2, 59.9],
    worldScale: 0.0055,
    parts: [
      {
        id: "pedestal-core",
        name: "01_Armored_Gyro_Core",
        semanticRole: "Central Stabilizer Body",
        geometryType: "sphere",
        dimensions: [48, 22, 22],
        baseOffset: [0, 0, 0],
        explodeDirection: [0, 20, -60],
        articulationType: "none",
        articulationRange: 0,
        defaultColor: 0xd9d4c7,
        defaultColorHex: "#D9D4C7",
        faceCount: 64_000,
      },
      {
        id: "radar-halo",
        name: "02_Orbital_LiDAR_Halo",
        semanticRole: "360-Degree Spatial Scanner Ring",
        geometryType: "torus",
        dimensions: [64, 9, 20],
        baseOffset: [0, -56, 0],
        explodeDirection: [0, -140, 0],
        articulationType: "spin-y",
        articulationRange: 6.28,
        defaultColor: 0xc79a4a,
        defaultColorHex: "#C79A4A",
        faceCount: 48_000,
      },
      {
        id: "left-aegis-wing",
        name: "03_Port_Ballistic_Wing",
        semanticRole: "Left Articulated Shield Vane",
        geometryType: "box",
        dimensions: [20, 96, 72],
        baseOffset: [-62, -6, 0],
        explodeDirection: [-145, -20, 15],
        articulationType: "hinge-y",
        articulationRange: 0.75,
        defaultColor: 0x8fa3b5,
        defaultColorHex: "#8FA3B5",
        faceCount: 38_000,
      },
      {
        id: "right-aegis-wing",
        name: "04_Starboard_Ballistic_Wing",
        semanticRole: "Right Articulated Shield Vane",
        geometryType: "box",
        dimensions: [20, 96, 72],
        baseOffset: [62, -6, 0],
        explodeDirection: [145, -20, 15],
        articulationType: "hinge-y",
        articulationRange: -0.75,
        defaultColor: 0x8fa3b5,
        defaultColorHex: "#8FA3B5",
        faceCount: 38_000,
      },
      {
        id: "optic-visor",
        name: "05_Telephoto_Optic_Visor",
        semanticRole: "Forward Telescoping Lens Barrel",
        geometryType: "box",
        dimensions: [42, 26, 54],
        baseOffset: [0, -8, 48],
        explodeDirection: [0, -15, 145],
        articulationType: "slide-z",
        articulationRange: 44,
        defaultColor: 0xa8544a,
        defaultColorHex: "#A8544A",
        faceCount: 31_000,
      },
      {
        id: "thruster-base",
        name: "06_Magnetic_Lev_Base",
        semanticRole: "Lower Repulsor Footing",
        geometryType: "box",
        dimensions: [78, 22, 78],
        baseOffset: [0, 58, 0],
        explodeDirection: [0, 135, 0],
        articulationType: "hinge-x",
        articulationRange: 0.35,
        defaultColor: 0x7e9474,
        defaultColorHex: "#7E9474",
        faceCount: 23_000,
      },
    ],
  },
  "chrono-holo-kiosk": {
    id: "chrono-holo-kiosk",
    procedural: true,
    name: "ChronoGate Wayfinding Holo-Terminal",
    nameZh: "ChronoGate 导览全息终端",
    tagline: "5 parts · articulated kiosk",
    lux3dVersion: "G1-Turbo",
    sourcePrompt:
      "Architectural smart transit terminal with floating holographic ring emitter, tilting touchscreen console, ticket dispenser drawer, and illuminated monolith base",
    articulationPrompt:
      "The holographic ring spins continuously while the upper screen tilts toward the passenger and the ticket tray slides out",
    totalFaces: 148_500,
    pbrEnabled: true,
    worldPosition: [-1.45, -1.35, 0.1],
    worldScale: 0.004,
    parts: [
      {
        id: "monolith-column",
        name: "01_Architectural_Pillar",
        semanticRole: "Main Structural Pedestal",
        geometryType: "box",
        dimensions: [74, 128, 52],
        baseOffset: [0, 12, 0],
        explodeDirection: [0, 65, -55],
        articulationType: "none",
        articulationRange: 0,
        defaultColor: 0x8fa3b5,
        defaultColorHex: "#8FA3B5",
        faceCount: 44_500,
      },
      {
        id: "tilting-display",
        name: "02_Tilting_Touch_Canopy",
        semanticRole: "Articulated Passenger Display",
        geometryType: "box",
        dimensions: [96, 56, 16],
        baseOffset: [0, -64, 24],
        explodeDirection: [0, -125, 85],
        articulationType: "hinge-x",
        articulationRange: 0.65,
        defaultColor: 0xd9d4c7,
        defaultColorHex: "#D9D4C7",
        faceCount: 36_000,
      },
      {
        id: "holo-emitter-ring",
        name: "03_Holo_Projection_Ring",
        semanticRole: "Upper Rotating Emitter Torus",
        geometryType: "torus",
        dimensions: [42, 7, 20],
        baseOffset: [0, -118, 0],
        explodeDirection: [0, -185, 0],
        articulationType: "spin-y",
        articulationRange: 6.28,
        defaultColor: 0xc79a4a,
        defaultColorHex: "#C79A4A",
        faceCount: 32_000,
      },
      {
        id: "ticket-dispenser",
        name: "04_RFID_Card_Dispenser",
        semanticRole: "Linear Sliding Output Module",
        geometryType: "box",
        dimensions: [52, 20, 46],
        baseOffset: [0, 8, 34],
        explodeDirection: [0, 20, 130],
        articulationType: "slide-z",
        articulationRange: 40,
        defaultColor: 0x7e9474,
        defaultColorHex: "#7E9474",
        faceCount: 18_000,
      },
      {
        id: "acoustic-wings",
        name: "05_Acoustic_Privacy_Hood",
        semanticRole: "Lateral Sound-Shield Fins",
        geometryType: "sphere",
        dimensions: [24, 16, 16],
        baseOffset: [56, -48, 10],
        explodeDirection: [130, -65, 30],
        articulationType: "hinge-y",
        articulationRange: 0.5,
        defaultColor: 0xa8544a,
        defaultColorHex: "#A8544A",
        faceCount: 18_000,
      },
    ],
  },
};

export const AHOLO_WORLD_PRESETS: AholoWorldPreset[] = [
  {
    id: "smart-loft-indoor",
    code: "WORLD-01",
    title: "Designer Smart Loft",
    titleZh: "设计师智能公寓",
    mirrorXY: true,
    subtitle: "Indoor apartment · .spz splat · voxel collision",
    category: "Indoor",
    sourceEngine: "Hosted .spz scene",
    splatMode: "direct",
    primarySplatUrl: `${AHOLO_OSS_BASE}/room/scene.7c26e842.spz`,
    voxelMetaUrl: `${AHOLO_OSS_BASE}/room/voxel/10c88df3/collision.voxel-meta.json`,
    voxelBinUrl: `${AHOLO_OSS_BASE}/room/voxel/10c88df3/collision.voxel.bin`,
    splatCountLabel: "2.99M splats · .spz",
    pose: {
      px: 4.4,
      py: -0.55,
      pz: 0.4,
      lookAt: [4.0, -0.4, -1.6],
      yaw: 0.197,
      pitch: 0.082,
      thirdPersonDistance: 3.2,
      up: [0, -1, 0],
    },
    floorY: 0.36,
    beanArea: [0.9, 6.0, -3.45, 0.45],
    actorSpot: [3.35, -1.95],
    defaultHeroAssetId: "cyber-barista-station",
    defaultActorId: "lux3d",
    defaultKeyframes: [
      {
        id: "kf-1",
        label: "Entrance wide",
        labelZh: "入口全景",
        position: [4.6, -1.0, 0.5],
        target: [4.0, -0.5, -1.6],
        durationSec: 3.0,
        luxrealPrompt:
          "Cinematic dolly-in through a warm sunlit designer smart loft, photorealistic 3DGS reflections, subtle depth of field",
      },
      {
        id: "kf-2",
        label: "Appliance close-up",
        labelZh: "咖啡机特写",
        position: [4.95, -0.8, -0.85],
        target: [4.0, -0.6, -1.6],
        durationSec: 3.5,
        luxrealPrompt:
          "Macro product orbit around the articulated espresso machine on its plinth as the hood hinges open and the drawer slides out",
      },
      {
        id: "kf-3",
        label: "Actor tracking shot",
        labelZh: "角色跟拍",
        position: [1.7, -0.75, -1.35],
        target: [3.6, -0.5, -1.8],
        durationSec: 3.0,
        luxrealPrompt:
          "Low-angle reverse tracking shot following the rigged Lux3D actor walking across the living room floor",
      },
    ],
  },
  {
    id: "juguo-urban-plaza",
    code: "WORLD-02",
    title: "Juguo Urban Plaza",
    titleZh: "聚果城市广场",
    mirrorXY: true,
    subtitle: "Outdoor plaza · 41.8M-splat chunk-LOD stream · .ply sky · voxel collision",
    category: "Outdoor",
    sourceEngine: "Hosted chunk-LOD stream + .ply sky",
    splatMode: "lod",
    lodMetaUrl: `${AHOLO_OSS_BASE}/juguo/chunk-lod/0f9e3ae1/lod-meta.json`,
    envSplatUrl: `${AHOLO_OSS_BASE}/juguo/environment.d3e129aa.ply`,
    lodBudgetSplats: 4_500_000,
    voxelMetaUrl: `${AHOLO_OSS_BASE}/juguo/voxel/309eccc1/collision.voxel-meta.json`,
    voxelBinUrl: `${AHOLO_OSS_BASE}/juguo/voxel/309eccc1/collision.voxel.bin`,
    splatCountLabel: "41.8M splats · chunk-LOD",
    pose: {
      px: -20.398,
      py: 0.39,
      pz: 62.774,
      lookAt: [-21.4, 0.3, 60.3],
      yaw: 0.384,
      pitch: 0.06,
      thirdPersonDistance: 3.6,
      up: [0, -1, 0],
    },
    defaultHeroAssetId: "aegis-guardian-mech",
    defaultActorId: "lux3d",
    defaultKeyframes: [
      {
        id: "kf-plaza-1",
        label: "Aerial plaza descent",
        labelZh: "广场航拍下降",
        position: [-21.5, -1.65, 64.6],
        target: [-21.6, 0.3, 60.6],
        durationSec: 3.5,
        luxrealPrompt:
          "Sweeping drone crane shot descending into a massive photorealistic 3DGS urban plaza with crisp architectural detail",
      },
      {
        id: "kf-plaza-2",
        label: "Drone reveal",
        labelZh: "无人机亮相",
        position: [-21.4, 0.1, 62.3],
        target: [-22.85, 0.2, 59.9],
        durationSec: 3.0,
        luxrealPrompt:
          "Dynamic hero orbit around the Aegis-IX patrol drone as its ballistic shield wings deploy and LiDAR halo spins",
      },
    ],
  },
  {
    id: "huochezhan-concourse",
    code: "WORLD-03",
    title: "Grand Transit Concourse",
    titleZh: "交通枢纽大厅",
    subtitle: "Rail concourse · 32.7M-splat chunk-LOD stream · .sog environment",
    category: "Architecture",
    sourceEngine: "Hosted chunk-LOD stream + .sog environment",
    splatMode: "lod",
    lodMetaUrl: `${AHOLO_OSS_BASE}/huochezhan/chunk-lod/6b077ba2/lod-meta.json`,
    envSplatUrl: `${AHOLO_OSS_BASE}/misc/home-interaction-env.73524ff2.sog`,
    lodBudgetSplats: 3_500_000,
    splatCountLabel: "32.7M splats · chunk-LOD",
    pose: {
      px: -0.98,
      py: -1.75,
      pz: 2.29,
      lookAt: [-0.85, -1.45, 0.3],
      yaw: -0.03,
      pitch: 0.118,
      thirdPersonDistance: 3.0,
      up: [0, -1, 0],
    },
    defaultHeroAssetId: "chrono-holo-kiosk",
    defaultActorId: "lux3d",
    defaultKeyframes: [
      {
        id: "kf-station-1",
        label: "Concourse sweep",
        labelZh: "大厅横扫",
        position: [-0.98, -1.75, 2.29],
        target: [-0.85, -1.45, 0.4],
        durationSec: 3.5,
        luxrealPrompt:
          "Wide anamorphic architectural glide through a grand transit hall with volumetric light beams and 3DGS reflections",
      },
      {
        id: "kf-station-2",
        label: "Terminal inspection",
        labelZh: "终端近观",
        position: [-0.45, -1.55, 1.35],
        target: [-1.45, -1.35, 0.1],
        durationSec: 3.0,
        luxrealPrompt:
          "Close-up product focus on the ChronoGate interactive wayfinding terminal as its holographic ring rotates",
      },
    ],
  },
  {
    id: "sculpted-bear-studio",
    code: "WORLD-04",
    title: "Object Turntable",
    titleZh: "物体转台",
    subtitle: "Object capture · .sog splat",
    category: "Object",
    sourceEngine: "Hosted .sog object capture",
    splatMode: "direct",
    primarySplatUrl: `${AHOLO_OSS_BASE}/bear/bear.3d71a266.sog`,
    splatCountLabel: "971K splats · .sog",
    pose: {
      px: -1.5,
      py: -0.5,
      pz: 0.0,
      lookAt: [0, 0, 0],
      yaw: -1.57,
      pitch: 0.15,
      thirdPersonDistance: 3.0,
      up: [0, -1, 0],
    },
    actorSpot: [1.0, 0.75],
    defaultHeroAssetId: "cyber-barista-station",
    defaultActorId: "lux3d",
    defaultKeyframes: [
      {
        id: "kf-bear-1",
        label: "Left 45° turntable",
        labelZh: "左 45° 转台",
        position: [-1.5, -0.5, 0.3],
        target: [0, 0, 0],
        durationSec: 2.5,
        luxrealPrompt: "Studio turntable product showcase of a sculpted 3DGS asset alongside a part-segmented mesh",
      },
      {
        id: "kf-bear-2",
        label: "Right 45° detail orbit",
        labelZh: "右 45° 细节环绕",
        position: [-1.2, -0.35, -0.85],
        target: [0, 0, 0],
        durationSec: 2.5,
        luxrealPrompt: "Smooth studio camera arc highlighting surface texture fidelity and part-split sub-mesh explosion",
      },
    ],
  },
  {
    id: "spatialgen-coffee-bar",
    code: "WORLD-05",
    title: "Coffee Bar · SpatialGen",
    titleZh: "咖啡吧 · SpatialGen",
    subtitle: "Generated from one prompt with Aholo SpatialGen (world 3FO4K4V99KMD)",
    category: "Indoor",
    sourceEngine: "Aholo SpatialGen · world.generations.create",
    splatMode: "direct",
    primarySplatUrl: "/assets/spatialgen/coffee-bar.spz",
    splatCountLabel: "267K splats · SpatialGen",
    upAxis: "z",
    // floor plane measured at z = -1.15 in the generated splat (-> +1.15 in the stage frame)
    floorY: 1.15,
    actorSpot: [-0.3, 0.45],
    pose: {
      px: -2.5,
      py: 0,
      pz: 0,
      lookAt: [0.5, 0.1, 0],
      yaw: -1.5708,
      pitch: 0.08,
      thirdPersonDistance: 3.6,
      up: [0, -1, 0],
    },
    defaultHeroAssetId: "cyber-barista-station",
    defaultActorId: "lux3d",
    defaultKeyframes: [
      {
        id: "kf-cafe-1",
        label: "Wide from the window",
        labelZh: "窗边全景",
        position: [-3.4, -0.1, 1.2],
        target: [0.3, 0.2, -0.2],
        durationSec: 3,
        luxrealPrompt: "Slow wide dolly across a Scandinavian coffee bar generated with SpatialGen, morning light",
      },
      {
        id: "kf-cafe-2",
        label: "Push in to the counter",
        labelZh: "推近吧台",
        position: [-1.9, 0.1, 0.4],
        target: [0.4, 0.3, 0.0],
        durationSec: 3,
        luxrealPrompt: "Push-in toward the oak counter as the barista character walks to the espresso machine",
      },
      {
        id: "kf-cafe-3",
        label: "Espresso close-up",
        labelZh: "咖啡机特写",
        position: [-1.6, 0.45, -0.4],
        target: [-1.25, 0.95, -0.45],
        durationSec: 3,
        luxrealPrompt: "Low close-up of the articulated espresso machine opening its hood, shallow depth of field",
      },
    ],
  },
];
