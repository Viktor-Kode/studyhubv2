'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import StudyPlanner from '@/components/dashboard/StudyPlanner'

export default function StudyPlannerPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8 px-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Study Planner
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Smart scheduling tailored to your goals and exams
          </p>
        </div>
        <StudyPlanner />
      </div>
    </ProtectedRoute>
  )
}
