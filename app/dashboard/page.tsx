'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { questionsApi, Question } from '@/lib/api/questions'
import { useAuthStore } from '@/lib/store/authStore'
import { 
  FaQuestionCircle, 
  FaClock, 
  FaCalculator, 
  FaChartBar, 
  FaBrain, 
  FaCalendar, 
  FaLaptop, 
  FaBook,
  FaFire,
  FaBell,
  FaCheckCircle,
  FaArrowRight,
  FaTrophy
} from 'react-icons/fa'
import Link from 'next/link'

interface Reminder {
  id: string
  title: string
  date: string
  time: string
  type: 'deadline' | 'study' | 'exam'
  timetableId?: string
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalQuestions: 0,
    answeredQuestions: 0,
    studyHours: 0,
    studyStreak: 0,
    completedSessions: 0,
    upcomingReminders: 0,
  })
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    fetchQuestions()
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [questions])

  const loadDashboardData = () => {
    // Load study streak
    const savedStreak = localStorage.getItem('studyStreak')
    const lastStudyDate = localStorage.getItem('lastStudyDate')
    const today = new Date().toDateString()
    
    let streak = 0
    if (savedStreak && lastStudyDate) {
      const lastDate = new Date(lastStudyDate).toDateString()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toDateString()

      if (lastDate === today || lastDate === yesterdayStr) {
        streak = parseInt(savedStreak) || 0
      }
    }

    // Load completed sessions
    const completedSessions = parseInt(localStorage.getItem('completedSessions') || '0')

    // Load reminders
    const savedReminders = localStorage.getItem('studyReminders')
    let reminders: Reminder[] = []
    if (savedReminders) {
      try {
        reminders = JSON.parse(savedReminders)
      } catch (e) {
        console.error('Error parsing reminders:', e)
      }
    }

    // Get upcoming reminders (next 7 days)
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcoming = reminders.filter((r) => {
      const reminderDate = new Date(r.date)
      return reminderDate >= now && reminderDate <= nextWeek
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateA.getTime() - dateB.getTime()
    }).slice(0, 5)

    // Calculate study hours (estimate: 25 min sessions)
    const studyHours = Math.round((completedSessions * 25) / 60)

    setStats({
      totalQuestions: questions.length,
      answeredQuestions: questions.filter((q) => q.status === 'answered').length,
      studyHours,
      studyStreak: streak,
      completedSessions,
      upcomingReminders: upcoming.length,
    })
    setUpcomingReminders(upcoming)

    // Recent activity
    const activity: any[] = []
    if (streak > 0) {
      activity.push({
        type: 'streak',
        message: `${streak} day study streak! Keep it up!`,
        icon: FaFire,
        color: 'text-orange-500',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      })
    }
    if (completedSessions > 0) {
      activity.push({
        type: 'session',
        message: `Completed ${completedSessions} study session${completedSessions > 1 ? 's' : ''}`,
        icon: FaCheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
      })
    }
    setRecentActivity(activity)
  }

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const data = await questionsApi.getAll()
      setQuestions(data)
    } catch (err: any) {
      console.error('Failed to load questions:', err)
    } finally {
      setLoading(false)
    }
  }

  const quickLinks = [
    { href: '/dashboard/question-bank', icon: FaBrain, label: 'Question Bank', color: 'emerald', description: 'Practice with AI-generated questions' },
    { href: '/dashboard/study-timer', icon: FaClock, label: 'Study Timer', color: 'cyan', description: 'Pomodoro technique timer' },
    { href: '/dashboard/cgpa', icon: FaCalculator, label: 'CGPA Calculator', color: 'blue', description: 'Track your academic performance' },
    { href: '/dashboard/timetable?tab=reminders', icon: FaCalendar, label: 'Timetable & Reminders', color: 'purple', description: 'Schedule and reminders' },
    { href: '/dashboard/cbt', icon: FaLaptop, label: 'CBT Practice', color: 'orange', description: 'WAEC, JAMB, NECO past questions' },
    { href: '/dashboard/flip-cards', icon: FaBook, label: 'Flip Cards', color: 'pink', description: 'Interactive flashcards' },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      emerald: 'bg-emerald-500 text-emerald-500',
      cyan: 'bg-cyan-500 text-cyan-500',
      blue: 'bg-blue-500 text-blue-500',
      purple: 'bg-purple-500 text-purple-500',
      orange: 'bg-orange-500 text-orange-500',
      pink: 'bg-pink-500 text-pink-500',
    }
    return colors[color] || colors.blue
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {getGreeting()}, {user?.email?.split('@')[0] || 'Student'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's your learning overview and progress
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100 mb-1">Study Streak</p>
                <p className="text-3xl font-bold">{stats.studyStreak}</p>
                <p className="text-xs text-blue-100 mt-1">days in a row</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <FaFire className="text-3xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-100 mb-1">Study Hours</p>
                <p className="text-3xl font-bold">{stats.studyHours}</p>
                <p className="text-xs text-cyan-100 mt-1">{stats.completedSessions} sessions</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <FaClock className="text-3xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-100 mb-1">Questions</p>
                <p className="text-3xl font-bold">{stats.totalQuestions}</p>
                <p className="text-xs text-emerald-100 mt-1">{stats.answeredQuestions} answered</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <FaQuestionCircle className="text-3xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100 mb-1">Upcoming</p>
                <p className="text-3xl font-bold">{stats.upcomingReminders}</p>
                <p className="text-xs text-purple-100 mt-1">reminders</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <FaBell className="text-3xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Links */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {quickLinks.map((link) => {
                const Icon = link.icon
                const colorClasses = getColorClasses(link.color).split(' ')
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${colorClasses[0]} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                        <Icon className={`${colorClasses[1]} text-xl`} />
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 dark:text-white block mb-1">{link.label}</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{link.description}</p>
                      </div>
                      <FaArrowRight className="text-gray-400 group-hover:text-blue-500 transition-colors mt-1" />
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Recent Questions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Questions</h2>
                <Link
                  href="/dashboard/question-bank"
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
                >
                  View All <FaArrowRight className="text-xs" />
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FaQuestionCircle className="mx-auto mb-2 text-3xl" />
                  <p>No questions yet. Start practicing to see your progress!</p>
                  <Link
                    href="/dashboard/question-bank"
                    className="mt-4 inline-block text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium"
                  >
                    Go to Question Bank →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.slice(0, 5).map((question) => (
                    <Link
                      key={question.id}
                      href={`/questions/${question.id}`}
                      className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
                    >
                      <p className="text-gray-900 dark:text-white font-medium mb-1 line-clamp-2">
                        {question.content}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(question.createdAt).toLocaleDateString()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            question.status === 'answered'
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                          }`}
                        >
                          {question.status === 'answered' ? 'Answered' : 'Pending'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Upcoming Reminders & Activity */}
          <div className="space-y-6">
            {/* Upcoming Reminders */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming</h2>
                <Link
                  href="/dashboard/timetable?tab=reminders"
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
                >
                  View All <FaArrowRight className="text-xs" />
                </Link>
              </div>

              {upcomingReminders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FaCalendar className="mx-auto mb-2 text-3xl" />
                  <p className="text-sm">No upcoming reminders</p>
                  <Link
                    href="/dashboard/timetable?tab=reminders"
                    className="mt-2 inline-block text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400"
                  >
                    Add Reminder →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingReminders.slice(0, 5).map((reminder) => {
                    const reminderDate = new Date(`${reminder.date}T${reminder.time}`)
                    const isToday = reminderDate.toDateString() === new Date().toDateString()
                    const typeColors = {
                      deadline: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400',
                      exam: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400',
                      study: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
                    }
                    return (
                      <div
                        key={reminder.id}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              {reminder.title}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {isToday ? 'Today' : reminderDate.toLocaleDateString()} at {reminder.time}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[reminder.type]}`}>
                                {reminder.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaTrophy className="text-yellow-500" />
                  Achievements
                </h2>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg ${activity.bgColor}`}
                      >
                        <Icon className={`${activity.color} text-xl`} />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.message}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Questions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Questions</h2>
            <Link
              href="/dashboard/question-bank"
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaQuestionCircle className="mx-auto mb-2 text-3xl" />
              <p>No questions yet. Start asking questions to get help!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.slice(0, 5).map((question) => (
                <Link
                  key={question.id}
                  href={`/questions/${question.id}`}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
                >
                  <p className="text-gray-900 dark:text-white font-medium mb-1 line-clamp-2">
                    {question.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(question.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        question.status === 'answered'
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                      }`}
                    >
                      {question.status === 'answered' ? 'Answered' : 'Pending'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
