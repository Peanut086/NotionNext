import NotionIcon from '@/components/NotionIcon'
import NotionPage from '@/components/NotionPage'
import replaceSearchResult from '@/components/Mark'
import SmartLink from '@/components/SmartLink'
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
const ShareBar = dynamic(() => import('@/components/ShareBar'), { ssr: false })
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
  (post?.publishDate
    ? formatDateFmt(post.publishDate, 'yyyy-MM-dd')
    : '') ||
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

const monthName = post => {
  const d = new Date(postDate(post))
  if (Number.isNaN(d.getTime())) return '此刻'
  return `${d.getMonth() + 1} 月`
}

const postHref = post => {
  if (!post) return '/'
  if (post.href) return post.href
  if (post.slug) return `/${post.slug}`
  return `/${post.id}`
}

const isLocked = post => !!post?.password

const j = (key, fallback) => siteConfig(key, fallback, CONFIG)

/* ------------------------------------------------------------------ *
 * 手绘涂鸦：全部内联 SVG，不用 emoji、不发图片请求
 * ------------------------------------------------------------------ */

/** 出头的手绘横线 */
const HandRule = ({ red = false, className = '' }) => (
  <svg
    className={`j-rule ${red ? 'j-rule-red' : ''} ${className}`}
    viewBox='0 0 240 14'
    preserveAspectRatio='none'
    aria-hidden='true'>
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
    aria-hidden='true'>
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

/* ------------------------------------------------------------------ *
 * 通用纸片
 * ------------------------------------------------------------------ */

/** 一张胶带纸条式的文章条目；整块可点，标签仍各自可点 */
function PostSlip({ post, featured = false, compact = false }) {
  if (!post) return null
  const tags = post?.tags?.slice(0, 3) || []
  return (
    <article className='j-slip j-tape-single block px-5 py-4 md:px-6 md:py-5'>
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
        <span className='j-stamp-date j-stamp'>{stampMD(post)}</span>
        {isLocked(post) && (
          <span className='j-hand j-red flex items-center gap-1 text-[15px]'>
            <LockDoodle />
            加密
          </span>
        )}
        {post?.category && (
          <SmartLink
            href={`/category/${encodeURIComponent(post.category)}`}
            className='j-pill'>
            {post.category}
          </SmartLink>
        )}
        {tags.map(tag => (
          <SmartLink
            key={tag}
            href={`/tag/${encodeURIComponent(tag)}`}
            className='j-pill j-pill-yellow'>
            {tag}
          </SmartLink>
        ))}
        {featured && (
          <span className='j-stamp j-red' aria-hidden='false'>
            {j('JOURNAL_FEATURED_LABEL', '精选')}
          </span>
        )}
      </div>
    </article>
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
      name: locale?.NAV?.SEARCH || '搜索',
      href: '/search',
      show: j('JOURNAL_NAV_SEARCH', true)
    }
  ].filter(i => i.show)

  const extra = (siteConfig('CUSTOM_MENU') ? props.customMenu : props.customNav) || []
  // 自定义导航常与内置项重复（首页 / 搜索），按路径去重
  const navItems = [...items, ...extra].filter(
    (link, index, list) =>
      list.findIndex(l => (l.href || '/').split('?')[0] === (link.href || '/').split('?')[0]) ===
      index
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
          className='j-tilt-group -mb-[14px] flex flex-wrap items-center gap-1.5'>
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
                {...(active ? { 'aria-current': 'page' } : {})}>
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
            © {sinceYear === thisYear ? thisYear : `${sinceYear} – ${thisYear}`} ·
            第 {years} 年 · {j('JOURNAL_TITLE', '纸间手账')}
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
      )} min-h-screen`}>
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

  return (
    <main className='j-shell'>
      <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]'>
        <div>
          <Masthead />
          <section className='j-section' aria-label={noteText}>
            <BallpointNote>{noteText}</BallpointNote>
            <div className='j-tilt-group mt-6 grid gap-7'>
              {recent.map((post, index) => (
                <PostSlip
                  key={post?.id || post?.slug || index}
                  post={post}
                  featured={index === 0}
                />
              ))}
            </div>
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
            style={{ fontSize: `${size}px` }}>
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
  const hrefOf = n =>
    n <= 1 ? `${prefix}/` : `${prefix}/page/${n}`

  if (total <= 1) return null

  // 只展示当前页附近的小方块，避免几十页时贴满一整排胶带
  const first = Math.max(1, Math.min(current - 2, total - 4))
  const pages = []
  for (let n = first; n < first + 5 && n <= total; n++) pages.push(n)

  return (
    <nav
      className='j-tilt-group mt-10 flex flex-wrap items-center gap-3'
      aria-label='分页'>
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
            {...(active ? { 'aria-current': 'page' } : {})}>
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
          className='j-hand j-soft inline-flex items-center gap-2 text-[17px]'>
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

function PostSlipGrid({ posts = [], empty }) {
  if (!posts.length) {
    return (
      <div className='j-shell'>
        <p className='j-hand j-blue mt-10 text-[21px]'>{empty}</p>
      </div>
    )
  }
  return (
    <div className='j-tilt-group mt-8 grid gap-7 md:grid-cols-2'>
      {posts.map((post, i) => (
        <PostSlip key={post?.id || i} post={post} featured={i === 0} />
      ))}
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
              }`}>
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
        <form
          onSubmit={onSubmit}
          className='j-slip j-tape-single flex items-center gap-3 px-4 py-3'>
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
        </form>

        <div className='j-stamp j-soft mt-4'>
          {keyword
            ? `找到 ${posts.length} 条结果 · 关键词「${keyword}」`
            : '还没有输入关键词'}
        </div>
      </div>

      <PostSlipGrid
        posts={posts}
        empty={j('JOURNAL_SEARCH_EMPTY', '没找到？试试更短的词')}
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
    <aside className='sticky top-8 hidden max-h-[calc(100vh-4rem)] overflow-y-auto pr-2 lg:block lg:pt-12'>
      <div className='j-stamp j-red'>{j('JOURNAL_TOC_TITLE', '这一页的目录')}</div>
      <nav className='j-tilt-group mt-3 space-y-1.5'>
        {post.toc.map(item => {
          const id = uuidToId(item.id)
          const current = id === active
          return (
            <a
              key={id}
              href={`#${id}`}
              className={`j-hand block text-[16px] leading-7 ${
                current ? 'j-highlight j-blue' : 'j-soft'
              }`}
              style={{ marginLeft: (item.indentLevel || 0) * 12 }}
              aria-current={current ? 'location' : undefined}>
              {item.text}
            </a>
          )
        })}
      </nav>
    </aside>
  )
}

