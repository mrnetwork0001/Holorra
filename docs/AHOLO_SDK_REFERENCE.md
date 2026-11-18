# Official Manycore Aholo SDK & Viewer Reference (Verified v1.10.0 / v1.14.0)

This reference contains the **exact** TypeScript interfaces and calling conventions extracted from `@manycore/aholo-sdk-lux3d@1.10.0`, `@manycore/aholo-sdk-world@1.5.0`, `@manycore/aholo-sdk-asset@1.4.0`, `@manycore/aholo-sdk-core@1.4.0`, and `@manycore/aholo-viewer@1.14.0`.

---

## 1. `@manycore/aholo-sdk-lux3d` (`v1.10.0`)

```typescript
import {
  createLux3dClient,
  HUMANOID_ANIMATION_IDS,
  type HumanoidAnimationId,
  type Lux3dTaskResult,
} from '@manycore/aholo-sdk-lux3d';

const lux3d = createLux3dClient({
  apiKey: process.env.AHOLO_API_KEY,
  region: (process.env.AHOLO_REGION as 'com' | 'cn') || 'com',
});
```

### All 10 Lux3D Resource Methods (Each returns `Promise<number>` `taskId`)

1. **Text to 3D (`lux3d.textTo3d.create`)**
   ```typescript
   const taskId = await lux3d.textTo3d.create({
     prompt: 'A futuristic modular espresso machine with chrome levers',
     version: 'G1-Turbo', // 'G1' | 'G1-Turbo'
     outputFormat: ['glb', 'zip'],
   });
   ```

2. **Image / Multi-View to 3D (`lux3d.imgTo3d.create`)**
   ```typescript
   const taskId = await lux3d.imgTo3d.create({
     img: 'https://...', // or imgs: ['https://view1.png', 'https://view2.png']
     version: 'G1',      // 'G1' | 'G1-Turbo'
     faceCount: 200_000, // 10_000 to 300_000
     outputFormat: ['zip', 'glb', 'ply'],
     enablePbr: true,
     aiPredictSize: true,
   });
   ```

3. **Multimodal Concept Image (`lux3d.multimodalToImage.create`)**
   ```typescript
   const taskId = await lux3d.multimodalToImage.create({
     prompt: 'Isometric studio render of an articulated sci-fi workbench, white background',
     // optional: img: 'https://...'
   });
   ```

4. **Orthographic Four-View Sheet (`lux3d.imageToFourView.create`)**
   ```typescript
   const taskId = await lux3d.imageToFourView.create({
     prompt: 'Armored courier droid with articulated backpack',
     // optional: img: 'https://...'
   });
   ```

5. **Semantic Part Splitting (`lux3d.partSplit.create`)**
   ```typescript
   const taskId = await lux3d.partSplit.create({
     glbUrl: 'https://.../model.glb',
   });
   ```

6. **Prompt-Driven Kinematic Articulation (`lux3d.articulationAnimation.create`)**
   ```typescript
   const taskId = await lux3d.articulationAnimation.create({
     glbUrl: 'https://.../model.glb',
     prompt: 'The top hatch opens upward 90 degrees while the front drawer slides out',
   });
   ```

7. **Humanoid Auto-Rigging (`lux3d.humanoidAutoRig.create`)**
   ```typescript
   const taskId = await lux3d.humanoidAutoRig.create({
     modelUrl: 'https://.../character.glb',
   });
   ```

8. **Humanoid Animation Retargeting (`lux3d.humanoidAnimationRetarget.create`)**
   ```typescript
   const taskId = await lux3d.humanoidAnimationRetarget.create({
     rigModelUrl: 'https://.../rigged-character.glb',
     animationIds: ['Idle_Loop', 'Walk_Loop', 'Dance_Loop', 'Sword_Heavy_Combo'], // 1-10 from HUMANOID_ANIMATION_IDS
     animationOutputMode: 'combined', // 'separate' | 'combined'
     outFormat: 'glb',                // 'glb' | 'fbx'
     animateInPlace: false,
   });
   ```

