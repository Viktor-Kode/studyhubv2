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
    setDoc,
    serverTimestamp
} from 'firebase/firestore'

export interface TimetableSlot {
    id: string
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
    startTime: string // HH:MM
    endTime: string // HH:MM
    subject: string
    teacherName: string
    room?: string
    classId: string
}

export const timetableService = {
    // Get timetable for a specific class
    async getClassTimetable(classId: string): Promise<TimetableSlot[]> {
        if (!classId) return []
        try {
            const slotsRef = collection(db, 'timetables', classId, 'slots')
            const q = query(slotsRef)
            const querySnapshot = await getDocs(q)
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TimetableSlot))
        } catch (error) {
            console.error('[timetableService] getClassTimetable failed:', error)
            return []
        }
    },

    // Add slot (Teacher only)
    async addSlot(classId: string, slot: Omit<TimetableSlot, 'id' | 'classId'>): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, 'timetables', classId, 'slots'), {
                ...slot,
                classId,
                createdAt: serverTimestamp()
            })
            return docRef.id
        } catch (error) {
            console.error('[timetableService] addSlot failed:', error)
            throw error
        }
    },

    // Update slot
    async updateSlot(classId: string, slotId: string, updates: Partial<TimetableSlot>): Promise<void> {
        try {
            const docRef = doc(db, 'timetables', classId, 'slots', slotId)
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            })
        } catch (error) {
            console.error('[timetableService] updateSlot failed:', error)
            throw error
        }
    },

    // Delete slot
    async deleteSlot(classId: string, slotId: string): Promise<void> {
        try {
            await deleteDoc(doc(db, 'timetables', classId, 'slots', slotId))
        } catch (error) {
            console.error('[timetableService] deleteSlot failed:', error)
            throw error
        }
    }
}
