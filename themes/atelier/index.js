import { AdSlot } from '@/components/GoogleAdsense'
import NotionIcon from '@/components/NotionIcon'
import NotionPage from '@/components/NotionPage'
import replaceSearchResult from '@/components/Mark'
import SmartLink from '@/components/SmartLink'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isBrowser } from '@/lib/utils'
import { formatDateFmt } from '@/lib/utils/formatDate'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { uuidToId } from 'notion-utils'
import { useEffect, useMemo, useRef, useState } from 'react'
import CONFIG from './config'
import { Style } from './style'

const AlgoliaSearchModal = dynamic(
  () => import('@/components/AlgoliaSearchModal'),
  { ssr: false }
)
const Comment = dynamic(() => import('@/components/Comment'), { ssr: false })
const ShareBar = dynamic(() => import('@/components/ShareBar'), { ssr: false })
const ArticleLock = dynamic(
  () => import('@/themes/simple/components/ArticleLock'),
  {
    ssr: false
  }
)
const RecommendPosts = dynamic(
  () => import('@/themes/simple/components/RecommendPosts'),
  { ssr: false }
)
const WWAds = dynamic(() => import('@/components/WWAds'), { ssr: false })

const textLines = value => String(value || '').split('\n')

const postDate = post =>
  post?.date?.start_date ||
  (post?.publishDate ? formatDateFmt(post.publishDate, 'yyyy-MM-dd') : '') ||
  post?.createdTime ||
  ''

const postMonth = post => {
  const date = postDate(post)
  if (!date) return 'NOW'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date.slice(5, 7) || 'NOW'
  return parsed.toLocaleString('en-US', { month: 'short' }).toUpperCase()
}

const postDay = post => {
  const date = postDate(post)
  if (!date) return '01'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date.slice(-2) || '01'
  return String(parsed.getDate()).padStart(2, '0')
}

const postHref = post => {
  if (!post) return '/'
  if (post.href) return post.href
  if (post.slug) return `/${post.slug}`
  if (post.id) return `/${post.id}`
  return '/'
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const height =
        document.documentElement.scrollHeight - window.innerHeight || 1
      setProgress(Math.min(100, Math.max(0, (scrollTop / height) * 100)))
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
      className='atelier-progress'
      style={{ '--atelier-progress': `${progress}%` }}
    />
  )
}

function TopBar(props) {
  const { locale } = useGlobal()
  const links = [
    {
      name: locale?.NAV?.ARCHIVE || 'Archive',
      href: '/archive',
      show: siteConfig('ATELIER_MENU_ARCHIVE', null, CONFIG)
    },
    {
      name: locale?.COMMON?.CATEGORY || 'Category',
      href: '/category',
      show: siteConfig('ATELIER_MENU_CATEGORY', null, CONFIG)
    },
    {
      name: locale?.COMMON?.TAGS || 'Tags',
      href: '/tag',
      show: siteConfig('ATELIER_MENU_TAG', null, CONFIG)
    }
  ].filter(link => link.show)

  const customLinks = siteConfig('CUSTOM_MENU')
    ? props.customMenu
    : props.customNav
  const navLinks = customLinks?.length ? customLinks : links

  return (
    <header className='atelier-shell atelier-topbar atelier-hard mt-8 flex min-h-[74px] items-center justify-between gap-4 px-5 md:px-8'>
      <SmartLink
        href='/'
        className='flex flex-col md:flex-row md:items-end md:gap-5'
      >
        <span className='text-2xl font-black leading-none'>
          {siteConfig('ATELIER_TITLE', null, CONFIG)}
        </span>
        <span className='font-mono text-[11px] font-black leading-none md:pb-1'>
          {siteConfig('ATELIER_SUBTITLE', null, CONFIG)}
        </span>
      </SmartLink>
      <nav className='hidden items-center gap-7 md:flex'>
        {navLinks?.map(link => (
          <SmartLink key={link.href || link.name} href={link.href || '/'}>
            <span className='atelier-nav-link'>{link.name}</span>
          </SmartLink>
        ))}
        <SmartLink
          href='/search'
          className='border-2 border-[var(--atelier-ink)] bg-[var(--atelier-acid)] px-7 py-3 font-black text-[var(--atelier-ink)]'
        >
          Search
        </SmartLink>
      </nav>
    </header>
  )
}

