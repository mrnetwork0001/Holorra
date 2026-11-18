import { NextRequest, NextResponse } from "next/server";
import {
  HUMANOID_ANIMATION_IDS,
  type HumanoidAnimationId,
} from "@manycore/aholo-sdk-lux3d";
import { getLux3dClient, resolveAholoContext } from "@/lib/aholo-server";
import { AHOLO_RIGGED_ACTORS, LUX3D_HERO_BLUEPRINTS } from "@/config/aholo-presets";

const HUMANOID_ANIMATION_ID_SET = new Set<string>(HUMANOID_ANIMATION_IDS);

export type Lux3dOperationType =
  | "textTo3d"
  | "imgTo3d"
  | "imageToFourView"
  | "multimodalToImage"
  | "partSplit"
  | "articulationAnimation"
  | "humanoidAutoRig"
  | "humanoidAnimationRetarget"
  | "materialTransfer"
  | "multiFormatExport";

export async function POST(req: NextRequest) {
  const ctx = resolveAholoContext(req);
  const body = await req.json();
  const operation = body.operation as Lux3dOperationType;

  // Validate humanoidAnimationRetarget IDs against official @manycore/aholo-sdk-lux3d set
  if (operation === "humanoidAnimationRetarget") {
    const ids: string[] = Array.isArray(body.animationIds) ? body.animationIds : ["Idle_Loop"];
    const invalid = ids.filter((id) => !HUMANOID_ANIMATION_ID_SET.has(id));
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid Lux3D HumanoidAnimationId(s): ${invalid.join(", ")}`,
        },
        { status: 400 }
      );
    }
  }

  // 1. Live Aholo Lux3D Cloud Execution when AHOLO_API_KEY or x-aholo-api-key header is present
  // previewOnly: the client has no real input for this job (e.g. a procedural preview prop)
  if (ctx.hasApiKey && !body.previewOnly) {
    try {
      const lux3d = getLux3dClient(ctx);
      let taskId: number;
      let sdkMethod = "";

      switch (operation) {
        case "textTo3d":
          sdkMethod = "lux3d.textTo3d.create";
          taskId = await lux3d.textTo3d.create({
            prompt: body.prompt || "Modular smart espresso synthesizer with articulated titanium hood",
            version: body.version === "G1" ? "G1" : "G1-Turbo",
            outputFormat: body.outputFormat || ["glb", "zip"],
          });
          break;

        case "imgTo3d":
          sdkMethod = "lux3d.imgTo3d.create";
          taskId = await lux3d.imgTo3d.create({
            img: body.img,
            version: body.version === "G1" ? "G1" : "G1-Turbo",
            faceCount: Number(body.faceCount) || 200_000,
            outputFormat: body.outputFormat || ["glb", "zip", "ply"],
            enablePbr: body.enablePbr !== false,
            aiPredictSize: body.aiPredictSize !== false,
          });
          break;

        case "imageToFourView":
          sdkMethod = "lux3d.imageToFourView.create";
          taskId = await lux3d.imageToFourView.create(
            body.img ? { img: body.img, prompt: body.prompt } : { prompt: body.prompt }
          );
          break;

        case "multimodalToImage":
          sdkMethod = "lux3d.multimodalToImage.create";
          taskId = await lux3d.multimodalToImage.create(
            body.img ? { img: body.img, prompt: body.prompt } : { prompt: body.prompt }
          );
          break;

        case "partSplit":
          sdkMethod = "lux3d.partSplit.create";
          taskId = await lux3d.partSplit.create({
            glbUrl: body.glbUrl,
          });
          break;

        case "articulationAnimation":
          sdkMethod = "lux3d.articulationAnimation.create";
          taskId = await lux3d.articulationAnimation.create({
            glbUrl: body.glbUrl,
            prompt: body.prompt || "The top cover hinges open 65 degrees while the front drawer slides out",
          });
          break;

        case "humanoidAutoRig":
          sdkMethod = "lux3d.humanoidAutoRig.create";
          taskId = await lux3d.humanoidAutoRig.create({
            modelUrl: body.modelUrl,
          });
          break;

        case "humanoidAnimationRetarget":
          sdkMethod = "lux3d.humanoidAnimationRetarget.create";
          taskId = await lux3d.humanoidAnimationRetarget.create({
            rigModelUrl: body.rigModelUrl || AHOLO_RIGGED_ACTORS.lux3d.sourceRigUrl,
            animationIds: (body.animationIds || ["Idle_Loop", "Walk_Loop"]) as HumanoidAnimationId[],
            animationOutputMode: body.animationOutputMode || "combined",
            outFormat: body.outFormat || "glb",
            animateInPlace: Boolean(body.animateInPlace),
          });
          break;

        case "materialTransfer":
          sdkMethod = "lux3d.materialTransfer.create";
          taskId = await lux3d.materialTransfer.create({
            img: body.img,
            meshUrl: body.meshUrl,
            version: "v3.0-standard",
            outputFormat: body.outputFormat || ["glb", "usdz"],
            aiPredictSize: Boolean(body.aiPredictSize),
            customSize: Number(body.customSize) || 120,
          });
          break;

        case "multiFormatExport":
          sdkMethod = "lux3d.multiFormatExport.create";
          taskId = await lux3d.multiFormatExport.create({
            modelUrl: body.modelUrl,
            outputFormat: body.outputFormat || ["usdz", "fbx_zip", "obj_zip", "stl", "3mf"],
          });
          break;

        default:
          return NextResponse.json({ ok: false, error: `Unknown operation: ${operation}` }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        executionMode: "LIVE_AHOLO_CLOUD_SDK",
        sdkPackage: "@manycore/aholo-sdk-lux3d@1.10.0",
        sdkMethod,
        region: ctx.region,
        gatewayUrl: ctx.gatewayUrl,
        taskId,
        status: 1, // running
      });
    } catch (err: unknown) {
      return NextResponse.json(
        {
          ok: false,
          sdkPackage: "@manycore/aholo-sdk-lux3d@1.10.0",
          error: err instanceof Error ? err.message : "Aholo Lux3D API call failed",
        },
        { status: 400 }
      );
    }
  }

  // 2. Zero-Wait Stage Pre-Baked Execution when no API key is configured
  const promptText = String(body.prompt || "").toLowerCase();
  const matchedBlueprint =
    promptText.includes("drone") || promptText.includes("mech") || promptText.includes("turret")
      ? LUX3D_HERO_BLUEPRINTS["aegis-guardian-mech"]
      : promptText.includes("kiosk") || promptText.includes("terminal") || promptText.includes("holo")
        ? LUX3D_HERO_BLUEPRINTS["chrono-holo-kiosk"]
        : LUX3D_HERO_BLUEPRINTS["cyber-barista-station"];

  const sdkMethodMap: Record<Lux3dOperationType, string> = {
    textTo3d: "lux3d.textTo3d.create",
    imgTo3d: "lux3d.imgTo3d.create",
    imageToFourView: "lux3d.imageToFourView.create",
    multimodalToImage: "lux3d.multimodalToImage.create",
    partSplit: "lux3d.partSplit.create",
    articulationAnimation: "lux3d.articulationAnimation.create",
    humanoidAutoRig: "lux3d.humanoidAutoRig.create",
    humanoidAnimationRetarget: "lux3d.humanoidAnimationRetarget.create",
    materialTransfer: "lux3d.materialTransfer.create",
    multiFormatExport: "lux3d.multiFormatExport.create",
  };

  return NextResponse.json({
    ok: true,
    executionMode: "INSTANT_STAGE_BLUEPRINT",
    sdkPackage: "@manycore/aholo-sdk-lux3d@1.10.0",
    sdkMethod: sdkMethodMap[operation] || "lux3d.textTo3d.create",
    taskId: Math.floor(8_900_000 + Math.random() * 99_000),
    status: 3, // LUX3D_STATUS_SUCCESS
    matchedBlueprintId: matchedBlueprint.id,
    blueprint: matchedBlueprint,
    retargetedAnimations: body.animationIds || ["Idle_Loop", "Walk_Loop"],
    exportedFormats: body.outputFormat || ["glb", "usdz", "fbx_zip", "stl", "3mf"],
    note: "Executed instant in-stage blueprint preview. Add AHOLO_API_KEY in the top bar or .env.local to dispatch live cloud jobs to api.aholo.ai.",
  });
}
