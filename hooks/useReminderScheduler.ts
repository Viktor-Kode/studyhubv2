/**
 * useReminderScheduler
 *
 * Schedules local/SW notifications for all upcoming reminders.
 * - Works while the app is open (setTimeout → SW showNotification)
 * - Survives page reloads by storing schedules in localStorage and
 *   re-scheduling on every mount.
 * - Fires TWO notifications per reminder:
 *     1. "notifyBefore" minutes before (default 15 min)
 *     2. Exactly at reminder time
 */

import { useEffect, useRef } from 'react'
import { reminderService, Reminder } from '@/lib/services/reminderService'

const LS_KEY = 'sd_scheduled_reminders'
const MAX_TIMEOUT_MS = 2_000_000_000 // ~23 days – JS setTimeout max safe limit

interface ScheduledEntry {
  reminderId: string
  fireAtMs: number
  title: string
  body: string
}

function saveScheduled(entries: ScheduledEntry[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(entries))
  } catch { /* ignore */ }
}

function loadScheduled(): ScheduledEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

async function showSWNotification(title: string, body: string, link = '/dashboard/reminders') {
  if (typeof window === 'undefined') return

  // Ask permission if needed
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }

  if (!('serviceWorker' in navigator)) return

  try {
    const reg = await navigator.serviceWorker.ready
    if (Notification.permission === 'granted') {
      await reg.showNotification(title, {
        body,
        icon: '/android-chrome-192x192.png',
        badge: '/android-chrome-192x192.png',
        tag: `reminder-${Date.now()}`,
        data: { link },
        // vibrate is supported on Android Chrome
        ...(('vibrate' in navigator) ? { vibrate: [200, 100, 200] } : {}),
      })
    }
  } catch (err) {
    // Fallback: plain Notification API
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/android-chrome-192x192.png' })
      }
    } catch { /* ignore */ }
  }
}

export function useReminderScheduler(userId: string | undefined) {
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearAllTimers = () => {
    timerRefs.current.forEach(clearTimeout)
    timerRefs.current = []
  }

  const schedule = (entry: ScheduledEntry) => {
    const delayMs = entry.fireAtMs - Date.now()
    if (delayMs <= 0 || delayMs > MAX_TIMEOUT_MS) return

    const id = setTimeout(async () => {
      await showSWNotification(entry.title, entry.body, '/dashboard/reminders')

      // Remove from localStorage once fired
      const remaining = loadScheduled().filter(
        e => !(e.reminderId === entry.reminderId && e.fireAtMs === entry.fireAtMs)
      )
      saveScheduled(remaining)
    }, delayMs)

    timerRefs.current.push(id)
  }

  const scheduleReminder = (reminder: Reminder) => {
    const reminderMs = new Date(`${reminder.date}T${reminder.time}`).getTime()
    const notifyBeforeMs = (reminder.notifyBefore ?? 15) * 60_000
    const id = (reminder._id || reminder.id) as string

    const entries: ScheduledEntry[] = []

    // Advance notification (default 15 min before)
    const advanceFireAt = reminderMs - notifyBeforeMs
    if (advanceFireAt > Date.now()) {
      const mins = reminder.notifyBefore ?? 15
      entries.push({
        reminderId: `${id}-before`,
        fireAtMs: advanceFireAt,
        title: `⏰ Coming up: ${reminder.title}`,
        body: `In ${mins} minute${mins !== 1 ? 's' : ''} — get ready!`,
      })
    }

    // At-time notification
    if (reminderMs > Date.now()) {
      entries.push({
        reminderId: `${id}-at`,
        fireAtMs: reminderMs,
        title: `🔔 ${reminder.title}`,
        body: reminder.description || `It's time for your ${reminder.type} reminder.`,
      })
    }

    entries.forEach(e => schedule(e))
    return entries
  }

  const rescheduleAll = async () => {
    if (!userId) return
    clearAllTimers()

    try {
      const reminders = await reminderService.getUpcoming(userId, 30)
      const allEntries: ScheduledEntry[] = []

      for (const reminder of reminders) {
        const entries = scheduleReminder(reminder)
        allEntries.push(...entries)
      }

      saveScheduled(allEntries)
    } catch { /* ignore */ }
  }

  // On mount: re-schedule everything (surviving page reloads)
  useEffect(() => {
    if (!userId) return
    rescheduleAll()

    // Re-check every hour so long-running sessions stay fresh
    const interval = setInterval(rescheduleAll, 60 * 60 * 1000)

    return () => {
      clearAllTimers()
      clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return { scheduleReminder, rescheduleAll }
}
