import fs from 'fs'
import path from 'path'

const styleSource = fs.readFileSync(
  path.join(process.cwd(), 'themes/journal/style.js'),
  'utf8'
)

const fontDir = path.join(process.cwd(), 'public/fonts')

const referencedWoff2 = () =>
  [...styleSource.matchAll(/url\('(\/fonts\/[^']+\.woff2)'\)/g)].map(m => m[1])

describe('journal theme fonts', () => {
  test('declares no external font host', () => {
    expect(styleSource).not.toMatch(
      /fonts\.googleapis\.com|fonts\.gstatic\.com/
    )
    expect(styleSource).not.toMatch(/@import/)
  })

  test('every referenced subset actually ships', () => {
    const refs = referencedWoff2()
    expect(refs.length).toBeGreaterThanOrEqual(7)
    refs.forEach(ref => {
      expect(fs.existsSync(path.join(process.cwd(), 'public', ref))).toBe(true)
    })
  })

  test.each([
    ['Amatic SC', '700'],
    ['Kalam', '400'],
    ['Kalam', '700'],
    ['Cabin', '400'],
    // Cabin 600 看着多余（主题里没有 600 声明），但正文 <strong> 走 700 时
    // 浏览器取同族最近的一档，就是它；删掉会让正文粗体掉进 Noto Sans SC
    ['Cabin', '600'],
    ['JetBrains Mono', '500']
  ])('self-hosts %s at weight %s', (family, weight) => {
    const face = new RegExp(
      `@font-face\\s*{[^}]*font-family: '${family}'[^}]*font-weight: ${weight};`,
      's'
    )
    expect(styleSource).toMatch(face)
  })

  test('keeps the OFL licences next to the subsets', () => {
    const licenses = fs
      .readdirSync(fontDir)
      .filter(f => f.startsWith('OFL-') && f.endsWith('.txt'))
    expect(licenses).toEqual(
      expect.arrayContaining([
        'OFL-AmaticSC.txt',
        'OFL-Kalam.txt',
        'OFL-Cabin.txt',
        'OFL-JetBrainsMono.txt',
        'OFL-LXGWWenKai.txt'
      ])
    )
  })
})
