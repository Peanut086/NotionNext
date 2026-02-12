import BlogPostCard from './BlogPostCard'
import { useGlobal } from '@/lib/global'
import { useEffect, useRef, useState } from 'react'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'

const BlogPostListScroll = props => {
  const { posts } = props
  const { locale } = useGlobal()
  
  const CYBERPUNK_HOME_POST_TWO_COLS = siteConfig('CYBERPUNK_HOME_POST_TWO_COLS', true, CONFIG)

  const targetRef = useRef(null)
  const [page, setPage] = useState(1)
  const [displayPosts, setDisplayPosts] = useState([])

  useEffect(() => {
    if (posts && posts.length > 0) {
      setDisplayPosts(posts.slice(0, page * 10))
    }
  }, [posts, page])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && posts && displayPosts.length < posts.length) {
          setPage(prev => prev + 1)
        }
      },
      { threshold: 0.1 }
    )

    if (targetRef.current) {
      observer.observe(targetRef.current)
    }

    return () => {
      if (targetRef.current) {
        observer.unobserve(targetRef.current)
      }
    }
  }, [displayPosts.length, posts])

  if (!posts || posts.length === 0) {
    return (
      <div className='text-center py-20'>
        <div className='text-6xl mb-4 text-[#00fff9]'>
          <i className='fas fa-exclamation-triangle' />
        </div>
        <p className='text-xl text-[#888]'>{locale.COMMON.NO_POSTS}</p>
        <p className='text-sm text-[#ff00ff] mt-2'>数据流为空</p>
      </div>
    )
  }

  return (
    <div>
      <div className={`grid gap-4 ${CYBERPUNK_HOME_POST_TWO_COLS ? 'md:grid-cols-2' : ''}`}>
        {displayPosts.map(post => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>

      {posts && displayPosts.length < posts.length && (
        <div ref={targetRef} className='flex justify-center py-10'>
          <div className='flex items-center gap-2 text-[#00fff9]'>
            <i className='fas fa-spinner fa-spin' />
            <span>加载更多数据...</span>
          </div>
        </div>
      )}

      {posts && displayPosts.length >= posts.length && posts.length > 0 && (
        <div className='flex justify-center py-10'>
          <div className='text-[#888] text-sm'>
            <span className='text-[#ff00ff]'>[</span>
            <span> 已加载全部 {posts.length} 条数据 </span>
            <span className='text-[#ff00ff]'>]</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogPostListScroll
