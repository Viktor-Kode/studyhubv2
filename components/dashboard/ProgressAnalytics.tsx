'use client'

import { useState, useEffect } from 'react'
import {
  FiTrendingUp, FiTrendingDown, FiTarget, FiAward,
  FiClock, FiBookOpen, FiBarChart2, FiCalendar,
  FiCheckCircle, FiZap, FiLoader, FiRefreshCw,
  FiStar, FiBook, FiPlay, FiLayers
} from 'react-icons/fi'
import {
  BiBrain, BiCard, BiTimer, BiStats
} from 'react-icons/bi'
import {
  MdOutlineQuiz, MdLeaderboard
} from 'react-icons/md'
import { HiOutlineAcademicCap, HiOutlineLightBulb } from 'react-icons/hi'

// Import your API services
import { getAnalytics, getUserStats } from '@/lib/api/studyTimerApi'
import { getFlashCardStats } from '@/lib/api/flashcardApi'
import { apiClient } from '@/lib/api/client'

// Import auth hook
import { useAuthStore } from '@/lib/store/authStore'

type DateRange = '7d' | '30d' | '90d'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: number
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo'
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
    trend: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    value: 'text-green-700 dark:text-green-300',
    trend: 'text-green-600'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    value: 'text-purple-700 dark:text-purple-300',
    trend: 'text-purple-600'
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    value: 'text-orange-700 dark:text-orange-300',
    trend: 'text-orange-600'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    value: 'text-red-700 dark:text-red-300',
    trend: 'text-red-600'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
    value: 'text-indigo-700 dark:text-indigo-300',
    trend: 'text-indigo-600'
  }
}

function StatCard({ title, value, subtitle, icon, trend, color }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`${c.bg} ${c.border} border rounded-2xl p-5 flex items-start gap-4`}>
      <div className={`${c.icon} p-3 rounded-xl flex-shrink-0`}>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">{title}</p>
        <div className="flex items-end gap-2">
          <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
          {trend !== undefined && (
            <span className={`flex items-center gap-1 text-xs font-medium mb-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'
              }`}>
              {trend >= 0
                ? <FiTrendingUp className="text-xs" />
                : <FiTrendingDown className="text-xs" />
              }
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

function ProgressBar({ label, value, max, color }: {
  label: string
  value: number
  max: number
  color: string
}) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {value} <span className="text-gray-400 font-normal">/ {max}</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-right">{percentage}%</p>
    </div>
  )
}

