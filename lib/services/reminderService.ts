import { apiClient } from '../api/client'

export interface Reminder {
    id: string
    _id?: string
    title: string
    description?: string
    date: string // YYYY-MM-DD
    time: string // HH:MM
    type: 'study' | 'exam' | 'deadline' | 'other' | 'assignment' | 'class'
    subject?: string
    location?: string
    priority?: 'low' | 'medium' | 'high'
    completed: boolean
    sendWhatsApp: boolean // backend model name
    whatsappEnabled?: boolean // frontend used this too
    whatsappNumber?: string
    emailEnabled?: boolean
    notifyBefore?: number
    recurring?: 'none' | 'daily' | 'weekly' | 'monthly'
    recurringDays?: number[]
    createdAt?: any
    userId?: string
}

export const reminderService = {
    // Get all reminders for a specific user from Backend
    async getAll(userId: string): Promise<Reminder[]> {
        try {
            const response = await apiClient.get('/reminders')
            return (response.data.reminders || []).map((r: any) => ({
                ...r,
                id: r._id
            }))
        } catch (error) {
            console.error('[reminderService] getAll failed:', error)
            return []
        }
    },

    // Get upcoming reminders
    async getUpcoming(userId: string, days: number = 7): Promise<Reminder[]> {
        const all = await this.getAll(userId)
        const now = new Date()
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

        return all
            .filter(r => {
                const reminderDate = new Date(`${r.date}T${r.time}`)
                return reminderDate >= now && reminderDate <= futureDate && !r.completed
            })
    },

    // Add new reminder to Backend
    async add(userId: string, reminder: Omit<Reminder, 'id' | 'completed'>): Promise<string> {
        try {
            const response = await apiClient.post('/reminders', reminder)
            return response.data.reminder._id
        } catch (error) {
            console.error('[reminderService] add failed:', error)
            throw error
        }
    },

    // Update reminder in Backend
    async update(userId: string, id: string, updates: Partial<Reminder>): Promise<void> {
        try {
            await apiClient.patch(`/reminders/${id}`, updates)
        } catch (error) {
            console.error('[reminderService] update failed:', error)
            throw error
        }
    },

    // Delete reminder from Backend
    async delete(userId: string, id: string): Promise<void> {
        try {
            await apiClient.delete(`/reminders/${id}`)
        } catch (error) {
            console.error('[reminderService] delete failed:', error)
            throw error
        }
    },

    // Mark as completed
    async markCompleted(userId: string, id: string): Promise<void> {
        return this.update(userId, id, { completed: true })
    },

    // Forward WhatsApp notification
    async sendWhatsAppNotification(reminder: Reminder): Promise<{ success: boolean; error?: string }> {
        if (!reminder.sendWhatsApp || !reminder.whatsappNumber) {
            return { success: false, error: 'WhatsApp not enabled' }
        }

        try {
            const response = await apiClient.post('/reminders/whatsapp', {
                phoneNumber: reminder.whatsappNumber,
                message: this.formatWhatsAppMessage(reminder)
            })
            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    },

    formatWhatsAppMessage(reminder: Reminder): string {
        const date = new Date(`${reminder.date}T${reminder.time}`)
        return `📚 *Study Reminder*\n\n*${reminder.title}*\n${reminder.description || ''}\n\n📅 Date: ${date.toLocaleDateString()}\n⏰ Time: ${reminder.time}\n\nGood luck! 💪`
    },

    // Browser Notification Permission
    async requestNotificationPermission() {
        if (typeof window === 'undefined' || !('Notification' in window)) return false
        if (Notification.permission === 'granted') return true
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    },

    // Legacy support for TimetableReminders
    init() {
        console.log('[reminderService] initialized')
    },

    getWhatsAppNumber(): string {
        if (typeof window === 'undefined') return ''
        return localStorage.getItem('user_whatsapp_number') || ''
    },

    saveWhatsAppNumber(num: string) {
        if (typeof window === 'undefined') return
        localStorage.setItem('user_whatsapp_number', num)
    }
}
