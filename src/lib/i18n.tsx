/**
 * Bilingual text (English / 简体中文) without a runtime dependency.
 *
 * Every translated string is rendered in both languages; CSS in globals.css
 * hides the inactive one based on <html data-lang>. That keeps pages static,
 * makes the 中 / EN switch instant, and works in server components.
 * An inline script in the root layout sets data-lang before first paint
 * (stored choice, else the browser language), so there is no flash.
 *
 * - <T en="..." zh="..." />   inline text (spans)
 * - <TB en={...} zh={...} />  block content (divs), when children are blocks
 * - tx(lang, { en, zh })      plain strings for attributes, in client
 *                             components together with useLang()
 */
import type { ReactNode } from "react";

export type Lang = "en" | "zh";
export const LANG_STORAGE_KEY = "holorra_lang";
export const LANG_EVENT = "holorra:lang";

export interface L<TValue = string> {
  en: TValue;
  zh: TValue;
}

export function T({ en, zh }: { en: ReactNode; zh: ReactNode }) {
  return (
    <>
      <span className="i18n-en" lang="en" translate="no">
        {en}
      </span>
      <span className="i18n-zh" lang="zh-CN" translate="no">
        {zh}
      </span>
    </>
  );
}

export function TB({ en, zh, className }: { en: ReactNode; zh: ReactNode; className?: string }) {
  return (
    <>
      <div className={`i18n-en ${className ?? ""}`} lang="en" translate="no">
        {en}
      </div>
      <div className={`i18n-zh ${className ?? ""}`} lang="zh-CN" translate="no">
        {zh}
      </div>
    </>
  );
}

export function tx<TValue>(lang: Lang, s: L<TValue>): TValue {
  return lang === "zh" ? s.zh : s.en;
}

/** Runs before first paint (inlined in <head>): stored choice, else browser language. */
export const LANG_BOOT_SCRIPT = `(function(){try{var l=localStorage.getItem("${LANG_STORAGE_KEY}");if(l!=="zh"&&l!=="en"){l=(navigator.language||"").toLowerCase().indexOf("zh")===0?"zh":"en"}var h=document.documentElement;h.setAttribute("data-lang",l);h.lang=l==="zh"?"zh-CN":"en"}catch(e){}})();`;