9. **PBR Material Transfer (`lux3d.materialTransfer.create`)**
   ```typescript
   const taskId = await lux3d.materialTransfer.create({
     img: 'https://.../brushed-titanium-material.jpg',
     meshUrl: 'https://.../model.glb',
     version: 'v3.0-standard',
     outputFormat: ['glb', 'usdz'],
     aiPredictSize: false,
     customSize: 120,
   });
   ```

10. **Multi-Format Export (`lux3d.multiFormatExport.create`)**
    ```typescript
    const taskId = await lux3d.multiFormatExport.create({
      modelUrl: 'https://.../model.glb',
      outputFormat: ['usdz', 'obj_zip', 'fbx_zip', 'stl', '3mf'],
    });
    ```

### Task Retrieval & Polling (`lux3d.tasks`)
```typescript
// Status codes: 0 = init, 1 = running, 3 = success, 4 = failed, 6 = canceled
const result = await lux3d.tasks.retrieve(taskId);
// result: { taskId: number, bizId?: string, status: 0|1|3|4|6, outputs: TaskOutput[] }

const history = await lux3d.tasks.list({ page: 1, pageSize: 20, status: 3 });
```

### All 85 Official `HUMANOID_ANIMATION_IDS`
```typescript
export const HUMANOID_ANIMATION_CATEGORIES = {
  Locomotion: [
    'Idle_Loop', 'Walk_Loop', 'Walk_Formal_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop',
    'Crouch_Idle_Loop', 'Crouch_Fwd_Loop', 'ClimbUp_1m', 'Swim_Idle_Loop', 'Swim_Fwd_Loop', 'Walk_Carry_Loop'
  ],
  ParkourAndJump: [
    'Jump_Start', 'Jump_Loop', 'Jump_Land', 'NinjaJump_Start', 'NinjaJump_Idle_Loop',
    'NinjaJump_Land', 'Roll', 'Slide_Start', 'Slide_Loop', 'Slide_Exit'
  ],
  SocialAndIdle: [
    'A_TPose', 'Dance_Loop', 'Yes', 'Idle_No_Loop', 'Idle_Talking_Loop',
    'Idle_TalkingPhone_Loop', 'Idle_FoldArms_Loop', 'Idle_Rail_Loop', 'Idle_Rail_Call',
    'Idle_Lantern_Loop', 'Idle_Torch_Loop', 'Sitting_Enter', 'Sitting_Idle_Loop',
    'Sitting_Talking_Loop', 'Sitting_Exit', 'LayToIdle'
  ],
  InteractionAndWork: [
    'Interact', 'Chest_Open', 'PickUp_Table', 'Push_Loop', 'Driving_Loop',
    'Fixing_Kneeling', 'Consume', 'OverhandThrow', 'Farm_PlantSeed', 'Farm_Watering',
    'Farm_Harvest', 'TreeChopping_Loop'
  ],
  CombatAndMagic: [
    'Sword_Idle', 'Sword_Attack', 'Sword_Block', 'Sword_Dash', 'Sword_Heavy_Combo',
    'Sword_Regular_A', 'Sword_Regular_A_Rec', 'Sword_Regular_B', 'Sword_Regular_B_Rec',
    'Sword_Regular_C', 'Sword_Regular_Combo', 'Idle_Shield_Loop', 'Idle_Shield_Break',
    'Shield_Dash', 'Shield_OneShot', 'Melee_Hook', 'Melee_Hook_Rec', 'Punch_Jab',
    'Punch_Cross', 'Pistol_Idle_Loop', 'Pistol_Aim_Neutral', 'Pistol_Aim_Up',
    'Pistol_Aim_Down', 'Pistol_Shoot', 'Pistol_Reload', 'Spell_Simple_Enter',
    'Spell_Simple_Idle_Loop', 'Spell_Simple_Shoot', 'Spell_Simple_Exit'
  ],
  DamageAndZombie: [
    'Hit_Chest', 'Hit_Head', 'Hit_Knockback', 'Death01',
    'Zombie_Idle_Loop', 'Zombie_Walk_Fwd_Loop', 'Zombie_Scratch'
  ]
} as const;
```

---

## 2. `@manycore/aholo-sdk-world` (`v1.5.0`)

