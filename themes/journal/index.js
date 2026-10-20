import NotionIcon from '@/components/NotionIcon'
import NotionPage from '@/components/NotionPage'
import replaceSearchResult from '@/components/Mark'
import SmartLink from '@/components/SmartLink'
import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isBrowser } from '@/lib/utils'
import { formatDateFmt } from '@/lib/utils/formatDate'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { uuidToId } from 'notion-utils'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import CONFIG from './config'
import { clampQuote } from './og-card'
import { isRead, pctOf, useProgressRecord, useReadMarks } from './reading'
import { Style } from './style'

const Comment = dynamic(() => import('@/components/Comment'), { ssr: false })
const AISummary = dynamic(() => import('@/components/AISummary'), {
  ssr: false
})
const ArticleLock = dynamic(
  () => import('@/themes/simple/components/ArticleLock'),
  { ssr: false }
)
const RecommendPosts = dynamic(
  () => import('@/themes/simple/components/RecommendPosts'),
  { ssr: false }
)

/* ------------------------------------------------------------------ *
 * 数据小工具
 * ------------------------------------------------------------------ */

const postDate = post =>
  post?.date?.start_date ||
  (post?.publishDate ? formatDateFmt(post.publishDate, 'yyyy-MM-dd') : '') ||
  post?.createdTime ||
  ''

/** 邮戳文本：09.28 */
const stampMD = post => {
  const raw = postDate(post)
  if (!raw) return '--.--'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw.slice(5, 10).replace('-', '.')
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')}`
}

/** 邮戳年份：2026 */
const stampYear = post => {
  const raw = postDate(post)
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? '未日期' : String(d.getFullYear())
}

const postHref = post => {
  if (!post) return '/'
  if (post.href) return post.href
  if (post.slug) return `/${post.slug}`
  return `/${post.id}`
}

const isLocked = post => !!post?.password

/**
 * 分享卡 URL 的唯一守卫（规格见 MASTER「分享卡三型」节）。
 * 静态导出没有 pages/api，/api/og 会 404；LINK 不是绝对 http(s) 时拼不出可信地址。
 * 两种情况都返回 null：og:image 落回 SEO.js 现状值，分享行整项不出现。
 */
const cardUrl = (post, params = {}) => {
  if (process.env.EXPORT === 'true') return null
  if (!post?.title) return null
  const base = (siteConfig('LINK', '') || '').trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(base)) return null

  const q = new URLSearchParams({ title: post.title })
  const date = dayKey(postDate(post))
  if (date) q.set('date', date)
  if (post.category) q.set('category', post.category)
  const states = stateMarks(post).map(m => m.key)
  if (states.length) q.set('state', states.join(','))
  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === undefined || value === null) return
    q.set(key, String(value))
  })
  return `${base}/api/og?${q.toString()}`
}

/**
 * 横卡 = og 元数据（B 案接线，规格见 MASTER「接线决定」节）
 */
const ogImageUrl = (post, localeTag) => {
  if (!j('JOURNAL_OG_CARD', true)) return null
  return cardUrl(post, { locale: localeTag })
}

const j = (key, fallback) => siteConfig(key, fallback, CONFIG)

const dayKey = value => {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : formatDateFmt(d, 'yyyy-MM-dd')
}

const DAY_MS = 86400000
const utcDayNumber = ms => Math.floor(ms / DAY_MS)

/**
 * 纸会老（材质层）：只淡墨、不换色。见 design-system/journal/MASTER.md「纸会老」节。
 * 基准日两侧都按 UTC 日编号算，否则服务端与客户端跨午夜会算出不同档位 → className 不一致撞 hydration
 */
const paperAge = key => {
  if (!key || !j('JOURNAL_PAPER_AGE', true)) return ''
  const born = Date.parse(`${key}T00:00:00Z`)
  if (Number.isNaN(born)) return ''
  const ageDays = utcDayNumber(Date.now()) - utcDayNumber(born)
  if (ageDays > Number(j('JOURNAL_AGE_OLD_DAYS', 730))) return 'j-age-2'
  if (ageDays > Number(j('JOURNAL_AGE_MID_DAYS', 180))) return 'j-age-1'
  return ''
}

/* ------------------------------------------------------------------ *
 * 状态编码：胶带/图钉是语法，不是装饰
 * 六档的键序、名字、数据来源全写在 LEGEND_KEYS 这一张表里：stateMarks 按表
 * 判定与取名，图例页按表说明。判定与文档不许各长一份，见 MASTER「状态编码」节
 * ------------------------------------------------------------------ */

const LEGEND_KEYS = [
  {
    key: 'locked',
    name: '加密',
    how: 'Notion 页面设了 password',
    where: '右上角的折角 + 一枚红手绘锁；点进去先要密码'
  },
  {
    key: 'pinned',
    name: '置顶',
    how: '标签命中站点的 TOP_TAG',
    where: '左上角的图钉'
  },
  {
    key: 'featured',
    name: '精选',
    label: ['JOURNAL_FEATURED_LABEL', '精选'],
    how: '标签命中 JOURNAL_FEATURED_TAG',
    where: '整张纸条换成便利贴黄，标题前一颗红星'
  },
  {
    key: 'revised',
    name: '修订',
    how: '发表若干天后回来改过（JOURNAL_REVISED_DAYS 是门槛）',
    where: '左下角补贴一小条胶带；文章页日期行另写「改于 MM.DD」'
  },
  {
    key: 'receipt',
    name: 'plog',
    label: ['JOURNAL_PLOG_TITLE', 'plog'],
    how: '标签命中 JOURNAL_PLOG_TAG',
    where: '纸底一道撕线加齿孔，像一张收据'
  },
  {
    key: 'photo',
    name: '有图',
    how: '文章有封面图，且没有上锁',
    where: '右上角一张迷你拍立得的白边'
  }
]

const markName = item =>
  item.label ? j(item.label[0], item.label[1]) : item.name

/** 修订档的唯一判定：回来改过就返回间隔天数，否则 0。
 *  stateMarks 与文章页的「改于」共用，不许各算一遍 */
const revisedGap = post => {
  const published = dayKey(post?.publishDate || post?.date?.start_date)
  const edited = dayKey(post?.lastEditedDate)
  // 缺任一侧就不判：没有发表日时 Date.parse 差值会大得离谱，等于凭空贴胶带
  if (!published || !edited) return 0
  const gapDays = (Date.parse(edited) - Date.parse(published)) / DAY_MS
  return gapDays >= Number(j('JOURNAL_REVISED_DAYS', 7)) ? gapDays : 0
}

/** 「改于 MM.DD」：与修订档同一道门槛，只出现在文章页的日期行 */
const revisedStamp = post => {
  if (!revisedGap(post)) return ''
  return mdOf(dayKey(post?.lastEditedDate))
}

const stateMarks = post => {
  if (!post || !j('JOURNAL_STATE_ENCODING', true)) return []

  const tags = post?.tags || []
  const topTag = siteConfig('TOP_TAG', '')
  const hits = {
    locked: isLocked(post),
    pinned: !!topTag && tags.includes(topTag),
    featured: tags.includes(j('JOURNAL_FEATURED_TAG', 'featured')),
    revised: revisedGap(post) > 0,
    receipt: tags.includes(j('JOURNAL_PLOG_TAG', 'plog')),
    photo: !isLocked(post) && !!(post?.pageCoverThumbnail || post?.pageCover)
  }

  return (
    LEGEND_KEYS.filter(item => hits[item.key])
      .map(item => ({ key: item.key, label: markName(item) }))
      // 一张纸条最多 3 个标记，超出按表里的顺序截断
      .slice(0, 3)
  )
}

/* ------------------------------------------------------------------ *
 * 连载语法：标签前缀约定
 * 一篇只归一个连载；话数由发表日推得，Notion 里没有「第几话」这个字段
 * 规格见 design-system/journal/MASTER.md「连载语法」节
 * ------------------------------------------------------------------ */

/** 剥前缀只写这一次：连载判据与标签胶囊都问它。前缀为空即整族语法关掉 */
const seriesNameOf = tag => {
  const prefix = j('JOURNAL_SERIES_PREFIX', '连载:')
  if (!prefix || !String(tag || '').startsWith(prefix)) return ''
  return String(tag).slice(prefix.length).trim()
}

/** 一篇只归一个连载：取第一个命中的标签；前缀之后没有字（光一个「连载:」）不算 */
const seriesOf = post => {
  const tag = (post?.tags || []).find(t => seriesNameOf(t))
  if (!tag) return null
  return { tag: String(tag), name: seriesNameOf(tag) }
}

/** 标签胶囊上的写法：把前缀换成「连载 · 名字」，链子仍指向原标签页 */
const tagLabel = tag => {
  const name = seriesNameOf(tag)
  return name ? `${j('JOURNAL_SERIES_LABEL', '连载')} · ${name}` : tag
}

/* ------------------------------------------------------------------ *
 * 一天一摊：同一天发的合成一张跨页
 * 规格见 design-system/journal/MASTER.md「一天一摊」节
 * ------------------------------------------------------------------ */

/* 归档行只带「这一行自己看不看得出来」的三种状态：置顶 / 精选 / plog 的数据源
   是标签，而归档行右端本来就画了第一枚标签的 pill。子集是过滤，不是第二套判定，
   规格见 MASTER「归档行：轻量标记」节 */
const ARCHIVE_MARK_KEYS = ['locked', 'revised', 'photo']

/** 今日命中数：判定仍只有 stateMarks 一处，这里只负责数，含 3 个封顶的截断 */
const markCounts = (posts = []) => {
  const counts = new Map(LEGEND_KEYS.map(item => [item.key, 0]))
  posts.forEach(post =>
    stateMarks(post).forEach(mark =>
      counts.set(mark.key, (counts.get(mark.key) || 0) + 1)
    )
  )
  return counts
}

const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 同天即同一摊：摊序按该天首次出现的位置，摊内保持后端顺序 */
const dayGroups = (posts = []) => {
  const map = new Map()
  posts.forEach(post => {
    const key = dayKey(postDate(post))
    if (!map.has(key)) map.set(key, { key, posts: [] })
    map.get(key).posts.push(post)
  })
  return [...map.values()]
}

const mdOf = key => (key || '').slice(5).replace('-', '.')

