/**
 * journal 主题的分享卡（OG 卡）
 *
 * 规格见 design-system/journal/MASTER.md「同语言 OG 卡」节。
 * 这里不是浏览器里的 JSX：它由 next/og 的 satori 渲染成 PNG，
 * 所以只能用 satori 认得的 CSS 子集 —— 不支持 inline-block，
 * 不支持 SVG filter（纸纹的 feTurbulence 因此换成 repeating-linear-gradient 稿纸格）。
 * 还有条坑人的规则：任何**包着元素子节点**的 div 都要显式写 display，
 * 报错文案说"多个子节点"，实际一个 <svg> 子节点就会抛。
 * 所有色值/圆角/阴影都直接抄 themes/journal/style.js 的 token，不在这里重新调色。
 */

const PAPER = '#fdfbf7'
const SLIP = '#ffffff'
const INK = '#2d2d2d'
const SOFT = '#5c5c5c'
const RED = '#c81e1e'
const BLUE = '#2d5da1'
const YELLOW = '#fff9c4'
const TAPE = 'rgba(232, 223, 207, 0.7)'
const GRID = 'rgba(45, 93, 161, 0.14)'

const WOBBLE = '255px 15px 225px 15px / 15px 225px 15px 255px'
const PILL_WOBBLE = '19px 6px 16px 8px / 8px 16px 6px 19px'
const TAPE_CLIP =
  'polygon(0 10%, 12% 0, 26% 11%, 41% 1%, 55% 10%, 70% 0, 85% 11%, 100% 2%, 100% 92%, 85% 100%, 70% 89%, 55% 100%, 41% 90%, 26% 100%, 12% 89%, 0 96%)'
const BIT_CLIP =
  'polygon(0 12%, 14% 0, 31% 11%, 49% 1%, 66% 10%, 83% 0, 100% 8%, 100% 92%, 83% 100%, 66% 90%, 49% 100%, 31% 89%, 14% 100%, 0 90%)'

const PRINT = "'Cabin', 'Noto Sans SC', sans-serif"
const STAMP = "'JetBrains Mono', 'Noto Sans SC', monospace"

/**
 * 卡片尺寸的唯一来源：api 与组件都读它。
 * 两处各写一遍数字迟早会漂，一漂图片就被裁
 */
export const OG_SIZES = {
  wide: { width: 1200, height: 630 },
  story: { width: 1080, height: 1440 }
}

/** 两版式只差字号与留白，材质同一套 */
const LAYOUT = {
  wide: {
    pad: '56px 72px 48px',
    rule: 980,
    titleSize: 62,
    titleMax: 238,
    titleBudget: 34,
    quoteSize: 40,
    quoteMax: 250,
    quoteBudget: 76,
    sourceSize: 26
  },
  story: {
    pad: '72px 76px 64px',
    rule: 840,
    titleSize: 88,
    titleMax: 560,
    titleBudget: 44,
    quoteSize: 56,
    quoteMax: 640,
    quoteBudget: 96,
    sourceSize: 34
  }
}

/**
 * 剪报的引文：换行与控制字符压成空格，超上限截断加省略号。
 * 按字符数计而不是按 fitTitle 的权重——引文是被裁的对象，长度要可预期
 */
