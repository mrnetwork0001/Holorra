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
| `/lab` | **Lux3D bench**: every real Lux3D output from this project, inspected live in 3D |
| `/report` | Project report deck (prints to PDF, one slide per page) — also in `docs/Holorra-Project-Report.pdf` |
| `/mcp` | Aholo MCP hub: `.mcp.json`, CLI setup, tool playground |

## Real Lux3D results

Nine jobs ran through Holorra's own `/api/aholo/lux3d` route (`@manycore/aholo-sdk-lux3d@1.10.0`) on
18 Nov 2026. Outputs are mirrored in `public/assets/lux3d/` (web copies: textures resized to 1024 px
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
| 8355366 | `humanoidAnimationRetarget` | Idle, Walk, Jog, Dance, Sword attack | ≤ 17 s |

The studio's loft scene places the real articulated espresso machine and the real retargeted actor
inside the Gaussian Splatting world, standing on the floor found in the voxel collision grid.

## Stack

| Package | Version | Use |
| :--- | :--- | :--- |
| `@manycore/aholo-viewer` | 1.14.0 | Stage: `.spz/.sog/.ply` splats, chunk-LOD streaming, GLTF, skinning, animation |
| `@manycore/aholo-sdk-world` | 1.5.0 | SpatialGen generation, Aholo Reality reconstruction |
| `@manycore/aholo-sdk-lux3d` | 1.10.0 | All 10 Lux3D methods |
| `@manycore/aholo-sdk-asset` | 1.4.0 | Media upload to Aholo's CDN |
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
- On phones you can look around the stage by dragging but not walk (walking uses WASD).
- Manycore's demo robot/human actors are not yet oriented for the −Y-up stage; the Lux3D actor is the default.
