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

        <header className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-800/50 rounded-full"><FiTarget className="text-gray-400" /></div>
                <div className="text-sm"><p className="text-gray-400 font-medium">Dashboard</p></div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 bg-blue-500/10 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: '#8B7CF8' }}>
                        <FiAward className="text-xs" /><span>{stats.rank}</span>
                    </div>
                    <p className="font-bold text-sm">{user?.name || 'Student'}</p>
                </div>
                <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/30">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Student'}`} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                </div>
                <Link href="/dashboard/notifications" aria-label="View notifications">
                    <FiBell className="text-xl text-gray-400 cursor-pointer hover:text-purple-500 transition-colors" />
                </Link>
            </div>
        </header>

        <section className="mb-10">
            <h2 className="text-lg font-bold mb-4 px-2">Core Study Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/dashboard/cbt?start=true" className="action-card teal">
                    <div className="action-icon-wrap"><FiZap className="text-2xl" /></div>
                    <div><h3 className="action-title">Past Question</h3><p className="action-subtitle">WAEC/JAMB/NECO</p></div>
                </Link>
                <Link href="/dashboard/question-bank?tab=notes" className="action-card blue">
                    <div className="action-icon-wrap"><FiBook className="text-2xl" /></div>
                    <div><h3 className="action-title">Note Generator</h3></div>
                </Link>
                <Link href="/dashboard/question-bank?tab=tutor" className="action-card purple">
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
                <Link href="/dashboard/timetable" className="text-xs font-bold flex items-center gap-1" style={{ color: '#8B7CF8' }}>Manage <FiArrowRight /></Link>
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
                                <p className="text-xs text-gray-400">
                                    {reminder.time} • {localDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <FiClock className="text-orange-500" />
                            </div>
                        </div>
                    );
                }) : <div className="v3-card w-full flex items-center justify-center py-6 border-dashed opacity-60"><p className="text-sm text-gray-400 italic">No reminders for now</p></div>}
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
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Streak:</p>
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
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Next Rank:</p>
                            <h3 className="text-xl font-bold">{stats.nextRank}</h3>
                            <p className="text-sm font-bold mt-2" style={{ color: '#8B7CF8' }}>XP: {stats.xp.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-4 px-2">
                    <Link href="/dashboard/student/community" className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-800 hover:border-purple-500/50 hover:bg-purple-500/5 rounded-xl transition-all group">
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
                    <div className="tool-icon bg-cyan-500/20 text-cyan-400"><BiTimer className="text-2xl" /></div>
                    <div><p className="font-bold text-sm">Timer</p><p className="text-[10px] text-gray-300">{stats.quizSessions} sessions</p></div>
                </Link>
                <Link href="/dashboard/cgpa" className="tool-card">
                    <div className="tool-icon bg-purple-500/20 text-purple-400"><FiCreditCard className="text-2xl" /></div>
                    <div><p className="font-bold text-sm">CGPA</p></div>
                </Link>
                <Link href="/dashboard/timetable" className="tool-card">
                    <div className="tool-icon bg-blue-500/20 text-blue-400"><FiCalendar className="text-2xl" /></div>
                    <div><p className="font-bold text-sm">Schedule</p></div>
                </Link>
                <Link href="/dashboard/analytics" className="tool-card">
                    <div className="tool-icon bg-orange-500/20 text-orange-400"><FiBarChart2 className="text-2xl" /></div>
                    <div><p className="font-bold text-sm">Progress</p></div>
                </Link>
            </div>
        </section>

        <section className="mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-lg font-bold">Recent Activity</h2>
                <Link href="/dashboard/analytics" className="text-xs font-bold flex items-center gap-1" style={{ color: '#8B7CF8' }}>View all <FiArrowRight /></Link>
            </div>
            <div className="v3-card divide-y divide-gray-800">
                {activities.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center text-center opacity-60">
                        <FiClock className="text-3xl text-gray-500 mb-2" />
                        <p className="text-sm text-gray-400">No activity yet — start studying to see your history here!</p>
                    </div>
                ) : activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="py-4 flex items-center gap-4 first:pt-0 last:pb-0">
                        <div className="p-2 rounded-xl bg-gray-800"><activity.icon className="text-xl" /></div>
                        <div className="flex-1"><p className="font-bold text-sm">{activity.title}</p><p className="text-xs text-gray-400">{activity.subtitle}</p></div>
                        <p className="text-[10px] text-gray-300 font-medium">{activity.date ? new Date(activity.date).toLocaleDateString() : ''}</p>
                    </div>
                ))}
            </div>
        </section>

        <section className="mb-10">
            <h2 className="text-lg font-bold mb-4 px-2">Strengths & Weaknesses</h2>
            {(strengthsWeaknesses.strengths.length === 0 && strengthsWeaknesses.weaknesses.length === 0) ? (
                <div className="v3-card flex flex-col items-center justify-center py-8 text-center opacity-60">
                    <FiTarget className="text-3xl text-gray-500 mb-2" />
                    <p className="text-sm text-gray-400">Complete some Past Questions to see your subject strengths and areas to improve.</p>
                    <Link href="/dashboard/cbt" className="mt-3 text-xs text-purple-400 font-bold">Try Past Questions →</Link>
                </div>
            ) : (
                <div className="sw-grid">
                    {strengthsWeaknesses.weaknesses.slice(0, 3).map((item, i) => (
                        <div key={i} className="sw-card sw-red">
                            <p className="font-bold text-sm">{item.subject}</p>
                            <p className="text-[10px] text-gray-300 mt-1">{Math.round(item.avgAccuracy ?? 0)}% (Focus)</p>
                        </div>
                    ))}
                    {strengthsWeaknesses.strengths.slice(0, 3).map((item, i) => (
                        <div key={i} className="sw-card sw-green">
                            <p className="font-bold text-sm">{item.subject}</p>
                            <p className="text-[10px] text-gray-300 mt-1">{Math.round(item.avgAccuracy ?? 0)}% (Strong)</p>
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
    useEffect(() => { paymentApi.getStatus().then(d => d?.success && setStatus(d)) }, [])
    
    return (
      <div className="sub-card v3-card">
        <div className="flex items-center justify-between mb-4">
            <div>
                <h3 className="text-xl font-black">{status?.subscription?.plan === 'free' ? 'Standard' : 'Pro'}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Subscription Status</p>
            </div>
            <Link href="/dashboard/pricing" aria-label="Go to pricing" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <FiArrowRight className="text-lg" />
            </Link>
        </div>

        <div className="mt-4 p-3 bg-black/20 rounded-xl space-y-3">
            <p className="text-xs font-bold text-gray-300">Your Current Usage</p>
            
            <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                    <span className="flex items-center gap-1.5 text-gray-300">🤖 AI Messages</span>
                    <span className="font-bold">{status?.usage?.ai?.used ?? 0}/{status?.usage?.ai?.limit ?? 5}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500" 
                        style={{ width: `${Math.min(100, ((status?.usage?.ai?.used ?? 0) / (status?.usage?.ai?.limit ?? 5)) * 100)}%` }}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                    <span className="flex items-center gap-1.5 text-gray-300">📇 Flashcard Sets</span>
                    <span className="font-bold">{status?.usage?.flashcards?.used ?? 0}/{status?.usage?.flashcards?.limit ?? 3}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-purple-500 transition-all duration-500" 
                        style={{ width: `${Math.min(100, ((status?.usage?.flashcards?.used ?? 0) / (status?.usage?.flashcards?.limit ?? 3)) * 100)}%` }}
                    />
                </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-gray-800/30">
                {(() => {
                    const totalReferralCredits = user?.aiCredits ?? 5;
                    const aiUsed = status?.usage?.ai?.used ?? 0;
                    const aiLimit = status?.usage?.ai?.limit ?? 5;
                    const usedReferralCredits = Math.min(totalReferralCredits, Math.max(0, aiUsed - aiLimit));
                    
                    return (
                        <>
                            <div className="flex justify-between items-center text-[11px]">
                                <span className="flex items-center gap-1.5 text-gray-300">🎁 AI Referral Credits</span>
                                <span className="font-bold text-yellow-400">{usedReferralCredits}/{totalReferralCredits} Used</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-yellow-500 transition-all duration-500" 
                                    style={{ width: `${Math.min(100, (usedReferralCredits / totalReferralCredits) * 100)}%` }}
                                />
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] text-gray-400 bg-orange-500/10 p-2 rounded-lg">
            <FiClock className="text-orange-500" />
            <span>Plan expires in <span className="text-orange-400 font-bold">{status?.subscription?.daysLeft ?? 0} day(s)</span></span>
        </div>

        {status?.subscription?.plan === 'free' && (
            <div className="mt-6">
                <Link 
                    href="/dashboard/pricing" 
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <FiZap className="animate-pulse text-yellow-300" />
                    <span>Upgrade to Pro Plan</span>
                </Link>
                <p className="text-[10px] text-center text-gray-500 mt-2 font-medium">Unlock unlimited AI messages & more</p>
            </div>
        )}
      </div>
    )
}

function getErrorMessage(error: any): string {
  return error?.response?.data?.message || error?.message || 'Please try again.'
}
