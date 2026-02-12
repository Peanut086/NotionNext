import { useEffect, useState } from 'react'

const FloatTocButton = props => {
  const { toc } = props
  const [showToc, setShowToc] = useState(false)
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (!toc || toc.length === 0) return

    const handleScroll = () => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      let currentId = ''

      headings.forEach(heading => {
        const rect = heading.getBoundingClientRect()
        if (rect.top <= 100) {
          currentId = heading.id
        }
      })

      setActiveId(currentId)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [toc])

  if (!toc || toc.length === 0) {
    return null
  }

  const scrollToHeading = id => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className='fixed right-4 bottom-20 z-40'>
      <button
        onClick={() => setShowToc(!showToc)}
        className='w-12 h-12 bg-[rgba(10,10,20,0.9)] backdrop-blur-sm border border-[rgba(0,255,249,0.3)] text-[#00fff9] hover:border-[#00fff9] hover:shadow-[0_0_15px_rgba(0,255,249,0.5)] transition-all duration-300'
      >
        <i className='fas fa-list' />
      </button>

      {showToc && (
        <div className='absolute right-0 bottom-14 w-64 max-h-80 overflow-y-auto bg-[rgba(5,5,8,0.95)] backdrop-blur-md border border-[rgba(0,255,249,0.3)] p-4'>
          <h3 className='text-sm font-bold text-[#00fff9] mb-3 flex items-center gap-2'>
            <i className='fas fa-stream' />
            目录导航
          </h3>
          <nav className='space-y-1'>
            {toc.map(item => (
              <div
                key={item.id}
                onClick={() => scrollToHeading(item.id)}
                className={`text-sm cursor-pointer py-1 px-2 transition-all duration-200 ${
                  activeId === item.id
                    ? 'text-[#00fff9] bg-[rgba(0,255,249,0.1)]'
                    : 'text-[#888] hover:text-[#e0e0e0]'
                }`}
                style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
              >
                {item.text}
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}

export default FloatTocButton
