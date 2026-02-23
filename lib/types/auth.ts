export type AppRole = 'student' | 'teacher' | 'admin'

export interface AppUser {
    uid: string
    email: string
    name: string
    role: AppRole
    avatar?: string
    provider?: 'google' | 'password'
}
