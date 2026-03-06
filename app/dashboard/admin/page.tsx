'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, TrendingUp, BookOpen, Zap, DollarSign, Activity, Award, Clock,
  Search, ChevronLeft, ChevronRight, Shield, Trash2, Gift
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import { auth } from '@/lib/firebase'
import { waitForAuth } from '@/lib/store/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { apiClient } from '@/lib/api/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminStats {
  users: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    activeSubscriptions: number
    weeklyPlans: number
    monthlyPlans: number
    conversionRate: string
  }
  revenue: { total: number; formatted: string }
  activity: {
    totalCBT: number
    cbtToday: number
    totalStudySessions: number
    studySessionsToday: number
    totalFlashcardReviews: number
    activeStreaks: number
    totalNotes: number
  }
  charts: {
    dailySignups: { _id: string; count: number }[]
    topSubjects: { _id: string; count: number; avgAccuracy?: number }[]
  }
  recentUsers: Array<{
    _id: string
    name?: string
    email: string
    subscriptionStatus?: string
    subscriptionPlan?: string
    createdAt: string
    role?: string
  }>
  recentTransactions: Array<{
    _id: string
    amount: number
    plan?: string
    createdAt: string
    userId?: { name?: string; email?: string }
  }>
}

interface AdminUser {
  _id: string
  name?: string
  email: string
  subscriptionStatus?: string
  subscriptionPlan?: string
  subscriptionEnd?: string
  aiUsageCount?: number
  aiUsageLimit?: number
  createdAt: string
  role?: string
  phoneNumber?: string
}

// ─── Metric Card ───────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  color: string
}) {
  return (
    <div className={`metric-card ${color}`}>
      <div className="metric-icon">{icon}</div>
      <div className="metric-info">
        <span className="metric-value">{value}</span>
        <span className="metric-label">{label}</span>
        <span className="metric-sub">{sub}</span>
      </div>
    </div>
  )
}

// ─── Grant Plan Modal ──────────────────────────────────────────────────────────

