import type { HumanoidAnimationId } from "@manycore/aholo-sdk-lux3d";

export type { HumanoidAnimationId };

export const HUMANOID_ANIMATION_IDS: readonly HumanoidAnimationId[] = [
  "A_TPose", "Dance_Loop", "Idle_Rail_Call", "Idle_TalkingPhone_Loop", "Idle_Talking_Loop",
  "Yes", "Crouch_Idle_Loop", "Idle_FoldArms_Loop", "Idle_Lantern_Loop", "Idle_Loop",
  "Idle_No_Loop", "Idle_Rail_Loop", "Idle_Torch_Loop", "ClimbUp_1m", "Crouch_Fwd_Loop",
  "Jog_Fwd_Loop", "Sprint_Loop", "Swim_Fwd_Loop", "Swim_Idle_Loop", "Walk_Formal_Loop",
  "Walk_Loop", "Jump_Land", "Jump_Loop", "Jump_Start", "NinjaJump_Idle_Loop",
  "NinjaJump_Land", "NinjaJump_Start", "Roll", "Slide_Exit", "Slide_Loop",
  "Slide_Start", "Sword_Attack", "Sword_Block", "Sword_Dash", "Sword_Heavy_Combo",
  "Sword_Idle", "Sword_Regular_A", "Sword_Regular_A_Rec", "Sword_Regular_B", "Sword_Regular_B_Rec",
  "Sword_Regular_C", "Sword_Regular_Combo", "Idle_Shield_Break", "Idle_Shield_Loop", "Shield_Dash",
  "Shield_OneShot", "Melee_Hook", "Melee_Hook_Rec", "Punch_Cross", "Punch_Jab",
  "Pistol_Aim_Down", "Pistol_Aim_Neutral", "Pistol_Aim_Up", "Pistol_Idle_Loop", "Pistol_Reload",
  "Pistol_Shoot", "Spell_Simple_Enter", "Spell_Simple_Exit", "Spell_Simple_Idle_Loop", "Spell_Simple_Shoot",
  "Chest_Open", "Consume", "Driving_Loop", "Farm_Harvest", "Farm_PlantSeed",
  "Farm_Watering", "Fixing_Kneeling", "Interact", "OverhandThrow", "PickUp_Table",
  "Push_Loop", "TreeChopping_Loop", "Walk_Carry_Loop", "LayToIdle", "Sitting_Enter",
  "Sitting_Exit", "Sitting_Idle_Loop", "Sitting_Talking_Loop", "Death01", "Hit_Chest",
  "Hit_Head", "Hit_Knockback", "Zombie_Idle_Loop", "Zombie_Scratch", "Zombie_Walk_Fwd_Loop",
] as const;

export interface HumanoidAnimationCategoryGroup {
  id: string;
  label: string;
  badgeColor: string;
  description: string;
  clips: {
    id: HumanoidAnimationId;
    label: string;
    loop: boolean;
    recommendedUse: string;
  }[];
}

