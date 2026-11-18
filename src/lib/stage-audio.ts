/**
 * Stage sound, synthesized in the browser with the Web Audio API: no audio
 * files, nothing to download. Off by default; the choice is remembered.
 * Every function is a no-op while sound is off, so the render loop can call
 * them freely.
 */
const KEY = "holorra_sound";
export const SOUND_EVENT = "holorra:sound";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let on = false;

export function soundEnabled(): boolean {
  return on;
}

export function initSoundPreference(): boolean {
  try {
    on = localStorage.getItem(KEY) === "1";
  } catch {
    on = false;
  }
  return on;
}

/** Must be called from a user gesture the first time (browsers block audio otherwise). */
export function setSoundEnabled(next: boolean) {
  on = next;
  try {
    localStorage.setItem(KEY, next ? "1" : "0");
  } catch {
    /* private mode */
  }
  if (next) {
    ensure();
    chime(2);
  }
  window.dispatchEvent(new Event(SOUND_EVENT));
}

function ensure(): AudioContext | null {
  if (!on) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; at?: number; slide?: number } = {}) {
  const c = ensure();
  if (!c || !master) return;
  const t = c.currentTime + (opts.at ?? 0);
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = opts.type ?? "sine";
  o.frequency.setValueAtTime(freq, t);
  if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.2, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, opts: { gain?: number; at?: number; from?: number; to?: number; q?: number; type?: BiquadFilterType } = {}) {
  const c = ensure();
  if (!c || !master) return;
  const t = c.currentTime + (opts.at ?? 0);
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = opts.type ?? "bandpass";
  f.Q.value = opts.q ?? 1;
  f.frequency.setValueAtTime(opts.from ?? 1000, t);
  if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain ?? 0.2, t + Math.min(0.03, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
  src.stop(t + dur + 0.02);
}

/** One footstep; alternate feet differ slightly. */
let foot = 0;
export function step(fast = false) {
  foot ^= 1;
  noise(0.07, { gain: fast ? 0.16 : 0.11, from: foot ? 420 : 340, to: 140, q: 1.4, type: "lowpass" });
  tone(foot ? 92 : 80, 0.06, { gain: 0.08, slide: 50 });
}

/** The espresso machine: a steam hiss, a low pump hum, a little pour. */
export function brew() {
  noise(1.5, { gain: 0.14, from: 5200, to: 2600, q: 0.7, type: "highpass" });
  tone(96, 2.6, { type: "sawtooth", gain: 0.035, at: 0.2 });
  noise(1.2, { gain: 0.07, from: 900, to: 500, q: 3, at: 1.5 });
  tone(1250, 0.12, { gain: 0.07, at: 3.2 });
}

/** Rising two-note chime; n shifts it up for later quest steps. */
export function chime(n = 0) {
  const base = 523.25 * Math.pow(2, n / 12);
  tone(base, 0.22, { type: "triangle", gain: 0.16 });
  tone(base * 1.5, 0.34, { type: "triangle", gain: 0.14, at: 0.09 });
}

/** A model hits the floor. */
export function thud(strength = 1) {
  tone(120, 0.22, { gain: 0.3 * strength, slide: 42 });
  noise(0.12, { gain: 0.14 * strength, from: 600, to: 120, type: "lowpass" });
}

export function kick() {
  tone(210, 0.12, { type: "square", gain: 0.1, slide: 70 });
  noise(0.06, { gain: 0.12, from: 1800, to: 500 });
}

export function pickup(n = 0) {
  const f = 880 * Math.pow(2, (n * 2) / 12);
  tone(f, 0.09, { type: "square", gain: 0.07 });
  tone(f * 1.335, 0.16, { type: "square", gain: 0.07, at: 0.07 });
}

export function shutter() {
  noise(0.05, { gain: 0.2, from: 3200, to: 900 });
  noise(0.06, { gain: 0.14, from: 2400, to: 700, at: 0.09 });
}

export function emote() {
  tone(660, 0.08, { type: "triangle", gain: 0.1 });
  tone(990, 0.1, { type: "triangle", gain: 0.08, at: 0.06 });
}

export function fanfare() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i === 3 ? 0.6 : 0.18, { type: "triangle", gain: 0.16, at: i * 0.13 }));
  tone(1318.5, 0.5, { type: "sine", gain: 0.08, at: 0.52 });
}
