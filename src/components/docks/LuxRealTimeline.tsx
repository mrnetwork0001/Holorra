"use client";

import React, { useState } from "react";
import {
  buildLuxRealStoryboardBundle,
  type CameraKeyframe,
} from "@/lib/luxreal-exporter";
import { Glyph } from "@/components/brand/Glyph";

export interface LuxRealTimelineProps {
  worldPresetId: string;
  worldTitle: string;
  heroAssetName: string;
  actorName: string;
  activeAnimationClip: string;
  partExplosionPercent: number;
  keyframes: CameraKeyframe[];
  isPlayingSpline: boolean;
  onTogglePlaySpline: () => void;
  onDeleteKeyframe: (id: string) => void;
}

export default function LuxRealTimeline({
  worldPresetId,
  worldTitle,
  heroAssetName,
  actorName,
  activeAnimationClip,
  partExplosionPercent,
  keyframes,
  isPlayingSpline,
  onTogglePlaySpline,
  onDeleteKeyframe,
}: LuxRealTimelineProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const totalDuration = keyframes.reduce((acc, k) => acc + k.durationSec, 0);

  const buildBundle = () =>
    buildLuxRealStoryboardBundle({
      worldPresetId,
      worldTitle,
      heroAssetName,
      actorName,
      activeAnimationClip,
      partExplosionPercent,
      keyframes,
    });

  const handleExportBundle = () => {
    const bundle = buildBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `holorra-luxreal-storyboard-${worldPresetId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMasterPrompt = () => {
    const bundle = buildBundle();
    navigator.clipboard.writeText(bundle.masterVideoPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <section
      aria-label="Camera path"
      className="flex h-[136px] shrink-0 select-none flex-col border-t border-line bg-surface max-[900px]:h-auto max-[900px]:pb-[env(safe-area-inset-bottom)]"
    >
      {/* Header row (wraps to title + full-width actions on phones) */}
      <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-line px-3 max-[900px]:h-auto max-[900px]:flex-wrap max-[900px]:gap-2 max-[900px]:py-2">
        <div className="flex min-w-0 items-center gap-3 max-[900px]:flex-1">
          <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
            <Glyph name="spline" size={15} className="text-ink-2" />
            Camera path
          </span>
          <span className="truncate font-mono text-[11px] text-ink-3 tabular">
            {keyframes.length} keyframes · {totalDuration.toFixed(1)} s · Catmull-Rom
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 max-[900px]:w-full max-[900px]:flex-wrap">
          <button
            type="button"
            onClick={onTogglePlaySpline}
            disabled={keyframes.length < 2}
            className={`btn btn-sm max-[900px]:flex-1 ${isPlayingSpline ? "" : "btn-primary"}`}
          >
            <Glyph name={isPlayingSpline ? "stop" : "play"} size={12} />
            {isPlayingSpline ? "Stop" : "Play path"}
          </button>

          <button
            type="button"
            onClick={handleCopyMasterPrompt}
            className="btn btn-sm btn-ghost max-[900px]:w-10 max-[900px]:px-0"
            title="Copy the LuxReal video prompt"
            aria-label="Copy the LuxReal video prompt"
          >
            <Glyph name={copiedPrompt ? "check" : "copy"} size={14} className={copiedPrompt ? "text-ok" : ""} />
            <span className="hidden lg:inline">{copiedPrompt ? "Copied" : "Copy prompt"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportBundle}
            className="btn btn-sm btn-ghost max-[900px]:w-10 max-[900px]:px-0"
            title="Download the storyboard as JSON"
            aria-label="Download the storyboard as JSON"
          >
            <Glyph name="download" size={14} />
            <span className="hidden lg:inline">Storyboard JSON</span>
          </button>

          <a
            href="https://www.luxreal.com/create-video?createType=8"
            target="_blank"
            rel="noreferrer"
            className="btn btn-sm"
            title="Open LuxReal's video creator"
          >
            Open in LuxReal
            <Glyph name="external" size={12} className="text-ink-3" />
          </a>
        </div>
      </div>

      {/* Keyframe track — card width follows shot duration */}
      <ol className="flex min-w-0 flex-1 items-stretch gap-2 overflow-x-auto px-3 py-2.5 max-[900px]:flex-none max-[900px]:snap-x max-[900px]:snap-mandatory max-[900px]:scroll-px-3">
        {keyframes.map((kf, index) => (
          <li
            key={kf.id}
            className="group card flex shrink-0 snap-start items-center gap-2.5 p-1.5 transition-colors hover:border-line-strong"
            style={{ width: Math.round(236 + kf.durationSec * 16) }}
          >
            {kf.snapshotDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={kf.snapshotDataUrl}
                alt={kf.label}
                className="h-[52px] w-[72px] shrink-0 rounded-[4px] border border-line object-cover"
              />
            ) : (
              <div className="flex h-[52px] w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-[4px] border border-line bg-canvas">
                <Glyph name="keyframe" size={12} className="text-accent" />
                <span className="font-mono text-[11px] text-ink-2 tabular">{String(index + 1).padStart(2, "0")}</span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12px] font-medium text-ink">{kf.label}</span>
                <span className="shrink-0 font-mono text-[11px] text-ink-3 tabular">{kf.durationSec.toFixed(1)} s</span>
              </div>
              <div className="mt-0.5 truncate font-mono text-[10.5px] text-ink-3 tabular">
                {kf.position.map((n) => n.toFixed(1)).join("  ")}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-ink-3" title={kf.luxrealPrompt}>
                {kf.luxrealPrompt}
              </div>
            </div>

            {keyframes.length > 2 && (
              <button
                type="button"
                onClick={() => onDeleteKeyframe(kf.id)}
                className="self-start rounded p-1 text-ink-3 opacity-0 transition hover:text-err group-hover:opacity-100 focus-visible:opacity-100 max-[900px]:p-2 max-[900px]:opacity-100"
                title="Remove keyframe"
                aria-label={`Remove ${kf.label}`}
              >
                <Glyph name="trash" size={13} />
              </button>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
