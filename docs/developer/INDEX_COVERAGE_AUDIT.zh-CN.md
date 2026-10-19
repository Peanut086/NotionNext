# 收录资格与内容边界核验（P2 · 第一份，2026-10-19）

P2 的三个核验点：**sitemap 两份产物**、**各页面收录资格**、**草稿/加密页的泄漏边界**。
结论按「已实测」与「读代码推断」分列，混合会骗人。

## 一、两份 sitemap 产物对不上

| 产物 | 生成方式 | 实测结果 |
|---|---|---|
| 动态 `pages/sitemap.xml.js` | `getServerSideProps` 每次请求现算（[pages/sitemap.xml.js:14](file:///E:/PnutCode/NotionNext/pages/sitemap.xml.js#L14)） | 线上实测 **23 条 URL**（见下） |
| 静态 `public/sitemap.xml` | 构建期 `generateSitemapXml` 落盘（[lib/utils/sitemap.xml.js:13](file:///E:/PnutCode/NotionNext/lib/utils/sitemap.xml.js#L13)），由 `pages/index.js:117` 在 build 时调用 | **只含 4 个固定页 + 全部 allPages**（默认首页/归档/分类/标签 + 每篇），不含动态版多的 rss 与 search |

两份的「默认页清单」也不一样：动态版多列了 `search` 和 `rss/feed.xml`（[pages/sitemap.xml.js:78-97](file:///E:/PnutCode/NotionNext/pages/sitemap.xml.js#L78)），静态版 `priority` 各不相同（首页/归档给 1.0，其余默认）。**同一站点存在两份不同内容、不同 URL 集合的 sitemap，谁被爬虫读到哪里没有保证**——这是本次核验最硬的一个事实。

`next-sitemap.config.js` 虽然配了，但 `post-build` 跑它只是「通常没啥用」（配置文件自己的注释）：动态版已经接管了 `/sitemap.xml` 这个路径，静态产物只影响静态托管场景。

## 二、动态 sitemap 线上实测：新路由全不在内

线上 `http://43.228.76.114:3000/sitemap.xml` 抓取得到 23 条（`<loc>` 去重后）：

```
/、/about、/archive、/category、/links、/search、/tag
+ /article/× 10
```

不在内的（均已上线且可访问的路由）：`/legend`、`/plog`、`/series`、`/series/[name]`、`/year/[year]`、`/tag/[tag]`、`/category/[category]`、分页 `page/[page]`、`/page/[page]`。

原因在代码里写死了：默认字段只有 6 个硬编码 slug（[pages/sitemap.xml.js:51-107](file:///E:/PnutCode/NotionNext/pages/sitemap.xml.js#L51)），文章字段只遍历 `allPages` 里 `status=Published` 的（[pages/sitemap.xml.js:112](file:///E:/PnutCode/NotionNext/pages/sitemap.xml.js#L112)）。**没有一处枚举过主题新增的路由**——这不是配置疏漏，是从未接线。

对规划的影响：P2 说的「为文章、连载册、年刊、照片墙、图例、搜索结果及空态分别确定索引资格」目前**全都未定**——新路由既没被显式排除，也没被收录。

另外两个线上实测事实：

- **域名分裂**：sitemap 里所有 URL 是 `http://peanut.icu/...`，而 canonical/og:url 同样是它——该域名 NXDOMAIN（已登记搁置事项）。即这份 sitemap 的 `<loc>` 全部指向无法解析的域名。
- **`/about` 出现两次**：静态单页同时在默认字段和文章遍历里各生一份，`getUniqueFields` 按 loc 去重（[pages/sitemap.xml.js:135](file:///E:/PnutCode/NotionNext/pages/sitemap.xml.js#L135)）——实测两次 loc 相同但 lastmod 不同，去重键是 loc **且**后者 lastmod 更大才会覆盖，重复 loc 仍会各留一条。23 条里 `/about`、`/archive`、`/category`、`/search`、`/tag`、`/` 都是两份（默认字段 + allPages 遍历各一次，`/about`、`/links` 这类单页的 slug 也在 allPages 里）。

## 三、草稿与加密页的边界

### 3.1 草稿（非 Published）

- 列表/取数层就滤掉：`allPages` 只留 `slug && (status==='Published' || status==='Invisible')`（[lib/db/SiteDataApi.js:605-608](file:///E:/PnutCode/NotionNext/lib/db/SiteDataApi.js#L605)）。**草稿（既非 Published 也非 Invisible）不进 props**，因此不进列表、不进 sitemap、不进 RSS。
- `Invisible`（隐藏发布）**是**一个真实风险面：它不显示在列表（列表页多数再按 `status===Published` 过滤），但**能被 sitemap 收录**——动态 sitemap 明确只收 `status_publish`（[pages/sitemap.xml.js:112](file:///E:/PnutCode/NotionNext/pages/sitemap.xml.js#L112)），静态 sitemap 不过滤状态（[lib/utils/sitemap.xml.js:41](file:///E:/PnutCode/NotionNext/lib/utils/sitemap.xml.js#L41) 直接遍历全部 allPages）。两份行为不一致。

### 3.2 加密页（实测）

实测 `/article/npmpackage`（线上确为加密页，`isLocked` 判据命中）：

| 项目 | 结果 |
|---|---|
| 正文 Notion 块 | **不下发**。去掉 `<style>` 后统计 `class="…notion-text…"` 元素 = **0**（对比未加密的 `online-tools` = 1、`themeBlockSamples` = 18） |
| 页面标题 | 泄漏：`og:title` 完整（「前端常用npm包收录 \| JavaScript大王」） |
| 摘要 | 泄漏：`<meta name="description">` 与 `og:description` 是完整摘要 |
| canonical / sitemap | 泄漏且**被收录**：canonical `http://peanut.icu/article/npmpackage` 在 sitemap 23 条里 |
| 口令校验位置 | 客户端。服务端 props 里全文在手，口令只是渲染层的门 |

**结论：加密页的「保密」是界面级别的**——标题、摘要、URL 全公开，正文块确实没进 HTML（这一点比很多同类实现干净），但口令校验在客户端，任何人看源码/page source 都能拿到正文数据本身之外的一切元信息。**不要把密码页当服务端保密**：它的语义是「挡随手点开的人」。

### 3.3 口令本身在哪校验

`isLocked(post) = !!post?.password`（[themes/journal/index.js:68](file:///E:/PnutCode/NotionNext/themes/journal/index.js#L68)），journal 只在文章页画一枚「加密」红字标（[themes/journal/index.js:666](file:///E:/PnutCode/NotionNext/themes/journal/index.js#L666)）；真正的口令表单在共享层 `NotionPage` 那条链上，`components/NotionPage.js` 本地不持有口令状态。**组件层的口令判定不在 journal 主题内**，若要做「服务端保密」需动共享层，影响所有主题——这已超出本轮范围，先登记。

## 四、给 P2 后续的判定

按「先验证问题再动手」的原则，P2 剩下能落地的三件，都已有实测支撑：

1. **sitemap 收录资格**：需要先定策略（哪些路由该进），再改 `pages/sitemap.xml.js` 的默认字段与一个「主题路由表」。注意改的是动态版；静态版与它长期不一致这件事要一并裁决（合并 or 明确只保留一个）。
2. **重复 loc**：`getUniqueFields` 的覆盖条件是 `lastmod` 更大（[pages/sitemap.xml.js:141](file:///E:/PnutCode/NotionNext/pages/sitemap.xml.js#L141)），而 allPages 遍历用的 `publishDay` 与默认字段用的「今天」在同时刻比较时后者永不为大 → 去重实际靠 Map 的插入序，重复条目仍输出。false positive 级问题：一份 sitemap 里同 URL 出现多条。
3. **加密页元信息泄漏**：可选择在 SEO meta 层（`components/SEO.js` 或主题）对 `isLocked` 的页去掉 title/description。但**正文已确认不泄漏**，所以这是「降噪」不是「堵漏」——优先级低于前两项，是否要做由站长定。

未验证项（下次动手前先测，别当已知）：静态导出的 `public/sitemap.xml` 内容本次未跑 `yarn export` 实测，以上只从代码读；空态页（`/year/2099`、不成辑的 `/series/[name]`）的收录资格未定。
