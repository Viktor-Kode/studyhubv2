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
        
        // Start of today in local time
        const startOfToday = new Date(now)
        startOfToday.setHours(0, 0, 0, 0)
        
        // End of the range (X days from now)
        const futureDate = new Date(startOfToday.getTime() + (days + 1) * 24 * 60 * 60 * 1000)

        return all
            .filter(r => {
                // Parse date and time in local context
                const reminderDate = new Date(`${r.date}T${r.time}`)
                // Include if it's today (even if time passed) or in the future range, and not completed
                return reminderDate >= startOfToday && reminderDate <= futureDate && !r.completed
            })
            .sort((a, b) => {
                // Sort by date then time
                const dateCompare = a.date.localeCompare(b.date)
                if (dateCompare !== 0) return dateCompare
                return a.time.localeCompare(b.time)
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
    }
}
