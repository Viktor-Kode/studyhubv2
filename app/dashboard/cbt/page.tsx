'use client'

import { useState, useEffect, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { cbtApi, ExamType, CBTQuestion } from '@/lib/api/cbt'
import StudyGuideLoader from '@/components/loading/StudyGuideLoader'
import {
  FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft,
  FiClock, FiAward, FiLoader, FiAlertTriangle,
  FiRefreshCw, FiHome, FiTarget, FiBookOpen,
  FiChevronRight, FiList, FiGrid, FiInfo,
  FiTrendingUp, FiCheck, FiX, FiFilter
} from 'react-icons/fi'
import {
  HiOutlineAcademicCap, HiOutlineLightBulb
} from 'react-icons/hi'
import { MdOutlineQuiz, MdCalculate } from 'react-icons/md'
import { BiTimer, BiStats, BiUserCircle } from 'react-icons/bi'
import CBTCalculator from '@/components/dashboard/CBTCalculator'
import { useAuthStore } from '@/lib/store/authStore'

interface Question extends CBTQuestion { }

const examTypes = [
  {
    value: 'JAMB',
    label: 'JAMB / UTME',
    description: 'Joint Admissions and Matriculation Board',
    duration: 120,
    color: 'from-blue-500 to-blue-700',
    lightColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-600 dark:text-blue-400',
    icon: '🎓'
  },
  {
    value: 'WAEC',
    label: 'WAEC / WASSCE',
    description: 'West African Examinations Council',
    duration: 120,
    color: 'from-green-500 to-green-700',
    lightColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    textColor: 'text-green-600 dark:text-green-400',
    icon: '📚'
  },
  {
    value: 'NECO',
    label: 'NECO',
    description: 'National Examinations Council',
    duration: 120,
    color: 'from-purple-500 to-purple-700',
    lightColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-600 dark:text-purple-400',
    icon: '📝'
  },
  {
    value: 'POST_UTME',
    label: 'POST UTME',
    description: 'Post Unified Tertiary Matriculation Exam',
    duration: 60,
    color: 'from-orange-500 to-orange-700',
    lightColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-600 dark:text-orange-400',
    icon: '🏫'
  },
  {
    value: 'BECE',
    label: 'BECE',
    description: 'Basic Education Certificate Examination',
    duration: 90,
    color: 'from-pink-500 to-pink-700',
    lightColor: 'bg-pink-50 dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-800',
    textColor: 'text-pink-600 dark:text-pink-400',
    icon: '🎒'
  }
]

type ViewMode = 'exam-select' | 'configure' | 'test' | 'results'

export default function CBTPage() {
  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('exam-select')

  // Selection state
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [questionCount, setQuestionCount] = useState<number>(40)

  // Data state
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [questions, setQuestions] = useState<Question[]>([])

  // Test state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [showCalculator, setShowCalculator] = useState(false)
  const { user } = useAuthStore()
  const [showResults, setShowResults] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showQuestionPanel, setShowQuestionPanel] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const currentExamConfig = examTypes.find(e => e.value === selectedExam)

  // Load years when exam selected
  useEffect(() => {
    if (selectedExam) {
      loadYears()
    }
  }, [selectedExam])

  // Load subjects when year selected
  useEffect(() => {
    if (selectedExam && selectedYear) {
      loadSubjects()
    }
  }, [selectedExam, selectedYear])

  // Timer
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0 && !showResults) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            setShowResults(true)
            setViewMode('results')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isTimerRunning, timeRemaining, showResults])

  const loadYears = async () => {
    if (!selectedExam) return
    try {
      setLoading(true)
      const res = await cbtApi.getAvailableYears(selectedExam)
      setAvailableYears(res.years)
      setSelectedYear(res.years[0] || '')
    } catch (err) {
      console.error('Error loading years:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSubjects = async () => {
    if (!selectedExam || !selectedYear) return
    try {
      setLoading(true)
      const res = await cbtApi.getAvailableSubjects(selectedExam, selectedYear)
      setAvailableSubjects(res.subjects)
      setSelectedSubject(res.subjects[0] || '')
    } catch (err) {
      console.error('Error loading subjects:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = async () => {
    if (!selectedExam || !selectedYear || !selectedSubject) {
      setError('Please select all required fields')
      return
    }

    setLoading(true)
    setError(null)
    setLoadingStage('Connecting to question database...')

    try {
      await new Promise(r => setTimeout(r, 500))
      setLoadingStage(`Loading ${selectedSubject} ${selectedYear} questions...`)

      const response = await cbtApi.getQuestions(
        selectedExam,
        selectedYear,
        selectedSubject,
        questionCount
      )

      setLoadingStage('Preparing your test...')
      await new Promise(r => setTimeout(r, 500))

      if (!response.questions || response.questions.length === 0) {
        throw new Error('No questions found. Try a different year or subject.')
      }

      // Shuffle questions for fairness
      const shuffled = [...response.questions]
        .sort(() => Math.random() - 0.5)
        .slice(0, questionCount)

      setQuestions(shuffled)
      setCurrentIndex(0)
      setSelectedAnswers({})
      setFlaggedQuestions(new Set())
      setShowResults(false)

      // Start timer
      const duration = (currentExamConfig?.duration || 120) * 60
      setTimeRemaining(duration)
      setIsTimerRunning(true)
      setViewMode('test')

    } catch (err: any) {
      setError(err.message || 'Failed to load questions. Please check your ALOC API token.')
    } finally {
      setLoading(false)
      setLoadingStage('')
    }
  }

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResults) return
    const questionId = questions[currentIndex]?.id
    if (!questionId) return
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleJumpToQuestion = (index: number) => {
    setCurrentIndex(index)
    setShowQuestionPanel(false)
  }

  const handleFlagQuestion = () => {
    const newFlagged = new Set(flaggedQuestions)
    if (newFlagged.has(currentIndex)) {
      newFlagged.delete(currentIndex)
    } else {
      newFlagged.add(currentIndex)
    }
    setFlaggedQuestions(newFlagged)
  }

  const handleSubmitTest = () => {
    setIsTimerRunning(false)
    setShowResults(true)
    setViewMode('results')
  }

  const getScore = () => {
    let correct = 0
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++
      }
    })
    const total = questions.length
    const attempted = Object.keys(selectedAnswers).length
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0
    return { correct, total, attempted, percentage }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    if (timeRemaining > 300) return 'text-green-600 dark:text-green-400'
    if (timeRemaining > 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400 animate-pulse'
  }

  const resetAll = () => {
    setSelectedExam(null)
    setSelectedYear('')
    setSelectedSubject('')
    setQuestions([])
    setShowResults(false)
    setCurrentIndex(0)
    setSelectedAnswers({})
    setFlaggedQuestions(new Set())
    setTimeRemaining(0)
    setIsTimerRunning(false)
    setError(null)
    setViewMode('exam-select')
  }

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(selectedAnswers).length
  const score = showResults ? getScore() : null

  // Loading state
  if (loading && loadingStage) {
    return (
      <ProtectedRoute>
        <StudyGuideLoader
          duration={3}
          networkSpeed="medium"
          text={loadingStage}
          tooltipText="Fetching real past questions..."
        />
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <MdOutlineQuiz className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              CBT Practice
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Real past questions from WAEC, JAMB, NECO, POST UTME and BECE
          </p>
        </div>

        {/* ====== EXAM SELECTION ====== */}
        {viewMode === 'exam-select' && (
          <div className="space-y-6">

            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <FiInfo className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Real Past Questions
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
                  Questions are sourced from ALOC Questions API with real WAEC, JAMB, NECO past questions.
                  Make sure your ALOC_ACCESS_TOKEN is set in .env.local
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <HiOutlineAcademicCap className="text-blue-500 text-2xl" />
                Select Exam Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {examTypes.map(exam => (
                  <button
                    key={exam.value}
                    onClick={() => {
                      setSelectedExam(exam.value as ExamType)
                      setViewMode('configure')
                    }}
                    className={`p-6 ${exam.lightColor} border-2 ${exam.borderColor} rounded-xl 
                               hover:shadow-lg transition-all text-left group relative overflow-hidden`}
                  >
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
                          <HiOutlineAcademicCap className={`text-xl ${exam.textColor}`} />
                        </div>
                        <FiChevronRight className={`${exam.textColor} opacity-0 group-hover:opacity-100 transition`} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {exam.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {exam.description}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <FiClock className={`text-xs ${exam.textColor}`} />
                        <span className={`text-sm font-medium ${exam.textColor}`}>
                          {exam.duration} minutes
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ====== CONFIGURE TEST ====== */}
        {viewMode === 'configure' && selectedExam && (
          <div className="max-w-2xl mx-auto space-y-4">

            {/* Back button */}
            <button
              onClick={() => setViewMode('exam-select')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition text-sm"
            >
              <FiArrowLeft /> Back to exam selection
            </button>

            <div className={`p-4 ${currentExamConfig?.lightColor} border ${currentExamConfig?.borderColor} rounded-xl`}>
              <div className="flex items-center gap-3">
                <HiOutlineAcademicCap className={`text-2xl ${currentExamConfig?.textColor}`} />
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">{currentExamConfig?.label}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{currentExamConfig?.description}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 space-y-5">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiFilter className="text-blue-500" />
                Configure Your Test
              </h3>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl space-y-2">
                  <div className="flex items-start gap-2">
                    <FiAlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
                  </div>
                  <div className="ml-6 p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Troubleshooting:
                    </p>
                    <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal ml-4">
                      <li>
                        Register FREE at{' '}
                        <a
                          href="https://questions.aloc.com.ng/secure/signup"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline"
                        >
                          questions.aloc.com.ng
                        </a>
                      </li>
                      <li>Copy your AccessToken from the dashboard</li>
                      <li>Add to <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">.env.local</code>:
                        <br />
                        <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-green-600 dark:text-green-400">
                          ALOC_ACCESS_TOKEN=ALOC-yourtoken
                        </code>
                      </li>
                      <li>Restart the dev server</li>
                      <li>
                        Test connection:{' '}
                        <a
                          href="/api/cbt/test"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline"
                        >
                          /api/cbt/test
                        </a>
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Year Select */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Exam Year
                </label>
                {loading && availableYears.length === 0 ? (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-2">
                    <FiLoader className="animate-spin text-sm" />
                    <span className="text-sm">Loading years...</span>
                  </div>
                ) : (
                  <select
                    value={selectedYear}
                    onChange={e => {
                      setSelectedYear(e.target.value)
                      setSelectedSubject('')
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                               text-gray-900 dark:text-white bg-white dark:bg-gray-700 
                               focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Select year</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Subject Select */}
              {selectedYear && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject
                  </label>
                  {loading && availableSubjects.length === 0 ? (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-2">
                      <FiLoader className="animate-spin text-sm" />
                      <span className="text-sm">Loading subjects...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedSubject}
                      onChange={e => setSelectedSubject(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                               text-gray-900 dark:text-white bg-white dark:bg-gray-700
                               focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select subject</option>
                      {availableSubjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  )}
                  {selectedSubject && selectedSubject.toLowerCase().includes('english') && (
                    <div className="flex items-start gap-2 p-3 
                                  bg-blue-50 dark:bg-blue-900/20 
                                  border border-blue-200 dark:border-blue-800 
                                  rounded-lg text-sm mt-2">
                      <FiInfo className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-blue-800 dark:text-blue-200">
                        <strong>English Language note:</strong> Comprehension passage questions
                        are automatically filtered out since the API does not include the
                        reading passages. You'll get vocabulary, grammar, oral English,
                        idioms and sentence completion questions — all fully self-contained.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Number of questions */}
              {selectedSubject && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={60}
                    value={questionCount}
                    onChange={e => setQuestionCount(Math.min(60, Math.max(10, Number(e.target.value))))}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                               text-gray-900 dark:text-white bg-white dark:bg-gray-700
                               focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Between 10 and 60 questions
                  </p>
                </div>
              )}

              {/* Exam summary */}
              {selectedYear && selectedSubject && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Exam</span>
                    <span className="font-medium text-gray-900 dark:text-white">{currentExamConfig?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Year</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subject</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedSubject}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Questions</span>
                    <span className="font-medium text-gray-900 dark:text-white">{questionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time Allowed</span>
                    <span className="font-medium text-gray-900 dark:text-white">{currentExamConfig?.duration} minutes</span>
                  </div>
                </div>
              )}

              {/* Start button */}
              {selectedYear && selectedSubject && (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                      <FiInfo /> Candidate Instructions
                    </h4>
                    <ul className="text-sm space-y-2 text-blue-800 dark:text-blue-200 list-disc pl-5 opacity-90">
                      <li>Total Questions: <strong>{questionCount}</strong></li>
                      <li>Duration: <strong>{currentExamConfig?.duration} Minutes</strong></li>
                      <li>Each correct answer carries equal marks.</li>
                      <li>Ensure you have a stable internet connection.</li>
                      <li>Calculators are permitted for this section.</li>
                      <li>Use the question navigator to move between questions.</li>
                    </ul>
                  </div>

                  <button
                    onClick={handleStartTest}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 
                             bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                             text-white font-black uppercase tracking-widest rounded-xl transition shadow-lg shadow-blue-500/20 
                             disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><FiLoader className="animate-spin" /> Preparing Exam...</>
                    ) : (
                      <><HiOutlineAcademicCap className="text-xl" /> I am ready, Start Exam</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== TEST VIEW ====== */}
        {viewMode === 'test' && currentQuestion && (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Candidate Profile Sidebar (Simulated) */}
            <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-b border-gray-100 dark:border-gray-700">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <BiUserCircle className="text-6xl text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Candidate Name</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || 'GUEST CANDIDATE'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Registration ID</p>
                    <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 tracking-tighter">
                      STH/{new Date().getFullYear()}/{Math.floor(100000 + Math.random() * 900000)}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Active Exam</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{currentExamConfig?.label}</p>
                    <p className="text-xs text-gray-500">{selectedSubject}</p>
                  </div>
                </div>
              </div>

              {/* Status Mini Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                  <p className="text-xl font-bold text-blue-600">{answeredCount}</p>
                  <p className="text-[9px] font-black uppercase text-gray-400">Answered</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center">
                  <p className="text-xl font-bold text-gray-400">{questions.length - answeredCount}</p>
                  <p className="text-[9px] font-black uppercase text-gray-400">Left</p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">

              {/* Top Bar */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {currentExamConfig?.label} — {selectedSubject} {selectedYear}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {answeredCount} of {questions.length} answered
                      {flaggedQuestions.size > 0 && ` • ${flaggedQuestions.size} flagged`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${getTimerColor()}`}>
                      <FiClock className="text-base" />
                      {formatTime(timeRemaining)}
                    </div>
                    <button
                      onClick={() => setShowCalculator(true)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                      title="Open Calculator"
                    >
                      <MdCalculate className="text-lg" />
                    </button>
                    <button
                      onClick={() => setShowQuestionPanel(!showQuestionPanel)}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      <FiGrid className="text-sm" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Exit test? Your progress will be lost.')) resetAll()
                      }}
                      className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition font-bold"
                    >
                      End Exam
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Q{currentIndex + 1}/{questions.length}</span>
                  <span>{Math.round((answeredCount / questions.length) * 100)}% answered</span>
                </div>
              </div>

              {/* Question Grid Panel */}
              {showQuestionPanel && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                      Question Navigator
                    </h3>
                    <button
                      onClick={() => setShowQuestionPanel(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <FiX />
                    </button>
                  </div>
                  <div className="grid grid-cols-8 gap-1.5">
                    {questions.map((_, idx) => {
                      const isAnswered = selectedAnswers[questions[idx].id] !== undefined
                      const isFlagged = flaggedQuestions.has(idx)
                      const isCurrent = idx === currentIndex

                      return (
                        <button
                          key={idx}
                          onClick={() => handleJumpToQuestion(idx)}
                          className={`w-full aspect-square rounded-lg text-xs font-bold transition flex items-center justify-center ${isCurrent
                            ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                            : isFlagged
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-400'
                              : isAnswered
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                          {idx + 1}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded" />
                      Answered
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-200 dark:bg-yellow-900 rounded" />
                      Flagged
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                      Unanswered
                    </span>
                  </div>
                </div>
              )}

              {/* Question Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Question {currentIndex + 1}
                  </span>
                  <button
                    onClick={handleFlagQuestion}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg transition ${flaggedQuestions.has(currentIndex)
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                      }`}
                  >
                    <FiTarget className="text-xs" />
                    {flaggedQuestions.has(currentIndex) ? 'Flagged' : 'Flag'}
                  </button>
                </div>

                {/* ── INSTRUCTION BANNER ─────────────────────────── */}
                {currentQuestion.instruction && (
                  <div className="flex items-start gap-2 mb-4 p-3 
                              bg-amber-50 dark:bg-amber-900/20 
                              border border-amber-200 dark:border-amber-700 
                              rounded-lg">
                    <FiInfo className="text-amber-500 flex-shrink-0 mt-0.5 text-sm" />
                    <p className="text-sm text-amber-800 dark:text-amber-200 leading-snug">
                      {currentQuestion.instruction}
                    </p>
                  </div>
                )}

                {/* ── QUESTION CATEGORY BADGE ─────────────────────── */}
                {currentQuestion.category && currentQuestion.category !== 'general' && (
                  <div className="mb-3">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${currentQuestion.category === 'vocabulary'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : currentQuestion.category === 'grammar'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : currentQuestion.category === 'oral_english'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : currentQuestion.category === 'idiom_proverb'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            : currentQuestion.category === 'sentence_completion'
                              ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                      {currentQuestion.category === 'vocabulary' ? 'Vocabulary & Lexis'
                        : currentQuestion.category === 'grammar' ? 'Grammar & Usage'
                          : currentQuestion.category === 'oral_english' ? 'Oral English'
                            : currentQuestion.category === 'idiom_proverb' ? 'Idioms & Proverbs'
                              : currentQuestion.category === 'sentence_completion' ? 'Sentence Completion'
                                : currentQuestion.category}
                    </span>
                  </div>
                )}

                {/* ── QUESTION TEXT ───────────────────────────────── */}
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed">
                  {currentQuestion.question}
                </h2>

                {/* ── OPTIONS ─────────────────────────────────────── */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === index
                    const optionLetters = ['A', 'B', 'C', 'D', 'E']

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition ${isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                            {optionLetters[index]}
                          </div>
                          <span className={`${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-800 dark:text-gray-200'}`}>
                            {option}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-200 dark:bg-gray-700 
                           text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 
                           dark:hover:bg-gray-600 transition disabled:opacity-40 
                           disabled:cursor-not-allowed font-medium"
                >
                  <FiArrowLeft /> Previous
                </button>

                <div className="flex items-center gap-2">
                  {currentIndex === questions.length - 1 ? (
                    <button
                      onClick={() => {
                        const unanswered = questions.length - answeredCount
                        if (unanswered > 0) {
                          if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return
                        }
                        handleSubmitTest()
                      }}
                      className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 
                               text-white rounded-xl transition font-bold shadow-md"
                    >
                      <FiCheckCircle /> Submit Test
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 
                               text-white rounded-xl transition font-medium shadow-md"
                    >
                      Next <FiArrowRight />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* Calculator Component */}
            {showCalculator && <CBTCalculator onClose={() => setShowCalculator(false)} />}
          </div>
        )}

        {/* ====== RESULTS VIEW ====== */}
        {viewMode === 'results' && score && (
          <div className="space-y-6 max-w-3xl mx-auto">

            {/* Score Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center shadow-lg">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${score.percentage >= 70
                ? 'bg-green-100 dark:bg-green-900/30'
                : score.percentage >= 50
                  ? 'bg-yellow-100 dark:bg-yellow-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                <span className={`text-3xl font-black ${score.percentage >= 70
                  ? 'text-green-600 dark:text-green-400'
                  : score.percentage >= 50
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                  }`}>
                  {score.percentage}%
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {score.percentage >= 70
                  ? 'Excellent Performance!'
                  : score.percentage >= 50
                    ? 'Good Attempt!'
                    : 'Keep Practicing!'}
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {currentExamConfig?.label} — {selectedSubject} {selectedYear}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{score.correct}</p>
                  <p className="text-xs text-green-700 dark:text-green-300">Correct</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {score.attempted - score.correct}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">Wrong</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {score.total - score.attempted}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Skipped</p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleStartTest}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 
                             text-white rounded-xl transition font-bold"
                >
                  <FiRefreshCw /> Retake Test
                </button>
                <button
                  onClick={resetAll}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 
                             hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 
                             rounded-xl transition font-medium"
                >
                  <FiHome /> New Exam
                </button>
              </div>
            </div>

            {/* Review Questions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <FiList className="text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Review All Questions</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {questions.map((q, idx) => {
                  const userAnswer = selectedAnswers[q.id]
                  const isCorrect = userAnswer === q.correctAnswer
                  const isAttempted = userAnswer !== undefined
                  const optionLetters = ['A', 'B', 'C', 'D', 'E']

                  return (
                    <div key={q.id} className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm ${!isAttempted
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                          : isCorrect
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600'
                          }`}>
                          {!isAttempted
                            ? idx + 1
                            : isCorrect
                              ? <FiCheck className="text-xs" />
                              : <FiX className="text-xs" />
                          }
                        </div>

                        <div className="flex-1">
                          {q.instruction && (
                            <p className="text-xs text-amber-700 dark:text-amber-300 
                                        bg-amber-50 dark:bg-amber-900/20 
                                        border border-amber-200 dark:border-amber-800 
                                        rounded-lg px-2 py-1 mb-2 inline-block">
                              {q.instruction}
                            </p>
                          )}
                          <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                            {q.question}
                          </p>
                        </div>
                      </div>

                      <div className="ml-10 space-y-1.5">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`flex items-center gap-2 p-2 rounded-lg text-sm ${optIdx === q.correctAnswer
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                              : optIdx === userAnswer && !isCorrect
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                                : 'text-gray-600 dark:text-gray-400'
                              }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${optIdx === q.correctAnswer
                              ? 'bg-green-500 text-white'
                              : optIdx === userAnswer && !isCorrect
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                              }`}>
                              {optionLetters[optIdx]}
                            </span>
                            {opt}
                            {optIdx === q.correctAnswer && (
                              <FiCheckCircle className="text-green-500 ml-auto flex-shrink-0 text-xs" />
                            )}
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <div className="ml-10 mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <HiOutlineLightBulb className="text-blue-500 flex-shrink-0 mt-0.5 text-sm" />
                            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
