import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { formatDateFmt } from '@/lib/utils/formatDate'

const LatestPostsGroup = props => {
  const { latestPosts, siteInfo } = props
  const { locale } = useGlobal()

  if (!latestPosts || latestPosts.length === 0) {
    return null
  }

  return (
    <div className='p-4 bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(0,255,249,0.3)]'>
      <h3 className='text-lg font-bold text-[#00fff9] mb-4 flex items-center gap-2'>
        <i className='fas fa-stream' />
        <span className='cyber-glow-text'>最新数据流</span>
      </h3>

      <div className='space-y-3'>
        {latestPosts.slice(0, 5).map((post, index) => (
          <SmartLink key={post.id} href={post?.href} passHref legacyBehavior>
            <div className='group flex items-start gap-3 p-2 border border-transparent hover:border-[rgba(0,255,249,0.3)] transition-all duration-300 cursor-pointer'>
              <span className='flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold bg-[rgba(0,255,249,0.1)] text-[#00fff9] border border-[rgba(0,255,249,0.3)]'>
                {String(index + 1).padStart(2, '0')}
              </span>
              
              <div className='flex-1 min-w-0'>
                <h4 className='text-sm text-[#e0e0e0] group-hover:text-[#00fff9] transition-colors duration-300 line-clamp-2'>
                  {post.title}
                </h4>
                <p className='text-xs text-[#888] mt-1'>
                  {formatDateFmt(post.publishDay, 'MM-dd')}
                </p>
              </div>
            </div>
          </SmartLink>
        ))}
      </div>

      <SmartLink href='/archive' passHref legacyBehavior>
        <div className='mt-4 text-center py-2 border border-[rgba(255,0,255,0.3)] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-[#0a0a0f] transition-all duration-300 cursor-pointer text-sm'>
          <i className='fas fa-database mr-1' />
          查看全部数据
        </div>
      </SmartLink>
    </div>
  )
}

export default LatestPostsGroup
