'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import StudyReminders from '@/components/dashboard/StudyReminders'

export default function RemindersPage() {
  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Study Reminders
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Never miss deadlines or study sessions
          </p>
        </div>
        <div className="max-w-4xl">
          <StudyReminders />
        </div>
      </div>
    </ProtectedRoute>
  )
}
