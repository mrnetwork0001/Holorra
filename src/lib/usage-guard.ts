/**
 * Spending guard for the server's own Aholo key.
 *
 * Live jobs started with the server key (AHOLO_API_KEY) are capped per visitor
 * and site-wide per UTC day, so a public demo cannot drain the account.
 * Visitors who bring their own key (x-aholo-api-key) are never limited: those
 * jobs run on their credits.
 *
 * Counts live in memory and are mirrored to a small JSON file so restarts and
 * redeploys keep the day's totals. Only successful submissions are counted.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { NextRequest } from "next/server";
import type { AholoClientContext } from "@/lib/aholo-server";

export const DAILY_LIMIT_CODE = "DAILY_LIMIT";
const PER_VISITOR = Math.max(0, Number(process.env.HOLORRA_DAILY_JOBS_PER_VISITOR ?? 5));
const SITE_WIDE = Math.max(0, Number(process.env.HOLORRA_DAILY_JOBS_TOTAL ?? 25));
const FILE = process.env.HOLORRA_USAGE_FILE || path.join(os.tmpdir(), "holorra-usage.json");

interface Usage {
  day: string;
  total: number;
  visitors: Record<string, number>;
}

let usage: Usage | null = null;
const today = () => new Date().toISOString().slice(0, 10);

function load(): Usage {
  const day = today();
  if (usage && usage.day === day) return usage;
  let next: Usage = { day, total: 0, visitors: {} };
  if (!usage) {
    try {
      const saved = JSON.parse(fs.readFileSync(FILE, "utf8")) as Usage;
      if (saved && saved.day === day && typeof saved.total === "number") next = { day, total: saved.total, visitors: saved.visitors || {} };
    } catch {
      /* no file yet */
    }
  }
  usage = next;
  return usage;
}

function save(u: Usage) {
  try {
    fs.writeFileSync(FILE, JSON.stringify(u));
  } catch {
    /* counting still works in memory */
  }
}

function visitorId(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "unknown";
}

export interface QuotaVerdict {
  /** false: refuse the job and answer with `error` */
  allowed: boolean;
  error?: string;
  /** call after the SDK accepted the job */
  count: () => void;
}

/** Check before a live job. Jobs on a visitor's own key always pass and are not counted. */
export function checkLiveQuota(req: NextRequest, ctx: AholoClientContext): QuotaVerdict {
  if (ctx.keySource !== "env") return { allowed: true, count: () => {} };
  const u = load();
  const id = visitorId(req);
  const mine = u.visitors[id] ?? 0;
  if (mine >= PER_VISITOR || u.total >= SITE_WIDE) {
    const scope = mine >= PER_VISITOR ? `your ${PER_VISITOR} free live jobs for today are used` : "today's free live jobs for this demo are used up";
    return {
      allowed: false,
      error: `${DAILY_LIMIT_CODE}: ${scope}. Get your own key at https://labs.aholo.ai/api-keys and add it under API key to keep generating.`,
      count: () => {},
    };
  }
  return {
    allowed: true,
    count: () => {
      const cur = load();
      cur.total += 1;
      cur.visitors[id] = (cur.visitors[id] ?? 0) + 1;
      save(cur);
    },
  };
}

export function quotaSummary() {
  const u = load();
  return { perVisitorPerDay: PER_VISITOR, siteWidePerDay: SITE_WIDE, usedToday: u.total };
}
