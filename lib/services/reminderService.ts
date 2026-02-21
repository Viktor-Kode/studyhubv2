
import { userStorage } from '@/lib/utils/userStorage'

export interface Reminder {
    id: string
    title: string
    description?: string
    date: string // YYYY-MM-DD
    time: string // HH:MM
    type: 'study' | 'exam' | 'deadline' | 'assignment' | 'class'
    subject?: string
    location?: string
    whatsappEnabled: boolean
    whatsappNumber?: string // format: whatsapp:+1234567890
    emailEnabled: boolean
    notifyBefore: number // minutes before (5, 15, 30, 60, 1440)
    recurring?: 'none' | 'daily' | 'weekly' | 'monthly'
    recurringDays?: number[] // 0-6 for Sunday-Saturday
    completed: boolean
    createdAt: number
    timetableId?: string
}

const STORAGE_KEY = 'studyReminders'
const WHATSAPP_STORAGE_KEY = 'userWhatsAppNumber'

export const reminderService = {

    // Initialize and reschedule pending notifications
    init() {
        if (typeof window === 'undefined') return
        const all = this.getAll()

        all.forEach(reminder => {
            if (!reminder.completed) {
                this.scheduleNotification(reminder)
            }
        })
    },

    // Get all reminders - user-scoped
    getAll(): Reminder[] {
        try {
            const data = userStorage.getItem(STORAGE_KEY)
            return data ? JSON.parse(data) : []
        } catch {
            return []
        }
    },

    // Get upcoming reminders (next 7 days)
    getUpcoming(days: number = 7): Reminder[] {
        const all = this.getAll()
        const now = new Date()
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

        return all
            .filter(r => {
                const reminderDate = new Date(`${r.date}T${r.time}`)
                return reminderDate >= now && reminderDate <= futureDate && !r.completed
            })
            .sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`)
                const dateB = new Date(`${b.date}T${b.time}`)
                return dateA.getTime() - dateB.getTime()
            })
    },

    // Get today's reminders
    getToday(): Reminder[] {
        const all = this.getAll()
        const today = new Date().toISOString().split('T')[0]

        return all
            .filter(r => r.date === today && !r.completed)
            .sort((a, b) => a.time.localeCompare(b.time))
    },

    // Get by type
    getByType(type: Reminder['type']): Reminder[] {
        return this.getAll().filter(r => r.type === type)
    },

    // Add new reminder
    add(reminder: Omit<Reminder, 'id' | 'createdAt' | 'completed'>): Reminder {
        const newReminder: Reminder = {
            ...reminder,
            id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            completed: false
        }

        const all = this.getAll()
        all.push(newReminder)
        userStorage.setItem(STORAGE_KEY, JSON.stringify(all))

        // Schedule notification check
        this.scheduleNotification(newReminder)

        return newReminder
    },

    // Update reminder
    update(id: string, updates: Partial<Reminder>): Reminder | null {
        const all = this.getAll()
        const index = all.findIndex(r => r.id === id)

        if (index === -1) return null

        all[index] = { ...all[index], ...updates }
        userStorage.setItem(STORAGE_KEY, JSON.stringify(all))

        // Reschedule notification
        this.scheduleNotification(all[index])

        return all[index]
    },

    // Delete reminder
    delete(id: string): boolean {
        const all = this.getAll()
        const filtered = all.filter(r => r.id !== id)

        if (filtered.length === all.length) return false

        userStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
        return true
    },

    // Mark as completed
    markCompleted(id: string): boolean {
        return !!this.update(id, { completed: true })
    },

    // Save user's WhatsApp number
    saveWhatsAppNumber(number: string) {
        // Ensure correct format: whatsapp:+1234567890
        let formatted = number.trim()
        if (!formatted.startsWith('whatsapp:')) {
            formatted = `whatsapp:${formatted}`
        }
        if (!formatted.includes('+')) {
            formatted = formatted.replace('whatsapp:', 'whatsapp:+')
        }
        userStorage.setItem(WHATSAPP_STORAGE_KEY, formatted)
    },

    // Get saved WhatsApp number - user-scoped
    getWhatsAppNumber(): string | null {
        return userStorage.getItem(WHATSAPP_STORAGE_KEY)
    },

    // Send WhatsApp notification
    async sendWhatsAppNotification(reminder: Reminder, forceText = false): Promise<{ success: boolean; error?: string; sid?: string }> {
        if (!reminder.whatsappEnabled || !reminder.whatsappNumber) {
            return { success: false, error: 'WhatsApp is not enabled or number is missing' }
        }

        try {
            const message = this.formatWhatsAppMessage(reminder)

            const response = await fetch('/api/reminders/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: reminder.whatsappNumber,
                    message,
                    reminderTitle: reminder.title,
                    forceText
                })
            })

            const data = await response.json()

            if (!response.ok) {
                console.error('WhatsApp send failed:', data.error)
                return { success: false, error: data.error || 'Failed to send message' }
            }

            return { success: true, sid: data.messageSid }
        } catch (error: any) {
            console.error('WhatsApp notification error:', error)
            return { success: false, error: error.message || 'Network error' }
        }
    },

    // Format WhatsApp message
    formatWhatsAppMessage(reminder: Reminder): string {
        const typeEmojis = {
            study: '📚',
            exam: '📝',
            deadline: '⏰',
            assignment: '📄',
            class: '🏫'
        }

        const emoji = typeEmojis[reminder.type] || '🔔'
        const date = new Date(`${reminder.date}T${reminder.time}`)
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

        let message = `${emoji} *Study Reminder*\n\n`
        message += `*${reminder.title}*\n`

        if (reminder.description) {
            message += `${reminder.description}\n\n`
        }

        message += `📅 Date: ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n`
        message += `⏰ Time: ${timeStr}\n`

        if (reminder.subject) {
            message += `📖 Subject: ${reminder.subject}\n`
        }

        if (reminder.location) {
            message += `📍 Location: ${reminder.location}\n`
        }

        message += `\nGood luck with your studies! 💪`

        return message
    },

    // Schedule notification check (runs in background)
    scheduleNotification(reminder: Reminder) {
        if (!reminder.whatsappEnabled && !reminder.emailEnabled) return

        const reminderTime = new Date(`${reminder.date}T${reminder.time}`)
        const notifyTime = new Date(reminderTime.getTime() - reminder.notifyBefore * 60000)
        const now = new Date()

        if (notifyTime <= now) return // Already past

        const delay = notifyTime.getTime() - now.getTime()

        // Use setTimeout for near-term reminders (< 24 hours)
        if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
            console.log(`Scheduling WhatsApp for ${reminder.title} in ${Math.round(delay / 1000)}s`)
            setTimeout(async () => {
                if (reminder.whatsappEnabled) {
                    console.log(`Sending scheduled WhatsApp for ${reminder.title}`)
                    await this.sendWhatsAppNotification(reminder, true)
                }
                // Browser notification as fallback
                this.showBrowserNotification(reminder)
            }, delay)
        } else {
            console.log(`Reminder ${reminder.title} not scheduled. Delay: ${delay}ms`)
        }
    },

    // Browser notification fallback
    showBrowserNotification(reminder: Reminder) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`${reminder.type.toUpperCase()}: ${reminder.title}`, {
                body: `${reminder.description || ''}\n${reminder.date} at ${reminder.time}`,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: reminder.id
            })
        }
    },

    // Request notification permission
    async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) return false

        if (Notification.permission === 'granted') return true

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission()
            return permission === 'granted'
        }

        return false
    }
}
