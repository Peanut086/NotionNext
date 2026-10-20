const isAbsoluteHttpUrl = value =>
  typeof value === 'string' && /^(https?:)?\/\//i.test(value.trim())

export const normalizeSitemapBaseUrl = link => {
  if (typeof link !== 'string') return ''
  return link.trim().replace(/\/+$/, '')
}

export const normalizeSitemapLocale = locale => {
  if (!locale) return ''
  const value = String(locale).trim()
  if (!value) return ''
  return value.startsWith('/') ? value : `/${value}`
}

export const toSitemapDateString = (
  dateInput,
  fallbackDate = new Date().toISOString().split('T')[0]
) => {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return fallbackDate
  }
  return date.toISOString().split('T')[0]
}

export const buildSitemapLoc = ({
  baseUrl,
  locale = '',
  slug
} = {}) => {
  const normalizedBaseUrl = normalizeSitemapBaseUrl(baseUrl)
  if (!normalizedBaseUrl) return null

  const normalizedLocale = normalizeSitemapLocale(locale)

  if (slug === undefined || slug === null || slug === '') {
    return `${normalizedBaseUrl}${normalizedLocale}`
  }

  const rawSlug = String(slug).trim()
  if (!rawSlug || rawSlug === '#') {
    return null
  }

  if (isAbsoluteHttpUrl(rawSlug)) {
    try {
      const targetUrl = new URL(rawSlug, normalizedBaseUrl)
      const siteUrl = new URL(normalizedBaseUrl)

      // sitemap 仅收录本站链接，避免外链混入
      if (targetUrl.hostname !== siteUrl.hostname) {
        return null
      }

      return targetUrl.toString().replace(/\/+$/, '')
    } catch (error) {
      return null
    }
  }

  const normalizedSlug = rawSlug.replace(/^\/+/, '')
  if (!normalizedSlug) {
    return `${normalizedBaseUrl}${normalizedLocale}`
  }

  return `${normalizedBaseUrl}${normalizedLocale}/${normalizedSlug}`
}

export const normalizeSiteUrl = normalizeSitemapBaseUrl

export const createSiteUrl = (baseUrl, slug) =>
  buildSitemapLoc({ baseUrl, slug })

/** 收录资格的唯一判据，动态版与静态版都问它，不许各写一份。
 *  - 非发布态不收
 *  - Menu / SubMenu 不收：导航项的 slug 形如 /about、/archive，会与真实页面撞车
 *  - 加密页不收：不把有口令的页主动交给搜索引擎
 *  - 锚点不收；绝对 URL 交给 buildSitemapLoc 判同域（同域保留、外链丢弃）
 *  - /search 不收：搜索结果页没有固定内容 */
const EXCLUDED_SLUGS = new Set(['search'])

export const isIndexablePost = (post, publishStatus) => {
  if (!post) return false
  if (post.status !== publishStatus) return false
  if (String(post.type || '').indexOf('Menu') >= 0) return false
  if (post.password) return false
  if (!post.slug) return false
  const slug = String(post.slug)
  if (slug.startsWith('#')) return false
  if (slug.startsWith('http')) return true
  return !EXCLUDED_SLUGS.has(slug.replace(/^\/+/, ''))
}

/** 年刊逐年一页：年份取自发表日，与主题 bookYears 同一把尺。
 *  只算文章（type=Post）——年刊页本身也只收文章，把 Page（关于 / 友链）的日期
 *  算进来会凭空多出一册空年刊。 */
export const yearbookYears = (posts = []) =>
  [
    ...new Set(
      posts
        .filter(
          post => post && post.slug && post.publishDay && post.type === 'Post'
        )
        .map(post => {
          const date = new Date(post.publishDay)
          return Number.isNaN(date.getTime())
            ? ''
            : String(date.getUTCFullYear())
        })
        .filter(Boolean)
    )
  ].sort((a, b) => (a < b ? 1 : -1))
