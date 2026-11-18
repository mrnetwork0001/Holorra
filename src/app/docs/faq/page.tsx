import type { Metadata } from "next";
import { A, C, Callout, DocArticle, H2, H3, P, Table, UL } from "@/components/docs/prose";
import { T, type L } from "@/lib/i18n";

export const metadata: Metadata = { title: "Limits & FAQ" };

const FAQ: [L, L<React.ReactNode>][] = [
  [
    { en: "Do I need an API key to try it?", zh: "试用需要 API 密钥吗？" },
    {
      en: (
        <>No. Worlds, play mode, explode, articulation, the actor, the camera path and the bench all work without one. A key is only
        needed to start new Aholo jobs.</>
      ),
      zh: <>不需要。世界、游玩模式、爆炸视图、关节化、角色、镜头路径和测试台都无需密钥即可使用。只有发起新的 Aholo 任务时才需要密钥。</>,
    },
  ],
  [
    { en: "Why does a live job take minutes?", zh: "为什么实时任务要几分钟？" },
    {
      en: (
        <>Generation runs on Aholo&apos;s cloud. Our runs took 81 s to 343 s for Lux3D and 625 s for a SpatialGen world. The studio
        stays playable while you wait, and Text to 3D results drop into the scene when they are done.</>
      ),
      zh: (
        <>
          生成在 Aholo 云端运行。我们实测 Lux3D 任务耗时 81 s 至 343 s，SpatialGen 世界耗时 625 s。等待期间创作台照常可玩，文生 3D
          的结果完成后会直接投放到场景中。
        </>
      ),
    },
  ],
  [
    { en: "Which browsers work?", zh: "支持哪些浏览器？" },
    {
      en: (
        <>Any browser with WebGL2 and module Web Workers: current Chrome, Edge, Safari and Firefox. The chunk-LOD worlds are heavy;
        on phones the loft and coffee bar are the smoothest.</>
      ),
      zh: (
        <>
          任何支持 WebGL2 和模块化 Web Workers 的浏览器都可以，包括当前版本的 Chrome、Edge、Safari 和 Firefox。分块 LOD
          世界负载较重；在手机上，公寓和咖啡吧最流畅。
        </>
      ),
    },
  ],
  [
    { en: "Can I use my own model?", zh: "可以用我自己的模型吗？" },
    {
      en: (
        <>Yes. Send a GLB URL to part split, articulation, auto-rig or export from the Lux3D tab. Hosts must be reachable by the Aholo
        API.</>
      ),
      zh: <>可以。在 Lux3D 标签页中把 GLB URL 提交给部件拆分、关节化、自动绑骨或导出即可。文件所在的主机必须能被 Aholo API 访问。</>,
    },
  ],
  [
    { en: "Why is there only one actor?", zh: "为什么只有一个角色？" },
    {
      en: (
        <>Manycore&apos;s demo GLBs had root scales of 1.78e-5 and 0.0035 and rendered invisibly on this stage, so we removed them
        rather than ship a broken option. The actor you get is our own Lux3D result.</>
      ),
      zh: (
        <>
          Manycore 的示例 GLB 根节点缩放分别为 1.78e-5 和 0.0035，在这个舞台上渲染出来完全看不见。与其提供一个坏掉的选项，我们选择移除它们。你现在使用的角色是我们自己的
          Lux3D 结果。
        </>
      ),
    },
  ],
];

