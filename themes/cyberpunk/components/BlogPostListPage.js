import BlogPostCard from './BlogPostCard'
import PaginationNumber from './PaginationNumber'
import { useGlobal } from '@/lib/global'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'

const BlogPostListPage = props => {
  const { posts, page, currentPage } = props
  const { locale } = useGlobal()
  
  const CYBERPUNK_HOME_POST_TWO_COLS = siteConfig('CYBERPUNK_HOME_POST_TWO_COLS', true, CONFIG)

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
        {posts?.map(post => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>

      <PaginationNumber page={page} currentPage={currentPage} />
    </div>
  )
}

export default BlogPostListPage
