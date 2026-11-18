# Holorra architecture

A file-level companion to the README's diagrams. Everything here describes the code as it is; the user-facing
explanation is in the app at `/docs`.

## 1. Layers

| Layer | Where | Holds |
| --- | --- | --- |
| Browser | `src/app/studio`, `src/components/*` | The WebGL2 stage, docks, play mode, camera director. Session state: keyframes, running jobs, dropped models, part overrides. |
| Server | `src/app/api/aholo/*` | Thin routes over the official SDKs. Resolves the key and region per request. No storage. |
| Manycore | Aholo API, Aholo CDN | Lux3D and World jobs; hosted worlds, voxel grids and result files. |
| Repository | `public/assets/*`, `src/config/*` | Mirrored results of our real jobs and the presets that place them. |

There is no database, queue or scheduler. A job is started by a visitor and followed by the open studio tab.

## 2. Server routes

| Route | SDK calls | Notes |
| --- | --- | --- |
| `GET /api/aholo/status` | none | SDK versions, `hasApiKey`, `keySource` (`header` / `env` / `none`), region, preset counts. Never returns a key. |
| `POST /api/aholo/lux3d` | the 10 `lux3d.*.create` methods | Body `{ operation, ...fields }`. Without a key: an `INSTANT_STAGE_BLUEPRINT` preview, nothing sent. |
| `GET /api/aholo/tasks` | `lux3d.tasks.retrieve` / `list` | `?taskId=` for one task, otherwise the 15 most recent. |
| `POST /api/aholo/world` | `world.generations.create`, `world.reconstructions.create` | Without a key: the closest hosted preset, marked `VERIFIED_MANYCORE_CDN_PRESET`. |
| `GET /api/aholo/world` | `world.retrieve` / `list` | `?worldId=` for one world, otherwise presets plus the 10 latest. |
| `POST /api/aholo/director` | none (plans MCP calls) | Deterministic keyword planner, English and Chinese keywords; returns tool steps and a stage mutation. |
| `GET /api/aholo/asset` | none (proxy) | `?url=` for result files: https only, host allowlist, redirects re-checked (max 3), 60 s, 120 MB. |

Key resolution lives in `src/lib/aholo-server.ts` (`resolveAholoContext`): the `x-aholo-api-key` header wins over
`AHOLO_API_KEY`; `x-aholo-region` over `AHOLO_REGION`; `cn` selects `api.aholo.cn`, anything else `api.aholo.ai`.

## 3. The stage (`src/components/stage/AholoHybridStage.tsx`)

**Loading a world** (effect keyed on world, prop and actor):
1. Create the viewer, abort and destroy the previous world.
2. Load the splat: `SplatLoader.parseSplatData` for `.spz` / `.sog` / `.ply`, or `SplatUtils.LodSplat` for a
   `lod-meta.json` chunk stream. URLs are made absolute first (the worker runs from a blob URL).
3. Load the voxel grid if the preset has one (`src/lib/voxel-collision.ts`).
4. Load the prop: the URDF assembly for the real espresso machine (`src/lib/urdf-assembly.ts`), procedural meshes
   for the two preview props.
5. Load the actor GLB, rename its clips from the preset's `clipMap`, and place it on the floor.

**Each frame:**
1. Camera from the current mode: orbit, third person, first person, or the Catmull-Rom path
   (`evaluateCameraSpline` in `src/lib/luxreal-exporter.ts`).
2. Walk modes move through `filterHorizontalMove` (wall sliding) and keep feet on `findFloorY`.
3. Prop: reset link transforms, then apply joint values (articulation loop, brew ramp, or closed while playing),
   explode offsets and part visibility.
4. Actor: pick the clip (forced `Interact` / `Dance_Loop` after E / F, else idle, walk or jog from input).
5. Quest state is read from a ref; only step changes reach React.
6. Dropped models fall with gravity onto the floor and settle.

## 4. Coordinate frames

| Asset | Native up | On the stage |
| --- | --- | --- |
| Aholo CDN worlds | −Y (OpenCV) | used as is, `camera.up = (0, −1, 0)` |
| glTF (Lux3D props, actor, drop-ins) | +Y | wrapped with `rotation.x = π` |
| SpatialGen output | +Z | wrapped with `rotation.x = π/2` |

Camera forward on the ground plane is `(−sin yaw, −cos yaw)`; positive pitch looks down.

## 5. Language (中 / EN)

`src/lib/i18n.tsx` renders every translated string in both languages; `globals.css` hides the inactive one by
`<html data-lang>`. A head script in `src/app/layout.tsx` sets `data-lang` before first paint from the stored choice
or the browser language. Pages stay static. Client code that needs a plain string (placeholders, aria labels) uses
`useLang()` from `src/components/brand/LangSwitch.tsx`.

## 6. Directory map

```text
src/app/                     routes: / (landing), /studio, /lab, /report, /mcp, /docs/*
src/app/api/aholo/           status, lux3d, tasks, world, director, asset
src/components/stage/        AholoHybridStage: stage, quest, drop-ins, joystick, Expand
src/components/docks/        CreationDock (generate), InspectorDock (parts, actor, co-director), LuxRealTimeline
src/components/header/       StudioHeader: world tabs, key dialog, render settings, 中 / EN
src/components/lab/          GlbViewer, ArticulatedViewer and the bench widgets for /lab
src/components/docs/         docs shell, navigation, prose primitives
src/components/landing/      hero loop, ambient field, explode demo, scroll reveals
src/components/brand/        logo, glyphs, site nav, mobile drawer, language switch
src/config/aholo-presets.ts  five worlds, three props, the actor, default keyframes
src/config/lux3d-results.ts  task IDs, prompts, times and measurements of every real run
src/config/humanoid-animations.ts  85-clip library, MCP tool catalog
src/lib/                     aholo-server, urdf-assembly, voxel-collision, luxreal-exporter, spawned-assets, i18n
public/assets/               mirrored Lux3D and SpatialGen results
deploy/                      VPS deploy kit (systemd, Caddy, scripts)
```

## 7. Decisions and why

- **Mirror results into the repo.** Lux3D result URLs expire; mirrored copies (textures resized to 1024 px JPEG,
  geometry untouched) keep every demo working.
- **Client-only viewer, production builds only.** The viewer needs WebGL2 and module workers; React Fast Refresh in
  `next dev` breaks its splat worker. `next.config.ts` also forces absolute `new URL()` resolution on the client.
- **Reset before activate.** The viewer's `AnimationAction.reset()` sets `active = false`, so clip switches reset
  first, then set `active` and `weight`.
- **Deterministic co-director.** Same brief, same plan, no LLM key to manage during judging.
- **No key, no calls.** Every route labels its fallback, so a viewer can always tell live output from a preview.
