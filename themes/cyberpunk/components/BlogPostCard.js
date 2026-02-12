import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import { formatDateFmt } from '@/lib/utils/formatDate'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'

const BlogPostCard = ({ post, showSummary }) => {
  const CYBERPUNK_POST_LIST_COVER = siteConfig('CYBERPUNK_POST_LIST_COVER', true, CONFIG)
  const CYBERPUNK_POST_LIST_SUMMARY = siteConfig('CYBERPUNK_POST_LIST_SUMMARY', true, CONFIG)
  const CYBERPUNK_POST_LIST_COVER_HOVER_ENLARGE = siteConfig('CYBERPUNK_POST_LIST_COVER_HOVER_ENLARGE', true, CONFIG)

  const showCover = CYBERPUNK_POST_LIST_COVER && post?.pageCover
  const summary = CYBERPUNK_POST_LIST_SUMMARY && post?.summary

  return (
    <article className='group relative mb-6'>
      <style jsx>{`
        @keyframes card-scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        .card-scan-effect {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(180deg, transparent, rgba(0, 255, 249, 0.1), transparent);
          transform: translateY(-100%);
          transition: transform 0.5s ease;
        }

        .group:hover .card-scan-effect {
          animation: card-scan 1s ease forwards;
        }
      `}</style>

      <SmartLink href={post?.href} passHref legacyBehavior>
        <div className='relative flex flex-col md:flex-row gap-4 p-4 bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(0,255,249,0.2)] hover:border-[rgba(0,255,249,0.5)] transition-all duration-300 cursor-pointer hover:shadow-[0_0_30px_rgba(0,255,249,0.2)] overflow-hidden'>
          <div className='card-scan-effect' />

          {showCover && (
            <div className='relative w-full md:w-48 h-32 md:h-32 flex-shrink-0 overflow-hidden border border-[rgba(0,255,249,0.2)]'>
              <LazyImage
                src={post.pageCover}
                alt={post.title}
                className={`w-full h-full object-cover transition-transform duration-500 ${CYBERPUNK_POST_LIST_COVER_HOVER_ENLARGE ? 'group-hover:scale-110' : ''}`}
              />
              <div className='absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.8)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
            </div>
          )}

          <div className='flex-1 flex flex-col justify-between min-w-0'>
            <div>
              <header className='mb-2'>
                <h2 className='text-lg font-bold text-[#e0e0e0] group-hover:text-[#00fff9] transition-colors duration-300 line-clamp-2 cyber-glitch'>
                  {post.title}
                </h2>
              </header>

              {summary && (
                <p className='text-sm text-[#888] line-clamp-2 mb-3'>
                  {post.summary}
                </p>
              )}

              <div className='flex flex-wrap gap-2 mb-3'>
                {post.tags?.slice(0, 3).map(tag => (
                  <span key={tag} className='cyber-tag text-xs'>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <footer className='flex items-center justify-between text-xs text-[#888]'>
              <div className='flex items-center gap-4'>
                <span className='flex items-center gap-1'>
                  <i className='far fa-calendar-alt text-[#00fff9]' />
                  {formatDateFmt(post.publishDay, 'yyyy-MM-dd')}
                </span>
                {post.lastEditedTime && post.lastEditedTime !== post.publishDay && (
                  <span className='flex items-center gap-1'>
                    <i className='far fa-edit text-[#ff00ff]' />
                    {formatDateFmt(post.lastEditedTime, 'yyyy-MM-dd')}
                  </span>
                )}
              </div>

              <span className='text-[#00fff9] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1'>
                <span>阅读更多</span>
                <i className='fas fa-arrow-right' />
              </span>
            </footer>
          </div>

          <div className='absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00fff9] via-[#ff00ff] to-[#fcee0a] opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
        </div>
      </SmartLink>
    </article>
  )
}

export default BlogPostCard
