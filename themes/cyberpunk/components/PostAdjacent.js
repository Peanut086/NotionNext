import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'

const PostAdjacent = props => {
  const { prev, next } = props
  const { locale } = useGlobal()

  if (!prev && !next) {
    return null
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 my-8'>
      {prev && (
        <SmartLink href={prev?.href} passHref legacyBehavior>
          <div className='group p-4 bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(0,255,249,0.3)] hover:border-[#00fff9] transition-all duration-300 cursor-pointer relative overflow-hidden'>
            <div className='absolute top-0 left-0 w-1 h-full bg-[#00fff9] opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
            <div className='text-xs text-[#00fff9] mb-2 flex items-center gap-1'>
              <i className='fas fa-chevron-left' />
              上一篇
            </div>
            <h3 className='text-sm text-[#e0e0e0] group-hover:text-[#00fff9] transition-colors duration-300 line-clamp-2'>
              {prev.title}
            </h3>
          </div>
        </SmartLink>
      )}

      {next && (
        <SmartLink href={next?.href} passHref legacyBehavior>
          <div className='group p-4 bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(255,0,255,0.3)] hover:border-[#ff00ff] transition-all duration-300 cursor-pointer relative overflow-hidden text-right'>
            <div className='absolute top-0 right-0 w-1 h-full bg-[#ff00ff] opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
            <div className='text-xs text-[#ff00ff] mb-2 flex items-center gap-1 justify-end'>
              下一篇
              <i className='fas fa-chevron-right' />
            </div>
            <h3 className='text-sm text-[#e0e0e0] group-hover:text-[#ff00ff] transition-colors duration-300 line-clamp-2'>
              {next.title}
            </h3>
          </div>
        </SmartLink>
      )}
    </div>
  )
}

export default PostAdjacent
