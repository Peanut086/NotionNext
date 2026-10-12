import { siteConfig } from '@/lib/config'
import { isBrowser } from '@/lib/utils'
import { useEffect, useState } from 'react'
import CONFIG from './config'

const j = (key, fallback) => siteConfig(key, fallback, CONFIG)

/**
 * 读者的铅笔痕：全站唯一允许碰 localStorage 的地方。
 * 规格见 design-system/journal/MASTER.md「书签：读者留下的铅笔痕」「读完的纸打个勾」两节。
 */
const STORE_KEY = 'journal:read:v1'

// 隐私模式取 localStorage 会抛、配额满写会抛——都是真实的外部边界，不是想象中的分支
const load = () => {
  if (!isBrowser) return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORE_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch (e) {
    return {}
  }
}

const save = marks => {
  if (!isBrowser) return
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(marks))
  } catch (e) {
    // 存不下就不存：这一层坏了也不该拖垮页面
  }
}

/** 只留最近 KEEP 条：读者的历史不该无限长 */
const prune = marks => {
  const keep = Number(j('JOURNAL_READ_KEEP', 200))
  const entries = Object.entries(marks).sort(
    (a, b) => (b[1]?.at || 0) - (a[1]?.at || 0)
  )
  if (entries.length <= keep) return marks
  return Object.fromEntries(entries.slice(0, keep))
}

/** 同一毫秒里连续写两条也要排出先后，否则刚记下的那条会被自己挤掉 */
const nextAt = marks => {
  const newest = Math.max(
    0,
    ...Object.values(marks).map(mark => Number(mark?.at) || 0)
  )
  const now = Date.now()
  return now > newest ? now : newest + 1
}

const readKey = post => post?.id || post?.slug || ''

const pctOfKey = (marks, key) => {
  const p = Number(marks?.[key]?.p)
  return Number.isFinite(p) ? Math.min(100, Math.max(0, p)) : 0
}

/** 上一篇读到哪儿（0 = 没读过，或这篇不认识） */
const pctOf = (marks, post) => pctOfKey(marks, readKey(post))

/** 读完的唯一判据：96 / 97 的分界只许写在这一行 */
const isRead = pct => pct >= Number(j('JOURNAL_READ_DONE_PCT', 97))

const recordProgress = (post, pct) => {
  if (!j('JOURNAL_READING_BOOKMARK', true)) return
  const key = readKey(post)
  if (!key) return
  const p = Math.round(Math.min(100, Math.max(0, pct)))
  if (p < Number(j('JOURNAL_READ_MIN_PCT', 3))) return
  const marks = load()
  if (pctOfKey(marks, key) >= p) return
  marks[key] = { p, at: nextAt(marks) }
  save(prune(marks))
}

/** 首帧必须是 null：服务端没有 localStorage，客户端首帧要和 SSR 逐字符相同 */
const useReadMarks = () => {
  const [marks, setMarks] = useState(null)
  useEffect(() => {
    if (!j('JOURNAL_READING_BOOKMARK', true)) return
    setMarks(load())
  }, [])
  return marks
}

/** 记录当前这篇的滚动进度；只向上写，所以整数位变化才落一次盘 */
const useProgressRecord = post => {
  useEffect(() => {
    if (!readKey(post) || !j('JOURNAL_READING_BOOKMARK', true)) return
    let last = -1
    const update = () => {
      const top = window.scrollY || document.documentElement.scrollTop
      const height =
        document.documentElement.scrollHeight - window.innerHeight || 1
      const pct = Math.round(Math.min(100, Math.max(0, (top / height) * 100)))
      if (pct === last) return
      last = pct
      recordProgress(post, pct)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [post])
}

export { isRead, pctOf, recordProgress, useProgressRecord, useReadMarks }
