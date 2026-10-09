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
