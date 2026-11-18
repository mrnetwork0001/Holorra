"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AHOLO_WORLD_PRESETS, type AholoWorldPreset } from "@/config/aholo-presets";
import { Glyph } from "@/components/brand/Glyph";
import { Logo } from "@/components/brand/Logo";
import { BurgerButton } from "@/components/brand/MobileDrawer";
import LangSwitch, { useLang } from "@/components/brand/LangSwitch";
import { T, tx } from "@/lib/i18n";

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
  /** bump to open the API key dialog from elsewhere (e.g. the daily-limit notice) */
  openKeySignal?: number;
}

const NAV = [
  { href: "/studio", label: "Studio", zh: "创作台" },
  { href: "/report", label: "Report", zh: "报告" },
  { href: "/mcp", label: "MCP", zh: "MCP" },
  { href: "/docs", label: "Docs", zh: "文档" },
];

const REGIONS: { id: "com" | "cn"; label: string; zh: string; host: string }[] = [
  { id: "com", label: "Global", zh: "全球", host: "api.aholo.ai" },
  { id: "cn", label: "China", zh: "中国", host: "api.aholo.cn" },
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
  openKeySignal = 0,
}: StudioHeaderProps) {
  const pathname = usePathname();
  const lang = useLang();
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showRenderPopover, setShowRenderPopover] = useState(false);
  const [draftKey, setDraftKey] = useState(apiKey);
  const [draftRegion, setDraftRegion] = useState<"com" | "cn">(region);

  useEffect(() => {
    if (!openKeySignal) return;
    setDraftKey(apiKey);
    setDraftRegion(region);
    setShowKeyModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKeySignal]);

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
            <span className="sr-only">
              <T en="World" zh="世界" />
            </span>
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
                  {preset.code.replace("WORLD-", "")} · {lang === "zh" && preset.titleZh ? preset.titleZh : preset.title}
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
                  <span className="hidden xl:inline">
                    <T en={preset.title} zh={preset.titleZh ?? preset.title} />
                  </span>
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
                <T en={n.label} zh={n.zh} />
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
                title={tx(lang, { en: "Splat rendering settings", zh: "高斯点渲染设置" })}
                className="btn btn-sm btn-ghost"
              >
                <Glyph name="sliders" size={15} />
                <span className="hidden xl:inline">
                  <T en="Render" zh="渲染" />
                </span>
              </button>

              {showRenderPopover && (
                <div className="panel absolute right-0 top-full z-50 mt-2 w-64 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.5)]">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="label">
                      <T en="Splat rendering" zh="高斯点渲染" />
                    </span>
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
                        <span>
                          <T en="Exposure" zh="曝光" />
                        </span>
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
                      <span>
                        <T en="Radial depth sort" zh="径向深度排序" />
                      </span>
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
            title={
              isKeyConfigured
                ? tx(lang, { en: "Aholo API key is set", zh: "已设置 Aholo API 密钥" })
                : tx(lang, { en: "Add an Aholo API key for live jobs", zh: "添加 Aholo API 密钥以运行实时任务" })
            }
          >
            <span className={`dot ${isKeyConfigured ? "dot-ok" : ""}`} />
            <span className="font-mono text-[11px] text-ink-2">{region.toUpperCase()}</span>
            <span className="hidden md:inline">
              {isKeyConfigured ? <T en="Key set" zh="密钥已设置" /> : <T en="API key" zh="API 密钥" />}
            </span>
          </button>

          <LangSwitch size="sm" className="ml-1" />

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
                <T en="Aholo API key" zh="Aholo API 密钥" />
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
              <T
                en={
                  <>
                    The hosted worlds work without a key. Add one to send live SpatialGen, Reality and Lux3D jobs to
                    your own account. It&apos;s kept in this browser and sent with each request as{" "}
                    <code className="font-mono text-[12px] text-ink">x-aholo-api-key</code>. A server key in{" "}
                    <code className="font-mono text-[12px] text-ink">.env.local</code> also works.
                  </>
                }
                zh={
                  <>
                    托管世界无需密钥即可使用。添加密钥后，可以用你自己的账户发送实时 SpatialGen、Reality 和 Lux3D
                    任务。密钥只保存在本浏览器中，每次请求通过{" "}
                    <code className="font-mono text-[12px] text-ink">x-aholo-api-key</code> 发送。也可以在{" "}
                    <code className="font-mono text-[12px] text-ink">.env.local</code> 中配置服务端密钥。
                  </>
                }
              />
            </p>

            <div className="space-y-4">
              <div>
                <div className="label mb-1.5">
                  <T en="Region" zh="区域" />
                </div>
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
                          <T en={r.label} zh={r.zh} />
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
                  <T en="Key" zh="密钥" />
                </label>
                <input
                  id="aholo-key"
                  type="password"
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                  placeholder={
                    hasServerKey
                      ? tx(lang, { en: "Server key active, optional override", zh: "服务端密钥已生效，可选覆盖" })
                      : tx(lang, { en: "Paste the raw key, no “Bearer”", zh: "粘贴原始密钥，不要加 “Bearer”" })
                  }
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
                  <T en="Get a key at labs.aholo.ai" zh="在 labs.aholo.ai 获取密钥" />
                  <Glyph name="external" size={12} />
                </a>
                <a
                  href="https://3d.aholo.ai/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-ink-2 hover:text-ink"
                >
                  <T en="Lux3D portal" zh="Lux3D 官网" />
                  <Glyph name="external" size={12} />
                </a>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
                <button type="button" onClick={() => setShowKeyModal(false)} className="btn btn-sm btn-ghost">
                  <T en="Cancel" zh="取消" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSaveApiConfig(draftKey.trim(), draftRegion);
                    setShowKeyModal(false);
                  }}
                  className="btn btn-sm btn-primary"
                >
                  <T en="Save" zh="保存" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