function KnowledgeGraph() {
  return (
    <section className='atelier-graph-panel atelier-hard w-full p-5 lg:w-[446px]'>
      <div className='atelier-graph-canvas h-[270px] border-[3px] border-[var(--atelier-ink)]'>
        <svg viewBox='0 0 398 270' className='relative z-10 h-full w-full'>
          <g fill='none' strokeWidth='3'>
            <path
              className='atelier-wire'
              d='M64 82L182 58L294 114L208 204L122 204Z'
              stroke='#39d0c8'
            />
            <path
              className='atelier-wire'
              d='M182 58L208 204M64 82L122 204M122 204L294 114'
              stroke='#d8ff4f'
            />
          </g>
          <circle
            className='atelier-node'
            cx='64'
            cy='82'
            r='18'
            fill='#39d0c8'
          />
          <circle
            className='atelier-node'
            cx='182'
            cy='58'
            r='24'
            fill='#d8ff4f'
          />
          <circle
            className='atelier-node'
            cx='294'
            cy='114'
            r='20'
            fill='#ff6b4a'
          />
          <circle
            className='atelier-node'
            cx='122'
            cy='204'
            r='22'
            fill='#8e6cff'
          />
          <circle
            className='atelier-node'
            cx='208'
            cy='204'
            r='16'
            fill='#fff8e8'
          />
        </svg>
      </div>
      <div className='mt-7'>
        <div className='font-mono text-xs font-black tracking-widest'>
          CURRENT CLUSTERS
        </div>
        <h2 className='mt-3 font-serif text-3xl font-black leading-tight md:text-[34px]'>
          AI Coding / Frontend Systems
        </h2>
        <p className='mt-4 text-base leading-7'>
          用图谱、标签和专题线索组织长期写作。
        </p>
        <div className='mt-5 flex gap-3 font-mono text-xs font-black'>
          <span className='border-2 border-[var(--atelier-ink)] bg-[var(--atelier-cyan)] px-4 py-2'>
            LIVE NOTES
          </span>
          <span className='border-2 border-[var(--atelier-ink)] bg-[var(--atelier-acid)] px-4 py-2'>
            TOPIC MAP
          </span>
        </div>
      </div>
    </section>
  )
}

function Hero() {
  return (
    <section className='atelier-shell grid gap-12 py-14 lg:grid-cols-[1fr_446px] lg:items-center lg:py-20'>
      <div>
        <div className='atelier-eyebrow'>
          {siteConfig('ATELIER_HERO_EYEBROW', null, CONFIG)}
        </div>
        <h1 className='atelier-hero-title mt-8'>
          {textLines(siteConfig('ATELIER_HERO_TITLE', null, CONFIG)).map(
            line => (
              <span key={line} className='block'>
                {line}
              </span>
            )
          )}
        </h1>
        <div className='atelier-highlight mt-7' />
        <p className='mt-8 max-w-3xl text-xl leading-9 text-[var(--atelier-muted)] md:text-[22px]'>
          {siteConfig('ATELIER_HERO_DESCRIPTION', null, CONFIG)}
        </p>
        <div className='mt-11 flex flex-wrap gap-6'>
          <SmartLink href='/archive' className='atelier-primary-button'>
            {siteConfig('ATELIER_PRIMARY_CTA', null, CONFIG)}
          </SmartLink>
          <SmartLink href='/tag' className='atelier-secondary-button'>
            {siteConfig('ATELIER_SECONDARY_CTA', null, CONFIG)}
          </SmartLink>
        </div>
      </div>
      <KnowledgeGraph />
    </section>
  )
}

