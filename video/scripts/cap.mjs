// Shared capture harness: headless Chrome (GPU on) driven by Playwright, recorded with the
// DevTools screencast into .cache/frames/<clip>/ (JPEG + wall-clock timestamps), with marks
// and rects noted for scripts/encode.mjs. A pointer is drawn in the page (headless draws none).
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
export const ROOT = new URL("..", import.meta.url).pathname;
export const BASE = process.env.BASE || "https://holorra.xyz";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {});

export async function open({ width = 1600, height = 900, scale = 1, mobile = false } = {}) {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true,
    args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=metal", "--hide-scrollbars", "--disable-background-timer-throttling", "--disable-renderer-backgrounding",
      ...(process.env.HOLORRA_HOST_IP ? [`--host-resolver-rules=MAP holorra.xyz ${process.env.HOLORRA_HOST_IP}, MAP www.holorra.xyz ${process.env.HOLORRA_HOST_IP}`] : [])],
  });
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, hasTouch: mobile, isMobile: mobile, locale: "en-US", permissions: ["clipboard-read", "clipboard-write"] });
  await ctx.addInitScript(() => {
    try { localStorage.setItem("holorra_lang", "en"); } catch {}
    addEventListener("DOMContentLoaded", () => {
      const c = document.createElement("div");
      c.id = "__cursor";
      c.style.cssText = "position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);transition:transform 60ms linear";
      c.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 2l15 9.5-6.6 1.3 4 7.2-2.8 1.5-4-7.3L4 19z" fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>';
      document.documentElement.appendChild(c);
      addEventListener("mousemove", (e) => { c.style.transform = `translate(${e.clientX - 3}px,${e.clientY - 2}px)`; }, true);
    });
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  let pos = { x: width / 2, y: height / 2 };
  const marks = readJson(join(ROOT, ".cache/marks.json"));
  const meta = readJson(join(ROOT, ".cache/meta.json"));
  const api = {
    browser, page, cdp,
    /** Eased pointer move to (x, y) over `ms`. */
    async move(x, y, ms = 700) {
      const n = Math.max(6, Math.round(ms / 16));
      const a = { ...pos };
      for (let i = 1; i <= n; i++) { const t = i / n, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; await page.mouse.move(a.x + (x - a.x) * e, a.y + (y - a.y) * e); await sleep(16); }
      pos = { x, y };
    },
    async box(loc) { const b = await loc.boundingBox(); if (!b) throw new Error("no box"); return b; },
    async hover(loc, ms = 700) { const b = await api.box(loc); await api.move(b.x + b.width / 2, b.y + b.height / 2, ms); return b; },
    async click(loc, { ms = 700, hold = 350 } = {}) { await api.hover(loc, ms); await sleep(hold); await page.mouse.down(); await sleep(70); await page.mouse.up(); },
    async drag(x0, y0, x1, y1, ms = 1200) { await api.move(x0, y0, 500); await sleep(200); await page.mouse.down(); await api.move(x1, y1, ms); await sleep(120); await page.mouse.up(); },
    mark(name) { marks[name] = Date.now() / 1000; },
    async rect(clip, name, loc) { const b = await loc.boundingBox(); meta[clip] = meta[clip] || { rects: {} }; meta[clip].rects = meta[clip].rects || {}; meta[clip].rects[name] = b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null; },
    async record(clip) {
      const dir = join(ROOT, ".cache/frames", clip);
      rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
      const frames = []; let active = true;
      cdp.on("Page.screencastFrame", (p) => {
        cdp.send("Page.screencastFrameAck", { sessionId: p.sessionId }).catch(() => {});
        if (!active) return;
        const file = join(dir, `f${String(frames.length).padStart(5, "0")}.jpg`);
        writeFileSync(file, Buffer.from(p.data, "base64"));
        frames.push({ file, t: p.metadata.timestamp });
      });
      await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1 });
      return async () => {
        active = false;
        await cdp.send("Page.stopScreencast").catch(() => {});
        if (frames.length) frames.push({ file: frames[frames.length - 1].file, t: Date.now() / 1000 });
        writeFileSync(join(dir, "frames.json"), JSON.stringify(frames));
        writeFileSync(join(ROOT, ".cache/marks.json"), JSON.stringify(marks, null, 1));
        writeFileSync(join(ROOT, ".cache/meta.json"), JSON.stringify(meta, null, 1));
        const span = frames.length > 1 ? frames.at(-1).t - frames[0].t : 0;
        console.log(`${clip}: ${frames.length} frames, ${span.toFixed(1)}s, ${(frames.length / Math.max(1, span)).toFixed(1)} fps`);
      };
    },
    /** Studio ready: world loaded and (optionally) the actor GLB in. */
    async studio(query = "", settle = 22000) {
      await page.goto(`${BASE}/studio${query}`);
      await page.waitForFunction(() => !!window.__holorraStage && !/LOADING WORLD/.test(document.body.innerText), null, { timeout: 120000 });
      await sleep(settle);
    },
    pose: (o) => page.evaluate((o) => Object.assign(window.__holorraStage.pose(), o), o),
    async close() { await browser.close(); },
  };
  return api;
}
