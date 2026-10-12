import fs from 'fs'
import path from 'path'

const themeSource = fs.readFileSync(
  path.join(process.cwd(), 'themes/journal/index.js'),
  'utf8'
)
const styleSource = fs.readFileSync(
  path.join(process.cwd(), 'themes/journal/style.js'),
  'utf8'
)

const fnBody = name => {
  const start = themeSource.indexOf(`function ${name}(`)
  expect(start).toBeGreaterThan(-1)
  const next = themeSource.indexOf('\nfunction ', start + 1)
  return themeSource.slice(start, next === -1 ? undefined : next)
}

const archive = () => fnBody('LayoutArchive')

const mobileMarker = styleSource.indexOf('/* ---------- 7. 移动端')
const mobileBlock = () => {
  const start = styleSource
    .slice(mobileMarker)
    .indexOf('@media (max-width: 767px)')
  const s = styleSource.slice(mobileMarker + start)
  return s.slice(0, s.indexOf('\n      }'))
}

describe('journal archive row state marks', () => {
  test('carries only the three states the row cannot show by itself', () => {
    // 置顶 / 精选 / plog 的数据源是标签，而行尾本来就画了 post.tags[0] 那枚 pill
    const keys = themeSource.match(/const ARCHIVE_MARK_KEYS = \[([^\]]*)\]/)
    expect(keys).not.toBeNull()
    const list = keys[1]
      .split(',')
      .map(x => x.trim().replace(/^'|'$/g, ''))
      .filter(Boolean)
    expect(list).toEqual(['locked', 'revised', 'photo'])
    expect(list).not.toContain('pinned')
    expect(list).not.toContain('featured')
    expect(list).not.toContain('receipt')
  })

  test('is a filter over the shared judge, never a second implementation', () => {
    // 判定只有 stateMarks 一处：优先级与 3 个封顶由它管，子集只负责过滤
    expect(archive()).toMatch(
      /stateMarks\(post\)[\s\S]{0,120}ARCHIVE_MARK_KEYS/
    )
    for (const key of ['TOP_TAG', 'JOURNAL_FEATURED_TAG', 'JOURNAL_PLOG_TAG']) {
      expect(archive()).not.toContain(key)
    }
  })

  test('reuses the PostSlip stamp label instead of a new material', () => {
    // 角标（图钉 / 折叠角 / 拍立得 / 补贴胶带）撑破单行，这一行只允许文字
    expect(archive()).toMatch(/className='j-mark j-stamp/)
    expect(archive()).not.toMatch(
      /PinDoodle|FoldDoodle|PhotoTab|j-teeth|j-tape-bit/
    )
  })

  test('groups marks with the pill so one z-index covers the row', () => {
    expect(archive()).toMatch(
      /className='relative z-\[2\] flex flex-wrap items-center/
    )
  })

  test('narrow screens keep the first mark only, on archive rows only', () => {
    // 实测成本形态是「抢标题宽度」：标记 + pill 一组 115–154px，标题 169.9 → 143
    expect(mobileBlock()).toMatch(
      /#theme-journal \.j-arch-row \.j-mark \+ \.j-mark\s*{[\s\S]{0,40}display: none/
    )
    // 首页纸条也住在 .j-days 里，那里有宽度，不该跟着减
    expect(styleSource).not.toMatch(/\.j-days \.j-mark \+ \.j-mark/)
  })

  test('adds no colour and no token for the archive marks', () => {
    // 「只用已有材质」：j-mark 的 --ink-soft 已经够淡，不再为窄行造一档
    expect(styleSource).not.toMatch(/\.j-arch-row[^{]*{[^}]*--/)
    expect(styleSource).not.toMatch(/\.j-arch-row[^{]*{[^}]*background/)
  })
})