export const HUMANOID_ANIMATION_GROUPS: HumanoidAnimationCategoryGroup[] = [
  {
    id: "locomotion",
    label: "Locomotion & Traversal",
    badgeColor: "#10B981",
    description: "Core walk, jog, sprint, crouch, swim, and climb loops for interactive 3DGS world exploration.",
    clips: [
      { id: "Idle_Loop", label: "Natural Idle Loop", loop: true, recommendedUse: "Default standing pose" },
      { id: "Walk_Loop", label: "Standard Walk Loop", loop: true, recommendedUse: "WASD third-person walk" },
      { id: "Walk_Formal_Loop", label: "Formal Stride Loop", loop: true, recommendedUse: "Architectural walkthrough" },
      { id: "Jog_Fwd_Loop", label: "Forward Jog Loop", loop: true, recommendedUse: "Medium-speed exploration" },
      { id: "Sprint_Loop", label: "Full Sprint Loop", loop: true, recommendedUse: "Large outdoor plaza traversal" },
      { id: "Crouch_Idle_Loop", label: "Stealth Crouch Idle", loop: true, recommendedUse: "Low clearance inspection" },
      { id: "Crouch_Fwd_Loop", label: "Stealth Crouch Walk", loop: true, recommendedUse: "Tactical indoor movement" },
      { id: "Walk_Carry_Loop", label: "Carry Object Walk", loop: true, recommendedUse: "Logistics & warehouse sim" },
      { id: "ClimbUp_1m", label: "1m Ledge Climb Up", loop: false, recommendedUse: "Vertical obstacle traversal" },
      { id: "Swim_Idle_Loop", label: "Water Tread Idle", loop: true, recommendedUse: "Aquatic scene idle" },
      { id: "Swim_Fwd_Loop", label: "Forward Swim Stroke", loop: true, recommendedUse: "Aquatic scene locomotion" },
    ],
  },
  {
    id: "parkour",
    label: "Parkour & Acrobatics",
    badgeColor: "#00F0FF",
    description: "Dynamic jump arcs, ninja vaults, combat rolls, and floor slides.",
    clips: [
      { id: "Jump_Start", label: "Jump Launch", loop: false, recommendedUse: "Spacebar jump takeoff" },
      { id: "Jump_Loop", label: "Mid-Air Fall Loop", loop: true, recommendedUse: "Airborne state" },
      { id: "Jump_Land", label: "Soft Jump Landing", loop: false, recommendedUse: "Ground contact recovery" },
      { id: "NinjaJump_Start", label: "Acrobatic Ninja Vault", loop: false, recommendedUse: "High-energy game trailer" },
      { id: "NinjaJump_Idle_Loop", label: "Mid-Air Ninja Pose", loop: true, recommendedUse: "Stylized aerial freeze" },
      { id: "NinjaJump_Land", label: "Three-Point Hero Landing", loop: false, recommendedUse: "Cinematic hero entrance" },
      { id: "Roll", label: "Tactical Forward Roll", loop: false, recommendedUse: "Evasive action sequence" },
      { id: "Slide_Start", label: "Low Slide Entry", loop: false, recommendedUse: "Fast corridor slide" },
      { id: "Slide_Loop", label: "Continuous Floor Slide", loop: true, recommendedUse: "Slope slide motion" },
      { id: "Slide_Exit", label: "Slide to Stand Recovery", loop: false, recommendedUse: "Transition to sprint" },
    ],
  },
  {
    id: "social",
    label: "Social, Dialogue & Acting",
    badgeColor: "#FFB800",
    description: "Expressive acting clips for LuxReal AI film blocking, interior staging, and NPCs.",
    clips: [
      { id: "Dance_Loop", label: "Celebration Dance Loop", loop: true, recommendedUse: "Community showcase highlight" },
      { id: "Idle_Talking_Loop", label: "Expressive Dialogue Loop", loop: true, recommendedUse: "LuxReal character cutscene" },
      { id: "Idle_TalkingPhone_Loop", label: "Phone Call Gesture", loop: true, recommendedUse: "Urban street NPC" },
      { id: "Yes", label: "Affirmative Head Nod", loop: false, recommendedUse: "Interactive agent response" },
      { id: "Idle_No_Loop", label: "Disagree Gesture", loop: true, recommendedUse: "Dialog branching cue" },
      { id: "Idle_FoldArms_Loop", label: "Crossed Arms Stance", loop: true, recommendedUse: "Director/guard posture" },
      { id: "Idle_Rail_Loop", label: "Balcony Rail Lean", loop: true, recommendedUse: "Loft & mezzanine staging" },
      { id: "Idle_Rail_Call", label: "Wave from Balcony", loop: false, recommendedUse: "Establishing shot focal point" },
      { id: "Idle_Lantern_Loop", label: "Hold Lantern Pose", loop: true, recommendedUse: "Atmospheric night lighting" },
      { id: "Idle_Torch_Loop", label: "Hold Torch High", loop: true, recommendedUse: "Dungeon / cavern exploration" },
      { id: "Sitting_Enter", label: "Sit Down on Chair", loop: false, recommendedUse: "Furniture scale verification" },
      { id: "Sitting_Idle_Loop", label: "Seated Relaxed Loop", loop: true, recommendedUse: "Interior furniture staging" },
      { id: "Sitting_Talking_Loop", label: "Seated Conversation", loop: true, recommendedUse: "Podcast / café scene" },
      { id: "Sitting_Exit", label: "Stand Up from Chair", loop: false, recommendedUse: "Scene transition" },
      { id: "LayToIdle", label: "Wake Up & Stand", loop: false, recommendedUse: "Story opening shot" },
      { id: "A_TPose", label: "Calibration A/T-Pose", loop: true, recommendedUse: "Bone & weight inspection" },
    ],
  },
  {
    id: "interaction",
    label: "Object Interaction & Work",
    badgeColor: "#38BDF8",
    description: "Paired actions designed to interact with Lux3D part-split and articulated props.",
    clips: [
      { id: "Interact", label: "Touch / Activate Console", loop: false, recommendedUse: "Trigger part-split appliance" },
      { id: "Chest_Open", label: "Open Articulated Lid", loop: false, recommendedUse: "Paired with articulationAnimation" },
      { id: "PickUp_Table", label: "Grasp Tabletop Item", loop: false, recommendedUse: "Embodied task preview" },
      { id: "Push_Loop", label: "Heavy Object Push", loop: true, recommendedUse: "Physics interaction demo" },
      { id: "Driving_Loop", label: "Vehicle Steering Loop", loop: true, recommendedUse: "Cockpit / mech piloting" },
      { id: "Fixing_Kneeling", label: "Kneeling Maintenance", loop: true, recommendedUse: "Robotics technician scene" },
      { id: "Consume", label: "Drink / Consume Item", loop: false, recommendedUse: "Smart kitchen / café demo" },
      { id: "OverhandThrow", label: "Overhand Throw", loop: false, recommendedUse: "Dynamic projectile action" },
      { id: "Farm_PlantSeed", label: "Planting Gesture", loop: false, recommendedUse: "Simulation world building" },
      { id: "Farm_Watering", label: "Watering Cycle", loop: false, recommendedUse: "Eco-habitat scene" },
      { id: "Farm_Harvest", label: "Harvest Gathering", loop: false, recommendedUse: "Resource collection" },
      { id: "TreeChopping_Loop", label: "Tool Swing Loop", loop: true, recommendedUse: "Crafting game prototype" },
    ],
  },
  {
    id: "combat",
    label: "Combat, Melee, Ranged & Magic",
    badgeColor: "#FF4D6D",
    description: "Full game-ready combat state machine retargetable to any Lux3D humanoid.",
    clips: [
      { id: "Sword_Idle", label: "Blade Ready Stance", loop: true, recommendedUse: "Action RPG idle" },
      { id: "Sword_Attack", label: "Quick Slash", loop: false, recommendedUse: "Primary light attack" },
      { id: "Sword_Heavy_Combo", label: "3-Hit Heavy Finisher", loop: false, recommendedUse: "Hero trailer highlight" },
      { id: "Sword_Regular_Combo", label: "Fluid Blade Combo", loop: false, recommendedUse: "Gameplay showcase" },
      { id: "Sword_Regular_A", label: "Slash Strike A", loop: false, recommendedUse: "Chain step 1" },
      { id: "Sword_Regular_A_Rec", label: "Strike A Recovery", loop: false, recommendedUse: "Chain recovery 1" },
      { id: "Sword_Regular_B", label: "Slash Strike B", loop: false, recommendedUse: "Chain step 2" },
      { id: "Sword_Regular_B_Rec", label: "Strike B Recovery", loop: false, recommendedUse: "Chain recovery 2" },
      { id: "Sword_Regular_C", label: "Slash Finisher C", loop: false, recommendedUse: "Chain step 3" },
      { id: "Sword_Block", label: "Parry Deflect", loop: false, recommendedUse: "Defensive reaction" },
      { id: "Sword_Dash", label: "Lunge Dash Strike", loop: false, recommendedUse: "Gap closer" },
      { id: "Idle_Shield_Loop", label: "Shield Guard Loop", loop: true, recommendedUse: "Defensive stance" },
      { id: "Shield_Dash", label: "Shield Bash Charge", loop: false, recommendedUse: "Crowd control" },
      { id: "Shield_OneShot", label: "Shield Counter Slam", loop: false, recommendedUse: "Counterattack" },
      { id: "Idle_Shield_Break", label: "Guard Broken Stagger", loop: false, recommendedUse: "Impact physics feedback" },
      { id: "Punch_Jab", label: "Quick Left Jab", loop: false, recommendedUse: "Brawler combo start" },
      { id: "Punch_Cross", label: "Heavy Right Cross", loop: false, recommendedUse: "Brawler power hit" },
      { id: "Melee_Hook", label: "Wide Hook Swing", loop: false, recommendedUse: "Close-quarters combat" },
      { id: "Melee_Hook_Rec", label: "Hook Follow-Through", loop: false, recommendedUse: "Recovery frame" },
      { id: "Pistol_Idle_Loop", label: "Tactical Sidearm Idle", loop: true, recommendedUse: "Cyberpunk / sci-fi actor" },
      { id: "Pistol_Aim_Neutral", label: "Aim Level Target", loop: true, recommendedUse: "Over-the-shoulder camera" },
      { id: "Pistol_Aim_Up", label: "Aim High Elevation", loop: true, recommendedUse: "Vertical target tracking" },
      { id: "Pistol_Aim_Down", label: "Aim Low Angle", loop: true, recommendedUse: "Balcony defense" },
      { id: "Pistol_Shoot", label: "Recoil Fire Shot", loop: false, recommendedUse: "Action sequence" },
      { id: "Pistol_Reload", label: "Tactical Magazine Reload", loop: false, recommendedUse: "Combat pause beat" },
      { id: "Spell_Simple_Enter", label: "Channel Arcane Energy", loop: false, recommendedUse: "Fantasy VFX cue" },
      { id: "Spell_Simple_Idle_Loop", label: "Levitate Spell Ready", loop: true, recommendedUse: "Caster idle" },
      { id: "Spell_Simple_Shoot", label: "Cast Energy Bolt", loop: false, recommendedUse: "Projectile trigger" },
      { id: "Spell_Simple_Exit", label: "Disperse Aura", loop: false, recommendedUse: "Return to idle" },
    ],
  },
  {
    id: "damage",
    label: "Impact Reactions & Creatures",
    badgeColor: "#A855F7",
    description: "Hit reactions, knockbacks, and stylized creature locomotion.",
    clips: [
      { id: "Hit_Chest", label: "Torso Impact Flinch", loop: false, recommendedUse: "Combat hit feedback" },
      { id: "Hit_Head", label: "Head Snap Stagger", loop: false, recommendedUse: "Critical hit feedback" },
      { id: "Hit_Knockback", label: "Heavy Blast Knockback", loop: false, recommendedUse: "Explosion wave reaction" },
      { id: "Death01", label: "Dramatic Collapse", loop: false, recommendedUse: "Boss defeat sequence" },
      { id: "Zombie_Idle_Loop", label: "Shambling Creature Idle", loop: true, recommendedUse: "Horror / survival NPC" },
      { id: "Zombie_Walk_Fwd_Loop", label: "Shambling Creature Walk", loop: true, recommendedUse: "Horde pathfinding" },
      { id: "Zombie_Scratch", label: "Creature Claw Swipe", loop: false, recommendedUse: "Enemy melee attack" },
    ],
  },
];

