'use client'

import { useCallback, useEffect, useState } from 'react'
import { progressApi } from '@/lib/api/progressApi'
import { useAuthStore } from '@/lib/store/authStore'

export type ProgressPayload = {
  xp: number
  level: number
  levelName: string
  streak: number
  weeklyXP: number
  badges: { id: string; name: string; description?: string; icon: string; earnedAt?: string }[]
  totalQuestionsAnswered?: number
  totalTopicsStudied?: number
  totalCBTDone?: number
  highScoreCBTCount?: number
  levelInfo: {
    level: number
    name: string
    icon: string
    minXP: number
    nextLevel?: { level: number; name: string; minXP: number; icon: string }
    progress: number
  }
}

const HOST_ID = 'gamification-toast-host'

function getToastHost(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  let el = document.getElementById(HOST_ID)
  if (!el) {
    el = document.createElement('div')
    el.id = HOST_ID
    el.className = 'gamification-toast-host'
    el.setAttribute('aria-live', 'polite')
    document.body.appendChild(el)
  }
  return el
}

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function showXPToast(xp: number) {
  const host = getToastHost()
  if (!host) return

  const el = document.createElement('div')
  el.className = 'gw-toast gw-toast--xp'
  el.setAttribute('role', 'status')
  el.innerHTML = `<span class="gw-toast-icon" aria-hidden="true">⚡</span><span>+${xp} XP</span>`
  host.appendChild(el)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('gw-toast--in'))
  })

  setTimeout(() => {
    el.classList.remove('gw-toast--in')
    setTimeout(() => el.remove(), 380)
  }, 2600)
}

export function showBadgeToast(badge: { icon: string; name: string }) {
  const host = getToastHost()
  if (!host) return

  const el = document.createElement('div')
  el.className = 'gw-toast gw-toast--badge'
  el.setAttribute('role', 'status')

  const conf = document.createElement('div')
  conf.className = 'gw-toast-confetti'
  conf.setAttribute('aria-hidden', 'true')
  for (let i = 0; i < 5; i++) {
    const sp = document.createElement('span')
    sp.style.setProperty('--dx', `${8 + i * 14}px`)
    conf.appendChild(sp)
  }

  const icon = document.createElement('span')
  icon.className = 'gw-toast-badge-icon'
  icon.textContent = badge.icon
  icon.setAttribute('aria-hidden', 'true')

  const text = document.createElement('div')
  text.innerHTML = `<strong>Badge unlocked</strong><br/><span>${esc(badge.name)}</span>`

  el.appendChild(conf)
  el.appendChild(icon)
  el.appendChild(text)
  host.appendChild(el)

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('gw-toast--in'))
  })

  setTimeout(() => {
    el.classList.remove('gw-toast--in')
    setTimeout(() => el.remove(), 400)
  }, 4200)
}

export function useProgress() {
  const uid = useAuthStore((s) => s.user?.uid)
  const [progress, setProgress] = useState<ProgressPayload | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProgress = useCallback(async () => {
    if (!uid) {
      setProgress(null)
      setLoading(false)
      return
    }
    try {
      const res = await progressApi.getMe()
      setProgress(res.data as ProgressPayload)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [uid])

  const awardXP = useCallback(
    async (action: string, metadata?: Record<string, unknown>) => {
      if (!uid) return null
      try {
        const res = await progressApi.award(action, metadata)
        const data = res.data as {
          message?: string
          xpAdded?: number
          newBadges?: { icon: string; name: string }[]
        }
        if (data.xpAdded != null) {
          showXPToast(data.xpAdded)
        }
        if (data.newBadges && data.newBadges.length > 0) {
          showBadgeToast(data.newBadges[0])
        }
        if (data.xpAdded != null || (data.newBadges && data.newBadges.length > 0)) {
          await fetchProgress()
        }
        return data
      } catch (e) {
        console.error(e)
        return null
      }
    },
    [uid, fetchProgress]
  )

  useEffect(() => {
    void fetchProgress()
  }, [fetchProgress])

  return { progress, loading, awardXP, refetch: fetchProgress }
}
