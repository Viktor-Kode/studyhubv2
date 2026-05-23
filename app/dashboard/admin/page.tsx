'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'react-hot-toast'
import { confirmToast } from '@/lib/utils/confirm'
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
  Zap,
  Lock,
  TrendingUp,
  Smartphone,
} from 'lucide-react'
import { FiThumbsUp, FiThumbsDown } from 'react-icons/fi'
import Link from 'next/link'
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
    pwa: number
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
  analytics?: {
    subjectMastery: any[]
    killerQuestions: any[]
    streakDistribution: any[]
    subBreakdown: any[]
    flaggedExplanations: any[]
    contentBreakdown: any[]
    examTypesBreakdown: any[]
    featurePopularity: any[]
  }
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
  isPWA?: boolean
}

interface FeedItem {
  type: string
  time: string
  message: string
  plan?: string | null
  status?: string
  icon: string
}

interface OnlineUserItem {
  _id: string
  name?: string
  email?: string
  lastSeen?: string
  subscriptionPlan?: string | null
  subscriptionStatus?: string
  avatar?: string
  role?: string
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
      const ok = await confirmToast(`You are about to send a REAL email to ${count} users. Are you sure?`, {
        title: 'Send Mass Email',
        confirmText: 'Send Now',
        variant: 'danger'
      })
      if (!ok) return
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

