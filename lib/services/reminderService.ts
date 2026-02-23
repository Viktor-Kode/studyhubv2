import { db } from '@/lib/firebase'
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    setDoc,
    serverTimestamp
} from 'firebase/firestore'

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
    whatsappNumber?: string
    emailEnabled: boolean
    notifyBefore: number // minutes before
    recurring?: 'none' | 'daily' | 'weekly' | 'monthly'
    completed: boolean
    createdAt: any
    userId: string
}

export const reminderService = {
    // Get all reminders for a specific user from Firestore
    async getAll(userId: string): Promise<Reminder[]> {
        if (!userId) return []
        try {
            const q = query(
                collection(db, 'reminders', userId, 'items'),
                orderBy('date', 'asc'),
                orderBy('time', 'asc')
            )
            const querySnapshot = await getDocs(q)
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Reminder))
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

    // Add new reminder to Firestore
    async add(userId: string, reminder: Omit<Reminder, 'id' | 'createdAt' | 'completed' | 'userId'>): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, 'reminders', userId, 'items'), {
                ...reminder,
                userId,
                completed: false,
                createdAt: serverTimestamp()
            })
            return docRef.id
        } catch (error) {
            console.error('[reminderService] add failed:', error)
            throw error
        }
    },

    // Update reminder in Firestore
    async update(userId: string, id: string, updates: Partial<Reminder>): Promise<void> {
        try {
            const docRef = doc(db, 'reminders', userId, 'items', id)
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error('[reminderService] update failed:', error)
            throw error
        }
    },

    // Delete reminder from Firestore
    async delete(userId: string, id: string): Promise<void> {
        try {
            await deleteDoc(doc(db, 'reminders', userId, 'items', id))
        } catch (error) {
            console.error('[reminderService] delete failed:', error)
            throw error
        }
    },

    // Mark as completed
    async markCompleted(userId: string, id: string): Promise<void> {
        return this.update(userId, id, { completed: true })
    },

    // Forward WhatsApp notification (requires backend API)
    async sendWhatsAppNotification(reminder: Reminder, forceText = false): Promise<{ success: boolean; error?: string }> {
        if (!reminder.whatsappEnabled || !reminder.whatsappNumber) {
            return { success: false, error: 'WhatsApp not enabled' }
        }

        try {
            const response = await fetch('/api/reminders/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phoneNumber: reminder.whatsappNumber,
                    message: this.formatWhatsAppMessage(reminder),
                    reminderTitle: reminder.title,
                    forceText
                })
            })

            const data = await response.json()
            return { success: response.ok, error: data.error }
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
        if (!('Notification' in window)) return false
        if (Notification.permission === 'granted') return true
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    },

    // Local Storage helpers for user preferences (for now)
    getWhatsAppNumber(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('user_whatsapp_number')
    },

    saveWhatsAppNumber(number: string) {
        if (typeof window === 'undefined') return
        localStorage.setItem('user_whatsapp_number', number)
    },

    // Initialize/Reschedule local notifications (stub for future implementation)
    init() {
        console.log('[reminderService] Initializing...')
    }
}
