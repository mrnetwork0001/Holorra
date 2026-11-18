"use client";

import { useSyncExternalStore } from "react";
import { LANG_EVENT, LANG_STORAGE_KEY, type Lang } from "@/lib/i18n";

function read(): Lang {
  return document.documentElement.getAttribute("data-lang") === "zh" ? "zh" : "en";
}

function subscribe(cb: () => void) {
  window.addEventListener(LANG_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(LANG_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Current UI language in client components (for attributes, toasts, canvas text). */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, read, () => "en");
}

export function setLang(lang: Lang) {
  const h = document.documentElement;
  h.setAttribute("data-lang", lang);
  h.lang = lang === "zh" ? "zh-CN" : "en";
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* private mode: the choice lasts for this page only */
  }
  window.dispatchEvent(new Event(LANG_EVENT));
}

/** 中 / EN pill, the same pattern as the Aholo hackathon site. */
export default function LangSwitch({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" }) {
  const lang = useLang();
  const h = size === "sm" ? "h-7" : "h-8";
  const seg = size === "sm" ? "h-[22px] min-w-[30px] px-2 text-[11.5px]" : "h-[26px] min-w-[34px] px-2.5 text-[12.5px]";
  return (
    <div
      role="radiogroup"
      aria-label="Language / 语言"
      translate="no"
      className={`notranslate inline-flex ${h} shrink-0 items-center gap-0.5 rounded-full border border-line-strong bg-canvas/60 p-[2px] ${className}`}
    >
      {(
        [
          ["zh", "中", "简体中文"],
          ["en", "EN", "English"],
        ] as const
      ).map(([id, label, name]) => {
        const active = lang === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            title={name}
            onClick={() => setLang(id)}
            className={`${seg} rounded-full font-mono transition-colors ${
              active ? "bg-raised text-ink shadow-[inset_0_0_0_1px_var(--color-line-strong)]" : "text-ink-3 hover:text-ink"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
