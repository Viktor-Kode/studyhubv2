export type AppRole = 'student' | 'teacher' | 'admin'

export interface AppUser {
    uid: string
    email: string
    name: string
    role: AppRole
    avatar?: string
    provider?: 'google' | 'password'
    preferences?: {
        hideTourButton?: boolean
        hideChatbot?: boolean
    }
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
