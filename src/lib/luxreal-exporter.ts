export interface CameraKeyframe {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  durationSec: number;
  luxrealPrompt: string;
  snapshotDataUrl?: string;
}

export interface InterpolatedCameraFrame {
  position: [number, number, number];
  target: [number, number, number];
  activeKeyframeIndex: number;
  normalizedProgress: number;
}

/**
 * Catmull-Rom spline interpolation between 3D vectors for smooth cinematic camera trajectories.
 */
function catmullRomVec3(
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number],
  t: number
): [number, number, number] {
  const t2 = t * t;
  const t3 = t2 * t;

  const interp = (i: 0 | 1 | 2) =>
    0.5 *
    (2 * p1[i] +
      (-p0[i] + p2[i]) * t +
      (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 +
      (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3);

  return [interp(0), interp(1), interp(2)];
}

export function evaluateCameraSpline(
  keyframes: CameraKeyframe[],
  normalizedTime: number // 0.0 to 1.0
): InterpolatedCameraFrame {
  if (keyframes.length === 0) {
    return {
      position: [-3, 0.8, 1.2],
      target: [0, 0, 0],
      activeKeyframeIndex: 0,
      normalizedProgress: 0,
    };
  }
  if (keyframes.length === 1) {
    return {
      position: [...keyframes[0].position],
      target: [...keyframes[0].target],
      activeKeyframeIndex: 0,
      normalizedProgress: normalizedTime,
    };
  }

  const clamped = Math.max(0, Math.min(0.9999, normalizedTime));
  const totalSegments = keyframes.length - 1;
  const scaled = clamped * totalSegments;
  const idx = Math.floor(scaled);
  const localT = scaled - idx;

  const p0 = keyframes[Math.max(0, idx - 1)];
  const p1 = keyframes[idx];
  const p2 = keyframes[Math.min(keyframes.length - 1, idx + 1)];
  const p3 = keyframes[Math.min(keyframes.length - 1, idx + 2)];

  return {
    position: catmullRomVec3(p0.position, p1.position, p2.position, p3.position, localT),
    target: catmullRomVec3(p0.target, p1.target, p2.target, p3.target, localT),
    activeKeyframeIndex: idx,
    normalizedProgress: clamped,
  };
}

export interface LuxRealStoryboardExportBundle {
  schema: "manycore.aholo.luxreal.storyboard.v1";
  exportedAt: string;
  projectTitle: string;
  worldPresetId: string;
  worldTitle: string;
  heroAssetName: string;
  actorName: string;
  activeAnimationClip: string;
  partExplosionPercent: number;
  totalDurationSec: number;
  luxrealPortalUrl: string;
  masterVideoPrompt: string;
  shots: {
    shotNumber: number;
    label: string;
    durationSec: number;
    cameraPosition: [number, number, number];
    cameraLookAt: [number, number, number];
    luxrealPrompt: string;
    hasKeyframeSnapshot: boolean;
  }[];
}

export function buildLuxRealStoryboardBundle(params: {
  worldPresetId: string;
  worldTitle: string;
  heroAssetName: string;
  actorName: string;
  activeAnimationClip: string;
  partExplosionPercent: number;
  keyframes: CameraKeyframe[];
}): LuxRealStoryboardExportBundle {
  const totalDurationSec = params.keyframes.reduce((acc, k) => acc + k.durationSec, 0);
  const masterVideoPrompt = [
    `[LuxReal 3D-Consistent Scene Brief] World: ${params.worldTitle}.`,
    `Hero Prop: ${params.heroAssetName} (Lux3D Part-Split at ${params.partExplosionPercent}% explosion).`,
    `Rigged Actor: ${params.actorName} performing ${params.activeAnimationClip}.`,
    ...params.keyframes.map((k, i) => `Shot ${i + 1} (${k.durationSec}s): ${k.luxrealPrompt}`),
  ].join(" ");

  return {
    schema: "manycore.aholo.luxreal.storyboard.v1",
    exportedAt: new Date().toISOString(),
    projectTitle: `Holorra — ${params.worldTitle} Spatial Sequence`,
    worldPresetId: params.worldPresetId,
    worldTitle: params.worldTitle,
    heroAssetName: params.heroAssetName,
    actorName: params.actorName,
    activeAnimationClip: params.activeAnimationClip,
    partExplosionPercent: params.partExplosionPercent,
    totalDurationSec,
    luxrealPortalUrl: "https://www.luxreal.com/create-video?createType=8",
    masterVideoPrompt,
    shots: params.keyframes.map((kf, idx) => ({
      shotNumber: idx + 1,
      label: kf.label,
      durationSec: kf.durationSec,
      cameraPosition: kf.position,
      cameraLookAt: kf.target,
      luxrealPrompt: kf.luxrealPrompt,
      hasKeyframeSnapshot: Boolean(kf.snapshotDataUrl),
    })),
  };
}
