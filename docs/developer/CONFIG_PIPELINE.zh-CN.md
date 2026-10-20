# 配置来源与更新链路（P1 · 第一份，2026-10-19）

目标回答两个问题：**「这个配置值到底从哪来」**和**「改完之后要等多久、在哪一环能看到」**。
本文的数字与结论都从仓库现状读来（列出行号），不是从历史记录抄的；开始任何一次排查前先重新核对实现，别把本文当成今天的线上测量。

## 一、五层配置源

| 层 | 载体 | 读取时机 | 覆盖关系 |
|---|---|---|---|
| A | 主题私有配置 `themes/journal/config.js`（等价的还有各主题自己的）里的 `process.env.NEXT_PUBLIC_*` 兜底值 | 模块加载时（构建期展开进 bundle） | 最弱，只在其它层都没给值时兜底 |
| B | `blog.config.js` ← `conf/*.js` 的默认值，其中同样嵌了 `process.env.*` 兜底 | 构建期常量 | 同上 |
| C | Notion config 页（下面详细说） | 请求/构建时从 Notion 抓来 | **最高**，覆盖 A/B |
| D | `extendConfig` 参数（服务端把 `NOTION_CONFIG` 当第三个参数传进来） | 调用处决定 | 见第三节的特殊名单 |
| E | 查询参数与读者本地状态 | 运行期 | `?theme=`、localStorage 夜间模式，不进 server 配置 |

「配置优先读 Notion 表、其次环境变量、最后 blog.config.js」这句话老注释就是这么写的，但**代码顺序和注释顺序对不上**，见第二节。

## 二、取值函数 `siteConfig` 的真实顺序（`lib/config.js`）

入口 `siteConfig(key, defaultVal, extendConfig)`，`lib/config.js:17`。按代码执行顺序：

1. `THEME_SWITCH` 特判（`lib/config.js:25-29`）：`NEXT_PUBLIC_THEME_SWITCH` 非空就直接返回，连 Notion 都不问。
2. **「服务端专属名单」直接跳过 Notion**（`lib/config.js:32-65`）：`NEXT_REVALIDATE_SECOND`、`POST_*`、`THEME`、`LINK`、`AI_SUMMARY_*`、`UUID_REDIRECT`、`RSS_FULL_CONTENT` 等约 18 个键。它们只从 `extendConfig` 或 `BLOG` 里取，**Notion 配置表里写这些键不生效**（`LINK` 还要 `extendConfig` 非空才继续，否则落到 `BLOG.LINK`）。
3. `getGlobalSnapshot()`（`lib/config.js:67`）：客户端渲染时能拿到 `NOTION_CONFIG` / `THEME_CONFIG` / `runtimeConfigOverrides`。
4. 优先级（`lib/config.js:73-81`）：
   - `runtimeConfigOverrides[key]`（谁写的见第三节）
   - `NOTION_CONFIG[key]` —— Notion 配置表
   - `THEME_CONFIG[key]` —— 主题私有 `config.js`
5. 兼容键（`lib/config.js:85-109`）：`TITLE`/`DESCRIPTION`/`AVATAR`/`HOME_BANNER_IMAGE` 会转去问 `siteInfo`（取自 Notion 页面本身的标题、简介、封面、图标）。
6. `extendConfig[key]`（`lib/config.js:113`）。
7. `BLOG[key]`（`lib/config.js:119`）。
8. 兜底默认值（`lib/config.js:123`）。

**一句话总结：Notion 表 > 主题 CONFIG > extendConfig > blog.config.js，同时约 18 个「服务端专属键」被钉死在 extendConfig/blog.config 一侧；运行期覆盖 `runtimeConfigOverrides` 压过一切。**

主题私有键（`JOURNAL_*` 那几十个）不在名单里，走 `themes/journal/index.js:102` 的 `j(key, fallback) = siteConfig(key, fallback, CONFIG)`，即**第 4 层 THEME_CONFIG 优先于第 6 层 extendConfig**。所以线上 `NOTION_CONFIG` 里写 `JOURNAL_*` 是被覆盖关系忽略的（接缝见 `themes/journal/reading.js:6`，同一个 `j`）。

