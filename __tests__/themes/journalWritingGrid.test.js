import fs from 'fs'
import path from 'path'
import { renderToStaticMarkup } from 'react-dom/server.node'
import { LayoutArchive } from '@/themes/journal'

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

const read = p => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const styleSource = read('themes/journal/style.js')

const post = (slug, date) => ({
  id: slug,
  slug,
  title: slug,
  publishDate: date,
  date: { start_date: date }
})

const gridOf = posts => renderToStaticMarkup(<LayoutArchive posts={posts} />)

const count = (html, re) => (html.match(re) || []).length

const FIXTURE = [
  post('a', '2024-06-01'),
  post('b', '2024-06-01'),
  post('c', '2024-06-01'),
  post('d', '2024-06-08'),
  post('e', '2023-02-02')
]

describe('journal writing grid', () => {
  test('one dot per day written, not one per sheet', () => {
    // 三个同一天 → 同一位点一枚大点；两篇并排画两点会把尺挤爆
    const html = gridOf(FIXTURE)
    expect(count(html, /<i class="j-cal-dot/g)).toBe(3)
    expect(count(html, /j-cal-dot-2/g)).toBe(1)
  })

  test('a month with no sheet has no row', () => {
    // 空白天不补、空白月没有行——与「纸会老」同一条原则；这里不画 12 个月的格子
    const html = gridOf(FIXTURE)
    expect(count(html, /class="j-cal-row/g)).toBe(2)
  })

  test('pairs the graphic with text so dots are never the only answer', () => {
    const html = gridOf(FIXTURE)
    expect(html).toMatch(/4 张/)
    expect(html).toMatch(/1 张/)
    expect(html).toMatch(/<span class="j-cal-ruler" aria-hidden="true"/)
  })

  test('reads year, month and day off the string', () => {
    // 构造 Date 会按本地时区把日期挪一天，点就落到错误的刻度上
    const start = read('themes/journal/index.js').indexOf('const yearGrids =')
    const body = read('themes/journal/index.js').slice(
      start,
      read('themes/journal/index.js').indexOf('/* ---', start)
    )
    expect(body).toMatch(/key\.slice\(0, 4\)/)
    expect(body).toMatch(/key\.slice\(5, 7\)/)
    expect(body).toMatch(/key\.slice\(8, 10\)/)
    expect(body).not.toMatch(/new Date\(/)
  })

  test('ticks are a repeating gradient, never punched holes', () => {
    const ruler = styleSource.slice(
      styleSource.indexOf('#theme-journal .j-cal-ruler::before'),
      styleSource.indexOf('#theme-journal .j-cal-dot {')
    )
    expect(ruler).toMatch(/repeating-linear-gradient\(\s*to right,/)
    expect(ruler).toMatch(/calc\(100% \/ 31\)/)
    expect(styleSource).not.toMatch(/\.j-cal-[^{]*{\s*[^}]*radial-gradient/)
  })

  test('borrows only existing ink, and never claims the red slot', () => {
    // 红是邮戳与作者批注的档位；这一格讲的只是密度
    const section = styleSource.slice(
      styleSource.indexOf('3i. 元信息'),
      styleSource.indexOf('---------- 4. 按钮')
    )
    expect(section).toMatch(/background: var\(--ink\)/)
    expect(section).not.toMatch(/var\(--red\)|var\(--yellow\)|var\(--blue\)/)
    expect(section).not.toMatch(/--j-cal-\w+:/)
  })

  test('survives the printer as an outline, not as an empty block', () => {
    // 浏览器默认不印 background：墨点不显式换成就是一张没有点的空尺
    const print = styleSource.slice(styleSource.indexOf('@media print'))
    expect(print).toMatch(
      /#theme-journal \.j-cal-ruler::before {\s*background-image: none/
    )
    expect(print).toMatch(
      /\.j-cal-dot,[\s\S]{0,40}\.j-cal-dot-2 {\s*background: none;\s*border: 1\.4px solid var\(--ink\)/
    )
  })

  test('sits between the year jump and the site stats', () => {
    const archive = read('themes/journal/index.js').slice(
      read('themes/journal/index.js').indexOf('function LayoutArchive(')
    )
    const grid = archive.indexOf('<WritingGrid posts={posts} />')
    expect(grid).toBeGreaterThan(archive.indexOf('按年份跳转'))
    expect(grid).toBeLessThan(archive.indexOf('本站统计'))
  })

  test('has a switch and renders nothing when there is no dated sheet', () => {
    expect(read('themes/journal/config.js')).toMatch(
      /JOURNAL_WRITING_GRID: true/
    )
    expect(gridOf([post('x', '')])).not.toMatch(/j-cal-row/)
  })
})
