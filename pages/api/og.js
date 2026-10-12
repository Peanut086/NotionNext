import fs from 'node:fs/promises'
import path from 'node:path'
import BLOG from '@/blog.config'
import CONFIG from '@/themes/journal/config'
import {
  OG_SIZES,
  OgCard,
  OG_FONTS,
  clampQuote
} from '@/themes/journal/og-card'
import { ImageResponse } from 'next/og'

/**
 * 分享卡（OG 卡）渲染：横卡 1200×630 / 故事卡 1080×1440，PNG
 *
 * 规格在 design-system/journal/MASTER.md「同语言 OG 卡」「分享卡三型」两节。
 * 刻意不在运行期取 Notion —— 标题与引文全部由调用方塞进 query，
 * 免得爬虫的抓取路径挂在 Notion API 上（限流一次，全站分享卡就一起 500）。
 * 参数在 URL 上，所以标题一改 URL 就变，可以放心 immutable 长缓存。
 */

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts')
const STATES = ['locked', 'pinned', 'featured', 'revised', 'receipt', 'photo']
// 尺寸只认这张表：图片像素与组件版式都从 OG_SIZES 取，写两处就会漂
const SIZES = Object.keys(OG_SIZES)
// 引文上限由卡片版式决定，不由调用方决定；上限还是主题的配置，两处共用一个数
const QUOTE_MAX = Number(CONFIG.JOURNAL_CARD_QUOTE_MAX) || 160

let fontsPromise
const loadFonts = () => {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      OG_FONTS.map(async font => ({
        name: font.name,
        data: await fs.readFile(path.join(FONT_DIR, font.file)),
        weight: font.weight,
        style: 'normal'
      }))
    )
  }
  return fontsPromise
}

const str = (val, max) =>
  String(Array.isArray(val) ? val[0] : val || '')
    .trim()
    .slice(0, max)

const siteHost = () => {
  try {
    return new URL(BLOG.LINK).host
  } catch {
    return ''
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' })
  }

  try {
    const q = req.query || {}
    const locale = str(q.locale, 12) === 'en-US' ? 'en-US' : 'zh-CN'
    const size = SIZES.includes(str(q.size, 12)) ? str(q.size, 12) : 'wide'
    const dim = OG_SIZES[size]
    const quote = clampQuote(str(q.quote, 1200), QUOTE_MAX)
    const fonts = await loadFonts()

    const card = (
      <OgCard
        title={str(q.title, 120)}
        date={str(q.date, 10)}
        category={str(q.category, 24)}
        site={str(q.site, 40) || siteHost()}
        locale={locale}
        size={size}
        quote={quote}
        states={str(q.state, 60)
          .split(',')
          .map(s => s.trim())
          .filter(s => STATES.includes(s))
          .slice(0, 3)}
      />
    )

    const body = await new ImageResponse(card, {
      width: dim.width,
      height: dim.height,
      fonts
    }).arrayBuffer()

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return res.send(Buffer.from(body))
  } catch (err) {
    console.error('[api/og] 渲染失败', err)
    return res.status(500).json({ ok: false, message: 'OG render failed' })
  }
}
