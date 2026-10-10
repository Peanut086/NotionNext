import fs from 'fs'
import path from 'path'

const styleSource = fs.readFileSync(
  path.join(process.cwd(), 'themes/journal/style.js'),
  'utf8'
)

const marker = styleSource.indexOf('/* ---------- 8. 打印')

describe('journal print styles', () => {
  test('the print block exists and is the last section', () => {
    expect(marker).toBeGreaterThan(-1)
  })

  const printBlock = () => styleSource.slice(marker)

  test('sets @page margin but never a size', () => {
    // 写死 A4 会让 Letter 纸和用户自定义的「另存为 PDF」尺寸一起失效
    expect(printBlock()).toMatch(/@page\s*{[^}]*margin:/)
    expect(printBlock()).not.toMatch(/@page\s*{[^}]*size:/)
  })

  test('never asks the browser to print backgrounds', () => {
    // print-color-adjust 是总开关，一开纸纹和阴影就一起回来了
    expect(printBlock()).not.toMatch(/print-color-adjust\s*:/)
  })

  test('clears the dark paint on the code container, not just the pre', () => {
    // public/css/prism-mac-style.css 把深色涂在 .code-toolbar 上；
    // 只给 pre.notion-code 写 transparent 会让父层的黑透出来
    expect(printBlock()).toMatch(
      /#theme-journal \.code-toolbar[^{]*{[^}]*background: none !important/
    )
    expect(printBlock()).toMatch(
      /#theme-journal \.code-toolbar[^{]*{[^}]*overflow: visible/
    )
  })

  test('hides the mac traffic lights and the copy toolbar', () => {
    expect(printBlock()).toMatch(/\.pre-mac,[\s\S]{0,200}display: none/)
    expect(printBlock()).toMatch(
      /\.code-toolbar > \.toolbar,[\s\S]{0,200}display: none/
    )
  })

  test('force-expands collapsed code blocks', () => {
    // .collapse-panel 在屏幕上是 max-height:0，打印会把整段代码裁没
    expect(printBlock()).toMatch(
      /\.collapse-panel\s*{[^}]*max-height: none !important/
    )
  })

  test('beats the screen token rules when flattening syntax colors', () => {
    // 屏幕态写的是 #theme-journal .notion-code .token.keyword（1-3-0 + !important），
    // 单 .token 兜底只有 1-2-0 压不住，必须借 #article-wrapper 抬特异度
    expect(printBlock()).toMatch(
      /#theme-journal #article-wrapper \.notion-code \.token[,\s][^{]*{[^}]*color: var\(--ink\) !important/
    )
  })

  test('zeroes transforms on the slips so they can break across pages', () => {
    expect(printBlock()).toMatch(
      /\.j-slip,[\s\S]{0,200}transform: none[\s\S]{0,200}break-inside: avoid/
    )
  })

  test('leaves every font size alone except the stamped link annotation', () => {
    // 17px 落在 A4 上就是 12.75pt；而重设 #theme-journal .j-hand 会压掉
    // 组件上的 Tailwind 绝对值（text-[28px]），等于全站字号失控
    const sizes = [...printBlock().matchAll(/font-size: ([^;]+);/g)].map(
      m => m[1]
    )
    expect(sizes.length).toBeGreaterThan(0)
    expect(sizes.every(s => s === '9pt')).toBe(true)
  })
})
