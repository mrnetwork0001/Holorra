import { NextRequest, NextResponse } from "next/server";
import { getLux3dClient, getWorldClient, resolveAholoContext } from "@/lib/aholo-server";

export async function GET(req: NextRequest) {
  const ctx = resolveAholoContext(req);
  const taskIdParam = req.nextUrl.searchParams.get("taskId");
  const worldIdParam = req.nextUrl.searchParams.get("worldId");

  if (!ctx.hasApiKey) {
    return NextResponse.json({
      ok: true,
      hasApiKey: false,
      mode: "VERIFIED_MANYCORE_CDN_STAGE",
      tasks: [],
    });
  }

  try {
    if (taskIdParam) {
      const lux3d = getLux3dClient(ctx);
      const task = await lux3d.tasks.retrieve(Number(taskIdParam));
      return NextResponse.json({
        ok: true,
        type: "lux3d",
        sdkMethod: "lux3d.tasks.retrieve",
        task,
      });
    }

    if (worldIdParam) {
      const world = getWorldClient(ctx);
      const detail = await world.retrieve(worldIdParam);
      return NextResponse.json({
        ok: true,
        type: "world",
        sdkMethod: "world.retrieve",
        detail,
      });
    }

    const lux3d = getLux3dClient(ctx);
    const list = await lux3d.tasks.list({ page: 1, pageSize: 15 });
    return NextResponse.json({
      ok: true,
      type: "lux3d_list",
      sdkMethod: "lux3d.tasks.list",
      list,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to query Aholo task status",
      },
      { status: 400 }
    );
  }
}
