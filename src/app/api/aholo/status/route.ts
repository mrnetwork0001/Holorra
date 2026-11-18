import { NextRequest, NextResponse } from "next/server";
import { AHOLO_SDK_TELEMETRY, resolveAholoContext } from "@/lib/aholo-server";
import { quotaSummary } from "@/lib/usage-guard";

export const dynamic = "force-dynamic";
import { AHOLO_WORLD_PRESETS, AHOLO_RIGGED_ACTORS, LUX3D_HERO_BLUEPRINTS } from "@/config/aholo-presets";

export async function GET(req: NextRequest) {
  const ctx = resolveAholoContext(req);

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    sdk: AHOLO_SDK_TELEMETRY,
    auth: {
      hasApiKey: ctx.hasApiKey,
      keySource: ctx.keySource,
      region: ctx.region,
      gatewayUrl: ctx.gatewayUrl,
      mode: ctx.hasApiKey ? "LIVE_AHOLO_CLOUD_API" : "VERIFIED_MANYCORE_CDN_STAGE",
    },
    // free live jobs on the server's key; a visitor's own key is not limited
    freeLiveJobs: ctx.keySource === "env" ? quotaSummary() : null,
    counts: {
      worldPresets: AHOLO_WORLD_PRESETS.length,
      heroBlueprints: Object.keys(LUX3D_HERO_BLUEPRINTS).length,
      riggedActors: Object.keys(AHOLO_RIGGED_ACTORS).length,
      humanoidAnimationPresets: AHOLO_SDK_TELEMETRY.humanoidAnimationCount,
    },
  });
}
