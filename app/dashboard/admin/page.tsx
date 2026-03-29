'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Activity,
  Mail,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  RefreshCw,
  MoreHorizontal,
  Download,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAuthStore } from '@/lib/store/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { apiClient } from '@/lib/api/client'
import { PLANS } from '@/lib/config/plans'
import { UserActivityDrawer } from '@/components/admin/UserActivityDrawer'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardStatsV2 {
  users: {
    total: number
    today: number
    week: number
    month: number
    paid: number
    free: number
    teachers: number
  }
  revenue: {
    total: number
    week: number
    month: number
    byPlan: Array<{ _id: string; total: number; count: number }>
    weekly: Array<{ _id: string; y: number; w: number; total: number; count: number }>
  }
  cbt: { total: number; week: number; avgScore: number }
  library: {
    files: number
    storage: number
    byRole: Array<{ _id: string; bytes: number; files: number }>
  }
  failedPayments: number
  topStudents: Array<{
    userId: string
    xp: number
    level: number
    levelName?: string
    user?: {
      name?: string
      email?: string
      subscriptionPlan?: string | null
      role?: string
    } | null
  }>
  userGrowth: Array<{ _id: string; count: number }>
  teacherToolTotals: Record<string, number>
  aiUsageTotal: number
}

interface AdminUserRow {
  _id: string
  name?: string
  email: string
  subscriptionStatus?: string
  subscriptionPlan?: string | null
  subscriptionEnd?: string
  createdAt: string
  role?: string
  phoneNumber?: string
  teacherPlan?: string
  banned?: boolean
  isVerified?: boolean
}

interface FeedItem {
  type: string
  time: string
  message: string
  plan?: string | null
  status?: string
  icon: string
}

