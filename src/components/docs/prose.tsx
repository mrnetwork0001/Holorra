import Link from "next/link";
import { docNeighbours } from "@/components/docs/nav";

/** Building blocks for docs pages. Server components; plain markup, no client JS. */

export function DocArticle({ href, title, lead, children }: { href: string; title: string; lead: React.ReactNode; children: React.ReactNode }) {
  const { prev, next } = docNeighbours(href);
  return (
    <article className="max-w-[780px]">
      <h1 className="font-serif text-[44px] leading-[1.02] tracking-[-0.01em] text-ink sm:text-[56px]">{title}</h1>
      <div className="mt-6 text-[17.5px] leading-[1.75] text-ink-2 [&_strong]:font-medium [&_strong]:text-ink">{lead}</div>
      <div className="docs-body">{children}</div>
      <nav aria-label="Pager" className="mt-16 grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
        {prev ? (
          <Link href={prev.href} className="group block">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3">Previous</div>
            <div className="mt-1.5 text-[15px] text-ink-2 group-hover:text-accent">{prev.title}</div>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={next.href} className="group block sm:text-right">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3">Next</div>
            <div className="mt-1.5 text-[15px] text-ink-2 group-hover:text-accent">{next.title}</div>
          </Link>
        )}
      </nav>
    </article>
  );
}

/** A titled section, separated from the previous one by a hairline. */
export function H2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-14 scroll-mt-24 border-t border-line pt-10 text-[26px] font-semibold tracking-[-0.01em] text-ink">
      {children}
    </h2>
  );
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 text-[17px] font-semibold text-ink">{children}</h3>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[16px] leading-[1.75] text-ink-2 [&_strong]:font-medium [&_strong]:text-ink">{children}</p>;
}

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  const external = /^https?:/.test(href);
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className="text-accent underline-offset-4 hover:underline">
      {children}
    </a>
  ) : (
    <Link href={href} className="text-accent underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-[4px] border border-line bg-surface px-1.5 py-0.5 font-mono text-[0.86em] text-ink [overflow-wrap:anywhere]">
      {children}
    </code>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="mt-4 space-y-2.5 pl-5 text-[16px] leading-[1.7] text-ink-2 marker:text-ink-3 [list-style:disc] [&_strong]:font-medium [&_strong]:text-ink">
      {children}
    </ul>
  );
}

export function OL({ children }: { children: React.ReactNode }) {
  return (
    <ol className="mt-4 space-y-2.5 pl-6 text-[16px] leading-[1.7] text-ink-2 marker:font-mono marker:text-ink-3 [list-style:decimal] [&_strong]:font-medium [&_strong]:text-ink">
      {children}
    </ol>
  );
}

/** Two-column reference table ("Where everything lives"). */
export function KV({ rows }: { rows: [React.ReactNode, React.ReactNode][] }) {
  return (
    <div className="mt-6 border-t border-line">
      {rows.map(([k, v], i) => (
        <div key={i} className="grid gap-1 border-b border-line px-1 py-3.5 sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] sm:gap-6 sm:px-4">
          <div className="text-[15px] text-ink-2">{k}</div>
          <div className="min-w-0 text-[15px] text-ink-2 [overflow-wrap:anywhere]">{v}</div>
        </div>
      ))}
    </div>
  );
}

/** Full table with a header row. Scrolls inside itself on narrow screens. */
export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left">
        <thead>
          <tr className="border-y border-line">
            {head.map((h) => (
              <th key={h} className="label px-3 py-2.5 font-medium first:pl-1">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line align-top">
              {r.map((cell, j) => (
                <td key={j} className="px-3 py-3 text-[14.5px] leading-relaxed text-ink-2 first:pl-1 [&_code]:whitespace-nowrap [&_strong]:font-medium [&_strong]:text-ink">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Callout({ tone = "note", children }: { tone?: "note" | "warn"; children: React.ReactNode }) {
  return (
    <div
      className={`mt-8 border-l-2 bg-surface px-6 py-5 text-[15.5px] leading-[1.75] text-ink-2 [&_strong]:font-medium [&_strong]:text-ink ${
        tone === "warn" ? "border-warn" : "border-accent"
      }`}
    >
      {children}
    </div>
  );
}

export function Pre({ title, children }: { title?: string; children: string }) {
  return (
    <div className="mt-6 border border-line bg-surface">
      {title && <div className="border-b border-line px-4 py-2 font-mono text-[11.5px] text-ink-3">{title}</div>}
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-ink-2">{children}</pre>
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <span className="kbd">{children}</span>;
}

/** Inline figure from /public, with a caption. */
export function Fig({ src, alt, caption }: { src: string; alt: string; caption: React.ReactNode }) {
  return (
    <figure className="mt-8">
      <div className="overflow-hidden border border-line bg-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="block h-auto w-full" />
      </div>
      <figcaption className="mt-2.5 text-[13px] leading-relaxed text-ink-3">{caption}</figcaption>
    </figure>
  );
}
