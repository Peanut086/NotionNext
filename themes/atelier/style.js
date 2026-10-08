/* eslint-disable react/no-unknown-property */
const Style = () => {
  return (
    <style jsx global>{`
      #theme-atelier {
        --atelier-ink: #11100e;
        --atelier-cream: #fff8e8;
        --atelier-muted: #a79783;
        --atelier-cyan: #39d0c8;
        --atelier-acid: #d8ff4f;
        --atelier-coral: #ff6b4a;
        --atelier-violet: #8e6cff;
        --atelier-line: rgba(255, 248, 232, 0.16);
        background:
          radial-gradient(
            circle at 83% 10%,
            rgba(57, 208, 200, 0.36),
            transparent 24rem
          ),
          radial-gradient(
            circle at 12% 34%,
            rgba(255, 107, 74, 0.16),
            transparent 21rem
          ),
          linear-gradient(rgba(255, 248, 232, 0.08) 1px, transparent 1px),
          linear-gradient(
            90deg,
            rgba(255, 248, 232, 0.08) 1px,
            transparent 1px
          ),
          #11100e;
        background-size:
          auto,
          auto,
          42px 42px,
          42px 42px,
          auto;
        color: var(--atelier-cream);
        min-height: 100vh;
        overflow-x: hidden;
      }

      #theme-atelier * {
        letter-spacing: 0;
      }

      #theme-atelier a {
        text-decoration: none;
      }

      #theme-atelier .atelier-shell {
        width: min(1312px, calc(100vw - 48px));
        margin: 0 auto;
      }

      #theme-atelier .atelier-hard {
        box-shadow: 12px 14px 0 var(--atelier-ink);
        border: 3px solid var(--atelier-ink);
      }

      #theme-atelier .atelier-topbar {
        background: var(--atelier-cream);
        color: var(--atelier-ink);
        transform: translateY(0);
        animation: atelier-slide-down 620ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }

      #theme-atelier .atelier-nav-link {
        position: relative;
        color: var(--atelier-ink);
        font-weight: 850;
        padding: 0.35rem 0;
      }

      #theme-atelier .atelier-nav-link::after {
        content: '';
        position: absolute;
        left: 0;
        right: 100%;
        bottom: 0;
        height: 3px;
        background: var(--atelier-coral);
        transition: right 180ms ease-out;
      }

      #theme-atelier .atelier-nav-link:hover::after {
        right: 0;
      }

      #theme-atelier .atelier-hero-title {
        font-family: Georgia, 'Times New Roman', 'Noto Serif SC', serif;
        font-size: clamp(3.4rem, 8vw, 7.4rem);
        line-height: 1.05;
        font-weight: 900;
      }

      #theme-atelier .atelier-eyebrow {
        color: var(--atelier-acid);
        font-family: 'JetBrains Mono', Consolas, monospace;
        font-size: 0.9rem;
        font-weight: 900;
        letter-spacing: 0.18em;
      }

      #theme-atelier .atelier-highlight {
        height: 23px;
        width: min(648px, 72vw);
        background: var(--atelier-cyan);
        transform-origin: left;
        animation: atelier-grow-x 900ms 420ms cubic-bezier(0.2, 0.8, 0.2, 1)
          both;
      }

      #theme-atelier .atelier-primary-button,
      #theme-atelier .atelier-secondary-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 60px;
        padding: 0 2rem;
        color: var(--atelier-ink);
        border: 3px solid var(--atelier-ink);
        font-weight: 950;
        transition:
          transform 180ms ease-out,
          box-shadow 180ms ease-out,
          background-color 180ms ease-out;
      }

      #theme-atelier .atelier-primary-button {
        background: var(--atelier-coral);
        box-shadow: 10px 11px 0 var(--atelier-ink);
      }

      #theme-atelier .atelier-secondary-button {
        background: var(--atelier-cream);
      }

      #theme-atelier .atelier-primary-button:hover,
      #theme-atelier .atelier-secondary-button:hover {
        transform: translate(5px, 6px);
        box-shadow: 3px 4px 0 var(--atelier-ink);
      }

      #theme-atelier .atelier-graph-panel {
        background: var(--atelier-cream);
        color: var(--atelier-ink);
        animation: atelier-float-in 760ms 160ms cubic-bezier(0.2, 0.8, 0.2, 1)
          both;
      }

      #theme-atelier .atelier-graph-canvas {
        background: var(--atelier-ink);
        overflow: hidden;
        position: relative;
      }

      #theme-atelier .atelier-graph-canvas::before {
        content: '';
        position: absolute;
        inset: -20%;
        background: conic-gradient(
          from 140deg,
          transparent,
          rgba(57, 208, 200, 0.28),
          transparent,
          rgba(216, 255, 79, 0.22),
          transparent
        );
        animation: atelier-spin 18s linear infinite;
      }

      #theme-atelier .atelier-node {
        filter: drop-shadow(0 0 10px currentColor);
        transform-box: fill-box;
        transform-origin: center;
        animation: atelier-pulse 2.4s ease-in-out infinite;
      }

      #theme-atelier .atelier-node:nth-of-type(2n) {
        animation-delay: -700ms;
      }

      #theme-atelier .atelier-node:nth-of-type(3n) {
        animation-delay: -1200ms;
      }

      #theme-atelier .atelier-wire {
        stroke-dasharray: 12 12;
        animation: atelier-dash 16s linear infinite;
      }

      #theme-atelier .atelier-card {
        color: var(--atelier-ink);
        border: 4px solid var(--atelier-ink);
        box-shadow: 12px 14px 0 var(--atelier-ink);
        position: relative;
        overflow: hidden;
        isolation: isolate;
        transition:
          transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
          box-shadow 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      #theme-atelier .atelier-card::before {
        content: '';
        position: absolute;
        inset: -40%;
        z-index: -1;
        background: radial-gradient(
          circle,
          rgba(255, 248, 232, 0.6),
          transparent 34%
        );
        transform: translate(-28%, -18%);
        transition: transform 260ms ease-out;
      }

      #theme-atelier .atelier-card:hover {
        transform: translate(6px, 7px) rotate(-0.5deg);
        box-shadow: 4px 5px 0 var(--atelier-ink);
      }

      #theme-atelier .atelier-card:hover::before {
        transform: translate(18%, 8%);
      }

      #theme-atelier .atelier-card:nth-child(3n + 1) {
        background: linear-gradient(
          135deg,
          var(--atelier-cyan),
          var(--atelier-acid) 52%,
          var(--atelier-coral)
        );
      }

      #theme-atelier .atelier-card:nth-child(3n + 2) {
        background: linear-gradient(
          135deg,
          var(--atelier-violet),
          var(--atelier-cyan) 48%,
          var(--atelier-cream)
        );
      }

      #theme-atelier .atelier-card:nth-child(3n) {
        background: linear-gradient(
          135deg,
          var(--atelier-acid),
          var(--atelier-cream) 48%,
          var(--atelier-coral)
        );
      }

      #theme-atelier .atelier-stagger {
        opacity: 0;
        transform: translateY(34px);
        animation: atelier-rise 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }

      #theme-atelier .atelier-radar {
        background: var(--atelier-cream);
        color: var(--atelier-ink);
      }

      #theme-atelier .atelier-radar-shape {
        animation: atelier-radar 4s ease-in-out infinite alternate;
        transform-origin: center;
      }

      #theme-atelier .atelier-marquee {
        display: flex;
        gap: 1rem;
        width: max-content;
        animation: atelier-marquee 24s linear infinite;
      }

      #theme-atelier .atelier-progress {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 60;
        height: 5px;
        width: var(--atelier-progress, 0%);
        background: linear-gradient(
          90deg,
          var(--atelier-coral),
          var(--atelier-acid),
          var(--atelier-cyan)
        );
        box-shadow: 0 0 18px rgba(57, 208, 200, 0.8);
      }

      #theme-atelier .atelier-article {
        background: var(--atelier-cream);
        color: var(--atelier-ink);
        border: 4px solid var(--atelier-ink);
        box-shadow: 14px 16px 0 var(--atelier-coral);
      }

      #theme-atelier #article-wrapper .notion {
        color: var(--atelier-ink);
        font-size: 1.05rem;
        line-height: 1.85;
      }

      #theme-atelier #article-wrapper .notion a {
        color: #096b69;
        text-decoration: underline;
        text-decoration-thickness: 2px;
        text-underline-offset: 3px;
      }

      #theme-atelier #article-wrapper .notion-code {
        border: 2px solid var(--atelier-ink);
        box-shadow: 6px 7px 0 var(--atelier-ink);
      }

      #theme-atelier .atelier-toc {
        background: var(--atelier-ink);
        color: var(--atelier-cream);
        border: 3px solid var(--atelier-cream);
      }

      #theme-atelier .atelier-toc a {
        color: rgba(255, 248, 232, 0.72);
      }

      #theme-atelier .atelier-toc a:hover {
        color: var(--atelier-acid);
      }

      @keyframes atelier-slide-down {
        from {
          opacity: 0;
          transform: translateY(-28px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes atelier-grow-x {
        from {
          transform: scaleX(0);
        }
        to {
          transform: scaleX(1);
        }
      }

      @keyframes atelier-float-in {
        from {
          opacity: 0;
          transform: translate(34px, 24px) rotate(2deg);
        }
        to {
          opacity: 1;
          transform: translate(0, 0) rotate(0);
        }
      }

      @keyframes atelier-rise {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes atelier-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes atelier-pulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.14);
        }
      }

      @keyframes atelier-dash {
        to {
          stroke-dashoffset: -240;
        }
      }

      @keyframes atelier-radar {
        from {
          transform: scale(0.94) rotate(-5deg);
        }
        to {
          transform: scale(1.05) rotate(7deg);
        }
      }

      @keyframes atelier-marquee {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(-50%);
        }
      }

      @media (max-width: 900px) {
        #theme-atelier .atelier-shell {
          width: min(100vw - 28px, 720px);
        }

        #theme-atelier .atelier-hard,
        #theme-atelier .atelier-card,
        #theme-atelier .atelier-article {
          box-shadow: 7px 8px 0 var(--atelier-ink);
        }

        #theme-atelier .atelier-hero-title {
          font-size: clamp(3rem, 15vw, 5rem);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        #theme-atelier *,
        #theme-atelier *::before,
        #theme-atelier *::after {
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
          transition-duration: 1ms !important;
        }
      }
    `}</style>
  )
}

export { Style }