## 三、三个「半路杀出」的覆盖源

### 3.1 Notion config 页怎么被读进来

链路：`lib/db/SiteDataApi.js:562` → `lib/db/notion/getNotionConfig.js:21 getConfigMapFromConfigPage` → `parseConfigFromPage`（`lib/db/notion/getNotionConfig.js:87`）。

- 只认 `type` 为 `CONFIG`/`config`/`Config` 的页面（`findConfigPage`，`lib/db/notion/getNotionConfig.js:44`），**取第一个，多个就忽略其余**。
- 每一行要「启用=Yes 且有配置名」才进 NOTION_CONFIG（`lib/db/notion/getNotionConfig.js:169`）。没勾启用 = 没写。
- 值以文本存，`parseTextToJson` 能解析成 JSON 就解析（`lib/db/notion/getNotionConfig.js:198`），再由 `convertVal` 统一转数字/布尔/数组（`lib/config.js:141`）。
- 顶层支持 `INLINE_CONFIG` 键做整体 JSON 合并（`lib/db/notion/getNotionConfig.js:181-186`）。
- 失败三档提示:`[Notion配置] 未找到配置页面` / `未找到配置表` / JSON 解析失败,都是 `console.warn` **不抛错**,站点按无 Notion 配置继续跑。

### 3.2 `runtimeConfigOverrides`（运行期覆盖，只对当前浏览器会话生效）

写入方只有一处：`components/ThemeSwitch.js:209 updateRuntimeConfigOverride(item.key, value)`（切换外观类选项时）。`lib/config.js:75` 把它放在 NOTION_CONFIG 之前读，所以它永远赢。

影响排查的地方：**这是本地、会话级、不持久**的覆盖，只存在于当前页面的 React 状态里（`lib/global.js:37,90,150,168`），不发请求、不进 ISR 缓存、换设备就没了。

### 3.3 `THEME_CONFIG` 的时差

`lib/global.js:36,67-71,120-122`：主题配置是异步 `getThemeConfig(theme)` 拉的（`themes/theme.js:156`），首帧可能是 `null`，之后某次 effect 才填上。因此**同一页面首帧和 hydration 之后 `siteConfig('JOURNAL_*')` 可能读到不同层**：首帧落到 extendConfig/BLOG，等 THEME_CONFIG 到位才按第 4 层生效。

这条是「说好的开关怎么没生效」类问题的常见客观原因，也是历史上 journal 侧一个反复出现的坑（冷启动首帧 NOTION_CONFIG 未进快照时 `siteConfig('LINK')` 会落到 `BLOG.LINK` 的 localhost 默认值，见 `design-system/journal/MASTER.md` 的 og 卡相关记录）。

## 四、缓存与更新链路：一篇文章从 Notion 到屏幕上

三层缓存串联，任何一层不过期，页面都不会更新：

| 层 | 机制 | 时长/条件 | 代码 |
|---|---|---|---|
| ① Notion 本地文件缓存 | 每次取数写/读本地 JSON | 无显式过期时间（`expireTime = null`） | `lib/cache/local_file_cache.js:36-49` |
| ② Next.js ISR | 每页 `NEXT_REVALIDATE_SECOND` 秒后下次访问重新生成 | 默认 60 秒，可被 Notion 表覆盖 | `pages/index.js:139`、`pages/archive/index.js:66` 等 23 个路由 |
| ③ 按需刷新 | `POST /api/revalidate` | 需 `REVALIDATION_TOKEN` | `pages/api/revalidate.js:19-92` |

要点：