function ArticleAround({ prev, next }) {
  if (!prev && !next) return null
  return (
    <section className='j-tilt-slow mt-12 grid gap-7 md:grid-cols-2'>
      {prev && (
        <SmartLink
          href={postHref(prev)}
          className='j-slip j-hand flex items-center gap-3 px-4 py-4 text-[18px]'>
          <span className='inline-block rotate-180'>
            <ArrowRight />
          </span>
          {prev.title}
        </SmartLink>
      )}
      {next && (
        <SmartLink
          href={postHref(next)}
          className='j-slip j-slip-alt j-hand flex items-center justify-end gap-3 px-4 py-4 text-right text-[18px]'>
          {next.title}
          <ArrowRight />
        </SmartLink>
      )}
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

      <article className='j-slip j-tape px-5 py-8 md:px-10 md:py-12'>
        <header className='mb-8'>
          <div className='flex flex-wrap items-center gap-3'>
            <span className='j-stamp-date j-stamp'>{stampMD(post)}</span>
            <span className='j-stamp j-soft'>{stampYear(post)}</span>
            {post?.category && (
              <SmartLink
                href={`/category/${encodeURIComponent(post.category)}`}
                className='j-pill j-pill-yellow'>
                {post.category}
              </SmartLink>
            )}
            {post?.tags?.map(tag => (
              <SmartLink
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className='j-pill'>
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

        <ShareBar post={post} />

        <ArticleAround prev={prev} next={next} />
        {post?.type === 'Post' && recommendPosts?.length > 0 && (
          <RecommendPosts recommendPosts={recommendPosts} />
        )}

        <section className='mt-12'>
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
        <p className='j-print j-soft mt-2'>{j('JOURNAL_ARCHIVE_SUBTITLE', '')}</p>
        <div className='j-stamp j-soft mt-1'>共 {posts.length} 张纸</div>

        <div className='relative mt-9 pl-6'>
          <div className='absolute left-1 top-2 h-[calc(100%-1rem)] w-[2px] rotate-[0.4deg] bg-[var(--ink)] opacity-70' />
          {byYear.map(([year, items]) => (
            <section key={year} id={`archive-${year}`} className='relative mb-10 scroll-mt-24'>
              <span className='j-stamp-date j-stamp text-[15px]'>{year}</span>

              <ul className='j-tilt-group mt-4 space-y-5'>
                {items.map((post, i) => (
                  <li key={post?.id || i} className='relative'>
                    <span className='absolute -left-[26px] top-3 h-2.5 w-2.5 rounded-[40%_60%_50%_50%] border-2 border-[var(--ink)] bg-[var(--slip)]' />
                    <div className='j-slip j-tape-single flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3'>
                      <h2 className='j-hand order-1 text-[19px] md:order-none md:flex-1'>
                        <SmartLink href={postHref(post)} className='j-stretch'>
                          {post.title}
                        </SmartLink>
                      </h2>
                      <span className='j-stamp j-soft md:ml-auto'>
                        {stampMD(post)}
                      </span>
                      <span className='j-hand j-blue text-[15px]'>
                        {monthName(post)}
                      </span>
                      {post?.tags?.[0] && (
                        <SmartLink
                          href={`/tag/${encodeURIComponent(post.tags[0])}`}
                          className='j-pill j-pill-yellow relative z-[2]'>
                          {post.tags[0]}
                        </SmartLink>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
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
      <p className='j-print j-soft mt-2'>{j('JOURNAL_CATEGORY_SUBTITLE', '')}</p>

      <div className='j-tilt-group mt-9 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {options.map((c, i) => (
          <SmartLink
            key={c.name}
            href={`/category/${encodeURIComponent(c.name)}`}
            className={`j-slip j-tape-single block p-5 ${
              i === featured ? 'md:col-span-2' : ''
            }`}>
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
        <PostSlip
          post={(props.posts || [])[0]}
          compact
        />
      </div>
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
  LayoutPostList,
  LayoutSearch,
  LayoutSignIn,
  LayoutSignUp,
  LayoutSlug,
  LayoutTagIndex,
  CONFIG as THEME_CONFIG
}