const monthOf = key => {
  const d = new Date(key)
  return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1} 月`
}

const weekOf = key => {
  const d = new Date(key)
  return Number.isNaN(d.getTime()) ? '' : WEEK_CN[d.getDay()]
}

/* ------------------------------------------------------------------ *
 * 元信息：上次落笔 / 页码 / 落笔格
 * 三样都只读全量文章，规格见 MASTER 同名三节
 * ------------------------------------------------------------------ */

/** 全本站最大的发表日；'yyyy-MM-dd' 定宽，字典序即时间序 */
const lastStrokeOf = (posts = []) => {
  let max = ''
  posts.forEach(post => {
    const key = dayKey(postDate(post))
    if (key > max) max = key
  })
  return max
}

/** 停笔天数：与「纸会老」同一套 UTC 日编号口径，跨午夜不会差一天 */
const idleDays = key => {
  if (!key) return 0
  const born = Date.parse(`${key}T00:00:00Z`)
  if (Number.isNaN(born)) return 0
  return Math.max(0, utcDayNumber(Date.now()) - utcDayNumber(born))
}

/** 定宽字符串比大小；不用 localeCompare，Node 与浏览器的 ICU 不必同一档 */
const cmp = (a, b) => (a === b ? 0 : a < b ? -1 : 1)

/** 页码：(日期升序, 同日按 slug 字典序)。tiebreak 用 slug 不用后端序——
 *  后端序每编辑一次就漂一遍，而印在纸上的页码一漂就全乱：稳定性优先 */
const pageNumbers = (posts = []) => {
  const dated = posts
    .map(post => ({
      id: post?.id || post?.slug,
      key: dayKey(postDate(post)),
      slug: String(post?.slug || post?.id || '')
    }))
    .filter(item => item.key && item.id)
    .sort((a, b) => (a.key === b.key ? cmp(a.slug, b.slug) : cmp(a.key, b.key)))
  const map = new Map()
  dated.forEach((item, i) => map.set(item.id, i + 1))
  return map
}

/** 落笔格：年 → 月 → 该月各日落了几张。全程字符串切片，不构造 Date——
 *  时区会把日期挪一天 */
const yearGrids = (posts = []) => {
  const byYear = new Map()
  posts.forEach(post => {
    const key = dayKey(postDate(post))
    if (!key) return
    const year = key.slice(0, 4)
    const month = Number(key.slice(5, 7))
    const day = Number(key.slice(8, 10))
    if (!byYear.has(year)) byYear.set(year, new Map())
    const months = byYear.get(year)
    if (!months.has(month)) months.set(month, new Map())
    const days = months.get(month)
    days.set(day, (days.get(day) || 0) + 1)
  })
  return [...byYear.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([month, days]) => ({
          month,
          days: [...days.entries()].sort((a, b) => a[0] - b[0])
        }))
    }))
}

/* ------------------------------------------------------------------ *
 * 手绘涂鸦：全部内联 SVG，不用 emoji、不发图片请求
 * ------------------------------------------------------------------ */

/** 出头的手绘横线 */
const HandRule = ({ red = false, className = '' }) => (
  <svg
    className={`j-rule ${red ? 'j-rule-red' : ''} ${className}`}
    viewBox='0 0 240 14'
    preserveAspectRatio='none'
    aria-hidden='true'
  >
    <path d='M4 9C58 3.6 116 11 168 6.2s44 1.6 68-2.4' />
  </svg>
)

/** 红手绘圈：圈住当前项 */
const RedCircle = ({ label }) => (
  <>
    <svg viewBox='0 0 120 40' preserveAspectRatio='none' aria-hidden='true'>
      <path d='M96 8C74 1 30 2 14 12 2 20 8 33 34 37s68 1 76-9c6-8-2-16-14-18' />
    </svg>
    <span className='relative z-10'>{label}</span>
  </>
)

const Star = ({ className = '' }) => (
  <svg
    className={className}
    viewBox='0 0 24 24'
    width='17'
    height='17'
    aria-hidden='true'
  >
    <path
      d='M12 3.2l2.3 5.2 5.6.5-4.2 3.7 1.2 5.5L12 15.3 7.1 18l1.2-5.5L4.1 8.9l5.6-.5z'
      fill='var(--red)'
      stroke='var(--ink)'
      strokeWidth='1.1'
      strokeLinejoin='round'
    />
  </svg>
)

const ArrowRight = () => (
  <svg viewBox='0 0 30 12' width='28' height='12' aria-hidden='true'>
    <path
      d='M2 6.6C10 4.8 18 5.2 26 5.6m-5.4-3.6C22.6 3.2 24.6 4.6 26.4 5.8c-2 1-4 2.2-5.8 3.4'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.6'
      strokeLinecap='round'
    />
  </svg>
)

const PaperPlane = () => (
  <svg viewBox='0 0 44 30' width='42' height='28' aria-hidden='true'>
    <path
      d='M2 13.4L41 3 27.6 27l-8.4-7.6L2 13.4zm17.2 6l15-11.6'
      fill='none'
      stroke='var(--ink)'
      strokeWidth='1.5'
      strokeLinejoin='round'
    />
  </svg>
)

/** 上/下一篇之间的铅笔连线：两篇俱在时才画，见 MASTER「打包细节」 */
const ThreadLink = () => (
  <svg className='j-thread' viewBox='0 0 56 24' aria-hidden='true'>
    <path className='j-thread-line' d='M2 13c8-8 12 7 20 1s11 3 18-3' />
    <path
      className='j-thread-head'
      d='M36 5.6c3.4 2.6 5.6 5 7 8.4-3.2.6-5.4 1.4-7.6 2.8'
    />
  </svg>
)

const LockDoodle = () => (
  <svg viewBox='0 0 22 26' width='18' height='21' aria-hidden='true'>
    <path
      d='M5 11V8a6 6 0 0111.4 2.6M4 12h14c1 0 1.6.6 1.6 1.6v8.6c0 1-.6 1.6-1.6 1.6H4c-1 0-1.6-.6-1.6-1.6v-8.6C2.4 12.6 3 12 4 12z'
      fill='none'
      stroke='var(--red)'
      strokeWidth='1.6'
      strokeLinecap='round'
    />
  </svg>
)

const Magnifier = () => (
  <svg viewBox='0 0 26 26' width='22' height='22' aria-hidden='true'>
    <path
      d='M11 2.4a8.2 8.2 0 11.4 16.4A8.2 8.2 0 0111 2.4zm6.4 15.2l5.2 5.4'
      fill='none'
      stroke='var(--ink)'
      strokeWidth='1.7'
      strokeLinecap='round'
    />
  </svg>
)

const CameraDoodle = () => (
  <svg viewBox='0 0 40 30' width='38' height='28' aria-hidden='true'>
    <path
      d='M3 9.4h7.6L13 5.6h13.4l2.2 3.8H37c1.2 0 2 .9 1.8 2.1l-1.6 14c-.2 1.2-1.1 2-2.3 2H5.1c-1.2 0-2.1-.8-2.3-2l-1.6-14C1 10.3 1.8 9.4 3 9.4z'
      fill='none'
      stroke='var(--ink)'
      strokeWidth='1.6'
      strokeLinejoin='round'
    />
    <path
      d='M20 12.4a6 6 0 11-.2 12 6 6 0 01.2-12zM30.6 13.4h3.2'
      fill='none'
      stroke='var(--ink)'
      strokeWidth='1.6'
      strokeLinecap='round'
    />
  </svg>
)

const FilmDoodle = () => (
  <svg viewBox='0 0 30 72' width='26' height='64' aria-hidden='true'>
    <path
      d='M4 3h22c1.2 0 2 .9 2 2.1v61.8c0 1.2-.8 2.1-2 2.1H4c-1.2 0-2-.9-2-2.1V5.1C2 3.9 2.8 3 4 3zM2 15h26M2 29h26M2 43h26M2 57h26M8 6v3M8 20v3M8 34v3M8 48v3M8 62v3M22 6v3M22 20v3M22 34v3M22 48v3M22 62v3'
      fill='none'
      stroke='var(--ink)'
      strokeWidth='1.4'
      strokeLinecap='round'
    />
  </svg>
)

/** 没有照片时的单色线稿占位：一座小山 + 一个太阳，不给灰块 */
const PhotoLineArt = () => (
  <svg viewBox='0 0 64 44' width='58' height='40' aria-hidden='true'>
    <path
      d='M6 34c8-2 12-14 20-14s10 14 20 14 8-6 8-6M44 12.6a5.2 5.2 0 11.2 10.4 5.2 5.2 0 01-.2-10.4z'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.6'
      strokeLinecap='round'
    />
  </svg>
)

/** 图钉：置顶的那页是被钉住的 */
const PinDoodle = () => (
  <svg
    className='j-pin-doodle'
    viewBox='0 0 18 22'
    width='21'
    height='26'
    aria-hidden='true'
  >
    <path
      d='M9 13.4l1.1 6.2M4.4 6.6a4.6 4.6 0 119.2 0 4.6 4.6 0 01-9.2 0z'
      fill='none'
      stroke='var(--ink)'
      strokeWidth='1.6'
      strokeLinecap='round'
    />
    <circle
      cx='9'
      cy='6.6'
      r='3'
      fill='var(--red)'
      stroke='var(--ink)'
      strokeWidth='1.4'
    />
  </svg>
)

/** 折叠角：折起来压住的那页，看不见里面写了什么 */
const FoldDoodle = () => (
  <svg
    className='j-fold'
    viewBox='0 0 26 26'
    width='26'
    height='26'
    aria-hidden='true'
  >
    <path
      d='M2.6 1.8h21.6v23.4z'
      fill='var(--tape)'
      stroke='var(--ink)'
      strokeWidth='1.6'
      strokeLinejoin='round'
    />
  </svg>
)

/** 迷你拍立得角标：这页有图 */
const PhotoTab = () => (
  <span className='j-photo-tab' aria-hidden='true'>
    <svg viewBox='0 0 24 18' width='26' height='19'>
      <path
        d='M2.4 13.4c3-.8 4.4-5.4 7.2-5.4s3.6 5.4 7.2 5.4 2.8-2.2 2.8-2.2M16.6 5a2.2 2.2 0 11.1 4.3A2.2 2.2 0 0116.6 5z'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  </span>
)

/* ------------------------------------------------------------------ *
 * 通用纸片
 * ------------------------------------------------------------------ */
/** 页码：Stamp 层的三位补零，只由拿得到全量文章的布局传进来。
 *  ml-auto 把它推到元信息行末尾，即纸条右下角 */
const PageNo = ({ n }) =>
  n ? (
    <span className='j-page-no j-stamp j-soft ml-auto'>
      {`P.${String(n).padStart(3, '0')}`}
    </span>
  ) : null

/** 读者的铅笔勾：--ink-soft 描边的手绘勾，同 to_do 那种不对称收笔 */
const CheckDoodle = () => (
  <svg viewBox='0 0 22 18' width='17' height='14' aria-hidden='true'>
    <path
      d='M2.6 9.4c1.8.6 3.2 1.8 4.2 3.6C9.6 9 13 5.2 18 2.6'
      fill='none'
      stroke='var(--ink-soft)'
      strokeWidth='2'
      strokeLinecap='round'
    />
  </svg>
)

/**
 * 读者留下的铅笔痕。判据全在 reading.js，这里只负责画：
 * 没到门槛写「读到 N%」，到了只留一枚勾——同一件事不给两种说法。
 */
const resumeTo = pct => {
  /* 与 reading.js 记录用的 (top / height) * 100 互为反函数：同一个 height 定义，
     否则「上次读到 62%」跳过去的位置和当初记下的不是同一处 */
  const height = document.documentElement.scrollHeight - window.innerHeight
  if (height <= 0) return
  /* 无障碍红线里「reduce 关掉全部位移」对 JS 滚动同样成立——这一枚章是本主题
     第一处会动的东西，动法不能自己定例外 */
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: (pct / 100) * height,
    behavior: reduce ? 'auto' : 'smooth'
  })
}

const ReadMark = ({ pct = 0, last = false }) => {
  if (!pct) return null
  if (isRead(pct) && j('JOURNAL_READ_DONE_CHECK', true)) {
    return (
      <span className='j-pencil j-stamp flex items-center gap-1 whitespace-nowrap'>
        <CheckDoodle />
        读完
      </span>
    )
  }
  /* 只有文章页抬头那枚是入口：纸条整块已经是 <a>，往里塞第二个行动点是非法 HTML，
     所以列表与归档仍是纯陈述（见「书签」节的互斥规矩） */
  if (last) {
    return (
      <button
        type='button'
        className='j-pencil j-stamp j-resume whitespace-nowrap'
        onClick={() => resumeTo(pct)}
      >
        {`上次读到 ${pct}% →`}
      </button>
    )
  }
  return (
    <span className='j-pencil j-stamp whitespace-nowrap'>{`读到 ${pct}%`}</span>
  )
}

/** 一张胶带纸条式的文章条目；整块可点，标签仍各自可点 */
function PostSlip({
  post,
  compact = false,
  hideDate = false,
  pageNo = 0,
  readPct = 0
}) {
  if (!post) return null
  const tags = post?.tags?.slice(0, 3) || []
  const marks = stateMarks(post)
  const has = key => marks.some(mark => mark.key === key)
  const featured = has('featured')

  return (
    <article
      className={`j-slip j-tape-single block px-5 py-4 md:px-6 md:py-5 ${
        featured ? 'j-featured' : ''
      } ${has('receipt') ? 'j-receipt' : ''} ${paperAge(dayKey(postDate(post)))}`}
    >
      {has('receipt') && <span className='j-teeth' aria-hidden='true' />}
      {has('revised') && <span className='j-tape-bit' aria-hidden='true' />}
      {has('pinned') && (
        <span className='j-pin'>
          <PinDoodle />
        </span>
      )}
      {has('locked') ? <FoldDoodle /> : has('photo') && <PhotoTab />}

      <h2 className='j-hand flex items-start gap-2 text-[21px] md:text-[23px]'>
        {featured && <Star />}
        <SmartLink href={postHref(post)} className='j-stretch'>
          {post?.title}
        </SmartLink>
      </h2>

      {!compact && post?.summary && (
        <p className='j-print j-soft mt-2 line-clamp-2 text-[15px]'>
          {post.summary}
        </p>
      )}

      <div className='relative z-[2] mt-3 flex flex-wrap items-center gap-2'>
        {!hideDate && (
          <span className='j-stamp-date j-stamp'>{stampMD(post)}</span>
        )}
        {marks
          .filter(mark => mark.key !== 'locked')
          .map(mark => (
            <span key={mark.key} className='j-mark j-stamp'>
              {mark.label}
            </span>
          ))}
        {isLocked(post) && (
          <span className='j-hand j-red flex items-center gap-1 text-[15px]'>
            <LockDoodle />
            加密
          </span>
        )}
        {post?.category && (
          <SmartLink
            href={`/category/${encodeURIComponent(post.category)}`}
            className='j-pill'
          >
            {post.category}
          </SmartLink>
        )}
        {tags.map(tag => (
          <SmartLink
            key={tag}
            href={`/tag/${encodeURIComponent(tag)}`}
            className='j-pill j-pill-yellow'
          >
            {tagLabel(tag)}
          </SmartLink>
        ))}
        {/* 四个角已被胶带 / 图钉 / 折角占满，右下角是这张纸唯一的空位 */}
        <ReadMark pct={readPct} />
        <PageNo n={pageNo} />
      </div>
    </article>
  )
}

/** 一摊 = 一张纸；同天多篇摊成跨页，中间一道装订中缝 */
function DaySpread({ group, head, max = 0, render }) {
  const { key, posts } = group
  const capped = max > 0 ? posts.slice(0, max) : posts
  const rest = posts.length - capped.length
  const half = Math.ceil(capped.length / 2)

  const page = items => (
    <div className='j-day-page j-tilt-group'>{items.map(render)}</div>
  )

  return (
    <section
      id={`day-${key}`}
      className={`j-day scroll-mt-24 ${paperAge(key)}`}
    >
      <header className='j-day-head'>
        <span className='j-stamp-date j-day-stamp'>
          {mdOf(key) || '未日期'}
        </span>
        {head}
        {posts.length > 1 && (
          <span className='j-day-count j-stamp'>{posts.length} 张</span>
        )}
      </header>

      {capped.length > 1 ? (
        <div className='j-day-spread'>
          {page(capped.slice(0, half))}
          <span className='j-spine' aria-hidden='true' />
          {page(capped.slice(half))}
        </div>
      ) : (
        page(capped)
      )}

      {rest > 0 && (
        <a className='j-day-more j-print' href={`/archive#day-${key}`}>
          {`${j('JOURNAL_DAY_MORE', '这天还有')} ${rest} 张 →`}
        </a>
      )}
    </section>
  )
}

