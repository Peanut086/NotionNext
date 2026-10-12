import fs from 'fs'
import path from 'path'
import { renderToStaticMarkup } from 'react-dom/server.node'
import { LayoutIndex } from '@/themes/journal'

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

const themeSource = fs.readFileSync(
  path.join(process.cwd(), 'themes/journal/index.js'),
  'utf8'
)

const post = (slug, date) => ({
  id: slug,
  slug,
  title: slug,
  publishDate: date,
  date: { start_date: date }
})

const fnBody = name => {
  const start = themeSource.indexOf(`function ${name}(`)
  expect(start).toBeGreaterThan(-1)
  const next = themeSource.indexOf('\nfunction ', start + 1)
  return themeSource.slice(start, next === -1 ? undefined : next)
}

describe('journal last stroke on the masthead', () => {
  test('names the newest publish date of the whole notebook', () => {
    const html = renderToStaticMarkup(
      <LayoutIndex
        posts={[post('old', '2023-02-01'), post('new', '2024-06-08')]}
      />
    )
    expect(html).toContain('上次落笔 2024.06.08')
  })

  test('renders the date but not the day count in the first frame', () => {
    // 静态导出下 Date.now() 是构建时刻：服务端值与水合时的客户端值必然不同。
    // 首帧只渲染日期，天数由挂载后的 effect 补——无 JS 与打印态那行日期照样在
    const html = renderToStaticMarkup(
      <LayoutIndex posts={[post('old', '2023-02-01')]} />
    )
    expect(html).not.toMatch(/停笔/)
  })

  test('the day counter only ever comes from state, never from render', () => {
    const masthead = fnBody('Masthead')
    expect(masthead).toMatch(/useState\(null\)/)
    expect(masthead).toMatch(
      /useEffect\(\(\) => \{[\s\S]{0,120}setIdle\(idleDays\(/
    )
    expect(masthead).toMatch(/\{idle > 0 \? ` · 停笔/)
  })

  test('says nothing at all when no post carries a date', () => {
    const html = renderToStaticMarkup(
      <LayoutIndex posts={[post('undated', '')]} />
    )
    expect(html).not.toMatch(/上次落笔/)
    // 不写「上次落笔 未知」：一本没有日期的本子，扉页不该编一个状态出来
    expect(html).not.toMatch(/上次落笔[^<]*(未知|--)/)
  })

  test('counts days on the same UTC ruler as the paper aging', () => {
    const start = themeSource.indexOf('const idleDays =')
    expect(start).toBeGreaterThan(-1)
    const body = themeSource.slice(start, start + 300)
    expect(body).toMatch(/utcDayNumber\(Date\.now\(\)\) - utcDayNumber\(born\)/)
    expect(body).toMatch(/T00:00:00Z/)
    expect(body).toMatch(/Math\.max\(0, /)
    // 天数口径必须与「纸会老」共用同一套日编号，否则两件事会互相打脸
    expect(themeSource).toMatch(
      /const paperAge = key =>[\s\S]{0,400}utcDayNumber\(Date\.now\(\)\) - utcDayNumber\(born\)/
    )
  })

  test('has a switch and stays out of the print sheet’s way', () => {
    expect(
      fs.readFileSync(
        path.join(process.cwd(), 'themes/journal/config.js'),
        'utf8'
      )
    ).toMatch(/JOURNAL_LAST_STROKE: true/)
  })
})
