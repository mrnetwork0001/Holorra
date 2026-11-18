import type { ActorId } from "@/config/aholo-presets";
import { AHOLO_RIGGED_ACTORS } from "@/config/aholo-presets";
import { NextRequest, NextResponse } from "next/server";
import { type HumanoidAnimationId } from "@manycore/aholo-sdk-lux3d";

export interface McpDirectorStep {
  step: number;
  mcpTool: string;
  sdkMethod: string;
  arguments: Record<string, unknown>;
  rationale: string;
}

export interface DirectorStageMutation {
  switchWorldPresetId?: string;
  switchHeroBlueprintId?: string;
  explodePercent?: number;
  articulateActive?: boolean;
  switchActorId?: ActorId;
  triggerAnimationId?: HumanoidAnimationId;
  cameraMode?: "orbit" | "walk-third" | "walk-first" | "spline";
  playCameraSpline?: boolean;
}

/** 中文 keywords → the English words the deterministic planner already understands. */
const ZH_KEYWORDS: [RegExp, string][] = [
  [/广场|户外|城市|街道/, "plaza outdoor"],
  [/车站|火车站|交通|大厅|枢纽/, "station concourse"],
  [/公寓|房间|室内|厨房|客厅/, "loft indoor"],
  [/无人机|机甲/, "drone"],
  [/导览|终端|服务台/, "kiosk terminal"],
  [/咖啡|意式|家电/, "espresso coffee"],
  [/拆分|爆炸|部件|拆开/, "split explode"],
  [/打开|开启|铰链|抽屉|顶盖|关节/, "open articulate"],
  [/角色|人物|演员|人形|机器人/, "actor"],
  [/跳舞|舞蹈|庆祝|欢呼/, "dance"],
  [/剑|战斗|攻击/, "sword"],
  [/跳跃|忍者/, "jump"],
  [/冲刺|奔跑/, "sprint"],
  [/走|行走|巡逻/, "walk"],
  [/说话|对话|交谈/, "talk"],
  [/修理|维修/, "fix"],
  [/镜头|运镜|飞行|电影|预告片/, "camera cinematic"],
  [/第三人称/, "third"],
];