export interface AholoMcpToolSpec {
  name: string;
  module: "World (SpatialGen & Reality)" | "Lux3D Generation" | "Lux3D Part-Split & Rigging" | "Asset & Tasks";
  sdkMethod: string;
  description: string;
  sampleArgs: Record<string, unknown>;
}

export const AHOLO_MCP_TOOL_CATALOG: AholoMcpToolSpec[] = [
  {
    name: "world_generate",
    module: "World (SpatialGen & Reality)",
    sdkMethod: "world.generations.create",
    description: "Generate a 3D Gaussian Splatting (3DGS) world from a text prompt and/or single reference image via Aholo SpatialGen.",
    sampleArgs: {
      prompt: "Futuristic glass conservatory studio overlooking a neon cyberpunk skyline at dusk",
      region: "com",
    },
  },
  {
    name: "world_reconstruct_space",
    module: "World (SpatialGen & Reality)",
    sdkMethod: "world.reconstructions.create (scene='space')",
    description: "Reconstruct a full indoor or outdoor 3DGS environment from video (.mp4/.mov), Insta360 (.insv), or >=20 photos via Aholo Reality.",
    sampleArgs: {
      name: "Coohom Smart Kitchen Capture",
      resources: [{ url: "https://example.com/your-walkthrough.mp4", type: "video" }],
      taskQuality: "high",
      scene: "space",
    },
  },
  {
    name: "world_reconstruct_object",
    module: "World (SpatialGen & Reality)",
    sdkMethod: "world.reconstructions.create (scene='model')",
    description: "Reconstruct a real-world physical product or sculpture into a high-density 3DGS model with foreground mask segmentation.",
    sampleArgs: {
      name: "Artisan Ceramic Vase Scan",
      resources: [{ url: "https://example.com/your-turntable.mp4", type: "video" }],
      useMask: true,
      taskQuality: "high",
      scene: "model",
    },
  },
  {
    name: "world_get",
    module: "World (SpatialGen & Reality)",
    sdkMethod: "world.retrieve",
    description: "Fetch real-time progress (0.0-1.0) and output artifact URLs (.ply, .spz, AI panorama) for a SpatialGen or Reality worldId.",
    sampleArgs: { worldId: "wld_98f2a4c1e0" },
  },
  {
    name: "world_list",
    module: "World (SpatialGen & Reality)",
    sdkMethod: "world.list",
    description: "Paginate generated and reconstructed 3DGS worlds in the workspace.",
    sampleArgs: { pageNum: 0, pageSize: 20 },
  },
  {
    name: "lux3d_text_to_3d",
    module: "Lux3D Generation",
    sdkMethod: "lux3d.textTo3d.create",
    description: "Generate a water-tight PBR 3D mesh (.glb / .zip) directly from a natural language description using G1 or G1-Turbo.",
    sampleArgs: {
      prompt: "Modular titanium espresso synthesizer with articulated top brew hood and glowing gauges",
      version: "G1-Turbo",
      outputFormat: ["glb", "zip"],
    },
  },
  {
    name: "lux3d_img_to_3d",
    module: "Lux3D Generation",
    sdkMethod: "lux3d.imgTo3d.create",
    description: "Convert a single reference image or multi-view image set into a 10k-300k polygon PBR 3D asset with AI size prediction.",
    sampleArgs: {
      img: "https://holorra.xyz/landing/lux3d/g1.jpg",
      version: "G1",
      faceCount: 200000,
      enablePbr: true,
      aiPredictSize: true,
      outputFormat: ["glb", "zip", "ply"],
    },
  },
  {
    name: "lux3d_image_to_four_view",
    module: "Lux3D Generation",
    sdkMethod: "lux3d.imageToFourView.create",
    description: "Synthesize a consistent 4-view orthographic character/prop sheet from a prompt or concept image before 3D generation.",
    sampleArgs: {
      prompt: "Autonomous courier robot with articulated cargo pod, orthographic turnaround",
    },
  },
  {
    name: "lux3d_multimodal_to_image",
    module: "Lux3D Generation",
    sdkMethod: "lux3d.multimodalToImage.create",
    description: "Generate studio-lit reference concept imagery optimized for downstream Lux3D reconstruction.",
    sampleArgs: {
      prompt: "Mid-century walnut armchair with brass pivot joints on a clean white studio backdrop",
    },
  },
  {
    name: "lux3d_part_split",
    module: "Lux3D Part-Split & Rigging",
    sdkMethod: "lux3d.partSplit.create",
    description: "Semantically segment a monolithic GLB model into independent, clean sub-meshes for part explosion, editing, or 3D printing.",
    sampleArgs: {
      glbUrl: "https://holo-cos.aholo3d.cn/aholo-opensource/gs_file/misc/robot.0765006a.glb",
    },
  },
  {
    name: "lux3d_articulation_animation",
    module: "Lux3D Part-Split & Rigging",
    sdkMethod: "lux3d.articulationAnimation.create",
    description: "Infer kinematic hinge/slider joints on a 3D object and animate functional opening/closing motion from a text prompt.",
    sampleArgs: {
      glbUrl: "https://holorra.xyz/assets/lux3d/espresso-g1.glb",
      prompt: "The upper brewing hood hinges upward 65 degrees while the front capsule drawer slides open",
    },
  },
  {
    name: "lux3d_humanoid_auto_rig",
    module: "Lux3D Part-Split & Rigging",
    sdkMethod: "lux3d.humanoidAutoRig.create",
    description: "Automatically compute a full humanoid skeleton and skinning weights on a static character GLB mesh.",
    sampleArgs: {
      modelUrl: "https://holo-cos.aholo3d.cn/aholo-opensource/gs_file/misc/man-final.755ce8ea.glb",
    },
  },
  {
    name: "lux3d_humanoid_animation_retarget",
    module: "Lux3D Part-Split & Rigging",
    sdkMethod: "lux3d.humanoidAnimationRetarget.create",
    description: "Retarget 1 to 10 animations from the 85 official Lux3D motion capture presets onto a rigged humanoid GLB/FBX.",
    sampleArgs: {
      rigModelUrl: "https://holo-cos.aholo3d.cn/aholo-opensource/gs_file/misc/robot.0765006a.glb",
      animationIds: ["Idle_Loop", "Walk_Loop", "Dance_Loop", "Sword_Heavy_Combo"],
      animationOutputMode: "combined",
      outFormat: "glb",
    },
  },
  {
    name: "lux3d_material_transfer",
    module: "Lux3D Part-Split & Rigging",
    sdkMethod: "lux3d.materialTransfer.create",
    description: "Transfer high-resolution PBR material appearance from a reference texture photo onto a target 3D GLB mesh (v3.0-standard).",
    sampleArgs: {
      img: "https://holorra.xyz/landing/world-cafe.jpg",
      meshUrl: "https://holorra.xyz/assets/lux3d/espresso-g1.glb",
      version: "v3.0-standard",
      outputFormat: ["glb", "usdz"],
      aiPredictSize: false,
      customSize: 120,
    },
  },
  {
    name: "lux3d_multi_format_export",
    module: "Asset & Tasks",
    sdkMethod: "lux3d.multiFormatExport.create",
    description: "Convert a Lux3D model into industry CAD, AR, game engine, and 3D-printing formats (USDZ, OBJ, FBX, STL, 3MF).",
    sampleArgs: {
      modelUrl: "https://holorra.xyz/assets/lux3d/espresso-g1.glb",
      outputFormat: ["usdz", "fbx_zip", "obj_zip", "stl", "3mf"],
    },
  },
  {
    name: "upload_asset",
    module: "Asset & Tasks",
    sdkMethod: "assetClient.uploadFile",
    description: "Stage a local image, video, .insv panorama, or .glb mesh directly to Manycore's CDN for downstream Aholo tasks.",
    sampleArgs: {
      localPath: "./captures/studio-reference.png",
      region: "com",
    },
  },
  {
    name: "lux3d_get_task",
    module: "Asset & Tasks",
    sdkMethod: "lux3d.tasks.retrieve",
    description: "Retrieve status (0=init, 1=running, 3=success, 4=failed) and output CDN download URLs for any Lux3D taskId.",
    sampleArgs: { taskId: 8841209 },
  },
];
