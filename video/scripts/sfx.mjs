// Sound effects via ElevenLabs /v1/sound-generation. Skips files that already exist.
//   node scripts/sfx.mjs                     all missing
//   ONLY=stamp,impact node scripts/sfx.mjs   force regenerate some
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, post, retry } from "./env.mjs";

const SFX = {
  whoosh: ["Soft fast airy whoosh, smooth cinematic transition, no music", 1.0],
  swoosh_up: ["Quick rising digital swoosh, bright and clean, UI transition, no music", 0.9],
  click: ["Soft modern UI mouse click, single, clean, short", 0.5],
  pop: ["Soft bubbly UI pop, single, clean, short", 0.5],
  tick: ["Single crisp mechanical tick, close, dry, short", 0.5],
  riser: ["Tension riser, rising airy synth swell building to a peak, cinematic, no drums", 3],
  impact: ["Deep clean cinematic impact with a warm sub tail, modern, single hit", 2],
  chime: ["Bright clean confirmation chime, two soft ascending notes, modern, short tail", 1.5],
  typing: ["Fast soft mechanical keyboard typing, close, dry, a couple of seconds, no music", 2.0],
  split: ["Precise mechanical parts separating, a quick metallic slide and four soft clicks as pieces move apart, clean, close, dry", 1.2],
  snap: ["Mechanical parts snapping back together, one tight satisfying metallic click-clack, close, dry", 0.7],
  servo: ["A small smooth servo motor moving a metal hinge open, short whirr then a soft stop, close, dry", 1.4],
  thud: ["A wooden object dropped onto a hard floor, one solid thud with a short rattle, close, dry", 0.9],
  steam: ["An espresso machine steam wand hissing briefly, then liquid pouring into a cup, close, no music", 2.5],
  shutter: ["A single camera shutter click, mechanical, crisp, close", 0.5],
  freeze: ["A short cold glassy freeze sound, a quick crystalline crackle that stops dead, eerie, dry", 1.2],
  steps: ["Two soft footsteps on a hard wooden floor indoors, close, dry", 1.0],
};

const dir = join(ROOT, "public/audio/sfx");
mkdirSync(dir, { recursive: true });
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;

for (const [name, [text, dur]] of Object.entries(SFX)) {
  const f = join(dir, `${name}.mp3`);
  if (only ? !only.includes(name) : existsSync(f)) { console.log(`${name}: skip`); continue; }
  try {
    const buf = await retry(async () => {
      const res = await post("/sound-generation?output_format=mp3_44100_128", { text, duration_seconds: dur, prompt_influence: 0.5 });
      return Buffer.from(await res.arrayBuffer());
    });
    writeFileSync(f, buf);
    console.log(`${name}: ${(buf.length / 1024).toFixed(0)}kb`);
  } catch (e) { console.error(`${name}: FAILED ${e.message}`); }
}
