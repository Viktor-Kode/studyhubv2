'use client'

import { useEffect, useRef, useCallback, type RefObject } from 'react'
import { studyGroupsApi } from '@/lib/api/studyGroupsApi'

/**
 * When message rows intersect the chat scroll area, debounce POST mark-read with the latest seen createdAt.
 */
export function useGroupReadReceipts(opts: {
  groupId: string
  enabled: boolean
  scrollRef: RefObject<HTMLDivElement | null>
  /** Bump when message list changes so observers re-attach */
  messageCount: number
  debounceMs?: number
}) {
  const { groupId, enabled, scrollRef, messageCount, debounceMs = 2500 } = opts
  const latestTsRef = useRef<string>('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useCallback(() => {
    const ts = latestTsRef.current
    if (!ts || !enabled) return
    void studyGroupsApi.markRead(groupId, { lastReadAt: ts }).catch(() => {})
  }, [groupId, enabled])

  useEffect(() => {
    if (!enabled) return
    const root = scrollRef.current
    if (!root) return

    const obs = new IntersectionObserver(
      (entries) => {
        let updated = false
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          const ts = el.dataset.createdAt
          if (!ts) continue
          if (ts > (latestTsRef.current || '')) {
            latestTsRef.current = ts
            updated = true
          }
        }
        if (updated) {
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(flush, debounceMs)
        }
      },
      { root, threshold: 0.35, rootMargin: '0px 0px -8% 0px' },
    )

    const observeTargets = () => {
      obs.disconnect()
      root.querySelectorAll('[data-group-read-track="1"]').forEach((el) => obs.observe(el))
    }

    observeTargets()
    const mo = new MutationObserver(() => observeTargets())
    mo.observe(root, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      obs.disconnect()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled, scrollRef, messageCount, debounceMs, flush])
}
