'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import QuestionHistory from '@/components/dashboard/QuestionHistory'
import { FaHistory } from 'react-icons/fa'

export default function QuestionHistoryPage() {
    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <FaHistory className="text-amber-500 text-2xl" />
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                Question History
                            </h1>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl font-medium">
                            Review all the AI-generated practice questions you've created. Stay consistent and keep practicing!
                        </p>
                    </div>
                </div>

                <QuestionHistory />
            </div>
        </ProtectedRoute>
    )
}
