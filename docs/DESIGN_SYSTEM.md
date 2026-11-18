# Holorra Design System — "Precision Instrument"

Holorra should feel like a cinema camera or a CAD tool: quiet, exact, content-first.
The 3D stage is the hero; the interface frames it and gets out of the way.

**Never:** neon glows (`shadow-[0_0_…]`), gradients, `backdrop-blur` glass, pulsing/pinging dots,
rainbow multi-accent styling, sparkle icons, emoji (✓ ✗ ✨ 🎬 …), stock icon packs (lucide), pill-shaped
everything, `rounded-2xl`+ cards, ALL-CAPS marketing labels, jargon-stuffed titles.

## 1. Tokens (defined in `src/app/globals.css` `@theme`, used as Tailwind utilities)

| Token | Hex | Use |
| :--- | :--- | :--- |
| `canvas` | `#0B0B0A` | page + 3D stage background (`bg-canvas`) |
| `surface` | `#121210` | panels, docks, header (`bg-surface`) |
| `raised` | `#1A1A17` | cards and controls inside panels (`bg-raised`) |
| `hover` | `#22221E` | hover / pressed state (`bg-hover`) |
| `line` | `#2A2925` | hairline borders + dividers (`border-line`) |
| `line-strong` | `#3B3A35` | emphasized borders |
| `ink` | `#ECE9E2` | primary text (`text-ink`) |
| `ink-2` | `#A9A59B` | secondary text (`text-ink-2`) |
| `ink-3` | `#7D7A71` | labels, captions, muted (`text-ink-3`) |
| `accent` | `#FF6A2B` | **the only accent** — REC orange. Primary action, active tab, selection, live state |
| `accent-ink` | `#1A0B03` | text on accent |
| `ok` / `warn` / `err` | `#8DBF8B` / `#E2B54A` / `#E5574F` | status only, never decoration |

Accent budget: one primary button per view, active states, the logo splat. Everything else is neutral.
Data colors (e.g. per-part colors in the 3D stage) are data, not decoration — they stay.

## 2. Type

- **UI + body:** IBM Plex Sans (`font-sans`, default). Studio UI 13px; landing body 16–18px.
- **Data:** IBM Plex Mono (`font-mono`) for numbers, coordinates, SDK method names, code, IDs. Add `tabular`.
- **Display:** Instrument Serif (`font-serif`) — landing + report headlines only, never in the studio.
- Sentence case everywhere. Micro labels use the `.label` class (mono, 10.5px, uppercase, tracked, `ink-3`).

## 3. Shared component classes (`@layer components` in globals.css)

`.btn` · `.btn-primary` · `.btn-ghost` · `.btn-sm` · `.btn-lg` · `.btn-icon` — buttons (6px radius, no shadow)
`.field` — inputs, selects, textareas · `.label` — micro labels · `.panel` / `.card` — containers
`.chip` / `.chip-accent` — metadata · `.kbd` — key hints · `.tab` + `data-active` — underline tabs
`.dot` / `.dot-live` / `.dot-ok` — static status dots

Radii: 4px (chips), 6px (controls, cards), 8px (panels). Borders are 1px `line`. Spacing on a 4px grid.

## 4. Iconography

Only the custom set in `src/components/brand/Glyph.tsx` (`<Glyph name="split" />`): 20×20 grid,
1.5 stroke, round joins, `currentColor`. Domain glyphs: `splat world reconstruct voxel lod mesh generate
split hinge material fourview layers rig walk orbit eye spline keyframe camera shot record` plus UI glyphs
`play pause stop export download upload doc print copy check cross close plus trash external back
search sliders reset refresh loader key terminal plug chat enter info flag region pointer`.
Add new glyphs to that file in the same style — never import an icon pack.

## 5. Brand

`src/components/brand/Logo.tsx`: a camera viewfinder (the director) framing one gaussian splat
(the world). The splat is the only colored part of the mark. Wordmark "Holorra" in Plex Sans 600.

## 6. Layout

- **Studio:** 48px header · left dock 300px · stage · right dock 340px · bottom timeline. Docks are
  `bg-surface` with `border-line` dividers, no floating cards. Stage overlays are small `bg-surface/95`
  boxes with a hairline border, mono telemetry, no blur.
- **Landing / report:** editorial. Serif headlines, numbered sections (`01 — World`), figure captions
  under real screenshots, tables for specs. Containers use `.landing-wrap`.
