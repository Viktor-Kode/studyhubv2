'use client'

import { useState, useEffect } from 'react'
import { subscribeForegroundMessages } from '@/lib/services/pushNotifications'
import './NotifToast.css'

type ToastItem = { id: number; title: string; body: string }

export default function NotifToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const unsubscribe = subscribeForegroundMessages((payload) => {
      const title = payload.notification?.title || 'StudyHelp'
      const body = payload.notification?.body || ''
      const id = Date.now()
      setToasts((prev) => [...prev, { id, title, body }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 5000)
    })
    return unsubscribe
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="notif-toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="notif-toast">
          <div className="notif-toast-icon">🔔</div>
          <div className="notif-toast-content">
            <p className="notif-toast-title">{toast.title}</p>
            <p className="notif-toast-body">{toast.body}</p>
          </div>
          <button
            type="button"
            className="notif-toast-close"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