const PLAN_PIE_COLORS: Record<string, string> = {
  daily: '#EA580C',
  weekly: '#3B82F6',
  monthly: '#10B981',
  addon: '#F59E0B',
  teacher: '#8B5CF6',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nairaFromKobo(kobo: number): string {
  return `₦${Math.round((kobo || 0) / 100).toLocaleString('en-NG')}`
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${u[i]}`
}

function fillUserGrowth(raw: Array<{ _id: string; count: number }>, days = 30) {
  const map = new Map(raw.map((r) => [r._id, r.count]))
  const out: Array<{ _id: string; count: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    out.push({ _id: key.slice(5), count: map.get(key) || 0 })
  }
  return out
}

function planBadgeKey(u: AdminUserRow): 'free' | 'daily' | 'weekly' | 'monthly' | 'teacher' {
  if (u.role === 'teacher') return 'teacher'
  if (u.subscriptionStatus === 'active' && u.subscriptionPlan === 'daily') return 'daily'
  if (u.subscriptionStatus === 'active' && u.subscriptionPlan === 'weekly') return 'weekly'
  if (u.subscriptionStatus === 'active' && u.subscriptionPlan === 'monthly') return 'monthly'
  return 'free'
}

function planBadgeLabel(u: AdminUserRow): string {
  const k = planBadgeKey(u)
  if (k === 'teacher') return 'Teacher'
  if (k === 'daily') return 'Daily'
  if (k === 'weekly') return 'Weekly'
  if (k === 'monthly') return 'Monthly'
  return 'Free'
}

// ─── Email Campaigns (unchanged API) ─────────────────────────────────────────

function AdminCampaignsTab() {
  const [audiences, setAudiences] = useState<Record<string, { count: number; label: string }> | null>(
    null
  )
  const [form, setForm] = useState({
    campaignType: 'upgrade_students',
    targetAudience: 'free_students',
    subject: '',
    testMode: true,
    testEmail: '',
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{
    results: { sent: number; failed: number }
    message: string
  } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiClient
      .get('/admin/email-stats')
      .then((res) => {
        if (res.data?.success) setAudiences(res.data.audiences || {})
      })
      .catch(() => setAudiences({}))
  }, [])

  const handleSend = async () => {
    if (!form.testMode) {
      const count = audiences?.[form.targetAudience]?.count ?? 0
      const confirmed = window.confirm(
        `You are about to send a REAL email to ${count} users.\n\nAre you sure?`
      )
      if (!confirmed) return
    }

    setSending(true)
    setError('')
    setResult(null)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)

      const res = await apiClient.post('/admin/email-campaign', form, {
        signal: controller.signal,
      })

      clearTimeout(timeout)
      if (res.data?.success) setResult(res.data)
      else setError(res.data?.error || 'Failed')
    } catch (err: unknown) {
      const message =
        (err as { name?: string }).name === 'CanceledError'
          ? 'Request timed out while sending emails. Please try again.'
          : (err as Error).message || 'Failed'
      setError(message)
    } finally {
      setSending(false)
    }
  }

  const selectedAudience = audiences?.[form.targetAudience]

  return (
    <div className="campaigns-tab max-w-[700px]">
      <h2 className="campaigns-title text-xl font-bold mb-5">Email Campaigns</h2>

      {audiences && (
        <div className="audience-stats grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mb-6">
          {Object.entries(audiences).map(([key, val]) => (
            <button
              key={key}
              type="button"
              className={`audience-card p-4 rounded-xl border-2 text-center cursor-pointer transition-all ${
                form.targetAudience === key
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setForm((p) => ({ ...p, targetAudience: key }))}
            >
              <span className="block text-2xl font-black text-indigo-600">{val.count}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">{val.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="campaign-form bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Campaign Type</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'upgrade_students', label: 'Student Upgrade', desc: 'Upgrade to Weekly/Monthly' },
              { value: 'upgrade_teachers', label: 'Teacher Upgrade', desc: 'Upgrade to Teacher plan' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  form.campaignType === opt.value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
                onClick={() => setForm((p) => ({ ...p, campaignType: opt.value }))}
              >
                <span className="block font-bold text-sm">{opt.label}</span>
                <span className="block text-xs text-gray-500">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email Subject (leave blank for default)</label>
          <input
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            placeholder={
              form.campaignType === 'upgrade_students'
                ? "You're missing out — upgrade your StudyHelp plan"
                : 'Unlock all Teacher Tools on StudyHelp'
            }
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          />
        </div>

        {selectedAudience && (
          <div className="flex items-center gap-2 flex-wrap text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <span>This will send to</span>
            <strong className="text-indigo-600">{selectedAudience.count} users</strong>
            <span>({selectedAudience.label})</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm">
            <input
              type="checkbox"
              checked={form.testMode}
              onChange={(e) => setForm((p) => ({ ...p, testMode: e.target.checked }))}
              className="rounded"
            />
            {form.testMode ? 'Test Mode (send to 1 email only)' : 'Live Mode (send to all)'}
          </label>
        </div>

        {form.testMode && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Test Email (leave blank to use your admin email)
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              placeholder="your@email.com"
              value={form.testEmail}
              onChange={(e) => setForm((p) => ({ ...p, testEmail: e.target.value }))}
            />
          </div>
        )}

        {!form.testMode && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-amber-800 dark:text-amber-200 text-sm">
            <strong>Live Mode</strong> — this will send real emails to{' '}
            <strong>{selectedAudience?.count ?? 0} users</strong>. Test first.
          </div>
        )}

        {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg">{error}</div>}

        {result && (
          <div className="flex items-center gap-5 flex-wrap p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <div className="text-center">
              <span className="block text-3xl font-black text-emerald-600">{result.results.sent}</span>
              <span className="text-sm">Delivered</span>
            </div>
            <div className="text-center">
              <span className="block text-3xl font-black text-red-600">{result.results.failed}</span>
              <span className="text-sm">Failed</span>
            </div>
            <p className="text-sm text-emerald-800 dark:text-emerald-200 flex-1">{result.message}</p>
          </div>
        )}

        <button
          type="button"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl mt-2"
          onClick={handleSend}
          disabled={sending}
        >
          {sending
            ? 'Sending emails...'
            : form.testMode
              ? 'Send Test Email'
              : `Send to ${selectedAudience?.count ?? 0} Users`}
        </button>
      </div>
    </div>
  )
}

// ─── Tab: Overview ───────────────────────────────────────────────────────────

function OverviewTab({
  stats,
  onGoActivity,
}: {
  stats: DashboardStatsV2
  onGoActivity: () => void
}) {
  const paidPct =
    stats.users.total > 0 ? Math.round((stats.users.paid / stats.users.total) * 1000) / 10 : 0
  const growthChart = fillUserGrowth(stats.userGrowth || [], 30)
  const weeklyBars = (stats.revenue.weekly || []).slice(-8)
  const teacherToolsUsed = Object.values(stats.teacherToolTotals || {}).reduce((a, b) => a + b, 0)
  const capBytes = 500 * 1024 * 1024
  const storagePct = Math.min(100, ((stats.library.storage || 0) / capBytes) * 100)

  return (
    <div>
      <div className="admin-grid-kpi-4">
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Total Users</span>
          <span className="admin-kpi-value">{stats.users.total.toLocaleString()}</span>
          <span className="admin-kpi-badge">+{stats.users.today} today</span>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Total Revenue</span>
          <span className="admin-kpi-value">{nairaFromKobo(stats.revenue.total)}</span>
          <span className="admin-kpi-sub">This week: {nairaFromKobo(stats.revenue.week)}</span>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">CBT Tests Taken</span>
          <span className="admin-kpi-value">{stats.cbt.total.toLocaleString()}</span>
          <span className="admin-kpi-sub">Avg score: {stats.cbt.avgScore}%</span>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Active Paid Users</span>
          <span className="admin-kpi-value">{stats.users.paid.toLocaleString()}</span>
          <span className="admin-kpi-sub">{paidPct}% of all users</span>
        </div>
      </div>

      <div className="admin-grid-charts-2">
        <div className="admin-chart-card-v2">
          <h3 className="admin-chart-title-v2">User Growth (30 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={growthChart}>
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#5B4CF5"
                fill="#EEF2FF"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="admin-chart-card-v2">
          <h3 className="admin-chart-title-v2">Weekly Revenue (8 weeks)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyBars}>
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => nairaFromKobo(v)} />
              <Bar dataKey="total" fill="#5B4CF5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-overview-row-3">
        <div className="admin-card-v2">
          <h3 className="admin-chart-title-v2">Top Students</h3>
          <div className="flex flex-col gap-2">
            {(stats.topStudents || []).length === 0 && (
              <p className="text-sm text-slate-500">No progress data yet.</p>
            )}
            {(stats.topStudents || []).map((s, i) => (
              <div
                key={`${s.userId}-${i}`}
                className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0"
              >
                <div className="min-w-0">
                  <span className="font-bold text-slate-800 block truncate">
                    {s.user?.name || s.user?.email || s.userId}
                  </span>
                  <span className="text-xs text-slate-500">{s.xp.toLocaleString()} XP</span>
                </div>
                <span className="plan-badge-v2 teacher shrink-0">Lv {s.level}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card-v2">
          <h3 className="admin-chart-title-v2">Library</h3>
          <p className="admin-kpi-value text-2xl">{stats.library.files.toLocaleString()} files</p>
          <p className="admin-kpi-sub mb-1">{formatBytes(stats.library.storage)} used</p>
          <div className="storage-bar-track">
            <div className="storage-bar-fill" style={{ width: `${storagePct}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">vs 500 MB reference scale</p>
          <div className="mt-4 space-y-2">
            {(stats.library.byRole || []).map((r) => (
              <div key={r._id} className="flex justify-between text-sm">
                <span className="text-slate-600 capitalize">{r._id}</span>
                <span className="font-semibold text-slate-800">
                  {r.files} files · {formatBytes(r.bytes)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card-v2">
          <h3 className="admin-chart-title-v2">Quick Stats</h3>
          <ul className="space-y-2 text-sm text-slate-700 m-0 p-0 list-none">
            <li>
              <strong>Teacher accounts:</strong> {stats.users.teachers}
            </li>
            <li>
              <strong>Failed payments:</strong>{' '}
              <span className={stats.failedPayments > 0 ? 'text-red-600 font-bold' : ''}>
                {stats.failedPayments}
              </span>{' '}
              {stats.failedPayments > 0 && (
                <button
                  type="button"
                  className="text-indigo-600 font-bold underline ml-1"
                  onClick={onGoActivity}
                >
                  View activity
                </button>
              )}
            </li>
            <li>
              <strong>Library files:</strong> {stats.library.files}
            </li>
            <li>
              <strong>AI usage (sum):</strong> {(stats.aiUsageTotal ?? 0).toLocaleString()} prompts
            </li>
            <li>
              <strong>Teacher tool runs:</strong> {teacherToolsUsed.toLocaleString()}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Users ──────────────────────────────────────────────────────────────

function UsersTab({
  onViewProfile,
  onRefreshUsers,
}: {
  onViewProfile: (u: AdminUserRow) => void
  onRefreshUsers: () => void
}) {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [banTarget, setBanTarget] = useState<AdminUserRow | null>(null)
  const [freeTarget, setFreeTarget] = useState<AdminUserRow | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<AdminUserRow | null>(null)
  type FreeGiftPlanKey = 'daily' | 'weekly' | 'monthly'
  const [freeGiftPlan, setFreeGiftPlan] = useState<FreeGiftPlanKey>('monthly')
  const [freeDays, setFreeDays] = useState(30)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [])

  useEffect(() => {
    if (!freeTarget) return
    setFreeGiftPlan('monthly')
    setFreeDays(PLANS.monthly.durationDays ?? 30)
  }, [freeTarget])

  const load = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      sort,
    })
    if (search) params.append('search', search)
    if (planFilter) params.append('plan', planFilter)

    setLoading(true)
    apiClient
      .get(`/admin/users?${params}`)
      .then((res) => {
        if (res.data?.success) {
          setUsers(res.data.users || [])
          setTotal(res.data.total || 0)
          setPages(res.data.pages || 1)
        }
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [page, search, planFilter, sort])

  useEffect(() => {
    load()
  }, [load])

  const exportCsv = async () => {
    try {
      const res = await apiClient.get('/admin/export-csv', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'studyhelp_users.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Export failed')
    }
  }

  const quickAction = async (
    action: 'ban_user' | 'give_free_access' | 'revoke_gifted_access',
    userId: string,
    extra?: { days?: number; plan?: FreeGiftPlanKey }
  ) => {
    try {
      const res = await apiClient.post('/admin/quick-action', {
        action,
        userId,
        data: extra || {},
      })
      if (res.data?.success) {
        onRefreshUsers()
        load()
      } else {
        alert(res.data?.error || 'Failed')
      }
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed')
    }
  }

  const toggleVerified = async (user: AdminUserRow) => {
    try {
      await apiClient.patch(`/admin/users/${user._id}/verify`, { isVerified: !user.isVerified })
      load()
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed')
    }
  }

  const confirmBan = async () => {
    if (!banTarget) return
    await quickAction('ban_user', banTarget._id)
    setBanTarget(null)
  }

  const confirmFree = async () => {
    if (!freeTarget) return
    await quickAction('give_free_access', freeTarget._id, { days: freeDays, plan: freeGiftPlan })
    setFreeTarget(null)
  }

  const confirmRevokeGift = async () => {
    if (!revokeTarget) return
    await quickAction('revoke_gifted_access', revokeTarget._id)
    setRevokeTarget(null)
  }

  const hasActiveStudentPlan = (u: AdminUserRow) =>
    u.subscriptionStatus === 'active' &&
    (u.subscriptionPlan === 'daily' ||
      u.subscriptionPlan === 'weekly' ||
      u.subscriptionPlan === 'monthly')

  return (
    <div>
      <div className="admin-users-toolbar-v2">
        <div className="grow">
          <div className="admin-search-v2">
            <Search size={16} className="text-slate-400" />
            <input
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
        <select
          className="admin-select-v2"
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="teacher">Teachers</option>
        </select>
        <select
          className="admin-select-v2"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value)
            setPage(1)
          }}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name A–Z</option>
        </select>
        <button type="button" className="refresh-btn" onClick={exportCsv}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="admin-card-v2" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table-v2">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Exam Type</th>
              <th>Joined</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                  Loading…
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id}>
                  <td className="font-semibold">{u.name || '—'}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`plan-badge-v2 ${planBadgeKey(u)}`}>{planBadgeLabel(u)}</span>
                    {u.banned && (
                      <span className="ml-2 text-xs font-bold text-red-600">BANNED</span>
                    )}
                    {u.isVerified && (
                      <span className="ml-2 text-xs font-bold text-emerald-700">VERIFIED</span>
                    )}
                  </td>
                  <td className="text-slate-500">—</td>
                  <td>
                    {new Date(u.createdAt).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td>
                    <div className="admin-menu-wrap" ref={menuOpen === u._id ? menuRef : undefined}>
                      <button
                        type="button"
                        className="admin-kebab"
                        aria-label="Actions"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpen(menuOpen === u._id ? null : u._id)
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {menuOpen === u._id && (
                        <div className="admin-dropdown-v2">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(null)
                              void toggleVerified(u)
                            }}
                          >
                            {u.isVerified ? 'Remove Verification' : 'Mark as Verified'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(null)
                              setFreeTarget(u)
                            }}
                          >
                            Give Free Access
                          </button>
                          {hasActiveStudentPlan(u) && (
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(null)
                                setRevokeTarget(u)
                              }}
                            >
                              Cancel gifted access
                            </button>
                          )}
                          <button
                            type="button"
                            className="danger"
                            onClick={() => {
                              setMenuOpen(null)
                              setBanTarget(u)
                            }}
                          >
                            Ban User
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpen(null)
                              onViewProfile(u)
                            }}
                          >
                            View Profile
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination" style={{ marginTop: 16 }}>
        <button
          type="button"
          className="page-btn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft size={16} />
        </button>
        <span>
          Page {page} of {pages} ({total} users)
        </span>
        <button
          type="button"
          className="page-btn"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= pages}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {banTarget && (
        <div
          className="admin-modal-v2-overlay"
          onClick={() => setBanTarget(null)}
          role="presentation"
        >
          <div className="admin-modal-v2" onClick={(e) => e.stopPropagation()} role="dialog">
            <h3>Ban user?</h3>
            <p>
              {banTarget.name || banTarget.email} will be marked as banned. You can unban from the API
              or database if needed.
            </p>
            <div className="admin-modal-actions-v2">
              <button type="button" className="cancel" onClick={() => setBanTarget(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={confirmBan}>
                Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {freeTarget && (
        <div
          className="admin-modal-v2-overlay"
          onClick={() => setFreeTarget(null)}
          role="presentation"
        >
          <div className="admin-modal-v2" onClick={(e) => e.stopPropagation()} role="dialog">
            <h3>Give free access</h3>
            <p>
              Choose which plan limits to apply (daily / weekly / monthly), then how long access lasts.
              Defaults match each plan length (1, 7, or 30 days); you can override the duration.
            </p>
            <label className="text-sm font-bold text-slate-600">Plan tier</label>
            <select
              className="admin-select-v2 w-full mt-1 mb-3"
              value={freeGiftPlan}
              onChange={(e) => {
                const p = e.target.value as FreeGiftPlanKey
                setFreeGiftPlan(p)
                const d = PLANS[p].durationDays ?? 1
                setFreeDays(d)
              }}
            >
              <option value="daily">Daily (weekly-class limits, default 1 day)</option>
              <option value="weekly">Weekly limits (default 7 days)</option>
              <option value="monthly">Monthly limits (default 30 days)</option>
            </select>
            <label className="text-sm font-bold text-slate-600">Duration (days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={freeDays}
              onChange={(e) => setFreeDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
            <div className="admin-modal-actions-v2">
              <button type="button" className="cancel" onClick={() => setFreeTarget(null)}>
                Cancel
              </button>
              <button type="button" className="confirm" onClick={confirmFree}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {revokeTarget && (
        <div
          className="admin-modal-v2-overlay"
          onClick={() => setRevokeTarget(null)}
          role="presentation"
        >
          <div className="admin-modal-v2" onClick={(e) => e.stopPropagation()} role="dialog">
            <h3>Cancel gifted access?</h3>
            <p>
              {revokeTarget.name || revokeTarget.email} will lose their active student plan (daily,
              weekly, or monthly) immediately and return to the free tier. Only use this if you granted
              access by
              mistake. If they paid for a plan, check their payments before continuing.
            </p>
            <div className="admin-modal-actions-v2">
              <button type="button" className="cancel" onClick={() => setRevokeTarget(null)}>
                Back
              </button>
              <button type="button" className="danger" onClick={confirmRevokeGift}>
                Remove access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Revenue ────────────────────────────────────────────────────────────

function RevenueTab({
  stats,
  onGoActivity,
}: {
  stats: DashboardStatsV2
  onGoActivity: () => void
}) {
  const weekly12 = (stats.revenue.weekly || []).slice(-12)
  const pieData = (stats.revenue.byPlan || []).filter((p) => p.total > 0)

  return (
    <div className="space-y-4">
      <div className="admin-grid-kpi-4">
        <div className="admin-kpi-card" style={{ gridColumn: 'span 2' }}>
          <span className="admin-kpi-label">Total Revenue</span>
          <span className="admin-kpi-value">{nairaFromKobo(stats.revenue.total)}</span>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">This Week</span>
          <span className="admin-kpi-value text-2xl">{nairaFromKobo(stats.revenue.week)}</span>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">This Month</span>
          <span className="admin-kpi-value text-2xl">{nairaFromKobo(stats.revenue.month)}</span>
        </div>
      </div>

      {stats.failedPayments > 0 && (
        <div className="admin-failed-alert">
          {stats.failedPayments} failed payment{stats.failedPayments !== 1 ? 's' : ''} recorded.
          <button type="button" onClick={onGoActivity}>
            Review in Activity
          </button>
        </div>
      )}

      <div className="admin-grid-charts-2">
        <div className="admin-chart-card-v2">
          <h3 className="admin-chart-title-v2">Revenue by Plan</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="total"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={78}
                label={(props) => String((props as { name?: string }).name ?? '')}
              >
                {pieData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={PLAN_PIE_COLORS[entry._id] || '#94A3B8'}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => nairaFromKobo(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="admin-chart-card-v2">
          <h3 className="admin-chart-title-v2">Weekly Revenue (12 weeks)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekly12}>
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => nairaFromKobo(v)} />
              <Bar dataKey="total" fill="#5B4CF5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Activity feed ──────────────────────────────────────────────────────

function ActivityTab() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/admin/activity-feed', { params: { limit: 20, offset: 0 } })
      setItems(res.data?.feed || [])
      setHasMore(!!res.data?.hasMore)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  useEffect(() => {
    const id = setInterval(loadInitial, 30000)
    return () => clearInterval(id)
  }, [loadInitial])

  const loadMore = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/admin/activity-feed', {
        params: { limit: 20, offset: items.length },
      })
      const feed = res.data?.feed || []
      setItems((prev) => [...prev, ...feed])
      setHasMore(!!res.data?.hasMore)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {loading && items.length === 0 ? (
        <p className="text-slate-500">Loading feed…</p>
      ) : (
        items.map((item, i) => (
          <div
            key={`${item.type}-${item.time}-${i}`}
            className={`activity-item-v2 ${item.type === 'signup' ? 'signup' : item.type === 'failed_payment' ? 'failed_payment' : 'payment'}`}
          >
            <span className="text-xl" aria-hidden>
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 m-0">{item.message}</p>
              <p className="text-xs text-slate-500 m-0 mt-1">
                {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))
      )}
      {hasMore && (
        <button
          type="button"
          className="refresh-btn mt-4"
          onClick={loadMore}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

const SIDEBAR = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'campaigns', label: 'Campaigns', icon: Mail },
] as const

const EMPTY_STATS: DashboardStatsV2 = {
  users: { total: 0, today: 0, week: 0, month: 0, paid: 0, free: 0, teachers: 0 },
  revenue: { total: 0, week: 0, month: 0, byPlan: [], weekly: [] },
  cbt: { total: 0, week: 0, avgScore: 0 },
  library: { files: 0, storage: 0, byRole: [] },
  failedPayments: 0,
  topStudents: [],
  userGrowth: [],
  teacherToolTotals: {},
  aiUsageTotal: 0,
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStatsV2 | null>(null)
  const [activeTab, setActiveTab] = useState<(typeof SIDEBAR)[number]['id']>('overview')
  const [loading, setLoading] = useState(true)
  const [notAdmin, setNotAdmin] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(() => new Date())
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)

  const fetchDashboard = async () => {
    try {
      const res = await apiClient.get('/admin/dashboard-stats')
      if (res.data && !res.data.error) {
        setStats(res.data as DashboardStatsV2)
        setApiError(null)
      } else {
        setStats(EMPTY_STATS)
        setApiError('Invalid dashboard response')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number }; message?: string }
      const status = axiosErr.response?.status
      setStats(EMPTY_STATS)
      if (status === 403) setNotAdmin(true)
      else if (status === 401) setApiError('Session expired. Please log in again.')
      else setApiError(axiosErr.message || 'Failed to load dashboard stats')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboard()
    setLastRefreshed(new Date())
    setTimeout(() => setRefreshing(false), 600)
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    if (user.role !== 'admin') {
      setNotAdmin(true)
      setLoading(false)
      return
    }
    fetchDashboard().finally(() => setLoading(false))
  }, [user])

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="admin-loading">Verifying access...</div>
      </ProtectedRoute>
    )
  }
  if (notAdmin) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="admin-denied">
          <Shield size={40} color="#EF4444" />
          <h2>Access Denied</h2>
          <p>You do not have admin access.</p>
          <button type="button" className="back-to-site" onClick={() => router.push('/dashboard')}>
            Go Back
          </button>
        </div>
      </ProtectedRoute>
    )
  }
  if (!stats) return <div className="admin-loading">Loading...</div>

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="admin-layout-v2">
        <aside className="admin-sidebar-v2">
          {SIDEBAR.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                className={`admin-sidebar-item-v2 ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <Icon size={18} />
                {t.label}
              </button>
            )
          })}
        </aside>

        <main className="admin-content-v2">
          <BackButton label="Dashboard" href="/dashboard" />
          {apiError && <div className="admin-api-error">{apiError}</div>}

          <div className="admin-topbar-v2">
            <div>
              <h1>Admin Dashboard</h1>
              <p>StudyHelp platform overview</p>
            </div>
            <div className="admin-topbar-actions">
              <span className="last-refreshed">
                Updated{' '}
                {lastRefreshed.toLocaleTimeString('en-NG', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <button
                type="button"
                className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw size={16} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
              <span className="admin-badge">
                <Shield size={14} /> Admin
              </span>
              <button type="button" className="back-to-site" onClick={() => router.push('/dashboard')}>
                Back to Site
              </button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <OverviewTab stats={stats} onGoActivity={() => setActiveTab('activity')} />
          )}
          {activeTab === 'users' && (
            <UsersTab
              onViewProfile={(u) => setSelectedUser(u)}
              onRefreshUsers={fetchDashboard}
            />
          )}
          {activeTab === 'revenue' && (
            <RevenueTab stats={stats} onGoActivity={() => setActiveTab('activity')} />
          )}
          {activeTab === 'activity' && <ActivityTab />}
          {activeTab === 'campaigns' && <AdminCampaignsTab />}
        </main>

        {selectedUser && (
          <UserActivityDrawer userId={selectedUser._id} onClose={() => setSelectedUser(null)} />
        )}
      </div>
    </ProtectedRoute>
  )
}
