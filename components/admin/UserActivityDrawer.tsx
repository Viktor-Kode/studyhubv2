'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { X } from 'lucide-react'
import { apiClient } from '@/lib/api/client'

function nairaFromKobo(kobo: number): string {
  return `₦${Math.round((kobo || 0) / 100).toLocaleString('en-NG')}`
}

type ActivityDrawerUser = {
  _id: string
  name?: string
  email: string
  subscriptionStatus?: string
  subscriptionPlan?: string | null
  subscriptionEnd?: string
  createdAt?: string
  role?: string
  phoneNumber?: string
  lastSeen?: string
  avatar?: string
  aiUsageCount?: number
  aiUsageLimit?: number
}

interface DayTimelineItem {
  at: string
  kind: string
  label: string
  detail?: Record<string, unknown>
}

interface UserDayActivityResponse {
  success?: boolean
  date?: string
  dayBoundaryUtc?: boolean
  dailySession?: { firstAt?: string; lastAt?: string; dayKey?: string } | null
  timeline?: DayTimelineItem[]
  counts?: Record<string, number>
}

function getTimeAgo(date: string | Date | null | undefined): string {
  if (!date) return 'never'
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 120) return '1 min ago'
  return `${Math.floor(seconds / 60)} mins ago`
}

const DAY_TAB_LABELS: Record<string, string> = {
  overview: 'Overview',
  daylog: 'Day log',
  cbt: 'CBT',
  sessions: 'Sessions',
  payments: 'Payments',
}

function dayKindClass(kind: string): string {
  switch (kind) {
    case 'app_session':
      return 'day-kind-session'
    case 'cbt':
      return 'day-kind-cbt'
    case 'study':
      return 'day-kind-study'
    case 'quiz':
      return 'day-kind-quiz'
    case 'payment':
      return 'day-kind-pay'
    case 'note':
      return 'day-kind-note'
    case 'flashcard':
      return 'day-kind-flash'
    case 'reminder':
      return 'day-kind-reminder'
    case 'ai_chat':
      return 'day-kind-chat'
    case 'library':
      return 'day-kind-library'
    default:
      return 'day-kind-default'
  }
}

export function UserActivityDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [data, setData] = useState<{
    user: ActivityDrawerUser & { lastSeen?: string; avatar?: string; aiUsageCount?: number; aiUsageLimit?: number }
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
  const [dayDate, setDayDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [dayData, setDayData] = useState<UserDayActivityResponse | null>(null)
  const [dayLoading, setDayLoading] = useState(false)
  const [dayError, setDayError] = useState('')

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

  useEffect(() => {
    if (activeTab !== 'daylog') return
    let cancelled = false
    const loadDay = async () => {
      setDayLoading(true)
      setDayError('')
      try {
        const res = await apiClient.get<UserDayActivityResponse>(`/admin/users/${userId}/activity/day`, {
          params: { date: dayDate },
        })
        if (cancelled) return
        if (res.data?.success) setDayData(res.data)
        else setDayError('Could not load day activity')
      } catch {
        if (!cancelled) setDayError('Could not load day activity')
      } finally {
        if (!cancelled) setDayLoading(false)
      }
    }
    loadDay()
    return () => {
      cancelled = true
    }
  }, [userId, activeTab, dayDate])

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
                  {data.user.createdAt
                    ? new Date(data.user.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
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
              {(['overview', 'daylog', 'cbt', 'sessions', 'payments'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`drawer-tab ${activeTab === t ? 'active' : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {DAY_TAB_LABELS[t]}
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

            {activeTab === 'daylog' && (
              <div className="drawer-content day-log-tab">
                <div className="day-log-toolbar">
                  <label className="day-log-date-label">
                    <span>UTC date</span>
                    <input
                      type="date"
                      className="day-log-date-input"
                      value={dayDate}
                      onChange={(e) => setDayDate(e.target.value)}
                    />
                  </label>
                  <p className="day-log-hint">
                    Session times are recorded on first authenticated API call per UTC day. Events below merge
                    CBT, study, quizzes, payments, notes, flashcards, reminders, library, and AI chats for
                    that day.
                  </p>
                </div>

                {dayLoading ? (
                  <div className="drawer-loading">Loading day activity…</div>
                ) : dayError ? (
                  <p className="empty-state">{dayError}</p>
                ) : dayData ? (
                  <>
                    {dayData.dailySession && (
                      <div className="day-session-banner">
                        <span className="meta-label">Session window (UTC)</span>
                        <p>
                          First activity{' '}
                          <strong>
                            {dayData.dailySession.firstAt
                              ? format(new Date(dayData.dailySession.firstAt), 'HH:mm:ss')
                              : '—'}
                          </strong>
                          {' · '}
                          Last{' '}
                          <strong>
                            {dayData.dailySession.lastAt
                              ? format(new Date(dayData.dailySession.lastAt), 'HH:mm:ss')
                              : '—'}
                          </strong>
                        </p>
                      </div>
                    )}
                    {!dayData.dailySession && (
                      <p className="day-log-empty-note">
                        No session ping for this UTC day (tracking started recently, or the user did not hit
                        the API that day).
                      </p>
                    )}

                    {dayData.counts && Object.keys(dayData.counts).length > 0 && (
                      <div className="day-counts-row">
                        {Object.entries(dayData.counts).map(([k, v]) => (
                          <span key={k} className="day-count-chip">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}

                    {!dayData.timeline?.length ? (
                      <p className="empty-state">No recorded events for this date.</p>
                    ) : (
                      <div className="day-timeline">
                        {dayData.timeline.map((item, idx) => (
                          <div key={`${item.kind}-${idx}-${item.at}`} className="day-timeline-row">
                            <span className={`day-kind-pill ${dayKindClass(item.kind)}`}>{item.kind}</span>
                            <div className="day-timeline-main">
                              <span className="day-timeline-time">
                                {item.at ? format(new Date(item.at), 'HH:mm:ss') : '—'}
                              </span>
                              <span className="day-timeline-label">{item.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="empty-state">Select a date to load activity.</p>
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
                        <span className="amount-badge">{nairaFromKobo(t.amount ?? 0)}</span>
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
