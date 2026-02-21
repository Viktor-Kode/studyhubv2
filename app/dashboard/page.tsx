'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/lib/store/authStore'
import { apiClient } from '@/lib/api/client'
import { getAllQuizSessions } from '@/lib/api/quizApi'
import { getFlashCardStats } from '@/lib/api/flashcardApi'
import {
  FiBook, FiClock, FiCreditCard, FiBarChart2,
  FiCalendar, FiGrid, FiTrendingUp, FiAward,
  FiCheckCircle, FiArrowRight, FiZap, FiBell,
  FiTarget, FiLoader
} from 'react-icons/fi'
import { MdQuiz, MdSchool } from 'react-icons/md'
import { BiCard, BiTimer, BiBrain } from 'react-icons/bi'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalQuestions: 0,
    quizSessions: 0,
    studyHours: 0,
    studyStreak: 0,
    completedSessions: 0,
    totalFlashcards: 0,
    masteredCards: 0,
    upcomingReminders: 0,
  })
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get token from cookie
      const match = typeof document !== 'undefined'
        ? document.cookie.match(/(^| )auth-token=([^;]+)/)
        : null
      const token = match ? decodeURIComponent(match[2]) : ''
      const headers = { 'Authorization': `Bearer ${token}` }

      // Fetch all data from new Next.js APIs
      const [statsRes, historyRes] = await Promise.all([
        fetch('/api/stats', { headers }).then(r => r.json()),
        fetch('/api/study-sessions', { headers }).then(r => r.json())
      ])

      if (statsRes.stats) {
        const s = statsRes.stats
        setStats({
          totalQuestions: s.questionCount || 0,
          quizSessions: s.totalSessions || 0,
          studyHours: Math.round((s.totalDuration || 0) / 60),
          studyStreak: s.studyStreak || 0,
          completedSessions: s.totalSessions || 0,
          totalFlashcards: s.flashcardCount || 0,
          masteredCards: s.masteredCards || 0,
          upcomingReminders: 0
        })
      }

      // Process Activities from history
      if (historyRes.sessions) {
        const historyActivities = historyRes.sessions.map((s: any) => ({
          id: s._id,
          type: s.type || 'study',
          title: s.title || 'Focus Session',
          subtitle: `${s.duration} minutes of focus`,
          date: s.startTime || s.createdAt,
          icon: s.type === 'quiz' ? MdQuiz : FiClock,
          color: s.type === 'quiz' ? 'emerald' : 'blue'
        }))
        setActivities(historyActivities.slice(0, 5))
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const quickLinks = [
    {
      href: '/dashboard/question-bank',
      icon: FiBook,
      label: 'Question Bank',
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

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="space-y-8">

        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MdSchool className="text-3xl text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, {user?.name || 'Student'}!
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Here's your learning overview and progress
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="animate-spin text-3xl text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100 mb-1">Study Streak</p>
                  <p className="text-3xl font-bold">{stats.studyStreak}</p>
                  <p className="text-xs text-blue-100 mt-1">days in a row</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <FiZap className="text-3xl" />
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
                  <p className="text-sm text-emerald-100 mb-1">Quiz Questions</p>
                  <p className="text-3xl font-bold">{stats.totalQuestions}</p>
                  <p className="text-xs text-emerald-100 mt-1">{stats.quizSessions} quiz sessions</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <FiBook className="text-3xl" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100 mb-1">Flashcards</p>
                  <p className="text-3xl font-bold">{stats.totalFlashcards}</p>
                  <p className="text-xs text-purple-100 mt-1">{stats.masteredCards} mastered</p>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <BiCard className="text-3xl" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiGrid className="text-blue-500" />
            Quick Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link) => {
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {link.description}
                      </p>
                    </div>
                    <FiArrowRight className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              )
            })}
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.subtitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-tighter text-gray-400">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
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
                <p className="text-sm text-gray-500 font-medium">No recent activity. Start studying to see your progress!</p>
              </div>
            )}
          </div>

          {/* Achievement Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiAward className="text-orange-500" />
              Achievements
            </h2>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800 space-y-4">
              {stats.studyStreak > 0 ? (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600">
                    <FiZap className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-orange-600">Streak</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.studyStreak} Days Active!</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-orange-800 dark:text-orange-300 font-medium italic opacity-70 italic">Start a daily streak to earn your first badge!</p>
              )}

              {stats.totalQuestions > 50 && (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600">
                    <BiBrain className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-blue-600">Scholar</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">50+ Questions Solved</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Link href="/dashboard/analytics" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group">
                  View full progress <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
