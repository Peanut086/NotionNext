# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Editorial
**Generated:** 2026-10-08 10:05:16
**Category:** Magazine/Blog
**Design Dials:** Variance 4/10 (Balanced / Modern) | Motion 3/10 (Subtle) | Density 4/10 (Standard)

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#18181B` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#3F3F46` | `--color-secondary` |
| On Secondary | `#FFFFFF` | `--color-on-secondary` |
| Accent/CTA | `#1E40AF` | `--color-accent` |
| On Accent/CTA | `#FFFFFF` | `--color-on-accent` |
| Background | `#FAFAFA` | `--color-background` |
| Foreground | `#09090B` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#09090B` | `--color-card-foreground` |
| Muted | `#E8ECF0` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#E4E4E7` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#18181B` | `--color-ring` |

**Color Notes:** Editorial near-black + warm paper. Accent = 靛蓝 `#1E40AF` (light mode). In dark mode the accent must be remapped to `#60A5FA` — `#1E40AF` on near-black falls below 4.5:1. Only ONE accent is allowed site-wide: link hover, featured marker, active nav item, focus ring.

#### Dark Mode Overrides (`.dark`)

Not to be inferred from light values — these are explicit:

| Role | Light | Dark |
|------|-------|------|
| `--color-background` | `#FAFAFA` | `#0F1115` |
| `--color-card` | `#FFFFFF` | `#171A21` |
| `--color-foreground` | `#09090B` | `#F4F4F5` |
| `--color-muted-foreground` | `#475569` | `#A1A1AA` |
| `--color-border` | `#E4E4E7` | `#2A2F3A` |
| `--color-accent` | `#1E40AF` | `#60A5FA` |

Rules: body text needs ≥4.5:1 in **both** modes; borders/dividers must stay visible in dark (they are the only hierarchy signal since shadows are suppressed); `--color-ring` follows the accent of the active mode.

### Typography

- **Heading Font:** Libre Bodoni
- **Body Font:** Public Sans
- **Mood:** magazine, editorial, publishing, refined, journalism, print
- **Google Fonts:** [Libre Bodoni + Public Sans](https://fonts.googleapis.com/css2?family=Libre+Bodoni:wght@400;500;600;700&family=Public+Sans:wght@300;400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Libre+Bodoni:wght@400;500;600;700&family=Public+Sans:wght@300;400;500;600;700&display=swap');
```

**CJK fallback (required):** Libre Bodoni 与 Public Sans 均无中文字形，必须显式指定回退栈，否则中文会掉回系统默认宋体导致标题风格不可控：

```css
--font-display: 'Libre Bodoni', 'Noto Serif SC', serif;   /* 标题、引文 */
--font-body:    'Public Sans', 'Noto Sans SC', sans-serif; /* 正文、导航 */
--font-mono:    'JetBrains Mono', 'Noto Sans SC', monospace; /* 元信息层 */
```

静态导出注意：Noto Serif SC / Noto Sans SC 全量体积很大，只按需引入用到的字重（400/600/700），或改为 `font-display: swap` + 本地子集化。

### Page Slot Map (NotionNext)

| 位置 | 内容 | 备注 |
|---|---|---|
| 首页右栏 | 关于我面板：头像(单字母衬线占位)、姓名、三行简介、等宽元信息列表(坐标/职业/关注)、纯文字社交行 + `→`、统计计数 | **不放文章目录**；目录只属于文章页 |
| 首页左栏 | 两行问候 → 衬线斜体「最近在写」→ 近期文章列表(5 条) | 列表无卡片无阴影，hairline 分隔 |
| 首页页脚 | 归档年份 + 版权，等宽 | |
| 文章页左栏 | sticky 目录，当前项用 accent | |
| 文章页顶部 | 分类 · 日期 · 阅读时长(等宽) → 大标题 → 摘要 | |

### Spacing Variables

*Density: 4/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-accent, #1E40AF);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #18181B;
  border: 2px solid #18181B;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #FAFAFA;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #18181B;
  outline: none;
  box-shadow: 0 0 0 3px #18181B20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Swiss Modernism 2.0

**Keywords:** Grid system, Helvetica, modular, asymmetric, international style, rational, clean, mathematical spacing

**Best For:** Corporate sites, architecture, editorial, SaaS, museums, professional services, documentation

**Key Effects:** display: grid, grid-template-columns: repeat(12 1fr), gap: 1rem, mathematical ratios, clear hierarchy

### Personal Blog Calibration (NotionNext)

Overrides for this project's reality — these win over generic rules above:

- **阅读版式**: 正文 `max-width: 65ch`（Notion 块全宽时限制 `#NOTION_PAGE` 容器），16–18px，行高 1.7，段间距 `--space-lg`
- **Mono 签名位**: JetBrains Mono 仅用于元信息层——发布日期、阅读时长、分类/标签、归档年份、Busuanzi 统计。这是本主题的"人格签名"，不用于正文
- **引文/摘要**: Libre Bodoni Italic 用于文章摘要、`blockquote` 与首页「最近在写什么」
- **列表优先于卡片**: 首页/归档/标签页用大字排版列表（无阴影、无边框卡），`--shadow-md` 以上仅留给评论框、TOC 浮层等真正需要抬起的层
- **Notion 块适配**: 不给 `.notion-*` 块加 transform/hover；只用 token 覆盖颜色与间距，避免与 `styles/notion.css` 冲突
- **首页结构**: 精选置顶 → 近期文章列表 → 短动态(plog)流 → 按年归档 → 关于我入口
- **动效预算**: 仅滚动渐显（Subtle tier）+ hover 200ms；静态导出(`yarn export`)下必须无 JS 也可读，渐显元素默认可见、JS 加载后才启用 reveal

### Page Pattern

**Pattern Name:** Scroll-Triggered Storytelling

- **Conversion Strategy:** Keep the narrative understandable without scroll-driven effects. Use progress indicator. Mobile: simplify animations. Keep DOM reading order complete; disable parallax and scroll-scrub under reduced motion. Pause scroll animation when offscreen or hidden and render each chapter in its final readable state under reduced motion.
- **CTA Placement:** End of each chapter (mini) + Final climax CTA
- **Section Order:** Intro hook > Chapter 1 (problem) > Chapter 2 (journey) > Chapter 3 (solution) > Climax CTA

---

## Motion

**Reveal implementation note:** This project has no GSAP dependency but already ships `components/AOSAnimation.js`. Use the existing AOS setup (or a ~20-line IntersectionObserver fallback) instead of adding GSAP.

**Scroll Reveal** (Subtle) — Trigger: scroll (viewport enter) | Duration: 300-400ms | Easing: `power1.out` equivalent (`cubic-bezier(0.25, 0.46, 0.45, 0.94)`)

```js
gsap.from(el, { opacity: 0, y: 12, duration: 0.35, ease: 'power1.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
```

**Framework notes:** Requires the ScrollTrigger plugin registered once via gsap.registerPlugin(ScrollTrigger); Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately

- ✅ Keep the y offset small (8-16px) so it reads as a fade, not a slide
- ❌ Don't reveal below-the-fold content needed for SEO/crawlers as invisible-by-default without a no-JS fallback
- ⚡ toggleActions 'play none none reverse' avoids re-triggering on every scroll direction change

---

## Anti-Patterns (Do NOT Use)

- ❌ Poor typography
- ❌ Slow loading

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
