'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import type { AppRole } from '@/lib/firebase-auth'
import { FiLoader } from 'react-icons/fi'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** If provided, only users with one of these roles can view the content */
  allowedRoles?: AppRole[]
}

/**
 * ProtectedRoute
 * Waits for Firebase's onAuthStateChanged (via Zustand) to settle before
 * deciding to render, redirect, or show a role-mismatch redirect.
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return // still waiting for Firebase

    if (!isAuthenticated || !user) {
      router.replace('/auth/login')
      return
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student')
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router])

  // Show spinner while waiting for auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FiLoader className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading…</p>
        </div>
      </div>
    )
  }

  // Don't render children until we confirm auth + role
  if (!isAuthenticated || !user) return null
  if (allowedRoles && !allowedRoles.includes(user.role)) return null

  return <>{children}</>
}
