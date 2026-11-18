"use client";

import { useEffect } from "react";
import { Logo } from "@/components/brand/Logo";

/**
 * Mobile navigation pattern (≤ 900px, see docs/MOBILE.md):
 * a burger that animates to ×, and a left drawer with a dimmed backdrop that
 * closes on backdrop tap, Esc, the Close button, and (via onClose from the
 * caller) after any navigation. Hidden entirely on desktop (≥ 901px).
 */
export function BurgerButton({ open, onClick, label = "Menu" }: { open: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      aria-label={open ? `Close ${label.toLowerCase()}` : `Open ${label.toLowerCase()}`}
      aria-expanded={open}
      onClick={onClick}
      className={`burger-btn min-[901px]:!hidden ${open ? "open" : ""}`}
    >
      <span />
      <span />
      <span />
    </button>
  );
}

export function MobileDrawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = "min(88vw, 320px)",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  // Esc closes; lock page scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={`drawer-backdrop min-[901px]:!hidden ${open ? "show" : ""}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={`drawer min-[901px]:!hidden ${open ? "open" : ""}`}
        style={{ width }}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
          {title ?? <Logo />}
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close menu">
            <svg viewBox="0 0 20 20" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-line p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">{footer}</div>}
      </aside>
    </>
  );
}
