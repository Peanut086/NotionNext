import fs from 'fs'
import path from 'path'
import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server.node'
import {
  LayoutArchive,
  LayoutSeries,
  LayoutSeriesIndex,
  seriesBooks
} from '@/themes/journal'

/**
 * 连载册 /series/[name] 的护栏。规格见 design-system/journal/MASTER.md「连载册」节。
 * 这一项存在的理由本身就是判据：标签页给不出跨页的话数与发表序，
 * 所以除了册子的渲染，这里还钉住「册表只有一把尺」「三处登记」「统计里没有算不出的数」。
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
    asPath: '/series/手账入门',
    locale: 'zh-CN',
    query: { name: '手账入门' },
    events: { on: () => {}, off: () => {} }
  })
}))
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
  post('early-2023', '2023-01-01', ['普通标签']),
  post('b-2026', '2026-02-01', ['连载:手账入门', '工具']),
  post('a-2024', '2024-01-05', ['连载:手账入门']),
  post('c-2025', '2025-06-15', ['连载:手账入门', 'featured']),
  post('p-2025', '2025-03-01', ['连载:踩坑录']),
  post('q-2026', '2026-01-01', ['连载:踩坑录']),
  post('solo', '2025-07-01', ['连载:只写过一话']),
  post('slash-1', '2025-04-01', ['连载:带/斜杠']),
  post('slash-2', '2025-05-01', ['连载:带/斜杠']),
  post('undated-a', '', ['连载:没有日期']),
  post('undated-b', '', ['连载:没有日期'])
]

const names = books => books.map(b => b.name)

describe('连载册：判据', () => {
  test('一话不成辑：册表与清单同一把尺（都问 seriesGroups）', () => {
    expect(names(seriesBooks(POSTS))).toEqual([
      '踩坑录',
      '手账入门',
      '没有日期'
    ])
  })

  test('名字里带 / 的标签不进路由表，但那两篇在清单里照旧占一行', () => {
    expect(names(seriesBooks(POSTS))).not.toContain('带/斜杠')

    // 清单那一行不该长出一枚指向不存在的册的链子
    const html = renderToStaticMarkup(<LayoutArchive posts={POSTS} />)
    expect(html).toContain('带/斜杠')
    const links = [...html.matchAll(/href="([^"]*\/series\/[^"]*)"/g)].map(
      m => m[1]
    )
    expect(links).not.toContain(`/series/${encodeURIComponent('带/斜杠')}`)
    expect(links).toContain(`/series/${encodeURIComponent('手账入门')}`)
  })

  test('册名是剥了前缀那一截：URL 里没有 %3A', () => {
    const book = seriesBooks(POSTS).find(b => b.name === '手账入门')
    expect(book.href).toBe(`/series/${encodeURIComponent('手账入门')}`)
    expect(book.href).not.toContain('%3A')
  })

  test('首话/末话按发表序，年份去重升序', () => {
    const book = seriesBooks(POSTS).find(b => b.name === '手账入门')
    expect(book.count).toBe(3)
    expect(book.first).toBe('2024-01-05')
    expect(book.last).toBe('2026-02-01')
    expect(book.years).toEqual(['2024', '2025', '2026'])
  })

  test('没有发表日的话照样占一话（与「连载语法」已钉的规则一致）', () => {
    const book = seriesBooks(POSTS).find(b => b.name === '没有日期')
    expect(book.count).toBe(2)
    expect(book.first).toBe('')
    expect(book.years).toEqual([])
  })

  test('前缀一置空，整族连册一起组不出来', () => {
    setSwitch('JOURNAL_SERIES_PREFIX', '')
    expect(seriesBooks(POSTS)).toEqual([])
  })
})

describe('连载册：纸上', () => {
  test('SSR 首帧就是完整一辑，话数从全集数而非本页', () => {
    const html = renderToStaticMarkup(
      <LayoutSeries posts={POSTS} series='手账入门' />
    )
    expect(html).toContain('手账入门')
    expect(html).toContain('共 3 话 · 从第 1 话往下翻')
    expect(html).toContain('第 1 话')
    expect(html).toContain('第 3 话')
    expect(html).toContain('a-2024')
    // 升序：第 1 话是 2024 那张，不是列表顺序里的第一张
    expect(html.indexOf('第 1 话')).toBeLessThan(html.indexOf('第 3 话'))
    expect(html.indexOf('a-2024')).toBeLessThan(html.indexOf('b-2026'))
    // 页码走全站序：2023 那张占了 P.001，本辑从 P.002 起
    expect(html).toContain('P.002')
    expect(html).not.toContain('P.001')
    expect(html.match(/class="j-series-item/g)).toHaveLength(3)
  })

  test('册头只有手数得出的四个数', () => {
    const book = seriesBooks(POSTS).find(b => b.name === '手账入门')
    expect(Object.keys(book).sort()).toEqual([
      'count',
      'first',
      'href',
      'last',
      'name',
      'posts',
      'years'
    ])
    const html = renderToStaticMarkup(
      <LayoutSeries posts={POSTS} series='手账入门' />
    )
    expect(html).toContain('第一话')
    expect(html).toContain('01.05')
    expect(html).toContain('跨的年份')
    expect(html).toContain('2024 · 2025 · 2026')
    expect(html).not.toMatch(/字数|阅读时长|热度|PV|排行/)
  })

  test('没有日期的那一辑老实写「没有日期」', () => {
    const html = renderToStaticMarkup(
      <LayoutSeries posts={POSTS} series='没有日期' />
    )
    expect(html).toContain('--.--')
    expect(html).toContain('没有日期')
  })

  test('不成辑的名字走空态：只说没攒够，并列出攒得起的', () => {
    render(<LayoutSeries posts={POSTS} series='只写过一话' />)
    const text = document.body.textContent
    expect(text).toContain('这条线还没攒成一册')
    expect(text).toContain('踩坑录、手账入门、没有日期')
    expect(text).not.toContain('第 1 话')
    // 空册不摆空统计、不摆导航
    expect(text).not.toContain('跨的年份')
    expect(document.querySelector('.j-book-nav')).toBeNull()
  })

  test('相邻的辑只在真成辑的名字之间跳', () => {
    const { container } = render(
      <LayoutSeries posts={POSTS} series='手账入门' />
    )
    const links = [...container.querySelectorAll('a')]
      .map(a => a.getAttribute('href'))
      .filter(h => h?.startsWith('/series/'))
    expect(links).toEqual([
      `/series/${encodeURIComponent('踩坑录')}`,
      `/series/${encodeURIComponent('没有日期')}`
    ])
    expect(container.textContent).toContain('← 踩坑录')
  })

  test('册里的纸沿用列表那张纸条，不另写一种', () => {
    // 锚点必须带到参数表：`LayoutSeriesIndex` 以 `LayoutSeries` 为前缀，
    // 只写函数名的话 indexOf 会先撞上目录组件，这段护栏悄悄变成两个组件的并集
    const book = block('function LayoutSeries(props)', 'function BigTapedPaper')
    expect(book).not.toMatch(/LayoutSeriesIndex/)
    expect(book).toMatch(/<PostSlip/)
    expect(book).toMatch(/pageNumbers\(posts\)/)
    expect(book).toMatch(/seriesBooks\(posts\)/)
    expect(book).toMatch(/markCounts/)
    // 铅笔连线仍只服务文章页上/下一篇，册内不复用（同一图形两种语义）
    expect(book).not.toMatch(/<ThreadLink/)
    // 装订中缝是「同一天多篇」的语义，连载不是
    expect(book).not.toMatch(/j-spine/)
  })

  test('竖线只用已有材质，不新增颜色 token、打印不另开分页', () => {
    const s0 = styleSource.indexOf('3k. 连载册')
    const e0 = styleSource.indexOf('---------- 4. 按钮', s0)
    expect(s0).toBeGreaterThan(-1)
    expect(e0).toBeGreaterThan(s0)
    const css = styleSource.slice(s0, e0)
    expect(css).toMatch(/border-left: 2px dashed var\(--ink-soft\)/)
    expect(css).toMatch(/grid-template-columns: 72px minmax\(0, 1fr\)/)
    expect(css).toMatch(/@media \(max-width: 639px\)/)
    // 容器只锁横向：写简写会静默压掉同元素的竖向 Tailwind 工具类
    expect(css).not.toMatch(/margin:[^;]/)
    expect(css).not.toMatch(/padding:[^;]/)
    expect(css).not.toMatch(/--[a-z-]+:/)
    expect(css).not.toMatch(/transform|radial-gradient|print-color-adjust/)

    const print = styleSource.slice(styleSource.indexOf('@media print'))
    expect(print).toMatch(/#theme-journal \.j-book-nav,/)
    // 一辑按话连排本就是顺着读的，不学年册按月硬开页
    expect(print).not.toMatch(/j-series/)
  })

  test('入口只长在归档右栏那张有全集的清单上', () => {
    const note = block('function SeriesNote', 'function LayoutArchive')
    expect(note).toMatch(/seriesBooks\(posts\)/)
    expect(note).toMatch(/j\('JOURNAL_SERIES_BOOK', true\) &&/)
    const html = renderToStaticMarkup(<LayoutArchive posts={POSTS} />)
    expect(html).toContain('连载册 →')

    // 文章页的胶囊不改：那里没有 allPages，判不出成不成辑
    // 切到「一个连载」那族判据之前，否则会把 SeriesNote 的册链一并切进来
    const slug = block('function LayoutSlug', '/** 一个连载 = 一个前缀标签')
    expect(slug).toMatch(/href=\{`\/tag\/\$\{encodeURIComponent\(tag\)\}`\}/)
    expect(slug).not.toMatch(/\/series\//)
  })

  test('图例页要说清册从哪进', () => {
    expect(block("name: '连载'", "name: '纸会老'")).toMatch(
      /\/series\/\[连载名\]/
    )
  })

  test('开关能整项关掉，归档那枚入口同关', () => {
    setSwitch('JOURNAL_SERIES_BOOK', false)
    expect(
      renderToStaticMarkup(<LayoutSeries posts={POSTS} series='手账入门' />)
    ).toBe('')
    expect(renderToStaticMarkup(<LayoutArchive posts={POSTS} />)).not.toContain(
      '连载册 →'
    )
  })

  test('新路由三处登记齐全（/plog 的教训）', () => {
    expect(read('conf/layout-map.config.js')).toMatch(
      /'\/series\/\[name\]': 'LayoutSeries'/
    )
    expect(read('components/SEO.js')).toMatch(/case '\/series\/\[name\]':/)
    expect(read('pages/series/[name].js')).toMatch(/layoutName='LayoutSeries'/)
  })

  test('路由把全集交给主题，自己不切分页也不留 allPages', () => {
    const route = read('pages/series/[name].js')
    expect(route).toMatch(/import \{ seriesBooks \} from '@\/themes\/journal'/)
    expect(route).toMatch(/seriesBooks\(publishedPosts\(allPages\)\)/)
    expect(route).toMatch(/params: \{ name: book\.name \}/)
    expect(route).toMatch(/delete props\.allPages/)
    expect(route).toMatch(/fallback: isExport\(\) \? false : 'blocking'/)
    // 册页拿的是全集：标签页那两刀（slice 与 delete）不许在这条路上重演
    expect(route).not.toMatch(/POSTS_PER_PAGE|slice\(/)
  })
})

describe('册子目录 /series：一辑一行', () => {
  const indexHtml = posts =>
    renderToStaticMarkup(<LayoutSeriesIndex posts={posts} />)

  test('在册的每一辑排成一行，序与册表同序', () => {
    const html = indexHtml(POSTS)
    expect(html).toContain('3 辑 · 共 7 话')
    for (const name of ['踩坑录', '手账入门', '没有日期']) {
      expect(html).toContain(name)
      expect(html).toContain(`/series/${encodeURIComponent(name)}`)
    }
    // 目录只列辑，不列话：那是归档便条的活
    expect(html).not.toMatch(/第 \d+ 话/)
    // 不成辑的与带斜杠的都进不来（同一把尺滤的，不是目录另算一遍）
    expect(html).not.toContain('只写过一话')
    expect(html).not.toContain(`/series/${encodeURIComponent('带/斜杠')}`)
    expect(html.indexOf('踩坑录')).toBeLessThan(html.indexOf('手账入门'))
    expect(html.indexOf('手账入门')).toBeLessThan(html.indexOf('没有日期'))
  })

  test('一行的数只有手数得出的四个', () => {
    const html = indexHtml(POSTS)
    expect(html).toContain('2025-03-01'.slice(5).replace('-', '.'))
    expect(html).toContain('01.05 – 02.01')
    expect(html).toContain('2024 · 2025 · 2026')
    expect(html).toContain('--.-- – --.--')
    expect(html).toContain('翻开这一辑 →')
    expect(html).not.toMatch(/字数|阅读时长|热度|PV|排行/)
  })

  test('一辑都没有时老实说没攒够，并给出攒法', () => {
    const html = indexHtml([post('lone', '2026-01-01', ['普通标签'])])
    expect(html).toContain('还没有一条线攒成一辑')
    expect(html).toContain('连载:')
    expect(html).toContain('攒够 2 话')
    // 规则便条讲的是规则不是数据，空态也照样在
    expect(html).toContain('怎样算一辑')
    expect(html).not.toMatch(/j-slip j-tape-single flex/)
  })

  test('目录只问 seriesBooks 一把尺，不自己算清单', () => {
    const src = block(
      'function LayoutSeriesIndex',
      'function LayoutSeries(props)'
    )
    expect(src).toMatch(/seriesBooks\(posts\)/)
    expect(src).not.toMatch(/seriesGroups\(posts\)/)
    // 纸沿用归档行那张胶带纸条，不新增材质
    expect(src).toMatch(/j-slip j-tape-single/)
    expect(src).not.toMatch(/--[a-z-]+:/)
  })

  test('两处入口：归档便条顶部与册页「相邻的辑」里，都指 /series', () => {
    const archive = renderToStaticMarkup(<LayoutArchive posts={POSTS} />)
    expect(archive).toContain('连载册目录 →')
    expect(archive).toContain('href="/series"')
    const book = renderToStaticMarkup(
      <LayoutSeries posts={POSTS} series='手账入门' />
    )
    expect(book).toContain('册子目录 →')
    expect(book).toContain('href="/series"')

    // 一条线有、但一本册都组不出来（名字带 /）时那枚不出现：
    // 判据是「有没有成辑」，不是「有没有连载标签」
    const onlySlash = [
      post('slash-1', '2025-04-01', ['连载:带/斜杠']),
      post('slash-2', '2025-05-01', ['连载:带/斜杠'])
    ]
    const bare = renderToStaticMarkup(<LayoutArchive posts={onlySlash} />)
    expect(bare).toContain('带/斜杠')
    expect(bare).not.toContain('href="/series"')
  })

  test('册页那枚入口打印不印：复用同一条 .j-book-nav，不写第二份', () => {
    const { container } = render(
      <LayoutSeries posts={POSTS} series='手账入门' />
    )
    const nav = container.querySelector('.j-book-nav')
    expect(nav.textContent).toContain('册子目录 →')
    const print = styleSource.slice(styleSource.indexOf('@media print'))
    expect(print).toMatch(/#theme-journal \.j-book-nav,/)
  })

  test('开关能整项关掉：目录页与两处入口同关', () => {
    setSwitch('JOURNAL_SERIES_BOOK', false)
    expect(indexHtml(POSTS)).toBe('')
    expect(renderToStaticMarkup(<LayoutArchive posts={POSTS} />)).not.toContain(
      'href="/series"'
    )
    expect(
      renderToStaticMarkup(<LayoutSeries posts={POSTS} series='手账入门' />)
    ).toBe('')
  })

  test('新路由三处登记齐全（/plog 的教训）', () => {
    expect(read('conf/layout-map.config.js')).toMatch(
      /'\/series': 'LayoutSeriesIndex'/
    )
    expect(read('components/SEO.js')).toMatch(/case '\/series':/)
    expect(read('pages/series/index.js')).toMatch(
      /layoutName='LayoutSeriesIndex'/
    )
  })

  test('目录页取全集、不切分页，也不留 allPages', () => {
    const route = read('pages/series/index.js')
    expect(route).toMatch(/delete props\.allPages/)
    expect(route).toMatch(/type === 'Post' && page\.status === 'Published'/)
    expect(route).not.toMatch(/POSTS_PER_PAGE|slice\(|getStaticPaths/)
  })
})
