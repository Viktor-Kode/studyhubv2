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

export function showXPToast(xp: number) {
  const el = document.createElement('div')
  el.className = 'xp-toast'
  el.textContent = `+${xp} XP ⚡`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2500)
}

export function showBadgeToast(badge: { icon: string; name: string }) {
  const el = document.createElement('div')
  el.className = 'badge-toast'
  el.innerHTML = `${badge.icon} Badge Unlocked: <strong>${badge.name}</strong>`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 4000)
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
