import { siteConfig } from '@/lib/config'
import { isBrowser } from '@/lib/utils'
import throttle from 'lodash.throttle'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import DarkModeButton from './DarkModeButton'
import Logo from './Logo'
import { MenuListTop } from './MenuListTop'
import RandomPostButton from './RandomPostButton'
import ReadingProgress from './ReadingProgress'
import SearchButton from './SearchButton'
import SlideOver from './SlideOver'

const Header = props => {
  const [fixedNav, setFixedNav] = useState(false)
  const [textGlow, setTextGlow] = useState(false)
  const [navBgDark, setBgDark] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const router = useRouter()
  const slideOverRef = useRef()

  const toggleMenuOpen = () => {
    slideOverRef?.current?.toggleSlideOvers()
  }

  const scrollTrigger = useCallback(
    throttle(() => {
      const scrollS = window.scrollY
      if (scrollS <= 1) {
        setFixedNav(false)
        setBgDark(false)
        setTextGlow(false)

        if (document?.querySelector('#post-bg')) {
          setFixedNav(true)
          setTextGlow(true)
        }
      } else {
        setFixedNav(true)
        setTextGlow(false)
        setBgDark(true)
      }
    }, 100)
  )
  useEffect(() => {
    scrollTrigger()
  }, [router])

  useEffect(() => {
    window.addEventListener('scroll', scrollTrigger)
    return () => {
      window.removeEventListener('scroll', scrollTrigger)
    }
  }, [])

  useEffect(() => {
    let prevScrollY = 0
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          if (currentScrollY > prevScrollY) {
            setActiveIndex(1)
          } else {
            setActiveIndex(0)
          }
          prevScrollY = currentScrollY
          ticking = false
        })
        ticking = true
      }
    }

    if (isBrowser) {
      window.addEventListener('scroll', handleScroll)
    }

    return () => {
      if (isBrowser) {
        window.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  return (
    <>
      <style jsx>{`
        @keyframes fade-in-down {
          0% {
            opacity: 0.5;
            transform: translateY(-30%);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0.5;
            transform: translateY(30%);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes border-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(0, 255, 249, 0.3), 0 0 10px rgba(0, 255, 249, 0.1);
          }
          50% {
            box-shadow: 0 0 15px rgba(0, 255, 249, 0.5), 0 0 30px rgba(0, 255, 249, 0.2);
          }
        }

        .fade-in-down {
          animation: fade-in-down 0.3s ease-in-out;
        }

        .fade-in-up {
          animation: fade-in-up 0.3s ease-in-out;
        }

        .cyber-nav-glow {
          animation: border-glow 3s ease-in-out infinite;
        }
      `}</style>

      {fixedNav && !document?.querySelector('#post-bg') && (
        <div className='h-16'></div>
      )}

      <nav
        id='nav'
        className={`z-20 h-16 top-0 w-full duration-300 transition-all
            ${fixedNav ? 'fixed' : 'relative bg-transparent'} 
            ${textGlow ? 'text-[#00fff9] ' : 'text-[#e0e0e0]'}  
            ${navBgDark ? 'bg-[rgba(5,5,8,0.95)] backdrop-blur-md border-b border-[rgba(0,255,249,0.2)] cyber-nav-glow' : 'bg-transparent'}`}>
        <div className='flex h-full mx-auto justify-between items-center max-w-[86rem] px-6'>
          <Logo {...props} />

          <div
            id='nav-bar-swipe'
            className={`hidden lg:flex flex-grow flex-col items-center justify-center h-full relative w-full`}>
            <div
              className={`absolute transition-all duration-700 ${activeIndex === 0 ? 'opacity-100 mt-0' : '-mt-20 opacity-0 invisible'}`}>
              <MenuListTop {...props} />
            </div>
            <div
              className={`absolute transition-all duration-700 ${activeIndex === 1 ? 'opacity-100 mb-0' : '-mb-20 opacity-0 invisible'}`}>
              <h1 className='font-bold text-center text-[#00fff9]'>
                {siteConfig('AUTHOR') || siteConfig('TITLE')}{' '}
                {siteConfig('BIO') && <span className='text-[#ff00ff]'>|</span>} {siteConfig('BIO')}
              </h1>
            </div>
          </div>

          <div className='flex flex-shrink-0 justify-end items-center w-48'>
            <RandomPostButton {...props} />
            <SearchButton {...props} />
            {!JSON.parse(siteConfig('THEME_SWITCH')) && (
              <div className='hidden md:block'>
                <DarkModeButton {...props} />
              </div>
            )}
            <ReadingProgress />

            <div
              onClick={toggleMenuOpen}
              className='flex lg:hidden w-8 justify-center items-center h-8 cursor-pointer text-[#00fff9] hover:text-[#ff00ff] transition-colors'>
              <i className='fas fa-bars' />
            </div>
          </div>

          <SlideOver cRef={slideOverRef} {...props} />
        </div>
      </nav>
    </>
  )
}

export default Header
