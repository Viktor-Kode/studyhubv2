'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { apiClient } from '@/lib/api/client'
import './NotificationBell.css'

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

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<
    Array<{
      _id: string
      type: string
      title: string
      body: string
      link?: string
      isRead: boolean
      createdAt: string
    }>
  >([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/notifications')
      const data = res.data as { notifications?: typeof notifications; unreadCount?: number }
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark-read')
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpen = () => {
    if (!open && unreadCount > 0) {
      void markAllRead()
    }
    setOpen((o) => !o)
  }

  const handleNotifClick = (notif: { link?: string }) => {
    if (notif.link) {
      const href = notif.link.startsWith('http')
        ? notif.link
        : `${window.location.origin}${notif.link.startsWith('/') ? '' : '/'}${notif.link}`
      window.location.href = href
    }
    setOpen(false)
  }

  return (
    <div className="notif-bell-wrap" ref={dropdownRef}>
      <button type="button" className="notif-bell-btn" onClick={handleOpen} aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <h4>Notifications</h4>
            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button type="button" className="notif-mark-all" onClick={() => void markAllRead()}>
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button type="button" className="notif-close" onClick={() => setOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="notif-list">
            {loading && notifications.length === 0 && (
              <div className="notif-empty">Loading...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="notif-empty">
                <span>🔔</span>
                <p>No notifications yet</p>
              </div>
            )}
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                onClick={() => handleNotifClick(n)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleNotifClick(n)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="notif-item-icon">{NOTIF_ICONS[n.type] || '🔔'}</div>
                <div className="notif-item-content">
                  <p className="notif-item-title">{n.title}</p>
                  <p className="notif-item-body">{n.body}</p>
                  <span className="notif-item-time">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {!n.isRead && <div className="notif-unread-dot" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
