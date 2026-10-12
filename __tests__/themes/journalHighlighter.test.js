import fs from 'fs'
import path from 'path'

const styleSource = fs.readFileSync(
  path.join(process.cwd(), 'themes/journal/style.js'),
  'utf8'
)

const SELECTOR = '#theme-journal \\.notion-text\\.notion-red_background'
const ruleStart = styleSource.search(
  /#theme-journal \.notion-text\.notion-red_background\s*{/
)
const printMarker = styleSource.indexOf('/* ---------- 8. 打印')

/** 屏幕态那一条（打印段之前） */
const screenRule = () => {
  const open = styleSource.indexOf('{', ruleStart)
  return styleSource.slice(open, styleSource.indexOf('}', open))
}

/** 渐变里的 em 数字，按出现顺序去重（双位置写法会让每个界值出现两次） */
const emStops = () => {
  const m = screenRule().match(/repeating-linear-gradient\(([\s\S]*?);/)
  if (!m) return []
  return [
    ...new Set([...m[1].matchAll(/([\d.]+)em/g)].map(x => parseFloat(x[1])))
  ]
}

describe('journal paragraph highlighter', () => {
  test('maps the paragraph red background to a stroke, not a pink box', () => {
    // 上游给的是整块 rgb(251,228,228)：手账三色之外的第四色，且夜间不降档
    expect(ruleStart).toBeGreaterThan(-1)
    expect(ruleStart).toBeLessThan(printMarker)
    expect(screenRule()).toMatch(/background-color: transparent/)
    // notion.css 给 .notion-text 写了 padding: 3px 2px !important，
    // 默认 padding-box 会让首条带子上移 3px 与文字错开
    expect(screenRule()).toMatch(/background-origin: content-box/)
  })

  test('paints one band per line, not one band per paragraph', () => {
    // .j-highlight 的 background-size: 100% 62% 在单行 span 上成立，
    // 多行段落只会画一条带子落在末行下缘
    expect(screenRule()).toMatch(/repeating-linear-gradient/)
    expect(screenRule()).not.toMatch(/background-size:/)
  })

  test('derives the band geometry from the word-level stroke', () => {
    const stops = emStops()
    expect(stops.length).toBeGreaterThan(2)
    const period = stops[stops.length - 1]
    const bandTop = stops[0]
    const bandBottom = stops[1]
    // 与 .j-highlight 同源的 62% / 78%
    expect(period).toBeCloseTo(1.9, 3)
    expect(bandBottom - bandTop).toBeCloseTo(period * 0.62, 2)
    expect(bandTop).toBeCloseTo(period * 0.78 * (1 - 0.62), 2)
  })

  test('pins the line-height the period is measured against', () => {
    // 周期一旦与行高分家，带子就逐行累积错位；继承自 .j-print 随时会被祖先改掉
    expect(screenRule()).toMatch(/line-height: 1\.9/)
    // styles/notion.css 那句 .dark 的 text-black 压不过主题的 ID 规则，
    // 别人的兜底挡在继承链上等于没有，颜色必须自己写死
    expect(screenRule()).toMatch(/color: var\(--ink\)/)
  })

  test('borrows the word-level ink instead of inventing a fourth colour', () => {
    expect(screenRule()).toMatch(/var\(--yellow\)/)
    expect(screenRule()).not.toMatch(/#[0-9a-fA-F]{3,8}/)
    expect(screenRule()).not.toMatch(/rgba?\(/)
  })

  test('leaves the annotation its own ::before', () => {
    // 红字 + 红底同时出现时，回指箭头和笔划不能抢同一个伪元素
    expect(styleSource).toMatch(
      /#theme-journal \.notion-text\.notion-red::before/
    )
    expect(screenRule()).not.toMatch(/::before|::after/)
  })

  test('shares one paper translation with the word-level stroke', () => {
    const printBlock = styleSource.slice(printMarker)
    const open = printBlock.search(new RegExp(`${SELECTOR}[\\s\\S]*?{`, 'm'))
    expect(open).toBeGreaterThan(-1)
    // linear-gradient 在纸上不上色：降级成蓝色双下划线，块级逐行画正好接住语法
    expect(printBlock.slice(open, printBlock.indexOf('}', open))).toMatch(
      /background: none/
    )
    expect(printBlock).toMatch(
      new RegExp(
        `\\.j-highlight,[\\s\\S]{0,200}${SELECTOR}[\\s\\S]{0,400}text-decoration-style: double`
      )
    )
  })
})
