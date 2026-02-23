import { db } from '@/lib/firebase'
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    setDoc,
    serverTimestamp,
    DocumentData
} from 'firebase/firestore'

export interface Class {
    id: string
    name: string
    subject: string
    teacherId: string
    description?: string
    studentCount: number
    createdAt: any
}

export interface StudentInClass {
    uid: string
    name: string
    email: string
    addedAt: any
}

export const classService = {
    // Create a new class (Teacher)
    async createClass(teacherId: string, classData: Omit<Class, 'id' | 'teacherId' | 'studentCount' | 'createdAt'>): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, 'classes'), {
                ...classData,
                teacherId,
                studentCount: 0,
                createdAt: serverTimestamp()
            })
            return docRef.id
        } catch (error) {
            console.error('[classService] createClass failed:', error)
            throw error
        }
    },

    // Get classes for a teacher
    async getTeacherClasses(teacherId: string): Promise<Class[]> {
        try {
            const q = query(
                collection(db, 'classes'),
                where('teacherId', '==', teacherId),
                orderBy('createdAt', 'desc')
            )
            const querySnapshot = await getDocs(q)
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Class))
        } catch (error) {
            console.error('[classService] getTeacherClasses failed:', error)
            return []
        }
    },

    // Get classes for a student (based on enrolment)
    async getStudentClasses(studentId: string): Promise<Class[]> {
        try {
            // Check enrolment collection
            const q = query(
                collection(db, 'enrolments'),
                where('studentId', '==', studentId)
            )
            const querySnapshot = await getDocs(q)
            const classIds = querySnapshot.docs.map(doc => doc.data().classId)

            if (classIds.length === 0) return []

            // Fetch class details
            const classes: Class[] = []
            for (const classId of classIds) {
                const classDoc = await getDoc(doc(db, 'classes', classId))
                if (classDoc.exists()) {
                    classes.push({ id: classDoc.id, ...classDoc.data() } as Class)
                }
            }
            return classes
        } catch (error) {
            console.error('[classService] getStudentClasses failed:', error)
            return []
        }
    },

    // Enrol student in class
    async enrolStudent(classId: string, studentId: string, studentName: string, studentEmail: string): Promise<void> {
        try {
            // Add to enrolments
            await setDoc(doc(db, 'enrolments', `${classId}_${studentId}`), {
                classId,
                studentId,
                studentName,
                studentEmail,
                enrolledAt: serverTimestamp()
            })

            // Increment student count in class
            const classRef = doc(db, 'classes', classId)
            const classSnap = await getDoc(classRef)
            if (classSnap.exists()) {
                await updateDoc(classRef, {
                    studentCount: (classSnap.data().studentCount || 0) + 1
                })
            }
        } catch (error) {
            console.error('[classService] enrolStudent failed:', error)
            throw error
        }
    },

    // Remove student from class
    async removeStudent(classId: string, studentId: string): Promise<void> {
        try {
            await deleteDoc(doc(db, 'enrolments', `${classId}_${studentId}`))

            // Decrement student count
            const classRef = doc(db, 'classes', classId)
            const classSnap = await getDoc(classRef)
            if (classSnap.exists()) {
                await updateDoc(classRef, {
                    studentCount: Math.max(0, (classSnap.data().studentCount || 0) - 1)
                })
            }
        } catch (error) {
            console.error('[classService] removeStudent failed:', error)
            throw error
        }
    },

    // Get students enrolled in a class
    async getClassStudents(classId: string): Promise<StudentInClass[]> {
        try {
            const q = query(
                collection(db, 'enrolments'),
                where('classId', '==', classId)
            )
            const querySnapshot = await getDocs(q)
            return querySnapshot.docs.map(doc => {
                const data = doc.data()
                return {
                    uid: data.studentId,
                    name: data.studentName,
                    email: data.studentEmail,
                    addedAt: data.enrolledAt
                } as StudentInClass
            })
        } catch (error) {
            console.error('[classService] getClassStudents failed:', error)
            return []
        }
    }
}
