export type AppRole = 'student' | 'teacher' | 'admin'

export type OnboardingStudentType = 'secondary' | 'university' | 'jamb' | 'remedial'

export interface UserOnboarding {
    completed: boolean
    studentType?: OnboardingStudentType
    examType?: string
    examTypes?: string[]
    subjects?: string[]
    goal?: string
    goals?: string[]
    studyHoursPerDay?: string
    completedAt?: string | null
}

export interface UserProgressFlags {
    hasCompletedCBT?: boolean
    hasUsedAITutor?: boolean
    hasUploadedLibrary?: boolean
    hasJoinedCommunity?: boolean
    hasCreatedFlashcard?: boolean
}

export interface AppUser {
    uid: string
    email: string
    name: string
    schoolName?: string
    /** Class / level, e.g. SS2, 100 Level */
    classLevel?: string
    /** Optional: degree / program at university */
    courseOfStudy?: string
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
    onboarding?: UserOnboarding
    progress?: UserProgressFlags
}
