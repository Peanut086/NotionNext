import { siteConfig } from '@/lib/config'
import { useRouter } from 'next/router'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'

const Logo = props => {
  const { siteInfo } = props
  const router = useRouter()

  const logoText = siteConfig('TITLE') || 'CYBERPUNK'
  const logoSubtext = siteConfig('DESCRIPTION') || ''

  return (
    <SmartLink
      href='/'
      className='flex flex-col justify-center items-start cursor-pointer font-bold'>
      <style jsx>{`
        @keyframes logo-glitch {
          0% {
            text-shadow: 2px 0 #ff00ff, -2px 0 #00fff9;
          }
          25% {
            text-shadow: -2px 0 #ff00ff, 2px 0 #00fff9;
          }
          50% {
            text-shadow: 2px 2px #ff00ff, -2px -2px #00fff9;
          }
          75% {
            text-shadow: -2px -2px #ff00ff, 2px 2px #00fff9;
          }
          100% {
            text-shadow: 2px 0 #ff00ff, -2px 0 #00fff9;
          }
        }

        .cyber-logo {
          position: relative;
          font-family: 'Orbitron', 'Courier New', monospace;
          letter-spacing: 1px;
          white-space: nowrap;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cyber-logo:hover {
          animation: logo-glitch 0.3s ease infinite;
        }

        .cyber-logo::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 70%;
          background: linear-gradient(180deg, #00fff9, #ff00ff);
          box-shadow: 0 0 8px #00fff9;
        }

        .cyber-logo::after {
          content: '';
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 70%;
          background: linear-gradient(180deg, #ff00ff, #00fff9);
          box-shadow: 0 0 8px #ff00ff;
        }
      `}</style>
      
      <div className='cyber-logo text-lg md:text-xl text-[#00fff9]'>
        {logoText}
      </div>
      {logoSubtext && (
        <div className='text-xs text-[#888] mt-1 tracking-wide uppercase whitespace-nowrap max-w-[180px] overflow-hidden text-ellipsis'>
          {logoSubtext}
        </div>
      )}
    </SmartLink>
  )
}

export default Logo
