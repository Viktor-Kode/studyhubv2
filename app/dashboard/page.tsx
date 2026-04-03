'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { FiLoader } from 'react-icons/fi'

export default function DashboardIndex() {
    const router = useRouter()
    const { user, isLoading } = useAuthStore()

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/auth/login')
            } else if (user.role === 'admin') {
                router.push('/dashboard/admin')
            } else if (user.role === 'teacher') {
                router.push('/dashboard/student')
            } else {
                router.push('/dashboard/student')
            }
        }
    }, [user, isLoading, router])

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <FiLoader className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Redirecting to your dashboard...</p>
        </div>
    )
}
