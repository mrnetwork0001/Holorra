// Cuts the owner's own screen recordings (a live Text to 3D job, the Play run, a phone session) into
// muted 30 fps clips in public/footage/ and registers them in src/footage.json. The browser chrome is
// cropped off; nothing else is altered. Sources are listed in README "What is real".
//   node scripts/owner.mjs [clip ...]
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
const ROOT = new URL("..", import.meta.url).pathname;
const A = join(homedir(), "Desktop/holorra-A.mov"), B = join(homedir(), "Desktop/holorra-B.mov");
const PHONE = join(homedir(), "Downloads/ScreenRecording_11-19-2026 07-34-37_1.MP4");
const PAGE = "crop=3024:1736:0:228,scale=1920:-2"; // the page, without the browser's tab and address bars
const CUTS = JSON.parse(readFileSync(join(ROOT, "data/cuts.json"), "utf8"));
const out = existsSync(join(ROOT, "src/footage.json")) ? JSON.parse(readFileSync(join(ROOT, "src/footage.json"), "utf8")) : {};
mkdirSync(join(ROOT, "public/footage"), { recursive: true });
const want = process.argv.slice(2);
for (const [name, c] of Object.entries(CUTS)) {
  if (want.length && !want.includes(name)) continue;
  const src = c.src === "A" ? A : c.src === "B" ? B : PHONE;
  if (!existsSync(src)) { console.log(`${name}: source missing (${c.src})`); continue; }
  const file = `footage/${name}.mp4`;
  const vf = `${c.vf ?? PAGE},fps=30,format=yuv420p`;
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(c.from), "-t", String(c.to - c.from), "-i", src, "-an", "-vf", vf, "-c:v", "libx264", "-crf", "15", "-preset", "medium", "-movflags", "+faststart", join(ROOT, "public", file)]);
  const [w, h] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", join(ROOT, "public", file)]).toString().trim().split(",").map(Number);
  const dur = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", join(ROOT, "public", file)]).toString());
  out[name] = { file, width: w, height: h, durationFrames: Math.floor(dur * 30), owner: true, source: c.src, from: c.from, to: c.to };
  console.log(`${name}: ${w}x${h} ${dur.toFixed(1)}s`);
}
writeFileSync(join(ROOT, "src/footage.json"), JSON.stringify(out, null, 1));
