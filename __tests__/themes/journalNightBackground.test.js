import fs from 'fs'
import path from 'path'

const styleSource = fs.readFileSync(
  path.join(process.cwd(), 'themes/journal/style.js'),
  'utf8'
)

/** 3h+ 节：从第一条规则起（注释头里有 `{...}` 字面量，不能从标题切）。
 * prettier 会折行选择器，所以按「行」定位而不是整串匹配 */
const lines = styleSource.split('\n')
const headerLine = lines.findIndex(l => l.includes('3h+. '))
const sectionStartRaw = lines.findIndex(
  (l, i) => i > headerLine && l.trim().endsWith('*/')
)
// section 从注释收尾行的下一行（第一条规则）起：绝对偏移 = 前缀长度 + 行尾换行
const offsetToLineStart = idx => lines.slice(0, idx + 1).join('\n').length + 2 // +\r\n（LF 文件多算 1 字符无害）
const sectionStart = offsetToLineStart(sectionStartRaw)
const sectionEnd = styleSource.indexOf('/* 便利贴黄 */')
const section = () => {
  expect(sectionStartRaw).toBeGreaterThan(-1)
  return styleSource.slice(sectionStart, sectionEnd)
}

/** 便签翻字那条规则的选择器列表（到第一个 { 之前） */
const inkSelectorList = () => {
  const s = section()
  const open = s.indexOf('{')
  return s.slice(0, open)
}
const inkRule = () => {
  const s = section()
  const open = s.indexOf('{')
  return s.slice(open, s.indexOf('}', open))
}
const linkRule = () => {
  const s = section()
  const firstClose = s.indexOf('}')
  return s.slice(firstClose, s.indexOf('}', firstClose + 1))
}

describe('journal night readability for remaining background colours', () => {
  test('the section exists and sits in the screen part, before print', () => {
    expect(headerLine).toBeGreaterThan(-1)
    expect(sectionStartRaw).toBeGreaterThan(headerLine)
    expect(sectionStart).toBeLessThan(
      styleSource.indexOf('/* ---------- 8. 打印')
    )
  })

  test('flips the ink to the print-state black instead of recolouring the paper', () => {
    // 便签不褪色：改底色是越权改作者意图，翻字才是收债口径
    expect(inkRule()).toMatch(/color: #2d2d2d/)
    expect(inkRule()).not.toMatch(/background/)
  })

  test('every carrier rule is scoped to j-night', () => {
    const selectors = section()
    const rules = selectors.split('}').filter(r => r.includes('{'))
    expect(rules.length).toBeGreaterThanOrEqual(2)
    rules.forEach(r => {
      expect(r.trim()).toMatch(/^#theme-journal\.j-night/)
    })
  })

  test('carries only paragraphs and headings', () => {
    const sel = inkSelectorList()
    // prettier 会把长选择器折行，断言容忍空白
    expect(sel).toMatch(/\.notion-text\s*\[class\*='_background'\]/)
    expect(sel).toMatch(/h1\s*\[class\*='_background'\]/)
    expect(sel).toMatch(/h2\s*\[class\*='_background'\]/)
    expect(sel).toMatch(/h3\s*\[class\*='_background'\]/)
    // quote/toggle 的底色被主题 ID 规则顶掉、callout 走便利贴黄——
    // 给它们翻字会得到「暗纸配暗字」（fixture 实测）
    expect(sel).not.toMatch(/notion-quote/)
    expect(sel).not.toMatch(/notion-toggle/)
    expect(sel).not.toMatch(/notion-callout/)
  })

  test('excludes the translucent _co variants and the paragraph highlighter', () => {
    const sel = inkSelectorList()
    const coCount = (sel.match(/\[class\*='_background_co'\]/g) || []).length
    // 每条翻字载体各带一个 :not(_co)：4 条载体 = 4 次
    expect(coCount).toBe(4)
    // 段落红底是荧光笔语法（两态已有方案）；红底标题不排除、按便签翻是刻意的。
    // 排除只串两个简单 :not()——:not(.a.b) 复合参数会让老 WebKit 整条丢弃
    expect(sel).toMatch(
      /\.notion-text\s*\[class\*='_background'\]\s*:not\(\[class\*='_background_co'\]\)\s*:not\(\s*\.notion-red_background\s*\)/
    )
  })

  test('recolors links and inline code inside the stickies to the print blue', () => {
    // 行内代码上游是 .notion-inline-code{color:#eb5757}：
    // 红在便签上还和「红＝作者的手」撞语义
    expect(linkRule()).toMatch(/color: #1e3f73/)
    expect(linkRule()).toMatch(/:is\(a, \.notion-inline-code\)/)
  })

  test('does not invent new tokens for the sticky ink', () => {
    // #2d2d2d / #1e3f73 与打印节同源；新增 --j-* token 会让夜间红阶债再扩面
    const s = section()
    expect(s).not.toMatch(/--j-[a-z-]+:/)
    expect(s).not.toMatch(/var\(--red\)/)
  })
})
