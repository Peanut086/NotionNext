import fs from 'fs'
import path from 'path'
import { renderToStaticMarkup } from 'react-dom/server.node'
import { LayoutArchive, LayoutIndex } from '@/themes/journal'

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
const themeSource = read('themes/journal/index.js')

const post = (slug, date, extra = {}) => ({
  id: slug,
  slug,
  title: slug,
  publishDate: date,
  date: { start_date: date },
  ...extra
})

/** slug → 页码。渲染顺序是「新的在上」，与编号无关，所以按标题回捞 */
const pagesIn = html =>
  Object.fromEntries(
    [...html.matchAll(/>([^<]+)<\/a>[\s\S]{0,700}?P\.(\d{3})/g)].map(m => [
      m[1],
      Number(m[2])
    ])
  )

const archiveOf = posts =>
  pagesIn(renderToStaticMarkup(<LayoutArchive posts={posts} />))

describe('journal page numbers', () => {
  test('numbers the whole set from the oldest sheet up', () => {
    expect(
      archiveOf([
        post('c', '2024-06-08'),
        post('a', '2024-06-01'),
        post('b', '2023-01-05')
      ])
    ).toEqual({ b: 1, a: 2, c: 3 })
  })

  test('breaks same-day ties on slug, not on the back-end order', () => {
    // 后端序是「置顶优先 + 更新时间」，每编辑一次就漂一遍；印在纸上的页码一漂就全乱
    const pair = [post('z-second', '2024-06-01'), post('a-first', '2024-06-01')]
    expect(archiveOf(pair)).toEqual(archiveOf([...pair].reverse()))
    expect(archiveOf(pair)).toEqual({ 'a-first': 1, 'z-second': 2 })
  })

  test('an undated sheet gets no number instead of an invented one', () => {
    const map = archiveOf([post('no-date', ''), post('dated', '2024-06-01')])
    expect(map).toEqual({ dated: 1 })
  })

  test('only the two layouts that hold the full set print it', () => {
    const posts = [post('a', '2024-06-01'), post('b', '2024-06-08')]
    const index = pagesIn(renderToStaticMarkup(<LayoutIndex posts={posts} />))
    expect(index).toEqual({ a: 1, b: 2 })
    expect(archiveOf(posts)).toEqual({ a: 1, b: 2 })

    // 分类 / 标签 / 搜索的 props 里没有全集，硬算只会算出错页码；
    // 文章页更是拿不到（resolvePostProps 在交给主题前就 delete props.allPages）
    for (const name of ['LayoutPostList', 'LayoutSearch', 'LayoutSlug']) {
      const body = themeSource.slice(
        themeSource.indexOf(`function ${name}(`),
        themeSource.indexOf(
          '\nfunction ',
          themeSource.indexOf(`function ${name}(`)
        )
      )
      expect(body).not.toMatch(/pageNumbers\(|<PageNo/)
    }
  })

  test('never caches the map at module scope', () => {
    // SSR 下模块跨请求共享，缓存会把上一站的页码印到这一站上
    expect(themeSource).toMatch(
      /useMemo\(\s*\(\) => \(j\('JOURNAL_PAGE_NUMBERS', true\)[\s\S]{0,80}pageNumbers\(posts\)/
    )
    expect(themeSource).not.toMatch(/^const \w+ = pageNumbers\(/m)
  })

  test('narrow screens give up the archive number, not the index one', () => {
    // 归档行里页码抢的是标题的宽度，与「归档行轻量标记」量过的代价同一类
    const style = read('themes/journal/style.js')
    expect(style).toMatch(
      /#theme-journal \.j-arch-row \.j-page-no\s*{\s*display: none/
    )
    expect(style).not.toMatch(/#theme-journal \.j-page-no\s*{\s*display: none/)
  })

  test('is text only, in the stamp layer — no new material for a number', () => {
    const slip = themeSource.slice(
      themeSource.indexOf('const PageNo ='),
      themeSource.indexOf('/** 一张胶带纸条式')
    )
    expect(slip).toMatch(/j-page-no j-stamp j-soft/)
    expect(slip).toMatch(/padStart\(3, '0'\)/)
    const style = read('themes/journal/style.js')
    expect(style).toMatch(/#theme-journal \.j-page-no {\s*white-space: nowrap;/)
  })
})
