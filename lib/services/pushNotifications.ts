'use client'

import { app } from '@/lib/firebase'
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'

export async function enablePushNotifications(): Promise<{ success: boolean; reason?: string }> {
  try {
    if (typeof window === 'undefined') {
      return { success: false, reason: 'Not in browser' }
    }
    if (!(await isSupported())) {
      return { success: false, reason: 'Push not supported in this browser' }
    }
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, reason: 'Permission denied' }
    }

    // Next.js only inlines NEXT_PUBLIC_* for the client; VITE_* is a common alias from Vite docs.
    const vapidKey =
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || process.env.VITE_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      return { success: false, reason: 'VAPID key not configured' }
    }

    const messaging = getMessaging(app)
    const reg = await navigator.serviceWorker.ready
    const fcmToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: reg,
    })

    if (!fcmToken) {
      return { success: false, reason: 'No token received' }
    }

    const { apiClient } = await import('@/lib/api/client')
    await apiClient.post('/notifications/register-token', { token: fcmToken })

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Push]', msg)
    return { success: false, reason: msg }
  }
}

export async function disablePushNotifications(): Promise<void> {
  const { apiClient } = await import('@/lib/api/client')
  await apiClient.post('/notifications/disable')
}

export function subscribeForegroundMessages(
  callback: (payload: { notification?: { title?: string; body?: string } }) => void
): () => void {
  let unsub: (() => void) | undefined
  let cancelled = false

  void (async () => {
    if (typeof window === 'undefined') return
    if (!(await isSupported())) return
    if (cancelled) return
    const messaging = getMessaging(app)
    unsub = onMessage(messaging, callback)
  })()

  return () => {
    cancelled = true
    unsub?.()
  }
}
