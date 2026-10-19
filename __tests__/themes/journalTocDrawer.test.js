import fs from 'fs'
import path from 'path'
import { render, fireEvent } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server.node'
import { ArticleToc } from '@/themes/journal'

/**
 * 移动端目录抽屉的护栏。规格见 design-system/journal/MASTER.md
 * 「移动端目录：悬浮圆形按钮 + 抽屉（J1 裁决）」节。
 * 核心不变量：桌面 aside 与移动抽屉复用同一套 .j-tab（TocTabs 单点渲染），
 * 抽屉默认关、点按钮才开、点链接/ESC/关闭钮都关，且打印不印、材质不新增。
 */

jest.mock('@/components/NotionIcon', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('@/components/NotionPage', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('@/components/Mark', () => ({
  __esModule: true,
  default: ({ children }) => children
}))
jest.mock('@/components/LazyImage', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('@/components/SmartLink', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>
}))
jest.mock('@/lib/global', () => ({
  useGlobal: () => ({ locale: {}, isDarkMode: false }),
  getGlobalSnapshot: () => null
}))
jest.mock('notion-utils', () => ({ uuidToId: id => id }))

const read = p => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const themeSource = read('themes/journal/index.js')
const styleSource = read('themes/journal/style.js')

const POST = {
  toc: [
    { id: 'a', text: '第一节', indentLevel: 0 },
    { id: 'b', text: '第二节', indentLevel: 1 },
    { id: 'c', text: '第三节', indentLevel: 0 }
  ]
}

// jsdom 没有 IntersectionObserver；挂载后的 active 高亮由它驱动，这里只保证不崩
beforeEach(() => {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

const slice = (src, from, to) => {
  const start = src.indexOf(from)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = src.indexOf(to, start)
  expect(end).toBeGreaterThanOrEqual(0)
  return src.slice(start, end)
}

describe('journal 移动端目录抽屉', () => {
  test('SSR 首帧：桌面索引贴与移动按钮在场，抽屉不渲染', () => {
    const html = renderToStaticMarkup(<ArticleToc post={POST} />)
    expect(html).toContain('j-tabs')
    expect(html).toContain('j-toc-fab')
    // 抽屉是 open 条件渲染，未点开不该进 HTML
    expect(html).not.toContain('j-toc-drawer')
    expect(html).not.toMatch(/aria-expanded="true"/)
    // 按钮有可读标签、折叠态
    expect(html).toMatch(/aria-expanded="false"[^>]*aria-label="这一页的目录"/)
  })

  test('没有目录就整块不出现，也不留空按钮', () => {
    const html = renderToStaticMarkup(<ArticleToc post={{ toc: [] }} />)
    expect(html).toBe('')
    expect(render(<ArticleToc post={{ toc: [] }} />).container.innerHTML).toBe(
      ''
    )
  })

  test('点按钮开抽屉，里面是同一套 .j-tab，不写第二份贴面', () => {
    const { getByRole, queryByRole } = render(<ArticleToc post={POST} />)
    expect(queryByRole('dialog')).toBeNull()
    fireEvent.click(getByRole('button', { name: '这一页的目录' }))
    const dialog = getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    // 抽屉里的贴面数量与 toc 一致，且复用 .j-tab 类名
    expect(dialog.querySelectorAll('.j-tab').length).toBe(3)
    expect(dialog.querySelectorAll('.j-tabs').length).toBe(1)
  })

  test('点抽屉内链接 / ESC / 关闭钮 / 点抽屉外都收起，不抢滚动', () => {
    const { getByRole, queryByRole } = render(<ArticleToc post={POST} />)
    const fab = getByRole('button', { name: '这一页的目录' })

    fireEvent.click(fab)
    fireEvent.click(getByRole('dialog').querySelector('.j-tab'))
    expect(queryByRole('dialog')).toBeNull()

    fireEvent.click(fab)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(queryByRole('dialog')).toBeNull()

    fireEvent.click(fab)
    fireEvent.click(getByRole('button', { name: '收起目录' }))
    expect(queryByRole('dialog')).toBeNull()

    // 点抽屉外收起；但抽屉内部的 mousedown 不算「外面」
    fireEvent.click(fab)
    fireEvent.mouseDown(getByRole('dialog'))
    expect(queryByRole('dialog')).not.toBeNull()
    fireEvent.mouseDown(document.body)
    expect(queryByRole('dialog')).toBeNull()
  })

  test('.j-tab 只在 TocTabs 里渲染一次，桌面与抽屉共用一份', () => {
    // 贴面模板串若出现第二处，就是写了第二套规则——违背「复用同一套贴面」
    expect((themeSource.match(/className=\{`j-tab /g) || []).length).toBe(1)
    expect(themeSource).toMatch(/function TocTabs\(/)
  })

  test('按钮与抽屉只用既有 token，硬阴影走 --shadow', () => {
    const block = slice(styleSource, '3c-2. 移动端目录', '3d. 一天一摊')
    // 阴影是 token，不是裸 5px（移动端 --shadow 减到 4px，裸写不跟随）
    expect(block).toMatch(/\.j-toc-fab\s*\{[\s\S]*box-shadow: var\(--shadow\)/)
    expect(block).not.toMatch(/\.j-toc-fab\s*\{[\s\S]*box-shadow: 5px/)
    // 抽屉靠 .j-note 便条，自己不重画 background/border/border-radius
    const drawer = slice(block, '.j-toc-drawer {', '.j-toc-close {')
    expect(drawer).not.toMatch(/background:/)
    expect(drawer).not.toMatch(/border-radius:/)
    // 不新增颜色 token
    expect(block).not.toMatch(/--(red|blue|yellow|ink|slip|paper)\s*:/)
  })

  test('打印不印按钮与抽屉', () => {
    const print = slice(styleSource, '@media print {', '年刊：屏幕上是连着滚')
    expect(print).toMatch(/\.j-toc-fab,/)
    expect(print).toMatch(/\.j-toc-drawer,/)
  })

  test('两个文案键配在 config.js，不写死在调用处', () => {
    const config = read('themes/journal/config.js')
    expect(config).toMatch(/JOURNAL_TOC_LABEL: '目'/)
    expect(config).toMatch(/JOURNAL_TOC_CLOSE: '收起目录'/)
  })
})
