
'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import TimetableReminders from '@/components/dashboard/TimetableReminders'
import BottomNav from '@/components/dashboard/MobileBottomNav'

export default function TimetablePage() {
  return (
    <ProtectedRoute>
      <div className="px-4 md:px-6 pb-24">
        <div className="mb-4">
          <BackButton label="Back" href="/dashboard/student" />
        </div>
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
            Timetable & Reminders
          </h1>
          <p className="text-sm font-medium text-slate-400">
            Manage your study schedule & task reminders
          </p>
        </div>

        <TimetableReminders />
        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
