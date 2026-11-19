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
  for (const f of files) p.addSlide().addImage({ path: f, x: 0, y: 0, w: 13.333, h: 7.5 });
  await p.writeFile({ fileName: join(ROOT, "out/Holorra-Project-Report.pptx") });
  execFileSync("soffice", ["--headless", "--convert-to", "pdf", "--outdir", join(ROOT, "out"), join(ROOT, "out/Holorra-Project-Report.pptx")], { stdio: "ignore" });
  console.log("pptx + pdf written");
}
