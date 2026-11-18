import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin proxy for finished Lux3D / Aholo result files (GLB, ZIP, PLY…).
 * Their CDNs may not send CORS headers, so the stage loads results through here.
 *
 * Not an open proxy: https only, a fixed host allowlist, every redirect hop is
 * re-validated before it is followed, and responses are capped in size.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 120 * 1024 * 1024;
const TIMEOUT_MS = 60_000;
const MAX_REDIRECTS = 3;

const EXACT_HOSTS = new Set(["holo-cos.aholo3d.cn", "kujiale.com", "myqcloud.com", "aholo.ai", "aholo.cn"]);
const SUFFIX_HOSTS = [".kujiale.com", ".myqcloud.com", ".aholo.ai", ".aholo.cn"];

function allowed(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password) return null;
  if (u.port && u.port !== "443") return null;
  const host = u.hostname.toLowerCase();
  if (EXACT_HOSTS.has(host) || SUFFIX_HOSTS.some((s) => host.endsWith(s))) return u;
  return null;
}

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return bad("Missing url parameter.");
  const first = allowed(raw);
  if (!first) return bad("URL not allowed: only https Aholo / Lux3D result hosts are proxied.");
  let target: URL = first;

  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let upstream: Response | null = null;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    try {
      upstream = await fetch(target, { redirect: "manual", signal, headers: { accept: "*/*" } });
    } catch (err) {
      const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      return bad(timedOut ? "Upstream timed out." : "Upstream fetch failed.", timedOut ? 504 : 502);
    }
    if (upstream.status >= 300 && upstream.status < 400) {
      const loc: string | null = upstream.headers.get("location");
      let next: URL | null = null;
      try {
        next = loc ? allowed(new URL(loc, target).toString()) : null;
      } catch {
        next = null;
      }
      if (!next) return bad("Redirect target not allowed.", 502);
      target = next;
      upstream = null;
      continue;
    }
    break;
  }
  if (!upstream) return bad("Too many redirects.", 502);
  if (!upstream.ok || !upstream.body) return bad(`Upstream responded ${upstream.status}.`, 502);

  const declared = Number(upstream.headers.get("content-length") || 0);
  if (declared > MAX_BYTES) return bad("File too large.", 413);

  // Enforce the cap while streaming too (content-length may be absent).
  let seen = 0;
  const capped = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        seen += chunk.byteLength;
        if (seen > MAX_BYTES) controller.error(new Error("File too large."));
        else controller.enqueue(chunk);
      },
    })
  );

  const headers = new Headers({
    "content-type": upstream.headers.get("content-type") || "application/octet-stream",
    "cache-control": "public, max-age=86400",
    "x-content-type-options": "nosniff",
  });
  if (declared > 0) headers.set("content-length", String(declared));
  return new Response(capped, { status: 200, headers });
}
