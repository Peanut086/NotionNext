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

jest.mock('@/lib/config', () => ({
  siteConfig: (key, fallback) => {
    const table = globalThis.journalSwitches || {}
    return key in table ? table[key] : fallback
  }
}))

// 只替掉「读」这一步：判据、百分比换算、渲染全部走真实实现
jest.mock('@/themes/journal/reading', () => {
  const actual = jest.requireActual('@/themes/journal/reading')
  return {
    __esModule: true,
    ...actual,
    useReadMarks: () => globalThis.journalReadMarks || null
  }
})

const setSwitch = (key, val) => {
  globalThis.journalSwitches = {
    ...(globalThis.journalSwitches || {}),
    [key]: val
  }
}

const read = p => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const themeSource = read('themes/journal/index.js')

const post = slug => ({
  id: slug,
  slug,
  title: slug,
  publishDate: '2024-06-01',
  date: { start_date: '2024-06-01' }
})

const archiveOf = posts => renderToStaticMarkup(<LayoutArchive posts={posts} />)

/** 一行一片：整页 markup 里两行挨着，不断开会读到邻行的铅笔痕 */
const rowWith = (html, slug) =>
  html
    .split('j-arch-row')
    .slice(1)
    .find(row => row.includes(`>${slug}<`))

beforeEach(() => {
  delete globalThis.journalSwitches
  globalThis.journalReadMarks = {
    half: { p: 62, at: 1 },
    finished: { p: 98, at: 2 }
  }
})

describe('journal read-done pencil tick', () => {
  test('a half-read slip says how far, in pencil', () => {
    const html = archiveOf([post('half'), post('untouched')])
    const row = rowWith(html, 'half')
    expect(row).toMatch(/j-pencil/)
    expect(row).toMatch(/读到 62%/)
    // 「上次」只属于文章页：列表上每行都是「上次」，等于没有
    expect(row).not.toMatch(/上次/)
  })

  test('a finished slip gets the tick and stops quoting a percentage', () => {
    const html = archiveOf([post('finished')])
    const row = rowWith(html, 'finished')
    expect(row).toMatch(/读完/)
    expect(row).not.toMatch(/读到 98%/)
  })

  test('an untouched slip carries no reader mark at all', () => {
    const html = archiveOf([post('untouched')])
    expect(html).not.toMatch(/j-pencil/)
    // 不写「没读过」：读者的空白不该被印在纸上展示
    expect(html).not.toMatch(/未读|没读/)
  })

  test('one slip earns at most one pencil mark', () => {
    const html = archiveOf([post('half'), post('finished'), post('untouched')])
    expect(html.match(/j-pencil/g)).toHaveLength(2)
  })

  test('the tick is drawn, not typed', () => {
    const doodle = themeSource.slice(
      themeSource.indexOf('const CheckDoodle ='),
      themeSource.indexOf('/**\n * 读者留下的铅笔痕')
    )
    expect(doodle).toMatch(/stroke='var\(--ink-soft\)'/)
    expect(doodle).toMatch(/aria-hidden='true'/)
    // 字符勾（✓ / ✔）是字体活，不是手画的，且各平台字形不一
    expect(themeSource).not.toMatch(/[✓✔☑]/)
  })

  test('a finished slip is not made to look less important', () => {
    // readPct 在 PostSlip 里只许出现两次：解构 + 画痕。进了 className 就是把已读当次要
    const start = themeSource.indexOf('function PostSlip({')
    const slip = themeSource.slice(
      start,
      themeSource.indexOf('\n}', start + 200)
    )
    expect(slip.match(/readPct/g)).toHaveLength(2)
    expect(slip).toMatch(/<ReadMark pct=\{readPct\} \/>/)
  })

  test('turning the tick off falls back to the percentage, not to silence', () => {
    setSwitch('JOURNAL_READ_DONE_CHECK', false)
    const html = archiveOf([post('finished')])
    const row = rowWith(html, 'finished')
    expect(row).toMatch(/读到 98%/)
    expect(row).not.toMatch(/读完/)
  })

  test('the tick survives where the page number is dropped', () => {
    const style = read('themes/journal/style.js')
    const mobile = style.slice(
      style.indexOf('/* ---------- 7. 移动端'),
      style.indexOf('/* ---------- 8.')
    )
    expect(mobile).toMatch(/\.j-arch-row \.j-page-no \{/)
    // 页码是本站的编号，可省；铅笔痕是读者自己的东西，窄屏也不该替他擦掉
    expect(mobile).not.toMatch(/\.j-pencil/)
  })

  test('both switches are configured, not hard-coded at the call site', () => {
    const config = read('themes/journal/config.js')
    expect(config).toMatch(/JOURNAL_READING_BOOKMARK: true/)
    expect(config).toMatch(/JOURNAL_READ_DONE_CHECK: true/)
    expect(themeSource).toMatch(/j\('JOURNAL_READ_DONE_CHECK', true\)/)
  })
})
