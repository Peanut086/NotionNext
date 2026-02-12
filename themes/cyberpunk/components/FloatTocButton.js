import { useState } from 'react'
import Catalog from './Catalog'

const FloatTocButton = props => {
  const { post, toc } = props
  const [showToc, setShowToc] = useState(false)

  const tocData = toc || post?.toc || []

  if (!tocData || tocData.length === 0) {
    return null
  }

  return (
    <div className='fixed right-4 bottom-20 z-40 lg:hidden'>
      <button
        onClick={() => setShowToc(!showToc)}
        className='w-12 h-12 bg-[var(--cyber-bg-card)] backdrop-blur-sm border border-[var(--cyber-border)] text-[var(--cyber-primary)] hover:border-[var(--cyber-primary)] hover:shadow-[var(--cyber-glow-primary)] transition-all duration-300'
        title='目录导航'
      >
        <i className='fas fa-list-ol' />
      </button>

      {showToc && (
        <>
          <div 
            className='absolute right-0 bottom-14 w-64 bg-[var(--cyber-bg-darker)] backdrop-blur-md border border-[var(--cyber-border)] shadow-[var(--cyber-glow-primary)]'
          >
            <Catalog toc={tocData} />
          </div>
          <div 
            className='fixed inset-0 z-30'
            onClick={() => setShowToc(false)}
          />
        </>
      )}
    </div>
  )
}

export default FloatTocButton
