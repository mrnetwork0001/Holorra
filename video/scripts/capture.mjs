// Records the live site (https://holorra.xyz) into .cache/frames/<clip>/. Read-only: no clip
// starts a paid job (the co-director only plans). ONLY=<clips> is required.
//   ONLY=dead,worlds node scripts/capture.mjs
import { open, sleep, BASE } from "./cap.mjs";
const only = process.env.ONLY?.split(",");
if (!only) { console.error("ONLY=<clip,clip> is required"); process.exit(1); }
const expand = (c) => c.page.getByRole("button", { name: "Expand the stage" }).click();
const pan = async (c, from, to, ms) => { const n = Math.round(ms / 33); for (let i = 0; i <= n; i++) { const t = i / n, e = t * t * (3 - 2 * t); const p = {}; for (const k of Object.keys(to)) p[k] = from[k] + (to[k] - from[k]) * e; await c.pose(p); await sleep(33); } };

const CLIPS = {
  // A generated world with nothing alive in it: our SpatialGen coffee bar, camera turned away from the actor.
  async dead(c) {
    await c.studio("?world=spatialgen-coffee-bar", 16000); await expand(c); await sleep(600);
    const a = { px: 0.4, py: -0.1, pz: 0.6, yaw: Math.PI - 0.22, pitch: 0.05 }, b = { px: 0.25, py: -0.1, pz: 0.2, yaw: Math.PI + 0.2, pitch: 0.04 };
    await c.pose(a); await sleep(1200);
    const stop = await c.record("dead"); await sleep(600); await pan(c, a, b, 15000); await sleep(600); await stop();
  },
  // The five world tabs.
  async worlds(c) {
    await c.studio("", 20000);
    await c.page.mouse.move(800, 500);
    const stop = await c.record("worlds"); await sleep(1200);
    for (const [k, name, wait] of [["plaza", "Juguo Urban Plaza", 9000], ["station", "Grand Transit Concourse", 8000], ["bear", "Object Turntable", 5000], ["cafe", "Coffee Bar", 7000]]) {
      await c.click(c.page.locator("header button", { hasText: name }).first()); c.mark(`worlds.${k}`); await c.move(900, 520, 500); await sleep(wait);
    }
    await stop();
  },
  // Parts panel, close on the espresso machine: explode, hide a part, recolour.
  async parts(c) {
    await c.studio("", 26000);
    await c.pose({ px: 4.25, py: -0.78, pz: -0.5, yaw: 0.235, pitch: 0.14 }); await sleep(1200);
    await c.click(c.page.locator("button", { hasText: "playing" }).first()); await sleep(600); // hold the joints still while it explodes
    const slider = c.page.locator("aside input[type=range], input[type=range]").first();
    const b = await c.box(slider);
    await c.rect("parts", "panel", c.page.locator("input[type=range]").first().locator("xpath=ancestor::*[self::section or self::div][3]"));
    const stop = await c.record("parts"); await sleep(1000);
    c.mark("parts.drag"); await c.drag(b.x + 4, b.y + b.height / 2, b.x + b.width - 4, b.y + b.height / 2, 2600); c.mark("parts.open"); await sleep(1600);
    await c.click(c.page.locator("button", { hasText: "Inspect" }).first()); c.mark("parts.inspect"); await sleep(1400);
    await c.click(c.page.getByRole("button", { name: /hood_top/ }).first()); await sleep(900);
    const sw = c.page.locator("button[title], button[aria-label]").filter({ has: c.page.locator("xpath=self::*[contains(@style,'background')]") });
    if (await sw.count()) { await c.click(sw.last()); c.mark("parts.colour"); await sleep(1500); }
    await c.click(c.page.locator("button", { hasText: "Closed" }).first()); c.mark("parts.closed"); await sleep(1800);
    await stop();
  },
  // The same close view with the Lux3D joints running: hood hinge and drawer slide.
  async artic(c) {
    await c.studio("", 26000); await expand(c); await sleep(600);
    const a = { px: 4.35, py: -0.8, pz: -0.45, yaw: 0.3, pitch: 0.16 }, b = { px: 3.75, py: -0.82, pz: -0.55, yaw: -0.24, pitch: 0.16 };
    await c.pose(a); await sleep(1500);
    const stop = await c.record("artic"); await sleep(500); await pan(c, a, b, 11000); await sleep(500); await stop();
  },
  // Landing page: switch to Chinese and look around, then the studio in Chinese.
  async zh(c) {
    await c.page.goto(BASE + "/"); await sleep(5000);
    const stop = await c.record("zh"); await sleep(1200);
    await c.click(c.page.getByRole("radio", { name: "中", exact: true }).first()); c.mark("zh.switch"); await sleep(1800);
    for (let i = 0; i < 4; i++) { await c.page.mouse.wheel(0, 620); await sleep(1300); }
    c.mark("zh.scrolled");
    await c.page.evaluate(() => scrollTo({ top: 0, behavior: "smooth" })); await sleep(1300);
    await c.click(c.page.locator("header a, nav a").filter({ hasText: /工作室|Studio/ }).first()).catch(() => c.page.goto(BASE + "/studio"));
    c.mark("zh.studio"); await sleep(9000);
    await stop();
  },
  // Co-director: a Chinese prompt typed in, planned, applied. The world switches and she dances.
  async direct(c) {
    await c.studio("", 50000);
    await c.click(c.page.locator("button", { hasText: "Co-director" }).first()); await sleep(900);
    const ta = c.page.locator("textarea").last();
    await c.rect("direct", "panel", ta);
    const stop = await c.record("direct"); await sleep(800);
    await c.click(ta); await c.page.keyboard.press("Meta+A"); await c.page.keyboard.press("Backspace"); await sleep(400);
    c.mark("direct.type");
    for (const ch of "切换到城市街道，让角色跳舞。") { await c.page.keyboard.insertText(ch); await sleep(110); }
    c.mark("direct.typed"); await sleep(500);
    await c.click(c.page.locator("button", { hasText: "Plan and apply" }).first(), { ms: 500, hold: 200 }); c.mark("direct.apply");
    await c.move(820, 520, 600);
    await c.page.waitForFunction(() => /Juguo|聚果/.test(document.querySelector("header")?.innerText || "") && !/Planning/.test(document.body.innerText) && /Planned \d/.test(document.body.innerText), null, { timeout: 40000 }).catch(() => {});
    c.mark("direct.planned"); await sleep(26000); c.mark("direct.ready"); await sleep(9000);
    await stop();
  },
  // The recorded camera path, full stage, then the LuxReal hand-off buttons.
  async path(c) {
    await c.studio("", 26000);
    const stop = await c.record("path"); await sleep(900);
    await c.click(c.page.locator("button", { hasText: "Play path" }).first()); c.mark("path.play"); await c.move(800, 420, 500); await sleep(10200);
    c.mark("path.end");
    await c.hover(c.page.locator("button", { hasText: "Storyboard JSON" }).first()); await sleep(900);
    await c.hover(c.page.locator("a,button", { hasText: "Open in LuxReal" }).first()); await sleep(1500);
    await stop();
  },
  // Lux3D bench: the run log, with the rejected rig.
  async bench(c) {
    await c.page.goto(BASE + "/lab"); await sleep(6000);
    await c.rect("bench", "table", c.page.locator("table").first());
    await c.rect("bench", "failed", c.page.locator("tr", { hasText: "RIG_ELIGIBILITY_FAILED" }).first());
    await c.rect("bench", "rig", c.page.locator("tr", { hasText: "auto-rigged" }).first());
    await c.rect("bench", "retarget", c.page.locator("tr", { hasText: "8 retargeted clips" }).first());
    const stop = await c.record("bench"); await sleep(1500);
    await c.hover(c.page.locator("tr", { hasText: "auto-rigged" }).first(), 1200); await sleep(1200);
    await c.hover(c.page.locator("tr", { hasText: "8 retargeted clips" }).first(), 900); await sleep(1200);
    await c.hover(c.page.locator("tr", { hasText: "RIG_ELIGIBILITY_FAILED" }).first(), 900); await sleep(2500);
    await stop();
  },
  // Lux3D bench: the three characters, and the clip switcher.
  async labrig(c) {
    await c.page.goto(BASE + "/lab"); await sleep(3000);
    const h = c.page.locator("h2", { hasText: "Static mesh to rigged" }).first();
    await h.evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY + 150)); await sleep(30000);
    for (const n of ["Idle_Loop", "Dance_Loop", "Sword_Attack", "Walk_Loop"]) await c.rect("labrig", n, c.page.getByRole("button", { name: n, exact: true }).first());
    const stop = await c.record("labrig"); await sleep(1500);
    for (const n of ["Walk_Loop", "Dance_Loop", "Sword_Attack", "Jog_Fwd_Loop", "Dance_Loop"]) { await c.click(c.page.getByRole("button", { name: n, exact: true }).first()); c.mark(`labrig.${n}`); await sleep(2600); }
    await stop();
  },
  // Lux3D bench: G1-Turbo next to G1, turning.
  async engines(c) {
    await c.page.goto(BASE + "/lab"); await sleep(3000);
    const h = c.page.locator("h2", { hasText: "G1-Turbo drafts" }).first();
    await h.evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY - 110)); await sleep(22000);
    const stop = await c.record("engines"); await sleep(9000); await stop();
  },
  // MCP hub.
  async mcp(c) {
    await c.page.goto(BASE + "/mcp"); await sleep(5000);
    const stop = await c.record("mcp"); await sleep(1200);
    for (let i = 0; i < 3; i++) { await c.page.mouse.wheel(0, 420); await sleep(1400); }
    await stop();
  },
};

for (const name of only) {
  if (!CLIPS[name]) { console.error("no clip " + name); continue; }
  const c = await open();
  try { await CLIPS[name](c); } catch (e) { console.error(`${name}: FAILED ${String(e.message).split("\n")[0]}`); }
  await c.close();
}
