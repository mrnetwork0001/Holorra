"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Glyph } from "@/components/brand/Glyph";
import { BurgerButton, MobileDrawer } from "@/components/brand/MobileDrawer";
import { ScrollProgress } from "@/components/landing/Reveal";

export interface NavLink {
  label: string;
  href: string;
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
                    {l.label}
                  </span>
                ) : (
                  <Link key={l.href} href={l.href} className="px-3 py-1.5 text-[13px] text-ink-2 transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                )
              )}
            </div>
            <Link href="/report" className="btn btn-sm ml-2 max-[900px]:hidden">
              <Glyph name="doc" size={14} />
              Report
            </Link>
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
              Launch App
            </Link>
            <Link href="/report" onClick={close} className="btn btn-lg w-full">
              Project report
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
              {l.label}
            </Link>
          ))}
          <Link href="/mcp" onClick={close} className="drawer-link">
            MCP hub
          </Link>
          {!links.some((l) => l.href === "/docs") && (
            <Link href="/docs" onClick={close} className="drawer-link">
              Docs
            </Link>
          )}
        </nav>
      </MobileDrawer>
    </>
  );
}
