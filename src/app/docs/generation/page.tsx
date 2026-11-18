import type { Metadata } from "next";
import { A, C, Callout, DocArticle, Fig, H2, H3, OL, P, Table, UL } from "@/components/docs/prose";
import { T } from "@/lib/i18n";

export const metadata: Metadata = { title: "Live generation" };

export default function GenerationDoc() {
  return (
    <DocArticle
      href="/docs/generation"
      title={<T en="Live generation" zh="实时生成" />}
      lead={
        <T
          en={
            <>
              <strong>Every Aholo World and Lux3D method is one click away in the studio.</strong> The left dock sends jobs through
              Holorra&apos;s server routes to the official SDKs, shows a receipt for each call, and follows Lux3D jobs until their
              result can drop into the scene.
            </>
          }
          zh={
            <>
              <strong>Aholo World 与 Lux3D 的每个方法，在创作台里都是一键调用。</strong>左侧面板经由 Holorra
              的服务端接口把任务交给官方 SDK，每次调用都会显示一条调用回执，并持续跟踪 Lux3D 任务，直到结果可以投放到场景中。
            </>
          }
        />
      }
    >
      <H2 id="keys">
        <T en="Keys and regions" zh="密钥与区域" />
      </H2>
      <P>
        <T
          en={
            <>
              A live job needs an Aholo API key from <A href="https://labs.aholo.ai">labs.aholo.ai</A> (or labs.aholo.cn). There are
              two ways to provide one:
            </>
          }
          zh={
            <>
              运行实时任务需要 Aholo API 密钥，可在 <A href="https://labs.aholo.ai">labs.aholo.ai</A>（或 labs.aholo.cn）申请。提供密钥有两种方式：
            </>
          }
        />
      </P>
      <UL>
        <li>
          <T
            en={
              <>
                <strong>Server:</strong> set <C>AHOLO_API_KEY</C> (and optionally <C>AHOLO_REGION=cn</C>) in the environment.
              </>
            }
            zh={
              <>
                <strong>服务端：</strong>在环境变量中设置 <C>AHOLO_API_KEY</C>（可选再设置 <C>AHOLO_REGION=cn</C>）。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Bring your own:</strong> paste a key under <strong>API key</strong> in the studio header and pick COM or CN.
                It is kept in your browser&apos;s local storage and sent per request as <C>x-aholo-api-key</C> and{" "}
                <C>x-aholo-region</C>. A header key takes precedence over the server key, so jobs run on your own credits.
              </>
            }
            zh={
              <>
                <strong>自带密钥：</strong>在创作台顶栏的 <strong>API 密钥</strong> 处粘贴密钥，并选择 COM 或 CN。密钥保存在浏览器的本地存储中，每次请求通过{" "}
                <C>x-aholo-api-key</C> 和 <C>x-aholo-region</C> 发送。请求头里的密钥优先于服务端密钥，因此任务消耗的是你自己的额度。
              </>
            }
          />
        </li>
      </UL>
      <P>
        <T
          en="Without any key, nothing is sent to Aholo. Requests return a labelled preview instead (see the last section)."
          zh="没有任何密钥时，不会向 Aholo 发送任何内容，请求会返回带标注的预览结果（见最后一节）。"
        />
      </P>

      <H2 id="world">
        <T en="World: SpatialGen and Aholo Reality" zh="世界：SpatialGen 与 Aholo Reality" />
      </H2>
      <Table
        head={["In the World tab", "SDK call", "Inputs"]}
        rows={[
          [
            <T key="gl" en="Generate a world" zh="生成世界" />,
            <C key="g">world.generations.create</C>,
            <T key="gi" en="A prompt, an image URL, or both" zh="提示词、图片 URL，或两者同时提供" />,
          ],
          [
            <T key="rl" en="Reconstruct a space or object" zh="重建空间或物体" />,
            <C key="r">world.reconstructions.create</C>,
            <T
              key="ri"
              en="Media URLs: video, 20+ photos or Insta360 .insv; scene model or space; quality low, normal or high; optional mask"
              zh="媒体 URL：视频、20 张以上照片或 Insta360 .insv；scene 取 model 或 space；质量取 low、normal 或 high；可选主体遮罩（mask）"
            />,
          ],
        ]}
      />
      <P>
        <T
          en={
            <>
              The World tab takes media by URL. To start from local files, use the MCP server&apos;s <C>upload_asset</C> or{" "}
              <C>world_reconstruct_*_from_files</C> tools (see <A href="/docs/mcp">MCP & co-director</A>). Worlds take minutes: our
              coffee bar took 625 s. A finished world returns splat files; that is how world 05 joined the studio&apos;s presets.
              Your recent worlds are listed by <C>GET /api/aholo/world</C>.
            </>
          }
          zh={
            <>
              世界标签页通过 URL 接收媒体。如果要从本地文件开始，请使用 MCP 服务器的 <C>upload_asset</C> 或{" "}
              <C>world_reconstruct_*_from_files</C> 工具（见 <A href="/docs/mcp">MCP 与 AI 副导演</A>）。生成一个世界需要几分钟，我们的咖啡吧用了
              625 s。完成的世界会返回 3DGS 文件，世界 05 就是这样加入创作台预设的。<C>GET /api/aholo/world</C> 会列出你最近的世界。
            </>
          }
        />
      </P>
      <Fig
        src="/landing/spatialgen-pano.jpg"
        alt="The 360° panorama SpatialGen returned for the coffee bar"
        caption={
          <T
            en="The panorama SpatialGen returned alongside the coffee bar's splats (world 3FO4K4V99KMD)."
            zh="SpatialGen 随咖啡吧的高斯点一同返回的全景图（世界 3FO4K4V99KMD）。"
          />
        }
      />

      <H2 id="lux3d">
        <T en="Lux3D: all ten methods" zh="Lux3D：全部十个方法" />
      </H2>
      <Table
        head={["Method", "What it does"]}
        rows={[
          [<C key="1">textTo3d</C>, <T key="d1" en="Text to a textured mesh, engine G1 or G1-Turbo" zh="由文本生成带纹理的网格，引擎可选 G1 或 G1-Turbo" />],
          [
            <C key="2">imgTo3d</C>,
            <T key="d2" en="One or more images to a mesh; 10k to 300k faces, PBR maps optional" zh="由一张或多张图片生成网格；面数 10k 至 300k，PBR 贴图可选" />,
          ],
          [<C key="3">imageToFourView</C>, <T key="d3" en="An orthographic four-view sheet from an image or prompt" zh="由图片或提示词生成正交四视图" />],
          [<C key="4">multimodalToImage</C>, <T key="d4" en="Concept art from a prompt and/or image" zh="由提示词和/或图片生成概念图" />],
          [<C key="5">partSplit</C>, <T key="d5" en="A GLB split into semantic parts" zh="把 GLB 拆分为语义部件" />],
          [<C key="6">articulationAnimation</C>, <T key="d6" en="Joints and motion from a sentence, returned as URDF" zh="用一句话生成关节与运动，以 URDF 格式返回" />],
          [<C key="7">humanoidAutoRig</C>, <T key="d7" en="Skeleton and skin weights on a static humanoid" zh="为静态人形模型生成骨骼与蒙皮权重" />],
          [<C key="8">humanoidAnimationRetarget</C>, <T key="d8" en="1 to 10 official clips onto a rigged humanoid" zh="把 1 至 10 个官方动作片段重定向到已绑骨的人形模型上" />],
          [
            <C key="9">materialTransfer</C>,
            <T
              key="d9"
              en={
                <>
                  A new PBR texture set from a reference image (<C>v3.0-standard</C>)
                </>
              }
              zh={
                <>
                  根据参考图生成一套新的 PBR 贴图（<C>v3.0-standard</C>）
                </>
              }
            />,
          ],
          [<C key="10">multiFormatExport</C>, <T key="d10" en="usdz, fbx_zip, obj_zip, stl, 3mf" zh="usdz、fbx_zip、obj_zip、stl、3mf" />],
        ]}
      />
      <P>
        <T
          en="Task status codes follow the SDK: 0 initialising, 1 running, 3 succeeded, 4 failed, 6 cancelled."
          zh="任务状态码与 SDK 一致：0 初始化，1 进行中，3 成功，4 失败，6 已取消。"
        />
      </P>

      <H2 id="drop-in">
        <T en="Drop-in: the result lands in your world" zh="投放到场景：结果直接落进你的世界" />
      </H2>
      <P>
        <T
          en="You can keep playing while a Text to 3D job runs. When it finishes, the model appears in front of you."
          zh="文生 3D 任务运行期间，你可以继续游玩。任务完成后，模型会出现在你面前。"
        />
      </P>
      <OL>
        <li>
          <T
            en={
              <>
                <strong>Submit:</strong> Text to 3D calls <C>lux3d.textTo3d.create</C> and the studio starts following the task.
              </>
            }
            zh={
              <>
                <strong>提交：</strong>文生 3D 调用 <C>lux3d.textTo3d.create</C>，创作台随即开始跟踪该任务。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Track:</strong> a chip on the stage shows the job and its elapsed time. The studio polls{" "}
                <C>/api/aholo/tasks?taskId=</C> every 10 s.
              </>
            }
            zh={
              <>
                <strong>跟踪：</strong>舞台上的状态标签显示任务及已用时间。创作台每 10 s 轮询一次 <C>/api/aholo/tasks?taskId=</C>。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Fetch:</strong> the finished GLB is loaded through <C>/api/aholo/asset</C>, an allowlisted proxy (see{" "}
                <A href="/docs/faq">Limits & FAQ</A>), so result hosts never need CORS and links never leak to third parties.
              </>
            }
            zh={
              <>
                <strong>获取：</strong>完成的 GLB 通过 <C>/api/aholo/asset</C> 加载，这是一个带白名单的代理（见{" "}
                <A href="/docs/faq">限制与常见问题</A>），因此结果所在的主机无需支持 CORS，链接也不会泄露给第三方。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Drop:</strong> the model is scaled to about 70 cm, placed 1.6 m ahead of the camera, and falls from 1.8 m
                onto the floor found in the voxel grid, bouncing to rest. A toast names the task.
              </>
            }
            zh={
              <>
                <strong>投放：</strong>模型缩放到约 70 cm，放在镜头前方 1.6 m 处，从 1.8 m 高处落到体素网格中检测到的地面上，弹跳几下后停稳。同时弹出提示，注明对应的任务。
              </>
            }
          />
        </li>
      </OL>
      <Fig
        src="/landing/drop-in.jpg"
        alt="A generated espresso machine dropped onto the floor of the coffee bar"
        caption={
          <T
            en="A drop-in in the coffee bar. This one is the cached result used when no key is set, and the toast says so."
            zh="咖啡吧中的一次投放。这里用的是未设置密钥时的缓存结果，提示中也写明了这一点。"
          />
        }
      />

      <H2 id="no-key">
        <T en="Without a key" zh="没有密钥时" />
      </H2>
      <UL>
        <li>
          <T
            en={
              <>
                <strong>Text to 3D</strong> drops our stored G1-Turbo espresso machine (task 8353472) and labels it{" "}
                <em>cached</em>, so the flow can be tried end to end.
              </>
            }
            zh={
              <>
                <strong>文生 3D</strong> 会投放我们存储的 G1-Turbo 意式咖啡机（任务 8353472），并标注为<em>缓存结果</em>（cached），这样整个流程也能从头到尾体验一遍。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>Other Lux3D methods</strong> return a receipt marked <em>preview</em> and update the stage where it can
                (for example selecting the matching prop).
              </>
            }
            zh={
              <>
                <strong>其他 Lux3D 方法</strong>返回标注为<em>预览</em>（preview）的调用回执，并尽可能同步更新舞台（例如选中对应的道具）。
              </>
            }
          />
        </li>
        <li>
          <T
            en={
              <>
                <strong>World requests</strong> are answered by the closest hosted world (plaza, station or loft, by keyword) and
                marked <em>cdn preset</em>.
              </>
            }
            zh={
              <>
                <strong>世界请求</strong>会按关键词匹配最接近的托管世界（广场、车站或公寓）作为回应，并标注为<em>CDN 预设</em>（cdn preset）。
              </>
            }
          />
        </li>
      </UL>

      <H3>
        <T en="Receipts" zh="调用回执" />
      </H3>
      <P>
        <T
          en={
            <>
              Every call adds a receipt to the dock with the SDK package, method, task or world ID, status and mode (live, preview,
              cached or cdn preset). That log is the quickest way to see what really ran.
            </>
          }
          zh={
            <>
              每次调用都会在面板中新增一条调用回执，记录 SDK 包、方法、任务或世界 ID、状态和模式（live、preview、cached 或 cdn
              preset，即实时、预览、缓存结果或 CDN 预设）。想知道实际运行了什么，看这份记录最快。
            </>
          }
        />
      </P>

      <Callout>
        <T
          en={
            <>
              Live jobs spend credits on the key&apos;s account. A G1 mesh took 343 s for us and a SpatialGen world 625 s; keep the
              tab open while they run.
            </>
          }
          zh={
            <>
              实时任务会消耗该密钥所属账户的额度。我们实测一个 G1 网格用了 343 s，一个 SpatialGen 世界用了 625 s；任务运行期间请保持页面打开。
            </>
          }
        />
      </Callout>
    </DocArticle>
  );
}