function zhKeywords(prompt: string): string {
  return ZH_KEYWORDS.filter(([re]) => re.test(prompt))
    .map(([, en]) => ` ${en}`)
    .join("");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt = String(body.prompt || "").trim();
  // Chinese briefs (中文) map onto the same English keywords the planner matches below
  const lower = (prompt + zhKeywords(prompt)).toLowerCase();

  const steps: McpDirectorStep[] = [];
  const mutation: DirectorStageMutation = {};

  // 1. World / SpatialGen intent
  if (lower.includes("plaza") || lower.includes("outdoor") || lower.includes("urban") || lower.includes("city")) {
    mutation.switchWorldPresetId = "juguo-urban-plaza";
    steps.push({
      step: steps.length + 1,
      mcpTool: "world_generate",
      sdkMethod: "world.generations.create",
      arguments: {
        prompt: "Photorealistic 6M-splat urban architectural plaza with skylight reflections",
        region: "com",
      },
      rationale: "Generate & stream the Juguo Urban Plaza 6M Chunk-LOD 3DGS world in @manycore/aholo-viewer.",
    });
  } else if (lower.includes("station") || lower.includes("transit") || lower.includes("concourse")) {
    mutation.switchWorldPresetId = "huochezhan-concourse";
    steps.push({
      step: steps.length + 1,
      mcpTool: "world_reconstruct_space",
      sdkMethod: "world.reconstructions.create",
      arguments: {
        name: "Grand Transit Concourse LOD",
        taskQuality: "high",
        scene: "space",
      },
      rationale: "Switch stage to the multi-level Chunk-LOD Grand Transit Concourse 3DGS environment.",
    });
  } else if (lower.includes("loft") || lower.includes("room") || lower.includes("indoor") || lower.includes("kitchen")) {
    mutation.switchWorldPresetId = "smart-loft-indoor";
    steps.push({
      step: steps.length + 1,
      mcpTool: "world_generate",
      sdkMethod: "world.generations.create",
      arguments: {
        prompt: "Sunlit Scandinavian designer smart loft with open kitchen island",
        region: "com",
      },
      rationale: "Load the Designer Smart Loft .spz 3DGS scene + sparse octree voxel collision grid.",
    });
  }

  // 2. Hero Lux3D object intent
  if (lower.includes("drone") || lower.includes("mech") || lower.includes("turret") || lower.includes("aegis")) {
    mutation.switchHeroBlueprintId = "aegis-guardian-mech";
    steps.push({
      step: steps.length + 1,
      mcpTool: "lux3d_text_to_3d",
      sdkMethod: "lux3d.textTo3d.create",
      arguments: {
        prompt: "Aegis-IX autonomous patrol turret with articulated ballistic shield wings and orbital LiDAR halo",
        version: "G1",
        outputFormat: ["glb", "zip"],
      },
      rationale: "Synthesize the 242k-face Aegis-IX PBR hero asset via Lux3D G1.",
    });
  } else if (lower.includes("kiosk") || lower.includes("terminal") || lower.includes("wayfinding")) {
    mutation.switchHeroBlueprintId = "chrono-holo-kiosk";
    steps.push({
      step: steps.length + 1,
      mcpTool: "lux3d_text_to_3d",
      sdkMethod: "lux3d.textTo3d.create",
      arguments: {
        prompt: "ChronoGate architectural holo-terminal with rotating ring emitter and tilting display",
        version: "G1-Turbo",
        outputFormat: ["glb"],
      },
      rationale: "Synthesize the ChronoGate interactive terminal via Lux3D G1-Turbo.",
    });
  } else if (lower.includes("espresso") || lower.includes("coffee") || lower.includes("barista") || lower.includes("appliance")) {
    mutation.switchHeroBlueprintId = "cyber-barista-station";
    steps.push({
      step: steps.length + 1,
      mcpTool: "lux3d_text_to_3d",
      sdkMethod: "lux3d.textTo3d.create",
      arguments: {
        prompt: "Kinetix modular smart espresso synthesizer with brushed titanium chassis and hinged brew hood",
        version: "G1",
        outputFormat: ["glb", "zip"],
      },
      rationale: "Synthesize the Kinetix Modular Espresso Unit via Lux3D G1.",
    });
  }

  // 3. Part-Splitting & Articulation intent
  if (lower.includes("split") || lower.includes("explode") || lower.includes("part") || lower.includes("segment")) {
    const matchPct = prompt.match(/(\d{1,3})\s*%/);
    mutation.explodePercent = matchPct ? Math.min(100, Math.max(0, Number(matchPct[1]))) : 70;
    steps.push({
      step: steps.length + 1,
      mcpTool: "lux3d_part_split",
      sdkMethod: "lux3d.partSplit.create",
      arguments: {
        glbUrl: "https://labs.aholo.ai/stage/active-hero-model.glb",
      },
      rationale: `Semantically segment the hero GLB into independent sub-meshes and radially explode parts to ${mutation.explodePercent}%.`,
    });
  }

  if (lower.includes("open") || lower.includes("articulate") || lower.includes("hinge") || lower.includes("drawer")) {
    mutation.articulateActive = true;
    steps.push({
      step: steps.length + 1,
      mcpTool: "lux3d_articulation_animation",
      sdkMethod: "lux3d.articulationAnimation.create",
      arguments: {
        glbUrl: "https://labs.aholo.ai/stage/active-hero-model.glb",
        prompt: "Open the upper hinged hood 65 degrees and extend the front actuator drawer",
      },
      rationale: "Infer kinematic hinge & slider joints via lux3d.articulationAnimation.create and play real-time joint motion.",
    });
  }

  // 4. Rigged Actor & 85-Preset Animation Retarget intent
  if (/\b(human|man|woman|person|actor|character|robot|droid)\b/.test(lower)) {
    mutation.switchActorId = "lux3d";
  }

  let selectedAnim: HumanoidAnimationId | undefined;
  if (lower.includes("dance")) selectedAnim = "Dance_Loop";
  else if (lower.includes("sword") || lower.includes("combat") || lower.includes("attack")) selectedAnim = "Sword_Heavy_Combo";
  else if (lower.includes("ninja") || lower.includes("jump")) selectedAnim = "NinjaJump_Start";
  else if (lower.includes("sprint") || lower.includes("run")) selectedAnim = "Sprint_Loop";
  else if (lower.includes("walk") || lower.includes("patrol")) selectedAnim = "Walk_Loop";
  else if (lower.includes("talk") || lower.includes("dialog")) selectedAnim = "Idle_Talking_Loop";
  else if (lower.includes("fix") || lower.includes("repair")) selectedAnim = "Fixing_Kneeling";

  if (selectedAnim || mutation.switchActorId) {
    const clip = selectedAnim || "Walk_Loop";
    mutation.triggerAnimationId = clip;
    steps.push({
      step: steps.length + 1,
      mcpTool: "lux3d_humanoid_animation_retarget",
      sdkMethod: "lux3d.humanoidAnimationRetarget.create",
      arguments: {
        rigModelUrl: AHOLO_RIGGED_ACTORS.lux3d.sourceRigUrl,
        animationIds: [clip, "Idle_Loop"],
        animationOutputMode: "combined",
        outFormat: "glb",
      },
      rationale: `Retarget official Lux3D humanoid clip '${clip}' onto the rigged actor inside the 3DGS stage.`,
    });
  }

  // 5. Camera / Walk / LuxReal sequence intent
  if (lower.includes("fly") || lower.includes("camera") || lower.includes("luxreal") || lower.includes("cinematic") || lower.includes("trailer")) {
    mutation.playCameraSpline = true;
    mutation.cameraMode = "spline";
  } else if (lower.includes("third") || lower.includes("wasd")) {
    mutation.cameraMode = "walk-third";
  }

  // Default comprehensive showcase plan if prompt was general
  if (steps.length === 0) {
    mutation.explodePercent = 65;
    mutation.articulateActive = true;
    mutation.triggerAnimationId = "Dance_Loop";
    steps.push(
      {
        step: 1,
        mcpTool: "lux3d_part_split",
        sdkMethod: "lux3d.partSplit.create",
        arguments: { glbUrl: "https://labs.aholo.ai/stage/active-hero-model.glb" },
        rationale: "Split active Lux3D hero prop into 6 semantic sub-parts and set explosion to 65%.",
      },
      {
        step: 2,
        mcpTool: "lux3d_articulation_animation",
        sdkMethod: "lux3d.articulationAnimation.create",
        arguments: {
          glbUrl: "https://labs.aholo.ai/stage/active-hero-model.glb",
          prompt: "Open the articulated top hood and extend the front capsule tray",
        },
        rationale: "Activate kinematic joint articulation on the segmented sub-meshes.",
      },
      {
        step: 3,
        mcpTool: "lux3d_humanoid_animation_retarget",
        sdkMethod: "lux3d.humanoidAnimationRetarget.create",
        arguments: {
          rigModelUrl: AHOLO_RIGGED_ACTORS.lux3d.sourceRigUrl,
          animationIds: ["Dance_Loop", "Walk_Loop"],
          animationOutputMode: "combined",
          outFormat: "glb",
        },
        rationale: "Retarget Dance_Loop onto the rigged actor in the 3DGS scene.",
      }
    );
  }

  return NextResponse.json({
    ok: true,
    prompt,
    mcpServer: "@manycore/aholo-sdk-mcp@1.10.0",
    steps,
    mutation,
    summary: `Planned ${steps.length} Aholo MCP tool call(s) and updated the stage to match. Add an Aholo API key to run them live.`,
  });
}
