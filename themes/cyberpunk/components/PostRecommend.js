import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'

const PostRecommend = props => {
  const { recommendPosts } = props
  const { locale } = useGlobal()

  if (!recommendPosts || recommendPosts.length === 0) {
    return null
  }

  return (
    <div className='my-6'>
      <h3 className='text-lg font-bold text-[#00fff9] mb-4 flex items-center gap-2 cyber-glow-text'>
        <i className='fas fa-microchip' />
        相关推荐
      </h3>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
        {recommendPosts.slice(0, 4).map(post => (
          <SmartLink key={post.id} href={post?.href} passHref legacyBehavior>
            <div className='group p-3 bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(255,0,255,0.3)] hover:border-[#ff00ff] transition-all duration-300 cursor-pointer'>
              <h4 className='text-sm text-[#e0e0e0] group-hover:text-[#ff00ff] transition-colors duration-300 line-clamp-2'>
                {post.title}
              </h4>
            </div>
          </SmartLink>
        ))}
      </div>
    </div>
  )
}

export default PostRecommend
