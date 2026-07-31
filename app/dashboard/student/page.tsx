'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { progressApi } from '@/lib/api/progressApi'
import { paymentApi } from '@/lib/api/paymentApi'
import { showBadgeToast, showXPToast } from '@/hooks/useProgress'
import { useAuthStore } from '@/lib/store/authStore'
import { apiClient } from '@/lib/api/client'
import SetupWizard from '@/components/onboarding/SetupWizard'
import BottomNav from '@/components/dashboard/MobileBottomNav'
import GoalPopup, { shouldShowGoalPopup, getStoredGoal } from '@/components/dashboard/GoalPopup'
import './dashboard-v3.css'
import { FiTarget, FiClock, FiBook, FiCpu, FiFileText, FiCheckSquare, FiZap } from 'react-icons/fi'
import { BiBrain } from 'react-icons/bi'

// ── Types ──────────────────────────────────────────────────
interface WeaknessItem {
  subject: string
  avgAccuracy: number
}

interface ActivityItem {
  id: string | number
  title: string
  subtitle: string
  date?: string
  icon: React.ElementType
}

// ── Helpers ────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

function getInitials(name?: string | null): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
}

function getFocusBarColor(accuracy: number): string {
  if (accuracy < 40) return 'var(--red)'
  if (accuracy < 70) return 'var(--amber)'
  return 'var(--green)'
}



