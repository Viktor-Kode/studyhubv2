export type AppRole = 'student' | 'teacher' | 'admin'

export interface AppUser {
    uid: string
    email: string
    name: string
    schoolName?: string
    /** Class / level, e.g. SS2, 100 Level */
    classLevel?: string
    role: AppRole
    avatar?: string
    provider?: 'google' | 'password'
    preferences?: {
        hideTourButton?: boolean
        hideChatbot?: boolean
    }
    notificationsEnabled?: boolean
    plan?: {
        type: 'free' | 'starter' | 'growth' | 'premium'
        testsAllowed: number
        testsUsed: number
        aiExplanationsAllowed: number
        aiExplanationsUsed: number
        subjectsAllowed: string[]
        allSubjects: boolean
        expiresAt: string | null
    }
}
