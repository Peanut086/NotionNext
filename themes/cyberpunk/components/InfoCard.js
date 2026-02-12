import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useEffect, useState } from 'react'
import CONFIG from '../config'

const InfoCard = props => {
  const { siteInfo } = props
  const { locale } = useGlobal()
  
  const greetings = siteConfig('CYBERPUNK_INFOCARD_GREETINGS', ['欢迎来到赛博空间'], CONFIG)
  const [currentGreeting, setCurrentGreeting] = useState('')
  const [greetingIndex, setGreetingIndex] = useState(0)

  useEffect(() => {
    setCurrentGreeting(greetings[0])
    const interval = setInterval(() => {
      setGreetingIndex(prev => {
        const newIndex = (prev + 1) % greetings.length
        setCurrentGreeting(greetings[newIndex])
        return newIndex
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [greetings])

  const CYBERPUNK_INFO_CARD_URL1 = siteConfig('CYBERPUNK_INFO_CARD_URL1', '/about', CONFIG)
  const CYBERPUNK_INFO_CARD_ICON1 = siteConfig('CYBERPUNK_INFO_CARD_ICON1', 'fas fa-user-cog', CONFIG)
  const CYBERPUNK_INFO_CARD_URL2 = siteConfig('CYBERPUNK_INFO_CARD_URL2', 'https://github.com', CONFIG)
  const CYBERPUNK_INFO_CARD_ICON2 = siteConfig('CYBERPUNK_INFO_CARD_ICON2', 'fab fa-github', CONFIG)

  return (
    <div className='relative p-4 bg-[rgba(10,10,20,0.85)] backdrop-blur-sm border border-[rgba(0,255,249,0.3)] overflow-hidden'>
      <style jsx>{`
        @keyframes info-scan {
          0% {
            top: -100%;
          }
          100% {
            top: 100%;
          }
        }

        .info-scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 30%;
          background: linear-gradient(180deg, transparent, rgba(0, 255, 249, 0.1), transparent);
          animation: info-scan 3s linear infinite;
          pointer-events: none;
        }
      `}</style>

      <div className='info-scan-line' />

      <div className='relative z-10'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-12 h-12 border-2 border-[#00fff9] flex items-center justify-center text-[#00fff9] text-xl'>
            <i className='fas fa-user-astronaut' />
          </div>
          <div>
            <h3 className='text-lg font-bold text-[#00fff9] cyber-glow-text'>
              {siteConfig('AUTHOR') || 'CYBER_USER'}
            </h3>
            <p className='text-xs text-[#888]'>{siteConfig('DESCRIPTION') || '数据行者'}</p>
          </div>
        </div>

        <div className='mb-4 p-3 bg-[rgba(0,255,249,0.05)] border-l-2 border-[#00fff9]'>
          <p className='text-sm text-[#e0e0e0]'>
            <span className='text-[#ff00ff]'>$</span> {currentGreeting}
            <span className='animate-pulse text-[#00fff9]'>_</span>
          </p>
        </div>

        <div className='flex gap-2'>
          {CYBERPUNK_INFO_CARD_URL1 && (
            <a 
              href={CYBERPUNK_INFO_CARD_URL1}
              className='flex-1 py-2 text-center text-sm border border-[rgba(0,255,249,0.3)] text-[#00fff9] hover:bg-[#00fff9] hover:text-[#0a0a0f] transition-all duration-300'>
              <i className={`${CYBERPUNK_INFO_CARD_ICON1} mr-1`} />
              关于
            </a>
          )}
          {CYBERPUNK_INFO_CARD_URL2 && (
            <a 
              href={CYBERPUNK_INFO_CARD_URL2}
              target='_blank'
              rel='noopener noreferrer'
              className='flex-1 py-2 text-center text-sm border border-[rgba(255,0,255,0.3)] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-[#0a0a0f] transition-all duration-300'>
              <i className={`${CYBERPUNK_INFO_CARD_ICON2} mr-1`} />
              GitHub
            </a>
          )}
        </div>
      </div>

      <div className='absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00fff9] opacity-50' />
      <div className='absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#ff00ff] opacity-50' />
    </div>
  )
}

export default InfoCard
