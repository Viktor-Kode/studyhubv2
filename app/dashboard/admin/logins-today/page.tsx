'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { apiClient } from '@/lib/api/client'
import { Clock, Users, Shield, Loader2, AlertTriangle, UserX } from 'lucide-react'

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
      <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-950 py-8 px-4 flex flex-col items-center">
        <div className="logins-container">
          {/* Back Button */}
          <BackButton label="Back to Admin Dashboard" href="/dashboard/admin" />

          {/* Header */}
          <div className="logins-header mt-6">
            <div className="logins-header-left">
              <div className="logins-icon-badge">
                <Clock size={20} />
              </div>
              <div className="logins-header-title">
                <p className="text-[11px] font-bold tracking-wider uppercase text-indigo-500 mb-0.5">
                  Admin · Activity
                </p>
                <h1>Users who logged in today</h1>
                <div className="sub">Based on the last time their token was verified today.</div>
              </div>
            </div>
            <div className="logins-header-badge">
              <Users size={14} />
              <span>{users.length}</span>
              <span className="opacity-70 font-normal">today</span>
            </div>
          </div>

          {/* Main Card */}
          <div className="logins-card">
            {loading && (
              <div className="py-8 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-indigo-600" /> Loading today&apos;s logins...
              </div>
            )}

            {!loading && error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-600 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && users.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400 flex flex-col items-center gap-2">
                <UserX size={24} className="text-slate-400" />
                <p>No users have logged in yet today.</p>
              </div>
            )}

            {!loading && !error && users.length > 0 && (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-left text-sm border-collapse min-w-[480px]">
                  <thead>
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3 pr-3 text-left">User</th>
                      <th className="py-3 px-3 text-left">Plan</th>
                      <th className="py-3 px-3 text-left">Role</th>
                      <th className="py-3 pl-3 text-left">Last login time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => {
                      const isActive = u.subscriptionStatus === 'active'
                      const planLabel = isActive ? (u.subscriptionPlan || 'active') : (u.subscriptionStatus || 'free')
                      return (
                        <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 pr-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {u.name || u.email.split('@')[0]}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {u.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`logins-plan-badge ${isActive ? 'active' : ''}`}>
                              {planLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="logins-role-tag">
                              {u.role || 'student'}
                            </span>
                          </td>
                          <td className="py-3 pl-3 text-slate-600 dark:text-slate-300 font-medium">
                            {formatTime(u.lastSeen)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-6 text-xs text-slate-400 text-center border-t border-slate-200 dark:border-slate-800 pt-4 flex items-center justify-center gap-1.5">
            <Shield size={14} className="text-indigo-500" />
            <span>Admin · StudyHelp · Today&apos;s logins are updated in real-time.</span>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

