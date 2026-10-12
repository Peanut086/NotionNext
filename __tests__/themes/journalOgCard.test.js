import fs from 'fs'
import path from 'path'

const read = p => fs.readFileSync(path.join(process.cwd(), p), 'utf8')

const cardSource = read('themes/journal/og-card.js')
const routeSource = read('pages/api/og.js')
const themeSource = read('themes/journal/index.js')
const fontDir = path.join(process.cwd(), 'public/fonts')

const ogFontFiles = () =>
  [...cardSource.matchAll(/file: '([^']+)'/g)].map(m => m[1])

/** 网页端 stateMarks 的键：卡片的状态词表必须与它一致 */
const webStateKeys = () => {
  const start = themeSource.indexOf('const stateMarks =')
  const block = themeSource.slice(start, themeSource.indexOf('/* ---', start))
  return [...block.matchAll(/key: '([a-z]+)'/g)].map(m => m[1])
}

const cardStateKeys = () => {
  const start = cardSource.indexOf("  'zh-CN': {")
  const block = cardSource.slice(start, cardSource.indexOf('}', start))
  return [...block.matchAll(/(\w+): '/g)].map(m => m[1])
}

describe('journal OG card', () => {
  test('ships a font set for the card, and none of it is WOFF2', () => {
    const files = ogFontFiles()
    expect(files.length).toBeGreaterThanOrEqual(4)
    files.forEach(f => {
      // satori 只认 WOFF/TTF；现有网页用的 .woff2 直接报 Unsupported OpenType signature wOF2
      expect(f.endsWith('.woff2')).toBe(false)
      expect(f.endsWith('.woff')).toBe(true)
    })
  })

  test('every card font exists and really is a WOFF container', () => {
    ogFontFiles().forEach(f => {
      const p = path.join(fontDir, f)
      expect(fs.existsSync(p)).toBe(true)
      expect(fs.readFileSync(p).subarray(0, 4).toString('latin1')).toBe('wOFF')
    })
  })

  test('keeps the OFL licences next to the card fonts', () => {
    ;['OFL-NotoSansSC.txt', 'OFL-Cabin.txt', 'OFL-JetBrainsMono.txt'].forEach(
      f => expect(fs.existsSync(path.join(fontDir, f))).toBe(true)
    )
  })

  test('avoids the CSS satori rejects or cannot paint', () => {
    // display: inline-block 会被 satori 直接抛错；filter / mask 不参与渲染
    expect(cardSource).not.toMatch(/display:\s*['"]inline-block/)
    expect(cardSource).not.toMatch(/filter:\s*['"]/)
    expect(cardSource).not.toMatch(/maskImage/)
    expect(cardSource).not.toMatch(/text-decoration:\s*['"]/)
  })

  test('copies the theme tokens instead of re-colouring them', () => {
    // 与 themes/journal/style.js 的 :root 一致；改这里就是改规格
    ;["'#fdfbf7'", "'#ffffff'", "'#2d2d2d'", "'#c81e1e'", "'#2d5da1'"].forEach(
      c => expect(cardSource).toContain(c)
    )
    expect(cardSource).toContain(
      '255px 15px 225px 15px / 15px 225px 15px 255px'
    )
  })

  test('keeps the AA-compliant red ink everywhere', () => {
    // #ff4d4d 在纸上只有 3.16:1；整体抬到 #c81e1e 后不许再有任何地方回到浅档
    const files = [
      'themes/journal/style.js',
      'themes/journal/og-card.js',
      'themes/journal/index.js'
    ]
    files.forEach(f => expect(read(f)).not.toMatch(/ff4d4d/i))
    expect(read('themes/journal/style.js')).toMatch(/--red: #c81e1e;/)
  })

  test('state vocabulary does not drift from the web theme', () => {
    expect(cardStateKeys().sort()).toEqual(webStateKeys().sort())
  })

  test('route renders from query params only, never from Notion', () => {
    expect(routeSource).not.toMatch(/@\/lib\/db/)
    expect(routeSource).not.toMatch(/getNotionData|NotionClient/)
    expect(routeSource).toContain('next/og')
  })

  test('route caches immutably and caps every param', () => {
    expect(routeSource).toMatch(/max-age=31536000, immutable/)
    expect(routeSource).toMatch(/str\(q\.title, \d+\)/)
    expect(routeSource).toMatch(/\.slice\(0, \d+\)/)
  })

  test('og:image is wired from the theme, and only from the theme', () => {
    // B 案接线（MASTER「接线决定」节）：注入点只许在 themes/journal/ 内
    const configSource = read('themes/journal/config.js')
    expect(configSource).toMatch(/JOURNAL_OG_CARD: true/)
    expect(themeSource).toMatch(
      /<Head>\s*\{ogImage && <meta property='og:image' content=\{ogImage\} \/>\s*\}/
    )
    // 共享组件不许因为接线被改动；它的 og:image 保持现状值
    expect(read('components/SEO.js')).toMatch(
      /<meta property='og:image' content=\{image\} \/>/
    )
  })

  test('wiring reuses the same state vocabulary and query contract', () => {
    const start = themeSource.indexOf('const ogImageUrl =')
    expect(start).toBeGreaterThan(-1)
    const block = themeSource.slice(start, themeSource.indexOf('const j ='))
    expect(block).toMatch(/stateMarks\(post\)\.map\(m => m\.key\)/)
    ;['date', 'category', 'state', 'locale'].forEach(k =>
      expect(block).toContain(`q.set('${k}'`)
    )
    // LINK 非绝对 URL 时必须整体退回兜底（返回 null → 不注入），而不是给出相对 og:image
    expect(block).toMatch(/return null\s*\n\s*const q = new URLSearchParams/)
    // 静态导出没有 pages/api：EXPORT 守卫必须在拼 URL 之前
    expect(block).toMatch(/if \(process\.env\.EXPORT === 'true'\) return null/)
    expect(block).toContain('/api/og?')
  })

  test('reads fonts relative to the standalone cwd, not an absolute path', () => {
    expect(routeSource).toContain("path.join(process.cwd(), 'public', 'fonts')")
  })
})
