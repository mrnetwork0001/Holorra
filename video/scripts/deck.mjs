// Renders the 12 report slides (src/Deck.tsx) at 3840 x 2160 and assembles them into a .pptx
// (one full-bleed image per slide, as the sample deck) and a PDF.
//   node scripts/deck.mjs [slide numbers]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import pptxgen from "pptxgenjs";
const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "out/deck"); mkdirSync(OUT, { recursive: true });
const N = 12, only = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: join(ROOT, "src/index.ts"), publicDir: join(ROOT, "public") });
for (let i = 1; i <= N; i++) {
  if (only.length && !only.includes(i)) continue;
  const composition = await selectComposition({ serveUrl, id: `Deck${i}` });
  await renderStill({ composition, serveUrl, output: join(OUT, `slide-${String(i).padStart(2, "0")}.jpg`), scale: 2, imageFormat: "jpeg", jpegQuality: 93 });
  console.log("slide", i);
}
const files = Array.from({ length: N }, (_, i) => join(OUT, `slide-${String(i + 1).padStart(2, "0")}.jpg`));
if (files.every(existsSync)) {
  const p = new pptxgen(); p.layout = "LAYOUT_WIDE"; p.title = "Holorra: project report"; p.author = "Holorra";
  // The slides are images, so the URLs on them get invisible link areas (inches on a 13.333 x 7.5 slide).
  const K = 13.333 / 1920;
  const LINKS = {
    1: [[950, 250, 900, 560, "https://holorra.xyz/studio"], [110, 280, 800, 520, "https://holorra.xyz"]],
    3: [[910, 300, 900, 560, "https://holorra.xyz/studio"]],
    4: [[256, 800, 1554, 110, "https://holorra.xyz/studio?play=1"], [110, 990, 1200, 40, "https://holorra.xyz/lab"]],
    9: [[110, 300, 1340, 320, "https://holorra.xyz/studio?play=1"]],
    12: [[110, 750, 190, 56, "https://holorra.xyz"], [310, 750, 400, 56, "https://holorra.xyz/studio?play=1"], [720, 750, 250, 56, "https://holorra.xyz/lab"], [980, 750, 290, 56, "https://holorra.xyz/report"], [1400, 300, 400, 440, "https://holorra.xyz"], [110, 250, 1100, 420, "https://holorra.xyz"]],
  };
  files.forEach((f, i) => {
    const sl = p.addSlide();
    sl.addImage({ path: f, x: 0, y: 0, w: 13.333, h: 7.5 });
    for (const [x, y, w, h, url] of LINKS[i + 1] ?? []) sl.addShape(p.ShapeType.rect, { x: x * K, y: y * K, w: w * K, h: h * K, fill: { color: "FFFFFF", transparency: 100 }, line: { color: "FFFFFF", transparency: 100, width: 0 }, hyperlink: { url, tooltip: url } });
  });
  await p.writeFile({ fileName: join(ROOT, "out/Holorra-Project-Report.pptx") });
  execFileSync("soffice", ["--headless", "--convert-to", "pdf", "--outdir", join(ROOT, "out"), join(ROOT, "out/Holorra-Project-Report.pptx")], { stdio: "ignore" });
  console.log("pptx + pdf written");
}
