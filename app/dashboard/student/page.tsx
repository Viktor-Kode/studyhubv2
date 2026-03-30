'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import ProgressWidget from '@/components/ProgressWidget'
import { progressApi } from '@/lib/api/progressApi'
import { showBadgeToast, showXPToast } from '@/hooks/useProgress'
import { useAuthStore } from '@/lib/store/authStore'
import { getFirebaseToken } from '@/lib/store/authStore'
import { apiClient } from '@/lib/api/client'
import { getAllQuizSessions } from '@/lib/api/quizApi'
import { getFlashCardStats } from '@/lib/api/flashcardApi'
import { cbtApi } from '@/lib/api/cbt'
import {
  FiBook, FiClock, FiCreditCard, FiBarChart2,
  FiCalendar, FiGrid, FiTrendingUp, FiAward,
  FiCheckCircle, FiArrowRight, FiZap, FiBell,
  FiTarget, FiLoader, FiStar, FiAlertCircle
} from 'react-icons/fi'
import { MdQuiz, MdSchool, MdClass } from 'react-icons/md'
import { BiCard, BiTimer, BiBrain } from 'react-icons/bi'
import Link from 'next/link'
import { classService, Class } from '@/lib/services/classService'
import { reminderService, Reminder } from '@/lib/services/reminderService'
import { timetableService, TimetableSlot } from '@/lib/services/timetableService'
import { paymentApi } from '@/lib/api/paymentApi'
import WhatsAppChannelBanner from '@/components/WhatsAppChannelBanner'
import SetupWizard from '@/components/onboarding/SetupWizard'
import NextStepsCard from '@/components/onboarding/NextStepsCard'

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
    masteryRate: '0%'
  })
  const [activities, setActivities] = useState<any[]>([])
  const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([])
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([])
  const [nextClass, setNextClass] = useState<TimetableSlot | null>(null)
  const [nextClassId, setNextClassId] = useState<string | null>(null)
  const [strengthsWeaknesses, setStrengthsWeaknesses] = useState<{ strengths: any[]; weaknesses: any[] }>({
    strengths: [],
    weaknesses: [],
  })

  const loadDashboardData = async () => {
    try {
      if (user?.uid) {
        setLoading(true)
        setDashboardError(null)
        const [classes, reminders, summaryRes] = await Promise.all([
          classService.getStudentClasses(user.uid),
          reminderService.getUpcoming(user.uid, 7),
          apiClient.get('/dashboard/summary').catch(() => null)
        ])

        setEnrolledClasses(classes)
        setUpcomingReminders(reminders)

        if (summaryRes?.data?.data) {
          const sumData = summaryRes.data.data;
          setStats({
            totalQuestions: sumData.cbt.totalQuestions || 0,
            quizSessions: sumData.studyTimer.totalSessions || 0,
            studyHours: sumData.studyTimer.totalTime || '0m', // Now a string via formatTime
            studyHoursToday: sumData.studyTimer.todayTime || '0m',
            studyStreak: sumData.streak.current || 0,
            longestStreak: sumData.streak.longest || 0,
            studiedToday: sumData.streak.studiedToday || false,
            completedSessions: sumData.studyTimer.totalSessions || 0,
            totalFlashcards: sumData.flashcards.totalCards || 0,
            masteredCards: sumData.flashcards.mastered || 0,
            masteryRate: sumData.flashcards.masteryRate || '0%',
            upcomingReminders: reminders.length,
            cbtExamsTaken: sumData.cbt.examsTaken || 0,
            cbtAccuracy: parseInt(sumData.cbt.overallAccuracy) || 0,
            bestCBTSubject: sumData.cbt.bestSubject || 'N/A'
          })
          setStrengthsWeaknesses(sumData.cbt?.strengthsWeaknesses || { strengths: [], weaknesses: [] })

          // Prefer backend recent activity feed; fallback to study sessions for compatibility.
          const timeline = (sumData.recentActivity || []).map((item: any, i: number) => {
            const icon =
              item.type === 'cbt_result'
                ? FiTarget
                : item.type === 'flashcard_created'
                  ? BiCard
                  : FiClock
            return {
              id: item.id || i,
              title: item.title || 'Activity',
              subtitle: item.subtitle || 'Recent action',
              date: item.date,
              icon,
              color: item.color || 'blue',
            }
          })

          if (timeline.length > 0) {
            setActivities(timeline)
          } else {
            const history = sumData.studyTimer.recentSessions || []
            setActivities(history.map((h: any, i: number) => ({
              id: i,
              title: h.subject || 'Study Session',
              subtitle: h.durationSeconds ? `${Math.round(h.durationSeconds / 60)} minutes` : 'Just started',
              date: h.date,
              icon: FiClock,
              color: 'blue'
            })))
          }
        }

        // Find next class from enrolled classes
        if (classes.length > 0) {
          const allSlots: TimetableSlot[] = []
          for (const cls of classes) {
            const slots = await timetableService.getClassTimetable(cls.id)
            allSlots.push(...slots)
          }

          if (allSlots.length > 0) {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
            const now = new Date()
            const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

            const upcomingSlots = allSlots.filter(s => {
              if (s.day !== today) return false
              return s.startTime > nowTime
            }).sort((a, b) => a.startTime.localeCompare(b.startTime))

            if (upcomingSlots.length > 0) {
              setNextClass(upcomingSlots[0])
              setNextClassId(upcomingSlots[0].classId)
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to load dashboard:', err)
      setDashboardError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [user?.uid])

  useEffect(() => {
    if (user?.uid) void useAuthStore.getState().refreshUser()
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid || typeof window === 'undefined') return
    const day = new Date().toISOString().split('T')[0]
    const key = `sh_daily_xp_${day}`
    if (sessionStorage.getItem(key)) return
    progressApi
      .award('daily_login')
      .then((res) => {
        sessionStorage.setItem(key, '1')
        const d = res.data as { xpAdded?: number; newBadges?: { icon: string; name: string }[] }
        if (d.xpAdded != null) showXPToast(d.xpAdded)
        if (d.newBadges?.length) showBadgeToast(d.newBadges[0])
      })
      .catch(() => {})
  }, [user?.uid])

  const quickLinks = [
    {
      href: '/dashboard/question-bank',
      icon: FiBook,
      label: 'Question Generator',
      color: 'emerald',
      description: 'Practice with AI-generated questions'
    },
    {
      href: '/dashboard/study-timer',
      icon: BiTimer,
      label: 'Study Timer',
      color: 'cyan',
      description: 'Pomodoro technique timer'
    },
    {
      href: '/dashboard/cgpa',
      icon: FiCreditCard,
      label: 'CGPA Calculator',
      color: 'blue',
      description: 'Track your academic performance'
    },
    {
      href: '/dashboard/timetable',
      icon: FiCalendar,
      label: 'Timetable & Reminders',
      color: 'purple',
      description: 'Schedule and reminders'
    },
    {
      href: '/dashboard/cbt',
      icon: MdQuiz,
      label: 'CBT Practice',
      color: 'orange',
      description: 'WAEC, JAMB, NECO past questions'
    },
    {
      href: '/dashboard/flip-cards',
      icon: BiCard,
      label: 'Flashcard Hub',
      color: 'pink',
      description: 'Interactive flashcards'
    },
    {
      href: '/dashboard/analytics',
      icon: FiBarChart2,
      label: 'Progress Analytics',
      color: 'orange',
      description: 'Track your learning journey'
    },
  ]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'from-emerald-500 to-emerald-600',
      cyan: 'from-cyan-500 to-cyan-600',
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
    }
    return colors[color] || colors.blue
  }

  const fallbackClassesFromOnboarding = (() => {
    const selectedSubjects = user?.onboarding?.subjects || []
    const selectedExams = user?.onboarding?.examTypes || (user?.onboarding?.examType ? [user.onboarding.examType] : [])
    if (!selectedSubjects.length) return []
    return selectedSubjects.map((subject, index) => ({
      id: `onboarding-${subject}-${index}`,
      name: `${subject} Practice Class`,
      subject,
      examLabel: selectedExams.join(', '),
    }))
  })()

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="space-y-8">
        {user && user.onboarding?.completed === false && (
          <SetupWizard
            user={user}
            onComplete={() => void useAuthStore.getState().refreshUser()}
          />
        )}

        {user?.onboarding?.completed && user ? <NextStepsCard user={user} /> : null}

        <WhatsAppChannelBanner />
        {dashboardError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-red-700">Could not refresh dashboard data</p>
              <p className="text-xs text-red-600 mt-1">{dashboardError}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadDashboardData()}
              className="shrink-0 rounded-lg bg-red-600 text-white text-xs font-semibold px-3 py-1.5 hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Today's Reminders (priority card) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <FiBell className="text-orange-500" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Today&apos;s Reminders</h2>
          </div>
          {upcomingReminders.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {upcomingReminders.slice(0, 3).map((reminder) => (
                <div key={reminder.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{reminder.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{new Date(reminder.date).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    {reminder.time}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <FiAlertCircle className="mx-auto text-gray-500 dark:text-gray-300 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">No reminders yet. Set one now to stay on track.</p>
              <Link href="/dashboard/timetable" className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                Set a Reminder <FiArrowRight />
              </Link>
            </div>
          )}
        </div>

        {/* Welcome Section */}
        <div className="mb-4" data-tour="student-welcome">
          <div className="flex items-center gap-3 mb-2">
            <MdSchool className="text-3xl text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {user?.name || user?.email?.split('@')[0] || 'Student'}!
            </h1>
          </div>
          {(user?.schoolName || user?.classLevel || user?.courseOfStudy) ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {user?.schoolName ? (
                <span className="inline-flex items-center gap-1.5">
                  <MdSchool className="text-lg text-indigo-500 shrink-0" />
                  <span>{user.schoolName}</span>
                </span>
              ) : null}
              {user?.classLevel ? (
                <span className="inline-flex items-center gap-1.5">
                  <MdClass className="text-lg text-violet-500 shrink-0" />
                  <span>{user.classLevel}</span>
                </span>
              ) : null}
              {user?.courseOfStudy ? (
                <span className="inline-flex items-center gap-1.5">
                  <FiBook className="text-lg text-emerald-600 shrink-0" />
                  <span>Studying {user.courseOfStudy}</span>
                </span>
              ) : null}
            </p>
          ) : null}
          <p className="text-gray-600 dark:text-gray-400 mt-1 mb-4">
            Have a productive learning session today.
            {!loading && stats.studyStreak >= 1 && stats.studiedToday && (
              <span className="ml-2 font-bold text-orange-500">🔥 {stats.studyStreak} Day Streak {stats.studyStreak >= 3 ? '— keep it up!' : ''}</span>
            )}
            {!loading && stats.studyStreak >= 1 && !stats.studiedToday && (
              <span className="ml-2 font-bold text-amber-600 dark:text-amber-400">Study today to keep your {stats.studyStreak} day streak!</span>
            )}
            {!loading && stats.studyStreak === 0 && (
              <span className="ml-2 font-medium text-blue-500">Do any activity to start your streak!</span>
            )}
          </p>
          {nextClass && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                <FiClock className="text-2xl" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Next Class Coming Up</p>
                <p className="font-bold text-gray-900 dark:text-white">{nextClass.subject} at {nextClass.startTime}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">{nextClass.room || 'Online Session'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-md">
          <ProgressWidget onViewFull={() => router.push('/dashboard/student/community')} />
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg h-32 flex flex-col justify-between border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-4"></div>
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`rounded-xl p-6 text-white shadow-lg ${stats.studyStreak > 0 && !stats.studiedToday ? 'bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-400' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
              <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-white/90 mb-1">Study Streak</p>
                  <p className="text-3xl font-bold">{stats.studyStreak}</p>
                  <p className="text-xs text-white/80 mt-1">
                    {stats.studyStreak === 0 && 'Do any activity to start'}
                    {stats.studyStreak > 0 && stats.studiedToday && 'Done for today ✓'}
                    {stats.studyStreak > 0 && !stats.studiedToday && 'Study today to keep it!'}
                  </p>
                  <p className="text-xs text-white/70 mt-1">Best: {stats.longestStreak} days</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <span className="text-3xl">🔥</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-100 mb-1">Study Hours</p>
                  <p className="text-3xl font-bold">{stats.studyHours}</p>
                  <p className="text-xs text-cyan-100 mt-1">{stats.completedSessions} sessions</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <FiClock className="text-3xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-100 mb-1">CBT Accuracy</p>
                  <p className="text-3xl font-bold">{stats.cbtAccuracy}%</p>
                  <p className="text-xs text-emerald-100 mt-1">{stats.cbtExamsTaken} exams taken</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <FiTarget className="text-3xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <p className="text-sm text-white/90 mb-1">Flashcards Created</p>
                  <p className="text-3xl font-bold">{stats.totalFlashcards}</p>
                  <p className="text-xs text-white/80 mt-1">{stats.masteredCards} mastered</p>
                </div>
                <div className="bg-white/20 rounded-full p-3 ml-4">
                  <BiCard className="text-3xl" />
                </div>
              </div>
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-5 rounded-full blur-xl group-hover:scale-150 transition-transform"></div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Classes & Quick Links */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enrolled Classes */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MdClass className="text-blue-500" />
                My Enrolled Classes
              </h2>
              {enrolledClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {enrolledClasses.map((cls) => (
                    <div key={cls.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <FiBook className="text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{cls.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{cls.subject}</p>
                      <Link href={`/dashboard/timetable?classId=${cls.id}`} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                        View Timetable <FiArrowRight />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : fallbackClassesFromOnboarding.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fallbackClassesFromOnboarding.map((cls) => (
                    <div key={cls.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                          <FiBook className="text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{cls.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{cls.subject}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                        Suggested from your onboarding subjects{cls.examLabel ? ` (${cls.examLabel})` : ''}.
                      </p>
                      <Link href="/dashboard/timetable" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                        Create Class Timetable <FiArrowRight />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-gray-600 dark:text-gray-300 font-medium mb-2">You haven&apos;t enrolled in any classes yet.</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Start by adding subjects in your profile.
                  </p>
                  <Link
                    href="/dashboard/settings"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    Add subjects in your profile <FiArrowRight />
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Access */}
            <div data-tour="student-quick-access">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiGrid className="text-blue-500" />
                Quick Access
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickLinks.slice(0, 4).map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${getColorClasses(link.color)} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="text-white text-xl" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {link.label}
                          </h3>
                        </div>
                        <FiArrowRight className="text-gray-500 dark:text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Upcoming Reminders & Actions */}
          <div className="space-y-8">
            {/* Subscription Usage Card */}
            <SubscriptionUsageCard />

            {/* Upcoming Reminders */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiBell className="text-orange-500" />
                Upcoming Reminders
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {upcomingReminders.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {upcomingReminders.slice(0, 5).map((reminder) => (
                      <div key={reminder.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{reminder.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${new Date(`${reminder.date}T${reminder.time}`) < new Date()
                            ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                            {reminder.time}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">{new Date(reminder.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-600 dark:text-gray-300 text-sm">
                    No upcoming reminders.
                  </div>
                )}
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                  <Link href="/dashboard/timetable" className="text-xs font-bold text-blue-600 hover:underline flex items-center justify-center gap-1">
                    Manage Reminders <FiArrowRight />
                  </Link>
                </div>
              </div>
            </div>

            {/* DeepSeek AI Chat Quick Access */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <BiBrain className="text-2xl" />
                </div>
                <div>
                  <h3 className="font-bold">AI Assistant</h3>
                  <p className="text-xs text-white/80">Powered by DeepSeek</p>
                </div>
              </div>
              <p className="text-sm mb-4 text-white/90">Ask anything about your studies, questions, or concepts.</p>
              <Link
                href="/dashboard/chat"
                data-tour="student-ai-assistant"
                className="block w-full py-2 bg-white text-blue-600 rounded-xl font-bold text-center text-sm hover:bg-blue-50 transition-colors"
              >
                Start Chatting
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity & Achievements */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiLoader className={`${loading ? 'animate-spin' : ''} text-blue-500`} />
              Recent Activity
            </h2>

            {activities.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                {activities.map((activity) => {
                  const Icon = activity.icon
                  return (
                    <div key={activity.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className={`p-2 rounded-xl bg-${activity.color}-100 dark:bg-${activity.color}-900/30 text-${activity.color}-600 dark:text-${activity.color}-400`}>
                        <Icon className="text-xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {activity.title}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {activity.subtitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-tighter text-gray-500 dark:text-gray-300">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-300 font-medium">
                          {new Date(activity.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                <FiZap className="text-3xl text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                  No recent activity - try taking a CBT or creating flashcards!
                </p>
              </div>
            )}
          </div>

          {/* Strengths & Weaknesses Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiAward className="text-orange-500" />
              Strengths & Weaknesses
            </h2>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Strengths</p>
                {strengthsWeaknesses.strengths.length > 0 ? (
                  <div className="space-y-2">
                    {strengthsWeaknesses.strengths.map((item, idx) => (
                      <div key={`str-${idx}`} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.subject}</p>
                        <span className="text-xs font-bold text-emerald-600">{item.avgAccuracy}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600">Complete CBT practice to discover your strengths.</p>
                )}
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-widest text-rose-600 mb-2">Weaknesses</p>
                {strengthsWeaknesses.weaknesses.length > 0 ? (
                  <div className="space-y-2">
                    {strengthsWeaknesses.weaknesses.map((item, idx) => (
                      <div key={`weak-${idx}`} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.subject}</p>
                        <span className="text-xs font-bold text-rose-600">{item.avgAccuracy}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600">No weak areas yet. Keep practicing consistently.</p>
                )}
              </div>

              <div className="pt-2">
                <Link href="/dashboard/analytics" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group">
                  View full progress <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute >
  )
}

function getErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error.'
  const err = error as any
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    'Please check your connection and try again.'
  )
}

function SubscriptionUsageCard() {
  const [status, setStatus] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await paymentApi.getStatus()
        if (data?.success) setStatus(data)
      } catch {
        // ignore errors on dashboard
      }
    }
    load()
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <FiZap className="text-8xl transform rotate-12" />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-300 mb-1">Your Plan</h3>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-gray-900 dark:text-white capitalize">
              {status?.subscription?.plan || status?.subscription?.status || 'free'}
            </span>
            <FiStar className="text-yellow-500 fill-yellow-500 text-sm" />
          </div>
        </div>
        <Link
          href="/dashboard/pricing"
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
        >
          Upgrade
        </Link>
      </div>

      {status ? (
        <div className="space-y-5">
          {/* AI usage */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                AI Messages: {status.usage.ai.used} / {status.usage.ai.limit}
              </span>
              <span className="text-[10px] font-black text-purple-600">
                {Math.round((status.usage.ai.used / Math.max(status.usage.ai.limit, 1)) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-1000"
                style={{
                  width: `${Math.min((status.usage.ai.used / Math.max(status.usage.ai.limit, 1)) * 100, 100)}%`
                }}
              />
            </div>
          </div>

          {/* Flashcard usage */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Flashcard Sets: {status.usage.flashcards.used} / {status.usage.flashcards.limit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-1000"
                style={{
                  width: `${Math.min((status.usage.flashcards.used / Math.max(status.usage.flashcards.limit, 1)) * 100, 100)}%`
                }}
              />
            </div>
          </div>

          {/* CBT access info */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                CBT Practice:{' '}
                {status.subscription.status === 'active'
                  ? 'Unlimited practice tests included in your plan.'
                  : '1 free test per day. Upgrade to unlock full CBT access.'}
              </span>
            </div>
          </div>

          {status.subscription.expiresAt && (
            <p className="text-[10px] text-gray-500 dark:text-gray-300 font-medium italic">
              Expires: {new Date(status.subscription.expiresAt).toLocaleDateString()}
            </p>
          )}

          {/* Extra upgrade call-to-action */}
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[10px] text-gray-600 dark:text-gray-300">
              Need more AI, flashcards or CBT? Upgrade your plan.
            </p>
            <Link
              href="/dashboard/pricing"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors"
            >
              Upgrade
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Loading your subscription status...
        </p>
      )}
    </div>
  )
}

