import { siteConfig } from '@/lib/config'
import CONFIG from '../config'

const CyberEffects = () => {
  const scanlineEnabled = siteConfig('CYBERPUNK_SCANLINE_EFFECT', true, CONFIG)
  const glitchEnabled = siteConfig('CYBERPUNK_GLITCH_EFFECT', true, CONFIG)

  return (
    <>
      {scanlineEnabled && (
        <div className='cyber-scanline' />
      )}
      
      <style jsx global>{`
        @keyframes cyber-grid-pulse {
          0%, 100% {
            opacity: 0.03;
          }
          50% {
            opacity: 0.06;
          }
        }

        .cyber-grid-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -2;
          background-image: 
            linear-gradient(rgba(0, 255, 249, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 249, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: cyber-grid-pulse 4s ease-in-out infinite;
        }

        @keyframes cyber-corner-flash {
          0%, 90%, 100% {
            opacity: 0;
          }
          95% {
            opacity: 1;
          }
        }

        .cyber-corner-tl,
        .cyber-corner-tr,
        .cyber-corner-bl,
        .cyber-corner-br {
          position: fixed;
          width: 100px;
          height: 100px;
          pointer-events: none;
          z-index: 100;
          opacity: 0;
          animation: cyber-corner-flash 10s ease-in-out infinite;
        }

        .cyber-corner-tl {
          top: 20px;
          left: 20px;
          border-top: 2px solid var(--cyber-primary);
          border-left: 2px solid var(--cyber-primary);
          animation-delay: 0s;
        }

        .cyber-corner-tr {
          top: 20px;
          right: 20px;
          border-top: 2px solid var(--cyber-secondary);
          border-right: 2px solid var(--cyber-secondary);
          animation-delay: 2.5s;
        }

        .cyber-corner-bl {
          bottom: 20px;
          left: 20px;
          border-bottom: 2px solid var(--cyber-accent);
          border-left: 2px solid var(--cyber-accent);
          animation-delay: 5s;
        }

        .cyber-corner-br {
          bottom: 20px;
          right: 20px;
          border-bottom: 2px solid var(--cyber-primary);
          border-right: 2px solid var(--cyber-primary);
          animation-delay: 7.5s;
        }

        @keyframes cyber-noise {
          0%, 100% { background-position: 0 0; }
          10% { background-position: -5% -10%; }
          20% { background-position: -15% 5%; }
          30% { background-position: 7% -25%; }
          40% { background-position: -5% 25%; }
          50% { background-position: -15% 10%; }
          60% { background-position: 15% 0%; }
          70% { background-position: 0% 15%; }
          80% { background-position: 3% 35%; }
          90% { background-position: -10% 10%; }
        }

        .cyber-noise {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9998;
          opacity: 0.02;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          animation: cyber-noise 0.5s steps(10) infinite;
        }

        @media (max-width: 768px) {
          .cyber-corner-tl,
          .cyber-corner-tr,
          .cyber-corner-bl,
          .cyber-corner-br {
            width: 50px;
            height: 50px;
          }
        }
      `}</style>

      <div className='cyber-grid-bg' />
      <div className='cyber-noise' />
      <div className='cyber-corner-tl' />
      <div className='cyber-corner-tr' />
      <div className='cyber-corner-bl' />
      <div className='cyber-corner-br' />
    </>
  )
}

export default CyberEffects
