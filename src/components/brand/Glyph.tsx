import type { SVGProps } from "react";

/**
 * Holorra glyph set — custom 20×20 line icons drawn for this app.
 * One stroke weight (1.5), round joins, currentColor. Use these instead of
 * stock icon packs or emoji so every symbol speaks the app's own vocabulary:
 * splats, voxels, exploded parts, rig joints, camera paths, keyframes.
 */
export type GlyphName =
  | "splat" | "world" | "reconstruct" | "voxel" | "lod" | "mesh" | "generate" | "split" | "hinge"
  | "rig" | "walk" | "orbit" | "eye" | "eye-off" | "spline" | "keyframe" | "camera" | "shot"
  | "play" | "pause" | "stop" | "record" | "export" | "download" | "upload" | "material" | "fourview"
  | "layers" | "key" | "terminal" | "plug" | "chat" | "enter" | "search" | "sliders" | "reset"
  | "refresh" | "loader" | "copy" | "check" | "cross" | "close" | "plus" | "trash" | "doc" | "print"
  | "external" | "back" | "pointer" | "info" | "flag" | "region" | "expand" | "collapse" | "sound" | "mute" | "bean";

const P = (d: string) => <path d={d} />;

const GLYPHS: Record<GlyphName, React.ReactNode> = {
  // ---------------------------------------------------------------- 3DGS / world
  splat: (
    <>
      <ellipse cx="9" cy="10.5" rx="6.5" ry="3" transform="rotate(-24 9 10.5)" />
      <ellipse cx="13.5" cy="6.5" rx="2.6" ry="1.4" transform="rotate(32 13.5 6.5)" />
      <ellipse cx="14.2" cy="14.6" rx="2.2" ry="1.1" transform="rotate(-8 14.2 14.6)" />
    </>
  ),
  world: (
    <>
      <ellipse cx="10" cy="11" rx="7.5" ry="3.2" />
      <ellipse cx="7.5" cy="8" rx="2.6" ry="1.5" transform="rotate(-20 7.5 8)" />
      <ellipse cx="12.8" cy="6.6" rx="2" ry="1.2" transform="rotate(25 12.8 6.6)" />
      {P("M2.5 15.5h15")}
    </>
  ),
  reconstruct: (
    <>
      {P("M3 6.5V3h3.5M13.5 3H17v3.5M17 13.5V17h-3.5M6.5 17H3v-3.5")}
      {P("M10 6.8l3 1.7v3.4L10 13.6l-3-1.7V8.5z")}
      {P("M7 8.5l3 1.7 3-1.7M10 10.2v3.4")}
    </>
  ),
  voxel: (
    <>
      {P("M10 2.8l6.2 3.6v7.2L10 17.2l-6.2-3.6V6.4z")}
      {P("M3.8 6.4L10 10l6.2-3.6M10 10v7.2")}
      {P("M6.9 4.6l6.2 3.6M13.1 4.6L6.9 8.2M6.9 8.2v7.2M13.1 8.2v7.2")}
    </>
  ),
  lod: (
    <>
      {P("M3 16.5h14M5 13h10M7 9.5h6M8.75 6h2.5")}
      {P("M10 3.5v.01")}
    </>
  ),
  // ---------------------------------------------------------------- meshes / parts
  mesh: (
    <>
      {P("M10 2.8l6.2 3.6v7.2L10 17.2l-6.2-3.6V6.4z")}
      {P("M3.8 6.4L10 10l6.2-3.6M10 10v7.2")}
    </>
  ),
  generate: (
    <>
      {P("M2.5 5h6M2.5 8h4M2.5 11h5")}
      {P("M13.5 7l4 2.3v4.6l-4 2.3-4-2.3V9.3z")}
      {P("M9.5 9.3l4 2.3 4-2.3M13.5 11.6v4.6")}
    </>
  ),
  split: (
    <>
      {P("M10 1.8l5.6 3.2L10 8.2 4.4 5z")}
      {P("M3.2 8.2l5.4 3.1v6.1l-5.4-3.1z")}
      {P("M16.8 8.2l-5.4 3.1v6.1l5.4-3.1z")}
    </>
  ),
  hinge: (
    <>
      {P("M2.5 15.5H9")}
      {P("M11 14.2l5-5.8")}
      <circle cx="10" cy="15.5" r="1.4" />
      {P("M15.5 15.5a5.5 5.5 0 0 0-1.4-3.7")}
    </>
  ),
  material: (
    <>
      <circle cx="10" cy="10" r="7" />
      <ellipse cx="10" cy="10" rx="7" ry="2.6" />
      {P("M6.2 6.4a4.6 4.6 0 0 1 3-1.5")}
    </>
  ),
  fourview: (
    <>
      {P("M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z")}
    </>
  ),
  layers: (
    <>
      {P("M10 3l7 3.8-7 3.8-7-3.8z")}
      {P("M3 10.2l7 3.8 7-3.8M3 13.6l7 3.8 7-3.8")}
    </>
  ),
  // ---------------------------------------------------------------- actors / navigation
  rig: (
    <>
      <circle cx="10" cy="3.8" r="1.7" />
      {P("M10 5.5v6.2M10 7.6l-4.2 2.6M10 7.6l4.2 2.6M10 11.7l-3 5.3M10 11.7l3 5.3")}
      <circle cx="5.8" cy="10.2" r=".9" />
      <circle cx="14.2" cy="10.2" r=".9" />
      <circle cx="10" cy="11.7" r=".9" />
    </>
  ),
  walk: (
    <>
      <rect x="7.8" y="3" width="4.4" height="11" rx="2.2" />
      {P("M2.5 17h15M2.5 8.5h2.6M3.5 11.5h2.2")}
    </>
  ),
  orbit: (
    <>
      <circle cx="10" cy="10" r="1.6" />
      <ellipse cx="10" cy="10" rx="7.5" ry="3.6" transform="rotate(-20 10 10)" />
      {P("M15.9 4.8l1.6.4-.5 1.6")}
    </>
  ),
  eye: (
    <>
      {P("M2 10s3-5.2 8-5.2S18 10 18 10s-3 5.2-8 5.2S2 10 2 10z")}
      <circle cx="10" cy="10" r="2.2" />
    </>
  ),
  "eye-off": (
    <>
      {P("M2 10s3-5.2 8-5.2S18 10 18 10s-3 5.2-8 5.2S2 10 2 10z")}
      {P("M3.5 16.5l13-13")}
    </>
  ),
  pointer: P("M5 3l10.5 6.3-4.6 1.3-1.9 4.6z"),
  // ---------------------------------------------------------------- director
  spline: (
    <>
      {P("M3.5 15.5C6 7 9 6.5 10.5 10.5S15 13 16.5 4.5")}
      {P("M2.5 14.5h2v2h-2zM9.5 9.5h2v2h-2zM15.5 3.5h2v2h-2z")}
    </>
  ),
  keyframe: P("M10 3.5l6.5 6.5-6.5 6.5L3.5 10z"),
  camera: (
    <>
      {P("M2.5 6.5h10v8h-10z")}
      {P("M12.5 9l5-2.5v7l-5-2.5")}
      <circle cx="5.5" cy="4" r="1.3" />
      <circle cx="9.3" cy="4" r="1.3" />
    </>
  ),
  shot: (
    <>
      {P("M3 4.5h14v11H3z")}
      {P("M3 7.5h14M3 12.5h14")}
      {P("M6 4.5v3M10 4.5v3M14 4.5v3M6 12.5v3M10 12.5v3M14 12.5v3")}
    </>
  ),
  record: <circle cx="10" cy="10" r="4.2" fill="currentColor" stroke="none" />,
  play: <path d="M6 4l10 6-10 6z" fill="currentColor" stroke="none" />,
  pause: P("M7 4.5v11M13 4.5v11"),
  stop: <rect x="5" y="5" width="10" height="10" fill="currentColor" stroke="none" />,
  // ---------------------------------------------------------------- io
  export: P("M4 12.5v4h12v-4M10 3v9.5M6.6 6.4L10 3l3.4 3.4"),
  upload: P("M4 12.5v4h12v-4M10 3v9.5M6.6 6.4L10 3l3.4 3.4"),
  download: P("M4 12.5v4h12v-4M10 3v9.5M6.6 9.1l3.4 3.4 3.4-3.4"),
  doc: P("M5 2.5h7l3.5 3.5v11.5H5zM12 2.5V6h3.5M7.5 10h5M7.5 13h5"),
  print: P("M5.5 7.5V3h9v4.5M5.5 14H3V7.5h14V14h-2.5M5.5 11.5h9v6h-9z"),
  copy: P("M7 7h10v10H7zM13 7V3H3v10h4"),
  external: P("M8.5 4H4v12h12v-4.5M11.5 4H16v4.5M16 4l-7 7"),
  back: P("M12 4.5L6.5 10l5.5 5.5"),
  expand: P("M3 7.5V3h4.5M12.5 3H17v4.5M17 12.5V17h-4.5M7.5 17H3v-4.5"),
  sound: P("M3 7.8h3l4-3.3v11l-4-3.3H3zM13 7.5a3.5 3.5 0 0 1 0 5M15 5a7 7 0 0 1 0 10"),
  mute: P("M3 7.8h3l4-3.3v11l-4-3.3H3zM13.2 8l3.6 4M16.8 8l-3.6 4"),
  bean: (
    <>
      <ellipse cx="10" cy="10" rx="5" ry="7" transform="rotate(28 10 10)" />
      {P("M12.6 4.6c-2.6 2.4 1.2 6.4-1 9.6")}
    </>
  ),
  collapse: P("M7.5 3v4.5H3M12.5 3v4.5H17M17 12.5h-4.5V17M3 12.5h4.5V17"),
  // ---------------------------------------------------------------- agent / system
  key: (
    <>
      <circle cx="6.5" cy="10" r="3.5" />
      {P("M10 10h7.5M15 10v2.6M17.5 10v2")}
    </>
  ),
  terminal: P("M2.5 4h15v12h-15zM5.5 8l2.5 2-2.5 2M10 12.5h4"),
  plug: P("M7 2.5v4M13 2.5v4M4.8 6.5h10.4v3a5.2 5.2 0 0 1-10.4 0zM10 14.7v2.8"),
  chat: P("M3 3.5h14v10H9l-4 3v-3H3z"),
  enter: P("M16 4v6.5H5M8 7.5l-3 3 3 3"),
  search: (
    <>
      <circle cx="8.5" cy="8.5" r="5" />
      {P("M12.2 12.2L17 17")}
    </>
  ),
  sliders: (
    <>
      {P("M3 5.5h14M3 10h14M3 14.5h14")}
      <circle cx="7" cy="5.5" r="1.6" fill="var(--color-surface, #121210)" />
      <circle cx="13" cy="10" r="1.6" fill="var(--color-surface, #121210)" />
      <circle cx="8.5" cy="14.5" r="1.6" fill="var(--color-surface, #121210)" />
    </>
  ),
  reset: P("M4 10a6 6 0 1 0 1.8-4.3M4 3.5v3h3"),
  refresh: P("M16 10a6 6 0 1 1-1.8-4.3M16 3.5v3h-3"),
  loader: P("M10 3a7 7 0 1 1-7 7"),
  check: P("M4 10.5l4 4 8-9"),
  cross: P("M5 5l10 10M15 5L5 15"),
  close: P("M5 5l10 10M15 5L5 15"),
  plus: P("M10 4v12M4 10h12"),
  trash: P("M3.5 5.5h13M8 5.5V3.5h4v2M5.5 5.5l.8 11h7.4l.8-11"),
  info: (
    <>
      <circle cx="10" cy="10" r="7" />
      {P("M10 9v5M10 6.5v.01")}
    </>
  ),
  flag: P("M5 17.5V3M5 3.5h10l-2.2 3.2L15 10H5"),
  region: (
    <>
      <circle cx="10" cy="10" r="7" />
      {P("M3 10h14M10 3c2 2 2.8 4.3 2.8 7S12 15 10 17M10 3C8 5 7.2 7.3 7.2 10S8 15 10 17")}
    </>
  ),
};

export interface GlyphProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: GlyphName;
  size?: number;
  title?: string;
}

export function Glyph({ name, size = 16, title, className, ...rest }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={`shrink-0 ${name === "loader" ? "animate-spin" : ""} ${className ?? ""}`}
      {...rest}
    >
      {title && <title>{title}</title>}
      {GLYPHS[name]}
    </svg>
  );
}

export default Glyph;