/** 黄便利贴 */
function StickyNote({ title, children, className = '' }) {
  return (
    <aside className={`j-note relative p-5 ${className}`}>
      {title && <h2 className='j-hand text-[22px]'>{title}</h2>}
      <div className='j-print mt-2 text-[15px] leading-7'>{children}</div>
    </aside>
  )
}

/* ------------------------------------------------------------------ *
 * 顶栏 / 页脚
 * ------------------------------------------------------------------ */

function TopBar(props) {
  const { locale } = useGlobal()
  const router = useRouter()
  const items = [
    { name: locale?.NAV?.INDEX || '首页', href: '/', show: true },
    {
      name: locale?.NAV?.ARCHIVE || j('JOURNAL_ARCHIVE_TITLE', '归档'),
      href: '/archive',
      show: j('JOURNAL_NAV_ARCHIVE', true)
    },
    {
      name: locale?.COMMON?.CATEGORY || '分类',
      href: '/category',
      show: j('JOURNAL_NAV_CATEGORY', true)
    },
    {
      name: locale?.COMMON?.TAGS || '标签',
      href: '/tag',
      show: j('JOURNAL_NAV_TAG', true)
    },
    {
      name: j('JOURNAL_PLOG_TITLE', 'plog'),
      href: '/plog',
      show: j('JOURNAL_NAV_PLOG', true)
    },
    {
      // 默认不进顶栏：入口在归档右栏，胶带导航已经有 6 项
      name: j('JOURNAL_LEGEND_TITLE', '图例'),
      href: '/legend',
      show: j('JOURNAL_NAV_LEGEND', false)
    },
    {
      name: locale?.NAV?.SEARCH || '搜索',
      href: '/search',
      show: j('JOURNAL_NAV_SEARCH', true)
    }
  ].filter(i => i.show)

  const extra =
    (siteConfig('CUSTOM_MENU') ? props.customMenu : props.customNav) || []
  // 自定义导航常与内置项重复（首页 / 搜索），按路径去重
  const navItems = [...items, ...extra].filter(
    (link, index, list) =>
      list.findIndex(
        l => (l.href || '/').split('?')[0] === (link.href || '/').split('?')[0]
      ) === index
  )

  return (
    <header className='j-shell'>
      <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b-2 border-[var(--ink)] pb-3'>
        <SmartLink href='/' className='j-plain flex items-end gap-3'>
          <span className='j-marker text-[38px] leading-none md:text-[46px]'>
            {j('JOURNAL_TITLE', '纸间手账')}
          </span>
          <span className='j-stamp j-soft pb-1'>
            {j('JOURNAL_SUBTITLE', 'A HAND-MADE BLOG')}
          </span>
        </SmartLink>

        <nav
          aria-label={locale?.NAV?.NAVIGATOR || '导航'}
          className='j-tilt-group -mb-[14px] flex flex-wrap items-center gap-1.5'
        >
          {navItems.map(link => {
            const path = (link.href || '/').split('?')[0]
            const active = router.asPath.split('?')[0] === path
            return (
              <SmartLink
                key={`${link.name}-${link.href}`}
                href={link.href || '/'}
                className={`j-slip j-slip-alt j-hand px-3 py-1.5 text-[17px] md:px-4 ${
                  active ? 'j-circle' : ''
                }`}
                {...(active ? { 'aria-current': 'page' } : {})}
              >
                {active ? (
                  <RedCircle label={link.name} />
                ) : (
                  <span className='relative z-10'>{link.name}</span>
                )}
              </SmartLink>
            )
          })}
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  const thisYear = new Date().getFullYear()
  // SINCE 可能是 '2024-05-12' 这样的日期串，只取四位年份
  const sinceYear =
    Number(String(siteConfig('SINCE') ?? '').match(/\d{4}/)?.[0]) || thisYear
  const years = Math.max(1, thisYear - sinceYear + 1)
  return (
    <footer className='j-shell mt-16 pb-12'>
      <div className='j-footer-rule' aria-hidden='true' />
      <div className='mt-4 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <span className='j-hand j-red text-[17px]'>
            {j('JOURNAL_FOOTER_NOTE', '这一页还没画完')}
          </span>
          <div className='j-stamp j-soft mt-1'>
            © {sinceYear === thisYear ? thisYear : `${sinceYear} – ${thisYear}`}{' '}
            · 第 {years} 年 · {j('JOURNAL_TITLE', '纸间手账')}
          </div>
        </div>
        <PaperPlane />
      </div>
    </footer>
  )
}

/** 顶部红色马克笔进度条 */
function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const top = window.scrollY || document.documentElement.scrollTop
      const height =
        document.documentElement.scrollHeight - window.innerHeight || 1
      setProgress(Math.min(100, Math.max(0, (top / height) * 100)))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div
      className='j-progress'
      style={{ '--j-progress': `${progress}%` }}
      aria-hidden='true'
    />
  )
}

/* ------------------------------------------------------------------ *
 * 布局
 * ------------------------------------------------------------------ */

function LayoutBase(props) {
  const { children } = props
  const { isDarkMode } = useGlobal()
  const night = j('JOURNAL_KRAFT_NIGHT', true) && isDarkMode

  return (
    <div
      id='theme-journal'
      className={`${night ? 'j-night' : ''} ${siteConfig(
        'FONT_STYLE',
        ''
      )} min-h-screen`}
    >
      <Head>
        {/* 子集 woff2 只在本主题渲染时预载，避免其它主题白下载 1.6MB */}
        <link
          rel='preload'
          href='/fonts/LXGWWenKai-Medium.subset.woff2'
          as='font'
          type='font/woff2'
          crossOrigin='anonymous'
        />
      </Head>
      <Style />
      {j('JOURNAL_SHOW_READING_PROGRESS', true) && <ReadingProgress />}
      <TopBar {...props} />
      {children}
      <Footer />
    </div>
  )
}

/** 首页大抬头：手写站名 + 出头下划线 + 上次落笔 */
function Masthead({ lastStroke = '' }) {
  const description = siteConfig('BLOG_DESCRIPTION')
  const showStroke = lastStroke && j('JOURNAL_LAST_STROKE', true)
  // 天数只在挂载后补：首帧服务端与客户端逐字符相同，否则撞 hydration。
  // 无 JS 与打印态那行日期照样在，这是渐进增强不是降级
  const [idle, setIdle] = useState(null)
  useEffect(() => {
    if (!showStroke) return
    setIdle(idleDays(lastStroke))
  }, [showStroke, lastStroke])

  return (
    <section className='j-masthead'>
      <h1 className='j-marker max-w-[16ch] text-[52px] leading-[1.05] md:text-[68px]'>
        {j('JOURNAL_TITLE', '纸间手账')}
      </h1>
      <div className='max-w-[46ch]'>
        <HandRule />
      </div>
      {description && (
        <p className='j-print j-soft mt-3 max-w-[46ch] text-[16px]'>
          {description}
        </p>
      )}
      {showStroke && (
        <p className='j-stamp j-soft mt-2'>
          {`上次落笔 ${lastStroke.replace(/-/g, '.')}`}
          {idle > 0 ? ` · 停笔 ${idle} 天` : ''}
        </p>
      )}
    </section>
  )
}

/** 蓝色圆珠笔手写便条 */
function BallpointNote({ children }) {
  return (
    <p className='j-hand j-blue text-[22px] leading-snug md:text-[25px]'>
      {children}
    </p>
  )
}

function AboutSticker() {
  return (
    <StickyNote title={j('JOURNAL_ABOUT_TITLE', '关于我')}>
      <p>{j('JOURNAL_ABOUT_TEXT', '')}</p>
      <div className='j-hand mt-4 flex flex-wrap items-center gap-4 text-[17px]'>
        <SmartLink href='/about' className='inline-flex items-center gap-1'>
          {j('JOURNAL_ABOUT_LINK_TEXT', '看看关于页 →')}
        </SmartLink>
        {siteConfig('EMAIL') && (
          <SmartLink href={`mailto:${siteConfig('EMAIL')}`}>写信</SmartLink>
        )}
      </div>
    </StickyNote>
  )
}

function LayoutIndex(props) {
  const { posts = [] } = props
  const { locale } = useGlobal()
  const count = Number(j('JOURNAL_INDEX_POST_COUNT', 5))
  const recent = posts.slice(0, count)
  const noteText = j('JOURNAL_RECENT_NOTE', '最近在写这些——')
  const groupDays = j('JOURNAL_DAY_SPREAD', true)
  const maxPerDay = Number(j('JOURNAL_DAY_SPREAD_MAX', 3))
  // 每次渲染现算，不许模块级缓存：SSR 下模块是跨请求共享的
  const numbers = useMemo(
    () => (j('JOURNAL_PAGE_NUMBERS', true) ? pageNumbers(posts) : new Map()),
    [posts]
  )
  const lastStroke = useMemo(() => lastStrokeOf(posts), [posts])
  const readMarks = useReadMarks()

  const renderSlip = post => (
    <PostSlip
      key={post?.id || post?.slug}
      post={post}
      hideDate={groupDays}
      pageNo={numbers.get(post?.id || post?.slug)}
      readPct={pctOf(readMarks, post)}
    />
  )

  return (
    <main className='j-shell'>
      <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]'>
        <div>
          <Masthead lastStroke={lastStroke} />
          <section className='j-section' aria-label={noteText}>
            <BallpointNote>{noteText}</BallpointNote>
            {groupDays ? (
              <div className='j-days mt-6'>
                {dayGroups(recent).map(group => (
                  <DaySpread
                    key={group.key}
                    group={group}
                    max={maxPerDay}
                    render={renderSlip}
                    head={
                      <>
                        <span className='j-stamp j-soft'>
                          {(group.key || '').slice(0, 4)}
                        </span>
                        <span className='j-day-week j-hand j-blue'>
                          {weekOf(group.key)}
                        </span>
                      </>
                    }
                  />
                ))}
              </div>
            ) : (
              <div className='j-tilt-group mt-6 grid gap-7'>
                {recent.map(renderSlip)}
              </div>
            )}
          </section>
        </div>

        <div className='j-tilt-slow grid content-start gap-7 py-10'>
          <AboutSticker />
          <StickyNote title={locale?.COMMON?.TAGS || '标签'}>
            <TagCloudStickers tagOptions={props.tagOptions} limit={12} />
          </StickyNote>
        </div>
      </div>
    </main>
  )
}

/** 贴纸式标签云：尺寸按篇数分档 */
function TagCloudStickers({ tagOptions = [], limit = 30, selected }) {
  const counts = tagOptions.map(t => t.count || 1)
  const max = Math.max(...counts, 1)
  const min = Math.min(...counts, 1)

  return (
    <div className='j-tilt-group flex flex-wrap items-end gap-3'>
      {tagOptions.slice(0, limit).map(tag => {
        const ratio = ((tag.count || 1) - min) / (max - min || 1)
        const size = 15 + Math.round(ratio * 11)
        const active = selected === tag.name
        // 链子与 key 用标签原名（那才是路由参数），只有纸上的字走「连载 · 名字」
        const label = tagLabel(tag.name)
        return (
          <SmartLink
            key={tag.name}
            href={`/tag/${encodeURIComponent(tag.name)}`}
            className={`j-slip j-hand px-3 py-1.5 ${
              active ? 'j-circle' : ''
            } ${tag.count > max * 0.7 ? 'j-pill-yellow' : ''}`}
            style={{ fontSize: `${size}px` }}
          >
            {active ? <RedCircle label={label} /> : label}
            {tag.count && (
              <span className='j-stamp j-soft ml-1.5 text-[12px]'>
                · {tag.count}
              </span>
            )}
          </SmartLink>
        )
      })}
    </div>
  )
}

