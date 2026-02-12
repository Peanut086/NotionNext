import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useState, useEffect } from 'react'
import CONFIG from '../config'

const Footer = () => {
  const { locale } = useGlobal()
  const [currentTime, setCurrentTime] = useState('')
  
  const CYBERPUNK_SITE_CREATE_TIME = siteConfig('CYBERPUNK_SITE_CREATE_TIME', '2021-05-12', CONFIG)
  const CYBERPUNK_POST_COUNT_TITLE = siteConfig('CYBERPUNK_POST_COUNT_TITLE', '数据节点:', CONFIG)
  const CYBERPUNK_SITE_TIME_TITLE = siteConfig('CYBERPUNK_SITE_TIME_TITLE', '运行周期:', CONFIG)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('zh-CN', { hour12: false }))
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const calculateRunDays = () => {
    const startDate = new Date(CYBERPUNK_SITE_CREATE_TIME)
    const now = new Date()
    const diff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  return (
    <footer className='relative mt-20 border-t border-[rgba(0,255,249,0.3)]'>
      <style jsx>{`
        @keyframes footer-glow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }

        .footer-line {
          animation: footer-glow 3s ease-in-out infinite;
        }
      `}</style>

      <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00fff9] to-transparent footer-line' />

      <div className='bg-[rgba(5,5,8,0.95)] backdrop-blur-sm'>
        <div className='max-w-[86rem] mx-auto px-6 py-12'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-8'>
            <div className='text-center md:text-left'>
              <h3 className='text-lg font-bold text-[#00fff9] mb-4 cyber-glow-text'>
                <i className='fas fa-terminal mr-2' />
                SYSTEM STATUS
              </h3>
              <div className='space-y-2 text-sm text-[#888]'>
                <div className='flex items-center justify-center md:justify-start gap-2'>
                  <span className='w-2 h-2 bg-[#05ffa1] rounded-full animate-pulse' />
                  <span>系统状态: 在线</span>
                </div>
                <div className='flex items-center justify-center md:justify-start gap-2'>
                  <i className='fas fa-clock text-[#00fff9]' />
                  <span>系统时间: {currentTime}</span>
                </div>
                <div className='flex items-center justify-center md:justify-start gap-2'>
                  <i className='fas fa-calendar text-[#ff00ff]' />
                  <span>{CYBERPUNK_SITE_TIME_TITLE} {calculateRunDays()} 天</span>
                </div>
              </div>
            </div>

            <div className='text-center'>
              <h3 className='text-lg font-bold text-[#ff00ff] mb-4 cyber-glow-text-pink'>
                <i className='fas fa-link mr-2' />
                QUICK ACCESS
              </h3>
              <div className='flex flex-wrap justify-center gap-2'>
                <a href='/' className='cyber-tag'>首页</a>
                <a href='/archive' className='cyber-tag'>归档</a>
                <a href='/category' className='cyber-tag'>分类</a>
                <a href='/tag' className='cyber-tag'>标签</a>
                <a href='/search' className='cyber-tag'>搜索</a>
              </div>
            </div>

            <div className='text-center md:text-right'>
              <h3 className='text-lg font-bold text-[#fcee0a] mb-4 cyber-glow-text-yellow'>
                <i className='fas fa-code mr-2' />
                POWERED BY
              </h3>
              <div className='space-y-2 text-sm text-[#888]'>
                <div>
                  <a 
                    href='https://github.com/tangly1024/NotionNext' 
                    className='text-[#00fff9] hover:text-[#ff00ff] transition-colors'>
                    NotionNext
                  </a>
                </div>
                <div>
                  <span className='text-[#888]'>Theme: </span>
                  <span className='text-[#ff00ff]'>CYBERPUNK</span>
                </div>
              </div>
            </div>
          </div>

          <div className='border-t border-[rgba(0,255,249,0.2)] pt-6'>
            <div className='flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#888]'>
              <div className='flex items-center gap-4'>
                <span className='text-[#00fff9]'>© {new Date().getFullYear()}</span>
                <span>{siteConfig('AUTHOR') || siteConfig('TITLE')}</span>
              </div>
              
              <div className='flex items-center gap-2'>
                <span className='text-[#ff00ff]'>[</span>
                <span className='text-[#888]'>DATA DRIVEN FUTURE</span>
                <span className='text-[#ff00ff]'>]</span>
              </div>

              <div className='flex items-center gap-4'>
                {siteConfig('SOCIAL_GITHUB') && (
                  <a 
                    href={siteConfig('SOCIAL_GITHUB')} 
                    className='text-[#888] hover:text-[#00fff9] transition-colors'>
                    <i className='fab fa-github text-lg' />
                  </a>
                )}
                {siteConfig('SOCIAL_TWITTER') && (
                  <a 
                    href={siteConfig('SOCIAL_TWITTER')} 
                    className='text-[#888] hover:text-[#00fff9] transition-colors'>
                    <i className='fab fa-twitter text-lg' />
                  </a>
                )}
                {siteConfig('SOCIAL_TELEGRAM') && (
                  <a 
                    href={siteConfig('SOCIAL_TELEGRAM')} 
                    className='text-[#888] hover:text-[#00fff9] transition-colors'>
                    <i className='fab fa-telegram text-lg' />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
