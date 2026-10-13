import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { isExport } from '@/lib/utils/buildMode'
import { seriesBooks } from '@/themes/journal'
import { DynamicLayout } from '@/themes/theme'

/**
 * 连载册：一条线印成一辑，/series/手账入门
 *
 * 路由只负责给「全部已发布文章」和「这一辑叫什么」，成辑判定、话数与排序都留在主题里。
 * 标签页给不出这些：它把 posts 切到一页 12 条，又删掉了 allPages，
 * 所以话数只能数本页、序也只能在本页内排（规格见 design-system/journal/MASTER「连载册」节）
 */
const SeriesIndex = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutSeries' {...props} />
}

const publishedPosts = allPages =>
  (allPages || []).filter(p => p.type === 'Post' && p.status === 'Published')

/** 册表与归档右栏那枚「连载册 →」共用主题的 seriesBooks：
 *  两处不同尺，导出态就会出现「链子在、册不在」的 404 */
export async function getStaticPaths({ locale }) {
  const { allPages = [] } = await fetchGlobalAllData({
    from: 'series-paths',
    locale
  })

  return {
    paths: seriesBooks(publishedPosts(allPages)).map(book => ({
      params: { name: book.name }
    })),
    fallback: isExport() ? false : 'blocking'
  }
}

export async function getStaticProps({ params: { name }, locale }) {
  const props = await fetchGlobalAllData({ from: 'series-props', locale })

  props.posts = publishedPosts(props.allPages)
  delete props.allPages
  // Next 已把 params.name 解好码，与剥了前缀的连载名直接对得上
  props.series = name

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

export default SeriesIndex
