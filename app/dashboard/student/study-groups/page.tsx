'use client'

import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { StudyGroupsTab } from '@/components/community/StudyGroupsTab'
import { useAuthStore } from '@/lib/store/authStore'
import { toast } from 'react-hot-toast'
import '@/app/community/study-groups.css'
import { FileQuestion, FileText, Library, Timer } from 'lucide-react'

export default function StudyGroupsPage() {
  const { user } = useAuthStore()
  const myUid = user?.uid || ''

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center gap-3">
          <BackButton href="/dashboard/student" />
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Study Groups</h1>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/student/notes" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/80 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/40">
            <FileText className="h-4 w-4 text-indigo-600" />
            Shared notes
          </Link>
          <Link href="/dashboard/student/library" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/80 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/40">
            <Library className="h-4 w-4 text-indigo-600" />
            Shared library
          </Link>
          <Link href="/dashboard/student/group-cbt" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/80 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/40">
            <FileQuestion className="h-4 w-4 text-indigo-600" />
            Group CBT
          </Link>
          <Link href="/dashboard/student/pomodoro" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:border-indigo-300 hover:bg-indigo-50/80 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/40">
            <Timer className="h-4 w-4 text-indigo-600" />
            Pomodoro timer
          </Link>
        </div>

        <StudyGroupsTab myUid={myUid} showToast={(message) => toast(message)} />
      </div>
    </ProtectedRoute>
  )
}
