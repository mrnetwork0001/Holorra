/** Docs navigation: one source for the sidebar, the mobile drawer and prev/next links. */
export interface DocLink {
  href: string;
  title: string;
  /** one line, used in reading-order lists */
  blurb: string;
  /** 简体中文 */
  zh: { title: string; blurb: string };
}

export interface DocGroup {
  label: string;
  zh: string;
  items: DocLink[];
}

export const DOC_GROUPS: DocGroup[] = [
  {
    label: "Getting started",
    zh: "快速开始",
    items: [
      { href: "/docs", title: "Welcome to Holorra", blurb: "what it is and where everything lives", zh: { title: "欢迎使用 Holorra", blurb: "它是什么，入口都在哪里" } },
      { href: "/docs/how-it-works", title: "How it works", blurb: "the four stages, from prompt to shot", zh: { title: "工作原理", blurb: "从提示词到镜头的四个阶段" } },
    ],
  },
  {
    label: "The studio",
    zh: "创作台",
    items: [
      { href: "/docs/worlds", title: "Worlds & the stage", blurb: "five splat worlds, LOD streaming and voxel floors", zh: { title: "世界与舞台", blurb: "五个高斯泼溅世界、LOD 流式加载与体素地面" } },
      { href: "/docs/play", title: "Play mode", blurb: "the scene quest, controls and the phone joystick", zh: { title: "游玩模式", blurb: "场景任务、操作方式与手机摇杆" } },
      { href: "/docs/parts", title: "Parts & articulation", blurb: "explode, hide and hinge a generated object", zh: { title: "部件拆分与关节化", blurb: "爆炸、隐藏、让生成的物体动起来" } },
      { href: "/docs/actors", title: "Actors & animation", blurb: "auto-rig, retarget and the clip library", zh: { title: "角色与动画", blurb: "自动绑骨、动画重定向与动作库" } },
      { href: "/docs/director", title: "Camera director", blurb: "keyframes, spline playback and the LuxReal pack", zh: { title: "镜头导演", blurb: "关键帧、样条回放与 LuxReal 分镜包" } },
    ],
  },
  {
    label: "Generate",
    zh: "生成",
    items: [
      { href: "/docs/generation", title: "Live generation", blurb: "SpatialGen, Reality and Lux3D jobs, and the drop-in", zh: { title: "实时生成", blurb: "SpatialGen、Reality 与 Lux3D 任务，以及结果投放" } },
      { href: "/docs/results", title: "Real results", blurb: "every job we ran, with task IDs and times", zh: { title: "真实结果", blurb: "我们跑过的每个任务，含任务 ID 与耗时" } },
    ],
  },
  {
    label: "Agents",
    zh: "智能体",
    items: [{ href: "/docs/mcp", title: "MCP & co-director", blurb: "Aholo MCP in your editor and in the studio", zh: { title: "MCP 与 AI 副导演", blurb: "在编辑器和创作台中使用 Aholo MCP" } }],
  },
  {
    label: "Build",
    zh: "开发",
    items: [
      { href: "/docs/api", title: "HTTP API", blurb: "the /api/aholo routes the studio calls", zh: { title: "HTTP API", blurb: "创作台调用的 /api/aholo 接口" } },
      { href: "/docs/deploy", title: "Self-hosting & deployment", blurb: "env vars, builds and the viewer's quirks", zh: { title: "自托管与部署", blurb: "环境变量、构建与查看器的注意事项" } },
    ],
  },
  {
    label: "Trust",
    zh: "可信度",
    items: [{ href: "/docs/faq", title: "Limits & FAQ", blurb: "what is real, what is a preview, how keys are handled", zh: { title: "限制与常见问题", blurb: "哪些是真实结果、哪些是预览、密钥如何处理" } }],
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
