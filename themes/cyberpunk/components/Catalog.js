import { useGlobal } from '@/lib/global'
import throttle from 'lodash.throttle'
import { uuidToId } from 'notion-utils'
import { useCallback, useEffect, useRef, useState } from 'react'

const Catalog = ({ toc }) => {
  const { locale } = useGlobal()
  const tRef = useRef(null)
  const containerRef = useRef(null)
  const placeholderRef = useRef(null)
  const tocIds = []
  const [activeSection, setActiveSection] = useState(null)
  const [isSticky, setIsSticky] = useState(false)
  const [showToc, setShowToc] = useState(true)

  const actionSectionScrollSpy = useCallback(
    throttle(() => {
      const sections = document.getElementsByClassName('notion-h')
      let prevBBox = null
      let currentSectionId = activeSection
      for (let i = 0; i < sections.length; ++i) {
        const section = sections[i]
        if (!section || !(section instanceof Element)) continue
        if (!currentSectionId) {
          currentSectionId = section.getAttribute('data-id')
        }
        const bbox = section.getBoundingClientRect()
        const prevHeight = prevBBox ? bbox.top - prevBBox.bottom : 0
        const offset = Math.max(150, prevHeight / 4)
        if (bbox.top - offset < 0) {
          currentSectionId = section.getAttribute('data-id')
          prevBBox = bbox
          continue
        }
        break
      }
      setActiveSection(currentSectionId)
      const index = tocIds.indexOf(currentSectionId) || 0
      tRef?.current?.scrollTo({ top: 28 * index, behavior: 'smooth' })
    }, 200)
  )

  const handleScroll = useCallback(
    throttle(() => {
      if (placeholderRef.current) {
        const rect = placeholderRef.current.getBoundingClientRect()
        const newIsSticky = rect.top <= 80
        setIsSticky(newIsSticky)
      }
      actionSectionScrollSpy()
    }, 100)
  , [actionSectionScrollSpy])

  const handleMouseMove = useCallback(
    throttle((e) => {
      if (isSticky) {
        const threshold = 150
        const isNearRightEdge = window.innerWidth - e.clientX < threshold
        setShowToc(isNearRightEdge)
      }
    }, 50)
  , [isSticky])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  useEffect(() => {
    if (isSticky) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true })
      setShowToc(false)
    } else {
      setShowToc(true)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isSticky, handleMouseMove])

  if (!toc || toc.length < 1) {
    return null
  }

  const scrollToHeading = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      <div ref={placeholderRef} className='h-0' />
      
      {isSticky && !showToc && (
        <div className='fixed right-0 top-1/2 -translate-y-1/2 z-50'>
          <div 
            className='group flex items-center'
            onMouseEnter={() => setShowToc(true)}
          >
            <div className='w-1 h-32 bg-gradient-to-b from-transparent via-[var(--cyber-primary)] to-transparent opacity-50 group-hover:opacity-100 group-hover:w-2 transition-all duration-300 cursor-pointer' />
            <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[var(--cyber-bg-card)] border border-[var(--cyber-border)] border-r-0 rounded-l px-2 py-1 text-xs text-[var(--cyber-primary)] whitespace-nowrap'>
              <i className='fas fa-list-ol mr-1' />
              目录
            </div>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`
          transition-all duration-300 ease-in-out
          ${isSticky 
            ? `fixed top-20 right-4 w-64 z-40 ${showToc ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`
            : 'relative w-full opacity-100'
          }
        `}
        onMouseLeave={() => isSticky && setShowToc(false)}
      >
        <div className='bg-[var(--cyber-bg-card)] backdrop-blur-sm border border-[var(--cyber-border)] shadow-lg overflow-hidden'>
          <div className='p-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2 text-sm font-bold text-[var(--cyber-primary)]'>
                <i className='fas fa-microchip' />
                <span>{locale?.COMMON?.TABLE_OF_CONTENTS || '目录导航'}</span>
              </div>
              {isSticky && (
                <div className='text-xs text-[var(--cyber-text-dim)] animate-pulse'>
                  <i className='fas fa-thumbtack mr-1' />
                  固定
                </div>
              )}
            </div>
            <div
              ref={tRef}
              className='overflow-y-auto max-h-64 overscroll-none scroll-hidden mt-3'
            >
              <nav className='space-y-1'>
                {toc?.map(tocItem => {
                  const id = uuidToId(tocItem.id)
                  tocIds.push(id)
                  const isActive = activeSection === id
                  return (
                    <div
                      key={id}
                      onClick={() => scrollToHeading(id)}
                      className={`
                        relative text-sm cursor-pointer py-1.5 px-2 transition-all duration-300 border-l-2
                        ${isActive 
                          ? 'text-[var(--cyber-primary)] bg-[rgba(var(--cyber-primary-rgb),0.1)] border-[var(--cyber-primary)]' 
                          : 'text-[var(--cyber-text-dim)] border-transparent hover:text-[var(--cyber-text)] hover:bg-[rgba(var(--cyber-primary-rgb),0.05)]'
                        }
                      `}
                      style={{
                        paddingLeft: `${tocItem.indentLevel * 12 + 8}px`
                      }}
                    >
                      <span className='truncate block'>{tocItem.text}</span>
                      {isActive && (
                        <div className='absolute left-0 top-0 w-0.5 h-full bg-[var(--cyber-primary)] shadow-[var(--cyber-glow-primary)]' />
                      )}
                    </div>
                  )
                })}
              </nav>
            </div>
          </div>
          <div className='h-1 bg-gradient-to-r from-[var(--cyber-primary)] via-[var(--cyber-secondary)] to-[var(--cyber-accent)]' />
        </div>
      </div>
    </>
  )
}

export default Catalog
