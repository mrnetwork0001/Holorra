import { createLux3dClient, HUMANOID_ANIMATION_IDS } from "@manycore/aholo-sdk-lux3d";
import { createWorldClient } from "@manycore/aholo-sdk-world";
import { createAssetClient } from "@manycore/aholo-sdk-asset";
import type { NextRequest } from "next/server";

export type AholoRegion = "com" | "cn";

export interface AholoClientContext {
  apiKey: string | undefined;
  hasApiKey: boolean;
  keySource: "header" | "env" | "none";
  region: AholoRegion;
  gatewayUrl: string;
}

export function resolveAholoContext(req?: NextRequest): AholoClientContext {
  const headerKey = req?.headers.get("x-aholo-api-key")?.trim();
  const envKey = process.env.AHOLO_API_KEY?.trim();
  const rawRegion = (req?.headers.get("x-aholo-region") || process.env.AHOLO_REGION || "com")
    .trim()
    .toLowerCase();
  const region: AholoRegion = rawRegion === "cn" ? "cn" : "com";

  const apiKey = headerKey || envKey || undefined;
  const keySource: AholoClientContext["keySource"] = headerKey
    ? "header"
    : envKey
      ? "env"
      : "none";

  return {
    apiKey,
    hasApiKey: Boolean(apiKey),
    keySource,
    region,
    gatewayUrl: region === "cn" ? "https://api.aholo.cn" : "https://api.aholo.ai",
  };
}

export function getLux3dClient(ctx: AholoClientContext) {
  if (!ctx.apiKey) {
    throw new Error("Missing AHOLO_API_KEY. Set AHOLO_API_KEY in .env.local or pass x-aholo-api-key header.");
  }
  return createLux3dClient({
    apiKey: ctx.apiKey,
    region: ctx.region,
  });
}

export function getWorldClient(ctx: AholoClientContext) {
  if (!ctx.apiKey) {
    throw new Error("Missing AHOLO_API_KEY. Set AHOLO_API_KEY in .env.local or pass x-aholo-api-key header.");
  }
  return createWorldClient({
    apiKey: ctx.apiKey,
    region: ctx.region,
  });
}

export function getAssetClient(ctx: AholoClientContext) {
  if (!ctx.apiKey) {
    throw new Error("Missing AHOLO_API_KEY. Set AHOLO_API_KEY in .env.local or pass x-aholo-api-key header.");
  }
  return createAssetClient({
    apiKey: ctx.apiKey,
    region: ctx.region,
  });
}

export const AHOLO_SDK_TELEMETRY = {
  viewerPkg: "@manycore/aholo-viewer@1.14.0",
  lux3dPkg: "@manycore/aholo-sdk-lux3d@1.10.0",
  worldPkg: "@manycore/aholo-sdk-world@1.5.0",
  assetPkg: "@manycore/aholo-sdk-asset@1.4.0",
  corePkg: "@manycore/aholo-sdk-core@1.4.0",
  mcpPkg: "@manycore/aholo-sdk-mcp@1.10.0",
  humanoidAnimationCount: HUMANOID_ANIMATION_IDS.length,
};
