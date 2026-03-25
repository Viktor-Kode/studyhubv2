import { useCallback, useEffect, useRef } from 'react'

type UpdatedPost = {
  _id: string
  likes: string[]
  commentsCount: number
}

type UseCommunityRealtimeParams<TNewPosts> = {
  getToken: () => Promise<string | null>
  onNewPosts: (newPosts: TNewPosts[]) => void
  onUpdatedPosts: (updatedPosts: UpdatedPost[]) => void
  enabled?: boolean
}

const POLL_INTERVAL = 15000

export function useCommunityRealtime<TNewPosts>({
  getToken,
  onNewPosts,
  onUpdatedPosts,
  enabled = true,
}: UseCommunityRealtimeParams<TNewPosts>) {
  const lastTimestamp = useRef<string>(new Date(Date.now() - 30000).toISOString())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const latestPostIdRef = useRef<string | null>(null)

  const poll = useCallback(async () => {
    const since = lastTimestamp.current
    const token = await getToken()
    if (!token) return

    try {
      const url = `/api/backend/community/updates?since=${encodeURIComponent(since)}&latestPostId=${encodeURIComponent(
        latestPostIdRef.current || '',
      )}`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return

      const data = (await res.json()) as {
        newPosts?: TNewPosts[]
        updatedPosts?: UpdatedPost[]
        timestamp?: string
      }

      if (data.newPosts?.length) {
        onNewPosts(data.newPosts)
        // Store the newest id as a lightweight hint for the backend (backend may ignore it).
        latestPostIdRef.current = (data.newPosts[0] as any)?._id || latestPostIdRef.current
      }
      if (data.updatedPosts?.length) {
        onUpdatedPosts(data.updatedPosts)
      }

      if (data.timestamp) {
        lastTimestamp.current = data.timestamp
      }
    } catch {
      // Silently fail — background poll should not disrupt the user experience.
    }
  }, [getToken, onNewPosts, onUpdatedPosts])

  useEffect(() => {
    if (!enabled) return

    const start = () => {
      poll()
      intervalRef.current = setInterval(poll, POLL_INTERVAL)
    }

    const handleVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        return
      }

      start()
    }

    start()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [poll, enabled])
}

