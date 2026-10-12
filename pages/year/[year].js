import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { isExport } from '@/lib/utils/buildMode'
import { bookYears } from '@/themes/journal'
import { DynamicLayout } from '@/themes/theme'

/**
 * 年刊：一年一册，/year/2025
 *
 * 路由只负责给「全部已发布文章」和「这一年是哪一年」，分册、排序与统计都留在主题里。
 * 年份表直接问主题的 bookYears——册子的有无与页面上的「年刊 →」链必须同一把尺，
 * 否则导出时会出现「链子在、册不在」的 404（规格见 design-system/journal/MASTER「年刊」节）
 */
const YearbookIndex = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutYearbook' {...props} />
}

const publishedPosts = allPages =>
  (allPages || []).filter(p => p.type === 'Post' && p.status === 'Published')

export async function getStaticPaths({ locale }) {
  const { allPages = [] } = await fetchGlobalAllData({
    from: 'yearbook-paths',
    locale
  })

  return {
    paths: bookYears(publishedPosts(allPages)).map(year => ({
      params: { year }
    })),
    fallback: isExport() ? false : 'blocking'
  }
}

export async function getStaticProps({ params: { year }, locale }) {
  const props = await fetchGlobalAllData({ from: 'yearbook-props', locale })

  props.posts = publishedPosts(props.allPages)
  delete props.allPages
  props.year = year

  return {
    props,
    revalidate: isExport()
      ? undefined
      : siteConfig(
          'NEXT_REVALIDATE_SECOND',
          BLOG.NEXT_REVALIDATE_SECOND,
          props.NOTION_CONFIG
        )
  }
}

export default YearbookIndex
