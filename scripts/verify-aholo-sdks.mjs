import { createLux3dClient, HUMANOID_ANIMATION_IDS } from "@manycore/aholo-sdk-lux3d";
import { createWorldClient } from "@manycore/aholo-sdk-world";
import { createAssetClient } from "@manycore/aholo-sdk-asset";

async function main() {
  console.log("==============================================================");
  console.log("  HOLORRA — Manycore Aholo SDK & CDN Verification Suite");
  console.log("==============================================================\n");

  // 1. Verify SDK client factories
  const lux3d = createLux3dClient({ apiKey: "verify_token", region: "com" });
  const world = createWorldClient({ apiKey: "verify_token", region: "com" });
  const asset = createAssetClient({ apiKey: "verify_token", region: "com" });

  console.log("[1/3] Official Manycore SDK Factories:");
  console.log("  ✓ @manycore/aholo-sdk-lux3d:", Object.keys(lux3d).join(", "));
  console.log("  ✓ @manycore/aholo-sdk-world:", Object.keys(world).join(", "));
  console.log("  ✓ @manycore/aholo-sdk-asset:", Object.keys(asset).join(", "));
  console.log(`  ✓ HUMANOID_ANIMATION_IDS count: ${HUMANOID_ANIMATION_IDS.length} presets`);

  if (HUMANOID_ANIMATION_IDS.length !== 85) {
    throw new Error(`Expected 85 HUMANOID_ANIMATION_IDS, got ${HUMANOID_ANIMATION_IDS.length}`);
  }

  // 2. Verify Live Manycore OSS CDN Assets
  const cdnAssets = [
    { name: "Smart Loft Indoor 3DGS (.spz)", url: "https://holo-cos.aholo3d.cn/aholo-opensource/gs_file/room/scene.7c26e842.spz" },
    { name: "Smart Loft Voxel Collision Meta", url: "https://holo-cos.aholo3d.cn/aholo-opensource/gs_file/room/voxel/10c88df3/collision.voxel-meta.json" },
    { name: "Juguo Urban Plaza Chunk-LOD Meta", url: "https://holo-cos.aholo3d.cn/aholo-opensource/gs_file/juguo/chunk-lod/0f9e3ae1/lod-meta.json" },
    { name: "Grand Concourse Chunk-LOD Meta", url: "https://holo-cos.aholo3d.cn/aholo-opensource/gs_file/huochezhan/chunk-lod/6b077ba2/lod-meta.json" },
    { name: "Sculpted Bear 3DGS (.sog)", url: "https://holo-cos.aholo3d.cn/aholo-opensource/gs_file/bear/bear.3d71a266.sog" },
    { name: "Rigged Robot Actor (.glb)", url: "https://holo-cos.aholo3d.cn/aholo-opensource/gs_file/misc/robot.0765006a.glb" },
    { name: "Rigged Human Actor (.glb)", url: "https://holo-cos.aholo3d.cn/aholo-opensource/gs_file/misc/man-final.755ce8ea.glb" },
  ];

  console.log("\n[2/3] Probing Manycore OSS CDN 3DGS & GLB Assets:");
  for (const item of cdnAssets) {
    const res = await fetch(item.url, { method: "HEAD" });
    console.log(`  ✓ HTTP ${res.status} — ${item.name}`);
    if (!res.ok) {
      throw new Error(`CDN probe failed for ${item.url}: HTTP ${res.status}`);
    }
  }

  console.log("\n[3/3] Verification Passed: All Manycore SDKs and 3DGS CDN assets are online.\n");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
