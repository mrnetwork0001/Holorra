// README screenshots of the live site: node scripts/shot.mjs <outDir>
import { open, sleep, BASE } from "./cap.mjs";
import { join } from "node:path";
const out = process.argv[2];
const c = await open({ width: 1600, height: 1000, scale: 1.5 });
await c.page.goto(BASE + "/"); await sleep(6000);
await c.page.addStyleTag({ content: "#__cursor{display:none!important}" });
await c.page.screenshot({ path: join(out, "landing.png") });
await c.studio("", 40000);
await c.page.addStyleTag({ content: "#__cursor{display:none!important}" });
await c.page.screenshot({ path: join(out, "studio.png") });
await c.close();
