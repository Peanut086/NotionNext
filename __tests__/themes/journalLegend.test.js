import fs from 'fs'
import path from 'path'
import { renderToStaticMarkup } from 'react-dom/server.node'
import { LayoutLegend } from '@/themes/journal'

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

const legend = posts => renderToStaticMarkup(<LayoutLegend posts={posts} />)
const count = (html, re) => (html.match(re) || []).length

const FIXTURE = [
  { id: 'locked-one', slug: 'locked-one', title: 'locked-one', password: 'x' },
  {
    id: 'starred',
    slug: 'starred',
    title: 'starred',
    tags: ['featured'],
    pageCover: '/cover.png',
    publishDate: '2024-06-03',
    date: { start_date: '2024-06-03' }
  },
  {
    id: 'revised-one',
    slug: 'revised-one',
    title: 'revised-one',
    publishDate: '2024-06-01',
    date: { start_date: '2024-06-01' },
    lastEditedDate: '2024-06-20'
  },
  {
    id: 'plog-one',
    slug: 'plog-one',
    title: 'plog-one',
    tags: ['plog'],
    publishDate: '2024-06-02',
    date: { start_date: '2024-06-02' }
  }
]

const legendKeys = () => {
  const start = themeSource.indexOf('const LEGEND_KEYS =')
  const block = themeSource.slice(
    start,
    themeSource.indexOf('const markName', start)
  )
  return [...block.matchAll(/key: '([a-z]+)'/g)].map(m => m[1])
}

describe('journal legend page', () => {
  test('lists every mark the paper can carry, in the judge’s own order', () => {
    expect(legendKeys()).toEqual([
      'locked',
      'pinned',
      'featured',
      'revised',
      'receipt',
      'photo'
    ])
    const html = legend(FIXTURE)
    ;['加密', '置顶', '精选', '修订', 'plog', '有图'].forEach(name =>
      expect(html).toContain(name)
    )
  })

  test('says plainly when a mark has no content yet', () => {
    // 命中 0 不等于坏了：这一页的作用之一就是让人看出「哪项能力在等内容」
    const html = legend(FIXTURE)
    expect(html).toMatch(/今天有 1 张纸带上它/)
    expect(html).toMatch(/这个标记今天还没用上/)
    expect(html.match(/这个标记今天还没用上/g).length).toBe(1)
  })

  test('the sample is a real sheet, not a drawn mock-up', () => {
    const html = legend(FIXTURE)
    // 六个区块，每块一张真实纸条当样例：类名与 PostSlip 完全一致，没有第二套样例组件
    expect(count(html, /class="j-slip j-tape-single/g)).toBe(5)
    expect(html).toContain('locked-one')
    // 样例的判定与纸上的一样：图例不许自己算一遍
    expect(themeSource).toMatch(
      /posts\.find\(post => stateMarks\(post\)\.some\(mark => mark\.key === key\)\)/
    )
  })

  test('shares one state vocabulary with the OG card route', () => {
    const route = read('pages/api/og.js')
    const states = route
      .match(/const STATES = \[([^\]]*)\]/)[1]
      .split(',')
      .map(s => s.trim().replace(/'/g, ''))
      .filter(Boolean)
    expect(states.sort()).toEqual(legendKeys().sort())
  })

  test('registers the route in all three places', () => {
    // 漏了 SEO.js 的 case，标题会落到 default 变成「站名 · loading」——/plog 踩过这刀
    expect(
      fs.existsSync(path.join(process.cwd(), 'pages/legend/index.js'))
    ).toBe(true)
    expect(read('pages/legend/index.js')).toMatch(/layoutName='LayoutLegend'/)
    expect(read('conf/layout-map.config.js')).toMatch(
      /'\/legend': 'LayoutLegend'/
    )
    expect(read('components/SEO.js')).toMatch(/case '\/legend':/)
    expect(themeSource).toMatch(/LayoutLegend,/)
  })

  test('stays out of the tape navigation by default', () => {
    expect(read('themes/journal/config.js')).toMatch(
      /JOURNAL_NAV_LEGEND: false/
    )
    const topBar = themeSource.slice(
      themeSource.indexOf('function TopBar('),
      themeSource.indexOf('function Footer(')
    )
    expect(topBar).toMatch(/show: j\('JOURNAL_NAV_LEGEND', false\)/)
    // 入口在归档右栏的「本站统计」里
    const archive = themeSource.slice(
      themeSource.indexOf('function LayoutArchive('),
      themeSource.indexOf('function LayoutCategoryIndex(')
    )
    expect(archive).toMatch(/<SmartLink href='\/legend'>/)
  })

  test('documents the syntax that lives outside the six marks', () => {
    const html = legend(FIXTURE)
    ;[
      '红字批注',
      '段落荧光笔划',
      '一天一摊',
      '纸会老',
      '页码 P.0XX',
      '落笔格'
    ].forEach(name => expect(html).toContain(name))
    // 段落颜色根本不在列表 props 里，这一页不许假装数得出来
    expect(html).toMatch(/列表拿不到段落颜色/)
  })

  test('states the notebook’s own numbers from real fields', () => {
    const html = legend(FIXTURE)
    expect(html).toContain('纸的张数')
    expect(html).toContain('4 张')
    expect(html).toContain('页码编到')
    expect(html).toContain('P.003')
    expect(html).toContain('上次落笔')
  })
})
