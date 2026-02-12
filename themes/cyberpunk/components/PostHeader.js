import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import CONFIG from '../config'

const PostHeader = props => {
  const { post, isDarkMode } = props
  const { locale } = useGlobal()

  if (!post) {
    return null
  }

  return (
    <div className='mb-8 text-center'>
      <style jsx>{`
        @keyframes title-glitch {
          0% {
            text-shadow: 2px 0 #ff00ff, -2px 0 #00fff9;
          }
          25% {
            text-shadow: -2px 0 #ff00ff, 2px 0 #00fff9;
          }
          50% {
            text-shadow: 2px 2px #ff00ff, -2px -2px #00fff9;
          }
          75% {
            text-shadow: -2px -2px #ff00ff, 2px 2px #00fff9;
          }
          100% {
            text-shadow: 2px 0 #ff00ff, -2px 0 #00fff9;
          }
        }

        .post-title:hover {
          animation: title-glitch 0.3s ease infinite;
        }
      `}</style>

      <h1 className='post-title text-2xl md:text-3xl font-bold text-[#00fff9] cyber-glow-text mb-4'>
        {post.title}
      </h1>
      
      <div className='flex flex-wrap items-center justify-center gap-4 text-sm text-[#888] mb-4'>
        <span className='flex items-center gap-1'>
          <i className='far fa-calendar-alt text-[#00fff9]' />
          {post.publishDay}
        </span>
        
        {post.lastEditedTime && post.lastEditedTime !== post.publishDay && (
          <span className='flex items-center gap-1'>
            <i className='far fa-edit text-[#ff00ff]' />
            更新于 {post.lastEditedTime}
          </span>
        )}
        
        {post.category && (
          <span className='flex items-center gap-1'>
            <i className='fas fa-folder text-[#fcee0a]' />
            <a href={`/category/${post.category}`} className='hover:text-[#00fff9] transition-colors'>
              {post.category}
            </a>
          </span>
        )}
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className='flex flex-wrap justify-center gap-2'>
          {post.tags.map(tag => (
            <a 
              key={tag} 
              href={`/tag/${tag}`}
              className='cyber-tag text-xs'
            >
              {tag}
            </a>
          ))}
        </div>
      )}

      <div className='mt-6 h-px w-full bg-gradient-to-r from-transparent via-[#00fff9] to-transparent opacity-50' />
    </div>
  )
}

export default PostHeader