- `NEXT_REVALIDATE_SECOND` 属于「服务端专属名单」，**Notion 表里写它无效**，只能走环境变量 `NEXT_PUBLIC_REVALIDATE_SECOND` 或 `blog.config.js:15` 的默认 60 秒。同理 `POSTS_SORT_BY`、`POSTS_PER_PAGE`。
- ISR 到期≠立刻重取：Next 只在**下一次请求**触发重新生成，响应的是旧页面还是新页面取决于是否已生成完——这就是「明明改了 Notion，页面上还是旧的，过一会儿再刷又对了」的成因。
- 按需刷新 `all: true` 只做两件事：清本地文件缓存 + revalidate 首页（`pages/api/revalidate.js:49-57`）；其它页面靠随后访问自然过期（该函数注释自己也写明了）。
- 容器级：部署（push main）会换容器，容器内缓存清空——所以「没改内容但部署一次也正常了」是缓存被换掉的副作用。

### 4.1 2026-10-20 实测订正：上表漏了 memory 层，且「10 分钟」不成立

这一节是本文件第一次**用受控实验回答「线上到底取到哪里」**，起因是 J2 路线页发布时记错了一次归因。

**做过什么**：在线上库建一次性探针页，测两件事，测完即 `archived`（不进回收站以外的清理动作，可恢复）。全程每 10–15 秒用无头 Chrome 取一次真实 DOM 标题（不用 curl：线上是 React 流式输出，`<title>` 不在初始 HTML 里，实测 curl 抓不到）。

| 实验 | 做什么 | 实测 |
|---|---|---|
| A 新内容上线 | 建页（`Published`）后轮询该 URL | 基线 404 → **75.3 秒**变 200 |
| B 已有内容更新 | 页面已可见后改标题 A→B，轮询新标题 | **76 秒**变 B |

**订正两条：**

1. **上表的三层不完整——`memory` 与 `file` 是同一条链上的两个 store，谁都可能挡住更新**。真实链在 `lib/cache/cache_manager.js:214-228`：`redis`（若配 `REDIS_URL`）→ `file`（若 `enableLocalCache`）→ `memory`，读时按链依次问、第一个可用值即返回。
2. **「等了约 10 分钟、`memory_cache.js:4` 那条 10 分钟过期」这个说法不成立**，本文件旧版与 J2 草稿都写过，已删。理由两条，都能从代码读出来：
   - `isProd` 的定义是 `VERCEL_ENV === 'production' || EXPORT`（`conf/dev.config.js:21`）。本站是 Docker 自托管（`Dockerfile` 里 `CMD ["node","server.js"]`），两个条件都不成立 → **`isProd` 为 false** → `memory_cache.js:4` 走的是 `120 * 60` 那条分支，**是 120 分钟，不是 10 分钟**。
   - 同时 `ENABLE_CACHE` 在运行时解析为 false（`process.env.ENABLE_CACHE` 未设、`npm_lifecycle_event` 不是 build/export、`NODE_ENV` 是 production 而非 development，见 `conf/dev.config.js:16-19`），而 `cacheReadsEnabled()` 在 `force` 为假时直接返回它（`lib/cache/cache_manager.js:28-45`）→ **运行时读缓存整体关闭**。这也解释了为什么 75/76 秒这种量级能出现：若 120 分钟的 memory 缓存真的在挡，改标题绝不会 76 秒可见。

**那 75/76 秒是什么？** 落在 `NEXT_REVALIDATE_SECOND`（默认 60 秒）的 ISR 下一次访问重建窗口里，加上轮询间隔造成的量化误差。**注意：这是观测值，不是对内部时序的证明**——本次实验只能确定「端到端可见延时 ≈ 75 秒」，没有单独证明每一毫秒花在哪一层。

**一条容易误判的观测**：`x-nextjs-cache` 响应头在 **404 与 200 上都会是 `HIT`**（实测：从未被请求过的随机 slug 首次访问即返回 `404` + `x-nextjs-cache: HIT`）。所以**不能拿「有 HIT」推断「这个路径被缓存过」**，它只是 ISR 层的一个命中标记。

**没回答的**：若线上配了 `REDIS_URL`（Redis TTL = `NEXT_REVALIDATE_SECOND × 1.5`，`lib/cache/redis_cache.js:6`），链路会多一层、延时可能不同。本次没有登录服务器确认线上环境变量，**所以上面所有数字都只对「当前这台、按现有 `.env`」成立**。

