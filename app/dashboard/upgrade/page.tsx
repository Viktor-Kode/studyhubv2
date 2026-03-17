 'use client'

import { useEffect } from 'react'

export default function DashboardUpgradeRedirectPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = '/upgrade?plan=teacher'
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-11 h-11 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-3" />
      <p className="text-gray-600 text-sm font-medium">
        Redirecting you to the teacher upgrade page...
      </p>
    </div>
  )
}

