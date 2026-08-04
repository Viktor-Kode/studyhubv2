'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import ProtectedRoute from '@/components/ProtectedRoute'
import NotesHistory from '@/components/dashboard/NotesHistory'
import { FiFileText } from 'react-icons/fi'
import BackButton from '@/components/BackButton'
import BottomNav from '@/components/dashboard/MobileBottomNav'

function NotesHistoryContent() {
    const searchParams = useSearchParams()
    const isDetailView = !!searchParams.get('id')

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
            {!isDetailView && (
                <>
                    <div className="mb-4">
                        <BackButton label="Back" href="/dashboard/student" />
                    </div>
                    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FiFileText className="text-emerald-500 text-2xl" />
                                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                    My Study Notes
                                </h1>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl font-medium">
                                Your personalized collection of AI-generated study materials. Deepen your understanding and review key concepts anytime.
                            </p>
                        </div>
                    </div>
                </>
            )}

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            }>
                <NotesHistory />
            </Suspense>
            <BottomNav />
        </div>
    )
}

export default function NotesHistoryPage() {
    return (
        <ProtectedRoute>
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            }>
                <NotesHistoryContent />
            </Suspense>
        </ProtectedRoute>
    )
}
