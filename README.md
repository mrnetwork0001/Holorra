# Holorra — a directing stage for generated 3D worlds

> Manycore Aholo Global 3D AI Hackathon · `#Manycorehackathon`
> *Generate the world. Split the parts. Rig the actors. Direct the scene.*

Holorra is a browser studio that turns generated 3D assets into directed scenes. It puts walkable
3D Gaussian Splatting worlds, part-split and articulated Lux3D props, auto-rigged actors and a
camera director on one WebGL2 stage, built on the official Manycore Aholo SDKs.

| Route | What it is |
| :--- | :--- |
| `/` | Landing page |
| `/studio` | The studio: 3DGS stage, Lux3D creation dock, part/rig inspector, camera-path director |
| `/studio?play=1` | Starts the scene quest as soon as the world and actor load |
| `/studio?world=<id>` | Opens a world directly, e.g. `spatialgen-coffee-bar` |
| `/lab` | **Lux3D bench**: every real Lux3D output from this project, inspected live in 3D |
| `/report` | Project report deck (prints to PDF, one slide per page) — also in `docs/Holorra-Project-Report.pdf` |
| `/mcp` | Aholo MCP hub: `.mcp.json`, CLI setup, tool playground |
| `/docs` | Documentation: 13 pages, from the welcome page to the HTTP API and limits |

## Play it

Press **Play** on the stage (or open `/studio?play=1`) for a one-minute scene quest in the Designer Smart Loft:
walk the Lux3D actor to the articulated espresso machine (WASD, Shift to jog), press **E** to brew (the camera cuts
in while the real URDF hood and drawer open), **K** to frame the shot as a keyframe, **F** to celebrate. Phones get a
thumb joystick and Brew / Frame / Cheer buttons. **Expand** at the right of the stage toolbar gives the render the
whole screen.

**Generate and drop in:** press Text to 3D and keep playing. A chip tracks the job; when Lux3D finishes, the model is
fetched through an allowlisted proxy (`/api/aholo/asset`), scaled to about 70 cm and dropped in front of you onto the
voxel floor. Without a key, the stored G1-Turbo result of task 8353472 drops in, labelled cached.

## Real Lux3D results

Ten Lux3D jobs ran through Holorra's own `/api/aholo/lux3d` route (`@manycore/aholo-sdk-lux3d@1.10.0`) on
18 Nov 2026, plus one SpatialGen world (below). Outputs are mirrored in `public/assets/lux3d/` (web copies: textures resized to 1024 px
JPEG, geometry untouched). Details and live viewers: `/lab`, `src/config/lux3d-results.ts`.

| Task | Method | Result | Time |
| :--- | :--- | :--- | :--- |
| 8353472 | `textTo3d` G1-Turbo | Espresso machine, 252,226 tris, 2 maps | 151 s |
| 8353478 | `textTo3d` G1 | Same prompt, 229,788 tris, 3 PBR maps | 343 s |
| 8354166 | `partSplit` | G1 mesh → 4 parts, same triangle count | 118 s |
| 8354168 | `articulationAnimation` | URDF: revolute hood hinge (0–90°), prismatic drawer (0–0.233) | 298 s |
| 8353484 | `textTo3d` G1-Turbo | Character, attempt 1 | 119 s |
| 8354170 | `humanoidAutoRig` | Attempt 1 rejected: `RIG_ELIGIBILITY_FAILED` | 315 s |
| 8354807 | `textTo3d` G1-Turbo | Character, attempt 2 (strict T-pose) | ≤ 197 s |
| 8355123 | `humanoidAutoRig` | 52-joint skeleton with skin weights | 81 s |
| 8355366 | `humanoidAnimationRetarget` | First retarget: Idle, Walk, Jog, Dance, Sword attack | ≤ 17 s |
| 8359816 | `humanoidAnimationRetarget` | Eight clips incl. Interact, Chest_Open, Yes (used by play mode) | ≤ 17 s |

The studio's loft scene places the real articulated espresso machine and the real retargeted actor
inside the Gaussian Splatting world, standing on the floor found in the voxel collision grid.

## Real SpatialGen world

| World | Method | Result | Time |
| :--- | :--- | :--- | :--- |
| 3FO4K4V99KMD | `world.generations.create` | Scandinavian coffee bar, 266,895 splats, 4.4 MB `.spz`, Z-up | 625 s |

Mirrored in `public/assets/spatialgen/` and loaded as **world 05** (`/studio?world=spatialgen-coffee-bar`). The stage
rotates it from Z-up into Aholo's −Y-up frame and stands the espresso machine on its table.

## Stack

| Package | Version | Use |
| :--- | :--- | :--- |
| `@manycore/aholo-viewer` | 1.14.0 | Stage: `.spz/.sog/.ply` splats, chunk-LOD streaming, GLTF, skinning, animation |
| `@manycore/aholo-sdk-world` | 1.5.0 | SpatialGen generation, Aholo Reality reconstruction |
| `@manycore/aholo-sdk-lux3d` | 1.10.0 | All 10 Lux3D methods |
| `@manycore/aholo-sdk-asset` | 1.4.0 | Asset client (`src/lib/aholo-server.ts`); local-file uploads go through the MCP `upload_asset` tool |
| `@manycore/aholo-sdk-mcp` | 1.10.0 | MCP server for Claude Code, Cursor and the in-app co-director (26 tools) |

Next.js 15 (App Router), React 19, Tailwind CSS 4, TypeScript.

## Quick start

```bash
npm install
cp .env.example .env.local      # add AHOLO_API_KEY from https://labs.aholo.ai/api-keys
npm run verify:aholo            # SDK exports + CDN asset check
npm run build && npm start      # production build (recommended)
```

Without a key the studio still runs on the hosted 3DGS worlds; live jobs need `AHOLO_API_KEY`
(server) or a key pasted in the studio (sent per request as `x-aholo-api-key`, COM / CN regions).

> Use a production build to try the studio. In `next dev`, React Fast Refresh instruments the
> viewer's splat worker and the stage fails with `$RefreshReg$ is not defined`.

## Notes

- `next.config.ts` forces absolute asset URLs on the client (`module.parser.javascript.url = true`);
  without it the viewer's blob-module workers cannot resolve and every splat load hangs.
- `@manycore/aholo-viewer`'s `AnimationAction.reset()` also sets `active = false`: reset first, then activate.
- Aholo scenes use OpenCV coordinates (−Y up). glTF assets (Y-up) are flipped into the stage.
- Design system: `docs/DESIGN_SYSTEM.md`. Mobile rules: `docs/MOBILE.md`.

## Known limitations

- Two of the three stage props (drone, holo-terminal) are hand-built procedural previews and are labelled as such.
- Voxel collision exists in the loft and the plaza; the other worlds use a fixed floor height.
- The co-director is a deterministic keyword planner: it plans MCP tool calls and updates the stage, it does not start jobs.
- Manycore's demo robot/human GLBs were removed from the actor list (root scales of 1.78e-5 and 0.0035 made them
  invisible on this stage); the Lux3D actor is the only actor.

Full details, including what is real and what is a preview: `/docs/faq`.
