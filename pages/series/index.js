import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { isExport } from '@/lib/utils/buildMode'
import { DynamicLayout } from '@/themes/theme'

/**
 * 册子目录：一辑一行，册页家族的回程（规格见 design-system/journal/MASTER「册子目录 /series」节）
 *
 * 与 `[name].js` 同一取法——路由只给全部已发布文章，「哪几辑成辑」仍然只问主题的 seriesBooks
 */
const SeriesIndexPage = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return (
    <DynamicLayout theme={theme} layoutName='LayoutSeriesIndex' {...props} />
  )
}

export async function getStaticProps({ locale }) {
  const props = await fetchGlobalAllData({ from: 'series-index-page', locale })

  props.posts = (props.allPages || []).filter(
    page => page.type === 'Post' && page.status === 'Published'
  )
  delete props.allPages

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

export default SeriesIndexPage