export const clampQuote = (text, max = 160) => {
  const flat = String(text || '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!flat) return ''
  const n = Number(max) > 0 ? Number(max) : 160
  return flat.length > n ? `${flat.slice(0, n).trimEnd()}…` : flat
}

const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** 与网页端 stateMarks 同一套键与顺序；卡片只是把它画出来 */
const STATE_LABELS = {
  'zh-CN': {
    locked: '加密',
    pinned: '置顶',
    featured: '精选',
    revised: '修订',
    receipt: 'plog',
    photo: '有图'
  },
  'en-US': {
    locked: 'Locked',
    pinned: 'Pinned',
    featured: 'Featured',
    revised: 'Revised',
    receipt: 'plog',
    photo: 'Photo'
  }
}

export const OG_FONTS = [
  {
    file: 'NotoSansSC-SemiBold.subset-OG.woff',
    name: 'Noto Sans SC',
    weight: 600
  },
  { file: 'Cabin-Regular.subset-OG.woff', name: 'Cabin', weight: 400 },
  { file: 'Cabin-SemiBold.subset-OG.woff', name: 'Cabin', weight: 600 },
  {
    file: 'JetBrainsMono-Medium.subset-OG.woff',
    name: 'JetBrains Mono',
    weight: 500
  }
]

/**
 * satori 没有文字测量 API，只能按字符权重估长度。
 * 中日韩按 1、拉丁与数字按 0.55、空格标点按 0.4 计，超出预算就截成省略号。
 */
const fitTitle = (text, budget) => {
  let used = 0
  let out = ''
  for (const ch of text) {
    const w = /[\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uff00-\uffef]/.test(ch)
      ? 1
      : /\s/.test(ch)
        ? 0.4
        : /[0-9a-zA-Z]/.test(ch)
          ? 0.55
          : 0.7
    if (used + w > budget) return out + '…'
    used += w
    out += ch
  }
  return out
}

const Tape = ({ style }) => (
  <div
    style={{
      position: 'absolute',
      width: 150,
      height: 34,
      background: TAPE,
      clipPath: TAPE_CLIP,
      transform: 'rotate(-2deg)',
      ...style
    }}
  />
)

const Pin = () => (
  <div
    style={{
      position: 'absolute',
      top: -30,
      left: 28,
      transform: 'rotate(-6deg)',
      display: 'flex'
    }}
  >
    <svg viewBox='0 0 18 22' width='33' height='40'>
      <path
        d='M9 13.4l1.1 6.2M4.4 6.6a4.6 4.6 0 119.2 0 4.6 4.6 0 01-9.2 0z'
        fill='none'
        stroke={INK}
        strokeWidth='1.6'
        strokeLinecap='round'
      />
      <circle cx='9' cy='6.6' r='3' fill={RED} stroke={INK} strokeWidth='1.4' />
    </svg>
  </div>
)

const Fold = () => (
  <div
    style={{
      position: 'absolute',
      top: -20,
      right: 30,
      transform: 'rotate(2deg)',
      display: 'flex'
    }}
  >
    <svg viewBox='0 0 26 26' width='40' height='40'>
      <path
        d='M2.6 1.8h21.6v23.4z'
        fill={TAPE}
        stroke={INK}
        strokeWidth='1.6'
        strokeLinejoin='round'
      />
    </svg>
  </div>
)

const PhotoTab = () => (
  <div
    style={{
      position: 'absolute',
      top: -22,
      right: 28,
      width: 62,
      height: 58,
      paddingBottom: 18,
      background: SLIP,
      border: `3px solid ${INK}`,
      boxShadow: `5px 5px 0 ${INK}`,
      transform: 'rotate(-7deg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <svg viewBox='0 0 24 18' width='40' height='29'>
      <path
        d='M2.4 13.4c3-.8 4.4-5.4 7.2-5.4s3.6 5.4 7.2 5.4 2.8-2.2 2.8-2.2M16.6 5a2.2 2.2 0 11.1 4.3A2.2 2.2 0 0116.6 5z'
        fill={TAPE}
        stroke={SOFT}
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  </div>
)

const Teeth = () => (
  <div
    style={{
      position: 'absolute',
      top: 14,
      left: 24,
      right: 24,
      height: 9,
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='9'%3E%3Ccircle cx='10' cy='4.5' r='2.6' fill='%235C5C5C'/%3E%3C/svg%3E\")",
      backgroundRepeat: 'repeat-x',
      opacity: 0.6
    }}
  />
)

const Postmark = ({ date, locale }) => {
  const cn = locale !== 'en-US'
  const d = date || ''
  const mm = d.slice(5, 7)
  const dd = d.slice(8, 10)
  const yy = d.slice(0, 4)
  const week = d
    ? (cn ? WEEK_CN : WEEK_EN)[new Date(`${d}T00:00:00Z`).getUTCDay()]
    : ''

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 14,
        right: 58,
        transform: 'rotate(-4deg)',
        display: 'flex'
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 176,
          height: 148,
          display: 'flex'
        }}
      >
        <svg viewBox='0 0 176 148' width='176' height='148'>
          <ellipse
            cx='88'
            cy='74'
            rx='84'
            ry='70'
            fill='none'
            stroke={RED}
            strokeWidth='4'
          />
          <ellipse
            cx='88'
            cy='74'
            rx='74'
            ry='60'
            fill='none'
            stroke={RED}
            strokeWidth='2'
            strokeDasharray='7 5'
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: RED
          }}
        >
          <div style={{ fontFamily: STAMP, fontSize: 44, letterSpacing: 1 }}>
            {mm && dd ? `${mm}.${dd}` : ''}
          </div>
          <div
            style={{
              fontFamily: STAMP,
              fontSize: 17,
              letterSpacing: 2,
              marginTop: 2
            }}
          >
            {yy}
          </div>
          <div
            style={{
              fontFamily: STAMP,
              fontSize: 17,
              color: BLUE,
              marginTop: 2
            }}
          >
            {week}
          </div>
        </div>
      </div>
    </div>
  )
}

