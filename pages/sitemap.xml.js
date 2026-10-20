// pages/sitemap.xml.js
import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import {
  buildSitemapLoc,
  isIndexablePost,
  normalizeSitemapBaseUrl,
  normalizeSitemapLocale,
  toSitemapDateString,
  yearbookYears
} from '@/lib/sitemap-utils'
import { extractLangId, extractLangPrefix } from '@/lib/utils/pageId'
import { getServerSideSitemap } from 'next-sitemap'

/** Journal 主题自建路由：都已上线且有真实内容，此前从未接线到 sitemap。
 *  与静态版共用这一份清单，两份产物不许各写一遍。 */
const THEME_STATIC_SLUGS = ['plog', 'series', 'legend']

export const getServerSideProps = async ctx => {
  let fields = []
  const siteIds = BLOG.NOTION_PAGE_ID.split(',')

  for (let index = 0; index < siteIds.length; index++) {
    const siteId = siteIds[index]
    const id = extractLangId(siteId)
    const locale = extractLangPrefix(siteId)
    // 第一个id站点默认语言
    const siteData = await fetchGlobalAllData({
      pageId: id,
      from: 'sitemap.xml'
    })
    const link = siteConfig(
      'LINK',
      siteData?.siteInfo?.link,
      siteData.NOTION_CONFIG
    )
    const localeFields = generateLocalesSitemap(link, siteData.allPages, locale)
    fields = fields.concat(localeFields)
  }

  fields = getUniqueFields(fields)

  // 缓存
  ctx.res.setHeader(
    'Cache-Control',
    'public, max-age=3600, stale-while-revalidate=59'
  )
  return getServerSideSitemap(ctx, fields)
}

function generateLocalesSitemap(link, allPages, locale) {
  const normalizedLink = normalizeSitemapBaseUrl(link)
  const normalizedLocale = normalizeSitemapLocale(locale)
  const dateNow = toSitemapDateString(new Date())

  // 收录判据先算一次，年刊年份也只看「会被收录的文章」——
  // 用全量行算会把导航项的日期当成文章年份，凭空多出 2021–2023 三册
  const indexable = allPages?.filter(post =>
    isIndexablePost(post, BLOG.NOTION_PROPERTY_NAME.status_publish)
  ) ?? []

  // 搜索页不进 sitemap，默认字段中随之去掉
  const defaultSlugs = ['archive', 'category', 'rss/feed.xml', 'tag']

  const defaultFields = [
    {
      loc: buildSitemapLoc({ baseUrl: normalizedLink, locale: normalizedLocale }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    ...defaultSlugs.map(slug => ({
      loc: buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug
      }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    })),
    // 主题自建静态页 + 年刊逐年一页
    ...[...THEME_STATIC_SLUGS, ...yearbookYears(indexable).map(y => `year/${y}`)].map(
      slug => ({
        loc: buildSitemapLoc({
          baseUrl: normalizedLink,
          locale: normalizedLocale,
          slug
        }),
        lastmod: dateNow,
        changefreq: 'weekly',
        priority: '0.7'
      })
    )
  ].filter(field => Boolean(field?.loc))

  const postFields = indexable
    ?.map(post => {
      const loc = buildSitemapLoc({
        baseUrl: normalizedLink,
        locale: normalizedLocale,
        slug: post?.slug
      })
      if (!loc) return null

      return {
        loc,
        lastmod: toSitemapDateString(post?.publishDay, dateNow),
        changefreq: 'daily',
        priority: '0.7'
      }
    })
    ?.filter(Boolean) ?? []

  return defaultFields.concat(postFields)
}

function getUniqueFields(fields) {
  const uniqueFieldsMap = new Map()

  fields.forEach(field => {
    const existingField = uniqueFieldsMap.get(field.loc)

    if (!existingField || new Date(field.lastmod) > new Date(existingField.lastmod)) {
      uniqueFieldsMap.set(field.loc, field)
    }
  })

  return Array.from(uniqueFieldsMap.values())
}

export default () => { }
