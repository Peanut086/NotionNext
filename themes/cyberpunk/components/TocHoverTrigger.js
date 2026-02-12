import { useState, useEffect, useCallback } from 'react'
import throttle from 'lodash.throttle'

const TocHoverTrigger = ({ children, isSticky }) => {
  const [isHovered, setIsHovered] = useState(false)
  const [showToc, setShowToc] = useState(false)

  const handleMouseMove = useCallback(
    throttle((e) => {
      if (isSticky) {
        const threshold = 100
        const isNearRightEdge = window.innerWidth - e.clientX < threshold
        setShowToc(isNearRightEdge)
      } else {
        setShowToc(false)
      }
    }, 50)
  , [isSticky])

  useEffect(() => {
    if (isSticky) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true })
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isSticky, handleMouseMove])

  useEffect(() => {
    if (!isSticky) {
      setShowToc(false)
    }
  }, [isSticky])

  return (
    <div
      className='relative'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isSticky && !showToc && !isHovered && (
        <div className='fixed right-0 top-1/2 -translate-y-1/2 z-50'>
          <div className='w-1 h-32 bg-gradient-to-b from-transparent via-[var(--cyber-primary)] to-transparent opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-pointer'
            onMouseEnter={() => setShowToc(true)}
          />
        </div>
      )}
      
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isSticky 
            ? `fixed top-20 right-4 w-64 z-40 ${showToc || isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`
            : 'relative w-full opacity-100'
          }
        `}
      >
        {children}
      </div>
    </div>
  )
}

export default TocHoverTrigger
