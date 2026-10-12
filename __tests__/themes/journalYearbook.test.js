import fs from 'fs'
import path from 'path'
import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server.node'
import {
  LayoutYearbook,
  bookYears,
  yearMonths,
  yearStats
} from '@/themes/journal'

/**
 * 年刊 /year/[year] 的护栏。规格见 design-system/journal/MASTER.md「年刊」节。
 * 一册的有无由路由与页面共用同一把尺（主题的 bookYears），所以除了判据，
 * 这里还钉住「三处登记」与「统计里没有算不出的数」。
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
    asPath: '/year/2025',
    locale: 'zh-CN',
    query: { year: '2025' },
    events: { on: () => {}, off: () => {} }
  })
}))
jest.mock('@/lib/config', () => ({
  siteConfig: (key, fallback) => {
    const table = globalThis.journalSwitches || {}
    return key in table ? table[key] : fallback
  }
}))

const setSwitch = (key, val) => {
  globalThis.journalSwitches = {
    ...(globalThis.journalSwitches || {}),
    [key]: val
  }
}
beforeEach(() => {
  globalThis.journalSwitches = {}
})

const read = p => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const themeSource = read('themes/journal/index.js')
const styleSource = read('themes/journal/style.js')

const block = (from, to) => {
  const s = themeSource.indexOf(from)
  const e = themeSource.indexOf(to, s)
  expect(s).toBeGreaterThan(-1)
  expect(e).toBeGreaterThan(s)
  return themeSource.slice(s, e)
}

const post = (slug, date, tags = []) => ({
  id: slug,
  slug,
  title: slug,
  type: 'Post',
  status: 'Published',
  publishDate: date,
  date: { start_date: date },
  tags
})

const POSTS = [
  post('jun-2025', '2025-06-26', ['plog']),
  post('jan-2025', '2025-01-24'),
  post('mar-2025', '2025-03-26'),
  post('jun-2025b', '2025-06-01', ['featured']),
  post('aug-2024', '2024-08-18', ['locked-tag']),
  post('undated', '')
]

describe('年刊：判据', () => {
  test('没有发表日的纸不进任何一册', () => {
    expect(bookYears(POSTS)).toEqual(['2025', '2024'])
  })

  test('册序降序、去重', () => {
    expect(bookYears([...POSTS, post('more-2025', '2025-09-09')])).toEqual([
      '2025',
      '2024'
    ])
    expect(bookYears([])).toEqual([])
  })

  test('册内按月升序：册子从头翻，归档倒着找', () => {
    expect(yearMonths(POSTS, '2025').map(([m]) => m)).toEqual([
      '2025-01',
      '2025-03',
      '2025-06'
    ])
    expect(yearMonths(POSTS, '2024').map(([m]) => m)).toEqual(['2024-08'])
  })

  test('统计的每个数都从这一年的纸上来', () => {
    const stats = yearStats(POSTS, '2025')
    expect(stats.total).toBe(4)
    expect(stats.months).toBe(3)
    expect(stats.first).toBe('2025-01-24')
    expect(stats.last).toBe('2025-06-26')
    expect(stats.busiest).toEqual({ month: '2025-06', count: 2 })
    expect(stats.marks.get('receipt')).toBe(1)
    expect(stats.marks.get('featured')).toBe(1)
    // 2024 那一册只有一张，加密的是它自己
    expect(yearStats(POSTS, '2024').total).toBe(1)
  })

  test('年份的尺只有一把：路由问主题，不自己切一遍', () => {
    const route = read('pages/year/[year].js')
    expect(route).toMatch(/import \{ bookYears \} from '@\/themes\/journal'/)
    expect(route).toMatch(/bookYears\(publishedPosts\(allPages\)\)/)
    // 主题内也只认 postDate 一条日期口径
    expect(block('const yearOfPost', 'const bookYears')).toMatch(
      /dayKey\(postDate\(post\)\)/
    )
  })

  test('新路由三处登记齐全（/plog 的教训）', () => {
    const map = read('conf/layout-map.config.js')
    expect(map).toMatch(/'\/year\/\[year\]': 'LayoutYearbook'/)
    const seo = read('components/SEO.js')
    expect(seo).toMatch(/case '\/year\/\[year\]':/)
    expect(read('pages/year/[year].js')).toMatch(/layoutName='LayoutYearbook'/)
  })

  test('图例页要说清年册从哪来：入口钉在「按年装订」那一行', () => {
    expect(block("name: '按年装订'", "name: '页码 P.0XX'")).toMatch(
      /\/year\/\[年份\]/
    )
  })
})

describe('年刊：纸上', () => {
  test('SSR 首帧就是完整一册', () => {
    const html = renderToStaticMarkup(
      <LayoutYearbook posts={POSTS} year='2025' />
    )
    expect(html).toContain('2025 年刊')
    expect(html).toContain('4 张纸 · 3 个月落过笔')
    expect(html).toContain('6 月 · 2 张')
    expect(html).toContain('落笔最密的月')
    // 册内印的是全站页码（P.001 属于 2024 那一册），不是册内重排的名次
    expect(html).toContain('P.002')
    expect(html).toContain('P.005')
    expect(html).not.toContain('P.001')
    expect(html.match(/class="j-book-month/g)).toHaveLength(3)
  })

  test('每月都只有一张时不写「最密的月」', () => {
    const html = renderToStaticMarkup(
      <LayoutYearbook
        posts={[post('a', '2025-01-01'), post('b', '2025-03-01')]}
        year='2025'
      />
    )
    expect(html).not.toContain('落笔最密的月')
    expect(html).toContain('2 张纸 · 2 个月落过笔')
  })

  test('空册只说没纸，不摆一排空统计', () => {
    render(<LayoutYearbook posts={POSTS} year='2099' />)
    const text = document.body.textContent
    expect(text).toContain('这一册是空的')
    expect(text).toContain('2025、2024')
    // 「第一张 / 最后一张」在没有纸的年份是编出来的字段名
    expect(text).not.toContain('第一张')
    expect(text).not.toMatch(/这本子只攒了一册/)
  })

  test('相邻的册只在真存在的年份之间跳', () => {
    const newest = render(<LayoutYearbook posts={POSTS} year='2025' />)
    const links = [...newest.container.querySelectorAll('a')].filter(a =>
      a.getAttribute('href')?.startsWith('/year/')
    )
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/year/2024'])
    expect(links[0].textContent).toBe('2024 →')

    const oldest = render(<LayoutYearbook posts={POSTS} year='2024' />)
    expect(oldest.container.textContent).toContain('← 2025')
  })

  test('册内的纸沿用列表那套组件，不另写一种纸条', () => {
    const book = block('function LayoutYearbook', 'function BigTapedPaper')
    expect(book).toMatch(/<DaySpread/)
    expect(book).toMatch(/dayGroups\(items\)/)
    expect(book).toMatch(/<PostSlip/)
    expect(book).toMatch(/pageNumbers\(posts\)/)
  })

  test('统计的字段表就这一份，算不出的数进不来', () => {
    // 想加「年度字数 / 热度」得先过这里：那些字段本站没有可信来源
    expect(Object.keys(yearStats(POSTS, '2025')).sort()).toEqual([
      'busiest',
      'first',
      'last',
      'marks',
      'months',
      'total'
    ])
    const html = renderToStaticMarkup(
      <LayoutYearbook posts={POSTS} year='2025' />
    )
    expect(html).not.toMatch(/字数|热度|阅读时长|PV|排行/)
    // 页码一节已否掉 VOL.：与页脚「第 N 年」同义重复，年刊不能再造一个
    expect(themeSource).not.toMatch(/VOL\./)
  })

  test('打印时一月开一页，首月不硬开空页，屏幕导航不印', () => {
    const print = styleSource.slice(styleSource.indexOf('@media print'))
    expect(print).toMatch(/\.j-book-month \{\s*break-before: page;\s*\}/)
    expect(print).toMatch(
      /\.j-book-month:first-of-type \{\s*break-before: auto;\s*\}/
    )
    expect(print).toMatch(/#theme-journal \.j-book-nav,/)
  })

  test('入口在归档的年份行上，且开关能整项关掉', () => {
    const archive = block(
      'function LayoutArchive',
      '/* ---------- 分类 / 标签 ---------- */'
    )
    expect(archive).toMatch(/href=\{`\/year\/\$\{year\}`\}/)
    expect(archive).toMatch(/j\('JOURNAL_YEARBOOK', true\) &&/)

    setSwitch('JOURNAL_YEARBOOK', false)
    const html = renderToStaticMarkup(
      <LayoutYearbook posts={POSTS} year='2025' />
    )
    expect(html).toBe('')
  })

  test('两个键配在 config.js', () => {
    const configSource = read('themes/journal/config.js')
    expect(configSource).toMatch(/JOURNAL_YEARBOOK: true/)
    expect(configSource).toMatch(/JOURNAL_YEARBOOK_LABEL: '年刊'/)
  })
})
