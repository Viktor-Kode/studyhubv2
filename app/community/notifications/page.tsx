'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Bell, Medal, MessageSquare, Sparkles, ThumbsUp } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { communityApi, type CommunityNotificationItem } from '@/lib/api/communityApi'
import { Button } from '@/components/ui/button'

const iconFor = (type: string) => {
  switch (type) {
    case 'like':
    case 'comment_like':
      return ThumbsUp
    case 'comment':
    case 'mention':
      return MessageSquare
    case 'bestAnswer':
      return Medal
    case 'badge':
      return Sparkles
    default:
      return Bell
  }
}

export default function CommunityNotificationsPage() {
  const [items, setItems] = useState<CommunityNotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await communityApi.getNotifications({ limit: 80 })
      setItems((res.data?.notifications as CommunityNotificationItem[]) || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const open = async (n: CommunityNotificationItem) => {
    if (!n.read) {
      try {
        await communityApi.markNotificationRead(n._id)
        setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)))
      } catch {
        /* ignore */
      }
    }
    if (n.postId) {
      window.location.href = `/community#post-${n.postId}`
    }
  }

  return (
    <ProtectedRoute allowedRoles={['student', 'admin']}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 pb-16 pt-6 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-lg">
          <div className="mb-6">
            <Link
              href="/community"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Community
            </Link>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>

          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <Bell className="mx-auto mb-3 h-10 w-10 text-slate-400" />
              <p className="text-sm text-slate-600 dark:text-slate-300">You&apos;re all caught up.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((n) => {
                const Icon = iconFor(n.type)
                const label =
                  n.type === 'like'
                    ? `${n.actorName || 'Someone'} liked your post`
                    : n.type === 'comment_like'
                      ? `${n.actorName || 'Someone'} liked your comment`
                    : n.type === 'comment'
                      ? `${n.actorName || 'Someone'} commented on your post`
                      : n.type === 'mention'
                        ? `${n.actorName || 'Someone'} mentioned you`
                        : n.type === 'bestAnswer'
                          ? 'Your answer was marked best'
                          : n.type === 'badge'
                            ? 'You unlocked a badge'
                            : 'Notification'
                return (
                  <li key={n._id}>
                    <button
                      type="button"
                      onClick={() => void open(n)}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                        n.read
                          ? 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                          : 'border-indigo-200 bg-indigo-50/80 dark:border-indigo-900/50 dark:bg-indigo-950/20'
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                        <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {!loading && items.length > 0 && (
            <div className="mt-6 text-center">
              <Button variant="outline" size="sm" type="button" onClick={() => void load()}>
                Refresh
              </Button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
