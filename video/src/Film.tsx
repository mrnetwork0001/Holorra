import React from "react";
import { AbsoluteFill, Audio, Freeze, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { T, scene, wordAt } from "./timing";
import { C } from "./theme";
import { Captions } from "./ui/Captions";
import { Grain } from "./ui/Grain";
import { clamp } from "./ui/motion";
import { Open } from "./scenes/Open";
import { Manycore } from "./scenes/Manycore";
import { Turn } from "./scenes/Turn";
import { Worlds } from "./scenes/Worlds";
import { Generate } from "./scenes/Generate";
import { Split } from "./scenes/Split";
import { Articulate } from "./scenes/Articulate";
import { Rig } from "./scenes/Rig";
import { Play } from "./scenes/Play";
import { Direct } from "./scenes/Direct";
import { Under } from "./scenes/Under";
import { Close } from "./scenes/Close";

const SCENES: Record<string, React.FC> = {
  open: Open, manycore: Manycore, turn: Turn, worlds: Worlds, generate: Generate, split: Split,
  articulate: Articulate, rig: Rig, play: Play, direct: Direct, under: Under, close: Close,
};
const OVERLAP = 12; // frames each scene starts early, to dissolve over the last

/** Each scene eases in (a short rise, un-blur and settle) over the tail of the previous one, holding its first frame. */
const SceneIn: React.FC<{ S: React.FC; first: boolean }> = ({ S, first }) => {
  const f = useCurrentFrame();
  if (first) return <S />;
  const p = interpolate(f, [0, OVERLAP], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const body = f < OVERLAP ? <Freeze frame={0}><S /></Freeze> : <Sequence from={OVERLAP} layout="none"><S /></Sequence>;
  return <AbsoluteFill style={{ opacity: p, transform: `scale(${1.04 - 0.04 * p})`, filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined }}>{body}</AbsoluteFill>;
};

// --- Music, ducked under every spoken line.
const LINES = T.scenes.flatMap((s) => s.lines.map((l) => [l.startFrame, l.words[l.words.length - 1].end] as const));
const DUCK: number[] = (() => {
  const v = new Array<number>(T.totalFrames + 1).fill(0);
  for (let f = 0; f <= T.totalFrames; f++) {
    let d = 0;
    for (const [a, b] of LINES) d = Math.max(d, interpolate(f, [a - 10, a, b, b + 14], [0, 1, 1, 0], clamp));
    v[f] = d;
  }
  return v;
})();
const musicVolume = (f: number) => {
  const end = T.totalFrames;
  const fadeIn = interpolate(f, [0, 20], [0, 1], clamp);
  const fadeOut = interpolate(f, [end - 60, end], [1, 0], clamp);
  return (0.56 - 0.4 * DUCK[Math.min(end, Math.max(0, f))]) * fadeIn * fadeOut;
};

interface Fx { file: string; at: number; vol: number; dur?: number }
function effects(): Fx[] {
  const sc = (id: string) => scene(id).from;
  const w = (id: string, word: string, n = 0) => wordAt(id, word, n);
  const fx: Fx[] = [
    // open: the world stops dead
    { file: "freeze", at: w("open", "nothing") - 2, vol: 0.5 },
    { file: "tick", at: w("open", "lid"), vol: 0.35 }, { file: "tick", at: w("open", "character"), vol: 0.35 }, { file: "tick", at: w("open", "look,"), vol: 0.35 },
    { file: "impact", at: w("open", "dead") - 4, vol: 0.4 },
    // manycore: five tools land, then drift apart
    { file: "whoosh", at: sc("manycore") - 8, vol: 0.3 },
    ...["SpatialGen", "object,", "parts,", "joints,", "character."].map((x) => ({ file: "pop", at: w("manycore", x) - 6, vol: 0.3 })),
    { file: "split", at: w("manycore", "separate") - 6, vol: 0.4 },
    // turn
    { file: "riser", at: sc("turn") - 78, vol: 0.3 },
    { file: "snap", at: w("turn", "Holorra.") - 8, vol: 0.55 },
    { file: "impact", at: w("turn", "Holorra.") - 4, vol: 0.45 },
    ...["Generate", "Split", "Rig", "Direct"].map((x) => ({ file: "pop", at: w("turn", x) - 5, vol: 0.34 })),
    // worlds
    { file: "whoosh", at: sc("worlds") - 8, vol: 0.3 },
    { file: "click", at: w("worlds", "Five") - 6, vol: 0.45 },
    { file: "swoosh_up", at: w("worlds", "biggest") - 6, vol: 0.28 },
    { file: "chime", at: w("worlds", "ourselves,") - 6, vol: 0.26 },
    // generate
    { file: "whoosh", at: sc("generate") - 8, vol: 0.3 },
    { file: "typing", at: w("generate", "One") - 4, vol: 0.2 },
    { file: "click", at: w("generate", "Lux3D.") + 6, vol: 0.45 },
    { file: "tick", at: w("generate", "couple") - 2, vol: 0.3 }, { file: "tick", at: w("generate", "minutes") - 2, vol: 0.3 },
    { file: "thud", at: w("generate", "lands") - 2, vol: 0.55 },
    { file: "steps", at: w("generate", "Walk") - 4, vol: 0.3 },
    { file: "whoosh", at: w("generate", "slides") - 4, vol: 0.25 },
    // split
    { file: "whoosh", at: sc("split") - 8, vol: 0.3 },
    { file: "pop", at: w("split", "four") - 6, vol: 0.3 }, { file: "pop", at: w("split", "not") - 6, vol: 0.3 },
    { file: "split", at: w("split", "Drag") - 2, vol: 0.5 },
    // articulate
    { file: "whoosh", at: sc("articulate") - 8, vol: 0.3 },
    { file: "servo", at: w("articulate", "hinges") - 6, vol: 0.4 },
    { file: "servo", at: w("articulate", "slides") - 6, vol: 0.32 },
    { file: "chime", at: w("articulate", "real") - 4, vol: 0.26 },
    // rig
    { file: "whoosh", at: sc("rig") - 8, vol: 0.3 },
    { file: "pop", at: w("rig", "Auto") - 6, vol: 0.3 }, { file: "tick", at: w("rig", "52") - 2, vol: 0.3 }, { file: "tick", at: w("rig", "81") - 2, vol: 0.3 },
    { file: "pop", at: w("rig", "Retarget") - 6, vol: 0.3 }, { file: "tick", at: w("rig", "eight") - 2, vol: 0.3 }, { file: "tick", at: w("rig", "17.") - 2, vol: 0.3 },
    { file: "swoosh_up", at: w("rig", "first") - 8, vol: 0.28 },
    { file: "impact", at: w("rig", "rejected.") - 4, vol: 0.28 },
    // play
    { file: "whoosh", at: sc("play") - 8, vol: 0.3 },
    { file: "click", at: w("play", "Play.") - 2, vol: 0.5 },
    { file: "steps", at: w("play", "Walk") - 2, vol: 0.34 }, { file: "steps", at: w("play", "room.") - 2, vol: 0.3 },
    { file: "chime", at: w("play", "beans,") - 4, vol: 0.22 },
    { file: "steam", at: w("play", "brew") - 2, vol: 0.34, dur: 70 },
    { file: "shutter", at: w("play", "shot,") - 2, vol: 0.5 },
    { file: "chime", at: w("play", "dance.") - 2, vol: 0.28 },
    { file: "swoosh_up", at: w("play", "phone,") - 10, vol: 0.28 },
    // direct
    { file: "whoosh", at: sc("direct") - 8, vol: 0.3 },
    { file: "click", at: w("direct", "or") - 2, vol: 0.45 },
    { file: "typing", at: scene("direct").lines[1].startFrame, vol: 0.2, dur: 80 },
    { file: "click", at: w("direct", "Switch") + 8, vol: 0.45 },
    { file: "swoosh_up", at: w("direct", "city") - 2, vol: 0.26 },
    { file: "pop", at: w("direct", "plan") - 4, vol: 0.3 },
    // under
    { file: "whoosh", at: sc("under") - 8, vol: 0.3 },
    { file: "shutter", at: w("under", "Record") - 2, vol: 0.4 },
    { file: "pop", at: w("under", "LuxReal") - 6, vol: 0.3 },
    { file: "swoosh_up", at: w("under", "Under") - 8, vol: 0.3 },
    ...["five", "ten", "22"].map((x) => ({ file: "snap", at: w("under", x) - 6, vol: 0.4 })),
    { file: "chime", at: w("under", "play.") - 2, vol: 0.26 },
    // close
    { file: "whoosh", at: sc("close") - 8, vol: 0.3 },
    { file: "snap", at: w("close", "Holorra.") - 4, vol: 0.5 },
    { file: "impact", at: w("close", "alive.") - 4, vol: 0.4 },
    { file: "chime", at: w("close", "Play") - 2, vol: 0.32 },
    { file: "pop", at: scene("close").lines[1].startFrame - 4, vol: 0.34 },
  ];
  return fx.filter((x) => x.at >= 0 && x.at < T.totalFrames);
}

const NO_CAPTIONS = new Set(["open", "turn", "close"]);

export const Film: React.FC = () => {
  const hideCaptions = (f: number) => {
    const s = T.scenes.find((x) => f >= x.from && f < x.from + x.durationInFrames);
    return !s || NO_CAPTIONS.has(s.id);
  };
  return (
    <AbsoluteFill style={{ background: C.canvas }}>
      {T.scenes.map((s, i) => {
        const S = SCENES[s.id];
        const from = i === 0 ? s.from : s.from - OVERLAP;
        const dur = s.durationInFrames + (i === 0 ? 0 : OVERLAP);
        return S ? (
          <Sequence key={s.id} from={from} durationInFrames={dur} name={s.id}>
            <SceneIn S={S} first={i === 0} />
          </Sequence>
        ) : null;
      })}
      <Grain opacity={0.05} />
      <Captions hidden={hideCaptions} />
      <Audio src={staticFile("audio/music.mp3")} volume={musicVolume} />
      {T.scenes.flatMap((s) => s.lines).map((l, i) => (
        <Sequence key={`vo${i}`} from={l.startFrame} durationInFrames={l.durationFrames} name={`vo ${l.text.slice(0, 18)}`}>
          <Audio src={staticFile(l.file)} volume={1} />
        </Sequence>
      ))}
      {effects().map((x, i) => (
        <Sequence key={`fx${i}`} from={x.at} durationInFrames={x.dur ?? 150} name={`fx ${x.file}`}>
          <Audio src={staticFile(`audio/sfx/${x.file}.mp3`)} volume={(f) => x.vol * (x.dur ? interpolate(f, [0, 8, x.dur - 20, x.dur], [0, 1, 1, 0], clamp) : 1)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
