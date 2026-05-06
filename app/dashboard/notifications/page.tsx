'use client'

import { useState, useEffect, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { apiClient } from '@/lib/api/client'
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck, Trash2, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Notification = {
  _id: string
  type: string
  title: string
  body: string
  link?: string
  isRead: boolean
  createdAt: string
}

const NOTIF_ICONS: Record<string, string> = {
  post_like: '❤️',
  post_comment: '💬',
  group_join: '👥',
  cbt_result: '📝',
  payment_confirmed: '✅',
  plan_expiring: '⚠️',
  new_post_follow: '📢',
  streak_ending: '🔥',
  admin_announcement: '📣',
}

const NOTIF_COLORS: Record<string, string> = {
  post_like: 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20',
  post_comment: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20',
  group_join: 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20',
  cbt_result: 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20',
  payment_confirmed: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20',
  plan_expiring: 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20',
  streak_ending: 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20',
  admin_announcement: 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifications = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await apiClient.get('/notifications')
      const data = res.data as { notifications?: Notification[]; unreadCount?: number }
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark-read')
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const handleNotifClick = (notif: Notification) => {
    if (notif.link) {
      const href = notif.link.startsWith('http')
        ? notif.link
        : notif.link
      window.location.href = href
    }
  }

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Bell className="text-purple-600 dark:text-purple-400 w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchNotifications(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Refresh"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl mb-5">
          {(['all', 'unread'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all capitalize ${
                filter === tab
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'unread' && unreadCount > 0 ? `Unread (${unreadCount})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && displayed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4 text-4xl">
                🔔
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filter === 'unread'
                  ? 'You have no unread notifications.'
                  : "You'll see streak reminders, quiz results, and updates here."}
              </p>
            </div>
          )}

          {!loading && displayed.map(n => (
            <div
              key={n._id}
              role={n.link ? 'button' : 'article'}
              tabIndex={n.link ? 0 : undefined}
              onClick={() => n.link && handleNotifClick(n)}
              onKeyDown={e => e.key === 'Enter' && n.link && handleNotifClick(n)}
              className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                NOTIF_COLORS[n.type] || 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'
              } ${n.link ? 'cursor-pointer hover:shadow-md' : ''} ${!n.isRead ? 'shadow-sm' : 'opacity-75'}`}
            >
              {/* Unread dot */}
              {!n.isRead && (
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              )}

              {/* Icon */}
              <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-xl shadow-sm flex-shrink-0 border border-white/50 dark:border-gray-700">
                {NOTIF_ICONS[n.type] || '🔔'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-4">
                <p className={`text-sm font-bold mb-0.5 ${n.isRead ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                  {n.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {n.body}
                </p>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 block font-medium">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  )
}
