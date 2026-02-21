'use client'

import { Suspense } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import QuestionBank from '@/components/dashboard/QuestionBank'

export default function QuestionBankPage() {
  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Question Bank
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-generated practice questions based on your syllabus
          </p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <QuestionBank />
        </Suspense>
      </div>
    </ProtectedRoute>
  )
}
