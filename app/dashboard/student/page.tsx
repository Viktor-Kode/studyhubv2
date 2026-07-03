'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { progressApi } from '@/lib/api/progressApi'
import { showBadgeToast, showXPToast } from '@/hooks/useProgress'
import { useAuthStore } from '@/lib/store/authStore'
import { apiClient } from '@/lib/api/client'
import { classService, Class } from '@/lib/services/classService'
import { reminderService, Reminder } from '@/lib/services/reminderService'
import { timetableService, TimetableSlot } from '@/lib/services/timetableService'
import { paymentApi } from '@/lib/api/paymentApi'
import SetupWizard from '@/components/onboarding/SetupWizard'
import './dashboard-v3.css'
import {
  FiBook, FiClock, FiCreditCard, FiBarChart2,
  FiCalendar, FiGrid, FiArrowRight, FiZap, FiBell,
  FiTarget, FiLoader, FiStar, FiHome, FiUsers, FiAward
} from 'react-icons/fi'
import { BiTimer, BiBrain } from 'react-icons/bi'
import Link from 'next/link'
import MobileBottomNav from '@/components/dashboard/MobileBottomNav'

export default function StudentDashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalQuestions: 0,
    quizSessions: 0,
    studyHours: '0m',
    studyHoursToday: '0m',
    studyStreak: 0,
    longestStreak: 0,
    studiedToday: false,
    completedSessions: 0,
    totalFlashcards: 0,
    masteredCards: 0,
    upcomingReminders: 0,
    cbtExamsTaken: 0,
    cbtAccuracy: 0,
    bestCBTSubject: 'N/A',
    masteryRate: '0%',
    xp: 0,
    level: 1,
    rank: 'Novice',
    nextRank: 'Master',
    progressToNext: 0
  })
  const [activities, setActivities] = useState<any[]>([])
  const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([])
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([])
  const [strengthsWeaknesses, setStrengthsWeaknesses] = useState<{ strengths: any[]; weaknesses: any[] }>({
    strengths: [],
    weaknesses: [],
  })

  const loadDashboardData = async () => {
    if (!user?.uid) return
    try {
      setLoading(true)
      setDashboardError(null)

      // Fire all requests in parallel — each has its own .catch so one failure doesn't kill the rest
      const [classes, reminders, summaryRes, progressRes] = await Promise.all([
        classService.getStudentClasses(user.uid).catch(() => [] as Class[]),
        reminderService.getUpcoming(user.uid, 7).catch(() => [] as Reminder[]),
        apiClient.get('/dashboard/summary').catch(() => null),
        progressApi.getMe().catch(() => null),   // ← was getProgress() which doesn't exist
      ])

      setEnrolledClasses(classes)
      setUpcomingReminders(reminders)

      // getMyProgress returns a FLAT object: { xp, streak, level, levelName, levelInfo, ... }
      // (not wrapped in .data.data — that's only the dashboard summary endpoint)
      const progData = progressRes?.data

      if (summaryRes?.data?.data) {
        const d = summaryRes.data.data

        // Merge: take the higher of the login streak (from progress) and activity streak (from summary)
        const loginStreak  = typeof progData?.streak === 'number' ? progData.streak : 0
        const actStreak    = d.streak?.current ?? 0
        const displayStreak = Math.max(loginStreak, actStreak)

        setStats({
          totalQuestions:   d.cbt?.totalQuestions    ?? 0,
          quizSessions:     d.studyTimer?.totalSessions ?? 0,
          studyHours:       d.studyTimer?.totalTime  ?? '0m',
          studyHoursToday:  d.studyTimer?.todayTime  ?? '0m',
          studyStreak:      displayStreak,
          longestStreak:    Math.max(d.streak?.longest ?? 0, loginStreak),
          studiedToday:     d.streak?.studiedToday   ?? false,
          completedSessions: d.studyTimer?.totalSessions ?? 0,
          totalFlashcards:  d.flashcards?.totalCards ?? 0,
          masteredCards:    d.flashcards?.mastered   ?? 0,
          masteryRate:      d.flashcards?.masteryRate ?? '0%',
          upcomingReminders: reminders.length,
          cbtExamsTaken:    d.cbt?.examsTaken        ?? 0,
          cbtAccuracy:      parseInt(d.cbt?.overallAccuracy) || 0,
          bestCBTSubject:   d.cbt?.bestSubject       ?? 'N/A',
          xp:               progData?.xp             ?? 0,
          level:            progData?.levelInfo?.level ?? progData?.level ?? 1,
          rank:             progData?.levelInfo?.name  ?? progData?.levelName ?? 'Novice',
          nextRank:         progData?.levelInfo?.nextLevel?.name ?? 'Scholar',
          progressToNext:   progData?.levelInfo?.progress ?? 0,
        })

        // Strengths & Weaknesses from CBT subject breakdown
        setStrengthsWeaknesses(
          d.cbt?.strengthsWeaknesses ?? { strengths: [], weaknesses: [] }
        )

        // Recent Activity — map icon types
        const timeline = (d.recentActivity ?? []).map((item: any, i: number) => {
          const icon =
            item.type === 'cbt_result'       ? FiTarget :
            item.type === 'flashcard_created' ? BiBrain  : FiClock
          return {
            id:       item.id   ?? i,
            title:    item.title    ?? 'Activity',
            subtitle: item.subtitle ?? 'Recent action',
            date:     item.date,
            icon,
          }
        })
        setActivities(timeline)

      } else if (progData) {
        // Summary API failed but progress works — show what we can
        setStats(prev => ({
          ...prev,
          xp:             progData.xp              ?? 0,
          level:          progData.levelInfo?.level ?? progData.level ?? 1,
          rank:           progData.levelInfo?.name  ?? progData.levelName ?? 'Novice',
          nextRank:       progData.levelInfo?.nextLevel?.name ?? 'Scholar',
          progressToNext: progData.levelInfo?.progress ?? 0,
          studyStreak:    progData.streak ?? 0,
          upcomingReminders: reminders.length,
        }))
      }
    } catch (err: any) {
      console.error('Dashboard Load Error:', err)
      setDashboardError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDashboardData() }, [user?.uid])

  useEffect(() => {
    if (!user?.uid || typeof window === 'undefined') return
    const day = new Date().toISOString().split('T')[0]
    const key = `sh_daily_xp_${day}`
    if (sessionStorage.getItem(key)) return
    progressApi.award('daily_login').then((res) => {
      sessionStorage.setItem(key, '1')
      const d = res.data as { xpAdded?: number; newBadges?: { icon: string; name: string }[] }
      if (d.xpAdded != null) showXPToast(d.xpAdded)
      if (d.newBadges?.length) showBadgeToast(d.newBadges[0])
      // Refresh to update streak
      loadDashboardData();
    }).catch(() => { })
  }, [user?.uid])

  const R = 32
  const CIRC = 2 * Math.PI * R
  const dashOffset = CIRC - (stats.progressToNext / 100) * CIRC

  if (loading) {
      return (
          <div className="dashboard-v3-container flex items-center justify-center min-h-screen">
              <div className="text-center">
                  <FiLoader className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                  <p className="font-medium opacity-60">Preparing your study hub...</p>
              </div>
          </div>
      )
  }

  return (
    <ProtectedRoute allowedRoles={['student', 'teacher']}>
      <div className="dashboard-v3-container pb-24 md:pb-8">
        {user && user.onboarding?.completed === false && (
          <SetupWizard user={user} onComplete={() => void useAuthStore.getState().refreshUser()} />
        )}

        <section className="mb-10">
            <h2 className="text-lg font-bold mb-4 px-2">Core Study Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/dashboard/cbt?start=true" className="action-card teal">
                    <div className="action-icon-wrap"><FiZap className="text-2xl" /></div>
                    <div><h3 className="action-title">Past Question</h3><p className="action-subtitle">WAEC/JAMB/NECO</p></div>
                </Link>
                <Link href="/dashboard/pdf-summary" className="action-card blue">
                    <div className="action-icon-wrap"><FiBook className="text-2xl" /></div>
                    <div><h3 className="action-title">PDF Summary</h3></div>
                </Link>
                <Link href="/dashboard/tutor" className="action-card purple">
                    <div className="action-icon-wrap sparkles-glow"><BiBrain className="text-2xl text-white" /></div>
                    <div><h3 className="action-title">AI Study Tutor</h3><p className="action-subtitle">Ask anything & Learn</p></div>
                </Link>
                <Link href="/dashboard/question-bank" className="action-card gold">
                    <div className="action-icon-wrap"><FiGrid className="text-2xl" /></div>
                    <div><h3 className="action-title">Question Generator</h3></div>
                </Link>
            </div>
        </section>

        <section className="mb-10 px-2">
            <Link href="/dashboard/study-planner" className="planner-promo-card">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">🎯</div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Set up your study plan today 🎯</h3>
                        <p className="text-sm text-white/80">Get a personalized weekly schedule to crush your goals.</p>
                    </div>
                </div>
                <FiArrowRight className="text-xl text-white" />
            </Link>
        </section>

        <section className="mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-lg font-bold">Upcoming Reminders</h2>
                <Link href="/dashboard/timetable" className="text-xs font-bold flex items-center gap-1 text-indigo-600 dark:text-indigo-400">Manage <FiArrowRight /></Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {upcomingReminders.length > 0 ? upcomingReminders.map((reminder) => {
                    // Avoid UTC shifting for display
                    const [y, m, d] = reminder.date.split('-').map(Number);
                    const localDate = new Date(y, m - 1, d);
                    
                    return (
                        <div key={reminder.id} className="v3-card min-w-[280px] flex items-center justify-between">
                            <div>
                                <p className="font-bold text-sm">{reminder.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {reminder.time} • {localDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <FiClock className="text-orange-500" />
                            </div>
                        </div>
                    );
                }) : <div className="v3-card w-full flex items-center justify-center py-6 border-dashed opacity-60"><p className="text-sm text-gray-500 dark:text-gray-400 italic">No reminders for now</p></div>}
            </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <section>
                <h2 className="text-lg font-bold mb-4 px-2">My Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="streak-card-pinned v3-card">
                        <span className="pinned-badge">Pinned</span>
                        <div className="mt-6 flex flex-col items-center justify-center py-4">
                            <FiStar className="text-3xl text-yellow-500 mb-2 fill-yellow-500" />
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Streak:</p>
                            <p className="text-2xl font-black text-yellow-500">{stats.studyStreak} Days</p>
                        </div>
                    </div>
                    <div className="v3-card flex items-center gap-6">
                        <div className="progress-circle-wrap">
                            <svg className="progress-circle-svg" viewBox="0 0 80 80">
                                <circle className="progress-circle-bg" cx="40" cy="40" r={R} />
                                <circle className="progress-circle-fg" cx="40" cy="40" r={R} strokeDasharray={CIRC} strokeDashoffset={dashOffset} />
                            </svg>
                            <div className="progress-circle-text">{stats.progressToNext}%</div>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Next Rank:</p>
                            <h3 className="text-xl font-bold">{stats.nextRank}</h3>
                            <p className="text-sm font-bold mt-2 text-indigo-600 dark:text-indigo-400">XP: {stats.xp.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-4 px-2">
                    <Link href="/dashboard/student/community" className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-purple-500/50 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 rounded-xl transition-all group">
                        <FiAward className="text-gray-500 group-hover:text-purple-500" />
                        <span className="text-xs font-bold text-gray-400 group-hover:text-purple-400">View Leaderboard</span>
                    </Link>
                </div>
            </section>
            <section>
                <h2 className="text-lg font-bold mb-4 px-2">Subscription Status</h2>
                <SubscriptionStatusCard />
            </section>
        </div>

        <section className="mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-lg font-bold">My Tools</h2>
                <FiZap className="text-gray-500" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/dashboard/study-timer" className="tool-card">
                    <div className="tool-icon bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"><BiTimer className="text-2xl" /></div>
                    <div><p className="font-bold text-sm">Timer</p><p className="text-[10px] text-slate-500 dark:text-gray-300">{stats.quizSessions} sessions</p></div>
                </Link>
                <Link href="/dashboard/cgpa" className="tool-card">
                    <div className="tool-icon bg-purple-500/20 text-purple-600 dark:text-purple-400"><FiCreditCard className="text-2xl" /></div>
                    <div><p className="font-bold text-sm">CGPA</p></div>
                </Link>
                <Link href="/dashboard/timetable" className="tool-card">
                    <div className="tool-icon bg-blue-500/20 text-blue-600 dark:text-blue-400"><FiCalendar className="text-2xl" /></div>
                    <div><p className="font-bold text-sm">Schedule</p></div>
                </Link>
                <Link href="/dashboard/analytics" className="tool-card">
                    <div className="tool-icon bg-orange-500/20 text-orange-600 dark:text-orange-400"><FiBarChart2 className="text-2xl" /></div>
                    <div><p className="font-bold text-sm">Progress</p></div>
                </Link>
            </div>
        </section>

        <section className="mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-lg font-bold">Recent Activity</h2>
                <Link href="/dashboard/analytics" className="text-xs font-bold flex items-center gap-1 text-indigo-600 dark:text-indigo-400">View all <FiArrowRight /></Link>
            </div>
            <div className="v3-card divide-y divide-slate-200 dark:divide-gray-800">
                {activities.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center opacity-60">
                        <FiClock className="text-3xl text-gray-500 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet — start studying to see your history here!</p>
                    </div>
                ) : activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="py-4 flex items-center gap-4 first:pt-0 last:pb-0">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-gray-800"><activity.icon className="text-xl text-slate-600 dark:text-gray-300" /></div>
                        <div className="flex-1"><p className="font-bold text-sm">{activity.title}</p><p className="text-xs text-slate-500 dark:text-gray-400">{activity.subtitle}</p></div>
                        <p className="text-[10px] text-slate-400 dark:text-gray-300 font-medium">{activity.date ? new Date(activity.date).toLocaleDateString() : ''}</p>
                    </div>
                ))}
            </div>
        </section>

        <section className="mb-10">
            <h2 className="text-lg font-bold mb-4 px-2">Strengths & Weaknesses</h2>
            {(strengthsWeaknesses.strengths.length === 0 && strengthsWeaknesses.weaknesses.length === 0) ? (
                <div className="v3-card flex flex-col items-center justify-center py-8 text-center opacity-60">
                    <FiTarget className="text-3xl text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Complete some Past Questions to see your subject strengths and areas to improve.</p>
                    <Link href="/dashboard/cbt" className="mt-3 text-xs text-purple-400 font-bold">Try Past Questions →</Link>
                </div>
            ) : (
                <div className="sw-grid">
                    {strengthsWeaknesses.weaknesses.slice(0, 3).map((item, i) => (
                        <div key={i} className="sw-card sw-red">
                            <p className="font-bold text-sm">{item.subject}</p>
                            <p className="text-[10px] mt-1">{Math.round(item.avgAccuracy ?? 0)}% (Focus)</p>
                        </div>
                    ))}
                    {strengthsWeaknesses.strengths.slice(0, 3).map((item, i) => (
                        <div key={i} className="sw-card sw-green">
                            <p className="font-bold text-sm">{item.subject}</p>
                            <p className="text-[10px] mt-1">{Math.round(item.avgAccuracy ?? 0)}% (Strong)</p>
                        </div>
                    ))}
                </div>
            )}
        </section>

        <MobileBottomNav />
      </div>
    </ProtectedRoute>
  )
}

