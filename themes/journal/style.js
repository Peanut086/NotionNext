import { siteConfig } from '@/lib/config'

/**
 * journal 主题的全部造型都在这一个作用域 `#theme-journal` 内。
 * 不修改 styles/notion.css，只覆盖颜色/边框/间距；
 * 旋转一律加在主题自己的包装层上，`.notion-*` 上禁止 transform。
 */
export const Style = () => {
  const enableFont = siteConfig('FONT_STYLE', 'font-sans')

  return (
    <style jsx global>{`
      /* 手写 / 印刷 / 等宽四层拉丁字形；中文手写靠自托管的霞鹜文楷 */
      @import url('https://fonts.googleapis.com/css2?family=Amatic+SC:wght@700&family=Kalam:wght@400;700&family=Cabin:wght@400;600&family=JetBrains+Mono:wght@500&display=swap');

      /* 霞鹜文楷 GB2312 子集（public/fonts/，OFL 1.1）。
         官方无 700 档、最重是 Medium，故 400/700 两档都指向同一份 Medium；
         族名带 Sub 后缀是为了不和站点 CUSTOM_CSS 里那份 CDN 版 'LXGW WenKai' 抢权重 */
      @font-face {
        font-family: 'LXGW WenKai Sub';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('/fonts/LXGWWenKai-Medium.subset.woff2') format('woff2');
      }
      @font-face {
        font-family: 'LXGW WenKai Sub';
        font-style: normal;
        font-weight: 700;
        font-display: swap;
        src: url('/fonts/LXGWWenKai-Medium.subset.woff2') format('woff2');
      }

      /* ---------- 1. Token ---------- */
      #theme-journal {
        --paper: #fdfbf7;
        --slip: #ffffff;
        --ink: #2d2d2d;
        --ink-soft: #5c5c5c;
        --red: #ff4d4d;
        --blue: #2d5da1;
        --yellow: #fff9c4;
        --tape: rgba(232, 223, 207, 0.7);
        --grid: rgba(45, 93, 161, 0.14);

        --font-marker: 'Amatic SC', 'Kalam', var(--font-cjk-hand), cursive;
        --font-hand: 'Kalam', var(--font-cjk-hand), 'Noto Serif SC', serif;
        --font-print:
          'Cabin', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
        --font-stamp:
          'JetBrains Mono', ui-monospace, 'SFMono-Regular', Consolas, monospace;
        --font-cjk-hand:
          'LXGW WenKai Sub', 'Kaiti SC', 'STKaiti', 'KaiTi', serif;

        --wobble: 255px 15px 225px 15px / 15px 225px 15px 255px;
        --wobble-alt: 15px 225px 15px 255px / 255px 15px 225px 15px;
        --shadow: 5px 5px 0 var(--ink);
        --shadow-hover: 6px 6px 0 var(--ink);
        /* 纸条墨边专用：与 --ink 同源，只有「纸会老」的旧档会把它换成 --ink-soft。
           阴影不吃这个 token —— 阴影是结构，不褪色 */
        --j-edge: var(--ink);
        /* 蓝圆珠笔波浪下划线：链接与「手绘文字链」共用同一份 */
        --hand-underline: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='6' viewBox='0 0 60 6'%3E%3Cpath d='M0 3.6C7 1.2 13 5 20 3.1s13-3.4 20-1.3 14 3.4 20 1.1' fill='none' stroke='%232D5DA1' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
        /* plog 撕线：一行铅笔墨点，同样把颜色写死在 data URI 里 */
        --tear-line: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='6' viewBox='0 0 12 6'%3E%3Ccircle cx='6' cy='3' r='1.7' fill='%235C5C5C'/%3E%3C/svg%3E");
        /* 红字批注的回指箭头：颜色同样烧在 data URI 里，j-night 要再覆盖一次 */
        --backref-arrow: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='21' viewBox='0 0 30 21'%3E%3Cpath d='M28 20C24 15 17 10 5 5M12.6 4.2C10.4 4.2 7.6 4.4 5 5M5 5C5.4 7.6 6 10.2 7.4 12.6' fill='none' stroke='%23FF4D4D' stroke-width='1.9' stroke-linecap='round'/%3E%3C/svg%3E");

        color: var(--ink);
        background-color: var(--paper);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.18 0 0 0 0 0.16 0 0 0 0 0.12 0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
        font-family: ${
          enableFont === 'font-sans'
            ? 'var(--font-print)'
            : enableFont + ', var(--font-print)'
        };
        font-size: 17px;
        line-height: 1.9;
        min-height: 100vh;
      }

      /* 牛皮纸夜间：降级方案，只换纸色并把三个彩色降饱和 */
      #theme-journal.j-night {
        --paper: #2a2622;
        --slip: #34302b;
        --ink: #ede6da;
        --ink-soft: #b9b0a3;
        --red: #d9605f;
        --blue: #7ea4d0;
        --yellow: #6b6233;
        --tape: rgba(120, 108, 88, 0.6);
        --grid: rgba(126, 164, 208, 0.18);
        /* 波浪下划线是内联 SVG，颜色写死在 data URI 里，所以夜间要换一份 */
        --hand-underline: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='6' viewBox='0 0 60 6'%3E%3Cpath d='M0 3.6C7 1.2 13 5 20 3.1s13-3.4 20-1.3 14 3.4 20 1.1' fill='none' stroke='%237EA4D0' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
        --tear-line: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='6' viewBox='0 0 12 6'%3E%3Ccircle cx='6' cy='3' r='1.7' fill='%23B9B0A3'/%3E%3C/svg%3E");
        --backref-arrow: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='21' viewBox='0 0 30 21'%3E%3Cpath d='M28 20C24 15 17 10 5 5M12.6 4.2C10.4 4.2 7.6 4.4 5 5M5 5C5.4 7.6 6 10.2 7.4 12.6' fill='none' stroke='%23D9605F' stroke-width='1.9' stroke-linecap='round'/%3E%3C/svg%3E");
      }

      /* ---------- 2. 手写体分层 ---------- */
      #theme-journal .j-marker {
        font-family: var(--font-marker);
        font-weight: 700;
        letter-spacing: 0.02em;
      }
      #theme-journal .j-hand {
        font-family: var(--font-hand);
        font-weight: 700;
        line-height: 1.35;
      }
      #theme-journal .j-print {
        font-family: var(--font-print);
        font-weight: 400;
        line-height: 1.9;
      }
      #theme-journal .j-stamp {
        font-family: var(--font-stamp);
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.12em;
      }
      #theme-journal .j-soft {
        color: var(--ink-soft);
      }
      #theme-journal .j-red {
        color: var(--red);
      }
      #theme-journal .j-blue {
        color: var(--blue);
      }

      /* 邮戳：双层边框 + 微糊 + 反斜 */
      #theme-journal .j-stamp-date {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 9px;
        color: var(--red);
        border: 2px solid var(--red);
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0);
        outline: 1px solid var(--red);
        outline-offset: 2px;
        border-radius: var(--wobble-alt);
        transform: rotate(-4deg);
        filter: blur(0.2px);
      }

      /* 荧光笔划 */
      #theme-journal .j-highlight,
      #theme-journal mark.j-marker-hit {
        background: linear-gradient(
          100deg,
          transparent 2%,
          var(--yellow) 6% 94%,
          transparent 98%
        );
        background-size: 100% 62%;
        background-position: 0 78%;
        background-repeat: no-repeat;
        color: inherit;
        padding: 0 2px;
      }

      /* ---------- 3. 纸片 / 胶带 / 硬阴影 ---------- */
      #theme-journal .j-slip {
        position: relative;
        background: var(--slip);
        border: 2px solid var(--j-edge);
        border-radius: var(--wobble);
        box-shadow: var(--shadow);
        transform: rotate(var(--r, 0deg));
        transition:
          transform 140ms ease,
          box-shadow 140ms ease;
      }
      #theme-journal .j-slip:hover {
        transform: rotate(var(--r, 0deg)) translate(-1px, -1px);
        box-shadow: var(--shadow-hover);
      }
      #theme-journal .j-slip-alt {
        border-radius: var(--wobble-alt);
      }

      /* 旋转必须来自静态 nth-child 表，不能来自 JS 随机 */
      #theme-journal .j-tilt-group > *:nth-child(6n + 1) {
        --r: -1.2deg;
      }
      #theme-journal .j-tilt-group > *:nth-child(6n + 2) {
        --r: 0.8deg;
      }
      #theme-journal .j-tilt-group > *:nth-child(6n + 3) {
        --r: -0.5deg;
      }
      #theme-journal .j-tilt-group > *:nth-child(6n + 4) {
        --r: 1.2deg;
      }
      #theme-journal .j-tilt-group > *:nth-child(6n + 5) {
        --r: -0.9deg;
      }
      #theme-journal .j-tilt-group > *:nth-child(6n + 6) {
        --r: 0.4deg;
      }
      #theme-journal .j-tilt-slow > *:nth-child(odd) {
        --r: -2deg;
      }
      #theme-journal .j-tilt-slow > *:nth-child(even) {
        --r: 1.6deg;
      }

      /* 和纸胶带：两端锯齿 */
      #theme-journal .j-tape::before,
      #theme-journal .j-tape::after {
        content: '';
        position: absolute;
        width: 74px;
        height: 22px;
        background: var(--tape);
        clip-path: polygon(
          0 12%,
          4% 0,
          10% 10%,
          17% 0,
          24% 9%,
          32% 0,
          40% 11%,
          49% 2%,
          58% 10%,
          67% 0,
          76% 9%,
          85% 0,
          93% 11%,
          100% 2%,
          100% 98%,
          93% 88%,
          85% 100%,
          76% 91%,
          67% 100%,
          58% 90%,
          49% 98%,
          40% 89%,
          32% 100%,
          24% 91%,
          17% 100%,
          10% 90%,
          4% 100%,
          0 88%
        );
        opacity: 0.85;
        pointer-events: none;
        z-index: 2;
      }
      #theme-journal .j-tape::before {
        top: -12px;
        left: 12%;
        transform: rotate(-5deg);
      }
      #theme-journal .j-tape::after {
        top: -12px;
        right: 10%;
        transform: rotate(4deg);
      }
      #theme-journal .j-tape-single::before {
        content: '';
        position: absolute;
        top: -11px;
        left: 50%;
        width: 96px;
        height: 22px;
        margin-left: -48px;
        background: var(--tape);
        opacity: 0.85;
        transform: rotate(-2deg);
        clip-path: polygon(
          0 10%,
          12% 0,
          26% 11%,
          41% 1%,
          55% 10%,
          70% 0,
          85% 11%,
          100% 2%,
          100% 92%,
          85% 100%,
          70% 89%,
          55% 100%,
          41% 90%,
          26% 100%,
          12% 89%,
          0 96%
        );
        pointer-events: none;
        z-index: 2;
      }

      /* ---------- 3b. 状态编码：材质即语法 ---------- *
       * 判定与规格都在 MASTER「状态编码」节，这里只负责呈现 */

      /* 精选 = 便利贴黄纸底；plog 短记 = 和纸色纸底。
         写在后面的一条胜出，即两者同时命中时取黄（精选是作者意图，plog 是体裁） */
      #theme-journal .j-slip.j-receipt {
        background: var(--tape);
      }
      #theme-journal .j-slip.j-featured {
        background: var(--yellow);
      }

      /* plog 撕线：一行墨点平铺。不用 mask —— 给纸条上 mask 会连带咬掉歪斜墨边 */
      #theme-journal .j-teeth {
        position: absolute;
        top: 9px;
        left: 16px;
        right: 16px;
        height: 6px;
        background-image: var(--tear-line);
        background-repeat: repeat-x;
        opacity: 0.6;
        pointer-events: none;
      }

      /* 已修订 = 左下角再斜贴一小块胶带（另贴一次），不占上沿、不与主胶带混在一起 */
      #theme-journal .j-tape-bit {
        position: absolute;
        bottom: -9px;
        left: 26px;
        width: 46px;
        height: 17px;
        background: var(--tape);
        opacity: 0.75;
        transform: rotate(-34deg);
        clip-path: polygon(
          0 12%,
          14% 0,
          31% 11%,
          49% 1%,
          66% 10%,
          83% 0,
          100% 8%,
          100% 92%,
          83% 100%,
          66% 90%,
          49% 100%,
          31% 89%,
          14% 100%,
          0 90%
        );
        pointer-events: none;
        z-index: 3;
      }

      /* 置顶 = 图钉在左上角 */
      #theme-journal .j-pin {
        position: absolute;
        top: -19px;
        left: 18px;
        z-index: 3;
        transform: rotate(-6deg);
        filter: drop-shadow(2px 2px 0 var(--ink));
        pointer-events: none;
      }
      #theme-journal .j-pin-doodle {
        display: block;
      }

      /* 右上角只有一格：加密的折叠角优先于带图的拍立得角标 */
      #theme-journal .j-fold {
        position: absolute;
        top: -13px;
        right: 20px;
        z-index: 3;
        transform: rotate(2deg);
        pointer-events: none;
      }
      #theme-journal .j-photo-tab {
        position: absolute;
        top: -14px;
        right: 18px;
        z-index: 3;
        display: grid;
        place-items: center;
        width: 40px;
        height: 38px;
        padding-bottom: 12px;
        background: var(--slip);
        border: 2px solid var(--ink);
        color: var(--ink-soft);
        box-shadow: 3px 3px 0 var(--ink);
        transform: rotate(-7deg);
        pointer-events: none;
      }

      #theme-journal .j-photo-tab svg {
        /* 和纸色当"照片"，否则白框贴在白纸上完全看不出来 */
        background: var(--tape);
      }

      /* 图形不承载唯一信息：每个状态都配一个 Stamp 层文字 */
      #theme-journal .j-mark {
        color: var(--ink-soft);
      }

      /* ---------- 3c. 目录 = 侧伸的索引贴 ---------- */
      #theme-journal .j-tabs {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 7px;
      }
      #theme-journal .j-tab {
        position: relative;
        display: block;
        margin-left: var(--j-ind, 0px);
        max-width: calc(100% - var(--j-ind, 0px));
        padding: 4px 11px 4px 17px;
        background: var(--slip);
        border: 2px solid var(--ink);
        border-radius: 3px 14px 4px 12px / 12px 4px 14px 3px;
        box-shadow: 3px 3px 0 var(--ink);
        transform: rotate(var(--r, 0deg));
        transition:
          transform 140ms ease,
          box-shadow 140ms ease;
      }
      /* 伸出端那一小条色带：只做定位色，不承载状态语义 */
      #theme-journal .j-tab::before {
        content: '';
        position: absolute;
        top: -2px;
        bottom: -2px;
        left: -2px;
        width: 9px;
        background: var(--yellow);
        border: 2px solid var(--ink);
        border-radius: 3px 0 0 4px;
      }
      #theme-journal .j-tabs > .j-tab:nth-child(3n + 2)::before {
        background: var(--blue);
      }
      #theme-journal .j-tabs > .j-tab:nth-child(3n + 3)::before {
        background: var(--red);
      }
      /* 旋转固定表，仍不用 JS 随机 */
      #theme-journal .j-tabs > .j-tab:nth-child(3n + 1) {
        --r: -1deg;
      }
      #theme-journal .j-tabs > .j-tab:nth-child(3n + 2) {
        --r: 0.7deg;
      }
      #theme-journal .j-tabs > .j-tab:nth-child(3n + 3) {
        --r: -0.5deg;
      }
      #theme-journal .j-tab:hover {
        transform: rotate(var(--r, 0deg)) translate(-2px, -1px);
        box-shadow: 5px 5px 0 var(--ink);
      }
      #theme-journal .j-tab-text {
        display: block;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-family: var(--font-print);
        font-size: 15px;
        line-height: 1.5;
        color: var(--ink);
      }
      /* 当前那张：向左抽出一截 + 一道红笔划过 */
      #theme-journal .j-tab-current,
      #theme-journal .j-tab-current:hover {
        transform: rotate(var(--r, 0deg)) translateX(-6px);
        box-shadow: 5px 5px 0 var(--ink);
      }
      #theme-journal .j-tab-current .j-tab-text {
        color: var(--ink);
      }
      #theme-journal .j-rule.j-tab-slash {
        position: absolute;
        left: 16px;
        right: 6px;
        bottom: 1px;
        width: calc(100% - 22px);
        height: 10px;
        transform: rotate(-1.6deg);
        opacity: 0.85;
      }

      /* ---------- 3d. 一天一摊：日期是纸，不是字段 ---------- */
      #theme-journal .j-day {
        position: relative;
      }
      #theme-journal .j-days > .j-day + .j-day {
        margin-top: 36px;
      }
      /* 摊眉：邮戳 + 星期/月份 + 张数，日期永远有字，不靠图形单独表达 */
      #theme-journal .j-day-head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 22px;
      }
      #theme-journal .j-day-stamp {
        font-size: 17px;
      }
      #theme-journal .j-day-week {
        font-size: 16px;
      }
      #theme-journal .j-day-count {
        color: var(--ink-soft);
      }
      #theme-journal .j-day-page {
        display: grid;
        align-content: start;
        gap: 24px;
      }
      #theme-journal .j-day-spread {
        display: grid;
        gap: 24px;
      }
      @media (min-width: 768px) {
        #theme-journal .j-day-spread {
          grid-template-columns: minmax(0, 1fr) 2px minmax(0, 1fr);
          gap: 26px;
          align-items: stretch;
        }
      }
      /* 装订中缝：真实元素，窄屏折成横向一道；虚线只用 border-style */
      #theme-journal .j-spine {
        justify-self: center;
        margin: 18px 0;
        border-left: 2px dashed var(--ink-soft);
        opacity: 0.5;
      }
      @media (max-width: 767px) {
        #theme-journal .j-spine {
          width: 100%;
          align-self: center;
          margin: 0 18px;
          border-top: 2px dashed var(--ink-soft);
          border-left: 0;
        }
      }
      #theme-journal .j-day-more {
        display: inline-block;
        margin-top: 22px;
        font-size: 14px;
        color: var(--ink-soft);
      }
      /* 归档：一天一个时间轴节点，节点挂在摊眉那一行 */
      #theme-journal .j-days-axis .j-day::before {
        content: '';
        position: absolute;
        top: 4px;
        left: -26px;
        width: 10px;
        height: 10px;
        background: var(--slip);
        border: 2px solid var(--ink);
        border-radius: 40% 60% 50% 50%;
      }

      /* ---------- 3e. 打包细节：连线 / 抽屉 / 装订 ---------- */
      #theme-journal .j-around {
        display: grid;
        gap: 26px;
      }
      @media (min-width: 768px) {
        #theme-journal .j-around-both {
          grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1fr);
          gap: 0;
          align-items: center;
        }
      }
      #theme-journal .j-around-card {
        display: flex;
        flex-direction: column;
        gap: 2px;
        align-items: flex-start;
      }
      #theme-journal .j-around-card-right {
        align-items: flex-end;
      }
      /* 铅笔虚线 + 箭头：墨灰，不红（作者痕迹）也不蓝（可点击） */
      #theme-journal .j-thread {
        width: 100%;
        height: 24px;
        overflow: visible;
        color: var(--ink-soft);
      }
      #theme-journal .j-thread path {
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
      }
      #theme-journal .j-thread .j-thread-line {
        stroke-dasharray: 6 5;
      }
      @media (max-width: 767px) {
        #theme-journal .j-thread {
          width: 24px;
          margin: 0 auto;
          transform: rotate(90deg);
        }
      }
      /* 抽屉：面板在前，结果纸条从下沿后面抽出来 */
      #theme-journal .j-drawer {
        position: relative;
        z-index: 2;
      }
      #theme-journal .j-drawer-handle {
        position: absolute;
        bottom: -8px;
        left: 50%;
        width: 18px;
        height: 10px;
        margin-left: -9px;
        background: var(--slip);
        border: 2px solid var(--ink);
        border-bottom: 0;
        border-radius: 4px 6px 0 0 / 5px 7px 0 0;
        transform: rotate(-1.2deg);
      }
      #theme-journal .j-drawer-label {
        position: absolute;
        top: -13px;
        left: 18px;
        z-index: 3;
        padding: 1px 8px;
        background: var(--slip);
        border: 2px solid var(--ink);
        border-radius: var(--wobble-alt);
        transform: rotate(-3deg);
        font-size: 12px;
      }
      #theme-journal .j-drawer-out {
        margin-top: -14px;
      }
      /* 按年装订：顶部一道装订边 + 两枚订书钉，不另起第二道竖线 */
      #theme-journal .j-year-stack {
        position: relative;
        margin-top: 18px;
        padding-top: 14px;
      }
      #theme-journal .j-year-stack::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 92px;
        height: 2px;
        background: var(--ink);
        opacity: 0.75;
        transform: rotate(-0.4deg);
      }
      #theme-journal .j-staple {
        position: absolute;
        top: -7px;
        width: 16px;
        height: 9px;
        background: var(--paper);
        border: 2px solid var(--ink);
        border-bottom: 0;
        border-radius: 3px 5px 0 0 / 4px 6px 0 0;
      }
      #theme-journal .j-staple-a {
        left: 22px;
        transform: rotate(-8deg);
      }
      #theme-journal .j-staple-b {
        left: 48px;
        transform: rotate(6deg);
      }

      /* ---------- 3f. 纸会老：材质层，只淡墨不换色 ---------- *
         档位由 index.js 的 paperAge() 按 publishDate 算，只加类不写死样式。
         老化绝不碰底色（归状态编码）、不碰胶带（修订标记就是胶带）、不碰正文 */
      #theme-journal .j-age-1 .j-stamp-date {
        opacity: 0.86;
      }
      #theme-journal .j-age-2 .j-stamp-date {
        opacity: 0.72;
      }
      #theme-journal .j-age-2 {
        --j-edge: var(--ink-soft);
      }

      /* ---------- 3g. 红字批注：Notion 段落整段设红 = 作者的手 ---------- *
         语法是 block_color=red，react-notion-x 落到 .notion-text.notion-red。
         不搬进物理页边（测量框与纸缘只剩 112px）、本体不转（.notion-* 禁 transform）。
         margin 三条必须带 !important：内置 styles/notion.css 给 .notion-text 写了
         margin 简写且 !important，不压住它则 auto 推到右侧与上下留白全部静默失效 */
      #theme-journal .notion-text.notion-red {
        position: relative;
        width: min(30ch, 100%);
        margin-top: 26px !important;
        margin-bottom: 4px !important;
        margin-left: auto !important;
        padding-right: 2px;
        font-family: var(--font-hand);
        font-size: 19px;
        font-weight: 700;
        line-height: 1.6;
        color: var(--red);
      }
      /* 回指箭头：说的是上面那段正文。歪的只允许是这个伪元素 */
      #theme-journal .notion-text.notion-red::before {
        content: '';
        position: absolute;
        top: -22px;
        left: 0;
        width: 30px;
        height: 21px;
        background-image: var(--backref-arrow);
        background-repeat: no-repeat;
      }

      /* 便利贴黄 */
      #theme-journal .j-note {
        background: var(--yellow);
        color: var(--ink);
        border: 2px solid var(--ink);
        border-radius: 2px 18px 3px 14px / 14px 3px 16px 2px;
        box-shadow: var(--shadow);
        transform: rotate(var(--r, 0.8deg));
      }

      /* 手绘下划线出头 */
      #theme-journal .j-rule {
        display: block;
        width: 100%;
        height: 14px;
        overflow: visible;
      }
      #theme-journal .j-rule path {
        fill: none;
        stroke: var(--ink);
        stroke-width: 2.4;
        stroke-linecap: round;
      }
      #theme-journal .j-rule.j-rule-red path {
        stroke: var(--red);
      }

      /* 红手绘圈（包住当前项） */
      #theme-journal .j-circle {
        position: relative;
      }
      #theme-journal .j-circle > svg {
        position: absolute;
        inset: -8px -14px;
        width: calc(100% + 28px);
        height: calc(100% + 16px);
        overflow: visible;
        pointer-events: none;
      }
      #theme-journal .j-circle > svg path {
        fill: none;
        stroke: var(--red);
        stroke-width: 2.2;
        stroke-linecap: round;
      }

      /* 拍立得 */
      #theme-journal .j-polaroid {
        position: relative;
        background: #fff;
        border: 1px solid var(--ink);
        border-radius: 3px;
        padding: 10px 10px 34px;
        box-shadow: var(--shadow);
        transform: rotate(var(--r, -1.5deg));
        transition:
          transform 140ms ease,
          box-shadow 140ms ease;
      }
      #theme-journal .j-polaroid:hover {
        transform: rotate(var(--r, -1.5deg)) translate(-1px, -1px);
        box-shadow: var(--shadow-hover);
      }
      #theme-journal .j-polaroid img {
        display: block;
        width: 100%;
        border: 1px solid var(--ink);
      }
      #theme-journal .j-polaroid figcaption {
        margin-top: 8px;
        font-family: var(--font-hand);
        color: var(--blue);
        font-size: 15px;
      }

      /* 拍立得拼贴墙：间距不等、旋转幅度比正文纸条更大（-3°~+3°）。
         全部走 nth-child 静态表，不用 JS 随机，静态导出下也一致 */
      #theme-journal .j-collage {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(228px, 1fr));
        gap: 30px 24px;
        align-items: start;
      }
      #theme-journal .j-collage > *:nth-child(5n + 1) {
        --r: -2.4deg;
      }
      #theme-journal .j-collage > *:nth-child(5n + 2) {
        --r: 1.6deg;
        margin-top: 16px;
      }
      #theme-journal .j-collage > *:nth-child(5n + 3) {
        --r: -0.8deg;
      }
      #theme-journal .j-collage > *:nth-child(5n + 4) {
        --r: 2.8deg;
        margin-top: -12px;
      }
      #theme-journal .j-collage > *:nth-child(5n + 5) {
        --r: 0.6deg;
        margin-top: 10px;
      }
      #theme-journal .j-collage > *:nth-child(3n) {
        margin-right: 6px;
      }
      /* 没有封面的那条：单色线稿占位，不给灰块 */
      #theme-journal .j-photo-empty {
        display: grid;
        place-items: center;
        aspect-ratio: 4 / 3;
        background: var(--paper);
        border: 1px solid var(--ink);
        color: var(--ink-soft);
      }

      /* 链接：蓝圆珠笔波浪下划线 */
      #theme-journal a {
        color: var(--blue);
        text-decoration: none;
        background-image: var(--hand-underline);
        background-repeat: repeat-x;
        background-size: 60px 6px;
        background-position: 0 96%;
        transition: background-position 180ms ease;
      }
      /* 手绘文字链：不是 <a> 的行动点（如「复制链接」）也必须有同一条波浪线 */
      #theme-journal .j-textlink {
        border: 0;
        padding: 0;
        cursor: pointer;
        color: var(--blue);
        background-color: transparent;
        background-image: var(--hand-underline);
        background-repeat: repeat-x;
        background-size: 60px 6px;
        background-position: 0 96%;
        transition: background-position 180ms ease;
      }
      #theme-journal a:hover,
      #theme-journal .j-textlink:hover {
        background-position: 0 88%;
      }
      #theme-journal a.j-plain {
        background-image: none;
      }

      /* 焦点态必须是虚线且可见 */
      #theme-journal a:focus-visible,
      #theme-journal button:focus-visible,
      #theme-journal input:focus-visible,
      #theme-journal summary:focus-visible {
        outline: 2px dashed var(--blue);
        outline-offset: 3px;
      }

      /* ---------- 4. 按钮 / 表单 ---------- */
      #theme-journal .j-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 8px 20px;
        background: var(--slip);
        color: var(--ink);
        border: 2px solid var(--ink);
        border-radius: var(--wobble);
        box-shadow: var(--shadow);
        font-family: var(--font-hand);
        font-size: 18px;
        transition:
          transform 140ms ease,
          box-shadow 140ms ease;
      }
      #theme-journal .j-btn:hover {
        transform: translate(-1px, -1px);
        box-shadow: var(--shadow-hover);
      }
      #theme-journal .j-btn-red {
        background: var(--red);
        color: #fff;
      }
      #theme-journal .j-btn-yellow {
        background: var(--yellow);
        color: var(--ink);
      }
      #theme-journal .j-field {
        width: 100%;
        min-height: 44px;
        padding: 8px 2px;
        background: transparent;
        border: 0;
        border-bottom: 2px solid var(--ink);
        border-radius: 0;
        color: var(--ink);
        font-family: var(--font-hand);
        font-size: 19px;
      }
      #theme-journal .j-field::placeholder {
        color: var(--ink-soft);
        font-family: var(--font-print);
        font-size: 15px;
      }

      /* ---------- 5. 布局容器 ---------- */
      #theme-journal .j-shell {
        width: 100%;
        max-width: 1180px;
        /* 只锁横向：写成 margin/padding 简写会以 ID 特异度压掉同元素上的
           Tailwind 竖向工具类（mt、py 等），整站留白会静默失效 */
        margin-left: auto;
        margin-right: auto;
        padding-left: 20px;
        padding-right: 20px;
      }
      #theme-journal .j-masthead {
        padding: 40px 0 6px;
      }
      #theme-journal .j-section {
        padding: 30px 0;
      }
      #theme-journal .j-dashed-rule {
        border: 0;
        border-top: 2px dashed var(--ink-soft);
        opacity: 0.55;
        margin: 30px 12%;
      }

      /* 阅读进度：红色马克笔笔迹，粗细不均 */
      #theme-journal .j-progress {
        position: fixed;
        top: 0;
        left: 0;
        height: 5px;
        width: var(--j-progress, 0%);
        z-index: 60;
        pointer-events: none;
        background: var(--red);
        border-radius: 0 3px 2px 0 / 0 6px 4px 0;
        box-shadow: 2px 0 0 0 var(--red);
        clip-path: polygon(
          0 22%,
          18% 0,
          44% 30%,
          71% 6%,
          100% 26%,
          100% 86%,
          72% 100%,
          45% 74%,
          19% 100%,
          0 78%
        );
      }

      /* ---------- 6. Notion 块手账化（禁止 transform） ---------- */
      #theme-journal .notion-app,
      #theme-journal .notion {
        --fgColor: var(--ink);
        --bgColor: var(--paper);
        --notion-font: var(--font-print);
        font-family: var(--font-print);
        color: var(--ink);
        background: transparent;
      }
      #theme-journal .notion h1,
      #theme-journal .notion h2,
      #theme-journal .notion h3,
      #theme-journal .notion h4 {
        font-family: var(--font-hand);
        color: var(--ink);
        line-height: 1.3;
        letter-spacing: 0;
      }
      #theme-journal .notion h1 {
        font-size: 34px;
      }
      #theme-journal .notion h2 {
        font-size: 27px;
        border-bottom: 0;
        padding-bottom: 0;
      }
      #theme-journal .notion h3 {
        font-size: 21px;
      }
      #theme-journal .notion p,
      #theme-journal .notion li,
      #theme-journal .notion-text {
        font-family: var(--font-print);
        font-size: 17px;
        line-height: 1.9;
        color: var(--ink);
      }
      #theme-journal .notion {
        max-width: 62ch;
      }
      #theme-journal .notion-page-block,
      #theme-journal .notion-header {
        max-width: 62ch;
      }
      #theme-journal .notion-link {
        color: var(--blue);
        border-bottom: 0;
        text-decoration: none;
      }
      #theme-journal .notion-list > li {
        padding-left: 2px;
      }
      #theme-journal .notion-list-ordered > li::marker,
      #theme-journal .notion-list > li::marker {
        color: var(--red);
        font-family: var(--font-stamp);
        font-size: 14px;
      }

      /* 引用 = 胶带纸条。
         实测 Notion 里引用块常被当成正文段用，所以只做轻边框 + 左侧蓝墨条，
         文字保持 Print 层可读性，不做手写蓝。 */
      #theme-journal .notion-blockquote,
      #theme-journal .notion-quote {
        position: relative;
        background: var(--slip);
        border: 1px solid var(--ink);
        border-left: 3px solid var(--blue);
        border-radius: 3px 14px 4px 12px / 12px 4px 14px 3px;
        box-shadow: 3px 3px 0 rgba(45, 45, 45, 0.45);
        padding: 14px 20px !important;
        margin: 24px 6px;
      }
      #theme-journal .notion-blockquote::before,
      #theme-journal .notion-quote::before {
        content: '';
        position: absolute;
        top: -13px;
        left: 22px;
        width: 84px;
        height: 22px;
        background: var(--tape);
        transform: rotate(-3deg);
        clip-path: polygon(
          0 10%,
          14% 0,
          30% 11%,
          47% 1%,
          63% 10%,
          80% 0,
          100% 9%,
          100% 92%,
          80% 100%,
          63% 89%,
          47% 99%,
          30% 88%,
          14% 100%,
          0 90%
        );
      }
      /* 分隔线：两端不到边的歪墨线 */
      #theme-journal .notion-dividers hr,
      #theme-journal .notion hr {
        border: 0;
        height: 10px;
        margin: 28px 16%;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='10' viewBox='0 0 240 10'%3E%3Cpath d='M2 6.4C46 2.2 92 8.6 138 4.1s66 1.4 100-1.2' fill='none' stroke='%232D2D2D' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E");
        background-repeat: repeat-x;
        background-size: 240px 10px;
        opacity: 0.8;
      }

      /* 代码块 = 牛皮纸深色剪纸 */
      #theme-journal .notion-code {
        background: #34302b !important;
        border: 2px solid var(--ink) !important;
        border-radius: 6px 18px 5px 14px / 14px 5px 16px 6px;
        box-shadow: var(--shadow);
        padding: 20px 18px !important;
        max-width: none;
      }
      #theme-journal .notion-code code,
      #theme-journal .notion-code pre {
        color: #ede6da !important;
        font-family: var(--font-stamp) !important;
        font-size: 13.5px !important;
        line-height: 1.75 !important;
        background: transparent !important;
      }
      /* 低饱和语法色，禁霓虹 */
      #theme-journal .notion-code .token.comment {
        color: #8c8375 !important;
      }
      #theme-journal .notion-code .token.keyword {
        color: #d4a373 !important;
      }
      #theme-journal .notion-code .token.string {
        color: #a3b565 !important;
      }
      #theme-journal .notion-code .token.function {
        color: #8fb0c9 !important;
      }
      #theme-journal .notion-code .token.number {
        color: #c9a0a0 !important;
      }
      #theme-journal .notion-code-copy {
        opacity: 0.85;
      }

      /* 表格 = 方格稿纸 */
      #theme-journal .notion-table,
      #theme-journal .notion-simple-table {
        border: 2px solid var(--ink) !important;
        border-radius: var(--wobble);
        box-shadow: var(--shadow);
        overflow: hidden;
        background-color: var(--slip);
        background-image:
          linear-gradient(var(--grid) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid) 1px, transparent 1px);
        background-size: 22px 22px;
      }
      #theme-journal .notion-simple-table-header th {
        background: var(--yellow) !important;
        font-family: var(--font-hand);
        border-bottom: 2px solid var(--ink) !important;
      }
      #theme-journal .notion-simple-table td,
      #theme-journal .notion-simple-table th {
        border-color: var(--grid) !important;
      }

      /* 任务列表：手绘方框 */
      #theme-journal .notion-to_do input[type='checkbox'] {
        appearance: none;
        width: 17px;
        height: 17px;
        border: 2px solid var(--ink);
        border-radius: 3px 5px 4px 6px / 6px 4px 5px 3px;
        background: var(--slip);
        cursor: default;
      }
      #theme-journal .notion-to_do input[type='checkbox']:checked {
        background: var(--slip);
        border-color: var(--red);
      }
      /* 完成态的勾要超出方框（真笔签字感）；:has 不支持时降级为不出勾 */
      #theme-journal .notion-to_do {
        position: relative;
      }
      #theme-journal .notion-to_do:has(input[type='checkbox']:checked)::after {
        content: '';
        position: absolute;
        left: 3px;
        top: -1px;
        width: 13px;
        height: 14px;
        border-left: 2.5px solid var(--red);
        border-bottom: 2.5px solid var(--red);
        border-radius: 0 0 0 42%;
        transform: rotate(-40deg);
        pointer-events: none;
      }
      #theme-journal
        .notion-to_do:has(input[type='checkbox']:checked)
        .notion-text {
        text-decoration: line-through;
        text-decoration-thickness: 2px;
        text-decoration-color: var(--ink-soft);
        opacity: 0.72;
      }

      /* Toggle：手绘三角 + 虚线框 */
      #theme-journal .notion-toggle {
        border: 2px dashed var(--ink-soft);
        border-radius: var(--wobble-alt);
        padding: 10px 14px;
        background: transparent;
      }
      #theme-journal .notion-toggle > summary {
        font-family: var(--font-hand);
        font-size: 19px;
        list-style: none;
        cursor: pointer;
      }
      #theme-journal .notion-toggle > summary::before {
        content: '▸';
        color: var(--red);
        margin-right: 6px;
      }
      #theme-journal .notion-toggle[open] > summary::before {
        content: '▾';
      }

      /* Callout = 便利贴 */
      #theme-journal .notion-callout {
        background: var(--yellow) !important;
        border: 2px solid var(--ink);
        border-radius: 4px 16px 3px 12px / 12px 3px 15px 4px;
        box-shadow: var(--shadow);
        padding: 14px 16px !important;
      }
      #theme-journal .notion-callout-text,
      #theme-journal .notion-callout-text .notion-text {
        color: var(--ink) !important;
      }

      /* 图片 = 拍立得（旋转由 react-notion-x 外层做不了，这里只用边框与阴影） */
      #theme-journal .notion-asset-wrapper-image {
        background: #fff;
        border: 1px solid var(--ink);
        border-bottom-width: 26px;
        border-radius: 3px;
        box-shadow: var(--shadow);
        padding: 8px;
        max-width: 560px;
      }
      #theme-journal .notion-asset-caption {
        font-family: var(--font-hand);
        color: var(--blue);
      }

      /* Bookmark = 胶带卡 */
      #theme-journal .notion-bookmark {
        border: 2px solid var(--ink) !important;
        border-radius: var(--wobble);
        box-shadow: var(--shadow);
        background: var(--slip) !important;
        padding: 14px !important;
      }
      #theme-journal .notion-bookmark-title {
        font-family: var(--font-hand);
        color: var(--blue) !important;
      }
      #theme-journal .notion-bookmark-link {
        font-family: var(--font-stamp);
        color: var(--ink-soft) !important;
      }

      /* 公式：印刷排版保持不动，只给它一张细边纸条 */
      #theme-journal .notion-equation-block {
        border: 1.5px solid var(--ink);
        border-radius: var(--wobble-alt);
        background: var(--slip);
        box-shadow: var(--shadow);
        padding: 14px;
      }

      /* 目录块 */
      #theme-journal .notion-table-of-contents {
        border: 2px dashed var(--ink-soft);
        border-radius: var(--wobble);
        padding: 14px 18px;
        background: transparent;
      }
      #theme-journal .notion-table-of-contents-active-item {
        background: linear-gradient(
          100deg,
          transparent 4%,
          var(--yellow) 8% 92%,
          transparent 96%
        );
      }

      /* 页脚墨线 */
      #theme-journal .j-footer-rule {
        height: 12px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='12' viewBox='0 0 300 12'%3E%3Cpath d='M4 8C60 3 108 10 164 5s84 2 132-3' fill='none' stroke='%232D2D2D' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
        background-repeat: repeat-x;
        opacity: 0.75;
      }

      /* 标签胶囊 / 整块可点的纸条 */
      #theme-journal .j-pill {
        position: relative;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        padding: 1px 9px;
        border: 1.5px solid var(--ink);
        border-radius: 12px 4px 10px 5px / 5px 10px 4px 12px;
        background: var(--slip);
        color: var(--ink);
        font-family: var(--font-stamp);
        font-size: 12px;
        letter-spacing: 0.06em;
      }
      #theme-journal .j-pill-yellow {
        background: var(--yellow);
      }
      #theme-journal .j-pill:hover {
        background: var(--tape);
      }

      /* 纸片里的标题：印刷墨色 + 悬停才画红下划线 */
      #theme-journal h1 a,
      #theme-journal h2 a,
      #theme-journal h3 a,
      #theme-journal a.j-slip,
      #theme-journal a.j-btn,
      #theme-journal a.j-pill {
        color: var(--ink);
        background-image: none;
      }
      #theme-journal h2 a:hover {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='6' viewBox='0 0 60 6'%3E%3Cpath d='M0 3.6C7 1.2 13 5 20 3.1s13-3.4 20-1.3 14 3.4 20 1.1' fill='none' stroke='%23FF4D4D' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
        background-repeat: repeat-x;
        background-size: 60px 6px;
        background-position: 0 96%;
      }

      /*  stretched 覆盖层：整张纸条可点，标签仍在之上可点 */
      #theme-journal .j-stretch::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 1;
      }

      /* ---------- 7. 移动端 ---------- */
      @media (max-width: 767px) {
        #theme-journal {
          --shadow: 4px 4px 0 var(--ink);
          --shadow-hover: 5px 5px 0 var(--ink);
        }
        #theme-journal .notion,
        #theme-journal .notion-page-block {
          max-width: none;
        }
        #theme-journal .j-shell {
          padding-left: 16px;
          padding-right: 16px;
        }
        #theme-journal .notion-code {
          max-width: 100vw;
        }
        /* 宽表格在窄屏改横向滚动：display:block 让 tbody 撑出滚动区 */
        #theme-journal .notion-simple-table {
          display: block;
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
      }

      /* ---------- 8. 减弱动效 ---------- */
      #theme-journal * {
        scrollbar-width: thin;
      }
      @media (prefers-reduced-motion: reduce) {
        #theme-journal .j-slip,
        #theme-journal .j-btn,
        #theme-journal a {
          transition: none;
        }
        #theme-journal .j-slip:hover,
        #theme-journal .j-btn:hover {
          transform: rotate(var(--r, 0deg));
        }
        #theme-journal .j-btn:hover {
          transform: none;
        }
        /* 索引贴：关掉掀起，但当前那张"抽出 6px"是静态状态指示，要保留 */
        #theme-journal .j-tab {
          transition: none;
        }
        #theme-journal .j-tab:hover {
          transform: rotate(var(--r, 0deg));
        }
        #theme-journal .j-tab-current,
        #theme-journal .j-tab-current:hover {
          transform: rotate(var(--r, 0deg)) translateX(-6px);
        }
      }
    `}</style>
  )
}

export default Style
