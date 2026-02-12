import InfoCard from './InfoCard'
import LatestPostsGroup from './LatestPostsGroup'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

const SideRight = props => {
  const { tags, categories, latestPosts } = props

  const CYBERPUNK_WIDGET_LATEST_POSTS = siteConfig('CYBERPUNK_WIDGET_LATEST_POSTS', true, CONFIG)

  return (
    <div className='w-72 space-y-6'>
      <InfoCard {...props} />

      {CYBERPUNK_WIDGET_LATEST_POSTS && latestPosts && latestPosts.length > 0 && (
        <LatestPostsGroup {...props} />
      )}

      {tags && tags.length > 0 && (
        <div className='p-4 bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(255,0,255,0.3)]'>
          <h3 className='text-lg font-bold text-[#ff00ff] mb-4 flex items-center gap-2'>
            <i className='fas fa-tags' />
            <span className='cyber-glow-text-pink'>标签云</span>
          </h3>
          <div className='flex flex-wrap gap-2'>
            {tags.slice(0, 15).map(tag => (
              <a 
                key={tag.name}
                href={`/tag/${tag.name}`}
                className='cyber-tag text-xs'
              >
                {tag.name}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className='p-4 bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(252,238,10,0.3)]'>
        <h3 className='text-lg font-bold text-[#fcee0a] mb-4 flex items-center gap-2'>
          <i className='fas fa-chart-line' />
          <span className='cyber-glow-text-yellow'>系统状态</span>
        </h3>
        <div className='space-y-2 text-sm'>
          <div className='flex justify-between items-center'>
            <span className='text-[#888]'>CPU负载</span>
            <span className='text-[#05ffa1]'>正常</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-[#888]'>内存使用</span>
            <span className='text-[#00fff9]'>42%</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-[#888]'>网络状态</span>
            <span className='text-[#05ffa1] flex items-center gap-1'>
              <span className='w-2 h-2 bg-[#05ffa1] rounded-full animate-pulse' />
              在线
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-[#888]'>防火墙</span>
            <span className='text-[#ff00ff]'>激活</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SideRight
