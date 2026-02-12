import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useEffect, useRef } from 'react'
import CONFIG from '../config'
import Logo from './Logo'
import { MenuListSide } from './MenuListSide'

const SlideOver = props => {
  const { cRef } = props
  const { isDarkMode } = useGlobal()

  const toggleSlideOvers = () => {
    if (cRef?.current) {
      cRef.current.classList.toggle('translate-x-full')
    }
  }

  useEffect(() => {
    if (cRef?.current) {
      cRef.current.classList.add('translate-x-full')
    }
  }, [cRef])

  return (
    <div
      ref={cRef}
      className='fixed inset-y-0 right-0 w-full max-w-xs z-50 transform transition-transform duration-300 ease-in-out translate-x-full'
    >
      <div className='h-full flex flex-col bg-[rgba(5,5,8,0.98)] backdrop-blur-md border-l border-[rgba(0,255,249,0.3)]'>
        <div className='flex items-center justify-between p-4 border-b border-[rgba(0,255,249,0.2)]'>
          <Logo {...props} />
          <button
            onClick={toggleSlideOvers}
            className='text-[#00fff9] hover:text-[#ff00ff] transition-colors duration-300'
          >
            <i className='fas fa-times text-xl' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-4'>
          <MenuListSide {...props} onClose={toggleSlideOvers} />
        </div>

        <div className='p-4 border-t border-[rgba(0,255,249,0.2)]'>
          <div className='text-center text-xs text-[#888]'>
            <span className='text-[#00fff9]'>CYBERPUNK</span>
            <span className='mx-2'>|</span>
            <span>SYSTEM v2.0</span>
          </div>
        </div>
      </div>

      <div 
        className='fixed inset-0 bg-black bg-opacity-50 -z-10'
        onClick={toggleSlideOvers}
      />
    </div>
  )
}

export default SlideOver
