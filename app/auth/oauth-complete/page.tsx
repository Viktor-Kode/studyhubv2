'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { saveUserRole } from '@/lib/firebase-auth'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { FiLoader } from 'react-icons/fi'

export default function OAuthCompletePage() {
    const router = useRouter()
    const { user, setUser, isLoading } = useAuthStore()

    useEffect(() => {
        if (isLoading) return
        if (!user) {
            router.replace('/auth/login')
            return
        }

        let cancelled = false
        const completeProfile = async () => {
            try {
                const profile = await getDoc(doc(db, 'users', user.uid))
                if (!profile.exists() || !profile.data().role) {
                    const name = user.name || user.email?.split('@')[0] || 'User'
                    await saveUserRole(user.uid, 'student', name, user.email || undefined)
                    if (!cancelled) setUser({ ...user, role: 'student', name })
                }
                if (!cancelled) router.replace('/dashboard/student')
            } catch {
                if (!cancelled) router.replace('/dashboard/student')
            }
        }

        void completeProfile()
        return () => { cancelled = true }
    }, [isLoading, user, router, setUser])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="text-center">
                <FiLoader className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Setting up your account…</p>
            </div>
        </div>
    )
}