## 五、更新后「看不到变化」的判层顺序

按这条顺序从上往下走，先证明是哪一层，再动手：

1. **Notion 侧改了吗**：确认改的是**已发布**（`status=Published`）的页面，改的是被列表取到的库（`blog.config.js:9 NOTION_PAGE_ID`）。没发布/移出库，后续全都不用查。
2. **ISR 到期了吗**：**先等到 60 秒以上再判**。2026-10-20 实测：新页从发布到 200 是 75 秒，改已有页标题到新标题可见是 76 秒（见 4.1）。所以「发完立刻刷还是旧的」是预期行为，不是故障；等 90 秒左右再刷一次再下结论。要立刻生效就走 `POST /api/revalidate` 带 `Authorization: Bearer <REVALIDATION_TOKEN>` 刷单页；批量用 `{"paths": [...]}`。
3. **本地文件缓存陈旧吗**：`all: true` 会清缓存并重建首页，看新内容是否出现。
4. **本次访问命中的是新页面吗**：ISR 是「下一次访问才重建」，多刷一两次；对 React 流式输出，curl 剥 script 后看不到正文、**连 `<title>` 都在初始 HTML 里没有**（2026-10-20 实测：`curl ... | grep '<title>'` 对一篇正常文章返回空），**必须用无头浏览器取 DOM**。
5. **页面根本没重建吗**：**不用登服务器，读线上 `buildId` 就够**。抓任意页面 HTML 里的 `"buildId":"…"`，部署换版它会变。
   ```bash
   curl -s --compressed http://<host>/archive | grep -o '"buildId":"[^"]*"' | head -1
   ```
   2026-10-20 实测：`ca670b98` 推送后约 17 分钟，`buildId` 从 `ycYGHciu…` 变为 `OfzfEHhk…`，与容器换版同步。比「看构建日志/容器启动时间」省一次登录；**但它是间接判据**——构建成功但容器没重启时它不会变，那种情况仍需查服务器。
6. **配置层顺序问题**：如果变化是配置类（开关、文案），回第二节查它是不是「服务端专属名单」里的键；主题私有键再确认是不是 THEME_CONFIG 时差（第三节 3.3）。**Notion 配置中心那张表的「启用」列是 checkbox，代码却比较字符串 `'Yes'`**（`lib/db/notion/getNotionConfig.js:164`）——勾选恰好能通过（`getTextContent` 对勾选值返回 `"Yes"`），但**填文本 `Yes`、留空、或勾选后又改类型都会静默失效**，配完必须回读证明确实进了 `NOTION_CONFIG`。

## 六、四类失败的分层判定

| 失败类型 | 现象 | 判定方法 | 归属 |
|---|---|---|---|
| Notion 读取失败 | 页面空、数据缺、console 有 `[Notion配置]` 三档提示 | 看构建/运行日志的 warn；`getConfigMapFromConfigPage` 返回 null 时站点无通知地降级 | 数据源/网络 |
| 缓存未刷新 | 内容存在但页面是旧的 | 第五节 2–4 步；**先等满 90 秒再说**（实测 75–76 秒是正常延时） | 缓存策略 |
| 构建失败 | 部署红/容器没换 | 第五节第 5 步的 `buildId` 探针；变了说明换过版，没变再查构建日志 | CI/构建 |
| 页面渲染异常 | 数据在但页面不显示/报错 | React 错误、hydration 报错 | 前端 |

**判定优先级从下往上排**：先确认渲染有没有报错（最快），再确认数据层是否拿到（构建日志/取数接口），最后才是缓存与部署。反过来从部署往下查会浪费时间。

## 七、本文件没回答的

- 「哪个配置键有哪些有效值」——那是用户手册范畴，见 `docs/user-guide/config-*.md`。
- 线上环境变量实际取值——本文只说明优先级，不声称知道线上 `.env` 的值。
