import { siteConfig } from '@/lib/config'
import { useState, useEffect } from 'react'
import CONFIG from '../config'

export const NoticeBar = () => {
  const notices = siteConfig('CYBERPUNK_NOTICE_BAR', [], CONFIG)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (notices.length <= 1) return
    
    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % notices.length)
        setIsVisible(true)
      }, 300)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [notices.length])

  if (!notices || notices.length === 0) return null

  const currentNotice = notices[currentIndex]

  return (
    <div className='w-full bg-gradient-to-r from-[rgba(0,255,249,0.1)] via-[rgba(255,0,255,0.1)] to-[rgba(0,255,249,0.1)] border-y border-[rgba(0,255,249,0.3)]'>
      <div className='max-w-[86rem] mx-auto px-6 py-2'>
        <div className='flex items-center justify-center space-x-3'>
          <span className='text-[#00fff9] animate-pulse'>
            <i className='fas fa-satellite-dish' />
          </span>
          <div 
            className={`text-sm text-[#e0e0e0] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            id='announcement-content'>
            {currentNotice.url ? (
              <a 
                href={currentNotice.url} 
                className='hover:text-[#00fff9] transition-colors'>
                {currentNotice.title}
              </a>
            ) : (
              <span>{currentNotice.title}</span>
            )}
          </div>
          <span className='text-[#ff00ff]'>
            <i className='fas fa-bolt' />
          </span>
        </div>
      </div>
    </div>
  )
}

export default NoticeBar