function GrantPlanModal({
  user,
  onClose,
  onGranted,
}: {
  user: AdminUser
  onClose: () => void
  onGranted: () => void
}) {
  const [plan, setPlan] = useState('monthly')
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(false)

  const handleGrant = async () => {
    setLoading(true)
    try {
      const res = await apiClient.post(`/admin/users/${user._id}/grant-plan`, {
        plan,
        days,
      })
      if (res.data?.success) onGranted()
    } catch (err) {
      alert((err as any)?.response?.data?.error || 'Failed to grant plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Grant Plan to {user.name || 'User'}</h3>
        <p className="modal-email">{user.email}</p>
        <div className="form-group">
          <label>Plan</label>
          <select
            className="settings-input"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="form-group">
          <label>Duration (days)</label>
          <input
            type="number"
            className="settings-input"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value) || 30)}
            min={1}
            max={365}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="save-btn"
            onClick={handleGrant}
            disabled={loading}
          >
            {loading ? 'Granting...' : 'Grant Plan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Users Tab ───────────────────────────────────────────────────────────

function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [grantModal, setGrantModal] = useState<AdminUser | null>(null)

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.append('search', search)
    if (planFilter) params.append('status', planFilter)

    setLoading(true)
    apiClient
      .get(`/admin/users?${params}`)
      .then((res) => {
        setUsers(res.data?.users || [])
        setTotal(res.data?.total || 0)
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [page, search, planFilter])

  const handleDelete = async (userId: string, name?: string) => {
    if (!window.confirm(`Delete user "${name || 'Unknown'}"? This cannot be undone.`))
      return
    try {
      await apiClient.delete(`/admin/users/${userId}`)
      setUsers((u) => u.filter((x) => x._id !== userId))
      setTotal((t) => Math.max(0, t - 1))
    } catch (err) {
      alert((err as any)?.response?.data?.error || 'Failed to delete')
    }
  }

  const pages = Math.ceil(total / 20) || 1

  return (
    <div className="admin-users-tab">
      <div className="users-toolbar">
        <div className="search-wrap">
          <Search size={16} />
          <input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="admin-search"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value)
            setPage(1)
          }}
          className="admin-filter-select"
        >
          <option value="">All Users</option>
          <option value="active">Paid Users</option>
          <option value="free">Free Users</option>
          <option value="expired">Expired</option>
        </select>
        <span className="total-count">{total} users</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>AI Usage</th>
              <th>Joined</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="table-loading">
                  Loading...
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-cell-avatar">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <span className="user-cell-name">{u.name || 'Unknown'}</span>
                        <span className="user-cell-email">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`plan-tag ${u.subscriptionStatus === 'active' ? 'paid' : 'free'}`}
                    >
                      {u.subscriptionPlan || 'free'}
                    </span>
                  </td>
                  <td>
                    <span className="usage-text">
                      {u.aiUsageCount ?? 0}/{u.aiUsageLimit ?? 0}
                    </span>
                  </td>
                  <td className="date-cell">
                    {new Date(u.createdAt).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="date-cell">
                    {u.subscriptionEnd
                      ? new Date(u.subscriptionEnd).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '—'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="action-btn grant"
                        title="Grant Plan"
                        onClick={() => setGrantModal(u)}
                      >
                        <Gift size={14} />
                      </button>
                      <button
                        type="button"
                        className="action-btn delete"
                        title="Delete User"
                        onClick={() => handleDelete(u._id, u.name)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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
        <span>
          Page {page} of {pages}
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

      {grantModal && (
        <GrantPlanModal
          user={grantModal}
          onClose={() => setGrantModal(null)}
          onGranted={() => {
            setGrantModal(null)
            setUsers((u) =>
              u.map((x) =>
                x._id === grantModal._id
                  ? { ...x, subscriptionStatus: 'active', subscriptionPlan: 'monthly' }
                  : x
              )
            )
          }}
        />
      )}
    </div>
  )
}

// ─── Admin Revenue Tab ─────────────────────────────────────────────────────────

function AdminRevenueTab({ stats }: { stats: AdminStats }) {
  return (
    <div className="admin-revenue-tab">
      <div className="admin-metrics">
        <MetricCard
          icon={<DollarSign size={20} />}
          label="Total Revenue"
          value={stats.revenue.formatted}
          sub="all time"
          color="green"
        />
        <MetricCard
          icon={<Users size={20} />}
          label="Paid Users"
          value={stats.users.activeSubscriptions}
          sub={`${stats.users.conversionRate} conversion`}
          color="blue"
        />
        <MetricCard
          icon={<TrendingUp size={20} />}
          label="Weekly Plans"
          value={stats.users.weeklyPlans}
          sub="active"
          color="orange"
        />
        <MetricCard
          icon={<Award size={20} />}
          label="Monthly Plans"
          value={stats.users.monthlyPlans}
          sub="active"
          color="purple"
        />
      </div>
      <div className="admin-card">
        <h3>Recent Transactions</h3>
        <div className="recent-list">
          {stats.recentTransactions.map((t) => (
            <div key={t._id} className="recent-tx-row">
              <div className="tx-info">
                <span className="tx-name">{t.userId?.name || 'Unknown'}</span>
                <span className="tx-email">{t.userId?.email}</span>
              </div>
              <div className="tx-meta">
                <span className="plan-tag paid">{t.plan || '—'}</span>
                <span className="tx-date">
                  {new Date(t.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <span className="tx-amount">
                ₦{typeof t.amount === 'number' ? t.amount.toLocaleString() : '0'}
              </span>
            </div>
          ))}
          {stats.recentTransactions.length === 0 && (
            <p className="empty-state">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Admin Activity Tab ────────────────────────────────────────────────────────

function AdminActivityTab({ stats }: { stats: AdminStats }) {
  return (
    <div className="admin-activity-tab">
      <div className="admin-metrics">
        <MetricCard
          icon={<BookOpen size={20} />}
          label="Total CBT Tests"
          value={stats.activity.totalCBT}
          sub={`${stats.activity.cbtToday} today`}
          color="blue"
        />
        <MetricCard
          icon={<Clock size={20} />}
          label="Study Sessions"
          value={stats.activity.totalStudySessions}
          sub={`${stats.activity.studySessionsToday} today`}
          color="green"
        />
        <MetricCard
          icon={<Zap size={20} />}
          label="Flashcard Reviews"
          value={stats.activity.totalFlashcardReviews}
          sub="all time"
          color="purple"
        />
        <MetricCard
          icon={<Award size={20} />}
          label="Active Streaks"
          value={stats.activity.activeStreaks}
          sub="users on streak"
          color="orange"
        />
      </div>
      <div className="admin-card">
        <h3>Top Subjects by Attempts</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats.charts.topSubjects || []}>
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Attempts" />
            <Bar
              dataKey="avgAccuracy"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              name="Avg Accuracy %"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Main Admin Dashboard ──────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'activity', label: 'Activity' },
]

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [notAdmin, setNotAdmin] = useState(false)

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      try {
        const user = await waitForAuth()
        if (!user) {
          router.replace('/auth/login')
          return
        }
        // Force refresh token to get latest custom claims
        const tokenResult = await user.getIdTokenResult(true)
        const isAdmin = tokenResult.claims.admin === true || tokenResult.claims.role === 'admin';
        if (!isAdmin) {
          setNotAdmin(true)
          setLoading(false)
          return
        }
        // Fetch stats (apiClient already attaches Bearer token)
        const res = await apiClient.get('/admin/stats')
        if (res.data?.success) setStats(res.data.stats)
        else router.replace('/dashboard')
      } catch (err) {
        console.error('Admin check failed:', err)
        router.replace('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    checkAdminAndFetch()
  }, [router])

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
          <button
            type="button"
            className="back-to-site"
            onClick={() => router.push('/dashboard')}
          >
            Go Back
          </button>
        </div>
      </ProtectedRoute>
    )
  }
  if (!stats) return null

  const totalUsers = stats.users.total || 1
  const freeCount = totalUsers - stats.users.activeSubscriptions

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="admin-page">
        <BackButton label="Dashboard" href="/dashboard" />

        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>StudyHelp Platform Overview</p>
          </div>
          <div className="admin-header-right">
            <span className="admin-badge">
              <Shield size={14} /> Admin
            </span>
            <button
              type="button"
              className="back-to-site"
              onClick={() => router.push('/dashboard')}
            >
              Back to Site
            </button>
          </div>
        </div>

        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`admin-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="admin-overview">
            <div className="admin-metrics">
              <MetricCard
                icon={<Users size={20} />}
                label="Total Users"
                value={stats.users.total}
                sub={`+${stats.users.today} today`}
                color="blue"
              />
              <MetricCard
                icon={<DollarSign size={20} />}
                label="Total Revenue"
                value={stats.revenue.formatted}
                sub={`${stats.users.activeSubscriptions} active plans`}
                color="green"
              />
              <MetricCard
                icon={<TrendingUp size={20} />}
                label="Conversion Rate"
                value={stats.users.conversionRate}
                sub="free to paid"
                color="purple"
              />
              <MetricCard
                icon={<Activity size={20} />}
                label="CBT Today"
                value={stats.activity.cbtToday}
                sub={`${stats.activity.totalCBT} total`}
                color="orange"
              />
              <MetricCard
                icon={<Clock size={20} />}
                label="Study Sessions"
                value={stats.activity.studySessionsToday}
                sub="today"
                color="teal"
              />
              <MetricCard
                icon={<Award size={20} />}
                label="Active Streaks"
                value={stats.activity.activeStreaks}
                sub="users studying daily"
                color="red"
              />
            </div>

            <div className="admin-chart-card">
              <h3>New Signups — Last 14 Days</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.charts.dailySignups || []}>
                  <XAxis
                    dataKey="_id"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(d) => (typeof d === 'string' ? d.slice(5) : '')}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="admin-two-col">
              <div className="admin-card">
                <h3>Plan Distribution</h3>
                <div className="plan-dist">
                  <div className="plan-dist-row">
                    <span>Free</span>
                    <div className="dist-bar">
                      <div
                        className="dist-fill free"
                        style={{
                          width: `${((freeCount) / totalUsers) * 100}%`,
                        }}
                      />
                    </div>
                    <span>{freeCount}</span>
                  </div>
                  <div className="plan-dist-row">
                    <span>Weekly</span>
                    <div className="dist-bar">
                      <div
                        className="dist-fill weekly"
                        style={{
                          width: `${(stats.users.weeklyPlans / totalUsers) * 100}%`,
                        }}
                      />
                    </div>
                    <span>{stats.users.weeklyPlans}</span>
                  </div>
                  <div className="plan-dist-row">
                    <span>Monthly</span>
                    <div className="dist-bar">
                      <div
                        className="dist-fill monthly"
                        style={{
                          width: `${(stats.users.monthlyPlans / totalUsers) * 100}%`,
                        }}
                      />
                    </div>
                    <span>{stats.users.monthlyPlans}</span>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <h3>Top CBT Subjects</h3>
                <div className="subject-list">
                  {(stats.charts.topSubjects || []).map((s, i) => (
                    <div key={s._id || i} className="subject-row">
                      <span className="subject-rank">{i + 1}</span>
                      <span className="subject-name">{s._id || 'Unknown'}</span>
                      <span className="subject-count">{s.count} attempts</span>
                      <span className="subject-accuracy">
                        {Math.round(s.avgAccuracy || 0)}% avg
                      </span>
                    </div>
                  ))}
                  {(stats.charts.topSubjects || []).length === 0 && (
                    <p className="empty-state">No data yet</p>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-two-col">
              <div className="admin-card">
                <h3>Recent Signups</h3>
                <div className="recent-list">
                  {(stats.recentUsers || []).map((u) => (
                    <div key={u._id} className="recent-user-row">
                      <div className="recent-user-avatar">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="recent-user-info">
                        <span className="recent-user-name">{u.name || 'Unknown'}</span>
                        <span className="recent-user-email">{u.email}</span>
                      </div>
                      <span
                        className={`plan-tag ${u.subscriptionStatus === 'active' ? 'paid' : 'free'}`}
                      >
                        {u.subscriptionPlan || 'free'}
                      </span>
                      <span className="recent-date">
                        {new Date(u.createdAt).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  ))}
                  {(stats.recentUsers || []).length === 0 && (
                    <p className="empty-state">No signups yet</p>
                  )}
                </div>
              </div>

              <div className="admin-card">
                <h3>Recent Payments</h3>
                <div className="recent-list">
                  {(stats.recentTransactions || []).map((t) => (
                    <div key={t._id} className="recent-tx-row">
                      <div className="tx-info">
                        <span className="tx-name">{t.userId?.name || 'Unknown'}</span>
                        <span className="tx-plan">{t.plan || '—'} plan</span>
                      </div>
                      <div className="tx-right">
                        <span className="tx-amount">
                          ₦{(t.amount || 0).toLocaleString()}
                        </span>
                        <span className="tx-date">
                          {new Date(t.createdAt).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(stats.recentTransactions || []).length === 0 && (
                    <p className="empty-state">No payments yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <AdminUsersTab />}
        {activeTab === 'revenue' && <AdminRevenueTab stats={stats} />}
        {activeTab === 'activity' && <AdminActivityTab stats={stats} />}
      </div>
    </ProtectedRoute>
  )
}
