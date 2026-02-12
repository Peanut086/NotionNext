import InfoCard from './InfoCard'
import LatestPostsGroup from './LatestPostsGroup'
import Catalog from './Catalog'
import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

const SideRight = props => {
  const { tags, categories, latestPosts, post } = props

  const CYBERPUNK_WIDGET_LATEST_POSTS = siteConfig('CYBERPUNK_WIDGET_LATEST_POSTS', true, CONFIG)

  const toc = post?.toc || []
  const showToc = toc && toc.length > 0

  return (
    <div className='w-72 space-y-6'>
      <InfoCard {...props} />

      {showToc && (
        <Catalog toc={toc} />
      )}

      {CYBERPUNK_WIDGET_LATEST_POSTS && latestPosts && latestPosts.length > 0 && (
        <LatestPostsGroup {...props} />
      )}

      {tags && tags.length > 0 && (
        <div className='p-4 bg-[var(--cyber-bg-card)] backdrop-blur-sm border border-[rgba(var(--cyber-secondary-rgb),0.3)] transition-all duration-300'>
          <h3 className='text-lg font-bold text-[var(--cyber-secondary)] mb-4 flex items-center gap-2'>
            <i className='fas fa-tags' />
            <span>标签云</span>
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

      <div className='p-4 bg-[var(--cyber-bg-card)] backdrop-blur-sm border border-[rgba(var(--cyber-accent-rgb),0.3)] transition-all duration-300'>
        <h3 className='text-lg font-bold text-[var(--cyber-accent)] mb-4 flex items-center gap-2'>
          <i className='fas fa-chart-line' />
          <span>系统状态</span>
        </h3>
        <div className='space-y-2 text-sm'>
          <div className='flex justify-between items-center'>
            <span className='text-[var(--cyber-text-dim)]'>CPU负载</span>
            <span className='text-[var(--cyber-success)]'>正常</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-[var(--cyber-text-dim)]'>内存使用</span>
            <span className='text-[var(--cyber-primary)]'>42%</span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-[var(--cyber-text-dim)]'>网络状态</span>
            <span className='text-[var(--cyber-success)] flex items-center gap-1'>
              <span className='w-2 h-2 bg-[var(--cyber-success)] rounded-full animate-pulse' />
              在线
            </span>
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-[var(--cyber-text-dim)]'>防火墙</span>
            <span className='text-[var(--cyber-secondary)]'>激活</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SideRight
