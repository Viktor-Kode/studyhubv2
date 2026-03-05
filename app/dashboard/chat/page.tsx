'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { HiOutlineChat, HiOutlineArrowLeft } from 'react-icons/hi'

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto p-6">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm mb-6"
        >
          <HiOutlineArrowLeft />
          Back to Dashboard
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HiOutlineChat className="text-3xl text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            AI Assistant Chat
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Powered by DeepSeek. This feature is coming soon.
          </p>
          <Link
            href="/dashboard/student"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
          >
            <HiOutlineArrowLeft />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  )
}
