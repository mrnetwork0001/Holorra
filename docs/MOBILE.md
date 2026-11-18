---
name: mobile-view
description: Make a web app (landing page + in-app dashboard/terminal) genuinely usable on phones — elitr/Vektor-style left drawer, clamped panels, scrollable tables, touch-safe inputs — without redesigning desktop. Use when a user says "optimize for mobile", "make it responsive", "add a hamburger", or reports content cut off / overflowing on a phone.
---

# Mobile View — reusable skill / prompt

Paste the **Prompt** section into a new session, or install this file as a skill (`.claude/skills/mobile-view/SKILL.md`). It encodes what worked on Vektor (React + Vite terminal + static landing page) and the mistakes we hit, so the next app gets there in one pass.

---

## Prompt (copy from here)

> Optimize this app for mobile view and usage, following the elitr.xyz dashboard pattern. Desktop stays as it is. Apply every rule below, verify with the checklist, then commit in small, well-described commits.
>
> **Pattern (≤ 900px):**
> 1. Sticky top bar (56–64px, blurred dark background): brand left, essential controls right (market/select, a danger/primary action), and a **burger button** that animates to an ×.
> 2. The desktop **sidebar becomes a left drawer**: `position: fixed; inset-y: 0; left: 0; width: min(88vw, 320px); height: 100dvh;` slides in with `transform`, has a dimmed backdrop, a small head row with a Close button, closes on backdrop tap, Esc, and after any navigation. Do **not** use a bottom tab bar unless the app has ≤ 3 primary tabs with no other nav — then show them as a segmented row under the top bar.
> 3. Main content first, single column, `padding: 10px`. Any multi-column grid collapses to `1fr`.
> 4. **Overflow guards** (the #1 cause of "sections cut across the screen"): `min-width: 0; max-width: 100%` on every grid/flex child and panel; `overflow: hidden` on panels; `html, body { overflow-x: hidden }`. Wide tables scroll inside their panel (`display:block; overflow-x:auto`), never widen it. Long key/value rows wrap with `overflow-wrap: anywhere`.
> 5. Touch: buttons ≥ 36px tall (primary ≥ 44px), range inputs ~28px tall, `input/select { font-size: 16px }` so iOS doesn't zoom on focus, safe-area padding at the bottom (`env(safe-area-inset-bottom)`).
> 6. Secondary chrome hides on phones (tours, proof links, long labels); the danger action (PANIC / Close all) never hides.
> 7. Charts/canvases drop to ~200–240px tall; keep `preserveAspectRatio="none"` SVGs full-width.
> 8. Landing page: same burger → left drawer (brand + × head, section links, primary CTA pinned at the bottom), hero stacks to one column, KPI strips go 2×2, tables scroll horizontally, footer stacks. Keep motion but respect `prefers-reduced-motion`.
>
> **Breakpoints:** ≤ 900px = tablet/phone layout (drawer, single column); ≤ 600px = phone density (3-col stat grid, 1-col forms, wrapping toggles). Desktop ≥ 901px unchanged.
>
> **Verify before you finish:**
> - DevTools device toolbar at 390×844 (iPhone 14) and 768×1024: no horizontal scrollbar on any tab/page; every panel's right edge inside the viewport.
> - Open/close the drawer via burger, backdrop, Esc, and by navigating — each closes it.
> - Tables scroll inside their panel; the panel does not widen.
> - Focus a numeric input on iOS Safari (or emulate): no zoom.
> - Run the test suite and typecheck; if there is a jsdom smoke test, click the burger in it.
> - `npm run build` passes.
>
> Report what changed per breakpoint and anything you could not verify.

---

## Why these rules (the non-obvious parts)

- **Grid children overflow by default.** `display: grid` children have `min-width: auto`, so a 9-column table or a long unbroken string makes the *column* wider than the viewport, and the whole page scrolls sideways. `min-width: 0` on children is the fix; `overflow: hidden` on the panel is the belt-and-braces.
- **A `display: block` table still needs its parent clamped.** `overflow-x: auto` on the table does nothing if the panel already grew.
- **Drawer, not dropdown.** A dropdown under the header competes with sticky headers and is hard to dismiss; a left drawer with a backdrop matches what users expect (elitr, Linear, GitHub mobile) and gives the sidebar room for real controls, not just links.
- **Keep primary tabs visible.** elitr hides nav in the drawer because its pages are deep; a trading terminal's 3 tabs are the whole app — a segmented row under the top bar beats two taps.
- **16px inputs.** Anything smaller triggers Safari's auto-zoom on focus, which breaks the layout and feels broken.
- **Sticky top bar needs `z-index` above charts/canvases** and a translucent blurred background so content scrolling under it stays legible.
- **Close the drawer on route/tab change** — otherwise it stays open over the new content and users think the tap did nothing.
- **Hide, don't shrink, secondary chrome.** A 10px "Judge tour" button is worse than none.

---

## Drop-in CSS skeleton

```css
/* burger */
.burger-btn { display:none; width:38px; height:38px; border:1px solid var(--border); border-radius:8px; background:var(--bg-input); color:var(--text); cursor:pointer; align-items:center; justify-content:center; flex-direction:column; gap:4.5px; }
.burger-btn span { width:16px; height:1.5px; background:currentColor; transition:transform .22s, opacity .2s; }
.burger-btn.open span:nth-child(1){ transform:translateY(6px) rotate(45deg); }
.burger-btn.open span:nth-child(2){ opacity:0; }
.burger-btn.open span:nth-child(3){ transform:translateY(-6px) rotate(-45deg); }
.drawer-backdrop { display:none; }

/* overflow guards (apply at ALL widths) */
.grid > *, .panel, main, aside { min-width:0; max-width:100%; }
.panel { overflow:hidden; }

@media (max-width: 900px) {
  html, body { overflow-x:hidden; }
  .layout { flex-direction:column; }
  header.app { position:sticky; top:0; z-index:25; background:rgba(10,10,10,.95); backdrop-filter:blur(10px); }
  .burger-btn { display:inline-flex; }
  aside.sidebar { position:fixed; top:0; bottom:0; left:0; z-index:40; width:min(88vw,320px); height:100dvh; background:var(--bg-panel); border-right:1px solid var(--border); transform:translateX(-100%); transition:transform .25s cubic-bezier(.2,.7,.2,1); overflow-y:auto; padding:12px 12px calc(12px + env(safe-area-inset-bottom)); }
  aside.sidebar.open { transform:none; box-shadow:20px 0 60px rgba(0,0,0,.5); }
  .drawer-backdrop { display:block; position:fixed; inset:0; z-index:35; background:rgba(0,0,0,.55); opacity:0; pointer-events:none; transition:opacity .25s; border:0; }
  .drawer-backdrop.show { opacity:1; pointer-events:auto; }
  .tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; background:var(--bg-input); padding:3px; border-radius:8px; }
  .grid { grid-template-columns:1fr; }
  table.wide { display:block; width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  table.wide thead, table.wide tbody { display:table; width:max-content; min-width:100%; }
  .kv-row { flex-wrap:wrap; } .kv-row .value { flex:1 1 auto; min-width:0; text-align:right; overflow-wrap:anywhere; }
  .chart { height:240px; }
  .btn { min-height:36px; } .btn-primary { min-height:44px; }
  input[type=number], input[type=text], select { font-size:16px; }
  input[type=range] { height:28px; }
  .secondary-chrome { display:none; }
}
@media (max-width: 600px) {
  .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px 10px; }
  .form-row { grid-template-columns:1fr; }
  .toggle-group { flex-wrap:wrap; } .toggle-group .btn { flex:1 1 45%; }
  .chart { height:200px; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation:none !important; transition:none !important; } }
```

## React wiring (sidebar → drawer)

```tsx
const [drawer, setDrawer] = useState(false);
useEffect(() => { setDrawer(false); }, [activeTab]);           // close on navigation
<header className="app">… <button className={`burger-btn ${drawer ? "open" : ""}`} aria-expanded={drawer} aria-label="Toggle controls" onClick={() => setDrawer(d => !d)}><span/><span/><span/></button></header>
<button className={`drawer-backdrop ${drawer ? "show" : ""}`} aria-label="Close menu" onClick={() => setDrawer(false)} />
<aside className={`sidebar ${drawer ? "open" : ""}`}>
  <div className="drawer-head"><span>Controls</span><button onClick={() => setDrawer(false)}>Close</button></div>
  {/* the same sidebar content as desktop */}
</aside>
```

## Static landing page (vanilla JS)

```html
<nav><div class="wrap"><a class="brand" href="/">…</a><ul>…</ul>
  <button class="burger" id="burger" aria-expanded="false" aria-controls="mnav"><span></span><span></span><span></span></button></div>
  <div class="mbackdrop" id="mbackdrop"></div>
  <div class="mnav" id="mnav" role="dialog" aria-label="Menu">
    <div class="mhead">Brand <button class="mclose" id="mclose" aria-label="Close menu">&times;</button></div>
    <a href="#a">…</a> … <a class="btn btn-primary" href="/app">Launch App</a>
  </div></nav>
<script>
  var nav=document.querySelector('nav'), b=document.getElementById('burger');
  var close=function(){ nav.classList.remove('open'); b.setAttribute('aria-expanded','false'); };
  b.onclick=function(){ var o=!nav.classList.contains('open'); nav.classList.toggle('open',o); b.setAttribute('aria-expanded',String(o)); };
  document.querySelectorAll('#mnav a').forEach(function(a){ a.addEventListener('click',close); });
  document.getElementById('mbackdrop').onclick=close; document.getElementById('mclose').onclick=close;
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') close(); });
</script>
```

## Verification snippet (jsdom, no browser needed)

```js
const { JSDOM } = require("jsdom");
const dom = new JSDOM(require("fs").readFileSync("index.html","utf8"), { runScripts:"dangerously", pretendToBeVisual:true });
setTimeout(() => { const d = dom.window.document, n = d.querySelector("nav");
  d.getElementById("burger").click(); console.log("open", n.classList.contains("open"));
  d.getElementById("mbackdrop").click(); console.log("closed", !n.classList.contains("open")); process.exit(0); }, 300);
```

## Checklist to paste into the final report

- [ ] 390×844 and 768×1024: no horizontal scroll on any page/tab
- [ ] Drawer opens via burger; closes via backdrop, Esc, Close, and on navigation
- [ ] Every table scrolls inside its panel; no panel exceeds the viewport
- [ ] Inputs don't zoom on iOS (16px); primary buttons ≥ 44px
- [ ] Charts/canvases resized; nothing hidden that a user needs (danger action always visible)
- [ ] Tests + typecheck + build green; desktop layout unchanged
