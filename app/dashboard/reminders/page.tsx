'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import StudyReminders from '@/components/dashboard/StudyReminders'

export default function RemindersPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Study Reminders
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your study schedule, exams, and deadlines efficiently with automated notifications.
          </p>
        </div>

        <StudyReminders />

      </div>
    </ProtectedRoute>
  )
}
