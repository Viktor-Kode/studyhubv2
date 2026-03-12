'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { apiClient } from '@/lib/api/client'
import { Clock, Users } from 'lucide-react'

interface TodayLoginUser {
  _id: string
  name?: string
  email: string
  subscriptionStatus?: string
  subscriptionPlan?: string
  role?: string
  lastSeen?: string
}

const formatTime = (iso?: string) => {
  if (!iso) return '–'
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function TodayLoginsPage() {
  const [users, setUsers] = useState<TodayLoginUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTodayLogins = async () => {
      try {
        const res = await apiClient.get('/admin/logins-today')
        if (res.data?.success) {
          setUsers(res.data.users || [])
          setError(null)
        } else {
          setError('Failed to load today\'s logins.')
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.error ||
          err?.message ||
          'Failed to load today\'s logins.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchTodayLogins()
  }, [])

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950/95 py-6 px-4 flex flex-col items-center">
        <div className="w-full max-w-5xl space-y-6">
          <BackButton label="Back to Admin Dashboard" href="/dashboard/admin" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200">
                <Clock className="text-xl" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-500">
                  Admin · Activity
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  Users who logged in today
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Based on the last time their token was verified today.
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{users.length}</span>
              <span className="opacity-80">today</span>
            </div>
          </div>

          {loading && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-500 dark:text-slate-300">
              Loading today&apos;s logins...
            </div>
          )}

          {!loading && error && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-800 p-6 text-sm text-rose-600 dark:text-rose-300">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 md:p-6">
              {users.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No users have logged in yet today.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th className="py-2 pr-4 text-left">User</th>
                        <th className="py-2 px-4 text-left">Plan</th>
                        <th className="py-2 px-4 text-left">Role</th>
                        <th className="py-2 px-4 text-left">Last login time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr
                          key={u._id}
                          className="border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                        >
                          <td className="py-2 pr-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {u.name || 'Unknown'}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {u.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-4 text-slate-700 dark:text-slate-200">
                            {u.subscriptionStatus === 'active'
                              ? (u.subscriptionPlan || 'active')
                              : (u.subscriptionStatus || 'free')}
                          </td>
                          <td className="py-2 px-4 text-slate-700 dark:text-slate-200">
                            {u.role || 'student'}
                          </td>
                          <td className="py-2 px-4 text-slate-700 dark:text-slate-200">
                            {formatTime(u.lastSeen)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

