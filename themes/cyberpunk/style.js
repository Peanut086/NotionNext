/* eslint-disable react/no-unknown-property */

const Style = () => {
  return (
    <style jsx global>{`
      :root {
        --cyber-primary: #00fff9;
        --cyber-secondary: #ff00ff;
        --cyber-accent: #fcee0a;
        --cyber-warning: #ff2a6d;
        --cyber-success: #05ffa1;
        --cyber-bg-dark: #0a0a0f;
        --cyber-bg-darker: #050508;
        --cyber-bg-card: rgba(10, 10, 20, 0.85);
        --cyber-text: #e0e0e0;
        --cyber-text-dim: #888;
        --cyber-border: rgba(0, 255, 249, 0.3);
        --cyber-glow-primary: 0 0 10px var(--cyber-primary), 0 0 20px var(--cyber-primary), 0 0 40px var(--cyber-primary);
        --cyber-glow-secondary: 0 0 10px var(--cyber-secondary), 0 0 20px var(--cyber-secondary), 0 0 40px var(--cyber-secondary);
        --cyber-glow-accent: 0 0 10px var(--cyber-accent), 0 0 20px var(--cyber-accent);
        --cyber-glow-warning: 0 0 10px var(--cyber-warning), 0 0 20px var(--cyber-warning);
      }

      body {
        background-color: var(--cyber-bg-dark);
        background-image: 
          linear-gradient(rgba(0, 255, 249, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 249, 0.03) 1px, transparent 1px);
        background-size: 50px 50px;
        background-attachment: fixed;
      }

      html.dark body {
        background-color: var(--cyber-bg-darker);
        background-image: 
          linear-gradient(rgba(0, 255, 249, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 249, 0.05) 1px, transparent 1px);
      }

      html.light body {
        background-color: #1a1a2e;
        background-image: 
          linear-gradient(rgba(0, 255, 249, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 249, 0.08) 1px, transparent 1px);
      }

      html.light {
        --cyber-bg-dark: #1a1a2e;
        --cyber-bg-darker: #16213e;
        --cyber-bg-card: rgba(26, 26, 46, 0.95);
        --cyber-border: rgba(0, 255, 249, 0.4);
        --cyber-text: #f0f0f0;
      }

      #theme-cyberpunk {
        color: var(--cyber-text);
      }

      #theme-cyberpunk .notion {
        color: var(--cyber-text);
      }

      #theme-cyberpunk #announcement-content .notion {
        color: var(--cyber-primary);
      }

      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }

      ::-webkit-scrollbar-track {
        background: var(--cyber-bg-darker);
        border-left: 1px solid var(--cyber-border);
      }

      ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, var(--cyber-primary), var(--cyber-secondary));
        border-radius: 0;
        box-shadow: var(--cyber-glow-primary);
      }

      ::-webkit-scrollbar-thumb:hover {
        background: var(--cyber-primary);
      }

      .cyber-glow-text {
        text-shadow: var(--cyber-glow-primary);
      }

      .cyber-glow-text-pink {
        text-shadow: var(--cyber-glow-secondary);
      }

      .cyber-glow-text-yellow {
        text-shadow: var(--cyber-glow-accent);
      }

      .cyber-border-glow {
        border: 1px solid var(--cyber-primary);
        box-shadow: var(--cyber-glow-primary), inset 0 0 20px rgba(0, 255, 249, 0.1);
      }

      .cyber-border-glow-pink {
        border: 1px solid var(--cyber-secondary);
        box-shadow: var(--cyber-glow-secondary), inset 0 0 20px rgba(255, 0, 255, 0.1);
      }

      .cyber-card {
        background: var(--cyber-bg-card);
        border: 1px solid var(--cyber-border);
        backdrop-filter: blur(10px);
        position: relative;
        overflow: hidden;
      }

      .cyber-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--cyber-primary), transparent);
      }

      .cyber-card::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--cyber-secondary), transparent);
      }

      .cyber-button {
        position: relative;
        background: transparent;
        border: 1px solid var(--cyber-primary);
        color: var(--cyber-primary);
        padding: 10px 24px;
        text-transform: uppercase;
        letter-spacing: 2px;
        overflow: hidden;
        transition: all 0.3s ease;
        cursor: pointer;
      }

      .cyber-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, var(--cyber-primary), transparent);
        transition: left 0.5s ease;
      }

      .cyber-button:hover::before {
        left: 100%;
      }

      .cyber-button:hover {
        background: var(--cyber-primary);
        color: var(--cyber-bg-dark);
        box-shadow: var(--cyber-glow-primary);
      }

      .cyber-button-pink {
        border-color: var(--cyber-secondary);
        color: var(--cyber-secondary);
      }

      .cyber-button-pink::before {
        background: linear-gradient(90deg, transparent, var(--cyber-secondary), transparent);
      }

      .cyber-button-pink:hover {
        background: var(--cyber-secondary);
        box-shadow: var(--cyber-glow-secondary);
      }

      @keyframes glitch {
        0% {
          transform: translate(0);
        }
        20% {
          transform: translate(-2px, 2px);
        }
        40% {
          transform: translate(-2px, -2px);
        }
        60% {
          transform: translate(2px, 2px);
        }
        80% {
          transform: translate(2px, -2px);
        }
        100% {
          transform: translate(0);
        }
      }

      @keyframes glitch-text {
        0% {
          text-shadow: 2px 0 var(--cyber-secondary), -2px 0 var(--cyber-primary);
        }
        25% {
          text-shadow: -2px 0 var(--cyber-secondary), 2px 0 var(--cyber-primary);
        }
        50% {
          text-shadow: 2px 2px var(--cyber-secondary), -2px -2px var(--cyber-primary);
        }
        75% {
          text-shadow: -2px -2px var(--cyber-secondary), 2px 2px var(--cyber-primary);
        }
        100% {
          text-shadow: 2px 0 var(--cyber-secondary), -2px 0 var(--cyber-primary);
        }
      }

      .cyber-glitch {
        position: relative;
      }

      .cyber-glitch:hover {
        animation: glitch 0.3s infinite;
      }

      .cyber-glitch-text {
        animation: glitch-text 3s infinite;
      }

      @keyframes scanline {
        0% {
          transform: translateY(-100%);
        }
        100% {
          transform: translateY(100vh);
        }
      }

      .cyber-scanline {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: linear-gradient(transparent, var(--cyber-primary), transparent);
        opacity: 0.1;
        pointer-events: none;
        z-index: 9999;
        animation: scanline 8s linear infinite;
      }

      @keyframes neon-flicker {
        0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
          text-shadow: var(--cyber-glow-primary);
        }
        20%, 24%, 55% {
          text-shadow: none;
        }
      }

      .cyber-neon-flicker {
        animation: neon-flicker 4s infinite;
      }

      @keyframes pulse-glow {
        0%, 100% {
          box-shadow: 0 0 5px var(--cyber-primary), 0 0 10px var(--cyber-primary);
        }
        50% {
          box-shadow: 0 0 20px var(--cyber-primary), 0 0 40px var(--cyber-primary);
        }
      }

      .cyber-pulse-glow {
        animation: pulse-glow 2s ease-in-out infinite;
      }

      @keyframes data-flow {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }

      .cyber-data-flow {
        background: linear-gradient(90deg, var(--cyber-primary), var(--cyber-secondary), var(--cyber-accent), var(--cyber-primary));
        background-size: 300% 100%;
        animation: data-flow 5s ease infinite;
      }

      @keyframes typing {
        from {
          width: 0;
        }
        to {
          width: 100%;
        }
      }

      @keyframes blink-caret {
        from, to {
          border-color: transparent;
        }
        50% {
          border-color: var(--cyber-primary);
        }
      }

      .cyber-typing {
        overflow: hidden;
        white-space: nowrap;
        border-right: 2px solid var(--cyber-primary);
        animation: typing 3s steps(30, end), blink-caret 0.75s step-end infinite;
      }

      .cyber-corner-decoration {
        position: relative;
      }

      .cyber-corner-decoration::before,
      .cyber-corner-decoration::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border: 2px solid var(--cyber-primary);
      }

      .cyber-corner-decoration::before {
        top: -2px;
        left: -2px;
        border-right: none;
        border-bottom: none;
      }

      .cyber-corner-decoration::after {
        bottom: -2px;
        right: -2px;
        border-left: none;
        border-top: none;
      }

      .cyber-hexagon {
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
      }

      .cyber-diagonal-lines {
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(0, 255, 249, 0.03) 10px,
          rgba(0, 255, 249, 0.03) 20px
        );
      }

      .cyber-hologram {
        background: linear-gradient(
          135deg,
          rgba(0, 255, 249, 0.1) 0%,
          rgba(255, 0, 255, 0.1) 50%,
          rgba(252, 238, 10, 0.1) 100%
        );
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      @keyframes float {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }

      .cyber-float {
        animation: float 3s ease-in-out infinite;
      }

      @keyframes rotate-glow {
        0% {
          filter: hue-rotate(0deg);
        }
        100% {
          filter: hue-rotate(360deg);
        }
      }

      .cyber-rotate-glow {
        animation: rotate-glow 10s linear infinite;
      }

      .cyber-text-gradient {
        background: linear-gradient(90deg, var(--cyber-primary), var(--cyber-secondary), var(--cyber-accent));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .cyber-underline {
        position: relative;
      }

      .cyber-underline::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 2px;
        background: var(--cyber-primary);
        box-shadow: var(--cyber-glow-primary);
        transition: width 0.3s ease;
      }

      .cyber-underline:hover::after {
        width: 100%;
      }

      .cyber-tag {
        display: inline-block;
        padding: 4px 12px;
        background: rgba(0, 255, 249, 0.1);
        border: 1px solid var(--cyber-border);
        color: var(--cyber-primary);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.3s ease;
      }

      .cyber-tag:hover {
        background: var(--cyber-primary);
        color: var(--cyber-bg-dark);
        box-shadow: var(--cyber-glow-primary);
      }

      .cyber-input {
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid var(--cyber-border);
        color: var(--cyber-primary);
        padding: 10px 16px;
        outline: none;
        transition: all 0.3s ease;
      }

      .cyber-input:focus {
        border-color: var(--cyber-primary);
        box-shadow: var(--cyber-glow-primary);
      }

      .cyber-input::placeholder {
        color: var(--cyber-text-dim);
      }

      .cyber-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--cyber-primary), var(--cyber-secondary), transparent);
        margin: 20px 0;
      }

      @keyframes matrix-rain {
        0% {
          transform: translateY(-100%);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh);
          opacity: 0;
        }
      }

      .cyber-matrix-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
        overflow: hidden;
      }

      .tags-group-wrapper {
        animation: rowup 60s linear infinite;
      }

      @keyframes rowup {
        0% {
          transform: translateX(0%);
        }
        100% {
          transform: translateX(-50%);
        }
      }

      .today-card-cover {
        -webkit-mask-image: linear-gradient(to top, transparent 5%, black 70%);
        mask-image: linear-gradient(to top, transparent 5%, black 70%);
      }

      .recent-top-post-group::-webkit-scrollbar {
        display: none;
      }

      .scroll-hidden::-webkit-scrollbar {
        display: none;
      }

      * {
        box-sizing: border-box;
      }

      #more {
        white-space: nowrap;
      }

      #theme-cyberpunk a {
        color: var(--cyber-primary);
        transition: all 0.3s ease;
      }

      #theme-cyberpunk a:hover {
        color: var(--cyber-secondary);
        text-shadow: var(--cyber-glow-secondary);
      }

      #theme-cyberpunk h1,
      #theme-cyberpunk h2,
      #theme-cyberpunk h3,
      #theme-cyberpunk h4,
      #theme-cyberpunk h5,
      #theme-cyberpunk h6 {
        color: var(--cyber-primary);
        text-shadow: 0 0 10px rgba(0, 255, 249, 0.5);
      }

      #theme-cyberpunk code {
        background: rgba(0, 255, 249, 0.1);
        border: 1px solid var(--cyber-border);
        color: var(--cyber-accent);
        padding: 2px 6px;
        border-radius: 0;
      }

      #theme-cyberpunk pre {
        background: var(--cyber-bg-darker);
        border: 1px solid var(--cyber-border);
        border-left: 3px solid var(--cyber-primary);
        box-shadow: inset 0 0 30px rgba(0, 255, 249, 0.05);
      }

      #theme-cyberpunk blockquote {
        border-left: 3px solid var(--cyber-secondary);
        background: rgba(255, 0, 255, 0.05);
        color: var(--cyber-text);
      }

      #theme-cyberpunk table {
        border: 1px solid var(--cyber-border);
      }

      #theme-cyberpunk th {
        background: rgba(0, 255, 249, 0.1);
        color: var(--cyber-primary);
        border-bottom: 2px solid var(--cyber-primary);
      }

      #theme-cyberpunk td {
        border-bottom: 1px solid var(--cyber-border);
      }

      #theme-cyberpunk tr:hover td {
        background: rgba(0, 255, 249, 0.05);
      }

      #theme-cyberpunk hr {
        border: none;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--cyber-primary), var(--cyber-secondary), transparent);
      }

      #theme-cyberpunk img {
        border: 1px solid var(--cyber-border);
        transition: all 0.3s ease;
      }

      #theme-cyberpunk img:hover {
        box-shadow: var(--cyber-glow-primary);
      }

      #theme-cyberpunk .bg-white {
        background-color: var(--cyber-bg-card) !important;
      }

      #theme-cyberpunk .dark\:bg-\[\#18171d\] {
        background-color: var(--cyber-bg-dark) !important;
      }

      #theme-cyberpunk .dark\:bg-\[\#1e1e1e\] {
        background-color: var(--cyber-bg-card) !important;
      }

      #theme-cyberpunk .dark\:bg-\[\#1B1C20\] {
        background-color: var(--cyber-bg-card) !important;
      }

      #theme-cyberpunk .text-black {
        color: var(--cyber-text) !important;
      }

      #theme-cyberpunk .dark\:text-white {
        color: var(--cyber-text) !important;
      }

      #theme-cyberpunk .dark\:text-gray-200 {
        color: var(--cyber-primary) !important;
      }

      #theme-cyberpunk .dark\:text-gray-400 {
        color: var(--cyber-text-dim) !important;
      }

      #theme-cyberpunk .border {
        border-color: var(--cyber-border) !important;
      }

      #theme-cyberpunk .dark\:border-gray-600 {
        border-color: var(--cyber-border) !important;
      }

      #theme-cyberpunk .dark\:border-gray-800 {
        border-color: var(--cyber-border) !important;
      }

      #theme-cyberpunk .hover\:bg-indigo-600:hover {
        background-color: var(--cyber-primary) !important;
        color: var(--cyber-bg-dark) !important;
        box-shadow: var(--cyber-glow-primary) !important;
      }

      #theme-cyberpunk .hover\:text-white:hover {
        color: var(--cyber-bg-dark) !important;
      }

      #theme-cyberpunk .bg-indigo-600 {
        background-color: var(--cyber-primary) !important;
      }

      #theme-cyberpunk .bg-blue-500 {
        background-color: var(--cyber-primary) !important;
        box-shadow: var(--cyber-glow-primary);
      }

      #theme-cyberpunk .hover\:bg-blue-600:hover {
        background-color: var(--cyber-secondary) !important;
        box-shadow: var(--cyber-glow-secondary);
      }

      #theme-cyberpunk .text-red-500 {
        color: var(--cyber-warning) !important;
      }

      #theme-cyberpunk .border-b {
        border-bottom-color: var(--cyber-primary) !important;
      }

      #theme-cyberpunk .border-dashed {
        border-style: dashed !important;
        border-color: var(--cyber-border) !important;
      }

      #theme-cyberpunk .shadow {
        box-shadow: 0 0 20px rgba(0, 255, 249, 0.2) !important;
      }

      #theme-cyberpunk .hover\:shadow:hover {
        box-shadow: var(--cyber-glow-primary) !important;
      }

      #theme-cyberpunk .rounded-xl,
      #theme-cyberpunk .rounded-2xl,
      #theme-cyberpunk .rounded-3xl,
      #theme-cyberpunk .rounded-lg {
        border-radius: 0 !important;
      }

      #theme-cyberpunk .bg-\[\#f1f3f8\] {
        background-color: rgba(0, 255, 249, 0.2) !important;
        color: var(--cyber-primary) !important;
      }

      #theme-cyberpunk .group-hover\:text-indigo-600 {
        color: var(--cyber-bg-dark) !important;
      }

      #theme-cyberpunk .stroke-gray-500 {
        stroke: var(--cyber-primary) !important;
      }
    `}</style>
  )
}

export { Style }