      <div className="mb-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl flex items-center justify-between transition-all hover:border-indigo-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-indigo-900 dark:text-indigo-100">Infrastructure Debugger</h3>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium">Test API connectivity and preview system templates.</p>
          </div>
        </div>
        <Link 
          href="/dashboard/admin/email-test" 
          className="text-xs font-bold bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          Verify Resend
        </Link>
      </div>

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
  onlineUsers,
  monitoringFeed,
  monitoringLoading,
}: {
  stats: DashboardStatsV2
  onGoActivity: () => void
  onlineUsers: OnlineUserItem[]
  monitoringFeed: FeedItem[]
  monitoringLoading: boolean
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
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">PWA Users (Installed)</span>
          <span className="admin-kpi-value">{stats.users.pwa?.toLocaleString() || 0}</span>
          <span className="admin-kpi-sub">Mobile/Desktop apps</span>
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
              <strong>Total AI Prompts (Global):</strong> {(stats.aiUsageTotal ?? 0).toLocaleString()}
            </li>
            <li>
              <strong>Teacher tool runs:</strong> {teacherToolsUsed.toLocaleString()}
            </li>
          </ul>
        </div>
      </div>

      <div className="admin-grid-charts-2 mt-4">
        <div className="admin-card-v2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="admin-chart-title-v2">Site Change Monitor</h3>
            <button
              type="button"
              className="text-xs text-indigo-600 font-semibold"
              onClick={onGoActivity}
            >
              Open full activity
            </button>
          </div>
          {monitoringLoading && monitoringFeed.length === 0 ? (
            <p className="text-sm text-slate-500">Loading changes...</p>
          ) : monitoringFeed.length === 0 ? (
            <p className="text-sm text-slate-500">No recent platform changes recorded.</p>
          ) : (
            <div className="space-y-2">
              {monitoringFeed.slice(0, 8).map((item, i) => (
                <div
                  key={`${item.type}-${item.time}-${i}`}
                  className="p-2 rounded-lg border border-slate-100 bg-slate-50/60"
                >
                  <p className="text-sm font-semibold text-slate-700 m-0">{item.message}</p>
                  <p className="text-xs text-slate-500 m-0 mt-1">
                    {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card-v2">
          <h3 className="admin-chart-title-v2">Online Right Now</h3>
          <p className="text-xs text-slate-500 mb-3">Active in the last 5 minutes (admin accounts excluded)</p>
          {monitoringLoading && onlineUsers.length === 0 ? (
            <p className="text-sm text-slate-500">Checking online users...</p>
          ) : onlineUsers.length === 0 ? (
            <p className="text-sm text-slate-500">No users currently online.</p>
          ) : (
            <div className="space-y-2">
              {onlineUsers.map((u) => (
                <div key={u._id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate m-0">{u.email || 'Unknown user'}</p>
                    <p className="text-xs text-slate-500 m-0">
                      {u.subscriptionStatus === 'active' ? (u.subscriptionPlan || 'active') : 'free'}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">
                    {u.lastSeen ? formatDistanceToNow(new Date(u.lastSeen), { addSuffix: true }) : 'just now'}
                  </span>
                </div>
              ))}
            </div>
          )}
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
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null)
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
      toast.error('Export failed')
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
        toast.error(res.data?.error || 'Failed')
      }
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed')
    }
  }

  const toggleVerified = async (user: AdminUserRow) => {
    try {
      await apiClient.patch(`/admin/users/${user._id}/verify`, { isVerified: !user.isVerified })
      load()
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiClient.delete(`/admin/users/${deleteTarget._id}`)
      if (res.data?.success) {
        toast.success('User deleted successfully')
        onRefreshUsers()
        load()
      } else {
        toast.error(res.data?.error || 'Failed to delete user')
      }
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete user')
    }
    setDeleteTarget(null)
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
              <th className="hidden lg:table-cell">Joined</th>
              <th>PWA</th>
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
                  <td className="hidden lg:table-cell">
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td>
                    {u.isPWA ? (
                      <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1 w-fit">
                        <Zap size={10} fill="currentColor" /> YES
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium text-[10px]">No</span>
                    )}
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
                              setDeleteTarget(u)
                            }}
                          >
                            Delete User
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

      {deleteTarget && (
        <div
          className="admin-modal-v2-overlay"
          onClick={() => setDeleteTarget(null)}
          role="presentation"
        >
          <div className="admin-modal-v2" onClick={(e) => e.stopPropagation()} role="dialog">
            <h3>Delete user?</h3>
            <p>
              {deleteTarget.name || deleteTarget.email} will be permanently deleted from the database along with all progress, stats, and leaderboard entries.
            </p>
            <div className="admin-modal-actions-v2">
              <button type="button" className="cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={confirmDelete}>
                Delete
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

interface AdminTransaction {
  _id: string
  userId?: {
    name?: string
    email?: string
  } | null
  reference: string
  amount: number
  plan: string
  status: string
  createdAt: string
}

function RevenueTab({
  stats,
  onGoActivity,
}: {
  stats: DashboardStatsV2
  onGoActivity: () => void
}) {
  const weekly12 = (stats.revenue.weekly || []).slice(-12)
  const pieData = (stats.revenue.byPlan || []).filter((p) => p.total > 0)

  // Payment History State
  const [txList, setTxList] = useState<AdminTransaction[]>([])
  const [txTotal, setTxTotal] = useState(0)
  const [txPages, setTxPages] = useState(1)
  const [txPage, setTxPage] = useState(1)
  const [txSearch, setTxSearch] = useState('')
  const [txPlan, setTxPlan] = useState('')
  const [txStatus, setTxStatus] = useState('success') // default to success
  const [txSort, setTxSort] = useState('newest')
  const [txLoading, setTxLoading] = useState(false)

  const loadPayments = useCallback(() => {
    const params = new URLSearchParams({
      page: String(txPage),
      limit: '50',
      sort: txSort,
      status: txStatus,
    })
    if (txSearch.trim()) params.append('search', txSearch.trim())
    if (txPlan) params.append('plan', txPlan)

    setTxLoading(true)
    apiClient
      .get(`/admin/payment-history?${params}`)
      .then((res) => {
        if (res.data?.success) {
          setTxList(res.data.transactions || [])
          setTxTotal(res.data.total || 0)
          setTxPages(res.data.pages || 1)
        }
      })
      .catch(() => setTxList([]))
      .finally(() => setTxLoading(false))
  }, [txPage, txSearch, txPlan, txStatus, txSort])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const formatTxAmount = (amount: number) => {
    return `₦${Math.round(amount || 0).toLocaleString('en-NG')}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30">
            Success
          </span>
        )
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-tight bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30">
            Failed
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-tight bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30">
            Pending
          </span>
        )
    }
  }

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

      {/* Payment History Header */}
      <div className="flex flex-wrap items-center gap-3 mt-6 mb-2">
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 dark:bg-indigo-950/40 dark:border-indigo-900/30">
          <DollarSign size={18} className="text-indigo-600 dark:text-indigo-400" />
          <span className="font-black text-indigo-700 text-sm dark:text-indigo-400">Payment History</span>
          <span className="ml-1 bg-indigo-600 text-white text-xs font-black rounded-full px-2 py-0.5 dark:bg-indigo-500">
            {txTotal.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-tight max-w-sm dark:text-slate-400">
          Filter, search, and view all system transactions and payments by users.
        </p>
      </div>

      {/* Toolbar */}
      <div className="admin-users-toolbar-v2">
        <div className="grow">
          <div className="admin-search-v2">
            <Search size={16} className="text-slate-400" />
            <input
              placeholder="Search user name or email…"
              value={txSearch}
              onChange={(e) => {
                setTxSearch(e.target.value)
                setTxPage(1)
              }}
            />
          </div>
        </div>
        <select
          className="admin-select-v2"
          value={txPlan}
          onChange={(e) => {
            setTxPlan(e.target.value)
            setTxPage(1)
          }}
        >
          <option value="">All plans</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="addon">Addon</option>
        </select>
        <select
          className="admin-select-v2"
          value={txStatus}
          onChange={(e) => {
            setTxStatus(e.target.value)
            setTxPage(1)
          }}
        >
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="all">All statuses</option>
        </select>
        <select
          className="admin-select-v2"
          value={txSort}
          onChange={(e) => {
            setTxSort(e.target.value)
            setTxPage(1)
          }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <button type="button" className="refresh-btn" onClick={loadPayments} disabled={txLoading}>
          <RefreshCw size={14} className={txLoading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="admin-card-v2" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <table className="admin-table-v2">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Reference</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {txLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32 }}>
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <RefreshCw size={18} className="animate-spin text-indigo-500" />
                    Loading payment history…
                  </div>
                </td>
              </tr>
            ) : txList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32 }}>
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <DollarSign size={28} className="opacity-30" />
                    <p className="text-sm font-semibold">No payments found</p>
                    {(txSearch || txPlan || txStatus !== 'success') && (
                      <p className="text-xs">Try clearing your search or changing filters.</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              txList.map((t) => (
                <tr key={t._id}>
                  <td>
                    {t.userId ? (
                      <div>
                        <span className="font-bold block text-slate-800 dark:text-slate-200">
                          {t.userId.name || '—'}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono leading-tight">
                          {t.userId.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unknown User</span>
                    )}
                  </td>
                  <td>
                    <span className={`plan-badge-v2 ${t.plan || 'free'}`}>
                      {t.plan || 'Free'}
                    </span>
                  </td>
                  <td className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatTxAmount(t.amount)}
                  </td>
                  <td>{getStatusBadge(t.status)}</td>
                  <td className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {t.reference || '—'}
                  </td>
                  <td className="text-xs text-slate-500 dark:text-slate-400">
                    {t.createdAt
                      ? format(new Date(t.createdAt), 'MMM d, yyyy h:mm a')
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {txPages > 1 && (
        <div className="admin-pagination" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="page-btn"
            onClick={() => setTxPage((p) => Math.max(1, p - 1))}
            disabled={txPage === 1 || txLoading}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-300 font-semibold">
            Page {txPage} of {txPages}
          </span>
          <button
            type="button"
            className="page-btn"
            onClick={() => setTxPage((p) => Math.min(txPages, p + 1))}
            disabled={txPage >= txPages || txLoading}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
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

function PaywallEventsTab() {
  const [data, setData] = useState<{
    events: any[]
    totalCount: number
    dailyStats: any[]
    hottestLeads: any[]
    pagination: any
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get(`/admin/paywall-events?page=${page}&limit=50`)
      if (res.data?.success) setData(res.data.data)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  if (!data && loading) return <p className="text-slate-500">Loading events…</p>

  const events = data?.events || []
  const daily = data?.dailyStats || []
  const leads = data?.hottestLeads || []

  return (
    <div className="space-y-6">
      <div className="admin-grid-kpi-4">
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Total Paywall Hits</span>
          <span className="admin-kpi-value">{data?.totalCount?.toLocaleString() || 0}</span>
          <span className="admin-kpi-sub">Lifetime across all users</span>
        </div>
        <div className="admin-kpi-card">
          <span className="admin-kpi-label">Hottest Leads</span>
          <span className="admin-kpi-value">{leads.length}</span>
          <span className="admin-kpi-sub">Users with multiple hits</span>
        </div>
      </div>

      <div className="admin-grid-charts-2">
        <div className="admin-card-v2">
          <h3 className="admin-chart-title-v2">Daily Paywall Hits (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily}>
              <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#EF4444" fill="#FEF2F2" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-card-v2">
          <h3 className="admin-chart-title-v2">Hottest Leads (Repeat Hits)</h3>
          <div className="space-y-2 overflow-y-auto max-h-[200px] pr-2">
            {leads.length === 0 && <p className="text-xs text-slate-500">No repeat hits yet.</p>}
            {leads.map((lead, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-100">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{lead._id}</p>
                  <p className="text-xs text-slate-500">
                    Last hit: {formatDistanceToNow(new Date(lead.lastHit), { addSuffix: true })}
                  </p>
                </div>
                <span className="px-2 py-1 bg-red-600 text-white text-xs font-black rounded-full">
                  {lead.hitCount} hits
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-card-v2" style={{ padding: 0 }}>
        <h3 className="admin-chart-title-v2 p-5 pb-0">Raw Paywall Events</h3>
        <table className="admin-table-v2">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Context</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="text-center p-8 text-slate-500">No events recorded.</td>
              </tr>
            )}
            {events.map((ev, i) => (
              <tr key={ev._id || i}>
                <td>
                  <span className="font-bold block">{ev.userEmail}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{ev.userId}</span>
                </td>
                <td>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-bold uppercase tracking-tight">
                    {ev.action?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>
                  <div className="text-xs text-slate-600">
                    {ev.context?.subject && <span className="block italic">Subject: {ev.context.subject}</span>}
                    {ev.context?.examType && <span className="block italic">Exam: {ev.context.examType}</span>}
                    {ev.context?.planType && <span className="block italic">Plan: {ev.context.planType}</span>}
                    {!ev.context?.subject && !ev.context?.examType && <span className="text-slate-400">—</span>}
                  </div>
                </td>
                <td className="text-xs text-slate-500">
                  {formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <button
          type="button"
          className="page-btn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft size={16} />
        </button>
        <span>Page {page} of {data?.pagination?.totalPages || 1}</span>
        <button
          type="button"
          className="page-btn"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= (data?.pagination?.totalPages || 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Tab: PWA Users ──────────────────────────────────────────────────────────

function PWAUsersTab({ onViewProfile }: { onViewProfile: (u: AdminUserRow) => void }) {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: '25', sort })
    if (search) params.append('search', search)
    if (planFilter) params.append('plan', planFilter)
    setLoading(true)
    apiClient
      .get(`/admin/pwa-users?${params}`)
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

  useEffect(() => { load() }, [load])

  return (
    <div>
      {/* Header strip */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <Smartphone size={18} className="text-emerald-600" />
          <span className="font-black text-emerald-700 text-sm">PWA Installs</span>
          <span className="ml-1 bg-emerald-600 text-white text-xs font-black rounded-full px-2 py-0.5">
            {total.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-tight max-w-sm">
          Users who opened the app in standalone / installed mode — <code className="bg-slate-100 px-1 rounded">isPWA: true</code> is set on first launch.
        </p>
      </div>

      {/* Toolbar */}
      <div className="admin-users-toolbar-v2">
        <div className="grow">
          <div className="admin-search-v2">
            <Search size={16} className="text-slate-400" />
            <input
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>
        <select
          className="admin-select-v2"
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
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
          onChange={(e) => { setSort(e.target.value); setPage(1) }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
        </select>
        <button type="button" className="refresh-btn" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div className="admin-card-v2" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <table className="admin-table-v2">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th className="hidden lg:table-cell">Last Seen</th>
              <th className="hidden lg:table-cell">Joined</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32 }}>
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Smartphone size={18} className="animate-pulse text-emerald-500" />
                    Loading PWA users…
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32 }}>
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Smartphone size={28} className="opacity-30" />
                    <p className="text-sm font-semibold">No PWA users found</p>
                    {(search || planFilter) && (
                      <p className="text-xs">Try clearing your filters.</p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id}>
                  <td className="font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 shrink-0"
                        title="PWA Installed"
                      >
                        <Smartphone size={11} />
                      </span>
                      {u.name || '—'}
                    </div>
                  </td>
                  <td className="text-slate-600">{u.email}</td>
                  <td>
                    <span className={`plan-badge-v2 ${planBadgeKey(u)}`}>{planBadgeLabel(u)}</span>
                    {u.banned && <span className="ml-2 text-xs font-bold text-red-600">BANNED</span>}
                    {u.isVerified && <span className="ml-2 text-xs font-bold text-emerald-700">✓</span>}
                  </td>
                  <td className="hidden lg:table-cell text-xs text-slate-500">
                    {u.lastSeen
                      ? formatDistanceToNow(new Date(u.lastSeen), { addSuffix: true })
                      : '—'}
                  </td>
                  <td className="hidden lg:table-cell text-xs text-slate-500">
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-xs text-indigo-600 font-bold hover:underline"
                      onClick={() => onViewProfile(u)}
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="admin-pagination" style={{ marginTop: 16 }}>
        <button
          type="button"
          className="page-btn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          <ChevronLeft size={16} />
        </button>
        <span>Page {page} of {pages} ({total.toLocaleString()} installs)</span>
        <button
          type="button"
          className="page-btn"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= pages}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

const SIDEBAR = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'pwa', label: 'PWA Users', icon: Smartphone },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'paywall', label: 'Paywall Events', icon: Lock },
  { id: 'campaigns', label: 'Campaigns', icon: Mail },
  { id: 'analytics', label: 'Platform Analytics', icon: TrendingUp },
] as const

const EMPTY_STATS: DashboardStatsV2 = {
  users: { total: 0, today: 0, week: 0, month: 0, paid: 0, free: 0, teachers: 0, pwa: 0 },
  revenue: { total: 0, week: 0, month: 0, byPlan: [], weekly: [] },
  cbt: { total: 0, week: 0, avgScore: 0 },
  library: { files: 0, storage: 0, byRole: [] },
  failedPayments: 0,
  topStudents: [],
  userGrowth: [],
  teacherToolTotals: {},
  aiUsageTotal: 0,
}

function AdminAnalyticsTab({ stats }: { stats: DashboardStatsV2 | null }) {
  if (!stats || !stats.analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Activity className="animate-pulse text-4xl mb-4 text-blue-500" />
        <p className="font-bold">Aggregating advanced platform analytics...</p>
        <p className="text-xs mt-1">This might take a few seconds as we parse CBT attempts, AI logs, and file schemas.</p>
      </div>
    )
  }

  const {
    subjectMastery = [],
    killerQuestions = [],
    streakDistribution = [],
    subBreakdown = [],
    flaggedExplanations = [],
    contentBreakdown = [],
    featurePopularity = []
  } = stats.analytics;

  // Format subject mastery data for Recharts
  const masteryData = subjectMastery.map((item: any) => ({
    name: item._id || 'Unknown',
    Accuracy: Math.round(item.avgScore || 0),
    Attempts: item.count || 0
  })).sort((a: any, b: any) => a.Accuracy - b.Accuracy) // lowest first

  // Format streak data
  const streakData = ['0 day', '1-2 days', '3-6 days', '7+ days'].map(range => {
    const found = streakDistribution.find((item: any) => item._id === range)
    return {
      name: range,
      value: found ? found.count : 0
    }
  })

  // Format sub breakdown data
  const subData = subBreakdown.map((item: any) => ({
    name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Free',
    value: item.count || 0
  }))

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Platform Analytics</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Deep-dive aggregate telemetry for student performance, monetization, and system quality control.</p>
        </div>
      </div>

      {/* Row 1: Academic Health Heatmap & Feature Popularity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Mastery */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">Global Subject Mastery</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Average CBT score per subject. Lower scores represent higher struggle subjects.</p>
          </div>
          <div className="h-[300px] w-full">
            {masteryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={masteryData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={10} width={100} />
                  <Tooltip
                    contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="Accuracy" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                    {masteryData.map((entry: any, index: number) => {
                      let fill = '#EF4444' // Struggle (< 45%)
                      if (entry.Accuracy >= 70) fill = '#10B981'
                      else if (entry.Accuracy >= 45) fill = '#F59E0B'
                      return <Cell key={`cell-${index}`} fill={fill} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">No mastery logs recorded yet.</div>
            )}
          </div>
        </div>

        {/* Feature Popularity */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">Feature Engagement Matrix</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Platforms tools ranked by total volume of database records / actions.</p>
          </div>
          <div className="h-[300px] w-full">
            {featurePopularity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featurePopularity} margin={{ top: 10, bottom: 20, left: 10, right: 10 }}>
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={9} interval={0} angle={-15} textAnchor="end" />
                  <YAxis stroke="#9CA3AF" fontSize={10} />
                  <Tooltip
                    contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-400">No feature interactions registered.</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Streak Distribution & Monetization Churn */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Streak Distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">Streak Retention Funnel</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Bucket breakdown of active consecutive study streaks.</p>
          </div>
          <div className="h-[220px] flex items-center justify-center my-3 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={streakData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {streakData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
            {streakData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription Conversion / Status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">Subscription Split</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Active vs Expired plans. Key indicator of churn.</p>
          </div>
          <div className="h-[220px] flex items-center justify-center my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {subData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PLAN_PIE_COLORS[entry.name.toLowerCase()] || COLORS[index + 2]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
            {subData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLAN_PIE_COLORS[item.name.toLowerCase()] || COLORS[idx + 2] }}></span>
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Formats */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">Uploads Content Split</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Breakdown of uploaded study guides by format and size.</p>
          </div>
          <div className="space-y-3 my-4 overflow-y-auto max-h-[220px] pr-1">
            {contentBreakdown.length > 0 ? (
              contentBreakdown.map((item: any, idx: number) => (
                <div key={item._id} className="flex justify-between items-center p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      {item._id || 'unknown'}
                    </span>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{item.count} Files</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{formatBytes(item.size)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-gray-400">No files uploaded.</div>
            )}
          </div>
          <div className="text-[10px] uppercase font-bold text-gray-400 text-center border-t border-gray-100 dark:border-gray-800 pt-2.5">
            Total files indexed: {contentBreakdown.reduce((sum: number, i: any) => sum + i.count, 0)}
          </div>
        </div>
      </div>

      {/* Row 3: Killer Questions */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
          <div>
            <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">"Killer Questions" Analytics</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Past questions with exceptionally high student fail rates. Helps diagnose wrong answer keys or poor explanations.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          {killerQuestions.length > 0 ? (
            <table className="w-full text-left text-xs font-medium text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Question Concept</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3 text-center">Attempts</th>
                  <th className="px-4 py-3 text-center">Fails</th>
                  <th className="px-4 py-3 text-center rounded-r-xl">Fail Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {killerQuestions.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition duration-150">
                    <td className="px-4 py-3 font-semibold max-w-sm truncate text-gray-900 dark:text-white" title={item.question}>
                      {item.question}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400">
                        {item.subject || 'general'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{item.attempts}</td>
                    <td className="px-4 py-3 text-center font-bold text-red-500">{item.fails}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        {Math.round(item.failRate)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-xs text-gray-400">No questions failed yet. Keep monitoring!</div>
          )}
        </div>
      </div>

      {/* Row 4: AI Explanations Quality Control */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div>
          <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">AI Explanations Quality Flag Board</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Explanations flagged by users with downvotes. Review the exact logic generation for accuracy.</p>
        </div>
        <div className="mt-4 space-y-4">
          {flaggedExplanations.length > 0 ? (
            flaggedExplanations.map((item: any) => (
              <div key={item._id} className="p-4 rounded-xl border border-rose-100 dark:border-rose-950/40 bg-rose-50/10 dark:bg-rose-950/5 space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                      FLAGGED
                    </span>
                    {item.subject && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        {item.subject}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                    <span className="flex items-center gap-1 text-emerald-500"><FiThumbsUp /> {item.upvotes || 0}</span>
                    <span className="flex items-center gap-1 text-rose-500"><FiThumbsDown /> {item.downvotes || 0}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-800 dark:text-gray-200">
                  <p className="font-black uppercase text-[10px] text-gray-400 tracking-wider mb-1">Question:</p>
                  <p className="font-semibold italic bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">{item.questionText}</p>
                </div>
                <div className="text-xs text-gray-800 dark:text-gray-200">
                  <p className="font-black uppercase text-[10px] text-gray-400 tracking-wider mb-1">AI Explanation:</p>
                  <p className="p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 leading-relaxed font-medium">{item.explanation}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-gray-400">100% Quality rating! Zero explanations flagged. Excellent!</div>
          )}
        </div>
      </div>
    </div>
  )
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
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserItem[]>([])
  const [monitoringFeed, setMonitoringFeed] = useState<FeedItem[]>([])
  const [monitoringLoading, setMonitoringLoading] = useState(false)

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
    await Promise.all([fetchDashboard(), fetchMonitoring()])
    setLastRefreshed(new Date())
    setTimeout(() => setRefreshing(false), 600)
  }

  const fetchMonitoring = async () => {
    setMonitoringLoading(true)
    try {
      const [onlineRes, feedRes] = await Promise.all([
        apiClient.get('/admin/online-users'),
        apiClient.get('/admin/activity-feed', { params: { limit: 12, offset: 0 } }),
      ])

      setOnlineUsers((onlineRes.data?.users || []).filter((u: OnlineUserItem) => u.role !== 'admin'))
      setMonitoringFeed(feedRes.data?.feed || [])
    } catch {
      setOnlineUsers([])
      setMonitoringFeed([])
    } finally {
      setMonitoringLoading(false)
    }
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
    Promise.all([fetchDashboard(), fetchMonitoring()]).finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    const id = setInterval(() => {
      void fetchMonitoring()
    }, 30000)
    return () => clearInterval(id)
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
            <OverviewTab
              stats={stats}
              onGoActivity={() => setActiveTab('activity')}
              onlineUsers={onlineUsers}
              monitoringFeed={monitoringFeed}
              monitoringLoading={monitoringLoading}
            />
          )}
          {activeTab === 'users' && (
            <UsersTab
              onViewProfile={(u) => setSelectedUser(u)}
              onRefreshUsers={fetchDashboard}
            />
          )}
          {activeTab === 'pwa' && (
            <PWAUsersTab onViewProfile={(u) => setSelectedUser(u)} />
          )}
          {activeTab === 'revenue' && (
            <RevenueTab stats={stats} onGoActivity={() => setActiveTab('activity')} />
          )}
          {activeTab === 'activity' && <ActivityTab />}
          {activeTab === 'paywall' && <PaywallEventsTab />}
          {activeTab === 'campaigns' && <AdminCampaignsTab />}
          {activeTab === 'analytics' && <AdminAnalyticsTab stats={stats} />}
        </main>

        {selectedUser && (
          <UserActivityDrawer userId={selectedUser._id} onClose={() => setSelectedUser(null)} />
        )}
      </div>
    </ProtectedRoute>
  )
}