function SubscriptionStatusCard() {
    const { user } = useAuthStore()
    const [status, setStatus] = useState<any | null>(null)
    const [referralStats, setReferralStats] = useState<any | null>(null)
    useEffect(() => {
        paymentApi.getStatus().then(d => d?.success && setStatus(d))
        apiClient.get('/referral/stats')
            .then(r => r.data?.status === 'success' && setReferralStats(r.data.data))
            .catch(() => {})
    }, [])
    
    const planType = status?.subscription?.plan || user?.plan?.type || 'free'
    const daysLeft = status?.subscription?.daysLeft ?? 0

    // Resolve a human-readable plan name
    const planNames: Record<string, string> = {
      free: 'Free Plan',
      weekly: 'Weekly Plan',
      monthly: 'Monthly Plan',
      yearly: 'Yearly Plan',
      daily: 'Daily Plan',
    }
    const planName = planNames[planType] ?? 'Free Plan'
    const isPaid = planType !== 'free'
    const isDailyReferralBonus = planType === 'daily' && isPaid

    return (
      <div className="sub-card v3-card flex flex-col justify-between min-h-[220px]">
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Subscription Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isPaid
                    ? 'bg-emerald-500/25 text-emerald-400'
                    : 'bg-slate-500/20 text-slate-300'
                }`}>
                    {isPaid ? 'Active' : 'Free'}
                </span>
            </div>
            <h3 className="text-2xl font-black text-white">{planName}</h3>

            {/* Referral bonus badge for daily plan */}
            {isDailyReferralBonus && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-300 text-[10px] font-black uppercase tracking-wider">
                    <FiAward className="text-yellow-400" size={10} />
                    🎁 Referral Bonus
                </div>
            )}
            
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
                <FiClock className="text-orange-500" />
                <span>Plan expires in <span className="text-orange-400 font-bold">{daysLeft} day(s)</span></span>
            </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
            <Link 
                href="/dashboard/pricing" 
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                <FiZap className="text-yellow-300" />
                <span>{isPaid ? 'Manage Subscription' : 'Upgrade Plan'}</span>
            </Link>
            {/* Share CTA for free-plan users */}
            {!isPaid && (
                <Link
                    href="/dashboard/settings?tab=referrals"
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <FiUsers size={13} className="text-green-400" />
                    <span>Share & Get <span className="text-green-400">1 Free Day</span></span>
                </Link>
            )}
        </div>
      </div>
    )
}

function getErrorMessage(error: any): string {
  return error?.response?.data?.message || error?.message || 'Please try again.'
}
