const CONFIG = {
  // 站名用 Marker 层手写体，副标题用 Stamp 层等宽
  JOURNAL_TITLE: process.env.NEXT_PUBLIC_JOURNAL_TITLE || '纸间手账',
  JOURNAL_SUBTITLE:
    process.env.NEXT_PUBLIC_JOURNAL_SUBTITLE || 'A HAND-MADE BLOG',

  // 首页「最近在写」蓝色圆珠笔便条
  JOURNAL_RECENT_NOTE:
    process.env.NEXT_PUBLIC_JOURNAL_RECENT_NOTE || '最近在写这些——',
  JOURNAL_INDEX_POST_COUNT: 5,
  JOURNAL_FEATURED_LABEL: '精选',

  // 状态编码（胶带/图钉是语法，规格见 design-system/journal/MASTER.md「状态编码」节）
  JOURNAL_STATE_ENCODING: true,
  JOURNAL_FEATURED_TAG:
    process.env.NEXT_PUBLIC_JOURNAL_FEATURED_TAG || 'featured',
  // 发表后隔几天再改才算「修订」：Notion 的 last_edited_time 动一下标点都会变
  JOURNAL_REVISED_DAYS: 7,

  // 一天一摊（同一天多篇合成一张跨页，规格见 MASTER「一天一摊」节）
  JOURNAL_DAY_SPREAD: true,
  // 封顶只作用于首页；归档是全集，不折叠
  JOURNAL_DAY_SPREAD_MAX: 3,
  JOURNAL_DAY_MORE: '这天还有',

  // 纸会老（材质层：只淡墨不换色，规格见 MASTER「纸会老」节）
  JOURNAL_PAPER_AGE: true,
  // 三档：≤180 天不加类、≤730 天淡邮戳、更久再淡墨边
  JOURNAL_AGE_MID_DAYS: 180,
  JOURNAL_AGE_OLD_DAYS: 730,

  // 上次落笔：扉页写全本站最大发表日，挂载后再补「停笔 N 天」
  JOURNAL_LAST_STROKE: true,
  // 页码：只印在拿得到全量文章的首页纸条与归档行上，规格见 MASTER「页码」节
  JOURNAL_PAGE_NUMBERS: true,
  // 落笔格：归档右栏的一年日期点阵
  JOURNAL_WRITING_GRID: true,
  JOURNAL_GRID_TITLE: '落笔格',

  // 往年的今天：日期取自读者的浏览器，所以只在挂载后出现（规格见 MASTER「往年的今天」节）
  JOURNAL_ON_THIS_DAY: true,
  JOURNAL_ON_THIS_DAY_COUNT: 3,
  JOURNAL_ECHO_TITLE: '往年的今天',

  // 连载语法：标签前缀约定，规格见 MASTER「连载语法」节
  // 前缀之后的那截就是连载名，例如标签「连载:手账入门」→ 连载名「手账入门」
  JOURNAL_SERIES_PREFIX: '连载:',
  JOURNAL_SERIES_LABEL: '连载',
  JOURNAL_SERIES_TITLE: '连载',
  // 一话不成辑：清单要等第二篇才出现，第一话只当普通标签
  JOURNAL_SERIES_MIN: 2,

  // 年刊 /year/[year]：把一年印成一册，一月开一页（规格见 MASTER「年刊」节）
  JOURNAL_YEARBOOK: true,
  JOURNAL_YEARBOOK_LABEL: '年刊',

  // 图例页 /legend：本子自己写的说明书。默认不进顶栏，入口在归档右栏
  JOURNAL_NAV_LEGEND: false,
  JOURNAL_LEGEND_TITLE: '图例',
  JOURNAL_LEGEND_SUBTITLE: '这些胶带、图钉、红圈各是什么意思',

  // 读者的铅笔痕：进度只存在读者自己的浏览器里，规格见 MASTER「书签」「读完」两节
  JOURNAL_READING_BOOKMARK: true,
  // 点开就走不该留痕；低于这个百分点不记
  JOURNAL_READ_MIN_PCT: 3,
  // 读者的历史不该无限长，按最近使用淘汰
  JOURNAL_READ_KEEP: 200,
  JOURNAL_READ_DONE_CHECK: true,
  // 到门槛才算读完——判据只写在 reading.js 的 isRead 里
  JOURNAL_READ_DONE_PCT: 97,

  // 导航（胶带纸条）
  JOURNAL_NAV_ARCHIVE: true,
  JOURNAL_NAV_CATEGORY: true,
  JOURNAL_NAV_TAG: true,
  JOURNAL_NAV_SEARCH: true,
  JOURNAL_NAV_PLOG: true,

  // 首页右栏便利贴「关于我」；头像走 BLOG.AUTHOR_AVATAR
  JOURNAL_ABOUT_TITLE: '关于我',
  JOURNAL_ABOUT_TEXT:
    process.env.NEXT_PUBLIC_JOURNAL_ABOUT_TEXT ||
    '把读过的、踩过的、想明白的，一页一页贴在这里。',
  JOURNAL_ABOUT_LINK_TEXT: '看看关于页 →',

  // 文章页
  JOURNAL_SHOW_TOC: true,
  JOURNAL_SHOW_READING_PROGRESS: true,
  JOURNAL_TOC_TITLE: '这一页的目录',
  // OG 卡接线（B 案：主题内第二枚 og:image，规格见 MASTER「接线决定」节）
  JOURNAL_OG_CARD: true,
  // 分享卡三型（横卡 / 故事卡 / 剪报卡，规格见 MASTER「分享卡三型」节）
  JOURNAL_SHARE_CARDS: true,
  // 剪报引文上限：超出截成省略号，卡片版式装不下的字不该硬塞
  JOURNAL_CARD_QUOTE_MAX: 160,

  // 分享（主题内自绘的纯文字手绘链接；总开关仍走站点 POST_SHARE_BAR_ENABLE）
  JOURNAL_SHARE_BAR: true,
  JOURNAL_SHARE_TITLE: '分享',
  JOURNAL_SHARE_SERVICES: 'link,weibo,twitter,email',

  // plog 照片墙：数据源是带 JOURNAL_PLOG_TAG 标签的文章，一篇一张拍立得
  JOURNAL_PLOG_TITLE: 'plog',
  JOURNAL_PLOG_SUBTITLE: '照片不修，话也不说长',
  JOURNAL_PLOG_TAG: process.env.NEXT_PUBLIC_JOURNAL_PLOG_TAG || 'plog',
  JOURNAL_PLOG_COUNT: 30,
  JOURNAL_PLOG_RULE_TITLE: 'plog 规则',
  JOURNAL_PLOG_RULE_TEXT:
    process.env.NEXT_PUBLIC_JOURNAL_PLOG_RULE ||
    '每月一页，贴满为止。一句话就够，不要写成长文。',
  JOURNAL_PLOG_FOOTER: '每月一页，贴满为止',

  // 归档 / 分类 / 标签
  JOURNAL_ARCHIVE_TITLE: '归档',
  JOURNAL_ARCHIVE_SUBTITLE: '按时间把纸堆起来',
  JOURNAL_CATEGORY_TITLE: '分类',
  JOURNAL_CATEGORY_SUBTITLE: '抽屉里各装了什么',
  JOURNAL_TAG_TITLE: '标签',
  JOURNAL_TAG_SUBTITLE: '随手贴的贴纸',

  // 搜索
  JOURNAL_SEARCH_PLACEHOLDER: '写点什么进去找找',
  JOURNAL_SEARCH_EMPTY: '没找到？试试更短的词',
  JOURNAL_SEARCH_HINT_TITLE: '搜索建议',

  // 列表页
  JOURNAL_POSTLIST_BACK: '全部',

  // 404 / 500 同骨架
  JOURNAL_404_HEADLINE: '这一页被我撕掉了。',
  JOURNAL_404_TEXT:
    '链接可能已经失效，或者它从来就没被写出来。下面的纸都还在。',

  // 页脚：未画满的墨线 + 一句红字批注
  JOURNAL_FOOTER_NOTE: '这一页还没画完',

  // 牛皮纸夜间变体（不是第二主题，仅降饱和 + 换纸色）
  JOURNAL_KRAFT_NIGHT: true
}

export default CONFIG
