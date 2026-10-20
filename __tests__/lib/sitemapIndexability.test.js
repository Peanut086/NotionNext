import fs from 'fs'
import { isIndexablePost, yearbookYears } from '@/lib/sitemap-utils'
import { generateSitemapXml } from '@/lib/utils/sitemap.xml'

/**
 * sitemap 收录资格的护栏（P2 改造，2026-10-20）。
 * 规格见 docs/developer/INDEX_COVERAGE_AUDIT.zh-CN.md。
 * 四条策略：排除 /search、排除加密页、排除导航项、补上主题自建路由；
 * 另加一条「两份产物不许各写一套判据」的结构断言。
 */

jest.mock('@/lib/config', () => ({
  siteConfig: (key, defaultVal, extendConfig = {}) => {
    if (key === 'LINK') return extendConfig?.LINK || defaultVal
    return defaultVal
  }
}))

const PUBLISHED = 'Published'

const post = (slug, extra = {}) => ({
  slug,
  status: PUBLISHED,
  type: 'Post',
  publishDay: '2025-06-01',
  ...extra
})

describe('isIndexablePost：收录资格的唯一判据', () => {
  test('普通已发布文章进', () => {
    expect(isIndexablePost(post('adb-install'), PUBLISHED)).toBe(true)
  })

  test('非发布态不进（草稿 / Invisible）', () => {
    expect(isIndexablePost(post('x', { status: 'Draft' }), PUBLISHED)).toBe(false)
    expect(isIndexablePost(post('x', { status: 'Invisible' }), PUBLISHED)).toBe(
      false
    )
  })

  test('导航菜单项不进：它们与真实页面撞车，是重复 loc 的根因', () => {
    expect(isIndexablePost(post('/about', { type: 'Menu' }), PUBLISHED)).toBe(
      false
    )
    expect(
      isIndexablePost(post('/archive', { type: 'SubMenu' }), PUBLISHED)
    ).toBe(false)
    // slug 形态不参与判定：判据是 type，不是 slug 长什么样
    expect(isIndexablePost(post('/about', { type: 'Page' }), PUBLISHED)).toBe(
      true
    )
  })

  test('加密页不进', () => {
    expect(isIndexablePost(post('secret', { password: 'x' }), PUBLISHED)).toBe(
      false
    )
    expect(isIndexablePost(post('secret', { password: '' }), PUBLISHED)).toBe(
      true
    )
  })

  test('搜索页不进', () => {
    expect(isIndexablePost(post('search'), PUBLISHED)).toBe(false)
    expect(isIndexablePost(post('/search'), PUBLISHED)).toBe(false)
  })

  test('锚点不进；外链由 buildSitemapLoc 在同域判定时丢弃', () => {
    // 绝对 URL 不在这里拦：同域的要保留，外链由 buildSitemapLoc 比 hostname 后返回 null
    expect(isIndexablePost(post('https://example.com/x'), PUBLISHED)).toBe(true)
    expect(isIndexablePost(post('#top'), PUBLISHED)).toBe(false)
    expect(isIndexablePost(post(''), PUBLISHED)).toBe(false)
  })
})

describe('yearbookYears：年刊逐年一页', () => {
  test('从发表日取年份、去重、降序', () => {
    const posts = [
      post('a', { publishDay: '2025-06-26' }),
      post('b', { publishDay: '2024-06-05' }),
      post('c', { publishDay: '2025-03-26' })
    ]
    expect(yearbookYears(posts)).toEqual(['2025', '2024'])
  })

  test('只算文章：Page 的日期不算年份，否则会多出空年刊', () => {
    const posts = [
      post('a', { publishDay: '2025-06-26' }),
      // 友链页、关于页这类 Page 有自己的日期，但年刊只收文章
      post('links', { publishDay: '2022-04-08', type: 'Page' }),
      post('about', { publishDay: '2021-01-01', type: 'Page' })
    ]
    expect(yearbookYears(posts)).toEqual(['2025'])
  })

  test('没有日期的文章不产生年刊年份', () => {
    expect(yearbookYears([post('a', { publishDay: null })])).toEqual([])
    expect(yearbookYears([post('a', { publishDay: 'not-a-date' })])).toEqual([])
  })
})

describe('generateSitemapXml：静态版产物', () => {
  test('排除加密页与导航项，补上主题自建路由与年刊', () => {
    const writeSpy = jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => {})

    generateSitemapXml({
      NOTION_CONFIG: { LINK: 'https://example.com' },
      allPages: [
        post('adb-install', { publishDay: '2024-06-05' }),
        post('secret', { password: 'pw' }),
        post('/about', { type: 'Menu' }),
        post('/archive', { type: 'SubMenu' }),
        post('search')
      ]
    })

    const xml = writeSpy.mock.calls[0][1]
    // 静态版按 slug 原样拼，不带 article/ 前缀（那是 POST_URL_PREFIX 的事）
    expect(xml).toContain('<loc>https://example.com/adb-install</loc>')
    expect(xml).not.toContain('secret')
    // 导航项不再产出额外一笔，sitemap 里 /about 至多一条
    expect(xml.match(/example\.com\/about/g) || []).toHaveLength(0)
    expect(xml).not.toContain('https://example.com/search')
    // 主题自建路由与年刊
    expect(xml).toContain('<loc>https://example.com/plog</loc>')
    expect(xml).toContain('<loc>https://example.com/series</loc>')
    expect(xml).toContain('<loc>https://example.com/legend</loc>')
    expect(xml).toContain('<loc>https://example.com/year/2024</loc>')

    writeSpy.mockRestore()
  })

  test('同一个 loc 只出现一次（静态版自己做去重）', () => {
    const writeSpy = jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(() => {})

    generateSitemapXml({
      NOTION_CONFIG: { LINK: 'https://example.com' },
      allPages: [
        post('/about', { type: 'Menu' }),
        post('/about', { type: 'Menu', publishDay: '2024-01-01' })
      ]
    })

    const xml = writeSpy.mock.calls[0][1]
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
    expect(new Set(locs).size).toBe(locs.length)

    writeSpy.mockRestore()
  })
})

describe('两份产物不许各写一套判据', () => {
  const read = p => fs.readFileSync(p, 'utf8')

  test('动态版与静态版都从 lib/sitemap-utils 取判据，不本地重写', () => {
    const dynamic = read('pages/sitemap.xml.js')
    const staticSrc = read('lib/utils/sitemap.xml.js')
    for (const src of [dynamic, staticSrc]) {
      expect(src).toMatch(/isIndexablePost/)
      // 判据本体只能有一份，不许在调用处再写一遍
      expect(src).not.toMatch(/post\.password/)
      expect(src).not.toMatch(/indexOf\('Menu'\)/)
    }
  })

  test('搜索页不在任何一份的默认字段里', () => {
    const dynamic = read('pages/sitemap.xml.js')
    const staticSrc = read('lib/utils/sitemap.xml.js')
    expect(dynamic).not.toMatch(/slug: 'search'/)
    expect(staticSrc).not.toMatch(/slug: 'search'/)
  })
})