/** 胶带小方块分页 */
function TapePagination({ page, totalPage }) {
  const router = useRouter()
  const current = Number(page) || 1
  const total = Number(totalPage) || 1
  const prefix = router.asPath
    .split('?')[0]
    .replace(/\/page\/[1-9]\d*/, '')
    .replace(/\/$/, '')
  const hrefOf = n => (n <= 1 ? `${prefix}/` : `${prefix}/page/${n}`)

  if (total <= 1) return null

  // 只展示当前页附近的小方块，避免几十页时贴满一整排胶带
  const first = Math.max(1, Math.min(current - 2, total - 4))
  const pages = []
  for (let n = first; n < first + 5 && n <= total; n++) pages.push(n)

  return (
    <nav
      className='j-tilt-group mt-10 flex flex-wrap items-center gap-3'
      aria-label='分页'
    >
      <span className='j-hand j-soft text-[16px]'>
        第 {current} / {total} 页
      </span>
      {pages.map(n => {
        const active = n === current
        return (
          <SmartLink
            key={n}
            href={hrefOf(n)}
            className={`j-slip j-slip-alt j-stamp grid h-11 w-11 place-items-center ${
              active ? 'j-circle' : ''
            }`}
            {...(active ? { 'aria-current': 'page' } : {})}
          >
            {active ? <RedCircle label={n} /> : n}
          </SmartLink>
        )
      })}
    </nav>
  )
}

function ListHeader({ title, meta, back = true }) {
  const { locale } = useGlobal()
  return (
    <div className='j-shell pt-8'>
      {back && (
        <SmartLink
          href='/'
          className='j-hand j-soft inline-flex items-center gap-2 text-[17px]'
        >
          <span className='inline-block rotate-180'>
            <ArrowRight />
          </span>
          {j('JOURNAL_POSTLIST_BACK', '全部')}
        </SmartLink>
      )}
      <h1 className='j-marker mt-2 text-[44px] leading-none md:text-[54px]'>
        {title}
      </h1>
      <div className='max-w-[22ch]'>
        <HandRule />
      </div>
      {meta && <div className='j-stamp j-soft mt-2'>{meta}</div>}
      <span className='sr-only'>{locale?.COMMON?.ARTICLE_LIST}</span>
    </div>
  )
}

function PostSlipGrid({ posts = [], empty, className = '' }) {
  const readMarks = useReadMarks()
  if (!posts.length) {
    return (
      <div className='j-shell'>
        <p className='j-hand j-blue mt-10 text-[21px]'>{empty}</p>
      </div>
    )
  }
  return (
    <div className='j-shell'>
      <div
        className={`j-tilt-group mt-8 grid gap-7 md:grid-cols-2 ${className}`}
      >
        {posts.map((post, i) => (
          <PostSlip
            key={post?.id || i}
            post={post}
            readPct={pctOf(readMarks, post)}
          />
        ))}
      </div>
    </div>
  )
}

