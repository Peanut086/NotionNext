import { siteConfig } from '@/lib/config'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import CONFIG from '../config'

const Hero = props => {
  const { siteInfo, latestPosts } = props
  const router = useRouter()
  
  const [greeting, setGreeting] = useState('')
  
  const CYBERPUNK_HERO_TITLE_1 = siteConfig('CYBERPUNK_HERO_TITLE_1', 'NEURAL', CONFIG)
  const CYBERPUNK_HERO_TITLE_2 = siteConfig('CYBERPUNK_HERO_TITLE_2', 'NETWORK', CONFIG)
  const CYBERPUNK_HERO_TITLE_3 = siteConfig('CYBERPUNK_HERO_TITLE_3', 'CYBERPUNK', CONFIG)
  const CYBERPUNK_HERO_TITLE_4 = siteConfig('CYBERPUNK_HERO_TITLE_4', '2077', CONFIG)
  const CYBERPUNK_HERO_TITLE_5 = siteConfig('CYBERPUNK_HERO_TITLE_5', '数据驱动未来', CONFIG)
  
  const CYBERPUNK_HERO_CATEGORY_1 = siteConfig('CYBERPUNK_HERO_CATEGORY_1', { title: '系统日志', url: '/archive' }, CONFIG)
  const CYBERPUNK_HERO_CATEGORY_2 = siteConfig('CYBERPUNK_HERO_CATEGORY_2', { title: '数据流', url: '/category' }, CONFIG)
  const CYBERPUNK_HERO_CATEGORY_3 = siteConfig('CYBERPUNK_HERO_CATEGORY_3', { title: '神经接口', url: '/tag' }, CONFIG)

  const greetings = siteConfig('CYBERPUNK_INFOCARD_GREETINGS', ['欢迎来到赛博空间'], CONFIG)

  useEffect(() => {
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]
    setGreeting(randomGreeting)
    
    const interval = setInterval(() => {
      const newGreeting = greetings[Math.floor(Math.random() * greetings.length)]
      setGreeting(newGreeting)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  if (router.route !== '/') {
    return null
  }

  return (
    <div className='relative w-full overflow-hidden'>
      <style jsx>{`
        @keyframes hero-glitch {
          0% {
            clip-path: inset(40% 0 61% 0);
            transform: translate(-2px, 2px);
          }
          20% {
            clip-path: inset(92% 0 1% 0);
            transform: translate(2px, -2px);
          }
          40% {
            clip-path: inset(43% 0 1% 0);
            transform: translate(-1px, 1px);
          }
          60% {
            clip-path: inset(25% 0 58% 0);
            transform: translate(1px, -1px);
          }
          80% {
            clip-path: inset(54% 0 7% 0);
            transform: translate(-2px, 2px);
          }
          100% {
            clip-path: inset(58% 0 43% 0);
            transform: translate(2px, -2px);
          }
        }

        @keyframes text-flicker {
          0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% {
            opacity: 1;
          }
          20%, 21.999%, 63%, 63.999%, 65%, 69.999% {
            opacity: 0.4;
          }
        }

        .hero-title-glitch {
          position: relative;
        }

        .hero-title-glitch::before,
        .hero-title-glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .hero-title-glitch::before {
          color: #ff00ff;
          animation: hero-glitch 3s infinite;
          z-index: -1;
        }

        .hero-title-glitch::after {
          color: #00fff9;
          animation: hero-glitch 2s infinite reverse;
          z-index: -2;
        }

        .hero-flicker {
          animation: text-flicker 5s infinite;
        }

        @keyframes scan-line {
          0% {
            top: -100%;
          }
          100% {
            top: 100%;
          }
        }

        .hero-scan-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 50%;
          background: linear-gradient(transparent, rgba(0, 255, 249, 0.1), transparent);
          animation: scan-line 4s linear infinite;
          pointer-events: none;
        }

        @keyframes typing-cursor {
          0%, 100% {
            border-color: #00fff9;
          }
          50% {
            border-color: transparent;
          }
        }

        .typing-cursor {
          border-right: 2px solid #00fff9;
          animation: typing-cursor 1s step-end infinite;
        }
      `}</style>

      <div className='hero-scan-line' />

      <div className='max-w-[86rem] mx-auto px-6 py-12 md:py-20'>
        <div className='flex flex-col lg:flex-row items-center justify-between gap-12'>
          <div className='flex-1 text-center lg:text-left'>
            <div className='mb-4'>
              <span className='text-sm text-[#ff00ff] tracking-[0.3em] uppercase hero-flicker'>
                // SYSTEM ONLINE
              </span>
            </div>
            
            <h1 className='text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight'>
              <span className='hero-title-glitch text-[#00fff9]' data-text={CYBERPUNK_HERO_TITLE_1}>
                {CYBERPUNK_HERO_TITLE_1}
              </span>
              <br />
              <span className='hero-title-glitch text-[#ff00ff]' data-text={CYBERPUNK_HERO_TITLE_2}>
                {CYBERPUNK_HERO_TITLE_2}
              </span>
            </h1>

            <h2 className='text-2xl md:text-3xl font-bold mb-4'>
              <span className='text-[#fcee0a]'>{CYBERPUNK_HERO_TITLE_3}</span>
              <span className='text-[#00fff9] ml-2'>{CYBERPUNK_HERO_TITLE_4}</span>
            </h2>

            <p className='text-lg text-[#888] mb-8 typing-cursor inline-block pr-1'>
              {CYBERPUNK_HERO_TITLE_5}
            </p>

            <div className='text-lg text-[#00fff9] mb-8 cyber-glow-text'>
              <i className='fas fa-terminal mr-2' />
              <span className='text-[#ff00ff]'>$</span> {greeting}
            </div>

            <div className='flex flex-wrap justify-center lg:justify-start gap-4'>
              <a
                href={CYBERPUNK_HERO_CATEGORY_1.url}
                className='cyber-button'>
                <i className='fas fa-database mr-2' />
                {CYBERPUNK_HERO_CATEGORY_1.title}
              </a>
              <a
                href={CYBERPUNK_HERO_CATEGORY_2.url}
                className='cyber-button cyber-button-pink'>
                <i className='fas fa-stream mr-2' />
                {CYBERPUNK_HERO_CATEGORY_2.title}
              </a>
              <a
                href={CYBERPUNK_HERO_CATEGORY_3.url}
                className='cyber-button'>
                <i className='fas fa-microchip mr-2' />
                {CYBERPUNK_HERO_CATEGORY_3.title}
              </a>
            </div>
          </div>

          <div className='flex-shrink-0 hidden lg:block'>
            <div className='relative w-80 h-80'>
              <div className='absolute inset-0 border border-[rgba(0,255,249,0.3)] rotate-45 cyber-pulse-glow' />
              <div className='absolute inset-4 border border-[rgba(255,0,255,0.3)] rotate-45' />
              <div className='absolute inset-8 border border-[rgba(252,238,10,0.3)] rotate-45' />
              <div className='absolute inset-0 flex items-center justify-center'>
                <div className='text-6xl font-bold cyber-text-gradient'>
                  <div className='text-[#00fff9] cyber-neon-flicker'>CYBER</div>
                  <div className='text-[#ff00ff]'>PUNK</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='h-px w-full bg-gradient-to-r from-transparent via-[#00fff9] to-transparent opacity-50' />
    </div>
  )
}

export default Hero
