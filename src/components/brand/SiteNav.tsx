"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { BurgerButton, MobileDrawer } from "@/components/brand/MobileDrawer";
import { ScrollProgress } from "@/components/landing/Reveal";
import LangSwitch from "@/components/brand/LangSwitch";
import { T } from "@/lib/i18n";

export interface NavLink {
  label: string;
  href: string;
  /** 简体中文 label; common labels are translated automatically */
  zh?: string;
}

const NAV_ZH: Record<string, string> = {
  Pipeline: "流程",
  Results: "成果",
  Worlds: "世界",
  Features: "功能",
  "Lux3D bench": "Lux3D 测试台",
  Docs: "文档",
  Home: "首页",
  Studio: "创作台",
  MCP: "MCP",
  Report: "报告",
};

function Label({ l }: { l: NavLink }) {
  return <T en={l.label} zh={l.zh ?? NAV_ZH[l.label] ?? l.label} />;
}

/**
 * Header for the marketing pages (landing, Lux3D bench).
 * Desktop (≥ 901px): logo left, links + Report button right.
 * Phone/tablet (≤ 900px): logo left, burger right → left drawer with the same
 * links and Launch App pinned at the bottom (docs/MOBILE.md).
 */
export default function SiteNav({
  links,
  current,
  progress = false,
}: {
  links: NavLink[];
  current?: string;
  progress?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-canvas/90 max-[900px]:backdrop-blur-md">
        {progress && <ScrollProgress />}
        <nav className="landing-nav-wrap flex h-14 items-center gap-6">
          <Link href="/" aria-label="Holorra home" onClick={close}>
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <div className="flex items-center max-[900px]:hidden">
              {links.map((l) =>
                l.href === current ? (
                  <span key={l.href} className="px-3 py-1.5 text-[13px] text-ink">
                    <Label l={l} />
                  </span>
                ) : (
                  <Link key={l.href} href={l.href} className="px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:text-ink">
                    <Label l={l} />
                  </Link>
                )
              )}
            </div>
            <LangSwitch size="sm" className="ml-2" />
            <BurgerButton open={open} onClick={() => setOpen((o) => !o)} />
          </div>
        </nav>
      </header>

      <MobileDrawer
        open={open}
        onClose={close}
        footer={
          <div className="grid gap-2">
            <Link href="/studio" onClick={close} className="btn btn-primary btn-lg w-full">
              <T en="Launch App" zh="启动应用" />
            </Link>
            <Link href="/report" onClick={close} className="btn btn-lg w-full">
              <T en="Project report" zh="项目报告" />
            </Link>
          </div>
        }
      >
        <nav aria-label="Site">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              aria-current={l.href === current ? "page" : undefined}
              className="drawer-link"
            >
              <Label l={l} />
            </Link>
          ))}
          <Link href="/mcp" onClick={close} className="drawer-link">
            <T en="MCP hub" zh="MCP 中心" />
          </Link>
          {!links.some((l) => l.href === "/docs") && (
            <Link href="/docs" onClick={close} className="drawer-link">
              <T en="Docs" zh="文档" />
            </Link>
          )}
        </nav>
      </MobileDrawer>
    </>
  );
}
