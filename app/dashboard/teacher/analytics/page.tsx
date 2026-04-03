'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiLoader } from 'react-icons/fi'

export default function TeacherAnalyticsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/analytics')
  }, [router])

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
      <FiLoader className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-sm text-gray-600 dark:text-gray-400">Opening analytics…</p>
    </div>
  )
}
