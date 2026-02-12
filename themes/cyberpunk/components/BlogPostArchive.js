import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import { formatDateFmt } from '@/lib/utils/formatDate'

const BlogPostArchive = ({ posts, archiveTitle }) => {
  const { locale } = useGlobal()

  if (!posts || posts.length === 0) {
    return null
  }

  return (
    <div className='mb-8'>
      <h2 className='text-xl font-bold text-[#00fff9] mb-4 flex items-center gap-2 cyber-glow-text'>
        <i className='fas fa-calendar-alt' />
        {archiveTitle}
        <span className='text-sm text-[#888] font-normal'>({posts.length})</span>
      </h2>

      <div className='space-y-2'>
        {posts.map(post => (
          <SmartLink key={post.id} href={post?.href} passHref legacyBehavior>
            <div className='group flex items-center gap-3 p-2 border border-transparent hover:border-[rgba(0,255,249,0.3)] transition-all duration-300 cursor-pointer'>
              <span className='text-xs text-[#ff00ff] font-mono'>
                {formatDateFmt(post.publishDay, 'MM-dd')}
              </span>
              <span className='flex-1 text-sm text-[#e0e0e0] group-hover:text-[#00fff9] transition-colors duration-300 line-clamp-1'>
                {post.title}
              </span>
              <i className='fas fa-chevron-right text-xs text-[#888] opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
            </div>
          </SmartLink>
        ))}
      </div>
    </div>
  )
}

export default BlogPostArchive
