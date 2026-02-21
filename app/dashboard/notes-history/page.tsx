'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import NotesHistory from '@/components/dashboard/NotesHistory'
import { FiFileText } from 'react-icons/fi'

export default function NotesHistoryPage() {
    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <FiFileText className="text-emerald-500 text-2xl" />
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                My Study Notes
                            </h1>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl font-medium">
                            Your personalized library of AI-generated study materials. Deepen your understanding and review key concepts anytime.
                        </p>
                    </div>
                </div>

                <NotesHistory />
            </div>
        </ProtectedRoute>
    )
}