function LayoutPostList(props) {
  const { title, categoryOptions = [], tagOptions = [] } = props
  const currentTag = props.tag || props.keyword

  return (
    <main>
      <ListHeader
        title={title}
        meta={
          props.total
            ? `${props.total} 篇 · 第 ${props.page || 1} / ${
                props.totalPage || 1
              } 页`
            : undefined
        }
      />

      {tagOptions.length > 1 && currentTag && (
        <div className='j-shell j-tilt-group mt-5 flex flex-wrap gap-3'>
          {tagOptions.map(t => (
            <SmartLink
              key={t.name}
              href={`/tag/${encodeURIComponent(t.name)}`}
              className={`j-slip j-slip-alt j-hand px-3 py-1 text-[16px] ${
                t.name === currentTag ? 'j-circle' : ''
              }`}
            >
              {tagLabel(t.name)}
            </SmartLink>
          ))}
        </div>
      )}

      <PostSlipGrid
        posts={props.posts}
        empty={j('JOURNAL_SEARCH_EMPTY', '纸上还没有东西')}
      />

      <div className='j-shell'>
        <TapePagination page={props.page} totalPage={props.totalPage} />
        {categoryOptions.length > 0 && (
          <div className='j-soft mt-8 text-[14px]'>
            <span className='j-stamp'>分类：</span>
            {categoryOptions.map(c => (
              <SmartLink key={c.name} href={`/category/${c.name}`}>
                {c.name}
              </SmartLink>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function LayoutSearch(props) {
  const { keyword, posts = [] } = props
  const { locale } = useGlobal()
  const [value, setValue] = useState(keyword || '')
  const router = useRouter()

  useEffect(() => {
    // fallback 渲染时 keyword 还没到，到达后回填输入框
    setValue(keyword || '')
  }, [keyword])

  useEffect(() => {
    if (!isBrowser || !keyword) return
    replaceSearchResult({
      doms: document.getElementById('posts-wrapper'),
      search: keyword,
      target: { element: 'span', className: 'j-highlight' }
    })
  }, [keyword, posts.length])

  const onSubmit = e => {
    e.preventDefault()
    const q = value.trim()
    if (q) router.push(`/search/${encodeURIComponent(q)}`)
    else router.push('/search')
  }

  return (
    <main id='posts-wrapper'>
      <div className='j-shell pt-10'>
        <div className='j-drawer'>
          <form
            onSubmit={onSubmit}
            className='j-slip j-tape-single flex items-center gap-3 px-4 py-3'
          >
            <Magnifier />
            <input
              className='j-field'
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={j('JOURNAL_SEARCH_PLACEHOLDER', '写点什么进去找找')}
              aria-label={locale?.NAV?.SEARCH || '搜索'}
            />
            <button type='submit' className='j-btn j-btn-red j-hand shrink-0'>
              {locale?.NAV?.SEARCH || '搜索'}
            </button>
            <span className='j-drawer-handle' aria-hidden='true' />
            <span className='j-drawer-label j-stamp'>
              {keyword ? `「${keyword}」· ${posts.length} 条` : '还没写关键词'}
            </span>
          </form>
        </div>
      </div>

      <PostSlipGrid
        posts={posts}
        empty={j('JOURNAL_SEARCH_EMPTY', '没找到？试试更短的词')}
        className='j-drawer-out'
      />

      <div className='j-shell j-tilt-slow mt-10 grid gap-7 md:grid-cols-2'>
        <StickyNote title={j('JOURNAL_SEARCH_HINT_TITLE', '搜索建议')}>
          <ul className='j-print space-y-1'>
            <li>· 用更短的词，比如「 vue 」而不是「 vue3 性能优化 」</li>
            <li>· 搜标题比搜正文更容易命中</li>
            <li>· 翻不到就去看归档，纸就那么几张</li>
          </ul>
        </StickyNote>
        {!posts.length && keyword && (
          <p className='j-hand j-blue self-center text-[22px]'>
            「{keyword}」没有找到。
            <HandRule red className='mt-1' />
          </p>
        )}
      </div>

      <div className='j-shell'>
        <TapePagination page={props.page} totalPage={props.totalPage} />
      </div>
    </main>
  )
}

/* ---------- 文章页 ---------- */

function ArticleToc({ post }) {
  const [active, setActive] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isBrowser || !post?.toc?.length) return
    const observer = new IntersectionObserver(
      entries => {
        const shown = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (shown[0]) setActive(shown[0].target.id)
      },
      { rootMargin: '-20% 0px -65% 0px' }
    )
    post.toc.forEach(item => {
      const node = document.getElementById(uuidToId(item.id))
      if (node) observer.observe(node)
    })
    return () => observer.disconnect()
  }, [post?.toc])

  // ESC 与「点抽屉外」都收起：不铺遮罩层（那是一层新材质），只监听 document
  useEffect(() => {
    if (!open || !isBrowser) return
    const onKey = e => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onDown = e => {
      const t = e.target
      if (!t || typeof t.closest !== 'function') return
      if (t.closest('#j-toc-drawer') || t.closest('.j-toc-fab')) return
      setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  if (!post?.toc?.length || !j('JOURNAL_SHOW_TOC', true)) return null

  const tocTitle = j('JOURNAL_TOC_TITLE', '这一页的目录')
  const tocLabel = j('JOURNAL_TOC_LABEL', '目')

  return (
    <>
      {/* 桌面端侧伸索引贴：lg:block 不变 */}
      <aside className='sticky top-8 hidden max-h-[calc(100vh-4rem)] overflow-y-auto py-12 pl-3 pr-2 lg:block'>
        <div className='j-stamp j-red pl-4'>{tocTitle}</div>
        <TocTabs toc={post.toc} active={active} tocTitle={tocTitle} />
      </aside>

      {/* 移动端：左下角悬浮圆形按钮 + 抽屉。lg: 以下才出现 */}
      <button
        type='button'
        className='j-toc-fab'
        aria-expanded={open}
        aria-controls={open ? 'j-toc-drawer' : undefined}
        aria-label={tocTitle}
        onClick={() => setOpen(o => !o)}
      >
        {tocLabel}
      </button>
      {open && (
        <div
          id='j-toc-drawer'
          className='j-note j-toc-drawer'
          role='dialog'
          aria-modal='false'
          aria-label={tocTitle}
        >
          <div className='j-stamp j-red pl-1'>{tocTitle}</div>
          <button
            type='button'
            className='j-toc-close'
            aria-label={j('JOURNAL_TOC_CLOSE', '收起目录')}
            onClick={() => setOpen(false)}
          >
            ×
          </button>
          <TocTabs
            toc={post.toc}
            active={active}
            tocTitle={tocTitle}
            onNavigate={() => setOpen(false)}
          />
        </div>
      )}
    </>
  )
}

/** 目录的索引贴列表，桌面 aside 与移动抽屉共用一份，不写第二套贴面规则 */
function TocTabs({ toc, active, tocTitle, onNavigate }) {
  return (
    <nav className='j-tabs mt-4' aria-label={tocTitle}>
      {toc.map(item => {
        const id = uuidToId(item.id)
        const current = id === active
        return (
          <a
            key={id}
            href={`#${id}`}
            className={`j-tab ${current ? 'j-tab-current' : ''}`}
            style={{ '--j-ind': `${(item.indentLevel || 0) * 12}px` }}
            aria-current={current ? 'location' : undefined}
            onClick={onNavigate}
          >
            <span className='j-tab-text'>{item.text}</span>
            {current && <HandRule red className='j-tab-slash' />}
          </a>
        )
      })}
    </nav>
  )
}

function ArticleAround({ prev, next }) {
  if (!prev && !next) return null
  const both = !!(prev && next)

  const card = (post, label, isPrev) => (
    <SmartLink href={postHref(post)} className='j-slip block px-4 py-4'>
      <span className={`j-around-card ${isPrev ? '' : 'j-around-card-right'}`}>
        <span className='j-stamp j-soft'>{label}</span>
        <span className='j-hand flex items-center gap-3 text-[18px]'>
          {isPrev && (
            <span className='inline-block shrink-0 rotate-180'>
              <ArrowRight />
            </span>
          )}
          <span className='min-w-0'>{post.title}</span>
          {!isPrev && (
            <span className='inline-block shrink-0'>
              <ArrowRight />
            </span>
          )}
        </span>
      </span>
    </SmartLink>
  )

  return (
    <nav
      className={`j-around j-tilt-group mt-12 ${both ? 'j-around-both' : ''}`}
      aria-label='上一篇与下一篇'
    >
      {prev && card(prev, '上一篇', true)}
      {both && <ThreadLink />}
      {next && card(next, '下一篇', false)}
    </nav>
  )
}

/* ------------------------------------------------------------------ *
 * 分享：手写「分享」+ 纯文字手绘下划线链接
 * 共享的 ShareBar 是品牌彩标圆图标，会破坏纸面语言，这里主题内自绘；
 * 但沿用它的开关配置，站长不用改两处
 * ------------------------------------------------------------------ */

const SHARE_TEXT_LABELS = {
  weibo: '微博',
  twitter: 'X',
  telegram: 'Telegram',
  email: '邮件',
  link: '复制'
}

/**
 * 剪报卡的数据源是读者自己框选的那一句，不是编出来的金句。
 * 首帧 null、挂载后才监听 selectionchange：hydration 纪律同「书签」节。
 * 只认 #article-wrapper 里的选区——框到导航、分享行、评论不该出一张卡。
 */
const useQuoteSelection = () => {
  const [quote, setQuote] = useState(null)

  useEffect(() => {
    if (!j('JOURNAL_SHARE_CARDS', true)) return
    const onChange = () => {
      const sel = window.getSelection()
      const text = String(sel?.toString() || '')
      const host = document.getElementById('article-wrapper')
      if (!text.trim() || !host || !sel.anchorNode) return setQuote('')
      if (!host.contains(sel.anchorNode)) return setQuote('')
      setQuote(clampQuote(text, Number(j('JOURNAL_CARD_QUOTE_MAX', 160))))
    }
    document.addEventListener('selectionchange', onChange)
    return () => document.removeEventListener('selectionchange', onChange)
  }, [])

  return quote
}

function ShareNote({ post, quote = '' }) {
  const router = useRouter()
  const { locale } = useGlobal()
  const [liveUrl, setLiveUrl] = useState('')

  useEffect(() => {
    setLiveUrl(window.location.href)
  }, [])

  const services = String(
    j('JOURNAL_SHARE_SERVICES', 'link,weibo,twitter,email')
  )
    .split(',')
    .map(name => name.trim())
    .filter(name => SHARE_TEXT_LABELS[name])

  // 服务端渲染时退回站点链接 + 路径，保证静态导出下链接本身就是完整的
  const encoded = encodeURIComponent(
    liveUrl || `${siteConfig('LINK')}${router.asPath}`
  )
  const text = encodeURIComponent(
    `${post?.title || ''} | ${siteConfig('TITLE')}`
  )

  const hrefOf = service => {
    switch (service) {
      case 'weibo':
        return `https://service.weibo.com/share/share.php?url=${encoded}&title=${text}`
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encoded}&text=${text}`
      case 'telegram':
        return `https://t.me/share/url?url=${encoded}&text=${text}`
      case 'email':
        return `mailto:?subject=${text}&body=${encoded}`
      default:
        return null
    }
  }

  const copyUrl = () => {
    const decoded = decodeURIComponent(encoded)
    navigator?.clipboard?.writeText(decoded)
    alert(`${locale?.COMMON?.URL_COPIED || '链接已复制'} 
${decoded}`)
  }

  // 故事卡随时可点；剪报卡要有选区才有——没有选区就没有这一项
  const cards = []
  if (j('JOURNAL_SHARE_CARDS', true)) {
    const story = cardUrl(post, { size: 'story', locale: router?.locale })
    if (story) cards.push({ key: 'story', label: '故事卡', href: story })
    const clipping = quote && cardUrl(post, { quote, locale: router?.locale })
    if (clipping)
      cards.push({ key: 'clipping', label: '剪报卡', href: clipping })
  }

  const enabled = ['true', true].includes(
    siteConfig('POST_SHARE_BAR_ENABLE', true)
  )
  if (!enabled || !j('JOURNAL_SHARE_BAR', true) || post?.type !== 'Post') {
    return null
  }

  return (
    <section className='j-share mt-8 flex flex-wrap items-center gap-x-5 gap-y-2'>
      <span className='j-hand j-red text-[20px]'>
        {j('JOURNAL_SHARE_TITLE', '分享')}
      </span>
      <span className='j-hand flex flex-wrap items-center gap-x-5 gap-y-1 text-[18px]'>
        {services.map(service =>
          service === 'link' ? (
            <button
              key={service}
              type='button'
              className='j-textlink py-2'
              onClick={copyUrl}
            >
              {SHARE_TEXT_LABELS[service]}
            </button>
          ) : (
            <a
              key={service}
              href={hrefOf(service)}
              target='_blank'
              rel='noopener noreferrer'
              className='py-2'
            >
              {SHARE_TEXT_LABELS[service]}
            </a>
          )
        )}
        {cards.map(card => (
          <a
            key={card.key}
            href={card.href}
            target='_blank'
            rel='noopener noreferrer'
            className='py-2'
          >
            {card.label}
          </a>
        ))}
      </span>
    </section>
  )
}

function LayoutSlug(props) {
  const { post, lock, validPassword, prev, next, recommendPosts } = props
  const { locale } = useGlobal()
  const router = useRouter()

  const readMarks = useReadMarks()
  useProgressRecord(post)
  const quote = useQuoteSelection()

  if (lock) {
    return (
      <main className='j-shell grid gap-8 py-12 lg:grid-cols-[220px_minmax(0,1fr)]'>
        <div />
        <div className='j-slip j-tape-single p-6'>
          <ArticleLock validPassword={validPassword} />
        </div>
      </main>
    )
  }

  if (!post) return null

  const ogImage = ogImageUrl(post, router?.locale)
  const revisedOn = revisedStamp(post)
  const readPct = pctOf(readMarks, post)

  return (
    <>
      <Head>{ogImage && <meta property='og:image' content={ogImage} />}</Head>
      <main className='j-shell grid grid-cols-[minmax(0,1fr)] gap-8 py-10 lg:grid-cols-[220px_minmax(0,1fr)]'>
        <ArticleToc post={post} />

        {/* 必须显式占第二列：ArticleToc 在没有目录时返回 null，
          届时本元素会成为网格第一个子元素，被自动放进 220px 的边栏列，
          正文压到 136px 且被 #notion-article 的 overflow-hidden 剪掉 */}
        <article
          className={`j-slip j-tape px-5 py-8 md:px-10 md:py-12 lg:col-start-2 ${paperAge(
            dayKey(postDate(post))
          )}`}
        >
          <header className='mb-8'>
            <div className='flex flex-wrap items-center gap-3'>
              <span className='j-stamp-date j-stamp'>{stampMD(post)}</span>
              <span className='j-stamp j-soft'>{stampYear(post)}</span>
              {/* 只陈述哪天回来改过；判定与左下的修订胶带共用 revisedGap 一处 */}
              {revisedOn && (
                <span className='j-stamp j-soft'>{`改于 ${revisedOn}`}</span>
              )}
              {/* 铅笔痕属于读者：上一站读到哪儿，这一趟好接着找 */}
              <ReadMark pct={readPct} last />
              {post?.category && (
                <SmartLink
                  href={`/category/${encodeURIComponent(post.category)}`}
                  className='j-pill j-pill-yellow'
                >
                  {post.category}
                </SmartLink>
              )}
              {post?.tags?.map(tag => (
                <SmartLink
                  key={tag}
                  href={`/tag/${encodeURIComponent(tag)}`}
                  className='j-pill'
                >
                  {tagLabel(tag)}
                </SmartLink>
              ))}
            </div>

            <h1 className='j-hand mt-5 text-[28px] leading-tight md:text-[34px]'>
              {siteConfig('POST_TITLE_ICON') && (
                <NotionIcon icon={post.pageIcon} />
              )}{' '}
              {post.title}
            </h1>
            <div className='max-w-[30ch]'>
              <HandRule />
            </div>
          </header>

          {post?.aiSummary && <AISummary aiSummary={post.aiSummary} />}

          <div id='article-wrapper' className='j-print'>
            <NotionPage post={post} />
          </div>

          <hr className='j-dashed-rule' />

          <div className='j-hand j-red text-[19px]'>
            {locale?.COMMON?.COPYRIGHT || '声明'}
            <span className='j-print j-soft ml-2 text-[15px]'>
              原创 · 转载请注明出处
            </span>
          </div>

          <ShareNote post={post} quote={quote} />

          <ArticleAround prev={prev} next={next} />
          {post?.type === 'Post' && recommendPosts?.length > 0 && (
            <RecommendPosts recommendPosts={recommendPosts} />
          )}

          <section className='j-comments mt-12'>
            <h2 className='j-hand text-[24px]'>
              {locale?.COMMON?.COMMENTS || '评论'}
            </h2>
            <div className='max-w-[14ch]'>
              <HandRule red />
            </div>
            <Comment frontMatter={post} />
          </section>
        </article>
      </main>
    </>
  )
}

/* ---------- 归档 ---------- */

/** 落笔格：一年一张尺，落过笔的日子点一枚墨点。
 *  空白天不补、空白月没有行——与「纸会老」同一条原则；具体日期仍只在摊眉上写 */
function WritingGrid({ posts = [] }) {
  const grids = useMemo(() => yearGrids(posts), [posts])
  if (!j('JOURNAL_WRITING_GRID', true) || !grids.length) return null

  return (
    <div className='j-note p-5'>
      <div className='j-stamp'>{j('JOURNAL_GRID_TITLE', '落笔格')}</div>
      {grids.map(group => (
        <section key={group.year} className='mt-3'>
          <div className='j-hand text-[19px]'>{group.year}</div>
          {group.months.map(m => (
            <div key={m.month} className='j-cal-row mt-1'>
              <span className='j-stamp j-soft'>
                {String(m.month).padStart(2, '0')}
              </span>
              <span className='j-cal-ruler' aria-hidden='true'>
                {m.days.map(([day, n]) => (
                  <i
                    key={day}
                    className={`j-cal-dot${n > 1 ? ' j-cal-dot-2' : ''}`}
                    style={{ left: `${((day - 0.5) / 31) * 100}%` }}
                  />
                ))}
              </span>
              <span className='j-cal-count j-stamp j-soft'>
                {`${m.days.reduce((sum, [, n]) => sum + n, 0)} 张`}
              </span>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

/** 读者的今天：本地日期，不是 UTC 也不是构建快照——纸龄那格是作者的时间轴，这一格是读者的 */
const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`

/** 同月同日、年份更早的才算「往年今天」；2/29 不往前补到 2/28，补出来的日期是假的 */
const echoYears = (posts = [], today = '') => {
  if (!today) return []
  const mmdd = today.slice(5)
  const thisYear = Number(today.slice(0, 4))
  return posts
    .map(post => ({ post, key: dayKey(postDate(post)) }))
    .filter(({ key }) => key.slice(5) === mmdd && key.length === 10)
    .map(entry => ({ ...entry, ago: thisYear - Number(entry.key.slice(0, 4)) }))
    .filter(entry => entry.ago > 0)
    .sort((a, b) => a.ago - b.ago)
}

/** 往年的今天：只住在归档右栏，因为别处没有全集（首页的 posts 是当页 12 张） */
function EchoNote({ posts = [] }) {
  // 今天来自读者的浏览器：SSR 与首帧都没有这张便条，无 JS 就没有——渐进增强
  const [today, setToday] = useState(null)
  useEffect(() => {
    if (j('JOURNAL_ON_THIS_DAY', true)) setToday(localDay())
  }, [])
  const echoes = useMemo(() => echoYears(posts, today), [posts, today])

  if (!j('JOURNAL_ON_THIS_DAY', true) || !echoes.length) return null

  return (
    <StickyNote title={j('JOURNAL_ECHO_TITLE', '往年的今天')}>
      <div className='grid gap-2'>
        {echoes
          .slice(0, Number(j('JOURNAL_ON_THIS_DAY_COUNT', 3)))
          .map(({ post, ago }) => (
            <div
              key={post?.id || post?.slug}
              className='flex items-baseline gap-2'
            >
              <span className='j-stamp j-soft whitespace-nowrap'>
                {`${ago} 年前`}
              </span>
              <SmartLink href={postHref(post)} className='j-hand text-[18px]'>
                {post.title}
              </SmartLink>
            </div>
          ))}
      </div>
    </StickyNote>
  )
}

/** 一个连载 = 一个前缀标签。话数按 (发表日, slug) 升序，与页码同一把尺；
 *  辑序按首话日期降序，最近开辑的排前面 */
const seriesGroups = (posts = []) => {
  const min = Number(j('JOURNAL_SERIES_MIN', 2)) || 2
  const map = new Map()
  posts.forEach(post => {
    const series = seriesOf(post)
    if (!series) return
    if (!map.has(series.name)) map.set(series.name, [])
    map.get(series.name).push(post)
  })
  return [...map.entries()]
    .map(([name, items]) => ({
      name,
      posts: items
        .map(post => ({
          post,
          key: dayKey(postDate(post)),
          slug: String(post?.slug || post?.id || '')
        }))
        .sort((a, b) =>
          a.key === b.key ? cmp(a.slug, b.slug) : cmp(a.key, b.key)
        )
    }))
    .filter(group => group.posts.length >= min)
    .sort((a, b) =>
      cmp(String(b.posts[0]?.key), String(a.posts[0]?.key))
    )
}

/** 一条线的册表：路由的 `getStaticPaths`、归档那枚入口、册页的空态三处都问它，
 *  谁都不许自己再算一遍——否则「链子在、册不在」的 404 迟早出现（同年刊的 bookYears） */
const seriesBooks = (posts = []) =>
  seriesGroups(posts)
    // 名字里带 `/` 的标签进不了册：`/series/a/b` 会被路由切成两段，永远匹配不上
    .filter(group => !group.name.includes('/'))
    .map(group => {
      const keys = group.posts.map(({ key }) => key)
      return {
        name: group.name,
        // 册名是剥了前缀那一截：URL 里带 %3A 既难看也没法念
        href: `/series/${encodeURIComponent(group.name)}`,
        posts: group.posts,
        count: group.posts.length,
        first: keys[0] || '',
        last: keys[keys.length - 1] || '',
        years: [
          ...new Set(
            keys.map(key => key.slice(0, 4)).filter(year => year.length === 4)
          )
        ].sort(cmp)
      }
    })

/** 连载清单：住在归档右栏，因为别处没有全集（口径同「往年的今天」） */
function SeriesNote({ posts = [] }) {
  const series = useMemo(() => seriesGroups(posts), [posts])
  const books = useMemo(() => seriesBooks(posts), [posts])
  const routeHref = j('JOURNAL_ROUTE_HREF', '')
  if (!series.length) return null

  return (
    <StickyNote title={j('JOURNAL_SERIES_TITLE', '连载')}>
      {/* 目录只在真有成辑时出现：一辑都没有时那页只会说「还没攒够」，不值得跳 */}
      {books.length > 0 && j('JOURNAL_SERIES_BOOK', true) && (
        <div className='mb-3'>
          <SmartLink href='/series' className='j-stamp j-soft whitespace-nowrap'>
            {`${j('JOURNAL_SERIES_BOOK_LABEL', '连载册')}目录 →`}
          </SmartLink>
        </div>
      )}
      {/* 学习路线：路线页是 Page 型内容，归档拿不到它，所以路径由配置给；留空即不出现 */}
      {routeHref && (
        <div className='mb-3'>
          <SmartLink
            href={routeHref}
            className='j-stamp j-soft whitespace-nowrap'
          >
            {`${j('JOURNAL_ROUTE_LABEL', '学习路线')} →`}
          </SmartLink>
        </div>
      )}
      <div className='grid gap-3'>
        {series.map(group => (
          <div key={group.name}>
            <div className='flex items-baseline gap-2'>
              <SmartLink
                href={`/tag/${encodeURIComponent(
                  `${j('JOURNAL_SERIES_PREFIX', '连载:')}${group.name}`
                )}`}
                className='j-hand text-[19px]'
              >
                {group.name}
              </SmartLink>
              <span className='j-stamp j-soft whitespace-nowrap'>
                {`${group.posts.length} 话`}
              </span>
              {/* 入口只长在这张有全集的清单上：文章页的胶囊判不出成不成辑 */}
              {j('JOURNAL_SERIES_BOOK', true) &&
                books.find(b => b.name === group.name) && (
                  <SmartLink
                    href={books.find(b => b.name === group.name).href}
                    className='j-stamp j-soft whitespace-nowrap'
                  >
                    {`${j('JOURNAL_SERIES_BOOK_LABEL', '连载册')} →`}
                  </SmartLink>
                )}
            </div>
            <div className='mt-1 grid gap-1'>
              {group.posts.map(({ post, key }, i) => (
                <div
                  key={post?.id || post?.slug}
                  className='flex items-baseline gap-2'
                >
                  <span className='j-stamp j-soft whitespace-nowrap'>
                    {`第 ${i + 1} 话 · ${mdOf(key) || '--.--'}`}
                  </span>
                  <SmartLink
                    href={postHref(post)}
                    className='j-hand text-[17px]'
                  >
                    {post.title}
                  </SmartLink>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </StickyNote>
  )
}

function LayoutArchive(props) {
  const { posts = [] } = props

  const numbers = useMemo(
    () => (j('JOURNAL_PAGE_NUMBERS', true) ? pageNumbers(posts) : new Map()),
    [posts]
  )

  const readMarks = useReadMarks()

  const byYear = useMemo(() => {
    const map = new Map()
    posts.forEach(post => {
      const year = stampYear(post)
      if (!map.has(year)) map.set(year, [])
      map.get(year).push(post)
    })
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [posts])

  return (
    <main className='j-shell grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_280px]'>
      <div>
        <h1 className='j-marker text-[48px] leading-none md:text-[58px]'>
          {j('JOURNAL_ARCHIVE_TITLE', '归档')}
        </h1>
        <div className='max-w-[20ch]'>
          <HandRule />
        </div>
        <p className='j-print j-soft mt-2'>
          {j('JOURNAL_ARCHIVE_SUBTITLE', '')}
        </p>
        <div className='j-stamp j-soft mt-1'>共 {posts.length} 张纸</div>

        <div className='relative mt-9 pl-6'>
          <div className='absolute left-1 top-2 h-[calc(100%-1rem)] w-[2px] rotate-[0.4deg] bg-[var(--ink)] opacity-70' />
          {byYear.map(([year, items]) => (
            <section
              key={year}
              id={`archive-${year}`}
              className='relative mb-12 scroll-mt-24'
            >
              <span className='j-stamp-date j-stamp text-[15px]'>{year}</span>
              <span className='j-stamp j-soft ml-2 text-[13px]'>
                {items.length} 张
              </span>

              <div className='j-year-stack'>
                <span className='j-staple j-staple-a' aria-hidden='true' />
                <span className='j-staple j-staple-b' aria-hidden='true' />
                <div className='j-days j-days-axis mt-5'>
                  {dayGroups(items).map(group => (
                    <DaySpread
                      key={group.key}
                      group={group}
                      head={
                        <span className='j-day-week j-hand j-blue'>
                          {monthOf(group.key)}
                        </span>
                      }
                      render={post => (
                        <div
                          key={post?.id || post?.slug}
                          className='j-slip j-tape-single j-arch-row flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3'
                        >
                          <h2 className='j-hand flex-1 text-[19px]'>
                            <SmartLink
                              href={postHref(post)}
                              className='j-stretch'
                            >
                              {post.title}
                            </SmartLink>
                          </h2>
                          {/* 标记与 pill 同组换行；实测分组与不分组行高一致，
                              真正的窄屏成本是标题被抢宽度，见 MASTER「归档行：轻量标记」 */}
                          <div className='relative z-[2] flex flex-wrap items-center gap-x-2 gap-y-1'>
                            {stateMarks(post)
                              .filter(mark =>
                                ARCHIVE_MARK_KEYS.includes(mark.key)
                              )
                              .map(mark => (
                                <span
                                  key={mark.key}
                                  className='j-mark j-stamp whitespace-nowrap'
                                >
                                  {mark.label}
                                </span>
                              ))}
                            {post?.tags?.[0] && (
                              <SmartLink
                                href={`/tag/${encodeURIComponent(post.tags[0])}`}
                                className='j-pill j-pill-yellow'
                              >
                                {tagLabel(post.tags[0])}
                              </SmartLink>
                            )}
                            <ReadMark pct={pctOf(readMarks, post)} />
                            <PageNo n={numbers.get(post?.id || post?.slug)} />
                          </div>
                        </div>
                      )}
                    />
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className='j-tilt-slow grid content-start gap-7'>
        <StickyNote title='按年份跳转'>
          <div className='j-hand flex flex-wrap items-baseline gap-3 text-[18px]'>
            {byYear.map(([year]) => (
              <span key={year} className='flex items-baseline gap-1'>
                <a href={`#archive-${year}`}>{year}</a>
                {j('JOURNAL_YEARBOOK', true) && (
                  <SmartLink
                    href={`/year/${year}`}
                    className='j-stamp j-soft text-[13px]'
                  >
                    年刊 →
                  </SmartLink>
                )}
              </span>
            ))}
          </div>
        </StickyNote>
        <WritingGrid posts={posts} />
        <EchoNote posts={posts} />
        <SeriesNote posts={posts} />
        <div className='j-note p-5'>
          <div className='j-stamp'>本站统计</div>
          <div className='j-print mt-2 text-[15px]'>
            {posts.length} 篇文章 · {byYear.length} 个年份
          </div>
          <div className='j-hand mt-3 text-[17px]'>
            <SmartLink href='/legend'>
              {`${j('JOURNAL_LEGEND_TITLE', '图例')}：这些标记各是什么意思 →`}
            </SmartLink>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ---------- 分类 / 标签 ---------- */

function LayoutCategoryIndex(props) {
  const options = props.categoryOptions || []
  const max = Math.max(...options.map(o => o.count || 1), 1)
  const featured = options.findIndex(c => (c.count || 0) === max)

  return (
    <main className='j-shell py-10'>
      <h1 className='j-marker text-[48px] leading-none md:text-[58px]'>
        {j('JOURNAL_CATEGORY_TITLE', '分类')}
      </h1>
      <div className='max-w-[20ch]'>
        <HandRule />
      </div>
      <p className='j-print j-soft mt-2'>
        {j('JOURNAL_CATEGORY_SUBTITLE', '')}
      </p>

      <div className='j-tilt-group mt-9 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {options.map((c, i) => (
          <SmartLink
            key={c.name}
            href={`/category/${encodeURIComponent(c.name)}`}
            className={`j-slip j-tape-single block p-5 ${
              i === featured ? 'md:col-span-2' : ''
            }`}
          >
            <h2 className='j-hand flex items-center gap-2 text-[24px]'>
              {i === featured && <Star />}
              {c.name}
            </h2>
            <div className='max-w-[16ch]'>
              <HandRule />
            </div>
            <div className='relative z-[2] mt-2 flex items-center justify-between gap-3'>
              <span className='j-print j-soft text-[14px]'>
                {c.description || ''}
              </span>
              <span className='j-stamp'>{c.count || 0} 篇</span>
            </div>
            {i === featured && (
              <span className='j-hand j-red absolute right-4 top-4 text-[16px]'>
                最多
              </span>
            )}
          </SmartLink>
        ))}
      </div>
    </main>
  )
}

function LayoutTagIndex(props) {
  return (
    <main className='j-shell py-10'>
      <h1 className='j-marker text-[48px] leading-none md:text-[58px]'>
        {j('JOURNAL_TAG_TITLE', '标签')}
      </h1>
      <div className='max-w-[20ch]'>
        <HandRule />
      </div>
      <p className='j-print j-soft mt-2'>{j('JOURNAL_TAG_SUBTITLE', '')}</p>

      <div className='mt-9'>
        <TagCloudStickers tagOptions={props.tagOptions} />
      </div>

      <hr className='j-dashed-rule' />

      <div className='j-tilt-slow grid gap-7 md:grid-cols-2'>
        <StickyNote title='最近用过的标签'>
          <div className='j-hand flex flex-wrap gap-3 text-[18px]'>
            {(props.tagOptions || []).slice(0, 6).map(t => (
              <SmartLink
                key={t.name}
                href={`/tag/${encodeURIComponent(t.name)}`}
              >
                {tagLabel(t.name)}
              </SmartLink>
            ))}
          </div>
        </StickyNote>
        <PostSlip post={(props.posts || [])[0]} compact />
      </div>
    </main>
  )
}

/* ---------- plog 照片墙 ---------- */

/** 2026-09 → 2026 年 9 月 */
const monthLabel = key => {
  const [year, month] = String(key).split('-')
  return month ? `${year} 年 ${Number(month)} 月` : '没写日期'
}

const monthKey = post => String(postDate(post)).slice(0, 7) || 'undated'

/** 一张拍立得：照片 + 蓝圆珠笔一句话 + 红邮戳（逐张取真实日期） */
function Polaroid({ post, priority = false }) {
  if (!post) return null
  const cover = post.pageCoverThumbnail || post.pageCover

  return (
    <figure className='j-polaroid'>
      {cover ? (
        <LazyImage
          src={cover}
          alt={post.title}
          priority={priority}
          className='aspect-[4/3] w-full object-cover'
        />
      ) : (
        <div className='j-photo-empty'>
          <PhotoLineArt />
        </div>
      )}

      <figcaption>
        <SmartLink href={postHref(post)} className='j-stretch'>
          {post.title}
        </SmartLink>
      </figcaption>
      <div className='mt-1 flex items-center justify-between gap-2'>
        <span className='j-stamp-date j-stamp'>{stampMD(post)}</span>
        <span className='j-stamp j-soft'>{stampYear(post)}</span>
      </div>
    </figure>
  )
}

function LayoutPlog(props) {
  const { posts = [] } = props
  const tag = j('JOURNAL_PLOG_TAG', 'plog')
  const limit = Number(j('JOURNAL_PLOG_COUNT', 30)) || 30

  const photos = useMemo(
    () =>
      posts
        .filter(post => post?.tags?.includes(tag))
        .sort((a, b) => String(postDate(b)).localeCompare(String(postDate(a))))
        .slice(0, limit),
    [posts, tag, limit]
  )

  const byMonth = useMemo(() => {
    const map = new Map()
    photos.forEach(post => {
      const key = monthKey(post)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(post)
    })
    return [...map.entries()]
  }, [photos])

  const currentCount = byMonth[0]?.[1]?.length || 0

  return (
    <main className='j-shell grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_280px]'>
      <div>
        <div className='flex items-end gap-4'>
          <h1 className='j-marker text-[48px] leading-none md:text-[58px]'>
            {j('JOURNAL_PLOG_TITLE', 'plog')}
          </h1>
          <CameraDoodle />
        </div>
        <div className='max-w-[24ch]'>
          <HandRule />
        </div>
        <p className='j-print j-soft mt-2'>{j('JOURNAL_PLOG_SUBTITLE', '')}</p>
        <div className='j-stamp j-soft mt-1'>
          {photos.length} 张 · {monthLabel(byMonth[0]?.[0])}
        </div>

        {photos.length === 0 ? (
          <div className='j-slip j-tape-single mt-9 px-6 py-10 text-center'>
            <p className='j-hand j-blue text-[22px]'>这一页还没贴照片。</p>
            <p className='j-print j-soft mt-2 text-[15px]'>
              在 Notion 里给想进照片墙的文章加上「{tag}
              」标签，并给它配一张封面图。
            </p>
          </div>
        ) : (
          byMonth.map(([key, items]) => (
            <section
              key={key}
              id={`plog-${key}`}
              className='mt-10 scroll-mt-24'
            >
              <h2 className='j-hand j-blue text-[22px]'>
                {monthLabel(key)} · {items.length} 张
              </h2>
              <div className='j-collage mt-5'>
                {items.map((post, index) => (
                  <Polaroid
                    key={post?.id || post?.slug || index}
                    post={post}
                    priority={index < 4}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {byMonth.length > 1 && <hr className='j-dashed-rule mt-12' />}
        {byMonth.length > 1 && (
          <>
            <nav
              aria-label='月份'
              className='j-tilt-group mt-6 flex flex-wrap items-center gap-3'
            >
              {byMonth.map(([key, items], index) => (
                <a
                  key={key}
                  href={`#plog-${key}`}
                  className={`j-pill px-3 py-1.5 text-[15px] ${
                    index === 0 ? 'j-circle' : ''
                  }`}
                >
                  {index === 0 ? (
                    <RedCircle label={`${monthLabel(key)} · ${items.length}`} />
                  ) : (
                    <span className='relative z-10'>
                      {monthLabel(key)} · {items.length}
                    </span>
                  )}
                </a>
              ))}
            </nav>
            <p className='j-hand j-red mt-4 text-[19px]'>
              {j('JOURNAL_PLOG_FOOTER', '')}
            </p>
          </>
        )}
      </div>

      <aside className='space-y-8'>
        <StickyNote title={j('JOURNAL_PLOG_RULE_TITLE', '')}>
          <p>{j('JOURNAL_PLOG_RULE_TEXT', '')}</p>
        </StickyNote>
        <div className='flex items-start gap-4'>
          <FilmDoodle />
          <div className='j-stamp j-soft pt-2'>
            本月 {currentCount} / {limit}
            <div className='mt-1'>超出的一律贴到下个月</div>
          </div>
        </div>
      </aside>
    </main>
  )
}

/* ---------- 404 / 500 / 认证页共用的大胶带纸 ---------- */

/* 图例页第二节：不来自 stateMarks 的那些语法。「今天看不看得见」只写数据源
   实际落在哪一页，不写猜测——段落颜色根本不在列表 props 里 */
const LEGEND_SYNTAX = [
  {
    name: '红字批注',
    how: 'Notion 里把整段文字设成红色',
    today: '只在文章正文里；列表拿不到段落颜色'
  },
  {
    name: '段落荧光笔划',
    how: 'Notion 里给整段设红色底（red_background）',
    today: '同上，只在文章正文里'
  },
  {
    name: '侧伸的索引贴（目录）',
    how: '文章正文里有二级以上标题就自己长出来',
    today: '文章页左栏；没有标题就没有这一栏'
  },
  {
    name: '铅笔连线（上 / 下一篇）',
    how: '按发表顺序取相邻的两篇，两篇俱在才画',
    today: '文章页底部，hr 之后'
  },
  {
    name: '书签 · 读完的勾 · 接着读',
    how: '不是 Notion 字段：是你在本站的滚动进度，只写在你自己浏览器的本地存储里，不上传',
    today:
      '本机决定。没读过就没有痕，看不见也不说明这篇文章有问题；读到一半时文章页抬头那枚「上次读到 N% →」可以点，点了才跳回上次的位置（不自动跳）'
  },
  {
    name: '一天一摊',
    how: '同一天发的合成一张跨页，中间一道装订中缝',
    today: '首页与归档；首页一天最多摊 3 张，多余的写「这天还有 N 张」'
  },
  {
    name: '连载',
    how: '给文章打一个以 JOURNAL_SERIES_PREFIX（默认「连载:」）开头的标签，前缀之后那截就是连载名',
    today:
      '话数按发表日排，早的是第 1 话；清单在归档右栏，不足 2 话不成辑，标签胶囊写成「连载 · 名字」；成辑的那条线在旁边多一枚「连载册 →」，进去是 /series/[连载名]；便条顶部还有「连载册目录 →」，进去 /series 是一辑一行的总目录'
  },
  {
    name: '纸会老',
    how: '发表日距今多少天，构建期定格，之后不刷新',
    today: '越旧的纸条墨边越淡'
  },
  {
    name: '按年装订',
    how: '发表日的年份',
    today:
      '归档页一年一摞，摞上两枚订书钉；每年那一摞还能单开一册：/year/[年份]'
  },
  {
    name: '页码 P.0XX',
    how: '全站已发布文章按 (日期, slug) 排序编号',
    today:
      '首页纸条右下角与归档行行尾；文章页刻意不印，分类 / 标签 / 搜索也不印'
  },
  {
    name: '落笔格',
    how: '发表日按年铺成一把 1—31 的尺，落过笔的日子点墨点',
    today: '归档右栏'
  },
  {
    name: '上次落笔 · 停笔 N 天',
    how: '全本站最大的发表日',
    today: '首页扉页那行等宽小字'
  }
]

/** 图例页：本子自己写的说明书。样例一律取真实文章，命中 0 的照实写没用上 */
function LayoutLegend(props) {
  const { posts = [] } = props
  const counts = useMemo(() => markCounts(posts), [posts])
  const numbers = useMemo(() => pageNumbers(posts), [posts])
  const lastStroke = useMemo(() => lastStrokeOf(posts), [posts])
  const years = useMemo(
    () =>
      [...new Set(posts.map(post => stampYear(post)))].filter(
        y => y !== '未日期'
      ),
    [posts]
  )

  const sampleOf = key =>
    posts.find(post => stateMarks(post).some(mark => mark.key === key))

  // 只列日期与计数：停笔天数走 Date.now()，按扉页那套「挂载后再补」的规矩，
  // 这一页不做两步渲染，直接不写天数
  const stats = [
    ['纸的张数', `${posts.length} 张`],
    ['按年装订', `${years.length} 个年份`],
    ['上次落笔', lastStroke ? lastStroke.replace(/-/g, '.') : '还没有日期']
  ]
  if (j('JOURNAL_PAGE_NUMBERS', true) && numbers.size) {
    stats.push(['页码编到', `P.${String(numbers.size).padStart(3, '0')}`])
  }

  return (
    <main className='j-shell grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_280px]'>
      <div>
        <h1 className='j-marker text-[48px] leading-none md:text-[58px]'>
          {j('JOURNAL_LEGEND_TITLE', '图例')}
        </h1>
        <div className='max-w-[20ch]'>
          <HandRule />
        </div>
        <p className='j-print j-soft mt-2 max-w-[46ch]'>
          {j('JOURNAL_LEGEND_SUBTITLE', '')}
        </p>

        <section className='j-section mt-9'>
          <BallpointNote>状态标记：纸上的胶带、图钉、红圈</BallpointNote>
          <div className='mt-5 grid gap-7'>
            {LEGEND_KEYS.map(item => {
              const sample = sampleOf(item.key)
              const n = counts.get(item.key) || 0
              return (
                <section key={item.key} className='j-legend-row'>
                  <div className='j-tilt-group'>
                    {sample && <PostSlip post={sample} compact hideDate />}
                  </div>
                  <div>
                    <h2 className='j-hand text-[21px]'>{markName(item)}</h2>
                    <p className='j-print mt-1 text-[15px]'>{item.how}</p>
                    <p className='j-print j-soft text-[15px]'>{item.where}</p>
                    <p className='j-stamp j-soft mt-1'>
                      {n
                        ? `今天有 ${n} 张纸带上它`
                        : '这个标记今天还没用上——不是坏了，是还没写上'}
                    </p>
                  </div>
                </section>
              )
            })}
          </div>
        </section>

        <section className='j-section mt-12'>
          <BallpointNote>其它语法：Notion 里怎么触发</BallpointNote>
          <div className='mt-5 grid gap-4'>
            {LEGEND_SYNTAX.map(item => (
              <div key={item.name} className='j-legend-line'>
                <h2 className='j-hand text-[19px]'>{item.name}</h2>
                <p className='j-print text-[15px]'>{item.how}</p>
                <p className='j-print j-soft text-[15px]'>{item.today}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className='j-tilt-slow grid content-start gap-7'>
        <StickyNote title='本子现状'>
          <div className='j-legend-stats'>
            {stats.map(([name, value]) => (
              <div key={name}>
                <span className='j-stamp j-soft'>{name}</span>
                <span className='j-hand ml-2 text-[18px]'>{value}</span>
              </div>
            ))}
          </div>
        </StickyNote>
        <div className='j-note p-5'>
          <div className='j-stamp'>这一页为什么存在</div>
          <p className='j-print mt-2 text-[15px] leading-7'>
            每一个标记都有真实数据源，没人手画的装饰。所以命中数是 0
            的时候，这一页照样把它列出来：那是内容还没长到那儿，不是语法坏了。
          </p>
          <div className='j-hand mt-3 text-[17px]'>
            <SmartLink href='/archive'>回到归档</SmartLink>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ *
 * 年刊 /year/[year]：把一年印成一册
 * 规格见 design-system/journal/MASTER.md「年刊」节
 * ------------------------------------------------------------------ */

/** 一册只收有发表日的纸：没日期的那几张不编进任何一年，也不给它们造一个年份 */
const yearOfPost = post => {
  const key = dayKey(postDate(post))
  return key.length === 10 ? key.slice(0, 4) : ''
}

/** 本站有哪几册：年份降序，最近那册排前面 */
const bookYears = (posts = []) =>
  [...new Set(posts.map(yearOfPost))]
    .filter(Boolean)
    .sort((a, b) => cmp(b, a))

/** 册内按月升序——册子从头翻，归档倒着找 */
const yearMonths = (posts = [], year = '') => {
  const map = new Map()
  posts
    .filter(post => yearOfPost(post) === year)
    .forEach(post => {
      const month = dayKey(postDate(post)).slice(0, 7)
      if (!map.has(month)) map.set(month, [])
      map.get(month).push(post)
    })
  return [...map.entries()].sort((a, b) => cmp(a[0], b[0]))
}

/** 册尾统计：每个数都从这一年的纸上手数；算不出来的（字数、热度）一律不写 */
const yearStats = (posts = [], year = '') => {
  const months = yearMonths(posts, year)
  const items = months.flatMap(([, list]) => list)
  const days = items.map(post => dayKey(postDate(post))).sort(cmp)
  const busiest = months.reduce(
    (best, [month, list]) =>
      !best || list.length > best.count ? { month, count: list.length } : best,
    null
  )
  return {
    total: items.length,
    months: months.length,
    first: days[0] || '',
    last: days[days.length - 1] || '',
    busiest,
    marks: markCounts(items)
  }
}

/** 一册里用到的状态标记：只数命中的，没命中的那档不占行 */
const usedMarks = marks =>
  LEGEND_KEYS.map(item => ({
    name: markName(item),
    n: marks.get(item.key) || 0
  })).filter(item => item.n > 0)

function LayoutYearbook(props) {
  const { posts = [], year = '' } = props
  const numbers = useMemo(
    () => (j('JOURNAL_PAGE_NUMBERS', true) ? pageNumbers(posts) : new Map()),
    [posts]
  )
  const months = useMemo(() => yearMonths(posts, year), [posts, year])
  const stats = useMemo(() => yearStats(posts, year), [posts, year])
  const years = useMemo(() => bookYears(posts), [posts])
  const readMarks = useReadMarks()

  if (!j('JOURNAL_YEARBOOK', true)) return null

  const at = years.indexOf(year)
  const newer = at > 0 ? years[at - 1] : ''
  const older = at > -1 && at < years.length - 1 ? years[at + 1] : ''
  const rows = [
    ['第一张', stats.first ? mdOf(stats.first) : '没有日期'],
    ['最后一张', stats.last ? mdOf(stats.last) : '没有日期']
  ]
  if (stats.busiest && stats.busiest.count > 1) {
    // 每月都只有一张时「最密的月」是句废话：不写
    rows.push([
      '落笔最密的月',
      `${Number(stats.busiest.month?.slice(5))} 月 · ${stats.busiest.count} 张`
    ])
  }

  const empty = months.length === 0

  return (
    <main className='j-shell grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_280px]'>
      <div>
        <h1 className='j-marker text-[48px] leading-none md:text-[58px]'>
          {`${year} ${j('JOURNAL_YEARBOOK_LABEL', '年刊')}`}
        </h1>
        <div className='max-w-[20ch]'>
          <HandRule />
        </div>
        <p className='j-print j-soft mt-2'>
          {`${stats.total} 张纸 · ${stats.months} 个月落过笔`}
        </p>

        {empty ? (
          <div className='j-slip j-tape-single mt-9 px-6 py-10 text-center'>
            <p className='j-hand j-blue text-[22px]'>这一册是空的。</p>
            <p className='j-print j-soft mt-2 text-[15px]'>
              本站有年份可翻的是：
              {years.join('、') || '还没有一年攒得起来'}
            </p>
          </div>
        ) : (
          months.map(([month, items]) => (
            <section key={month} id={`book-${month}`} className='j-book-month'>
              <h2 className='j-hand j-blue mt-9 text-[22px]'>
                {`${Number(month.slice(5))} 月 · ${items.length} 张`}
              </h2>
              <div className='j-days mt-3'>
                {dayGroups(items).map(group => (
                  <DaySpread
                    key={group.key}
                    group={group}
                    head={
                      <span className='j-day-week j-hand j-blue'>
                        {weekOf(group.key)}
                      </span>
                    }
                    render={post => (
                      <PostSlip
                        post={post}
                        pageNo={numbers.get(post?.id || post?.slug)}
                        readPct={pctOf(readMarks, post)}
                      />
                    )}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {!empty && (
        <div className='j-tilt-slow grid content-start gap-7'>
          <StickyNote title={`${year} 这一册`}>
            <div className='j-legend-stats'>
              {rows.map(([name, value]) => (
                <div key={name}>
                  <span className='j-stamp j-soft'>{name}</span>
                  <span className='j-hand ml-2 text-[18px]'>{value}</span>
                </div>
              ))}
            </div>
            <div className='mt-3 grid gap-1'>
              {usedMarks(stats.marks).map(item => (
                <span key={item.name} className='j-stamp j-soft'>
                  {`${item.name} · ${item.n} 张`}
                </span>
              ))}
            </div>
          </StickyNote>
          <StickyNote title='相邻的册' className='j-book-nav'>
            <div className='j-hand flex flex-wrap gap-3 text-[18px]'>
              {newer && (
                <SmartLink href={`/year/${newer}`}>{`← ${newer}`}</SmartLink>
              )}
              {older && (
                <SmartLink href={`/year/${older}`}>{`${older} →`}</SmartLink>
              )}
              {!newer && !older && (
                <span className='j-print text-[15px]'>
                  这本子只攒了一册
                </span>
              )}
            </div>
          </StickyNote>
          <div className='j-note j-book-nav p-5'>
            <div className='j-stamp'>打印这一册</div>
            <p className='j-print mt-2 text-[15px] leading-7'>
              浏览器的打印预览里一个月开一页；屏幕上是连着滚的一趟。
            </p>
          </div>
        </div>
      )}
    </main>
  )
}

/* ------------------------------------------------------------------ *
 * 册子目录 /series：一辑一行，册页家族的回程
 * 规格见 design-system/journal/MASTER.md「册子目录 /series」节
 * ------------------------------------------------------------------ */

function LayoutSeriesIndex(props) {
  const { posts = [] } = props
  // 与路由表、归档入口、册页空态同一把尺；这一页不许自己再算一遍
  const books = useMemo(() => seriesBooks(posts), [posts])
  const min = Number(j('JOURNAL_SERIES_MIN', 2)) || 2
  if (!j('JOURNAL_SERIES_BOOK', true)) return null

  return (
    <main className='j-shell grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_280px]'>
      <div>
        <h1 className='j-marker text-[48px] leading-none md:text-[58px]'>
          {j('JOURNAL_SERIES_BOOK_LABEL', '连载册')}
        </h1>
        <div className='max-w-[20ch]'>
          <HandRule />
        </div>
        <p className='j-print j-soft mt-2'>
          {books.length
            ? `${books.length} 辑 · 共 ${books.reduce(
                (n, b) => n + b.count,
                0
              )} 话`
            : '还没有一条线攒成一辑'}
        </p>

        {books.length ? (
          <div className='mt-9 grid gap-3'>
            {books.map(b => (
              <div
                key={b.name}
                className='j-slip j-tape-single flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3'
              >
                <h2 className='j-hand flex-1 text-[19px]'>
                  <SmartLink href={b.href} className='j-stretch'>
                    {b.name}
                  </SmartLink>
                </h2>
                <div className='relative z-[2] flex flex-wrap items-center gap-x-2 gap-y-1'>
                  <span className='j-stamp j-soft whitespace-nowrap'>
                    {`${b.count} 话`}
                  </span>
                  <span className='j-stamp j-soft whitespace-nowrap'>
                    {`${mdOf(b.first) || '--.--'} – ${
                      mdOf(b.last) || '--.--'
                    }`}
                  </span>
                  <span className='j-stamp j-soft whitespace-nowrap'>
                    {b.years.length ? b.years.join(' · ') : '没有日期'}
                  </span>
                  <SmartLink
                    href={b.href}
                    className='j-stamp j-soft whitespace-nowrap'
                  >
                    翻开这一辑 →
                  </SmartLink>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='j-slip j-tape-single mt-9 px-6 py-10 text-center'>
            <p className='j-hand j-blue text-[22px]'>
              还没有一条线攒成一辑。
            </p>
            <p className='j-print j-soft mx-auto mt-2 max-w-[34ch] text-[15px]'>
              攒法：给文章打上同一枚
              <code className='j-print'>
                {`${j('JOURNAL_SERIES_PREFIX', '连载:')}名字`}
              </code>
              标签，够 {min} 话就自动成册。
            </p>
          </div>
        )}
      </div>

      <div className='j-tilt-slow grid content-start gap-7'>
        <StickyNote title='怎样算一辑'>
          <div className='grid gap-1'>
            <span className='j-stamp j-soft'>同一枚连载标签</span>
            <span className='j-stamp j-soft'>{`攒够 ${min} 话`}</span>
            <span className='j-stamp j-soft'>话数按发表日排</span>
          </div>
          <p className='mt-2'>
            一辑一张纸太薄，所以册子里是「一话一张纸」连着排；这里列的是辑，不是话。
          </p>
        </StickyNote>
        <StickyNote title='逐话清单在归档'>
          <div className='j-hand text-[18px]'>
            <SmartLink href='/archive'>归档右栏那张「连载」便条 →</SmartLink>
          </div>
        </StickyNote>
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ *
 * 连载册 /series/[name]：把一条线印成一辑
 * 规格见 design-system/journal/MASTER.md「连载册」节
 * ------------------------------------------------------------------ */

function LayoutSeries(props) {
  const { posts = [], series = '' } = props
  const books = useMemo(() => seriesBooks(posts), [posts])
  const book = books.find(b => b.name === series)
  const numbers = useMemo(
    () => (j('JOURNAL_PAGE_NUMBERS', true) ? pageNumbers(posts) : new Map()),
    [posts]
  )
  const readMarks = useReadMarks()

  if (!j('JOURNAL_SERIES_BOOK', true)) return null

  const at = books.findIndex(b => b.name === series)
  const prev = at > 0 ? books[at - 1] : null
  const next = at > -1 && at < books.length - 1 ? books[at + 1] : null
  const empty = !book
  const marks = empty
    ? new Map()
    : markCounts(book.posts.map(({ post }) => post))
  const rows = [
    ['共几话', `${book?.count || 0} 话`],
    ['第一话', book?.first ? mdOf(book.first) : '--.--'],
    ['末话', book?.last ? mdOf(book.last) : '--.--'],
    ['跨的年份', book?.years.length ? book.years.join(' · ') : '没有日期']
  ]

  return (
    <main className='j-shell grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_280px]'>
      <div>
        <h1 className='j-marker text-[48px] leading-none md:text-[58px]'>
          {series || '这条线'}
        </h1>
        <div className='max-w-[20ch]'>
          <HandRule />
        </div>
        <p className='j-print j-soft mt-2'>
          {empty
            ? '这条线还没攒成一册'
            : `共 ${book.count} 话 · 从第 1 话往下翻`}
        </p>

        {empty ? (
          <div className='j-slip j-tape-single mt-9 px-6 py-10 text-center'>
            <p className='j-hand j-blue text-[22px]'>这条线还没攒成一册。</p>
            <p className='j-print j-soft mt-2 text-[15px]'>
              本站攒得起的册是：
              {books.map(b => b.name).join('、') || '还没有一条线凑够两话'}
            </p>
          </div>
        ) : (
          <div className='j-series-thread mt-9'>
            {book.posts.map(({ post, slug }, i) => (
              <div key={post?.id || slug} className='j-series-item'>
                <span className='j-series-no j-stamp j-soft'>
                  {`第 ${i + 1} 话`}
                </span>
                <PostSlip
                  post={post}
                  pageNo={numbers.get(post?.id || slug)}
                  readPct={pctOf(readMarks, post)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {!empty && (
        <div className='j-tilt-slow grid content-start gap-7'>
          <StickyNote title={`${series} 这一辑`}>
            <div className='j-legend-stats'>
              {rows.map(([name, value]) => (
                <div key={name}>
                  <span className='j-stamp j-soft'>{name}</span>
                  <span className='j-hand ml-2 text-[18px]'>{value}</span>
                </div>
              ))}
            </div>
            <div className='mt-3 grid gap-1'>
              {usedMarks(marks).map(item => (
                <span key={item.name} className='j-stamp j-soft'>
                  {`${item.name} · ${item.n} 张`}
                </span>
              ))}
            </div>
          </StickyNote>
          <StickyNote title='相邻的辑' className='j-book-nav'>
            <div className='j-hand flex flex-wrap gap-3 text-[18px]'>
              {prev && (
                <SmartLink href={prev.href}>{`← ${prev.name}`}</SmartLink>
              )}
              {next && (
                <SmartLink href={next.href}>{`${next.name} →`}</SmartLink>
              )}
              {!prev && !next && (
                <span className='j-print text-[15px]'>这本子只攒了一辑</span>
              )}
            </div>
            {/* 回程：读完一辑想知道还有哪几辑，不必跳回归档页 */}
            <div className='mt-2'>
              <SmartLink href='/series' className='j-stamp j-soft whitespace-nowrap'>
                册子目录 →
              </SmartLink>
            </div>
          </StickyNote>
          <div className='j-note j-book-nav p-5'>
            <div className='j-stamp'>打印这一辑</div>
            <p className='j-print mt-2 text-[15px] leading-7'>
              一话一张纸，顺着铅笔线往下排；屏幕上是连着滚的一趟。
            </p>
          </div>
        </div>
      )}
    </main>
  )
}

function BigTapedPaper({ children }) {
  return (
    <main className='j-shell grid min-h-[60vh] place-items-center py-16'>
      <div className='j-slip j-tape w-full max-w-[640px] px-6 py-12 text-center md:px-12'>
        {children}
      </div>
    </main>
  )
}

function Layout404(props) {
  const { locale } = useGlobal()
  return (
    <BigTapedPaper>
      <div className='j-marker text-[92px] leading-[0.9] md:text-[128px]'>
        404
      </div>
      <p className='j-hand j-blue text-[22px]'>
        {j('JOURNAL_404_HEADLINE', '这一页被我撕掉了。')}
      </p>
      <p className='j-print j-soft mx-auto mt-3 max-w-[34ch] text-[15px]'>
        {j('JOURNAL_404_TEXT', '')}
      </p>

      <div className='j-tilt-group mt-8 flex flex-wrap justify-center gap-5'>
        <SmartLink href='/' className='j-btn j-btn-yellow'>
          <span className='j-circle inline-block'>
            <RedCircle label='回首页' />
          </span>
          <ArrowRight />
        </SmartLink>
        <SmartLink href='/archive' className='j-btn'>
          看看归档
          <ArrowRight />
        </SmartLink>
        <SmartLink href='/search' className='j-btn'>
          搜点什么
          <ArrowRight />
        </SmartLink>
      </div>

      <div className='j-hand j-red mt-8 text-[17px]'>这里最安全</div>

      {props?.posts?.length > 0 && (
        <div className='mt-10 text-left'>
          <div className='j-note mb-5 inline-block px-4 py-2'>
            <span className='j-hand text-[19px]'>最近还在写的三篇</span>
          </div>
          <div className='j-tilt-group grid gap-5'>
            {props.posts.slice(0, 3).map((post, i) => (
              <PostSlip key={post?.id || i} post={post} compact />
            ))}
          </div>
        </div>
      )}
      <span className='sr-only'>{locale?.NAV?.PAGE_NOT_FOUND}</span>
    </BigTapedPaper>
  )
}

const LayoutAuthShell = ({ children }) => (
  <BigTapedPaper>
    <div className='text-left'>{children}</div>
  </BigTapedPaper>
)

const LayoutAuth = props => (
  <LayoutAuthShell>
    <NotionPage post={props?.post} />
  </LayoutAuthShell>
)

const LayoutSignIn = props => (
  <LayoutAuthShell>
    <NotionPage post={props?.post} />
  </LayoutAuthShell>
)

const LayoutSignUp = props => (
  <LayoutAuthShell>
    <NotionPage post={props?.post} />
  </LayoutAuthShell>
)

const LayoutDashboard = props => (
  <LayoutAuthShell>
    <NotionPage post={props?.post} />
  </LayoutAuthShell>
)

export {
  Layout404,
  LayoutArchive,
  LayoutAuth,
  LayoutBase,
  LayoutCategoryIndex,
  LayoutDashboard,
  LayoutIndex,
  LayoutLegend,
  LayoutPlog,
  LayoutPostList,
  LayoutSearch,
  LayoutSeries,
  LayoutSeriesIndex,
  LayoutSignIn,
  LayoutSignUp,
  LayoutSlug,
  LayoutTagIndex,
  LayoutYearbook,
  // 移动端目录抽屉的判据：导出只为让护栏能直接渲染它，站内没有第二个调用方
  ArticleToc,
  CONFIG as THEME_CONFIG,
  // 「往年的今天」「连载」「年刊」的判据：导出只为让护栏能直接问它们，站内没有第二个调用方
  echoYears,
  localDay,
  seriesOf,
  seriesGroups,
  seriesBooks,
  tagLabel,
  bookYears,
  yearMonths,
  yearStats
}
