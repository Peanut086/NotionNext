import fs from 'fs'
import path from 'path'
import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server.node'
import {
  LayoutArchive,
  LayoutIndex,
  LayoutPostList,
  LayoutSlug,
  LayoutTagIndex,
  seriesGroups,
  seriesOf,
  tagLabel
} from '@/themes/journal'

/**
 * 连载语法的护栏。规格见 design-system/journal/MASTER.md「连载语法」节。
 * 一条线只许有一个判据（剥前缀那一次），所以判据用纯函数直接问，
 * 「清单只在有全集的地方」与「不进状态词表」用源码断言钉住。
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

const SERIES_POSTS = [
  post('b-2026', '2026-02-01', ['连载:手账入门', '工具']),
  post('a-2024', '2024-01-05', ['连载:手账入门']),
  post('c-2025', '2025-06-15', ['连载:手账入门']),
  post('solo', '2025-07-01', ['连载:只写过一话']),
  post('plain', '2025-08-01', ['普通标签'])
]

const slugs = group => group.posts.map(({ post: p }) => p.slug)

describe('连载语法：判据', () => {
  test('前缀之后那截才是连载名', () => {
    expect(seriesOf(post('x', '2026-01-01', ['连载:手账入门']))).toEqual({
      tag: '连载:手账入门',
      name: '手账入门'
    })
  })

  test('光一个前缀、后面没字，不算一篇连载', () => {
    // 名字都没有的线不画
    expect(seriesOf(post('x', '2026-01-01', ['连载:']))).toBe(null)
    expect(seriesOf(post('x', '2026-01-01', ['连载:  ']))).toBe(null)
  })

  test('一篇只归一辑：取第一个命中的标签', () => {
    const two = seriesOf(
      post('x', '2026-01-01', ['连载:甲', '普通', '连载:乙'])
    )
    expect(two.name).toBe('甲')
    expect(two.tag).toBe('连载:甲')
  })

  test('不是连载标签就没有', () => {
    expect(seriesOf(post('x', '2026-01-01', ['手账入门']))).toBe(null)
    expect(seriesOf(post('x', '2026-01-01'))).toBe(null)
    expect(seriesOf(null)).toBe(null)
  })

  test('剥前缀只写一处', () => {
    expect(themeSource.match(/slice\(prefix\.length\)/g) || []).toHaveLength(1)
  })

  test('前缀置空即整族关掉', () => {
    setSwitch('JOURNAL_SERIES_PREFIX', '')
    expect(seriesOf(post('x', '2026-01-01', ['连载:手账入门']))).toBe(null)
    expect(tagLabel('连载:手账入门')).toBe('连载:手账入门')
  })

  test('胶囊把前缀写成「连载 · 名字」，普通标签原样', () => {
    expect(tagLabel('连载:手账入门')).toBe('连载 · 手账入门')
    expect(tagLabel('普通标签')).toBe('普通标签')
    expect(tagLabel(undefined)).toBe(undefined)
  })

  test('首页贴纸标签云也念「连载 · 名字」，链子仍指原标签', () => {
    const html = renderToStaticMarkup(
      <LayoutIndex
        posts={[post('a-2024', '2024-01-01', ['连载:手账入门'])]}
        tagOptions={[
          { name: '连载:手账入门', count: 3 },
          { name: '普通标签', count: 1 }
        ]}
      />
    )
    expect(html).toMatch(/连载 · 手账入门/)
    // 云里不许再直接印裸前缀：那是 Notion 的字段名，不是给人念的
    expect(html).not.toMatch(/连载:手账入门/)
    expect(html).toMatch(/href="\/tag\/%E8%BF%9E%E8%BD%BD%3A/)
  })

  test('列表标签行与「最近用过的标签」也走同一把尺，链子照样 encode', () => {
    const tagOptions = [
      { name: '连载:手账入门', count: 3 },
      { name: '普通标签', count: 1 }
    ]
    const list = renderToStaticMarkup(
      <LayoutPostList
        title='话题'
        tag='连载:手账入门'
        tagOptions={tagOptions}
        posts={[post('a-2024', '2024-01-01', ['连载:手账入门'])]}
      />
    )
    const tagIndex = renderToStaticMarkup(
      <LayoutTagIndex
        tagOptions={tagOptions}
        posts={[post('a-2024', '2024-01-01', ['连载:手账入门'])]}
      />
    )
    for (const html of [list, tagIndex]) {
      expect(html).toMatch(/连载 · 手账入门/)
      expect(html).not.toMatch(/连载:手账入门/)
      expect(html).toMatch(/href="\/tag\/%E8%BF%9E%E8%BD%BD%3A/)
    }
  })

  test('话数按发表日升序，与页码同一把尺', () => {
    // 传入顺序故意打乱：清单不跟后端序走
    expect(slugs(seriesGroups(SERIES_POSTS)[0])).toEqual([
      'a-2024',
      'c-2025',
      'b-2026'
    ])
    const yardstick = /cmp\(a\.slug, b\.slug\) : cmp\(a\.key, b\.key\)/
    expect(block('const pageNumbers', '/* -----')).toMatch(yardstick)
    expect(block('const seriesGroups', 'function SeriesNote')).toMatch(
      yardstick
    )
  })

  test('同日按 slug 定序，不跟后端序漂', () => {
    const sameDay = [
      post('z-day', '2026-03-01', ['连载:同日']),
      post('a-day', '2026-03-01', ['连载:同日'])
    ]
    expect(slugs(seriesGroups(sameDay)[0])).toEqual(['a-day', 'z-day'])
  })

  test('不足两话不成辑', () => {
    expect(seriesGroups(SERIES_POSTS).map(g => g.name)).toEqual(['手账入门'])
    // 门槛降到 1 就成辑：清单里的有无由这一把尺决定，不是写死的
    setSwitch('JOURNAL_SERIES_MIN', 1)
    expect(seriesGroups(SERIES_POSTS).map(g => g.name)).toEqual([
      '只写过一话',
      '手账入门'
    ])
  })

  test('辑序按首话日期降序，最近开辑的排前面', () => {
    const groups = seriesGroups([
      ...SERIES_POSTS,
      post('new-2026', '2026-05-01', ['连载:新坑']),
      post('new-2026b', '2026-06-01', ['连载:新坑'])
    ])
    expect(groups.map(g => g.name)).toEqual(['新坑', '手账入门'])
  })

  test('没有发表日的也占一话，日期写 --.--', () => {
    const groups = seriesGroups([
      post('dated', '2026-01-01', ['连载:无期']),
      post('undated', '', ['连载:无期'])
    ])
    expect(slugs(groups[0])).toEqual(['undated', 'dated'])
    const html = renderToStaticMarkup(
      <LayoutArchive
        posts={[
          post('dated', '2026-01-01', ['连载:无期']),
          post('undated', '', ['连载:无期'])
        ]}
      />
    )
    expect(html).toContain('--.--')
  })
})

describe('连载语法：纸上', () => {
  test('清单是纯服务端的，SSR 首帧就在', () => {
    // 与「往年的今天」相反：这里不读浏览器状态，所以首帧就有
    const html = renderToStaticMarkup(<LayoutArchive posts={SERIES_POSTS} />)
    const at = html.indexOf('>连载</h2>')
    expect(at).toBeGreaterThan(-1)
    const note = html.slice(at, html.indexOf('</aside>', at))
    expect(note).toContain('手账入门')
    expect(note).toContain('第 1 话 · 01.05')
    expect(note).toContain('3 话')
    // 不成辑的那一话不进清单，但胶囊照样改写——语法不因为还没成辑就失灵
    expect(note).not.toContain('只写过一话')
    expect(html).toContain('连载 · 只写过一话')
  })

  test('没打标签时整张便条不出现，也没有占位话', () => {
    render(
      <LayoutArchive posts={[post('plain', '2026-01-01', ['普通标签'])]} />
    )
    const text = document.body.textContent
    expect(text).not.toContain('第 1 话')
    expect(text).not.toMatch(/还没有连载|没有连载/)
  })

  test('挂载后与 SSR 同一份清单', () => {
    render(<LayoutArchive posts={SERIES_POSTS} />)
    const rows = [...document.querySelectorAll('.j-note a')].filter(a =>
      /^[abc]-\d{4}$/.test(a.textContent)
    )
    expect(rows.map(a => a.textContent)).toEqual(['a-2024', 'c-2025', 'b-2026'])
  })

  test('便条的链指回原标签，不是编出来的地址', () => {
    render(<LayoutArchive posts={SERIES_POSTS} />)
    const groupHead = [...document.querySelectorAll('.j-note a')].find(
      a => a.textContent === '手账入门'
    )
    expect(decodeURIComponent(groupHead.getAttribute('href'))).toBe(
      '/tag/连载:手账入门'
    )
  })

  test('材质只有铅笔灰与手写链，不新增 token', () => {
    const note = block('function SeriesNote', 'function LayoutArchive')
    expect(note).toMatch(/className='j-stamp j-soft/)
    expect(note).not.toMatch(/j-red|j-blue|j-pencil/)
    expect(note).toMatch(/j-hand/)
    const styleSource = read('themes/journal/style.js')
    expect(styleSource).not.toMatch(/--series/)
  })

  test('清单只在归档右栏：首页没有全集', () => {
    const archive = block(
      'function LayoutArchive',
      '/* ---------- 分类 / 标签 ---------- */'
    )
    expect(archive).toMatch(/<SeriesNote posts=\{posts\} \/>/)
    const index = block('function LayoutIndex', 'function LayoutPostList')
    expect(index).not.toMatch(/SeriesNote|seriesGroups/)
  })

  test('文章页只改胶囊写法，不自己算清单', () => {
    render(
      <LayoutSlug
        post={post('one', '2026-01-01', ['连载:手账入门'])}
        lock={false}
      />
    )
    const text = document.body.textContent
    expect(text).toContain('连载 · 手账入门')
    expect(text).not.toContain('第 1 话')
    // 上下篇仍由全局 prev / next 承担：连载内导航算不出来，也不该算
    const slug = block('function LayoutSlug', '/* ---------- 归档 ----------')
    expect(slug).toMatch(/<ArticleAround prev=\{prev\} next=\{next\} \/>/)
    expect(slug).not.toMatch(/seriesGroups|seriesOf/)
  })

  test('连载进「其它语法」，不进状态词表', () => {
    expect(themeSource).toMatch(
      /const LEGEND_SYNTAX = \[[\s\S]*?name: '连载'[\s\S]*?\n\]/
    )
    const keys = block('const LEGEND_KEYS', 'const markName')
    expect(keys).not.toMatch(/key: 'series'/)
    // 状态词表没动：OG 卡的六个键仍是原样
    const route = read('pages/api/og.js')
    const states = route
      .match(/const STATES = \[([^\]]*)\]/)[1]
      .split(',')
      .map(s => s.trim().replace(/'/g, ''))
      .filter(Boolean)
    expect(states).toEqual([
      'locked',
      'pinned',
      'featured',
      'revised',
      'receipt',
      'photo'
    ])
  })

  test('四个键配在 config.js，不写死在调用处', () => {
    const configSource = read('themes/journal/config.js')
    ;[
      /JOURNAL_SERIES_PREFIX: '连载:'/,
      /JOURNAL_SERIES_LABEL: '连载'/,
      /JOURNAL_SERIES_TITLE: '连载'/,
      /JOURNAL_SERIES_MIN: 2/
    ].forEach(re => expect(configSource).toMatch(re))
    expect(themeSource).toMatch(/j\('JOURNAL_SERIES_MIN', 2\)/)
  })
})