const HandRule = ({ w = 980 }) => (
  <svg viewBox='0 0 980 10' width={w} height={Math.round((w * 10) / 980)}>
    <path
      d='M2 6C114 1.4 226 9.2 338 5.2s226-6.4 338-2 188 6.6 300 2.4'
      fill='none'
      stroke={BLUE}
      strokeWidth='3'
      strokeLinecap='round'
    />
  </svg>
)

export function OgCard({
  title = '',
  date = '',
  category = '',
  states = [],
  site = '',
  locale = 'zh-CN',
  quote = '',
  size = 'wide'
}) {
  const labels = STATE_LABELS[locale] || STATE_LABELS['zh-CN']
  const dim = OG_SIZES[size] || OG_SIZES.wide
  const L = LAYOUT[size] || LAYOUT.wide
  const has = key => states.includes(key)
  const paper = has('featured') ? YELLOW : has('receipt') ? TAPE : SLIP
  const shown = states.filter(k => k !== 'locked').slice(0, 3)
  // 剪报卡的主角是选中的那句，标题退成出处；没有引文就没有剪报
  const clipping = !!quote
  const hero = clipping ? quote : title
  const heroStyle = clipping
    ? { fontSize: L.quoteSize, lineHeight: 1.5, maxHeight: L.quoteMax }
    : { fontSize: L.titleSize, lineHeight: 1.28, maxHeight: L.titleMax }

  return (
    <div
      style={{
        width: dim.width,
        height: dim.height,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background: PAPER,
        backgroundImage: [
          'repeating-linear-gradient(transparent 0 31px, ' +
            GRID +
            ' 31px 32px)',
          'repeating-linear-gradient(90deg, transparent 0 31px, ' +
            GRID +
            ' 31px 32px)'
        ].join(', ')
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 42,
          left: 42,
          right: 42,
          bottom: 42,
          background: paper,
          border: `3px solid ${INK}`,
          borderRadius: WOBBLE,
          boxShadow: `8px 8px 0 ${INK}`,
          transform: 'rotate(-0.6deg)',
          padding: L.pad,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <Tape style={{ top: -17, left: Math.round(dim.width / 2) - 117 }} />
        {(clipping || has('receipt')) && <Teeth />}
        {has('revised') && (
          <Tape
            style={{
              bottom: -14,
              left: 40,
              width: 72,
              height: 26,
              transform: 'rotate(-34deg)',
              clipPath: BIT_CLIP
            }}
          />
        )}
        {has('pinned') && <Pin />}
        {has('locked') ? <Fold /> : has('photo') && <PhotoTab />}

        <div
          style={{
            fontFamily: STAMP,
            fontSize: 21,
            fontWeight: 500,
            letterSpacing: '0.18em',
            color: SOFT,
            marginTop: 18
          }}
        >
          {site}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {clipping && (
            <div
              style={{
                fontFamily: PRINT,
                fontSize: heroStyle.fontSize,
                color: SOFT,
                lineHeight: 1
              }}
            >
              「
            </div>
          )}
          <div
            style={{
              fontFamily: PRINT,
              fontWeight: 600,
              letterSpacing: 1,
              color: INK,
              overflow: 'hidden',
              ...heroStyle
            }}
          >
            {clipping
              ? `${fitTitle(hero, L.quoteBudget)}」`
              : fitTitle(hero, L.titleBudget)}
          </div>
          {clipping && (
            <div
              style={{
                fontFamily: PRINT,
                fontSize: L.sourceSize,
                color: SOFT,
                marginTop: 18
              }}
            >
              {`—— ${fitTitle(title, 26)}`}
            </div>
          )}
          <div style={{ marginTop: 10, display: 'flex' }}>
            <HandRule w={L.rule} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {category && (
            <div
              style={{
                fontFamily: STAMP,
                fontSize: 21,
                fontWeight: 500,
                letterSpacing: '0.06em',
                color: INK,
                background: SLIP,
                border: `2px solid ${INK}`,
                borderRadius: PILL_WOBBLE,
                padding: '2px 16px'
              }}
            >
              {category}
            </div>
          )}
          {shown.map(key => (
            <div
              key={key}
              style={{
                fontFamily: STAMP,
                fontSize: 21,
                fontWeight: 500,
                letterSpacing: '0.06em',
                color: SOFT
              }}
            >
              {labels[key] || key}
            </div>
          ))}
        </div>

        <Postmark date={date} locale={locale} />
      </div>
    </div>
  )
}
