'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { useRoleVerification } from '@/hooks/useRoleVerification'
import Layout from './layout/Layout'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('teacher' | 'student')[]
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()
  const { isVerifying } = useRoleVerification()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated) {
        router.push('/login')
        return
      }

      // Wait for role verification to complete
      if (isVerifying) {
        return
      }

      // If role-based protection is specified
      if (allowedRoles && allowedRoles.length > 0) {
        if (!user?.role || !allowedRoles.includes(user.role)) {
          // Redirect based on user role from backend
          if (user?.role === 'teacher') {
            router.push('/dashboard/teacher')
          } else {
            router.push('/dashboard')
          }
          return
        }
      }

      // Auto-redirect based on role for main dashboard routes
      if (pathname === '/dashboard' && user?.role === 'teacher') {
        router.push('/dashboard/teacher')
        return
      }

      if (pathname?.startsWith('/dashboard/teacher') && user?.role === 'student') {
        router.push('/dashboard')
        return
      }

      setIsChecking(false)
    }

    checkAccess()
  }, [isAuthenticated, user, allowedRoles, router, pathname, isVerifying])

  if (!isAuthenticated || isChecking || isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return <Layout>{children}</Layout>
}
