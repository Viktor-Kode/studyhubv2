'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import StudyTimer from '@/components/dashboard/StudyTimer'

export default function StudyTimerPage() {
  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Study Timer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Pomodoro technique with session tracking
          </p>
        </div>
        <div className="max-w-2xl mx-auto">
          <StudyTimer />
        </div>
      </div>
    </ProtectedRoute>
  )
}
