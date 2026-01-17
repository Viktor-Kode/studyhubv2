'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import ProgressAnalytics from '@/components/dashboard/ProgressAnalytics'

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Progress Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visual learning progress dashboard
          </p>
        </div>
        <div className="max-w-2xl">
          <ProgressAnalytics />
        </div>
      </div>
    </ProtectedRoute>
  )
}