export default function FaqDoc() {
  return (
    <DocArticle
      href="/docs/faq"
      title={<T en="Limits & FAQ" zh="限制与常见问题" />}
      lead={
        <T
          en={
            <>
              <strong>What we ask you to trust, stated plainly.</strong> This page lists what is a real Aholo output, what is a
              preview, how keys are handled, and what does not work yet.
            </>
          }
          zh={
            <>
              <strong>哪些需要你信任，我们直说。</strong>本页列出哪些是真实的 Aholo 产出、哪些是预览、密钥如何处理，以及哪些功能还不能用。
            </>
          }
        />
      }
    >
      <H2 id="real">
        <T en="Real or preview" zh="真实还是预览" />
      </H2>
      <Table
        head={["In the app", "Status"]}
        rows={[
          [
            <T key="a1" en="Worlds 01 to 04" zh="世界 01 至 04" />,
            <T key="b1" en="Real: Manycore-hosted splats and voxel grids, streamed from the CDN" zh="真实：由 Manycore 托管的高斯点与体素网格，从 CDN 流式加载" />,
          ],
          [
            <T key="a2" en="World 05, coffee bar" zh="世界 05，咖啡吧" />,
            <T
              key="b2"
              en="Real: our SpatialGen job (world 3FO4K4V99KMD), mirrored into the repo"
              zh="真实：我们的 SpatialGen 任务（世界 3FO4K4V99KMD），已镜像到仓库"
            />,
          ],
          [
            <T key="a3" en="Espresso machine, parts and joints" zh="意式咖啡机及其部件与关节" />,
            <T key="b3" en="Real: Lux3D tasks 8353478, 8354166 and 8354168" zh="真实：Lux3D 任务 8353478、8354166 和 8354168" />,
          ],
          [
            <T key="a4" en="The actor and its eight clips" zh="角色及其 8 个动作片段" />,
            <T key="b4" en="Real: Lux3D tasks 8354807, 8355123 and 8359816" zh="真实：Lux3D 任务 8354807、8355123 和 8359816" />,
          ],
          [
            <T key="a5" en="Patrol drone and holo-terminal props" zh="巡逻无人机与全息终端道具" />,
            <T
              key="b5"
              en={
                <>
                  <strong key="p">Procedural previews</strong>, hand-built and labelled in the app
                </>
              }
              zh={
                <>
                  <strong>程序化预览</strong>，手工搭建，并在应用中标注
                </>
              }
            />,
          ],
          [
            <T key="a6" en="Text to 3D drop-in without a key" zh="无密钥时的文生 3D 投放" />,
            <T
              key="b6"
              en={
                <>
                  <strong key="c">Cached</strong>: the stored G1-Turbo result of task 8353472, labelled
                </>
              }
              zh={
                <>
                  <strong>缓存结果</strong>：任务 8353472 存储的 G1-Turbo 结果，并有标注
                </>
              }
            />,
          ],
          [
            <T key="a7" en="Other jobs without a key" zh="无密钥时的其他任务" />,
            <T
              key="b7"
              en={
                <>
                  <strong key="v">Preview</strong> receipts; nothing is sent to Aholo
                </>
              }
              zh={
                <>
                  <strong>预览</strong>调用回执；不向 Aholo 发送任何内容
                </>
              }
            />,
          ],
          [
            <T key="a8" en="Co-director" zh="AI 副导演" />,
            <T key="b8" en="Real plan, deterministic keyword planner; it does not start jobs" zh="真实的规划，来自基于关键词的确定性规划器；不会启动任务" />,
          ],
          [
            <T key="a9" en="LuxReal video" zh="LuxReal 视频" />,
            <T key="b9" en="Hand-off only: Holorra exports the prompt, camera data and frames" zh="仅负责交接：Holorra 导出提示词、镜头数据和画面帧" />,
          ],
        ]}
      />

      <H2 id="keys">
        <T en="How keys are handled" zh="密钥如何处理" />
      </H2>
      <UL>
        <li>
          <T
            en={
              <>
                <strong>Server key</strong> (<C>AHOLO_API_KEY</C>) stays on the server. It is never sent to the browser, and{" "}
                <C>/api/aholo/status</C> reports only whether one is present.
              </>
            }
            zh={
              <>
                <strong>服务端密钥</strong>（<C>AHOLO_API_KEY</C>）只留在服务端，永远不会发送到浏览器；<C>/api/aholo/status</C>{" "}
                只报告是否存在密钥。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Free live jobs are capped.</strong> On the hosted demo, jobs that run on the server key are limited to 5
                per visitor and 25 site-wide per day. Past that, the studio asks you to add your own key from{" "}
                <A href="https://labs.aholo.ai/api-keys">labs.aholo.ai/api-keys</A>; jobs on your own key are never limited.
              </>
            }
            zh={
              <>
                <strong>免费实时任务有每日上限。</strong>在线演示中，使用服务端密钥的任务每位访客每天 5 个、全站每天 25 个。超出后，创作台会提示你到{" "}
                <A href="https://labs.aholo.ai/api-keys">labs.aholo.ai/api-keys</A> 获取并填入自己的密钥；用自己的密钥运行的任务不受限制。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Your key</strong>, if you paste one, is stored in your browser&apos;s local storage and sent only to
                Holorra&apos;s own <C>/api/aholo/*</C> routes as <C>x-aholo-api-key</C>. The routes pass it to the SDK for that
                request and do not log or store it.
              </>
            }
            zh={
              <>
                <strong>你的密钥</strong>（如果粘贴了）保存在浏览器的本地存储中，只会以 <C>x-aholo-api-key</C> 的形式发送到 Holorra 自己的{" "}
                <C>/api/aholo/*</C> 接口。接口只在该次请求中把它交给 SDK，不会记录日志，也不会保存。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>The asset proxy is not an open proxy:</strong> https only, a fixed list of Aholo result hosts, every redirect
                re-checked, 60 s and 120 MB limits. See <A href="/docs/api#asset">HTTP API</A>.
              </>
            }
            zh={
              <>
                <strong>资源代理不是开放代理：</strong>仅限 https，只放行固定的 Aholo 结果主机列表，每次重定向都重新校验，并有 60 s 和 120 MB
                的限制。见 <A href="/docs/api#asset">HTTP API</A>。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>The repository</strong> contains no keys; <C>.env.local</C> is git-ignored and <C>.mcp.json</C> ships a
                placeholder.
              </>
            }
            zh={
              <>
                <strong>代码仓库</strong>不包含任何密钥；<C>.env.local</C> 已被 git 忽略，<C>.mcp.json</C> 中只有占位符。
              </>
            }
          />
        </li>
      </UL>

      <H2 id="limits">
        <T en="Known limitations" zh="已知限制" />
      </H2>
      <UL>
        <li>
          <T
            en={
              <>
                <strong>Collision</strong> exists only in the loft and the plaza. The concourse, turntable and coffee bar use a fixed
                floor height, so you can walk through their walls.
              </>
            }
            zh={
              <>
                <strong>碰撞</strong>只在公寓和广场中生效。枢纽大厅、物体转台和咖啡吧使用固定的地面高度，所以可以直接穿墙。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>New SpatialGen worlds</strong> are not added to the world tabs automatically; adding one means mirroring its
                splat file and writing a preset, as we did for world 05.
              </>
            }
            zh={
              <>
                <strong>新的 SpatialGen 世界</strong>不会自动出现在世界切换栏中；要添加一个，需要镜像它的高斯点文件并编写预设，就像我们为世界 05
                做的那样。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Drop-ins</strong> are cosmetic: they fall and settle but are not saved with the scene and do not collide
                with the actor.
              </>
            }
            zh={
              <>
                <strong>投放的模型</strong>只是视觉效果：它们会下落并停稳，但不会随场景保存，也不会与角色发生碰撞。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Retarget results</strong> come back as one GLB with generic clip names (<C>animation_1</C>...); the
                studio maps them by request order.
              </>
            }
            zh={
              <>
                <strong>动画重定向结果</strong>以单个 GLB 返回，动作片段名称是通用的（<C>animation_1</C>...）；创作台按请求顺序把它们对应起来。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Heavy worlds on phones.</strong> The 41.8M-splat plaza streams by LOD but can be slow on older devices.
              </>
            }
            zh={
              <>
                <strong>手机上的重型世界。</strong>拥有 41.8M 个高斯点的广场虽然按 LOD 流式加载，在旧设备上仍可能较慢。
              </>
            }
          />
        </li>
      </UL>

      <H2 id="faq">
        <T en="FAQ" zh="常见问题" />
      </H2>
      {FAQ.map(([q, a]) => (
        <div key={q.en}>
          <H3>
            <T en={q.en} zh={q.zh} />
          </H3>
          <P>
            <T en={a.en} zh={a.zh} />
          </P>
        </div>
      ))}

      <Callout tone="warn">
        <T
          en={
            <>
              Hackathon software, built for the Manycore Aholo Global 3D AI Hackathon. Live jobs spend credits on the key&apos;s
              account.
            </>
          }
          zh={
            <>
              这是为 Manycore Aholo Global 3D AI Hackathon 打造的黑客松作品。实时任务会消耗密钥所属账户的额度。
            </>
          }
        />
      </Callout>
    </DocArticle>
  );
}
