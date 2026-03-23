'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

/**
 * Legacy route compatibility:
 * Old community entry lived under `/dashboard/student/community`.
 * The new Phase-1 feed/polls/leaderboard lives at `/community`.
 */
export default function CommunityLegacyRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/community')
  }, [router])

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4">
        <div className="text-sm font-bold text-slate-600">Redirecting to Community…</div>
      </div>
    </ProtectedRoute>
  )
}
