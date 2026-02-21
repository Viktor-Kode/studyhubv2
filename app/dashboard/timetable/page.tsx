
'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import TimetableReminders from '@/components/dashboard/TimetableReminders'
import { FiCalendar } from 'react-icons/fi'

export default function TimetablePage() {
  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <FiCalendar className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Timetable & Reminders
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your study schedule with smart reminders via WhatsApp, email, and browser notifications
          </p>
        </div>

        <TimetableReminders />
      </div>
    </ProtectedRoute>
  )
}
