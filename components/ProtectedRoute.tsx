'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import type { AppRole } from '@/lib/firebase-auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** If provided, only users with one of these roles can view the content */
  allowedRoles?: AppRole[]
  /** If true, unauthenticated guest visitors can view the page */
  allowGuest?: boolean
}

/**
 * ProtectedRoute
 * Waits for Firebase's onAuthStateChanged (via Zustand) to settle before
 * deciding to render, redirect, or show a role-mismatch redirect.
 */
export default function ProtectedRoute({ children, allowedRoles, allowGuest = false }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return // still waiting for Firebase

    if (!isAuthenticated || !user) {
      if (allowGuest) return // guests allowed
      router.replace('/auth/login')
      return
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student')
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, allowGuest, router])

  // Keep the page layout present while Firebase restores the signed-in user.
  if (isLoading) {
    return (
      <div
        className="min-h-screen w-full bg-[#f6f7fb] p-4 sm:p-6 dark:bg-[#0a0e1a]"
        role="status"
        aria-label="Loading page"
        aria-busy="true"
      >
        <span className="sr-only">Loading page</span>
        <div className="mx-auto max-w-6xl animate-pulse space-y-6 motion-reduce:animate-none">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-44 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-64 max-w-[70vw] rounded-md bg-slate-200/80 dark:bg-slate-800/80" />
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-24 rounded-2xl bg-white dark:bg-[#111a2e]" />
            <div className="hidden h-24 rounded-2xl bg-white dark:bg-[#111a2e] sm:block" />
            <div className="hidden h-24 rounded-2xl bg-white dark:bg-[#111a2e] sm:block" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-h-[280px] rounded-2xl bg-white p-5 dark:bg-[#111a2e] sm:min-h-[360px]">
              <div className="mb-6 h-5 w-40 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded-md bg-slate-100 dark:bg-slate-800/80" />
                <div className="h-4 w-11/12 rounded-md bg-slate-100 dark:bg-slate-800/80" />
                <div className="h-4 w-4/5 rounded-md bg-slate-100 dark:bg-slate-800/80" />
                <div className="mt-7 h-28 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
              </div>
            </div>
            <div className="hidden min-h-[280px] rounded-2xl bg-white p-5 dark:bg-[#111a2e] lg:block">
              <div className="mb-6 h-5 w-32 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-4">
                <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
                <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
                <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render children until we confirm auth + role, unless guests are allowed
  if (!isAuthenticated || !user) {
    if (allowGuest) return <>{children}</>
    return null
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) return null

  return <>{children}</>
}
