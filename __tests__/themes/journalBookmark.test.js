import fs from 'fs'
import path from 'path'
import { renderToStaticMarkup } from 'react-dom/server.node'
import { LayoutIndex } from '@/themes/journal'
import { isRead, pctOf, recordProgress } from '@/themes/journal/reading'

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
  // lib/config 也从这个模块取全站快照，不给出口会直接抛
  getGlobalSnapshot: () => null
}))
jest.mock('notion-utils', () => ({ uuidToId: id => id }))

// 站点配置换成一张全局表：没点名的键一律取调用处的 fallback。
// 用 globalThis 而不是文件顶部的 const——工厂在 import 求值时就可能被调用，那时 const 还在 TDZ
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

const read = p => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const themeSource = read('themes/journal/index.js')
const readingSource = read('themes/journal/reading.js')

// 键名写死在这里是有意的：读者的痕迹只许住在一枚命名空间下，
// 换键等于把已经记下的进度悄悄清零
const STORE_KEY = 'journal:read:v1'
const stored = () => JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}')
const seed = marks =>
  window.localStorage.setItem(STORE_KEY, JSON.stringify(marks))

const post = (slug, date = '2024-06-01') => ({
  id: slug,
  slug,
  title: slug,
  publishDate: date,
  date: { start_date: date }
})

beforeEach(() => {
  window.localStorage.clear()
  delete globalThis.journalSwitches
})

describe('journal reader bookmark layer', () => {
  test('the storage layer is the only thing that touches localStorage', () => {
    const owners = fs
      .readdirSync(path.join(process.cwd(), 'themes/journal'))
      .filter(
        f =>
          f.endsWith('.js') &&
          read(`themes/journal/${f}`).includes('localStorage')
      )
    // 布局里再冒出一处读写，进度就会有两套口径，谁都说不准哪条是真的
    expect(owners).toEqual(['reading.js'])
  })

  test('a page opened and abandoned leaves no trace', () => {
    // 点开就走不该留痕：门槛之下一个字都不写
    recordProgress(post('a'), 2)
    expect(stored()).toEqual({})
    recordProgress(post('a'), 3)
    expect(pctOf(stored(), post('a'))).toBe(3)
  })

  test('only the deepest progress survives', () => {
    recordProgress(post('a'), 40)
    recordProgress(post('a'), 12)
    expect(pctOf(stored(), post('a'))).toBe(40)
    recordProgress(post('a'), 70)
    expect(pctOf(stored(), post('a'))).toBe(70)
  })

  test('the mark just written is never pruned by its own write', () => {
    // 同一毫秒连写四条时，被淘汰的必须是最久没用过的那条，不是刚记下的这条
    setSwitch('JOURNAL_READ_KEEP', 3)
    recordProgress(post('a'), 20)
    recordProgress(post('b'), 20)
    recordProgress(post('c'), 20)
    recordProgress(post('d'), 20)
    const keys = Object.keys(stored())
    expect(keys).toHaveLength(3)
    expect(keys).toContain('d')
    expect(keys).not.toContain('a')
  })

  test('an unknown or corrupted record reads as 0, never as a bogus percentage', () => {
    seed({ a: { p: 62, at: 1 } })
    expect(pctOf(stored(), post('a'))).toBe(62)
    expect(pctOf(stored(), post('never'))).toBe(0)
    expect(pctOf(null, post('a'))).toBe(0)
    // 手改过的坏数据（字符串、超过 100）不该把百分比渲染成 NaN%
    seed({ bad: { p: 'lots' }, over: { p: 400 } })
    expect(pctOf(stored(), post('bad'))).toBe(0)
    expect(pctOf(stored(), post('over'))).toBe(100)
  })

  test('the done line is drawn in exactly one place', () => {
    expect(isRead(96)).toBe(false)
    expect(isRead(97)).toBe(true)
    // 布局不许自带一套「读完了」的判断，否则同一篇这边打勾那边没打
    expect(themeSource).not.toMatch(/JOURNAL_READ_DONE_PCT/)
    expect(readingSource.match(/JOURNAL_READ_DONE_PCT/g)).toHaveLength(1)
  })

  test('the numbers in code are the numbers in config', () => {
    // 调用处的 fallback 与 config.js 必须同值：不一致时两边会读成两套门槛
    const config = read('themes/journal/config.js')
    ;[
      'JOURNAL_READ_MIN_PCT',
      'JOURNAL_READ_KEEP',
      'JOURNAL_READ_DONE_PCT'
    ].forEach(key => {
      const val = config.match(new RegExp(`${key}: (\\d+)`))[1]
      expect(readingSource).toContain(`j('${key}', ${val})`)
    })
  })

  test('the first frame draws no pencil mark, even with history', () => {
    // 服务端没有 localStorage：首帧必须与 SSR 逐字符相同，否则撞 hydration
    seed({ a: { p: 62, at: 1 } })
    const html = renderToStaticMarkup(<LayoutIndex posts={[post('a')]} />)
    expect(html).not.toMatch(/j-pencil/)
    expect(html).not.toMatch(/读到/)
  })

  test('the switch stops writing and stops showing, and keeps what it already stored', () => {
    seed({ a: { p: 62, at: 1 } })
    setSwitch('JOURNAL_READING_BOOKMARK', false)
    recordProgress(post('a'), 90)
    recordProgress(post('b'), 90)
    // 关掉后不主动删读者的东西：存量原地不动，只是不再写
    expect(Object.keys(stored())).toEqual(['a'])
    expect(stored().a.p).toBe(62)
    const html = renderToStaticMarkup(
      <LayoutIndex posts={[post('a'), post('b')]} />
    )
    expect(html).not.toMatch(/读到|读完/)
  })

  test('only the article page is a writer', () => {
    const slug = themeSource.slice(
      themeSource.indexOf('function LayoutSlug('),
      themeSource.indexOf('/* ---------- 归档')
    )
    expect(slug).toMatch(/useProgressRecord\(post\)/)
    expect(slug).toMatch(/<ReadMark pct=\{readPct\} last \/>/)
    const index = themeSource.slice(
      themeSource.indexOf('function LayoutIndex('),
      themeSource.indexOf('function TagCloudStickers(')
    )
    // 列表页只看不写：它没有可测的滚动正文，进度归文章页
    expect(index).not.toMatch(/useProgressRecord/)
  })

  test('the legend says plainly whose mark this is', () => {
    const syntax = themeSource.slice(
      themeSource.indexOf('const LEGEND_SYNTAX ='),
      themeSource.indexOf('/** 图例页')
    )
    expect(syntax).toMatch(/name: '书签 · 读完的勾'/)
    expect(syntax).toMatch(/不上传/)
    // 诚实原则：看不见不是坏了
    expect(syntax).toMatch(/没读过就没有痕/)
  })

  test('the pencil is the fourth colour and not a new token', () => {
    const style = read('themes/journal/style.js')
    const rule = style.slice(
      style.indexOf('#theme-journal .j-pencil {'),
      style.indexOf('#theme-journal .j-pencil svg')
    )
    expect(rule).toMatch(/color: var\(--ink-soft\)/)
    // 红=作者、蓝=可点、黄=分类，读者的痕不许抢任何一档
    expect(rule).not.toMatch(/var\(--(red|blue|yellow)\)/)
    expect(style).not.toMatch(/--pencil/)
  })

  test("a reader's progress does not follow the paper onto the printer", () => {
    const style = read('themes/journal/style.js')
    const print = style.slice(style.indexOf('@media print'))
    expect(print).toMatch(/#theme-journal \.j-pencil,/)
  })
})