function ActivityHeatmap({ sessions }: { sessions: any[] }) {
  // Generate last 4 weeks of dates
  const weeks: Date[][] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let week = 3; week >= 0; week--) {
    const days: Date[] = []
    for (let day = 6; day >= 0; day--) {
      const date = new Date(today)
      date.setDate(today.getDate() - (week * 7 + day))
      days.push(date)
    }
    weeks.push(days)
  }

  const activityMap: Record<string, number> = {}
  sessions.forEach(session => {
    const date = new Date(session.completedAt || session.startTime)
    const key = date.toISOString().split('T')[0]
    activityMap[key] = (activityMap[key] || 0) + (session.duration || 0)
  })

  const getColor = (minutes: number) => {
    if (minutes === 0) return 'bg-gray-100 dark:bg-gray-700'
    if (minutes < 30) return 'bg-green-200 dark:bg-green-900'
    if (minutes < 60) return 'bg-green-400 dark:bg-green-700'
    if (minutes < 120) return 'bg-green-500 dark:bg-green-600'
    return 'bg-green-700 dark:bg-green-400'
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => {
              const key = day.toISOString().split('T')[0]
              const minutes = activityMap[key] || 0
              return (
                <div
                  key={di}
                  className={`w-8 h-8 rounded-md ${getColor(minutes)} cursor-pointer transition hover:opacity-80`}
                  title={`${key}: ${minutes} minutes`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-gray-500">Less</span>
        {['bg-gray-100 dark:bg-gray-700', 'bg-green-200', 'bg-green-400', 'bg-green-500', 'bg-green-700'].map((c, i) => (
          <div key={i} className={`w-4 h-4 rounded ${c}`} />
        ))}
        <span className="text-xs text-gray-500">More</span>
      </div>
    </div>
  )
}

export default function ProgressAnalytics() {
  const { user } = useAuthStore() // adjust to match your project
  const userId = user?.id || ''

  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [activeSection, setActiveSection] = useState<'overview' | 'study' | 'flashcards' | 'quiz'>('overview')

  // Data state
  const [studyStats, setStudyStats] = useState<any>(null)
  const [studyAnalytics, setStudyAnalytics] = useState<any>(null)
  const [flashCardStats, setFlashCardStats] = useState<any>(null)
  const [localSessions, setLocalSessions] = useState<any[]>([])

  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90

  useEffect(() => {
    loadAllData()
  }, [dateRange])

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      // Backend uses JWT token to identify the user - no need to pass userId
      const [statsRes, analyticsRes, fcStatsRes, historyRes] = await Promise.allSettled([
        getUserStats(userId || 'me'),
        getAnalytics(userId || 'me', days),
        getFlashCardStats(userId || 'me'),
        apiClient.get('/study/history')
      ])

      if (statsRes.status === 'fulfilled') {
        setStudyStats(statsRes.value.stats)
      }
      if (analyticsRes.status === 'fulfilled') {
        setStudyAnalytics(analyticsRes.value.analytics)
      }
      if (fcStatsRes.status === 'fulfilled') {
        setFlashCardStats(fcStatsRes.value.stats || fcStatsRes.value)
      }
      if (historyRes.status === 'fulfilled') {
        const sessions = historyRes.value.data?.data || historyRes.value.data || []
        // Transform backend sessions to match expected format
        const transformed = sessions.map((s: any) => ({
          id: s._id,
          subject: s.title || 'Study Session',
          duration: s.duration || 0,
          completedAt: s.endTime || s.startTime || s.createdAt,
          startTime: s.startTime,
          sessionType: s.type || 'study'
        }))
        setLocalSessions(transformed)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Computed values from local sessions
  const totalStudyMinutes = localSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1)
  const totalSessions = localSessions.length

  const recentSessions = localSessions.filter(s => {
    const sessionDate = new Date(s.completedAt)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return sessionDate >= cutoff
  })

  const recentMinutes = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0)

  // Subject breakdown from local sessions
  const subjectMap: Record<string, number> = {}
  localSessions.forEach(s => {
    if (s.subject) {
      subjectMap[s.subject] = (subjectMap[s.subject] || 0) + (s.duration || 0)
    }
  })
  const subjectBreakdown = Object.entries(subjectMap)
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes)

  // Streak calculation
  const calculateStreak = () => {
    const sortedSessions = [...localSessions].sort((a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )

    let streak = 0
    let checkDate = new Date()
    checkDate.setHours(0, 0, 0, 0)

    const dateSet = new Set(sortedSessions.map(s =>
      new Date(s.completedAt).toISOString().split('T')[0]
    ))

    while (true) {
      const dateKey = checkDate.toISOString().split('T')[0]
      if (dateSet.has(dateKey)) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  const currentStreak = calculateStreak()

  const subjectColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <FiLoader className="animate-spin text-4xl text-blue-500 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading your analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Your learning journey at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as DateRange[]).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${dateRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
          <button
            onClick={loadAllData}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            title="Refresh"
          >
            <FiRefreshCw className="text-sm" />
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {[
          { id: 'overview', label: 'Overview', icon: <FiBarChart2 /> },
          { id: 'study', label: 'Study Timer', icon: <BiTimer /> },
          { id: 'flashcards', label: 'Flashcards', icon: <BiCard /> },
          { id: 'quiz', label: 'Quiz Bank', icon: <MdOutlineQuiz /> }
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${activeSection === id
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ======== OVERVIEW SECTION ======== */}
      {activeSection === 'overview' && (
        <div className="space-y-6">

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Study Time"
              value={`${totalStudyHours}h`}
              subtitle={`${totalSessions} sessions total`}
              icon={<FiClock />}
              color="blue"
            />
            <StatCard
              title="Current Streak"
              value={`${currentStreak} days`}
              subtitle={studyStats?.longestStreak ? `Best: ${studyStats.longestStreak} days` : 'Keep it up!'}
              icon={<FiZap />}
              color="orange"
            />
            <StatCard
              title="Cards Mastered"
              value={flashCardStats?.masteredCards || 0}
              subtitle={`of ${flashCardStats?.totalCards || 0} total cards`}
              icon={<BiCard />}
              color="green"
            />
            <StatCard
              title="Quiz Accuracy"
              value={`${flashCardStats?.accuracy || 0}%`}
              subtitle={`${flashCardStats?.totalReviews || 0} reviews`}
              icon={<FiTarget />}
              color="purple"
            />
          </div>

          {/* Activity Heatmap */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Study Activity</h3>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Last 4 weeks</span>
            </div>
            <ActivityHeatmap sessions={localSessions} />
          </div>

          {/* Subject Breakdown */}
          {subjectBreakdown.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <FiBookOpen className="text-green-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Time by Subject</h3>
              </div>
              <div className="space-y-4">
                {subjectBreakdown.slice(0, 6).map(({ subject, minutes }, index) => (
                  <ProgressBar
                    key={subject}
                    label={subject}
                    value={Math.round(minutes)}
                    max={subjectBreakdown[0].minutes}
                    color={subjectColors[index % subjectColors.length]}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quick Achievements */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <FiAward className="text-yellow-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">Achievements</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  title: 'First Session',
                  desc: 'Complete your first study session',
                  icon: <FiPlay />,
                  earned: totalSessions >= 1,
                  color: 'blue'
                },
                {
                  title: '5-Day Streak',
                  desc: 'Study 5 days in a row',
                  icon: <FiZap />,
                  earned: currentStreak >= 5,
                  color: 'orange'
                },
                {
                  title: '10 Hours',
                  desc: 'Study for 10 total hours',
                  icon: <FiClock />,
                  earned: totalStudyMinutes >= 600,
                  color: 'green'
                },
                {
                  title: 'Card Master',
                  desc: 'Master 10 flashcards',
                  icon: <BiCard />,
                  earned: (flashCardStats?.masteredCards || 0) >= 10,
                  color: 'purple'
                },
                {
                  title: 'Quiz Ace',
                  desc: 'Score 80%+ accuracy',
                  icon: <FiCheckCircle />,
                  earned: (flashCardStats?.accuracy || 0) >= 80,
                  color: 'green'
                },
                {
                  title: '3 Subjects',
                  desc: 'Study 3 different subjects',
                  icon: <FiBook />,
                  earned: subjectBreakdown.length >= 3,
                  color: 'indigo'
                },
                {
                  title: 'Marathon',
                  desc: 'Study for 2+ hours in a day',
                  icon: <HiOutlineAcademicCap />,
                  earned: false,
                  color: 'red'
                },
                {
                  title: '30-Day Streak',
                  desc: 'Study 30 days in a row',
                  icon: <FiStar />,
                  earned: currentStreak >= 30,
                  color: 'orange'
                }
              ].map(({ title, desc, icon, earned, color }) => {
                const c = colorMap[color as keyof typeof colorMap]
                return (
                  <div
                    key={title}
                    className={`p-4 rounded-xl border-2 transition ${earned
                      ? `${c.bg} ${c.border}`
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 opacity-60'
                      }`}
                  >
                    <div className={`${earned ? c.icon : 'bg-gray-200 dark:bg-gray-600 text-gray-500'} w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3`}>
                      {icon}
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                    {earned && (
                      <div className="flex items-center gap-1 mt-2">
                        <FiCheckCircle className="text-green-500 text-xs" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Earned</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======== STUDY TIMER SECTION ======== */}
      {activeSection === 'study' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Sessions"
              value={totalSessions}
              subtitle="All time"
              icon={<FiClock />}
              color="blue"
            />
            <StatCard
              title={`Last ${dateRange}`}
              value={`${(recentMinutes / 60).toFixed(1)}h`}
              subtitle={`${recentSessions.length} sessions`}
              icon={<FiTrendingUp />}
              color="green"
            />
            <StatCard
              title="Current Streak"
              value={`${currentStreak}d`}
              subtitle="Consecutive days"
              icon={<FiZap />}
              color="orange"
            />
            <StatCard
              title="Avg Per Session"
              value={totalSessions > 0 ? `${Math.round(totalStudyMinutes / totalSessions)}m` : '0m'}
              subtitle="Average duration"
              icon={<BiTimer />}
              color="purple"
            />
          </div>

          {/* Subject breakdown */}
          {subjectBreakdown.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <FiBookOpen className="text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Study Time by Subject</h3>
              </div>
              <div className="space-y-4">
                {subjectBreakdown.map(({ subject, minutes }, index) => (
                  <div key={subject} className="flex items-center gap-4">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subjectColors[index % subjectColors.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{subject}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {minutes >= 60
                            ? `${(minutes / 60).toFixed(1)}h`
                            : `${Math.round(minutes)}m`
                          }
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${(minutes / subjectBreakdown[0].minutes) * 100}%`,
                            backgroundColor: subjectColors[index % subjectColors.length]
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent sessions list */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <FiCalendar className="text-blue-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">
                Recent Study Sessions
              </h3>
            </div>
            {localSessions.length === 0 ? (
              <div className="p-12 text-center">
                <BiTimer className="text-4xl text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No sessions recorded yet. Start the Study Timer!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {[...localSessions]
                  .reverse()
                  .slice(0, 15)
                  .map(session => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                          <FiBookOpen className="text-blue-500 text-sm" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {session.subject}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(session.completedAt).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {session.duration >= 60
                            ? `${(session.duration / 60).toFixed(1)}h`
                            : `${session.duration}m`
                          }
                        </p>
                        <div className="flex items-center gap-1 justify-end">
                          <FiCheckCircle className="text-green-500 text-xs" />
                          <span className="text-xs text-green-600 dark:text-green-400">Done</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======== FLASHCARDS SECTION ======== */}
      {activeSection === 'flashcards' && (
        <div className="space-y-6">
          {!flashCardStats ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <BiCard className="text-5xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No flashcard data yet. Start using the Flashcard Hub!
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Cards"
                  value={flashCardStats.totalCards}
                  subtitle="In your collection"
                  icon={<BiCard />}
                  color="blue"
                />
                <StatCard
                  title="Mastered"
                  value={flashCardStats.masteredCards}
                  subtitle="Level 5 cards"
                  icon={<FiAward />}
                  color="green"
                />
                <StatCard
                  title="Due for Review"
                  value={flashCardStats.dueCards}
                  subtitle="Needs attention"
                  icon={<FiCalendar />}
                  color="orange"
                />
                <StatCard
                  title="Accuracy"
                  value={`${flashCardStats.accuracy}%`}
                  subtitle={`${flashCardStats.totalReviews} reviews`}
                  icon={<FiTarget />}
                  color="purple"
                />
              </div>

              {/* Mastery Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <HiOutlineLightBulb className="text-yellow-500" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Mastery Progress</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'New', level: 0, color: '#9CA3AF' },
                    { label: 'Beginner', level: 1, color: '#EF4444' },
                    { label: 'Learning', level: 2, color: '#F97316' },
                    { label: 'Familiar', level: 3, color: '#EAB308' },
                    { label: 'Proficient', level: 4, color: '#3B82F6' },
                    { label: 'Mastered', level: 5, color: '#10B981' }
                  ].map(({ label, level, color }) => {
                    const count = level === 5
                      ? flashCardStats.masteredCards
                      : Math.max(0, Math.floor((flashCardStats.totalCards - flashCardStats.masteredCards) / 5)) // Simplified simulation
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">{label}</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div
                            className="h-3 rounded-full transition-all"
                            style={{
                              width: flashCardStats.totalCards > 0
                                ? `${(count / flashCardStats.totalCards) * 100}%`
                                : '0%',
                              backgroundColor: color
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Category Breakdown */}
              {flashCardStats.categoryBreakdown?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <FiLayers className="text-indigo-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Cards by Category</h3>
                  </div>
                  <div className="space-y-3">
                    {flashCardStats.categoryBreakdown.map((cat: any, index: number) => (
                      <div key={cat._id} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: subjectColors[index % subjectColors.length] }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{cat._id}</span>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(cat.count / flashCardStats.totalCards) * 100}%`,
                              backgroundColor: subjectColors[index % subjectColors.length]
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-8 text-right">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ======== QUIZ SECTION ======== */}
      {activeSection === 'quiz' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
            <MdOutlineQuiz className="text-5xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Quiz Analytics Coming Soon
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Quiz performance tracking will appear here once you start generating and taking quizzes from the Question Bank.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard/question-bank'} // Updated href
              className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition mx-auto"
            >
              <MdOutlineQuiz />
              Go to Question Bank
            </button>
          </div>
        </div>
      )}

      {/* Empty state when no data at all */}
      {!isLoading && totalSessions === 0 && !flashCardStats && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800 text-center">
          <HiOutlineAcademicCap className="text-5xl text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Start Your Learning Journey
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            Your analytics will populate as you use the Study Timer, Flashcard Hub, and Question Bank.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: 'Study Timer', href: '/dashboard/study-timer', icon: <BiTimer /> },
              { label: 'Flashcard Hub', href: '/dashboard/flip-cards', icon: <BiCard /> },
              { label: 'Question Bank', href: '/dashboard/question-bank', icon: <MdOutlineQuiz /> }
            ].map(({ label, href, icon }) => (
              <button
                key={label}
                onClick={() => window.location.href = href}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 transition text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
