/**
 *   CYBERPUNK 赛博朋克主题
 *  > 主题设计灵感来源于赛博朋克文化
 *  > 霓虹灯效果、故障艺术、未来科技感
 *  1. 开启方式 在blog.config.js 将主题配置为 `CYBERPUNK`
 */

import Comment from '@/components/Comment'
import { AdSlot } from '@/components/GoogleAdsense'
import { HashTag } from '@/components/HeroIcons'
import LazyImage from '@/components/LazyImage'
import LoadingCover from '@/components/LoadingCover'
import replaceSearchResult from '@/components/Mark'
import NotionPage from '@/components/NotionPage'
import ShareBar from '@/components/ShareBar'
import WWAds from '@/components/WWAds'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { loadWowJS } from '@/lib/plugins/wow'
import { isBrowser } from '@/lib/utils'
import { Transition } from '@headlessui/react'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import BlogPostArchive from './components/BlogPostArchive'
import BlogPostListPage from './components/BlogPostListPage'
import BlogPostListScroll from './components/BlogPostListScroll'
import CategoryBar from './components/CategoryBar'
import FloatTocButton from './components/FloatTocButton'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import LatestPostsGroup from './components/LatestPostsGroup'
import { NoticeBar } from './components/NoticeBar'
import PostAdjacent from './components/PostAdjacent'
import PostCopyright from './components/PostCopyright'
import PostHeader from './components/PostHeader'
import { PostLock } from './components/PostLock'
import PostRecommend from './components/PostRecommend'
import SearchNav from './components/SearchNav'
import SideRight from './components/SideRight'
import CONFIG from './config'
import { Style } from './style'
import AISummary from '@/components/AISummary'
import ArticleExpirationNotice from '@/components/ArticleExpirationNotice'
import CyberEffects from './components/CyberEffects'

const LayoutBase = props => {
  const { children, slotTop, className } = props

  const { fullWidth, isDarkMode } = useGlobal()
  const router = useRouter()

  const headerSlot = (
    <header>
      <Header {...props} />
      {router.route === '/' ? (
        <>
          <NoticeBar />
          <Hero {...props} />
        </>
      ) : null}
      {fullWidth ? null : <PostHeader {...props} isDarkMode={isDarkMode} />}
    </header>
  )

  const slotRight =
    router.route === '/404' || fullWidth ? null : <SideRight {...props} />

  const maxWidth = fullWidth ? 'max-w-[96rem] mx-auto' : 'max-w-[86rem]'

  const CYBERPUNK_HERO_BODY_REVERSE = siteConfig(
    'CYBERPUNK_HERO_BODY_REVERSE',
    false,
    CONFIG
  )
  const CYBERPUNK_LOADING_COVER = siteConfig('CYBERPUNK_LOADING_COVER', true, CONFIG)

  useEffect(() => {
    loadWowJS()
  }, [])

  return (
    <div
      id='theme-cyberpunk'
      className={`${siteConfig('FONT_STYLE')} bg-[#0a0a0f] dark:bg-[#050508] h-full min-h-screen flex flex-col scroll-smooth`}>
      <Style />
      <CyberEffects />

      {headerSlot}

      <main
        id='wrapper-outer'
        className={`flex-grow w-full ${maxWidth} mx-auto relative md:px-5`}>
        <div
          id='container-inner'
          className={`${CYBERPUNK_HERO_BODY_REVERSE ? 'flex-row-reverse' : ''} w-full mx-auto lg:flex justify-center relative z-10`}>
          <div className={`w-full h-auto ${className || ''}`}>
            {slotTop}
            {children}
          </div>

          <div className='lg:px-2'></div>

          <div className='hidden xl:block'>
            {slotRight}
          </div>
        </div>
      </main>

      <Footer />

      {CYBERPUNK_LOADING_COVER && <LoadingCover />}
    </div>
  )
}

const LayoutIndex = props => {
  return (
    <div id='post-outer-wrapper' className='px-5 md:px-0'>
      <CategoryBar {...props} />
      {siteConfig('POST_LIST_STYLE') === 'page' ? (
        <BlogPostListPage {...props} />
      ) : (
        <BlogPostListScroll {...props} />
      )}
    </div>
  )
}

const LayoutPostList = props => {
  return (
    <div id='post-outer-wrapper' className='px-5  md:px-0'>
      <CategoryBar {...props} />
      {siteConfig('POST_LIST_STYLE') === 'page' ? (
        <BlogPostListPage {...props} />
      ) : (
        <BlogPostListScroll {...props} />
      )}
    </div>
  )
}

