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
  // lib/config 也从这个模块取全站快照，不给出口会直接抛
  getGlobalSnapshot: () => null
}))
// notion-utils 发的是 ESM，jest 默认不转 node_modules
jest.mock('notion-utils', () => ({ uuidToId: id => id }))

const read = p => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const themeSource = read('themes/journal/index.js')

const post = (slug, publishDate, lastEditedDate) => ({
  id: slug,
  slug,
  title: slug,
  publishDate,
  date: { start_date: publishDate },
  lastEditedDate
})

const archiveOf = posts => renderToStaticMarkup(<LayoutArchive posts={posts} />)

/** 一行一片：整页 markup 里两行是挨着的，不断开会读到邻行的胶带 */
const rowWith = (html, slug) =>
  html
    .split('j-arch-row')
    .slice(1)
    .find(row => row.includes(`>${slug}<`))

describe('journal revised day gate', () => {
  test('only a gap of several days back counts as a revision', () => {
    // Notion 的 last_edited_time 动一个标点都会变，所以门槛是天数而不是「有没有动过」
    const html = archiveOf([
      post('same-week', '2024-06-01', '2024-06-05'),
      post('over-a-week', '2024-06-01', '2024-06-20')
    ])
    expect(rowWith(html, 'over-a-week')).toMatch(/修订/)
    expect(rowWith(html, 'same-week')).not.toMatch(/修订/)
  })

  test('a missing publish date never earns a tape', () => {
    // 旧实现是 new Date(0) 参与减法：缺发表日会算出一个巨大的 gap，凭空贴胶带
    const html = archiveOf([post('no-published', '', '2024-06-20')])
    expect(rowWith(html, 'no-published')).not.toMatch(/修订/)
  })

  test('the gap is computed in exactly one place', () => {
    // 「改于」和胶带必须同一道门槛；判定只许写在 revisedGap 里
    const body = themeSource.slice(
      themeSource.indexOf('const stateMarks ='),
      themeSource.indexOf('/* ---', themeSource.indexOf('const stateMarks ='))
    )
    expect(body).toMatch(/revised: revisedGap\(post\) > 0/)
    expect(body).not.toMatch(/gapDays|86400000|lastEditedDate/)
    expect(
      (themeSource.match(/const revisedGap =/g) || []).length
    ).toBeGreaterThan(0)
  })

  test('the article page prints the date the tape cannot say', () => {
    const slug = themeSource.slice(
      themeSource.indexOf('function LayoutSlug('),
      themeSource.indexOf('function LayoutArchive(')
    )
    expect(slug).toMatch(/const revisedOn = revisedStamp\(post\)/)
    expect(slug).toMatch(/\{revisedOn && \(/)
    expect(slug).toMatch(/改于 \$\{revisedOn\}/)
    // 列表纸条已经有胶带了，把日期抄到每张纸上只是抢宽度
    const archive = themeSource.slice(
      themeSource.indexOf('function LayoutArchive('),
      themeSource.indexOf('function LayoutCategoryIndex(')
    )
    expect(archive).not.toMatch(/revisedStamp|改于/)
  })

  test('the gate is configured, not hard-coded at the call site', () => {
    expect(read('themes/journal/config.js')).toMatch(/JOURNAL_REVISED_DAYS: 7/)
    expect(themeSource).toMatch(
      /gapDays >= Number\(j\('JOURNAL_REVISED_DAYS', 7\)\)/
    )
  })
})
