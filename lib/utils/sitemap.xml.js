import BLOG from '@/blog.config'
import fs from 'fs'
import { siteConfig } from '../config'
import {
  buildSitemapLoc,
  isIndexablePost,
  normalizeSitemapBaseUrl,
  toSitemapDateString,
  yearbookYears
} from '../sitemap-utils'

/** 主题自建静态页：与动态版共用同一份清单，两份产物不许各写一遍 */
const THEME_STATIC_SLUGS = ['plog', 'series', 'legend']

/**
 * 生成站点地图
 * @param {*} param0
 */
export function generateSitemapXml({ allPages, NOTION_CONFIG }) {
  const link = normalizeSitemapBaseUrl(siteConfig('LINK', BLOG.LINK, NOTION_CONFIG))
  const dateNow = toSitemapDateString(new Date())
  // 收录判据先算一次：年刊年份只看会被收录的文章，不把导航项的日期当年份
  const indexable =
    allPages?.filter(post =>
      isIndexablePost(post, BLOG.NOTION_PROPERTY_NAME.status_publish)
    ) ?? []
  // 搜索页不进 sitemap（同动态版）
  const urls = [
    {
      loc: buildSitemapLoc({ baseUrl: link }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: buildSitemapLoc({ baseUrl: link, slug: 'archive' }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: buildSitemapLoc({ baseUrl: link, slug: 'category' }),
      lastmod: dateNow,
      changefreq: 'daily'
    },
    {
      loc: buildSitemapLoc({ baseUrl: link, slug: 'tag' }),
      lastmod: dateNow,
      changefreq: 'daily'
    },
    ...[...THEME_STATIC_SLUGS, ...yearbookYears(indexable).map(y => `year/${y}`)]
      .map(slug => ({
        loc: buildSitemapLoc({ baseUrl: link, slug }),
        lastmod: dateNow,
        changefreq: 'weekly'
      }))
      .filter(item => Boolean(item?.loc))
  ].filter(item => Boolean(item?.loc))
  // 循环页面生成
  indexable.forEach(post => {
    const loc = buildSitemapLoc({
      baseUrl: link,
      slug: post?.slug
    })
    if (!loc) return

    urls.push({
      loc,
      lastmod: toSitemapDateString(post?.publishDay, dateNow),
      changefreq: 'daily'
    })
  })
  const uniqueUrls = dedupeByLoc(urls)
  const xml = createSitemapXml(uniqueUrls)
  try {
    fs.writeFileSync('sitemap.xml', xml)
    fs.writeFileSync('./public/sitemap.xml', xml)
  } catch (error) {
    console.warn('无法写入文件', error)
  }
}

/** 静态导出没有 next-sitemap 的去重，这里按 loc 去重并保留较新的 lastmod */
function dedupeByLoc(urls) {
  const map = new Map()
  urls.forEach(url => {
    const existing = map.get(url.loc)
    if (!existing || new Date(url.lastmod) > new Date(existing.lastmod)) {
      map.set(url.loc, url)
    }
  })
  return Array.from(map.values())
}

/**
 * 生成站点地图
 * @param {*} urls
 * @returns
 */
function createSitemapXml(urls) {
  let urlsXml = ''
  urls.forEach(u => {
    urlsXml += `<url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    </url>
    `
  })

  return `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
    xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    ${urlsXml}
    </urlset>
    `
}
