import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import CONFIG from '../config'

const PostCopyright = props => {
  const { post } = props
  const { locale } = useGlobal()

  if (!post) {
    return null
  }

  const author = siteConfig('AUTHOR') || 'CYBER_USER'
  const url = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className='my-6 p-4 bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(0,255,249,0.3)] relative overflow-hidden'>
      <div className='absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-[#00fff9] opacity-30' />
      
      <div className='relative z-10 space-y-2 text-sm'>
        <div className='flex items-start gap-2'>
          <span className='text-[#00fff9] flex-shrink-0'>
            <i className='fas fa-user' />
          </span>
          <span className='text-[#888]'>作者:</span>
          <span className='text-[#e0e0e0]'>{author}</span>
        </div>
        
        <div className='flex items-start gap-2'>
          <span className='text-[#ff00ff] flex-shrink-0'>
            <i className='fas fa-link' />
          </span>
          <span className='text-[#888]'>链接:</span>
          <span className='text-[#00fff9] break-all'>{url}</span>
        </div>
        
        <div className='flex items-start gap-2'>
          <span className='text-[#fcee0a] flex-shrink-0'>
            <i className='fas fa-copyright' />
          </span>
          <span className='text-[#888]'>声明:</span>
          <span className='text-[#e0e0e0]'>本文采用 CC BY-NC-SA 4.0 许可协议，转载请注明出处。</span>
        </div>
      </div>
    </div>
  )
}

export default PostCopyright
