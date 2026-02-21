'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import ProgressAnalytics from '@/components/dashboard/ProgressAnalytics'
import { FiBarChart2 } from 'react-icons/fi'

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <FiBarChart2 className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Progress Analytics
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Track your study habits, quiz performance, and learning milestones
          </p>
        </div>
        <ProgressAnalytics />
      </div>
    </ProtectedRoute>
  )
}
