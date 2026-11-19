import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadSans } from "@remotion/google-fonts/IBMPlexSans";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

/** Holorra's three families (src/app/layout.tsx): Instrument Serif, IBM Plex Sans, IBM Plex Mono. */
export const serif = loadSerif("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
loadSerif("italic", { weights: ["400"], subsets: ["latin"] });
export const sans = loadSans("normal", { weights: ["300", "400", "500", "600", "700"], subsets: ["latin"] }).fontFamily;
export const mono = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;
/** Chinese falls back to the same system faces the app names in globals.css. */
export const zhSerif = `"Songti SC", "STSong", ${serif}, serif`;
export const zhSans = `"PingFang SC", "Hiragino Sans GB", ${sans}, sans-serif`;

/** Holorra's palette, from src/app/globals.css. */
export const C = {
  canvas: "#0b0b0a",
  surface: "#121210",
  raised: "#1a1a17",
  line: "#2a2925",
  lineStrong: "#3b3a35",
  ink: "#ece9e2",
  ink2: "#a9a59b",
  ink3: "#7d7a71",
  accent: "#ff6a2b",
  accentInk: "#1a0b03",
  ok: "#8dbf8b",
  err: "#e5574f",
  paper: "#ece9e2",
};

export type Tone = "dark" | "light" | "brand";
export const TONE: Record<Tone, { bg: string; ink: string; muted: string; line: string; pill: string; accent: string }> = {
  dark: { bg: C.canvas, ink: C.ink, muted: "rgba(236,233,226,0.58)", line: "rgba(236,233,226,0.14)", pill: "rgba(11,11,10,0.74)", accent: C.accent },
  light: { bg: C.paper, ink: C.canvas, muted: "#5f5c54", line: "rgba(11,11,10,0.14)", pill: "rgba(255,255,255,0.88)", accent: "#d94e12" },
  brand: { bg: C.accent, ink: C.accentInk, muted: "rgba(26,11,3,0.7)", line: "rgba(26,11,3,0.22)", pill: "rgba(26,11,3,0.78)", accent: C.ink },
};

export const SCENE_TONE: Record<string, Tone> = {
  open: "dark", manycore: "light", turn: "brand", worlds: "dark", generate: "dark", split: "dark",
  articulate: "light", rig: "dark", play: "dark", direct: "light", under: "dark", close: "dark",
};
