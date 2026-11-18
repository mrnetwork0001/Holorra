"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { BurgerButton, MobileDrawer } from "@/components/brand/MobileDrawer";
import { DOC_GROUPS, REPO_URL } from "@/components/docs/nav";

const TOP_LINKS = [
  { label: "App", href: "/studio" },
  { label: "Bench", href: "/lab" },
  { label: "Report", href: "/report" },
  { label: "GitHub", href: REPO_URL, external: true },
];

function SideNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Documentation" className="space-y-8">
      {DOC_GROUPS.map((g) => (
        <div key={g.label}>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent/80">{g.label}</div>
          <ul className="mt-3 border-l border-line">
            {g.items.map((d) => {
              const active = pathname === d.href;
              return (
                <li key={d.href}>
                  <Link
                    href={d.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`-ml-px block border-l px-4 py-2 text-[14.5px] transition-colors ${
                      active
                        ? "border-accent bg-accent/[0.07] text-accent"
                        : "border-transparent text-ink-2 hover:border-line-strong hover:text-ink"
                    }`}
                  >
                    {d.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function DocsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/docs";
  const [drawer, setDrawer] = useState(false);
  const close = useCallback(() => setDrawer(false), []);
  useEffect(() => setDrawer(false), [pathname]);

  return (
    <div className="relative min-h-screen bg-canvas text-ink">
      {/* faint drafting grid, fading toward the bottom */}
      <div
        aria-hidden
        className="hairline-grid pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{ maskImage: "linear-gradient(to bottom, black, transparent 85%)", WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)" }}
      />

      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-4 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Holorra home">
            <Logo size={22} />
          </Link>
          <span className="h-6 w-px bg-line" />
          <Link href="/docs" className="font-mono text-[11px] uppercase tracking-[0.24em] text-ink-3 hover:text-ink">
            Docs
          </Link>
          <nav aria-label="Site" className="ml-auto hidden items-center gap-8 min-[901px]:flex">
            {TOP_LINKS.map((l) =>
              l.external ? (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[12px] uppercase tracking-[0.2em] text-ink-2 hover:text-accent"
                >
                  {l.label}
                </a>
              ) : (
                <Link key={l.label} href={l.href} className="font-mono text-[12px] uppercase tracking-[0.2em] text-ink-2 hover:text-accent">
                  {l.label}
                </Link>
              )
            )}
          </nav>
          <div className="ml-auto min-[901px]:hidden">
            <BurgerButton open={drawer} onClick={() => setDrawer((d) => !d)} label="Docs menu" />
          </div>
        </div>
      </header>

      <MobileDrawer
        open={drawer}
        onClose={close}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Link href="/studio" className="btn btn-primary" onClick={close}>
              Launch App
            </Link>
            <Link href="/report" className="btn" onClick={close}>
              Report
            </Link>
          </div>
        }
      >
        <div className="p-5">
          <SideNav pathname={pathname} onNavigate={close} />
        </div>
      </MobileDrawer>

      <div className="relative mx-auto grid max-w-[1320px] gap-12 px-5 sm:px-8 min-[901px]:grid-cols-[250px_minmax(0,1fr)] lg:gap-20">
        <aside className="hidden min-[901px]:block">
          <div className="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto py-12 pr-2">
            <SideNav pathname={pathname} />
          </div>
        </aside>
        <main className="min-w-0 py-12 sm:py-14">{children}</main>
      </div>
    </div>
  );
}