function TopicMarquee({ posts = [] }) {
  const tags = Array.from(
    new Set(posts.flatMap(post => post?.tags || []).filter(Boolean))
  ).slice(0, 12)
  const items = tags.length
    ? tags
    : ['Next.js', 'UX', 'Architecture', 'AI Coding']
  const loop = [...items, ...items]

  return (
    <div className='overflow-hidden border-y border-[var(--atelier-line)] py-4'>
      <div className='atelier-marquee font-mono text-sm font-black uppercase text-[var(--atelier-acid)]'>
        {loop.map((tag, index) => (
          <span key={`${tag}-${index}`} className='mx-5'>
            #{tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function PostCard({ post, index }) {
  return (
    <article
      className='atelier-card atelier-stagger min-h-[240px] p-6'
      style={{ animationDelay: `${Math.min(index, 8) * 90}ms` }}
    >
      <SmartLink
        href={postHref(post)}
        className='block h-full text-[var(--atelier-ink)]'
      >
        <div className='font-mono text-xs font-black uppercase'>
          {index === 0 ? 'FEATURED' : 'RECENT'} /{' '}
          {String(index + 1).padStart(2, '0')}
        </div>
        <h2 className='mt-5 font-serif text-3xl font-black leading-tight md:text-[38px]'>
          {siteConfig('POST_TITLE_ICON') && <NotionIcon icon={post.pageIcon} />}
          {post.title}
        </h2>
        <p className='mt-6 line-clamp-3 text-base font-semibold leading-7'>
          {post.summary}
        </p>
        <div className='mt-7 flex flex-wrap gap-3 font-mono text-xs font-black uppercase'>
          <span>
            {postMonth(post)} {postDay(post)}
          </span>
          {post?.tags?.slice(0, 2).map(tag => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </SmartLink>
    </article>
  )
}

function TopicRadar({ posts = [] }) {
  const tags = Array.from(
    new Set(posts.flatMap(post => post?.tags || []).filter(Boolean))
  ).slice(0, 4)
  const label = tags.length ? tags.join(' / ') : 'ARCH / UX / AI / NOTES'

  return (
    <aside className='atelier-radar atelier-card min-h-[240px] p-7'>
      <div className='font-mono text-xs font-black'>TOPIC RADAR</div>
      <svg viewBox='0 0 240 126' className='mt-5 h-32 w-full'>
        <circle
          cx='88'
          cy='66'
          r='38'
          fill='none'
          stroke='#11100e'
          strokeWidth='2'
        />
        <circle
          cx='88'
          cy='66'
          r='62'
          fill='none'
          stroke='#11100e'
          strokeWidth='2'
          opacity='0.42'
        />
        <path
          className='atelier-radar-shape'
          d='M88 66L142 31L192 86L99 119L37 92Z'
          fill='#39d0c8'
          opacity='0.84'
          stroke='#11100e'
          strokeWidth='4'
        />
      </svg>
      <div className='mt-5 font-mono text-xs font-black uppercase leading-6'>
        {label}
      </div>
    </aside>
  )
}

function BlogListPage(props) {
  const { page = 1, postCount = 0 } = props
  const posts = props.posts?.length
    ? props.posts
    : props.latestPosts?.length
      ? props.latestPosts
      : props.allPages || []
  const router = useRouter()
  const { NOTION_CONFIG } = useGlobal()
  const postsPerPage = siteConfig('POSTS_PER_PAGE', null, NOTION_CONFIG)
  const totalPage = Math.ceil((postCount || posts.length) / postsPerPage)
  const currentPage = +page
  const showPrev = currentPage > 1
  const showNext = page < totalPage
  const pagePrefix = router.asPath
    .split('?')[0]
    .replace(/\/page\/[1-9]\d*/, '')
    .replace(/\/$/, '')
    .replace('.html', '')
  const showAds = siteConfig('ATELIER_POST_AD_ENABLE', false, CONFIG)

  return (
    <section className='atelier-shell pb-24'>
      <div className='mb-9 font-mono text-sm font-black uppercase tracking-[0.18em] text-[var(--atelier-coral)]'>
        Latest Writing
      </div>
      <div id='posts-wrapper' className='grid gap-8 lg:grid-cols-3'>
        {posts?.length > 0 ? (
          posts.map((post, index) => (
            <div key={post.id || post.slug || index}>
              {showAds && (index + 1) % 3 === 0 && <AdSlot type='in-article' />}
              <PostCard post={post} index={index} />
            </div>
          ))
        ) : (
          <div className='atelier-card bg-[var(--atelier-cream)] p-7 text-[var(--atelier-ink)] lg:col-span-2'>
            <div className='font-mono text-xs font-black uppercase'>
              No posts loaded
            </div>
            <h2 className='mt-4 font-serif text-4xl font-black'>
              没有拿到文章列表
            </h2>
            <p className='mt-5 text-base font-semibold leading-7'>
              请检查 Notion 数据库视图是否公开，或等待开发服务重新拉取数据。
            </p>
          </div>
        )}
        <TopicRadar posts={posts} />
      </div>

      <div className='mt-14 flex justify-between font-mono text-sm font-black uppercase'>
        <SmartLink
          href={{
            pathname:
              currentPage - 1 === 1
                ? `${pagePrefix}/`
                : `${pagePrefix}/page/${currentPage - 1}`,
            query: router.query.s ? { s: router.query.s } : {}
          }}
          className={`${showPrev ? 'visible' : 'invisible pointer-events-none'} atelier-secondary-button min-h-[48px]`}
        >
          Newer Posts
        </SmartLink>
        <SmartLink
          href={{
            pathname: `${pagePrefix}/page/${currentPage + 1}`,
            query: router.query.s ? { s: router.query.s } : {}
          }}
          className={`${showNext ? 'visible' : 'invisible pointer-events-none'} atelier-primary-button min-h-[48px]`}
        >
          Older Posts
        </SmartLink>
      </div>
    </section>
  )
}

function LayoutBase(props) {
  const { children } = props
  const showProgress = siteConfig('ATELIER_SHOW_READING_PROGRESS', null, CONFIG)
  const searchModal = useRef(null)

  return (
    <div
      id='theme-atelier'
      className={`${siteConfig('FONT_STYLE')} min-h-screen`}
    >
      <Style />
      {showProgress && <ReadingProgress />}
      <TopBar {...props} />
      {children}
      <Footer />
      <AlgoliaSearchModal cRef={searchModal} {...props} />
    </div>
  )
}

function LayoutIndex(props) {
  return (
    <>
      <Hero />
      <TopicMarquee posts={props.posts} />
      <BlogListPage {...props} />
    </>
  )
}

function LayoutPostList(props) {
  return (
    <>
      <TopicMarquee posts={props.posts} />
      <BlogListPage {...props} />
    </>
  )
}

function LayoutSearch(props) {
  const { keyword } = props

  useEffect(() => {
    if (isBrowser) {
      replaceSearchResult({
        doms: document.getElementById('posts-wrapper'),
        search: keyword,
        target: {
          element: 'span',
          className: 'bg-[var(--atelier-acid)] text-[var(--atelier-ink)]'
        }
      })
    }
  }, [keyword])

  return <LayoutPostList {...props} />
}

function ArticleHeader({ post }) {
  return (
    <header className='mb-10'>
      <div className='font-mono text-sm font-black uppercase text-[var(--atelier-coral)]'>
        {post?.type || 'Post'} / {postDate(post)}
      </div>
      <h1 className='mt-5 font-serif text-5xl font-black leading-tight md:text-7xl'>
        {siteConfig('POST_TITLE_ICON') && <NotionIcon icon={post?.pageIcon} />}
        {post?.title}
      </h1>
      <div className='mt-7 flex flex-wrap gap-3 font-mono text-xs font-black uppercase'>
        {post?.category && (
          <SmartLink
            href={`/category/${post.category}`}
            className='border-2 border-[var(--atelier-ink)] bg-[var(--atelier-cyan)] px-3 py-2 text-[var(--atelier-ink)]'
          >
            {post.category}
          </SmartLink>
        )}
        {post?.tags?.map(tag => (
          <SmartLink
            key={tag}
            href={`/tag/${tag}`}
            className='border-2 border-[var(--atelier-ink)] bg-[var(--atelier-acid)] px-3 py-2 text-[var(--atelier-ink)]'
          >
            #{tag}
          </SmartLink>
        ))}
      </div>
    </header>
  )
}

function ArticleToc({ post }) {
  if (!post?.toc?.length) return null
  return (
    <aside className='atelier-toc sticky top-8 hidden max-h-[calc(100vh-4rem)] overflow-y-auto p-5 lg:block'>
      <div className='mb-4 font-mono text-xs font-black text-[var(--atelier-acid)]'>
        ON THIS NOTE
      </div>
      <nav className='space-y-3 text-sm'>
        {post.toc.map(item => {
          const id = uuidToId(item.id)
          return (
            <a
              key={id}
              href={`#${id}`}
              className='block transition-colors'
              style={{ paddingLeft: item.indentLevel * 14 }}
            >
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
    <section className='mt-12 grid gap-5 md:grid-cols-2'>
      {prev && (
        <SmartLink
          href={`/${prev.slug}`}
          className='atelier-secondary-button min-h-[72px] justify-start'
        >
          ← {prev.title}
        </SmartLink>
      )}
      {next && (
        <SmartLink
          href={`/${next.slug}`}
          className='atelier-primary-button min-h-[72px] justify-start'
        >
          {next.title} →
        </SmartLink>
      )}
    </section>
  )
}

function LayoutSlug(props) {
  const { post, lock, validPassword, prev, next, recommendPosts } = props
  const { fullWidth } = useGlobal()

  return (
    <main className='atelier-shell grid gap-8 py-14 lg:grid-cols-[minmax(0,1fr)_280px]'>
      {lock && <ArticleLock validPassword={validPassword} />}
      {!lock && post && (
        <>
          <article
            className={`atelier-article px-5 py-8 md:px-10 md:py-12 ${fullWidth ? '' : 'max-w-5xl'}`}
          >
            <ArticleHeader post={post} />
            <WWAds orientation='horizontal' className='w-full' />
            <div id='article-wrapper'>
              <NotionPage post={post} />
            </div>
            <ShareBar post={post} />
            <AdSlot type='in-article' />
            {post?.type === 'Post' && (
              <>
                <ArticleAround prev={prev} next={next} />
                <RecommendPosts recommendPosts={recommendPosts} />
              </>
            )}
            <Comment frontMatter={post} />
          </article>
          <ArticleToc post={post} />
        </>
      )}
    </main>
  )
}

function LayoutArchive(props) {
  const { posts = [] } = props
  const grouped = useMemo(() => {
    return posts.reduce((acc, post) => {
      const year = new Date(postDate(post)).getFullYear() || 'Now'
      acc[year] = acc[year] || []
      acc[year].push(post)
      return acc
    }, {})
  }, [posts])

  return (
    <main className='atelier-shell py-14'>
      <h1 className='font-serif text-6xl font-black'>Archive</h1>
      <div className='mt-10 space-y-10'>
        {Object.entries(grouped)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, yearPosts]) => (
            <section key={year} className='atelier-article p-7'>
              <h2 className='font-mono text-2xl font-black'>{year}</h2>
              <div className='mt-6 grid gap-4'>
                {yearPosts.map(post => (
                  <SmartLink
                    key={post.id}
                    href={postHref(post)}
                    className='flex flex-wrap items-center justify-between gap-3 border-t-2 border-[var(--atelier-ink)] py-4 text-[var(--atelier-ink)]'
                  >
                    <span className='font-serif text-2xl font-black'>
                      {post.title}
                    </span>
                    <span className='font-mono text-xs font-black'>
                      {postDate(post)}
                    </span>
                  </SmartLink>
                ))}
              </div>
            </section>
          ))}
      </div>
    </main>
  )
}

function OptionGrid({ title, options = [], type }) {
  return (
    <main className='atelier-shell py-14'>
      <h1 className='font-serif text-6xl font-black'>{title}</h1>
      <div className='mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {options.map(option => (
          <SmartLink
            key={option.name}
            href={`/${type}/${encodeURIComponent(option.name)}`}
            className='atelier-card bg-[var(--atelier-cream)] p-7 text-[var(--atelier-ink)]'
          >
            <div className='font-mono text-xs font-black uppercase'>{type}</div>
            <div className='mt-4 font-serif text-4xl font-black'>
              {option.name}
            </div>
            <div className='mt-5 font-mono text-sm font-black'>
              {option.count || 0} POSTS
            </div>
          </SmartLink>
        ))}
      </div>
    </main>
  )
}

function LayoutCategoryIndex(props) {
  return (
    <OptionGrid
      title='Categories'
      options={props.categoryOptions}
      type='category'
    />
  )
}

function LayoutTagIndex(props) {
  return <OptionGrid title='Tags' options={props.tagOptions} type='tag' />
}

function Layout404() {
  return (
    <main className='atelier-shell py-24'>
      <section className='atelier-card bg-[var(--atelier-coral)] p-10 text-[var(--atelier-ink)]'>
        <div className='font-mono text-sm font-black'>404 / LOST NODE</div>
        <h1 className='mt-5 font-serif text-7xl font-black'>
          这条知识连线断开了
        </h1>
        <SmartLink href='/' className='atelier-secondary-button mt-10'>
          Back Home
        </SmartLink>
      </section>
    </main>
  )
}

function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className='atelier-shell border-t border-[var(--atelier-line)] py-10 font-mono text-xs font-black uppercase text-[var(--atelier-muted)]'>
      <div className='flex flex-wrap justify-between gap-4'>
        <span>
          © {currentYear} {siteConfig('AUTHOR')}
        </span>
        <span>Built as a personal knowledge interface.</span>
      </div>
    </footer>
  )
}

export {
  Layout404,
  LayoutArchive,
  LayoutBase,
  LayoutCategoryIndex,
  LayoutIndex,
  LayoutPostList,
  LayoutSearch,
  LayoutSlug,
  LayoutTagIndex,
  CONFIG as THEME_CONFIG
}
