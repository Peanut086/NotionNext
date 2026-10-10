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
 * 判定集中在这一个函数，规格见 design-system/journal/MASTER.md
 * 「状态编码」节；PostSlip 只消费返回的有序数组
 * ------------------------------------------------------------------ */

const stateMarks = post => {
  if (!post || !j('JOURNAL_STATE_ENCODING', true)) return []

  const tags = post?.tags || []
  const topTag = siteConfig('TOP_TAG', '')
  const published = dayKey(post?.publishDate || post?.date?.start_date)
  const edited = dayKey(post?.lastEditedDate)
  // Notion 的 last_edited_time 改一个标点都会动，只认「隔了些天再回来改」
  const gapDays = (new Date(edited || 0) - new Date(published || 0)) / 86400000
  const revised = gapDays >= Number(j('JOURNAL_REVISED_DAYS', 7))

  return (
    [
      isLocked(post) && { key: 'locked', label: '加密' },
      topTag && tags.includes(topTag) && { key: 'pinned', label: '置顶' },
      tags.includes(j('JOURNAL_FEATURED_TAG', 'featured')) && {
        key: 'featured',
        label: j('JOURNAL_FEATURED_LABEL', '精选')
      },
      revised && { key: 'revised', label: '修订' },
      tags.includes(j('JOURNAL_PLOG_TAG', 'plog')) && {
        key: 'receipt',
        label: j('JOURNAL_PLOG_TITLE', 'plog')
      },
      !isLocked(post) &&
        (post?.pageCoverThumbnail || post?.pageCover) && {
          key: 'photo',
          label: '有图'
        }
    ]
      .filter(Boolean)
      // 一张纸条最多 3 个标记，超出按上面的书写顺序截断
      .slice(0, 3)
  )
}

/* ------------------------------------------------------------------ *
 * 一天一摊：同一天发的合成一张跨页
 * 规格见 design-system/journal/MASTER.md「一天一摊」节
 * ------------------------------------------------------------------ */

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
/** 一张胶带纸条式的文章条目；整块可点，标签仍各自可点 */
function PostSlip({ post, compact = false, hideDate = false }) {
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
            {tag}
          </SmartLink>
        ))}
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

/** 首页大抬头：手写站名 + 出头下划线 */
function Masthead() {
  const description = siteConfig('BLOG_DESCRIPTION')
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

  const renderSlip = post => (
    <PostSlip key={post?.id || post?.slug} post={post} hideDate={groupDays} />
  )

  return (
    <main className='j-shell'>
      <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]'>
        <div>
          <Masthead />
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
        return (
          <SmartLink
            key={tag.name}
            href={`/tag/${encodeURIComponent(tag.name)}`}
            className={`j-slip j-hand px-3 py-1.5 ${
              active ? 'j-circle' : ''
            } ${tag.count > max * 0.7 ? 'j-pill-yellow' : ''}`}
            style={{ fontSize: `${size}px` }}
          >
            {active ? <RedCircle label={tag.name} /> : tag.name}
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
          <PostSlip key={post?.id || i} post={post} />
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
              {t.name}
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

  if (!post?.toc?.length || !j('JOURNAL_SHOW_TOC', true)) return null

  return (
    <aside className='sticky top-8 hidden max-h-[calc(100vh-4rem)] overflow-y-auto py-12 pl-3 pr-2 lg:block'>
      <div className='j-stamp j-red pl-4'>
        {j('JOURNAL_TOC_TITLE', '这一页的目录')}
      </div>
      <nav
        className='j-tabs mt-4'
        aria-label={j('JOURNAL_TOC_TITLE', '这一页的目录')}
      >
        {post.toc.map(item => {
          const id = uuidToId(item.id)
          const current = id === active
          return (
            <a
              key={id}
              href={`#${id}`}
              className={`j-tab ${current ? 'j-tab-current' : ''}`}
              style={{ '--j-ind': `${(item.indentLevel || 0) * 12}px` }}
              aria-current={current ? 'location' : undefined}
            >
              <span className='j-tab-text'>{item.text}</span>
              {current && <HandRule red className='j-tab-slash' />}
            </a>
          )
        })}
      </nav>
    </aside>
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

function ShareNote({ post }) {
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
      </span>
    </section>
  )
}

function LayoutSlug(props) {
  const { post, lock, validPassword, prev, next, recommendPosts } = props
  const { locale } = useGlobal()

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

  return (
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
                {tag}
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

        <ShareNote post={post} />

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
  )
}

/* ---------- 归档 ---------- */

function LayoutArchive(props) {
  const { posts = [] } = props

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
                          className='j-slip j-tape-single flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3'
                        >
                          <h2 className='j-hand flex-1 text-[19px]'>
                            <SmartLink
                              href={postHref(post)}
                              className='j-stretch'
                            >
                              {post.title}
                            </SmartLink>
                          </h2>
                          {post?.tags?.[0] && (
                            <SmartLink
                              href={`/tag/${encodeURIComponent(post.tags[0])}`}
                              className='j-pill j-pill-yellow relative z-[2]'
                            >
                              {post.tags[0]}
                            </SmartLink>
                          )}
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
          <div className='j-hand flex flex-wrap gap-3 text-[18px]'>
            {byYear.map(([year]) => (
              <a key={year} href={`#archive-${year}`}>
                {year}
              </a>
            ))}
          </div>
        </StickyNote>
        <div className='j-note p-5'>
          <div className='j-stamp'>本站统计</div>
          <div className='j-print mt-2 text-[15px]'>
            {posts.length} 篇文章 · {byYear.length} 个年份
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
              <SmartLink key={t.name} href={`/tag/${t.name}`}>
                {t.name}
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
  LayoutPlog,
  LayoutPostList,
  LayoutSearch,
  LayoutSignIn,
  LayoutSignUp,
  LayoutSlug,
  LayoutTagIndex,
  CONFIG as THEME_CONFIG
}