// ── Main Component ─────────────────────────────────────────
export default function StudentDashboardPage() {
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [showGoalPopup, setShowGoalPopup] = useState(false)
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null)

  const [stats, setStats] = useState({
    totalQuestions: 0,
    quizSessions: 0,
    cbtAccuracy: 0,
    studyStreak: 0,
    longestStreak: 0,
    studiedToday: false,
    xp: 0,
    level: 1,
    rank: 'Novice',
    nextRank: 'Scholar',
    progressToNext: 0,
    subjectsPracticed: 0,
  })

  const [weaknesses, setWeaknesses] = useState<WeaknessItem[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [subInfo, setSubInfo] = useState<{ plan: string; status: string; daysLeft: number }>({
    plan: 'free',
    status: 'free',
    daysLeft: 0,
  })

  // ── Data loading ──────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    if (!user?.uid) return
    try {
      setLoading(true)

      const [summaryRes, progressRes, cbtSummaryRes, paymentStatusRes] = await Promise.all([
        apiClient.get('/dashboard/summary').catch(() => null),
        progressApi.getMe().catch(() => null),
        apiClient.get('/cbt/results/summary').catch(() => null),
        paymentApi.getStatus().catch(() => null),
      ])

      if (paymentStatusRes?.success && paymentStatusRes?.subscription) {
        setSubInfo({
          plan: paymentStatusRes.subscription.plan || 'free',
          status: paymentStatusRes.subscription.status || 'free',
          daysLeft: paymentStatusRes.subscription.daysLeft ?? 0,
        })
      }

      const progData = progressRes?.data
      const cbtSummary = cbtSummaryRes?.data

      if (summaryRes?.data?.data) {
        const d = summaryRes.data.data
        const loginStreak = typeof progData?.streak === 'number' ? progData.streak : 0
        const actStreak = d.streak?.current ?? 0
        const displayStreak = Math.max(loginStreak, actStreak)

        // Unique subjects practiced this week (from CBT breakdown)
        const subjectsPracticed =
          (d.cbt?.strengthsWeaknesses?.strengths?.length ?? 0) +
          (d.cbt?.strengthsWeaknesses?.weaknesses?.length ?? 0)

        setStats({
          totalQuestions: d.cbt?.totalQuestions ?? 0,
          quizSessions: d.studyTimer?.totalSessions ?? 0,
          cbtAccuracy: parseInt(d.cbt?.overallAccuracy) || 0,
          studyStreak: displayStreak,
          longestStreak: Math.max(d.streak?.longest ?? 0, loginStreak),
          studiedToday: d.streak?.studiedToday ?? false,
          xp: progData?.xp ?? 0,
          level: progData?.levelInfo?.level ?? progData?.level ?? 1,
          rank: progData?.levelInfo?.name ?? progData?.levelName ?? 'Novice',
          nextRank: progData?.levelInfo?.nextLevel?.name ?? 'Scholar',
          progressToNext: progData?.levelInfo?.progress ?? 0,
          subjectsPracticed,
        })

        // Weaknesses — sorted weakest first
        const allSubjects = [
          ...(d.cbt?.strengthsWeaknesses?.weaknesses ?? []),
          ...(d.cbt?.strengthsWeaknesses?.strengths ?? []),
        ].sort((a: WeaknessItem, b: WeaknessItem) => (a.avgAccuracy ?? 0) - (b.avgAccuracy ?? 0))

        setWeaknesses(allSubjects.slice(0, 4))

        // Recent activity
        const timeline = (d.recentActivity ?? []).map((item: { id?: string | number; title?: string; subtitle?: string; date?: string; type?: string }, i: number) => {
          const icon =
            item.type === 'cbt_result' ? FiTarget :
            item.type === 'flashcard_created' ? BiBrain : FiClock
          return {
            id: item.id ?? i,
            title: item.title ?? 'Activity',
            subtitle: item.subtitle ?? 'Recent action',
            date: item.date,
            icon,
          }
        })
        setActivities(timeline)

      } else {
        // Fallback when /dashboard/summary is not yet available/deployed on backend
        const totalQ = cbtSummary?.recentResults?.reduce((acc: number, r: { totalQuestions?: number }) => acc + (r.totalQuestions || 0), 0) ?? 0
        setStats(prev => ({
          ...prev,
          totalQuestions: totalQ,
          cbtAccuracy: cbtSummary?.overallAccuracy ?? 0,
          xp: progData?.xp ?? 0,
          level: progData?.levelInfo?.level ?? progData?.level ?? 1,
          rank: progData?.levelInfo?.name ?? progData?.levelName ?? 'Novice',
          nextRank: progData?.levelInfo?.nextLevel?.name ?? 'Scholar',
          progressToNext: progData?.levelInfo?.progress ?? 0,
          studyStreak: progData?.streak ?? 0,
        }))
      }
    } catch (err) {
      console.error('Dashboard Load Error:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => { loadDashboardData() }, [loadDashboardData])

  // ── Daily XP award ────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid || typeof window === 'undefined') return
    const day = new Date().toISOString().split('T')[0]
    const key = `sh_daily_xp_${day}`
    if (sessionStorage.getItem(key)) return
    progressApi.award('daily_login').then(res => {
      sessionStorage.setItem(key, '1')
      const d = res.data as { xpAdded?: number; newBadges?: { icon: string; name: string }[] }
      if (d.xpAdded != null) showXPToast(d.xpAdded)
      if (d.newBadges?.length) showBadgeToast(d.newBadges[0])
      loadDashboardData()
    }).catch(() => {})
  }, [user?.uid, loadDashboardData])

  // ── Goal popup ────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    setActiveGoalId(getStoredGoal())
    if (shouldShowGoalPopup()) {
      // Small delay so the page renders first
      const t = setTimeout(() => setShowGoalPopup(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  // ── Derived UI ────────────────────────────────────────────
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const initials = getInitials(user?.name)

  const streakSubtitle =
    stats.studyStreak > 0
      ? 'Keep the streak alive'
      : 'What are we studying today?'

  const goalTitle = activeGoalId
    ? ({
        summarise: 'Summarise lecture notes',
        tutor: 'Study with AI tutor',
        quiz: 'Generate practice quiz',
        pastquestions: 'Browse past questions',
      }[activeGoalId] ?? '')
    : ''

  // ── Render ─────────────────────────────────────────────────
  return (
    <ProtectedRoute allowedRoles={['student', 'teacher']}>
      <div className="sd-page">

        {/* Onboarding wizard */}
        {user && user.onboarding?.completed === false && (
          <SetupWizard user={user} onComplete={() => void useAuthStore.getState().refreshUser()} />
        )}

        {/* Goal popup */}
        {showGoalPopup && (
          <GoalPopup
            onClose={(goalId) => {
              setShowGoalPopup(false)
              if (goalId) setActiveGoalId(goalId)
            }}
          />
        )}

        {/* ── Top bar ── */}
        <header className="sd-topbar">
          <div className="sd-topbar-left">
            <h1>Good {getGreeting()}, {firstName}</h1>
            <p className="sd-topbar-subtitle">{streakSubtitle}</p>
          </div>
          <div className="sd-topbar-right">
            {/* Streak pill */}
            <div className="sd-streak-pill">
              <FiZap size={14} style={{ color: 'var(--amber)' }} />
              <span>{stats.studyStreak}</span>
            </div>
            {/* Avatar */}
            <Link href="/dashboard/profile" prefetch={true} className="sd-avatar" aria-label="Go to profile" style={{ overflow: 'hidden', padding: 0 }}>
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Student'}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt="Profile"
              />
            </Link>
          </div>
        </header>

        {/* ── Goal bar (only if goal was completed, not skipped) ── */}
        {activeGoalId && goalTitle && (
          <div className="sd-section">
            <div className="sd-goal-bar">
              <div className="sd-goal-top">
                <div>
                  <p className="sd-goal-label">TODAY'S GOAL</p>
                  <p className="sd-goal-title">{goalTitle}</p>
                </div>
                <div className="sd-goal-right">
                  <span className="sd-goal-count">{stats.totalQuestions} done</span>
                  <button
                    className="sd-goal-change"
                    onClick={() => setShowGoalPopup(true)}
                    aria-label="Change goal"
                  >
                    Change
                  </button>
                </div>
              </div>
              <div className="sd-goal-progress-track">
                <div
                  className="sd-goal-progress-fill"
                  style={{
                    width: `${Math.min(100, stats.progressToNext)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Study tools ── */}
        <div className="sd-section">
          <p className="sd-section-label">Study Tools</p>
          <div className="sd-tools-grid">

            {/* Past questions */}
            <Link href="/dashboard/cbt" prefetch={true} className="sd-tool-card">
              <div className="sd-tool-icon" style={{ background: 'var(--blue-bg)' }}><FiBook size={16} /></div>
              <div>
                <p className="sd-tool-name">Past Questions</p>
                <p className="sd-tool-sub">WAEC, JAMB, NECO</p>
              </div>
            </Link>

            {/* AI Tutor */}
            <Link href="/dashboard/tutor" prefetch={true} className="sd-tool-card">
              <div className="sd-tool-icon" style={{ background: 'var(--green-bg)' }}><FiCpu size={16} /></div>
              <div>
                <p className="sd-tool-name">AI Tutor</p>
                <p className="sd-tool-sub">Ask anything</p>
              </div>
            </Link>

            {/* Summarise notes */}
            <Link href="/dashboard/pdf-summary" prefetch={true} className="sd-tool-card">
              <div className="sd-tool-icon" style={{ background: 'var(--purple-bg)' }}><FiFileText size={16} /></div>
              <div>
                <p className="sd-tool-name">Summarise Notes</p>
                <p className="sd-tool-sub">Upload PDF or doc</p>
              </div>
            </Link>

            {/* Question Bank / Generator */}
            <Link href="/dashboard/question-bank" prefetch={true} className="sd-tool-card">
              <div className="sd-tool-icon" style={{ background: 'var(--amber-bg-dark)' }}><FiCheckSquare size={16} /></div>
              <div>
                <p className="sd-tool-name">Question Generator</p>
                <p className="sd-tool-sub">AI Practice Questions</p>
              </div>
            </Link>

          </div>
        </div>

        <div className="sd-divider" />

        {/* ── Subscription Status ── */}
        <div className="sd-section">
          <p className="sd-section-label">Subscription Status</p>
          <div className="sd-sub-card">
            <div className="sd-sub-top">
              <div>
                <span className="sd-sub-badge">
                  {subInfo.plan === 'free' ? 'Free' : 'Active'}
                </span>
                <h3 className="sd-sub-plan-name">
                  {subInfo.plan === 'free' ? 'Free Plan' : `${subInfo.plan.charAt(0).toUpperCase() + subInfo.plan.slice(1)} Plan`}
                </h3>
                <p className="sd-sub-expires">
                  Plan expires in <span className="sd-sub-days">{subInfo.daysLeft} day(s)</span>
                </p>
              </div>
            </div>
            <div className="sd-sub-actions">
              <Link href="/dashboard/pricing" className="sd-sub-btn-upgrade">
                Upgrade Plan
              </Link>
              <Link href="/dashboard/settings?tab=referrals" className="sd-sub-btn-share">
                Share & Get 1 Free Day
              </Link>
            </div>
          </div>
        </div>

        <div className="sd-divider" />

        {/* ── This week stats ── */}
        <div className="sd-section">
          <p className="sd-section-label">This Week</p>
          <div className="sd-stats-grid">
            <div className="sd-stat-card">
              <p className="sd-stat-number">{stats.totalQuestions.toLocaleString()}</p>
              <p className="sd-stat-label">Questions answered</p>
            </div>
            <div className="sd-stat-card">
              <p className="sd-stat-number">{stats.subjectsPracticed}</p>
              <p className="sd-stat-label">Subjects practiced</p>
            </div>
            <div className="sd-stat-card">
              <p className="sd-stat-number">{stats.cbtAccuracy}%</p>
              <p className="sd-stat-label">Avg. score</p>
            </div>
          </div>
        </div>

        <div className="sd-divider" />

        {/* ── Where to focus ── */}
        <div className="sd-section">
          <p className="sd-section-label">Where to Focus</p>
          {weaknesses.length === 0 ? (
            <p className="sd-focus-empty">
              Complete a quiz to see your weak spots
            </p>
          ) : (
            <div className="sd-focus-list">
              {weaknesses.map((item, i) => {
                const acc = Math.round(item.avgAccuracy ?? 0)
                const color = getFocusBarColor(acc)
                const actionLabel = acc < 70 ? 'Practice now' : 'Keep going'
                return (
                  <div key={i} className="sd-focus-row">
                    <span className="sd-focus-name">{item.subject}</span>
                    <div className="sd-focus-bar-wrap">
                      <div
                        className="sd-focus-bar-fill"
                        style={{ width: `${acc}%`, background: color }}
                      />
                    </div>
                    <Link
                      href="/dashboard/cbt"
                      className="sd-focus-action"
                    >
                      {actionLabel}
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Bottom nav ── */}
        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
