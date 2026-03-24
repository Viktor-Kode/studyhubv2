'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { apiClient } from '@/lib/api/client'
import { Search, Users } from 'lucide-react'

interface LoginUser {
  _id: string
  name?: string
  email: string
  role?: string
  lastSeen?: string
  isVerified?: boolean
}

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
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          page: String(page),
          limit: '25',
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
  }, [page, search])

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950/95 py-6 px-4 flex flex-col items-center">
        <div className="w-full max-w-6xl space-y-6">
          <BackButton label="Back to Admin Dashboard" href="/dashboard/admin" />
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Dashboard Login History</h1>
            <div className="px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{total}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 mb-4">
              <Search className="w-4 h-4 text-slate-400" />
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
                      <tr key={u._id} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
                        <td className="py-2 pr-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{u.name || 'Unknown'}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{u.email}</div>
                        </td>
                        <td className="py-2 px-4">{u.role || 'student'}</td>
                        <td className="py-2 px-4">{u.isVerified ? 'Yes' : 'No'}</td>
                        <td className="py-2 px-4">{formatDateTime(u.lastSeen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <div className="text-sm text-slate-500 py-4">No login activity found.</div>}
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
      </div>
    </ProtectedRoute>
  )
}

