'use client'

import { Suspense } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import QuestionBank from '@/components/dashboard/QuestionBank'

export default function QuestionBankPage() {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="w-full min-w-0 overflow-hidden">
        <div className="mb-8 min-w-0 overflow-hidden">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 break-words">
            Question Bank
          </h1>
          <p className="text-gray-600 dark:text-gray-400 break-words">
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
