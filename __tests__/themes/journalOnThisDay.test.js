import fs from 'fs'
import path from 'path'
import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server.node'
import { LayoutArchive, echoYears, localDay } from '@/themes/journal'

/**
 * 「往年的今天」的护栏。规格见 design-system/journal/MASTER.md「往年的今天」节。
 * 判据是纯函数，直接问它；「SSR 没有、挂载后才有」用服务端 markup 与真挂载各验一次。
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
// 没点名的键一律取调用处的 fallback
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

const post = (slug, date) => ({
  id: slug,
  slug,
  title: slug,
  type: 'Post',
  status: 'Published',
  publishDate: date,
  date: { start_date: date }
})

const POSTS = [
  post('six-years-ago', '2020-03-23'),
  post('last-year', '2025-03-23'),
  post('this-year', '2026-03-23'),
  post('next-year', '2027-03-23'),
  post('other-day', '2025-03-24'),
  post('no-date', '')
]

describe('往年的今天：判据', () => {
  test('同月同日、年份更早，才算', () => {
    // 当年不算（那是今天自己）、来年不算、邻日不算、没有发表日的不算
    expect(echoYears(POSTS, '2026-03-23').map(e => e.post.slug)).toEqual([
      'last-year',
      'six-years-ago'
    ])
  })

  test('越近的年份越靠前', () => {
    expect(echoYears(POSTS, '2026-03-23').map(e => `${e.ago} 年前`)).toEqual([
      '1 年前',
      '6 年前'
    ])
  })

  test('全集之外没有第二个数据源', () => {
    // 「今天」只许来自读者本地日期：不是 UTC，不是构建快照
    expect(localDay(new Date(2026, 9, 12, 23, 30))).toBe('2026-10-12')
    expect(localDay(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(themeSource).toMatch(/const localDay = \(d = new Date\(\)\)/)
  })

  test('2 月 29 日不往前补到 2 月 28 日', () => {
    // 补出来的日期是假的：本站宁可那天什么都没有
    expect(echoYears([post('leap', '2024-02-29')], '2026-02-28')).toEqual([])
    expect(
      echoYears([post('leap', '2024-02-29')], '2028-02-29').map(e => e.ago)
    ).toEqual([4])
  })

  test('今天对不上时返回空，不返回一句占位话', () => {
    expect(echoYears(POSTS, '2026-10-12')).toEqual([])
    expect(echoYears(POSTS, '')).toEqual([])
  })
})

/** 与组件共用同一枚时钟：用 localDay 反推，免得跨零点测试自己漂 */
const sameDayYearsAgo = n => {
  const today = localDay()
  return `${Number(today.slice(0, 4)) - n}${today.slice(4)}`
}

describe('往年的今天：便条', () => {
  test('SSR 首帧没有它', () => {
    const html = renderToStaticMarkup(
      <LayoutArchive posts={[post('a', sameDayYearsAgo(1))]} />
    )
    expect(html).not.toContain('往年的今天')
    expect(html).not.toContain('年前')
  })

  test('挂载后才有，且写着几年前', () => {
    render(<LayoutArchive posts={[post('a', sameDayYearsAgo(1))]} />)
    expect(document.body.textContent).toContain('往年的今天')
    expect(document.body.textContent).toContain('1 年前')
    expect(document.body.textContent).toContain('a')
  })

  test('对不上的日子整张便条不出现', () => {
    render(<LayoutArchive posts={[post('a', '2020-01-01')]} />)
    const text = document.body.textContent
    expect(text).not.toContain('往年的今天')
    // 空态就是一张纸都没有，不是一句「今天什么都没有」
    expect(text).not.toMatch(/什么都没有|没有往年/)
  })

  test('条数封顶，越近越靠前', () => {
    const many = [1, 2, 3, 4, 5].map(n => post(`y${n}`, sameDayYearsAgo(n)))
    render(<LayoutArchive posts={many} />)
    const shown = [...document.querySelectorAll('.j-note a')].filter(a =>
      /^y\d$/.test(a.textContent)
    )
    expect(shown.map(a => a.textContent)).toEqual(['y1', 'y2', 'y3'])
  })

  test('开关关掉，今天有对上的纸也不出现', () => {
    setSwitch('JOURNAL_ON_THIS_DAY', false)
    render(<LayoutArchive posts={[post('a', sameDayYearsAgo(1))]} />)
    expect(document.body.textContent).not.toContain('往年的今天')
  })

  test('读者的那一档铅笔色，不新增 token', () => {
    const styleSource = read('themes/journal/style.js')
    const body = themeSource.slice(
      themeSource.indexOf('function EchoNote'),
      themeSource.indexOf('function LayoutArchive')
    )
    expect(body).toMatch(/className='j-stamp j-soft/)
    expect(body).not.toMatch(/j-red|j-blue|j-pencil/)
    expect(styleSource).toMatch(/\.j-soft \{\s*color: var\(--ink-soft\);/)
    expect(styleSource).not.toMatch(/--echo/)
  })

  test('落点在归档右栏，首页没有它', () => {
    const archive = themeSource.slice(
      themeSource.indexOf('function LayoutArchive'),
      themeSource.indexOf('/* ---------- 分类 / 标签 ----------')
    )
    expect(archive).toMatch(/<EchoNote posts=\{posts\} \/>/)
    const index = themeSource.slice(
      themeSource.indexOf('function LayoutIndex'),
      themeSource.indexOf('function LayoutPostList')
    )
    // 首页的 posts 是当页 12 张，撑不起「往年」
    expect(index).not.toMatch(/EchoNote|echoYears/)
  })

  test('三个键都配在 config.js，不写死在调用处', () => {
    const configSource = read('themes/journal/config.js')
    expect(configSource).toMatch(/JOURNAL_ON_THIS_DAY: true/)
    expect(configSource).toMatch(/JOURNAL_ON_THIS_DAY_COUNT: 3/)
    expect(configSource).toMatch(/JOURNAL_ECHO_TITLE: '往年的今天'/)
    expect(themeSource).toMatch(/j\('JOURNAL_ON_THIS_DAY_COUNT', 3\)/)
  })
})
