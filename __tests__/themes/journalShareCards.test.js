import fs from 'fs'
import path from 'path'
import { act, render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server.node'
import { LayoutSlug } from '@/themes/journal'
import { OG_SIZES, OgCard, clampQuote } from '@/themes/journal/og-card'

/**
 * 分享卡三型的护栏。
 * PNG 由 next/og 的 satori 渲染，jest 里跑不出那张图，所以：
 * 版式与结构用 renderToStaticMarkup 验 JSX，接线与纪律用静态断言，
 * 选区那条链只能在真组件挂载后用 dispatchEvent 验。
 * 规格见 design-system/journal/MASTER.md「分享卡三型」节。
 */

jest.mock('@/components/NotionIcon', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('@/components/NotionPage', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('@/components/Mark', () => ({
  __esModule: true,
  default: ({ children }) => children
}))
jest.mock('@/components/SmartLink', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>
}))
jest.mock('@/components/LazyImage', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('@/lib/global', () => ({
  useGlobal: () => ({ locale: {}, isDarkMode: false }),
  getGlobalSnapshot: () => null
}))
jest.mock('notion-utils', () => ({ uuidToId: id => id }))
jest.mock('next/router', () => ({
  useRouter: () => ({
    asPath: '/article/npmpackage',
    locale: 'zh-CN',
    query: {},
    events: { on: () => {}, off: () => {} }
  })
}))
// 没点名的键一律取调用处的 fallback；LINK 必须给绝对地址，否则守卫会把卡关掉
jest.mock('@/lib/config', () => ({
  siteConfig: (key, fallback) => {
    const table = { LINK: 'https://paper.example' }
    return key in table ? table[key] : fallback
  }
}))

const read = p => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const cardSource = read('themes/journal/og-card.js')
const themeSource = read('themes/journal/index.js')
const apiSource = read('pages/api/og.js')
const configSource = read('themes/journal/config.js')

const slice = (src, from, to) => {
  const start = src.indexOf(from)
  return src.slice(start, src.indexOf(to, start + 1))
}

const sizeBlock = slice(cardSource, 'export const OG_SIZES', '/** 两版式只差')
const quoteHook = slice(
  themeSource,
  'const useQuoteSelection',
  'function ShareNote'
)
const shareBody = slice(
  themeSource,
  'function ShareNote',
  'function LayoutSlug'
)
const cardUrlBody = slice(themeSource, 'const cardUrl =', 'const ogImageUrl')
const ogImageBody = slice(themeSource, 'const ogImageUrl', 'const j = (key')

const card = props => renderToStaticMarkup(<OgCard {...props} />)

const POST = { title: '如何把一本手账排开', category: '笔记' }
const QUOTE = '纸不是背景，纸就是内容本身。'

describe('journal share card sizes', () => {
  test('one table owns every card dimension', () => {
    expect(OG_SIZES).toEqual({
      wide: { width: 1200, height: 630 },
      story: { width: 1080, height: 1440 }
    })
    // 尺寸在别处再写一遍，图片就会被裁
    expect(cardSource.replace(sizeBlock, '')).not.toMatch(/1200|1080|1440|630/)
  })

  test('the api reads pixels from the table, never a literal', () => {
    expect(apiSource).toMatch(/const SIZES = Object\.keys\(OG_SIZES\)/)
    expect(apiSource).toMatch(/const dim = OG_SIZES\[size\]/)
    expect(apiSource).toMatch(/width: dim\.width,\s+height: dim\.height/)
    expect(apiSource).not.toMatch(/(?:width|height): [0-9]/)
  })

  test('an unknown size falls back to the wide card, not a broken PNG', () => {
    const html = card({ ...POST, size: 'poster' })
    expect(html).toMatch(/width:1200px/)
    expect(html).toMatch(/height:630px/)
  })

  test('the story card is the portrait skeleton with a bigger title', () => {
    const wide = card({ ...POST, date: '2026-10-12' })
    const story = card({ ...POST, date: '2026-10-12', size: 'story' })
    expect(story).toMatch(/width:1080px/)
    expect(story).toMatch(/height:1440px/)
    expect(story).toMatch(/font-size:88px/)
    expect(wide).toMatch(/font-size:62px/)
    expect(wide).not.toMatch(/font-size:88px/)
  })
})

describe('journal clipping card', () => {
  test('a selection is flattened and capped before it reaches the card', () => {
    // 选区里必然带换行与制表符；直接塞进 URL 既打不开也难看
    expect(clampQuote('纸\n\t就是\n内容')).toBe('纸 就是 内容')
    expect(clampQuote('  前后有空格  ')).toBe('前后有空格')
    expect(clampQuote('带\u0000控制符')).toBe('带 控制符')
    expect(clampQuote('')).toBe('')
    expect(clampQuote('只', 5)).toBe('只')
    const long = clampQuote('甲'.repeat(200), 160)
    expect(long).toHaveLength(161) // 160 字 + 省略号
    expect(long.endsWith('…')).toBe(true)
  })

  test('a bogus cap cannot make the card unlimited', () => {
    expect(clampQuote('乙'.repeat(400), 0)).toHaveLength(161)
    expect(clampQuote('丙'.repeat(400), 'x')).toHaveLength(161)
  })

  test('the cap is configured in one place and shared by both sides', () => {
    expect(configSource).toMatch(/JOURNAL_CARD_QUOTE_MAX: 160/)
    expect(themeSource).toMatch(/j\('JOURNAL_CARD_QUOTE_MAX', 160\)/)
    expect(apiSource).toMatch(
      /Number\(CONFIG\.JOURNAL_CARD_QUOTE_MAX\) \|\| 160/
    )
    expect(apiSource).toMatch(/clampQuote\(str\(q\.quote, 1200\), QUOTE_MAX\)/)
  })

  test('no quote means no clipping: the card stays a plain wide card', () => {
    const html = card({ ...POST, date: '2026-10-12' })
    expect(html).toContain('如何把一本手账排开')
    // 「 与 —— 是剪报才有的两样东西
    expect(html).not.toContain('「')
    expect(html).not.toContain('——')
    expect(html).not.toContain('repeat-x')
  })

  test('the clipping card makes the sentence the hero and the title the source', () => {
    const html = card({ ...POST, date: '2026-10-12', quote: QUOTE })
    expect(html).toContain('「')
    expect(html).toContain('」')
    expect(html).toContain(`—— ${POST.title}`)
    expect(html).toContain(QUOTE)
    // 上沿一道撕线：剪报是撕下来的，不是贴上去的
    expect(html).toMatch(/background-repeat:repeat-x/)
  })

  test('a receipt keeps its teeth, so the tear line has one owner either way', () => {
    expect(card({ ...POST, states: ['receipt'] })).toMatch(
      /background-repeat:repeat-x/
    )
    expect(card({ ...POST, states: ['pinned'] })).not.toMatch(
      /background-repeat:repeat-x/
    )
  })

  test('an over-long sentence is cut with an ellipsis, never left to overflow', () => {
    const html = card({ ...POST, quote: '丁'.repeat(160) + '尾部' })
    expect(html).toContain('…')
    expect(html).not.toContain('尾部')
  })
})

describe('journal share card materials', () => {
  test('three cards share one paper: no colour was invented for a clip', () => {
    const palette = [
      '#fdfbf7',
      '#ffffff',
      '#2d2d2d',
      '#5c5c5c',
      '#c81e1e',
      '#2d5da1',
      '#fff9c4'
    ]
    const used = [...cardSource.matchAll(/'(#[0-9a-fA-F]{6})'/g)].map(m =>
      m[1].toLowerCase()
    )
    expect(used.length).toBeGreaterThan(0)
    used.forEach(hex => expect(palette).toContain(hex))
  })

  test('nothing satori cannot render sneaks into the card', () => {
    // 注释里写着这些不支持，所以断言要盯写法而不是词
    expect(cardSource).not.toMatch(/display:\s*'inline-block'/)
    expect(cardSource).not.toMatch(/<feTurbulence/)
    expect(cardSource).not.toMatch(/filter:/)
    // 包着元素子节点的 div 必须显式写 display，一个 <svg> 孩子也会抛
    expect(cardSource).toMatch(/display: 'flex'/)
  })
})

describe('journal share card wiring', () => {
  test('the EXPORT guard lives in exactly one function', () => {
    // 静态导出没有 pages/api：一处判，三型一起哑掉，不给点了 404 的链接
    expect((themeSource.match(/process\.env\.EXPORT/g) || []).length).toBe(1)
    expect(cardUrlBody).toContain(
      "if (process.env.EXPORT === 'true') return null"
    )
    expect(cardUrlBody).toContain(
      'if (!/^https?:\\/\\//i.test(base)) return null'
    )
    expect(ogImageBody).toMatch(/return cardUrl\(post/)
    expect(ogImageBody).not.toMatch(/URLSearchParams/)
  })

  test('the story link needs an address, the clipping link needs a selection', () => {
    expect(shareBody).toMatch(/const story = cardUrl\(post, \{ size: 'story'/)
    expect(shareBody).toMatch(/const clipping = quote && cardUrl\(/)
    expect(shareBody).toMatch(/if \(story\) cards\.push/)
    expect(shareBody).toMatch(/if \(clipping\)/)
    expect(shareBody).toMatch(/label: '故事卡'/)
    expect(shareBody).toMatch(/label: '剪报卡'/)
  })

  test('the theme never writes a sentence the reader did not pick', () => {
    // 第一律最容易被破的地方：摘要、aiSummary 都不许当引文用
    expect(quoteHook + shareBody).not.toMatch(/summary|摘要|aiSummary/)
  })

  test('only the article body counts as a selection', () => {
    expect(quoteHook).toMatch(/useState\(null\)/)
    expect(quoteHook).toMatch(/getElementById\('article-wrapper'\)/)
    expect(quoteHook).toMatch(/host\.contains\(sel\.anchorNode\)/)
    expect(quoteHook).toMatch(/addEventListener\('selectionchange', onChange\)/)
    expect(quoteHook).toMatch(
      /removeEventListener\('selectionchange', onChange\)/
    )
  })

  test('no card link exists before mount', () => {
    const slug = slice(themeSource, 'function LayoutSlug', 'if (lock)')
    expect(slug).toMatch(/const quote = useQuoteSelection\(\)/)
    expect(themeSource).toMatch(/<ShareNote post=\{post\} quote=\{quote\} \/>/)
  })

  test('one switch governs the two new links, not the og card', () => {
    expect(configSource).toMatch(/JOURNAL_SHARE_CARDS: true/)
    expect(quoteHook).toMatch(/if \(!j\('JOURNAL_SHARE_CARDS', true\)\) return/)
    expect(shareBody).toMatch(/if \(j\('JOURNAL_SHARE_CARDS', true\)\) \{/)
    // 横卡是 og 元数据，仍归 JOURNAL_OG_CARD 管
    expect(ogImageBody).toMatch(/if \(!j\('JOURNAL_OG_CARD', true\)\) return/)
    expect(shareBody).not.toMatch(/JOURNAL_OG_CARD/)
  })
})

/* --- 挂载后的选区：这一组跑的是真组件，不是源码 --- */

const SLUG_POST = {
  id: 'npmpackage',
  slug: 'npmpackage',
  title: '前端常用 npm 包',
  type: 'Post',
  category: '开发',
  publishDate: '2024-06-01',
  date: { start_date: '2024-06-01' }
}

// jsdom 没有 innerText，一律用 textContent
const labels = () =>
  [...document.querySelectorAll('.j-share a')].map(a => a.textContent)

const cardParam = (label, key) => {
  const a = [...document.querySelectorAll('.j-share a')].find(
    x => x.textContent === label
  )
  if (!a) return null
  return new URL(a.getAttribute('href')).searchParams.get(key)
}

/** 选区只有浏览器能给；这里换一张假选区，再触发同一桩 selectionchange */
const select = (text, anchorNode) => {
  window.getSelection = () => ({ toString: () => text, anchorNode })
  act(() => {
    document.dispatchEvent(new Event('selectionchange'))
  })
}

const bodyNode = () => {
  const node = document.createTextNode('纸不是背景，纸就是内容本身。')
  document.getElementById('article-wrapper').appendChild(node)
  return node
}

describe('journal clipping link follows the selection', () => {
  const realGetSelection = window.getSelection

  beforeEach(() => {
    render(<LayoutSlug post={SLUG_POST} lock={false} />)
  })

  afterEach(() => {
    window.getSelection = realGetSelection
  })

  test('the story link is there from the first paint, the clipping link is not', () => {
    expect(labels()).toContain('故事卡')
    expect(labels()).not.toContain('剪报卡')
    expect(cardParam('故事卡', 'size')).toBe('story')
  })

  test('picking a sentence in the body turns it into the clipping quote', () => {
    select('纸 就是\n内容', bodyNode())
    expect(labels()).toContain('剪报卡')
    expect(cardParam('剪报卡', 'quote')).toBe('纸 就是 内容')
    expect(cardParam('剪报卡', 'size')).toBeNull()
  })

  test('a selection outside the article body is not a quote', () => {
    // 框到导航、分享行、评论都不该出卡
    select('纸 就是 内容', document.querySelector('.j-share'))
    expect(labels()).not.toContain('剪报卡')
  })

  test('dropping the selection takes the link back away', () => {
    select('纸 就是 内容', bodyNode())
    expect(labels()).toContain('剪报卡')
    select('', null)
    expect(labels()).not.toContain('剪报卡')
  })

  test('what reaches the URL is already capped', () => {
    select('甲'.repeat(300), bodyNode())
    expect((cardParam('剪报卡', 'quote') || '').length).toBe(161)
  })
})
