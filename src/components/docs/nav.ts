/** Docs navigation: one source for the sidebar, the mobile drawer and prev/next links. */
export interface DocLink {
  href: string;
  title: string;
  /** one line, used in reading-order lists */
  blurb: string;
}

export interface DocGroup {
  label: string;
  items: DocLink[];
}

export const DOC_GROUPS: DocGroup[] = [
  {
    label: "Getting started",
    items: [
      { href: "/docs", title: "Welcome to Holorra", blurb: "what it is and where everything lives" },
      { href: "/docs/how-it-works", title: "How it works", blurb: "the four stages, from prompt to shot" },
    ],
  },
  {
    label: "The studio",
    items: [
      { href: "/docs/worlds", title: "Worlds & the stage", blurb: "five splat worlds, LOD streaming and voxel floors" },
      { href: "/docs/play", title: "Play mode", blurb: "the scene quest, controls and the phone joystick" },
      { href: "/docs/parts", title: "Parts & articulation", blurb: "explode, isolate and hinge a generated object" },
      { href: "/docs/actors", title: "Actors & animation", blurb: "auto-rig, retarget and the clip library" },
      { href: "/docs/director", title: "Camera director", blurb: "keyframes, spline playback and the LuxReal pack" },
    ],
  },
  {
    label: "Generate",
    items: [
      { href: "/docs/generation", title: "Live generation", blurb: "SpatialGen, Reality and Lux3D jobs, and the drop-in" },
      { href: "/docs/results", title: "Real results", blurb: "every job we ran, with task IDs and times" },
    ],
  },
  {
    label: "Agents",
    items: [{ href: "/docs/mcp", title: "MCP & co-director", blurb: "Aholo MCP in your editor and in the studio" }],
  },
  {
    label: "Build",
    items: [
      { href: "/docs/api", title: "HTTP API", blurb: "the /api/aholo routes the studio calls" },
      { href: "/docs/deploy", title: "Self-hosting & deployment", blurb: "env vars, builds and the viewer's quirks" },
    ],
  },
  {
    label: "Trust",
    items: [{ href: "/docs/faq", title: "Limits & FAQ", blurb: "what is real, what is a preview, how keys are handled" }],
  },
];

export const DOC_ORDER: DocLink[] = DOC_GROUPS.flatMap((g) => g.items);

export function docNeighbours(href: string): { prev?: DocLink; next?: DocLink } {
  const i = DOC_ORDER.findIndex((d) => d.href === href);
  if (i < 0) return {};
  return { prev: DOC_ORDER[i - 1], next: DOC_ORDER[i + 1] };
}

export function docByHref(href: string): DocLink {
  const d = DOC_ORDER.find((x) => x.href === href);
  if (!d) throw new Error(`Unknown doc ${href}`);
  return d;
}

export const REPO_URL = "https://github.com/mrnetwork0001/Holorra";
