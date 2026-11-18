"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AHOLO_WORLD_PRESETS, type AholoWorldPreset } from "@/config/aholo-presets";
import { Glyph } from "@/components/brand/Glyph";
import { Logo } from "@/components/brand/Logo";
import { BurgerButton } from "@/components/brand/MobileDrawer";

export interface StudioHeaderProps {
  /** ≤ 900px: burger that opens the docks drawer (state owned by the page) */
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  activeWorldPreset: AholoWorldPreset;
  onSelectWorldPreset: (preset: AholoWorldPreset) => void;
  apiKey: string;
  region: "com" | "cn";
  hasServerKey: boolean;
  onSaveApiConfig: (key: string, region: "com" | "cn") => void;
  splatExposure?: number;
  onExposureChange?: (val: number) => void;
  radialSort?: boolean;
  onRadialSortChange?: (val: boolean) => void;
}

const NAV = [
  { href: "/studio", label: "Studio" },
  { href: "/report", label: "Report" },
  { href: "/mcp", label: "MCP" },
];

const REGIONS: { id: "com" | "cn"; label: string; host: string }[] = [
  { id: "com", label: "Global", host: "api.aholo.ai" },
  { id: "cn", label: "China", host: "api.aholo.cn" },
];

export default function StudioHeader({
  activeWorldPreset,
  onSelectWorldPreset,
  apiKey,
  region,
  hasServerKey,
  onSaveApiConfig,
  splatExposure = 1.0,
  onExposureChange,
  radialSort = true,
  onRadialSortChange,
  menuOpen = false,
  onToggleMenu,
}: StudioHeaderProps) {
  const pathname = usePathname();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showRenderPopover, setShowRenderPopover] = useState(false);
  const [draftKey, setDraftKey] = useState(apiKey);
  const [draftRegion, setDraftRegion] = useState<"com" | "cn">(region);

  const isKeyConfigured = Boolean(apiKey || hasServerKey);
  const isStudio = pathname === "/studio";

  return (
    <>
      <header className="relative z-40 flex h-12 w-full shrink-0 items-center gap-5 border-b border-line bg-surface px-3 max-[900px]:sticky max-[900px]:top-0 max-[900px]:h-14 max-[900px]:gap-2 max-[900px]:bg-surface/95 max-[900px]:backdrop-blur-md">
        {/* Brand (mark only on phones) */}
        <Link href="/" className="flex shrink-0 items-center pr-1" title="Holorra home" aria-label="Holorra home">
          <span className="max-[600px]:hidden">
            <Logo size={20} />
          </span>
          <span className="min-[601px]:hidden">
            <Logo size={22} wordmark={false} />
          </span>
        </Link>

        {/* World switcher, phone / tablet: compact native select (16px, no iOS zoom) */}
        {isStudio && (
          <label className="relative min-w-0 flex-1 min-[901px]:hidden">
            <span className="sr-only">World</span>
            <select
              value={activeWorldPreset.id}
              onChange={(e) => {
                const preset = AHOLO_WORLD_PRESETS.find((p) => p.id === e.target.value);
                if (preset) onSelectWorldPreset(preset);
              }}
              className="field h-10 w-full min-w-0 appearance-none truncate pr-8"
            >
              {AHOLO_WORLD_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.code.replace("WORLD-", "")} · {preset.title}
                </option>
              ))}
            </select>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              width={14}
              height={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5.5 8l4.5 4.5L14.5 8" />
            </svg>
          </label>
        )}

        {/* World switcher */}
        {isStudio && (
          <nav aria-label="World" className="hidden h-12 items-stretch gap-4 border-l border-line pl-5 lg:flex">
            {AHOLO_WORLD_PRESETS.map((preset) => {
              const active = preset.id === activeWorldPreset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectWorldPreset(preset)}
                  data-active={active}
                  className="tab h-12"
                  title={preset.subtitle}
                >
                  <span className={`font-mono text-[11px] tabular ${active ? "text-accent" : "text-ink-3"}`}>
                    {preset.code.replace("WORLD-", "")}
                  </span>
                  <span className="hidden xl:inline">{preset.title}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="ml-auto flex shrink-0 items-center gap-1 max-[900px]:ml-0">
          <nav aria-label="Pages" className="flex items-center gap-4 pr-3 max-[900px]:hidden">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`text-[13px] transition-colors ${
                  pathname === n.href ? "text-ink" : "text-ink-3 hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <span className="mx-1 h-5 w-px bg-line max-[900px]:hidden" aria-hidden="true" />

          {isStudio && onExposureChange && onRadialSortChange && (
            <div className="relative max-[600px]:hidden">
              <button
                type="button"
                onClick={() => setShowRenderPopover(!showRenderPopover)}
                aria-expanded={showRenderPopover}
                title="Splat rendering settings"
                className="btn btn-sm btn-ghost"
              >
                <Glyph name="sliders" size={15} />
                <span className="hidden xl:inline">Render</span>
              </button>

              {showRenderPopover && (
                <div className="panel absolute right-0 top-full z-50 mt-2 w-64 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="label">Splat rendering</span>
                    <button
                      type="button"
                      onClick={() => setShowRenderPopover(false)}
                      className="text-ink-3 hover:text-ink"
                      aria-label="Close"
                    >
                      <Glyph name="close" size={14} />
                    </button>
                  </div>
                  <div className="space-y-3 text-[13px]">
                    <div>
                      <div className="mb-1.5 flex justify-between text-ink-2">
                        <span>Exposure</span>
                        <span className="font-mono text-ink tabular">{splatExposure.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={0.4}
                        max={2.0}
                        step={0.05}
                        value={splatExposure}
                        onChange={(e) => onExposureChange(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <label className="flex cursor-pointer items-center justify-between text-ink-2">
                      <span>Radial depth sort</span>
                      <input
                        type="checkbox"
                        checked={radialSort}
                        onChange={(e) => onRadialSortChange(e.target.checked)}
                        className="accent-[var(--color-accent)]"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setDraftKey(apiKey);
              setDraftRegion(region);
              setShowKeyModal(true);
            }}
            className="btn btn-sm"
            title={isKeyConfigured ? "Aholo API key is set" : "Add an Aholo API key for live jobs"}
          >
            <span className={`dot ${isKeyConfigured ? "dot-ok" : ""}`} />
            <span className="font-mono text-[11px] text-ink-2">{region.toUpperCase()}</span>
            <span className="hidden md:inline">{isKeyConfigured ? "Key set" : "API key"}</span>
          </button>

          {onToggleMenu && <BurgerButton open={menuOpen} onClick={onToggleMenu} label="Studio panels" />}
        </div>
      </header>

      {/* API key + region dialog */}
      {showKeyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="aholo-key-title"
        >
          <div className="panel w-full max-w-md p-5 shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
            <div className="mb-2 flex items-center justify-between">
              <h3 id="aholo-key-title" className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                <Glyph name="key" size={16} className="text-ink-2" />
                Aholo API key
              </h3>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="btn btn-sm btn-ghost btn-icon"
                aria-label="Close"
              >
                <Glyph name="close" size={14} />
              </button>
            </div>

            <p className="mb-5 text-[13px] leading-relaxed text-ink-2">
              The hosted worlds work without a key. Add one to send live SpatialGen, Reality and Lux3D jobs to
              your own account. It&apos;s kept in this browser and sent with each request as{" "}
              <code className="font-mono text-[12px] text-ink">x-aholo-api-key</code>. A server key in{" "}
              <code className="font-mono text-[12px] text-ink">.env.local</code> also works.
            </p>

            <div className="space-y-4">
              <div>
                <div className="label mb-1.5">Region</div>
                <div className="grid grid-cols-2 gap-2">
                  {REGIONS.map((r) => {
                    const active = draftRegion === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setDraftRegion(r.id)}
                        aria-pressed={active}
                        className={`card px-3 py-2 text-left transition-colors ${
                          active ? "border-accent!" : "hover:border-line-strong"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[13px] text-ink">
                          {r.label}
                          <span className="font-mono text-[11px] text-ink-3">{r.id.toUpperCase()}</span>
                        </div>
                        <div className="font-mono text-[11px] text-ink-3">{r.host}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="aholo-key" className="label mb-1.5 block">
                  Key
                </label>
                <input
                  id="aholo-key"
                  type="password"
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                  placeholder={hasServerKey ? "Server key active — optional override" : "Paste the raw key, no “Bearer”"}
                  className="field font-mono"
                  autoComplete="off"
                />
              </div>

              <div className="flex items-center gap-4 text-[12px]">
                <a
                  href="https://labs.aholo.ai/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-ink-2 hover:text-ink"
                >
                  Get a key at labs.aholo.ai
                  <Glyph name="external" size={12} />
                </a>
                <a
                  href="https://3d.aholo.ai/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-ink-2 hover:text-ink"
                >
                  Lux3D portal
                  <Glyph name="external" size={12} />
                </a>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
                <button type="button" onClick={() => setShowKeyModal(false)} className="btn btn-sm btn-ghost">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSaveApiConfig(draftKey.trim(), draftRegion);
                    setShowKeyModal(false);
                  }}
                  className="btn btn-sm btn-primary"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
