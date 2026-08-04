'use client'
import { Suspense } from 'react'

import ProtectedRoute from '@/components/ProtectedRoute'
import NotesHistory from '@/components/dashboard/NotesHistory'
import BottomNav from '@/components/dashboard/MobileBottomNav'

export default function NotesHistoryPage() {
    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                }>
                    <NotesHistory />
                </Suspense>
                <BottomNav />
            </div>
        </ProtectedRoute>
    )
}
