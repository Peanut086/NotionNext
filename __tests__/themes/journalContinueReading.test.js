import fs from 'fs'
import path from 'path'
import { render, fireEvent } from '@testing-library/react'
import { LayoutIndex, LayoutSlug } from '@/themes/journal'

/**
 * J1 第三件「继续阅读入口」的护栏。规格见
 * design-system/journal/MASTER.md「继续阅读入口（J1 裁决，2026-10-19）」节。
 * 核心不变量：只有文章页抬头那枚铅笔痕是入口；点了才跳、跳的位置是记录器的反函数；
 * 读完与没读过都不许出入口；挂载那一帧绝不自己滚（不自动续读）。
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
jest.mock('@/components/SmartLink', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>
}))
jest.mock('@/components/LazyImage', () => ({
  __esModule: true,
  default: () => null
}))
jest.mock('@/lib/global', () => ({
  useGlobal: () => ({ locale: {}, isDarkMode: false }),
  getGlobalSnapshot: () => null
}))
jest.mock('notion-utils', () => ({ uuidToId: id => id }))
jest.mock('next/router', () => ({
  useRouter: () => ({
    asPath: '/article/x',
    locale: 'zh-CN',
    query: {},
    events: { on: () => {}, off: () => {} }
  })
}))

// 没点名的键一律取调用处的 fallback；LINK 给绝对地址，否则 og 守卫会把 Head 关掉
jest.mock('@/lib/config', () => ({
  siteConfig: (key, fallback) => {
    const table = { LINK: 'https://paper.example', ...(globalThis.journalSwitches || {}) }
    return key in table ? table[key] : fallback
  }
}))

// 只替掉「读」这一步：判据、百分比换算、渲染全走真实实现
jest.mock('@/themes/journal/reading', () => {
  const actual = jest.requireActual('@/themes/journal/reading')
  return {
    __esModule: true,
    ...actual,
    useReadMarks: () => globalThis.journalReadMarks || null
  }
})

const read = p => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const themeSource = read('themes/journal/index.js')
const styleSource = read('themes/journal/style.js')
const readingSource = read('themes/journal/reading.js')

// 一张 3000px 高的纸 / 1000px 高的视口：可滚程 2000，62% 该落在 1240
const PAPER = 3000
const VIEW = 1000
const scrollTo = jest.fn()

const mount = (pct, reduce = false, switches) => {
  globalThis.journalSwitches = switches
  globalThis.journalReadMarks = pct ? { x: { p: pct, at: 1 } } : {}
  scrollTo.mockClear()
  window.scrollTo = scrollTo
  window.matchMedia = jest
    .fn()
    .mockImplementation(q => ({ matches: reduce && /reduce/.test(q) }))
  Object.defineProperty(window, 'innerHeight', {
    value: VIEW,
    configurable: true
  })
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: PAPER,
    configurable: true
  })
  return render(<LayoutSlug post={{ id: 'x', slug: 'x', title: '一篇长文' }} />)
}

const slice = (src, from, to) => {
  const start = src.indexOf(from)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = src.indexOf(to, start)
  expect(end).toBeGreaterThanOrEqual(0)
  return src.slice(start, end)
}

describe('journal 继续阅读入口', () => {
  test('抬头那枚是按钮，写着「上次读到 N% →」', () => {
    const { getByRole } = mount(62)
    const btn = getByRole('button', { name: /上次读到 62%/ })
    expect(btn).toHaveClass('j-pencil')
    expect(btn).toHaveClass('j-resume')
    expect(btn).toHaveAttribute('type', 'button')
  })

  test('点了才跳，且跳的位置正是记录器记下的那一处', () => {
    const { getByRole } = mount(62)
    // 挂载那一帧不许自己滚：这是「不自动续读」那条禁令的正面验收
    expect(scrollTo).not.toHaveBeenCalled()
    fireEvent.click(getByRole('button', { name: /上次读到 62%/ }))
    expect(scrollTo).toHaveBeenCalledWith({
      top: 0.62 * (PAPER - VIEW),
      behavior: 'smooth'
    })
  })

  test('反函数与 reading.js 的记录口径同源', () => {
    // 记录器：pct = top / height * 100；入口：top = pct / 100 * height
    // 两侧的 height 必须是同一个定义，否则「跳回上次的位置」会落在别处
    expect(readingSource).toMatch(
      /documentElement\.scrollHeight - window\.innerHeight \|\| 1/
    )
    const resume = slice(themeSource, 'const resumeTo =', 'const ReadMark =')
    expect(resume).toMatch(/documentElement\.scrollHeight - window\.innerHeight/)
    expect(resume).toMatch(/top: \(pct \/ 100\) \* height/)
    // 一页纸没有可滚程时不跳——否则算出个负数把页面顶到顶上
    expect(resume).toMatch(/if \(height <= 0\) return/)
    // 跳转只读进度、不写进度，也不反过来碰记录器：两套滚动口径迟早分家
    expect(readingSource).not.toMatch(/window.scrollTo|scrollIntoView/)
    expect(readingSource).not.toMatch(/behavior: *'smooth'/)
  })

  test('reduce 偏好下改用瞬移，不画平滑动画', () => {
    const { getByRole } = mount(62, true)
    fireEvent.click(getByRole('button', { name: /上次读到 62%/ }))
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }))
  })

  test('读完只留那枚勾，不再出入口', () => {
    // 97 是分界（判据在 reading.js 一处），98 必须走「读完」
    const { queryByRole, container } = mount(98)
    expect(queryByRole('button', { name: /上次读到/ })).toBeNull()
    expect(container.innerHTML).toMatch(/读完/)
    expect(container.innerHTML).not.toMatch(/j-resume/)
    // 关掉「读完打勾」时退回百分比陈述，此时入口仍然成立
    const off = mount(98, false, { JOURNAL_READ_DONE_CHECK: false })
    expect(off.getByRole('button', { name: /上次读到 98%/ })).toBeInTheDocument()
  })

  test('没有历史进度就没有假入口', () => {
    // J1 验收原话：「无历史进度时不出现假入口」
    const { container, queryByRole } = mount(0)
    expect(queryByRole('button', { name: /上次读到/ })).toBeNull()
    expect(container.innerHTML).not.toMatch(/j-pencil/)
    expect(container.innerHTML).not.toMatch(/读到/)
  })

  test('只有文章页是入口；列表纸条仍是纯陈述', () => {
    globalThis.journalReadMarks = { x: { p: 62, at: 1 } }
    const { container } = render(<LayoutIndex posts={[{ id: 'x', slug: 'x', title: '一篇长文' }]} />)
    // PostSlip 整块已经是 <a>，再塞行动点是非法 HTML，所以列表保持陈述
    expect(container.innerHTML).toMatch(/读到 62%/)
    expect(container.innerHTML).not.toMatch(/j-resume/)
    expect(container.querySelector('button.j-resume')).toBeNull()
    // 「上次」只属于文章页：列表上每行都是「上次」，等于没有
    expect(container.innerHTML).not.toMatch(/上次/)
  })

  test('入口不抢行高：44px 靠外扩点击区，不靠把行顶高', () => {
    const rule = slice(styleSource, '#theme-journal .j-resume {', '#theme-journal .j-resume:hover')
    expect(rule).toMatch(/padding: 10px 8px/)
    expect(rule).toMatch(/margin: -10px -8px/)
    expect(rule).toMatch(/cursor: pointer/)
    // 静止时仍读作铅笔痕——「蓝=可点」那一档不许被读者的痕借用
    expect(rule).toMatch(/color: var\(--ink-soft\)/)
    expect(rule).not.toMatch(/var\(--(red|blue|yellow)\)/)
    // 不新增颜色 token
    expect(styleSource).not.toMatch(/--(pencil|resume)\s*:/)
  })

  test('hover 只加深墨色一档，不改布局尺寸', () => {
    const hover = slice(styleSource, '#theme-journal .j-resume:hover', '/* ---------- 3k')
    expect(hover).toMatch(/color: var\(--ink\)/)
    expect(hover).not.toMatch(/translate|scale|box-shadow|padding|margin/)
  })

  test('打印继承 .j-pencil 那条隐藏规则，不写第二份', () => {
    const print = styleSource.slice(styleSource.indexOf('@media print'))
    expect(print).toMatch(/#theme-journal \.j-pencil,/)
    expect(print).not.toMatch(/\.j-resume/)
  })
})
