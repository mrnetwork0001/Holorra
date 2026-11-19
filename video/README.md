# Holorra: the demo film

Watch it: https://youtu.be/HOIWQNxpB9U

A film of just under 3 minutes for the Manycore Aholo Global 3D AI Hackathon, made with Remotion from Holorra's own live site. It lives in `video/` and is excluded from the app's TypeScript (`tsconfig.json` excludes `video`) and from deploys (`deploy/redeploy.sh` excludes `video`).

## What is real

Every screen is the production site at https://holorra.xyz, recorded on 19 Nov 2026. No UI is mocked up. Motion-graphic cards only restate figures that the site itself shows.

**Figures.** They come from the Lux3D bench's run log (https://holorra.xyz/lab), which lists the project's real jobs of 18 Nov 2026:

| Figure in the film | Source |
| --- | --- |
| 41.8M splats | World 02, Juguo Urban Plaza (Manycore-hosted chunk-LOD stream) |
| World `3FO4K4V99KMD`, 266,895 splats | Our SpatialGen job, world 05 |
| 4 parts in 118 s, 229,788 triangles before and after | `partSplit` task 8354166 on the G1 mesh (task 8353478) |
| Hood `revolute 0–90°`, drawer `prismatic`, 298 s | `articulationAnimation` task 8354168 (the URDF it returned) |
| 52 joints in 81 s | `humanoidAutoRig` task 8355123 |
| 8 clips in 17 s | `humanoidAnimationRetarget` task 8359816 |
| `RIG_ELIGIBILITY_FAILED` | `humanoidAutoRig` task 8354170, on the first character (task 8353484) |
| 03:41 | The job chip in the owner's recording, just before the stool landed |
| 5 SDKs, 10 Lux3D methods, 22 MCP tools | The `@manycore/*` packages the app imports; the tool count of `@manycore/aholo-sdk-mcp` |

**Footage recorded by script** (`scripts/capture.mjs`, headless Chrome with the GPU on, 1600×900; the pointer is drawn by the script because headless Chrome draws none). All of it is read-only: no clip starts a paid job. The co-director clip sends one plan request, which costs nothing.

- `dead`: world 05 (our SpatialGen coffee bar), camera turned away from the actor. The film stops the picture on "nothing moves"; that freeze and the grey grade are the film's, not the app's.
- `worlds`, `parts`, `artic`, `path`: the studio. `direct`: the co-director given `切换到城市街道，让角色跳舞。`; the film cuts about 20 s while the plaza and the actor load.
- `zh`: the landing page switched to Chinese. `bench`, `labrig`: the Lux3D bench.

**Footage recorded by the owner** (`scripts/owner.mjs`, cut list in `data/cuts.json`; muted, browser chrome cropped off, nothing else changed):

- `holorra-A.mov`: a live Text to 3D job, "A small wooden bar stool", G1-Turbo, on the project's own key. The film speeds up the typing and the click, and cuts the wait (the chip reads 03:41 just before the model lands). The stool then lands with the app's own "Dropped into the scene · live" notice, and is kicked in Play mode.
- `holorra-B.mov`: one Play run (finish card: 00:49.3, 5/5 beans). The film reorders moments from it to follow the narration: the dance (an emote) was performed before the brew, and is shown after it.
- A phone screen recording of `https://holorra.xyz/studio?play=1` (07:34, 19 Nov 2026).

**The orange floor grid** in the Play scene is a drawing over the footage to illustrate the voxel grid. The app does not draw it.

**Logos.** Holorra's own mark (`src/components/brand/Logo.tsx`). The "群核科技 Manycore | Aholo" lockup is the image served on the hackathon page (aholo.ai/hackathon); it is white artwork, so on light scenes it sits on a dark plate. The Aholo Lux3D mark is the profile image of @Aholo_Lux3D. Both are unaltered (`public/logos/`). LuxReal appears as a word only. The "Split · in Lux3D's 18 Nov 2026 update" tag refers to Aholo Lux3D's own announcement of that date (x.com/Aholo_Lux3D/status/2122985984044462476).

**Voice and sound.** ElevenLabs. Narration: "Uyi", `eleven_multilingual_v2`, each line normalised to -16 LUFS. The two Chinese lines: "Alice". Score: the Music API. Effects: sound generation. Every narration line was transcribed back (`scripts/vocheck.mjs`) to catch misreads; the Chinese prompt was reworded from 城市广场 to 城市街道 because every voice misread 广场.

## Build it

```bash
cd video && npm install
node scripts/voiceover.mjs        # narration (cached by hash)
node scripts/vocheck.mjs          # transcribe it back
node scripts/timing.mjs           # every word on a frame -> src/timing.json
node scripts/music.mjs            # score
node scripts/sfx.mjs              # effects
ONLY=dead,worlds,parts,artic,zh,direct,path,bench,labrig node scripts/capture.mjs   # read-only clips
node scripts/encode.mjs           # frames -> public/footage/*.mp4 + src/footage.json
node scripts/owner.mjs            # cuts from the owner's recordings
node scripts/stills.mjs 123 1114  # check stills (out/stills)
npm run draft                     # half-scale draft
npm run render && npm run finish  # 1080p master, -14 LUFS / -1 dBTP
```
