import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
for (const u of process.argv.slice(2)) {
  try {
    await p.goto(u, { timeout: 45000, waitUntil: "domcontentloaded" }); await p.waitForTimeout(6000);
    const r = await p.evaluate(() => ({
      title: document.title,
      imgs: [...document.images].map((i) => [i.currentSrc || i.src, i.alt, i.naturalWidth + "x" + i.naturalHeight]).filter((x) => /logo|manycore|aholo|brand|svg/i.test(x[0] + x[1])).slice(0, 25),
      svgs: [...document.querySelectorAll("header svg, nav svg, footer svg, a[href='/'] svg")].slice(0, 6).map((s) => s.outerHTML.length + ":" + s.outerHTML.slice(0, 160)),
      links: [...document.querySelectorAll("a[href*='x.com'], a[href*='twitter.com']")].map((a) => a.href).slice(0, 10),
      icons: [...document.querySelectorAll("link[rel*='icon']")].map((l) => l.href),
    }));
    console.log("=====", u, "\n", JSON.stringify(r, null, 1).slice(0, 3500));
    await p.screenshot({ path: `.cache/x/${u.replace(/[^a-z0-9]+/gi, "_").slice(0, 40)}.jpg`, type: "jpeg", quality: 60 });
  } catch (e) { console.log("=====", u, "ERR", String(e.message).slice(0, 100)); }
}
await b.close();
