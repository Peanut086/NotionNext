import fs from 'node:fs/promises'
import path from 'node:path'
import BLOG from '@/blog.config'
import { OgCard, OG_FONTS } from '@/themes/journal/og-card'
import { ImageResponse } from 'next/og'

/**
 * 分享卡（OG 卡）渲染：1200×630 PNG
 *
 * 规格在 design-system/journal/MASTER.md「同语言 OG 卡」节。
 * 刻意不在运行期取 Notion —— 标题等全部由调用方塞进 query，
 * 免得爬虫的抓取路径挂在 Notion API 上（限流一次，全站分享卡就一起 500）。
 * 参数在 URL 上，所以标题一改 URL 就变，可以放心 immutable 长缓存。
 */

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts')
const STATES = ['locked', 'pinned', 'featured', 'revised', 'receipt', 'photo']

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
    const fonts = await loadFonts()

    const card = (
      <OgCard
        title={str(q.title, 120)}
        date={str(q.date, 10)}
        category={str(q.category, 24)}
        site={str(q.site, 40) || siteHost()}
        locale={locale}
        states={str(q.state, 60)
          .split(',')
          .map(s => s.trim())
          .filter(s => STATES.includes(s))
          .slice(0, 3)}
      />
    )

    const body = await new ImageResponse(card, {
      width: 1200,
      height: 630,
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
