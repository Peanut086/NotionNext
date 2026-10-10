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
    ;["'#fdfbf7'", "'#ffffff'", "'#2d2d2d'", "'#ff4d4d'", "'#2d5da1'"].forEach(
      c => expect(cardSource).toContain(c)
    )
    expect(cardSource).toContain(
      '255px 15px 225px 15px / 15px 225px 15px 255px'
    )
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

  test('reads fonts relative to the standalone cwd, not an absolute path', () => {
    expect(routeSource).toContain("path.join(process.cwd(), 'public', 'fonts')")
  })
})
