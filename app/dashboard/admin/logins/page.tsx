'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { UserActivityDrawer } from '@/components/admin/UserActivityDrawer'
import { apiClient } from '@/lib/api/client'
import { Search, Users } from 'lucide-react'

interface LoginUser {
  _id: string
  name?: string
  email: string
  role?: string
  lastSeen?: string
  isVerified?: boolean
  subscriptionPlan?: string | null
  subscriptionStatus?: string
  avatar?: string
}

const PERIODS = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
] as const

type Period = (typeof PERIODS)[number]['value']

const formatDateTime = (iso?: string) => {
  if (!iso) return '–'
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DashboardLoginsPage() {
  const [users, setUsers] = useState<LoginUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<Period>('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          page: String(page),
          limit: '25',
          period,
        })
        if (search.trim()) params.append('search', search.trim())
        const res = await apiClient.get(`/admin/dashboard-logins?${params}`)
        if (!alive) return
        const data = res.data || {}
        setUsers(data.users || [])
        setPages(data.pages || 1)
        setTotal(data.total || 0)
      } finally {
        if (!alive) return
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [page, search, period])

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950/95 py-6 px-4 flex flex-col items-center">
        <div className="w-full max-w-6xl space-y-6">
          <BackButton label="Back to Admin Dashboard" href="/dashboard/admin" />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              Dashboard Login History
            </h1>
            <div className="px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{total}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
            Filter by when users were last seen (active). Click a row to open their full profile and activity.
          </p>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      setPeriod(p.value)
                      setPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      period === p.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Search name or email..."
                  className="w-full bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-sm text-slate-500">Loading login history...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2 pr-4 text-left">User</th>
                      <th className="py-2 px-4 text-left">Role</th>
                      <th className="py-2 px-4 text-left">Verified</th>
                      <th className="py-2 px-4 text-left">Last seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setProfileUserId(u._id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setProfileUserId(u._id)
                          }
                        }}
                        className="border-b border-slate-100 dark:border-slate-800 last:border-b-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                      >
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 text-xs font-bold flex items-center justify-center shrink-0">
                                {(u.name || u.email || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {u.name || 'Unknown'}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-4">{u.role || 'student'}</td>
                        <td className="py-2 px-4">{u.isVerified ? 'Yes' : 'No'}</td>
                        <td className="py-2 px-4">{formatDateTime(u.lastSeen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-sm text-slate-500 py-4">No login activity found for this filter.</div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page} of {pages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {profileUserId && (
          <UserActivityDrawer userId={profileUserId} onClose={() => setProfileUserId(null)} />
        )}
      </div>
    </ProtectedRoute>
  )
}
