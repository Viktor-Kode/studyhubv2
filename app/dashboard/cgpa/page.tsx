'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import CGPACalculator from '@/components/dashboard/CGPACalculator'

export default function CGPAPage() {
  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            CGPA Calculator
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Calculate and track your academic performance
          </p>
        </div>
        <CGPACalculator />
      </div>
    </ProtectedRoute>
  )
}