```typescript
import { createWorldClient } from '@manycore/aholo-sdk-world';

const world = createWorldClient({
  apiKey: process.env.AHOLO_API_KEY,
  region: (process.env.AHOLO_REGION as 'com' | 'cn') || 'com',
});

// 1. SpatialGen 3DGS World Generation (Text and/or 1 reference Image)
const { worldId } = await world.generations.create({
  prompt: 'Cyberpunk neon robotics workshop with glass skylights and holographic tables',
  // optional: resources: [{ url: 'https://...', type: 'image' }]
});

// 2. Aholo Reality 3DGS World Reconstruction (>=20 images, or 1 video/insv)
const { worldId: reconId } = await world.reconstructions.create({
  name: 'Studio Capture 01',
  resources: [{ url: 'https://.../room-walkthrough.mp4', type: 'video' }], // 'image' | 'video' | 'insv'
  taskQuality: 'normal', // 'low' | 'normal' | 'high'
  scene: 'space',        // 'model' | 'space'
});

// 3. Retrieve status & outputs
const detail = await world.retrieve(worldId);
// detail.status: 'PENDING' | 'PREPROCESSING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'TIMEOUT' | 'REJECTED'
// detail.progress: number (0.0 to 1.0)
// detail.assets?.splats?.urls?.plyPath
// detail.assets?.splats?.urls?.spzPath
// detail.assets?.imagery?.panoUrl

// 4. List recent worlds
const worldList = await world.list({ pageNum: 0, pageSize: 20 });
```

---

## 3. `@manycore/aholo-Viewer` (`v1.14.0`)

```typescript
import {
  createViewer,
  createViewerContext,
  setViewerConfig,
  PerspectiveCamera,
  BackgroundMode,
  ToneMapping,
  Vector3,
  Euler,
  Color,
  AmbientLight,
  DirectionalLight,
  PointLight,
  Object3D,
  Mesh,
  SplatLoader,
  SplatUtils,
  GLTFLoader,
  Animation,
} from '@manycore/aholo-viewer';
```

### Loading Direct 3DGS Files (`.spz`, `.sog`, `.ply`)
```typescript
const fileType = SplatLoader.detectSplatFileType(url, new Uint8Array()) ?? SplatLoader.SplatFileType.SPZ;
const data = await SplatLoader.parseSplatData(
  fileType,
  url,
  SplatLoader.SplatPackType.Compressed,
  { signal: abortController.signal }
);
const splat = await SplatUtils.createSplat(data);
viewer.getScene().add(splat);
```

### Loading Chunk-Level LOD 3DGS Streams (`lod-meta.json`)
```typescript
const res = await fetch(lodMetaUrl, { signal });
const meta = (await res.json()) as SplatUtils.LodMeta; // magicCode === 2500660 && type === 'lod-splat'

const lodSplat = new SplatUtils.LodSplat(
  meta,
  {
    minLevel: meta.levels - 1,
    maxBudget: 3_500_000,
    pixelLimitEnabled: true,
    schedulerParallelCounts: 6,
  },
  createViewerContext(viewer),
  async (chunkUrl) => {
    const ft = SplatLoader.detectSplatFileType(chunkUrl, new Uint8Array())!;
    return SplatLoader.parseSplatData(ft, chunkUrl, SplatLoader.SplatPackType.Compressed);
  }
);
viewer.getScene().add(lodSplat.container);
lodSplat.tick(viewer.getCamera());
lodSplat.start();
```

### Loading & Animating GLB Props & Rigged Characters inside the 3DGS Scene
```typescript
const gltf = await GLTFLoader.loadGLTF(glbUrl);
const root = new Object3D();
for (const node of gltf.scene) {
  root.add(node);
}
viewer.getScene().add(root);

// Animation Playback
if (gltf.animations && gltf.animations.length > 0) {
  const animPlugin = viewer.getOrCreatePlugin(Animation.AnimationPlugin);
  const mixer = new Animation.AnimationMixer(root);
  animPlugin.addMixer(mixer);
  const action = mixer.clipAction(gltf.animations[0]);
  action.play();
}
```