const LayoutSearch = props => {
  const { keyword } = props
  const router = useRouter()
  const currentSearch = keyword || router?.query?.s

  useEffect(() => {
    if (currentSearch) {
      setTimeout(() => {
        replaceSearchResult({
          doms: document.getElementsByClassName('replace'),
          search: currentSearch,
          target: {
            element: 'span',
            className: 'text-[#ff2a6d] border-b border-dashed border-[#00fff9]'
          }
        })
      }, 100)
    }
  }, [])
  return (
    <div currentSearch={currentSearch}>
      <div id='post-outer-wrapper' className='px-5  md:px-0'>
        {!currentSearch ? (
          <SearchNav {...props} />
        ) : (
          <div id='posts-wrapper'>
            {siteConfig('POST_LIST_STYLE') === 'page' ? (
              <BlogPostListPage {...props} />
            ) : (
              <BlogPostListScroll {...props} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const LayoutArchive = props => {
  const { archivePosts } = props

  return (
    <div className='p-5 border border-[rgba(0,255,249,0.3)] max-w-6xl w-full bg-[rgba(10,10,20,0.85)] backdrop-blur-sm'>
      <CategoryBar {...props} border={false} />

      <div className='px-3'>
        {Object.keys(archivePosts).map(archiveTitle => (
          <BlogPostArchive
            key={archiveTitle}
            posts={archivePosts[archiveTitle]}
            archiveTitle={archiveTitle}
          />
        ))}
      </div>
    </div>
  )
}

const LayoutSlug = props => {
  const { post, lock, validPassword } = props
  const { locale, fullWidth } = useGlobal()

  const [hasCode, setHasCode] = useState(false)

  useEffect(() => {
    const hasCode = document.querySelectorAll('[class^="language-"]').length > 0
    setHasCode(hasCode)
  }, [])

  const commentEnable =
    siteConfig('COMMENT_TWIKOO_ENV_ID') ||
    siteConfig('COMMENT_WALINE_SERVER_URL') ||
    siteConfig('COMMENT_VALINE_APP_ID') ||
    siteConfig('COMMENT_GISCUS_REPO') ||
    siteConfig('COMMENT_CUSDIS_APP_ID') ||
    siteConfig('COMMENT_UTTERRANCES_REPO') ||
    siteConfig('COMMENT_GITALK_CLIENT_ID') ||
    siteConfig('COMMENT_WEBMENTION_ENABLE')

  const router = useRouter()
  const waiting404 = siteConfig('POST_WAITING_TIME_FOR_404') * 1000
  useEffect(() => {
    if (!post) {
      setTimeout(
        () => {
          if (isBrowser) {
            const article = document.querySelector(
              '#article-wrapper #notion-article'
            )
            if (!article) {
              router.push('/404').then(() => {
                console.warn('找不到页面', router.asPath)
              })
            }
          }
        },
        waiting404
      )
    }
  }, [post])
  return (
    <>
      <div
        className={`article h-full w-full ${fullWidth ? '' : 'xl:max-w-5xl'} ${hasCode ? 'xl:w-[73.15vw]' : ''} bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(0,255,249,0.3)] lg:hover:shadow-[0_0_30px_rgba(0,255,249,0.3)] lg:border rounded-none lg:px-2 lg:py-4 `}>
        {lock && <PostLock validPassword={validPassword} />}

        {!lock && post && (
          <div className='mx-auto md:w-full md:px-5'>
            <article
              id='article-wrapper'
              itemScope
              itemType='https://schema.org/Movie'>
              <section
                className='wow fadeInUp p-5 justify-center mx-auto'
                data-wow-delay='.2s'>
                <PostHeader {...props} />
                <ArticleExpirationNotice post={post} />
                <AISummary aiSummary={post.aiSummary} />
                <WWAds orientation='horizontal' className='w-full' />
                {post && <NotionPage post={post} />}
                <WWAds orientation='horizontal' className='w-full' />
              </section>

              <PostAdjacent {...props} />

              <ShareBar post={post} />
              {post?.type === 'Post' && (
                <div className='px-5'>
                  <PostCopyright {...props} />
                  <PostRecommend {...props} />
                </div>
              )}
            </article>

            {fullWidth ? null : (
              <div className={`${commentEnable && post ? '' : 'hidden'}`}>
                <hr className='my-4 border-dashed border-[rgba(0,255,249,0.3)]' />
                <div className='py-2'>
                  <AdSlot />
                </div>
                <div className='duration-200 overflow-x-auto px-5'>
                  <div className='text-2xl text-[#00fff9] cyber-glow-text'>
                    <i className='fas fa-comment mr-1' />
                    {locale.COMMON.COMMENTS}
                  </div>
                  <Comment frontMatter={post} className='' />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <FloatTocButton {...props} />
    </>
  )
}

const Layout404 = props => {
  const { onLoading, fullWidth } = useGlobal()
  return (
    <>
      <main
        id='wrapper-outer'
        className={`flex-grow ${fullWidth ? '' : 'max-w-4xl'} w-screen mx-auto px-5`}>
        <div id='error-wrapper' className={'w-full mx-auto justify-center'}>
          <Transition
            show={!onLoading}
            appear={true}
            enter='transition ease-in-out duration-700 transform order-first'
            enterFrom='opacity-0 translate-y-16'
            enterTo='opacity-100'
            leave='transition ease-in-out duration-300 transform'
            leaveFrom='opacity-100 translate-y-0'
            leaveTo='opacity-0 -translate-y-16'
            unmount={false}>
            <div className='error-content flex flex-col md:flex-row w-full mt-12 h-[30rem] md:h-96 justify-center items-center bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(0,255,249,0.3)] rounded-none'>
              <LazyImage
                className='error-img h-60 md:h-full p-4'
                src={
                  'https://bu.dusays.com/2023/03/03/6401a7906aa4a.gif'
                }></LazyImage>

              <div className='error-info flex-1 flex flex-col justify-center items-center space-y-4'>
                <h1 className='error-title font-extrabold md:text-9xl text-7xl text-[#00fff9] cyber-glitch-text'>
                  404
                </h1>
                <div className='text-[#e0e0e0]'>数据丢失，请尝试站内搜索</div>
                <SmartLink href='/'>
                  <button className='cyber-button'>
                    返回主页
                  </button>
                </SmartLink>
              </div>
            </div>

            <div className='mt-12'>
              <LatestPostsGroup {...props} />
            </div>
          </Transition>
        </div>
      </main>
    </>
  )
}

const LayoutCategoryIndex = props => {
  const { categoryOptions } = props
  const { locale } = useGlobal()

  return (
    <div id='category-outer-wrapper' className='mt-8 px-5 md:px-0'>
      <div className='text-4xl font-extrabold text-[#00fff9] mb-5 cyber-glow-text'>
        {locale.COMMON.CATEGORY}
      </div>
      <div
        id='category-list'
        className='duration-200 flex flex-wrap m-10 justify-center'>
        {categoryOptions?.map(category => {
          return (
            <SmartLink
              key={category.name}
              href={`/category/${category.name}`}
              passHref
              legacyBehavior>
              <div
                className={
                  'group mr-5 mb-5 flex flex-nowrap items-center border border-[rgba(0,255,249,0.3)] bg-[rgba(10,10,20,0.85)] text-2xl text-[#e0e0e0] hover:text-[#0a0a0f] px-4 cursor-pointer py-3 hover:bg-[#00fff9] transition-all hover:scale-110 duration-150 hover:shadow-[0_0_20px_#00fff9]'
                }>
                <HashTag className={'w-5 h-5 stroke-[#00fff9] stroke-2'} />
                {category.name}
                <div className='bg-[rgba(0,255,249,0.2)] ml-1 px-2 text-[#00fff9] group-hover:text-[#0a0a0f]'>
                  {category.count}
                </div>
              </div>
            </SmartLink>
          )
        })}
      </div>
    </div>
  )
}

const LayoutTagIndex = props => {
  const { tagOptions } = props
  const { locale } = useGlobal()

  return (
    <div id='tag-outer-wrapper' className='px-5 mt-8 md:px-0'>
      <div className='text-4xl font-extrabold text-[#ff00ff] mb-5 cyber-glow-text-pink'>
        {locale.COMMON.TAGS}
      </div>
      <div
        id='tag-list'
        className='duration-200 flex flex-wrap space-x-5 space-y-5 m-10 justify-center'>
        {tagOptions.map(tag => {
          return (
            <SmartLink
              key={tag.name}
              href={`/tag/${tag.name}`}
              passHref
              legacyBehavior>
              <div
                className={
                  'group flex flex-nowrap items-center border border-[rgba(255,0,255,0.3)] bg-[rgba(10,10,20,0.85)] text-2xl text-[#e0e0e0] hover:text-[#0a0a0f] px-4 cursor-pointer py-3 hover:bg-[#ff00ff] transition-all hover:scale-110 duration-150 hover:shadow-[0_0_20px_#ff00ff]'
                }>
                <HashTag className={'w-5 h-5 stroke-[#ff00ff] stroke-2'} />
                {tag.name}
                <div className='bg-[rgba(255,0,255,0.2)] ml-1 px-2 text-[#ff00ff] group-hover:text-[#0a0a0f]'>
                  {tag.count}
                </div>
              </div>
            </SmartLink>
          )
        })}
      </div>
    </div>
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
