'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, TrendingUp, BookOpen, Zap, DollarSign, Activity, Award, Clock,
  Search, ChevronLeft, ChevronRight, Shield, Trash2, Gift, RefreshCw, X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import { useAuthStore } from '@/lib/store/authStore'
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
  lastSeen?: string
  avatar?: string
}

interface OnlineUser {
  _id: string
  name?: string
  email: string
  subscriptionStatus?: string
  subscriptionPlan?: string
  lastSeen?: string
  avatar?: string
}

// ─── Helper ────────────────────────────────────────────────────────────────────

function getTimeAgo(date: string | Date | null | undefined): string {
  if (!date) return 'never'
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 120) return '1 min ago'
  return `${Math.floor(seconds / 60)} mins ago`
}

// ─── Metric Card ───────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  sub,
  color,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  color: string
  onClick?: () => void
}) {
  return (
    <div
      className={`metric-card ${color} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={onClick ? 'Click to see users' : undefined}
    >
      <div className="metric-icon">{icon}</div>
      <div className="metric-info">
        <span className="metric-value">{value}</span>
        <span className="metric-label">{label}</span>
        <span className="metric-sub">{sub}</span>
      </div>
      {onClick && (
        <div className="metric-arrow">
          <ChevronRight size={16} />
        </div>
      )}
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

// ─── Online Users ──────────────────────────────────────────────────────────────

function OnlineUsers({
  users,
  onClickUser,
}: {
  users: OnlineUser[]
  onClickUser: (user: OnlineUser) => void
}) {
  return (
    <div className="online-users-card">
      <div className="online-users-header">
        <div className="online-title">
          <div className="online-dot" />
          <h3>Currently Online</h3>
          <span className="online-count">{users.length}</span>
        </div>
        <span className="online-hint">Active in last 5 minutes</span>
      </div>

      {users.length === 0 ? (
        <p className="empty-state">No users active right now</p>
      ) : (
        <div className="online-users-list">
          {users.map((u) => (
            <div
              key={u._id}
              className="online-user-row"
              onClick={() => onClickUser(u)}
              onKeyDown={(e) => e.key === 'Enter' && onClickUser(u)}
              role="button"
              tabIndex={0}
            >
              <div className="online-user-left">
                <div className="online-avatar-wrap">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name || ''} className="online-avatar-img" />
                  ) : (
                    <div className="online-avatar">
                      {u.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="online-indicator" />
                </div>
                <div>
                  <span className="online-name">{u.name || 'Unknown'}</span>
                  <span className="online-email">{u.email}</span>
                </div>
              </div>
              <div className="online-user-right">
                <span
                  className={`plan-tag ${u.subscriptionStatus === 'active' ? 'paid' : 'free'}`}
                >
                  {u.subscriptionPlan || 'free'}
                </span>
                <span className="online-time">{getTimeAgo(u.lastSeen)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── User Activity Drawer ──────────────────────────────────────────────────────

function UserActivityDrawer({
  userId,
  onClose,
}: {
  userId: string
  onClose: () => void
}) {
  const [data, setData] = useState<{
    user: AdminUser & { lastSeen?: string }
    stats: {
      totalCBT: number
      avgCBTAccuracy: number
      totalStudyTime: number
      totalNotes: number
      totalTransactions: number
      currentStreak: number
      longestStreak: number
      flashcardsReviewed: number
      subjectBreakdown: Array<{ subject: string; attempts: number; avgAccuracy: number }>
    }
    recentCBT: Array<{
      subject?: string
      examType?: string
      totalQuestions?: number
      accuracy?: number
      takenAt?: string
    }>
    recentSessions: Array<{
      subject?: string
      durationSeconds?: number
      createdAt?: string
    }>
    notes: Array<{ title?: string; subject?: string; createdAt?: string }>
    transactions: Array<{
      plan?: string
      reference?: string
      amount?: number
      createdAt?: string
    }>
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchUserActivity = async () => {
      setLoading(true)
      try {
        const res = await apiClient.get(`/admin/users/${userId}/activity`)
        const result = res.data
        if (result?.success) setData(result)
      } catch (err) {
        console.error('Activity fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUserActivity()
  }, [userId])

  return (
    <div className="drawer-overlay" onClick={onClose} role="presentation">
      <div className="activity-drawer" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="drawer-header">
          <div className="drawer-user-info">
            <div className="drawer-avatar">
              {data?.user?.avatar ? (
                <img src={data.user.avatar} alt="" />
              ) : (
                <span>{data?.user?.name?.charAt(0) || 'U'}</span>
              )}
            </div>
            <div>
              <h3>{data?.user?.name || 'Loading...'}</h3>
              <p>{data?.user?.email}</p>
            </div>
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="drawer-loading">Loading activity...</div>
        ) : data ? (
          <>
            <div className="drawer-meta">
              <div className="drawer-meta-item">
                <span className="meta-label">Plan</span>
                <span
                  className={`plan-tag ${data.user.subscriptionStatus === 'active' ? 'paid' : 'free'}`}
                >
                  {data.user.subscriptionPlan || 'Free'}
                </span>
              </div>
              <div className="drawer-meta-item">
                <span className="meta-label">Joined</span>
                <span>
                  {new Date(data.user.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="drawer-meta-item">
                <span className="meta-label">Last Seen</span>
                <span>{getTimeAgo(data.user.lastSeen)}</span>
              </div>
              <div className="drawer-meta-item">
                <span className="meta-label">Expires</span>
                <span>
                  {data.user.subscriptionEnd
                    ? new Date(data.user.subscriptionEnd).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : '—'}
                </span>
              </div>
              <div className="drawer-meta-item">
                <span className="meta-label">AI Used</span>
                <span>
                  {data.user.aiUsageCount ?? 0}/{data.user.aiUsageLimit ?? 0}
                </span>
              </div>
              <div className="drawer-meta-item">
                <span className="meta-label">Phone</span>
                <span>{data.user.phoneNumber || '—'}</span>
              </div>
            </div>

            <div className="drawer-tabs">
              {['overview', 'cbt', 'sessions', 'payments'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`drawer-tab ${activeTab === t ? 'active' : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="drawer-content">
                <div className="drawer-stats">
                  <div className="drawer-stat">
                    <span className="dstat-num">{data.stats.totalCBT}</span>
                    <span className="dstat-label">CBT Tests</span>
                  </div>
                  <div className="drawer-stat">
                    <span className="dstat-num">{data.stats.avgCBTAccuracy}%</span>
                    <span className="dstat-label">Avg Accuracy</span>
                  </div>
                  <div className="drawer-stat">
                    <span className="dstat-num">{data.stats.totalStudyTime}m</span>
                    <span className="dstat-label">Study Time</span>
                  </div>
                  <div className="drawer-stat">
                    <span className="dstat-num">{data.stats.currentStreak}</span>
                    <span className="dstat-label">Streak</span>
                  </div>
                  <div className="drawer-stat">
                    <span className="dstat-num">{data.stats.totalNotes}</span>
                    <span className="dstat-label">Notes</span>
                  </div>
                  <div className="drawer-stat">
                    <span className="dstat-num">{data.stats.longestStreak}</span>
                    <span className="dstat-label">Best Streak</span>
                  </div>
                </div>

                {data.stats.subjectBreakdown.length > 0 && (
                  <div className="drawer-section">
                    <h4>Subject Performance</h4>
                    {data.stats.subjectBreakdown.map((s) => (
                      <div key={s.subject} className="subject-perf-row">
                        <span className="subj-name">{s.subject}</span>
                        <div className="subj-bar-wrap">
                          <div className="subj-bar" style={{ width: `${s.avgAccuracy}%` }} />
                        </div>
                        <span className="subj-acc">{s.avgAccuracy}%</span>
                        <span className="subj-count">{s.attempts}x</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cbt' && (
              <div className="drawer-content">
                <h4>Recent CBT Results</h4>
                {data.recentCBT.length === 0 ? (
                  <p className="empty-state">No CBT results yet</p>
                ) : (
                  data.recentCBT.map((r, i) => (
                    <div key={i} className="activity-row">
                      <div className="activity-row-left">
                        <span className="activity-subject">{r.subject || 'Unknown'}</span>
                        <span className="activity-meta">
                          {r.examType || 'CBT'} • {r.totalQuestions ?? 0}Q
                        </span>
                      </div>
                      <div className="activity-row-right">
                        <span
                          className={`accuracy-badge ${
                            (r.accuracy ?? 0) >= 70
                              ? 'good'
                              : (r.accuracy ?? 0) >= 50
                                ? 'ok'
                                : 'poor'
                          }`}
                        >
                          {r.accuracy ?? 0}%
                        </span>
                        <span className="activity-date">
                          {r.takenAt
                            ? new Date(r.takenAt).toLocaleDateString('en-NG', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : '—'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="drawer-content">
                <h4>Study Sessions</h4>
                {data.recentSessions.length === 0 ? (
                  <p className="empty-state">No study sessions yet</p>
                ) : (
                  data.recentSessions.map((s, i) => (
                    <div key={i} className="activity-row">
                      <div className="activity-row-left">
                        <span className="activity-subject">{s.subject || 'General'}</span>
                        <span className="activity-meta">Study session</span>
                      </div>
                      <div className="activity-row-right">
                        <span className="duration-badge">
                          {Math.round((s.durationSeconds || 0) / 60)}m
                        </span>
                        <span className="activity-date">
                          {s.createdAt
                            ? new Date(s.createdAt).toLocaleDateString('en-NG', {
                                day: 'numeric',
                                month: 'short',
                              })
                            : '—'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="drawer-content">
                <h4>Payment History</h4>
                {data.transactions.length === 0 ? (
                  <p className="empty-state">No payments yet</p>
                ) : (
                  data.transactions.map((t, i) => (
                    <div key={i} className="activity-row">
                      <div className="activity-row-left">
                        <span className="activity-subject">{t.plan || 'Plan'} plan</span>
                        <span className="activity-meta">{t.reference || '—'}</span>
                      </div>
                      <div className="activity-row-right">
                        <span className="amount-badge">
                          ₦{(t.amount ?? 0).toLocaleString()}
                        </span>
                        <span className="activity-date">
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleDateString('en-NG', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        ) : (
          <div className="drawer-loading">Failed to load activity</div>
        )}
      </div>
    </div>
  )
}

// ─── Metric Users Drawer ───────────────────────────────────────────────────────

interface MetricUserEntry {
  user: AdminUser & { lastSeen?: string }
  count: number
  totalMinutes?: number
  mastered?: number
  longestStreak?: number
  lastActivity?: string
  details: Array<{
    subject?: string
    accuracy?: number
    total?: number
    duration?: number
    date?: string
  }>
}

function MetricUsersDrawer({
  metric,
  filter,
  label,
  onClose,
  onClickUser,
}: {
  metric: string
  filter: string
  label: string
  onClose: () => void
  onClickUser: (user: AdminUser | OnlineUser) => void
}) {
  const [users, setUsers] = useState<MetricUserEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetricUsers = async () => {
      setLoading(true)
      try {
        const res = await apiClient.get(
          `/admin/metric-users?metric=${metric}&filter=${filter}`
        )
        if (res.data?.success) setUsers(res.data.users || [])
      } catch (err) {
        console.error('Metric users error:', err)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    fetchMetricUsers()
  }, [metric, filter])

  const renderUserDetail = (u: MetricUserEntry) => {
    if (metric === 'cbt')
      return (
        <span className="metric-user-detail">
          {u.count} test{u.count !== 1 ? 's' : ''} •{' '}
          {u.details[0]
            ? `Last: ${u.details[0].subject} (${u.details[0].accuracy}%)`
            : ''}
        </span>
      )
    if (metric === 'sessions')
      return (
        <span className="metric-user-detail">
          {u.count} session{u.count !== 1 ? 's' : ''} • {u.totalMinutes ?? 0}m total
        </span>
      )
    if (metric === 'flashcards')
      return (
        <span className="metric-user-detail">
          {u.count} reviews • {u.mastered ?? 0} mastered
        </span>
      )
    if (metric === 'streaks')
      return (
        <span className="metric-user-detail">
          {u.count} day streak • Best: {u.longestStreak ?? 0} days
        </span>
      )
    return null
  }

  const getMetricBadge = (u: MetricUserEntry) => {
    if (metric === 'cbt') return `${u.count} tests`
    if (metric === 'sessions') return `${u.totalMinutes ?? 0}m`
    if (metric === 'flashcards') return `${u.count} reviews`
    if (metric === 'streaks') return `${u.count} days`
    return ''
  }

  const isOnline = (lastSeen: string | undefined) => {
    if (!lastSeen) return false
    return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000
  }

  return (
    <div
      className="drawer-overlay"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      role="presentation"
    >
      <div
        className="activity-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="drawer-header">
          <div>
            <h3>{label}</h3>
            <p>
              {loading ? 'Loading...' : `${users.length} user${users.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            type="button"
            className="drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="drawer-content">
          {loading ? (
            <div className="drawer-loading">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">No users found for this metric</div>
          ) : (
            <div className="metric-users-list">
              {users.map((u, i) => (
                <div
                  key={u.user._id}
                  className="metric-user-row"
                  onClick={() => onClickUser(u.user)}
                  onKeyDown={(e) => e.key === 'Enter' && onClickUser(u.user)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="metric-user-rank">#{i + 1}</span>

                  <div className="online-avatar-wrap">
                    {u.user.avatar ? (
                      <img
                        src={u.user.avatar}
                        alt=""
                        className="online-avatar-img"
                      />
                    ) : (
                      <div className="online-avatar">
                        {u.user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    {isOnline(u.user.lastSeen) && (
                      <div className="online-indicator" />
                    )}
                  </div>

                  <div className="metric-user-info">
                    <span className="metric-user-name">
                      {u.user.name || 'Unknown'}
                    </span>
                    {renderUserDetail(u)}
                  </div>

                  <div className="metric-user-right">
                    <span className="metric-badge">{getMetricBadge(u)}</span>
                    <span
                      className={`plan-tag ${u.user.subscriptionStatus === 'active' ? 'paid' : 'free'}`}
                    >
                      {u.user.subscriptionPlan || 'free'}
                    </span>
                    <ChevronRight size={14} color="#9CA3AF" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Admin Users Tab ───────────────────────────────────────────────────────────

function AdminUsersTab({
  onUserClick,
}: {
  onUserClick: (user: AdminUser) => void
}) {
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
                <tr
                  key={u._id}
                  onClick={() => onUserClick(u)}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onUserClick(u)}
                >
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
                  <td onClick={(e) => e.stopPropagation()}>
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

// ─── Admin Campaigns Tab ───────────────────────────────────────────────────────

function AdminCampaignsTab() {
  const [audiences, setAudiences] = useState<Record<string, { count: number; label: string }> | null>(null)
  const [form, setForm] = useState({
    campaignType: 'upgrade_students',
    targetAudience: 'free_students',
    subject: '',
    testMode: true,
    testEmail: '',
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ results: { sent: number; failed: number }; message: string } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiClient.get('/admin/email-stats').then((res) => {
      if (res.data?.success) setAudiences(res.data.audiences || {})
    }).catch(() => setAudiences({}))
  }, [])

  const handleSend = async () => {
    if (!form.testMode) {
      const count = audiences?.[form.targetAudience]?.count ?? 0
      const confirmed = window.confirm(
        `⚠️ You are about to send a REAL email to ${count} users.\n\nAre you sure?`
      )
      if (!confirmed) return
    }

    setSending(true)
    setError('')
    setResult(null)
    try {
      const res = await apiClient.post('/admin/email-campaign', form)
      if (res.data?.success) setResult(res.data)
      else setError(res.data?.error || 'Failed')
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed')
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
              { value: 'upgrade_students', label: '🎓 Student Upgrade', desc: 'Upgrade to Weekly/Monthly' },
              { value: 'upgrade_teachers', label: '👩‍🏫 Teacher Upgrade', desc: 'Upgrade to Teacher plan' },
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
                ? "You're missing out — upgrade your StudyHelp plan 🚀"
                : 'Unlock all Teacher Tools on StudyHelp 📚'
            }
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          />
        </div>

        {selectedAudience && (
          <div className="flex items-center gap-2 flex-wrap text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <span>📬 This will send to</span>
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
            {form.testMode ? '🧪 Test Mode (send to 1 email only)' : '🚀 Live Mode (send to all)'}
          </label>
        </div>

        {form.testMode && (
          <div>
            <label className="block text-sm font-medium mb-1">Test Email (leave blank to use your admin email)</label>
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
            ⚠️ <strong>Live Mode</strong> — this will send real emails to <strong>{selectedAudience?.count ?? 0} users</strong>. Test first.
          </div>
        )}

        {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg">{error}</div>}

        {result && (
          <div className="flex items-center gap-5 flex-wrap p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <div className="text-center">
              <span className="block text-3xl font-black text-emerald-600">{result.results.sent}</span>
              <span className="text-sm">Delivered ✅</span>
            </div>
            <div className="text-center">
              <span className="block text-3xl font-black text-red-600">{result.results.failed}</span>
              <span className="text-sm">Failed ❌</span>
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
              ? '🧪 Send Test Email'
              : `🚀 Send to ${selectedAudience?.count ?? 0} Users`}
        </button>
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
  { id: 'campaigns', label: '📧 Campaigns' },
]

const DEFAULT_STATS: AdminStats = {
  users: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, activeSubscriptions: 0, weeklyPlans: 0, monthlyPlans: 0, conversionRate: '0%' },
  revenue: { total: 0, formatted: '₦0' },
  activity: { totalCBT: 0, cbtToday: 0, totalStudySessions: 0, studySessionsToday: 0, totalFlashcardReviews: 0, activeStreaks: 0, totalNotes: 0 },
  charts: { dailySignups: [], topSubjects: [] },
  recentUsers: [],
  recentTransactions: [],
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [notAdmin, setNotAdmin] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(() => new Date())
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [selectedUser, setSelectedUser] = useState<AdminUser | OnlineUser | null>(null)
  const [metricDrawer, setMetricDrawer] = useState<{
    metric: string
    filter: string
    label: string
  } | null>(null)

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/admin/stats')
      if (res.data?.success) {
        setStats(res.data.stats)
        setApiError(null)
      } else {
        setStats(DEFAULT_STATS)
        setApiError('API returned invalid data')
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string }
      const status = axiosErr.response?.status
      const data = axiosErr.response?.data
      setStats(DEFAULT_STATS)
      if (status === 403) {
        setNotAdmin(true)
        setApiError(null)
      } else if (status === 401) {
        setApiError('Session expired. Please log in again.')
      } else if (status && status >= 500) {
        setApiError(`Server error (${status}). Check backend logs.`)
      } else {
        setApiError(
          status
            ? `Request failed (${status}). ${(data as { message?: string })?.message || axiosErr.message || 'Unknown error'}`
            : `Connection failed: ${axiosErr.message || 'Admin API not configured'}`
        )
      }
    }
  }

  const fetchOnlineUsers = async () => {
    try {
      const res = await apiClient.get('/admin/online-users')
      if (res.data?.success) {
        setOnlineUsers(res.data.users || [])
      }
    } catch {
      setOnlineUsers([])
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchStats(), fetchOnlineUsers()])
    setLastRefreshed(new Date())
    setTimeout(() => setRefreshing(false), 800)
  }

  useEffect(() => {
    const isAdmin = user?.role === 'admin'
    if (!user) {
      setLoading(false)
      return
    }
    if (!isAdmin) {
      setNotAdmin(true)
      setLoading(false)
      return
    }

    const timeout = setTimeout(() => {
      setStats((s) => s ?? DEFAULT_STATS)
      setLoading(false)
    }, 5000)

    const run = async () => {
      await fetchStats()
      await fetchOnlineUsers()
    }
    run().finally(() => {
      clearTimeout(timeout)
      setLoading(false)
    })

    return () => clearTimeout(timeout)
  }, [user])

  // Auto-refresh online users every 60 seconds
  useEffect(() => {
    if (!user || user.role !== 'admin') return
    const interval = setInterval(fetchOnlineUsers, 60000)
    return () => clearInterval(interval)
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
  if (!stats) return <div className="admin-loading">Loading...</div>

  const totalUsers = Math.max(stats.users.total || 1, 1)
  const freeCount = totalUsers - stats.users.activeSubscriptions

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="admin-page">
        <BackButton label="Dashboard" href="/dashboard" />
        {apiError && (
          <div className="admin-api-error">
            {apiError}
          </div>
        )}

        <div className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>StudyHelp Platform Overview</p>
          </div>
          <div className="admin-header-right">
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
              title="Refresh data"
            >
              <RefreshCw size={16} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
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
            <OnlineUsers users={onlineUsers} onClickUser={(u) => setSelectedUser(u)} />
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
                label="Total CBT Tests"
                value={stats.activity.totalCBT}
                sub={`${stats.activity.cbtToday} today`}
                color="orange"
                onClick={() =>
                  setMetricDrawer({
                    metric: 'cbt',
                    filter: 'all',
                    label: 'CBT Tests — All Time',
                  })
                }
              />
              <MetricCard
                icon={<Clock size={20} />}
                label="Study Sessions"
                value={stats.activity.totalStudySessions}
                sub={`${stats.activity.studySessionsToday} today`}
                color="teal"
                onClick={() =>
                  setMetricDrawer({
                    metric: 'sessions',
                    filter: 'all',
                    label: 'Study Sessions — All Time',
                  })
                }
              />
              <MetricCard
                icon={<Zap size={20} />}
                label="Flashcard Reviews"
                value={stats.activity.totalFlashcardReviews}
                sub="all time"
                color="purple"
                onClick={() =>
                  setMetricDrawer({
                    metric: 'flashcards',
                    filter: 'all',
                    label: 'Flashcard Reviews',
                  })
                }
              />
              <MetricCard
                icon={<Award size={20} />}
                label="Active Streaks"
                value={stats.activity.activeStreaks}
                sub="users on streak"
                color="red"
                onClick={() =>
                  setMetricDrawer({
                    metric: 'streaks',
                    filter: 'all',
                    label: 'Active Streaks',
                  })
                }
              />
            </div>

            <div className="metric-filters-row">
              <button
                type="button"
                className="metric-filter-chip"
                onClick={() =>
                  setMetricDrawer({
                    metric: 'cbt',
                    filter: 'today',
                    label: 'CBT Tests Today',
                  })
                }
              >
                {stats.activity.cbtToday} CBT today →
              </button>
              <button
                type="button"
                className="metric-filter-chip"
                onClick={() =>
                  setMetricDrawer({
                    metric: 'sessions',
                    filter: 'today',
                    label: 'Study Sessions Today',
                  })
                }
              >
                {stats.activity.studySessionsToday} sessions today →
              </button>
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

        {activeTab === 'users' && (
          <AdminUsersTab onUserClick={(u) => setSelectedUser(u)} />
        )}
        {activeTab === 'revenue' && <AdminRevenueTab stats={stats} />}
        {activeTab === 'activity' && <AdminActivityTab stats={stats} />}
        {activeTab === 'campaigns' && <AdminCampaignsTab />}

        {selectedUser && (
          <UserActivityDrawer
            userId={selectedUser._id}
            onClose={() => setSelectedUser(null)}
          />
        )}

        {metricDrawer && (
          <MetricUsersDrawer
            metric={metricDrawer.metric}
            filter={metricDrawer.filter}
            label={metricDrawer.label}
            onClose={() => setMetricDrawer(null)}
            onClickUser={(u) => {
              setMetricDrawer(null)
              setSelectedUser(u)
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
