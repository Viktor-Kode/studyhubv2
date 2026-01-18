'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/lib/store/authStore'
import { 
  FaChalkboardTeacher,
  FaFilePdf,
  FaUsers,
  FaChartLine,
  FaQuestionCircle,
  FaArrowRight,
  FaPlus,
  FaBrain
} from 'react-icons/fa'
import Link from 'next/link'

interface GeneratedQuestion {
  id: string
  question: string
  type: string
  difficulty: string
  subject: string
  createdAt: string
}

interface Class {
  id: string
  name: string
  subject: string
  studentCount: number
  questionsGenerated: number
}

export default function TeacherDashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalQuestions: 0,
    activeClasses: 0,
    studentsReached: 0,
    questionsGenerated: 0,
  })
  const [recentQuestions, setRecentQuestions] = useState<GeneratedQuestion[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = () => {
    // Load generated questions from localStorage
    const savedQuestions = localStorage.getItem('teacherGeneratedQuestions')
    let questions: GeneratedQuestion[] = []
    if (savedQuestions) {
      try {
        questions = JSON.parse(savedQuestions)
      } catch (e) {
        console.error('Error parsing questions:', e)
      }
    }

    // Load classes from localStorage
    const savedClasses = localStorage.getItem('teacherClasses')
    let teacherClasses: Class[] = []
    if (savedClasses) {
      try {
        teacherClasses = JSON.parse(savedClasses)
      } catch (e) {
        console.error('Error parsing classes:', e)
      }
    }

    // Calculate stats
    const totalStudents = teacherClasses.reduce((sum, cls) => sum + cls.studentCount, 0)
    const totalQuestionsGenerated = questions.length

    setStats({
      totalQuestions: totalQuestionsGenerated,
      activeClasses: teacherClasses.length,
      studentsReached: totalStudents,
      questionsGenerated: totalQuestionsGenerated,
    })
    setRecentQuestions(questions.slice(0, 5))
    setClasses(teacherClasses.slice(0, 3))
    setLoading(false)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const quickLinks = [
    { 
      href: '/dashboard/teacher/question-generator', 
      icon: FaBrain, 
      label: 'Question Generator', 
      color: 'blue',
      description: 'Generate AI questions from PDFs'
    },
    { 
      href: '/dashboard/teacher/classes', 
      icon: FaUsers, 
      label: 'Class Management', 
      color: 'purple',
      description: 'Manage your classes and students'
    },
    { 
      href: '/dashboard/teacher/analytics', 
      icon: FaChartLine, 
      label: 'Analytics', 
      color: 'emerald',
      description: 'View student performance data'
    },
    { 
      href: '/dashboard/teacher/questions', 
      icon: FaQuestionCircle, 
      label: 'Question Bank', 
      color: 'cyan',
      description: 'View all generated questions'
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      emerald: 'bg-emerald-500',
      cyan: 'bg-cyan-500',
    }
    return colors[color] || colors.blue
  }

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <FaChalkboardTeacher className="text-white text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {getGreeting()}, {user?.email?.split('@')[0] || 'Teacher'}!
                </h1>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                  TEACHER DASHBOARD
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your classes and generate AI-powered questions
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100 mb-1">Questions Generated</p>
                <p className="text-3xl font-bold">{stats.questionsGenerated}</p>
                <p className="text-xs text-blue-100 mt-1">Total questions</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <FaQuestionCircle className="text-3xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100 mb-1">Active Classes</p>
                <p className="text-3xl font-bold">{stats.activeClasses}</p>
                <p className="text-xs text-purple-100 mt-1">Classes managed</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <FaUsers className="text-3xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-100 mb-1">Students Reached</p>
                <p className="text-3xl font-bold">{stats.studentsReached}</p>
                <p className="text-xs text-emerald-100 mt-1">Total students</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <FaChalkboardTeacher className="text-3xl" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-100 mb-1">This Month</p>
                <p className="text-3xl font-bold">{stats.questionsGenerated}</p>
                <p className="text-xs text-cyan-100 mt-1">Questions created</p>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <FaChartLine className="text-3xl" />
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
                const bgColor = getColorClasses(link.color)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                        <Icon className="text-white text-xl" />
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
                  href="/dashboard/teacher/questions"
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
                >
                  View All <FaArrowRight className="text-xs" />
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : recentQuestions.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FaQuestionCircle className="mx-auto mb-2 text-3xl" />
                  <p>No questions generated yet.</p>
                  <Link
                    href="/dashboard/teacher/question-generator"
                    className="mt-4 inline-block text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium"
                  >
                    Generate Your First Question →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
                    >
                      <p className="text-gray-900 dark:text-white font-medium mb-2 line-clamp-2">
                        {question.question}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {question.subject}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            question.difficulty === 'easy' 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                              : question.difficulty === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                          }`}>
                            {question.difficulty}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(question.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Active Classes */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Classes</h2>
                <Link
                  href="/dashboard/teacher/classes"
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
                >
                  Manage <FaArrowRight className="text-xs" />
                </Link>
              </div>

              {classes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FaUsers className="mx-auto mb-2 text-3xl" />
                  <p className="text-sm mb-3">No classes yet</p>
                  <Link
                    href="/dashboard/teacher/classes"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    <FaPlus className="text-xs" />
                    Create Class
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {cls.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {cls.subject}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <FaUsers className="text-xs" />
                              {cls.studentCount} students
                            </span>
                            <span className="flex items-center gap-1">
                              <FaQuestionCircle className="text-xs" />
                              {cls.questionsGenerated} questions
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/dashboard/teacher/question-generator"
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <FaFilePdf className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Generate Questions</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Upload PDF and create questions</p>
                  </div>
                  <FaArrowRight className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                </Link>
                <Link
                  href="/dashboard/teacher/classes"
                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <FaUsers className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Manage Classes</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Add or edit classes</p>
                  </div>
                  <FaArrowRight className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
