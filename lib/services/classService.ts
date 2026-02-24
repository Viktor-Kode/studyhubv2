import { apiClient } from '../api/client'

export interface Class {
    id: string
    _id?: string // For backend compatibility
    className: string
    name?: string // For frontend compatibility
    subject: string
    teacherId: string
    description?: string
    studentCount: number
    level: string
    joinCode?: string
    students?: any[]
    assignments?: any[]
    announcements?: any[]
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
    async createClass(teacherId: string, classData: any): Promise<string> {
        try {
            const response = await apiClient.post('/classes', {
                ...classData,
                className: classData.name || classData.className,
                level: classData.level || 'secondary'
            })
            return response.data.class._id
        } catch (error) {
            console.error('[classService] createClass failed:', error)
            throw error
        }
    },

    // Get classes for a teacher
    async getTeacherClasses(teacherId: string): Promise<Class[]> {
        try {
            const response = await apiClient.get('/classes')
            return response.data.classes.map((cls: any) => ({
                ...cls,
                id: cls._id,
                name: cls.className,
                studentCount: cls.students?.length || 0
            }))
        } catch (error) {
            console.error('[classService] getTeacherClasses failed:', error)
            return []
        }
    },

    // Get classes for a student (enrolled)
    async getStudentClasses(studentId: string): Promise<Class[]> {
        try {
            // Note: The backend route for student classes might be different or we use getClasses if student is filtered
            // For now, let's assume getClasses returns what the user is authorized to see
            const response = await apiClient.get('/classes')
            return response.data.classes.map((cls: any) => ({
                ...cls,
                id: cls._id,
                name: cls.className,
                studentCount: cls.students?.length || 0
            }))
        } catch (error) {
            console.error('[classService] getStudentClasses failed:', error)
            return []
        }
    },

    // Enrol student in class (Join)
    async enrolStudent(classId: string, studentId: string, studentName: string, studentEmail: string): Promise<void> {
        // This is usually done by the student using a join code
        // But if the teacher adds them, we might need a different endpoint
        console.warn('enrolStudent (Join) should ideally be done via join code')
    },

    // Join class by code
    async joinClass(joinCode: string): Promise<void> {
        try {
            await apiClient.post('/classes/join', { joinCode })
        } catch (error) {
            console.error('[classService] joinClass failed:', error)
            throw error
        }
    },

    // Remove student from class
    async removeStudent(classId: string, studentId: string): Promise<void> {
        // Backend needs an endpoint for this if not present
        console.warn('removeStudent endpoint not implemented on backend')
    },

    // Get students enrolled in a class
    async getClassStudents(classId: string): Promise<StudentInClass[]> {
        try {
            const response = await apiClient.get(`/classes/${classId}/students`)
            return response.data.students.map((s: any) => ({
                uid: s._id,
                name: s.name,
                email: s.email,
                addedAt: s.createdAt
            }))
        } catch (error) {
            console.error('[classService] getClassStudents failed:', error)
            return []
        }
    },

    // Update class (Assignments, Announcements, etc.)
    async updateClass(classId: string, updateData: any): Promise<Class> {
        try {
            const response = await apiClient.put(`/classes/${classId}`, updateData)
            const cls = response.data.class
            return {
                ...cls,
                id: cls._id,
                name: cls.className,
                studentCount: cls.students?.length || 0
            }
        } catch (error) {
            console.error('[classService] updateClass failed:', error)
            throw error
        }
    }
}
