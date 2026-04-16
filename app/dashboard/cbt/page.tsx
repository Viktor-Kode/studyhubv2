'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { usePersistedState } from '@/hooks/usePersistedState'
import { cbtApi, ExamType, CBTQuestion, renderQuestion } from '@/lib/api/cbt'
import StudyGuideLoader from '@/components/loading/StudyGuideLoader'
import {
  FiCheckCircle, FiXCircle, FiArrowRight, FiArrowLeft,
  FiClock, FiAward, FiLoader, FiAlertTriangle,
  FiRefreshCw, FiHome, FiTarget, FiBookOpen,
  FiChevronRight, FiGrid, FiInfo,
  FiTrendingUp, FiCheck, FiX, FiFilter
} from 'react-icons/fi'
import Link from 'next/link'
import {
  HiOutlineAcademicCap, HiOutlineLightBulb
} from 'react-icons/hi'
import { MdOutlineQuiz, MdCalculate } from 'react-icons/md'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { findDiagram } from '@/lib/data/visualLabDiagrams'
import { BiTimer, BiStats, BiUserCircle } from 'react-icons/bi'
import CBTCalculator from '@/components/dashboard/CBTCalculator'
import { useAuthStore } from '@/lib/store/authStore'
import { useUpgrade } from '@/context/UpgradeContext'
import { toast } from 'react-hot-toast'
import AdBanner from '@/components/AdBanner'

interface Question extends CBTQuestion { }

function QuestionImage({ question }: { question: CBTQuestion }) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const imageUrl =
    question?.image ||
    (question as any)?.diagram ||
    (question as any)?.img ||
    (question as any)?.image_url ||
    (question as any)?.imageUrl ||
    (question as any)?.picture ||
    (question as any)?.figure ||
    (question as any)?.image_link ||
    null

  if (!imageUrl || imgError) return null

  return (
    <div className="question-diagram">
      {!imgLoaded && <div className="diagram-skeleton" />}
      <img
        src={imageUrl}
        alt="Question diagram"
        className="diagram-img"
        style={{ display: imgLoaded ? 'block' : 'none' }}
        onLoad={() => setImgLoaded(true)}
        onError={() => {
          console.warn('[CBT] Image failed to load:', imageUrl)
          setImgError(true)
        }}
      />
    </div>
  )
}

const POST_UTME_SCHOOLS = [
  { name: 'University of Lagos', short: 'UNILAG' },
  { name: 'Obafemi Awolowo University', short: 'OAU' },
  { name: 'University of Ibadan', short: 'UI' },
  { name: 'University of Nigeria Nsukka', short: 'UNN' },
  { name: 'Ahmadu Bello University', short: 'ABU' },
  { name: 'University of Benin', short: 'UNIBEN' },
  { name: 'University of Ilorin', short: 'UNILORIN' },
  { name: 'University of Port Harcourt', short: 'UNIPORT' },
  { name: 'Federal University of Technology Akure', short: 'FUTA' },
  { name: 'Nnamdi Azikiwe University', short: 'UNIZIK' },
  { name: 'Lagos State University', short: 'LASU' },
  { name: 'Olabisi Onabanjo University', short: 'OOU' },
  { name: 'Ambrose Alli University', short: 'AAU' },
  { name: 'Covenant University', short: 'CU' },
  { name: 'Babcock University', short: 'BABCOCK' },
  { name: 'Redeemers University', short: 'RUN' },
  { name: 'Benue State University', short: 'BSU' },
  { name: 'Delta State University', short: 'DELSU' },
  { name: 'Ekiti State University', short: 'EKSU' },
  { name: 'Enugu State University', short: 'ESUT' },
  { name: 'Imo State University', short: 'IMSU' },
  { name: 'Kogi State University', short: 'KSU' },
  { name: 'Niger Delta University', short: 'NDU' },
  { name: 'Rivers State University', short: 'RSU' },
  { name: 'Tai Solarin University of Education', short: 'TASUED' },
  { name: 'Federal University of Technology Owerri', short: 'FUTO' },
  { name: 'Federal University Oye-Ekiti', short: 'FUOYE' },
  { name: 'Federal University Lokoja', short: 'FULOKOJA' },
  { name: 'Michael Okpara University', short: 'MOUAU' },
  { name: 'Ladoke Akintola University of Technology', short: 'LAUTECH' },
]

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

const subjectInstructions: Record<string, string> = {
  'english': `
    📘 English Language Instructions
    • Read each passage carefully before answering (Note: some passages are omitted).
    • Questions may be based on comprehension, grammar, or vocabulary.
    • Choose the option that best answers each question.
    • Each question carries 1 mark. No negative marking.
    • Time allowed: 45 minutes for 60 questions.
  `,
  'mathematics': `
    📐 Mathematics Instructions
    • All working must be done mentally or on rough paper.
    • Use of calculator is allowed for this practice.
    • Each question carries 1 mark.
    • Carefully check all calculations before selecting your answer.
    • Time allowed: 1 hour 30 minutes for 60 questions.
  `,
  'physics': `
    ⚡ Physics Instructions
    • Read each question carefully.
    • Pay attention to units and significant figures.
    • Use the provided calculator for complex calculations.
    • Constants (g, c, etc.) should be used as specified in the questions.
    • Time allowed: 1 hour for 40 questions.
  `,
  'chemistry': `
    🧪 Chemistry Instructions
    • Periodic table references may be required for some questions.
    • Balancing equations and stoichiometry are common topics.
    • Each question carries 1 mark.
    • Time allowed: 1 hour for 40 questions.
  `,
  'biology': `
    🧬 Biology Instructions
    • Questions cover various biological concepts from cells to ecosystems.
    • Carefully read each option before selecting.
    • Diagrams may be referenced in some questions.
    • Time allowed: 1 hour for 40 questions.
  `,
  'government': `
    🏛️ Government Instructions
    • Questions cover constitution, arms of government, and politics.
    • Choose the most appropriate answer based on political science principles.
    • Time allowed: 1 hour for 50 questions.
  `,
  'economics': `
    📈 Economics Instructions
    • Questions include both theoretical concepts and basic calculations.
    • Graphs and tables may be present in some questions.
    • Time allowed: 1 hour for 50 questions.
  `
}

type ViewMode = 'exam-select' | 'configure' | 'instructions' | 'test' | 'results'

const CBT_STORAGE_KEYS = ['cbt_exam', 'cbt_year', 'cbt_subject', 'cbt_school', 'cbt_count', 'cbt_viewMode', 'cbt_questions', 'cbt_currentIndex', 'cbt_answers', 'cbt_timeRemaining', 'cbt_isPaused']

function clearCbtPersistedState() {
  CBT_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k))
  localStorage.removeItem('examEndTime')
  localStorage.removeItem('examActive')
  localStorage.removeItem('examId')
}

export default function CBTPage() {
  const router = useRouter()
  // Persisted selection state
  const [selectedExam, setSelectedExam] = usePersistedState<ExamType | null>('cbt_exam', null)
  const [selectedYear, setSelectedYear] = usePersistedState<string>('cbt_year', '')
  const [selectedSubject, setSelectedSubject] = usePersistedState<string>('cbt_subject', '')
  const [selectedSchool, setSelectedSchool] = usePersistedState<string>('cbt_school', '')
  const [questionCount, setQuestionCount] = usePersistedState<number>('cbt_count', 40)
  const [viewMode, setViewMode] = usePersistedState<ViewMode>('cbt_viewMode', 'exam-select')

  // Persisted test state (survives refresh)
  const [questions, setQuestions] = usePersistedState<Question[]>('cbt_questions', [])
  const [currentIndex, setCurrentIndex] = usePersistedState<number>('cbt_currentIndex', 0)
  const [selectedAnswers, setSelectedAnswers] = usePersistedState<Record<string, number>>('cbt_answers', {})
  const [timeRemaining, setTimeRemaining] = usePersistedState<number>('cbt_timeRemaining', 0)
  const [isPaused, setIsPaused] = usePersistedState<boolean>('cbt_isPaused', false)

  // Data state (not persisted)
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [showCalculator, setShowCalculator] = useState(false)
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  const [isExplaining, setIsExplaining] = useState<string | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const { user } = useAuthStore()
  const [showResults, setShowResults] = useState(false)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showQuestionPanel, setShowQuestionPanel] = useState(false)
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number>(120)
  const [examDurationAtStartSeconds, setExamDurationAtStartSeconds] = useState<number>(0)
  const [showDiagram, setShowDiagram] = useState(true)
  const [diagramExpanded, setDiagramExpanded] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { showUpgrade } = useUpgrade()

  const currentExamConfig = examTypes.find(e => e.value === selectedExam)

  useEffect(() => {
    if (viewMode !== 'instructions') return
    setCustomDurationMinutes(currentExamConfig?.duration || 120)
  }, [viewMode, currentExamConfig?.duration])

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

  // Timer — resume test if we have persisted questions and valid time
  useEffect(() => {
    const endTimeStr = localStorage.getItem('examEndTime')
    const examActive = localStorage.getItem('examActive')
    if (examActive && endTimeStr && questions.length > 0) {
      const endTime = parseInt(endTimeStr, 10)
      const remaining = Math.floor((endTime - Date.now()) / 1000)
      if (remaining > 0 && !isTimerRunning && !showResults) {
        setTimeRemaining(remaining)
        setIsTimerRunning(true)
        setIsPaused(false)
        setViewMode('test')
      } else if (remaining <= 0) {
        clearCbtPersistedState()
        setViewMode('exam-select')
      }
    } else if (examActive && (!endTimeStr || questions.length === 0)) {
      localStorage.removeItem('examEndTime')
      localStorage.removeItem('examActive')
      localStorage.removeItem('examId')
    }

    if (isPaused && questions.length > 0 && !showResults) {
      setViewMode('test')
    }

    if (isTimerRunning && !isPaused && timeRemaining > 0 && !showResults) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            setIsPaused(false)
            setShowResults(true)
            setViewMode('results')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isTimerRunning, isPaused, timeRemaining, showResults, questions.length, setIsPaused, setTimeRemaining, setViewMode])

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
    if (selectedExam === 'POST_UTME' && !selectedSchool) {
      setError('Please select a school for Post-UTME')
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
        questionCount,
        selectedExam === 'POST_UTME' ? selectedSchool : undefined
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
      setViewMode('instructions')

    } catch (err: any) {
      if (err.response?.data?.upgradeRequired || err.message?.includes('Upgrade to access') || err.response?.data?.code === 'CBT_LIMIT_REACHED') {
        showUpgrade('cbt')
      } else {
        setError(err.message || 'Failed to load questions. Please check your internet connection.')
        toast.error(err.message || 'Failed to load questions')
      }
    } finally {
      setLoading(false)
      setLoadingStage('')
    }
  }

  const startActualTest = () => {
    const minutes = Math.max(5, Math.min(240, Number(customDurationMinutes) || (currentExamConfig?.duration || 120)))
    const duration = minutes * 60
    setExamDurationAtStartSeconds(duration)
    setTimeRemaining(duration)
    setIsTimerRunning(true)
    setIsPaused(false)
    setViewMode('test')

    // Save timer state to localStorage every second (start time)
    const endTime = Date.now() + duration * 1000;
    localStorage.setItem('examEndTime', endTime.toString());
    localStorage.setItem('examActive', 'true');
    localStorage.setItem('examId', currentExamConfig?.value || 'exam');
  }

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false)
      setIsTimerRunning(true)
      const endTime = Date.now() + timeRemaining * 1000
      localStorage.setItem('examEndTime', endTime.toString())
      localStorage.setItem('examActive', 'true')
      localStorage.setItem('examId', currentExamConfig?.value || 'exam')
      return
    }

    setIsPaused(true)
    setIsTimerRunning(false)
    localStorage.removeItem('examEndTime')
    localStorage.removeItem('examActive')
    localStorage.removeItem('examId')
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

  const handleSubmitTest = async () => {
    setIsTimerRunning(false)
    setIsPaused(false)
    setShowResults(true)
    clearCbtPersistedState()

    // Calculate final score
    const finalScore = getScore()

    // Save to DB
    try {
      const results = questions.map(q => ({
        questionId: q.id,
        question: q.question,
        selectedAnswer: q.options[selectedAnswers[q.id]] || 'Skipped',
        correctAnswer: q.options[q.correctAnswer],
        explanation: q.explanation || '',
        isCorrect: selectedAnswers[q.id] === q.correctAnswer
      }))

      const resultData = {
        subject: selectedSubject,
        examType: selectedExam,
        year: selectedYear,
        totalQuestions: questions.length,
        correctAnswers: finalScore.correct,
        wrongAnswers: finalScore.attempted - finalScore.correct,
        skipped: finalScore.total - finalScore.attempted,
        accuracy: finalScore.percentage,
        timeTaken: Math.max(0, (examDurationAtStartSeconds || (currentExamConfig?.duration || 120) * 60) - timeRemaining),
        answers: results
      }

      await cbtApi.saveResult(resultData)
    } catch (err) {
      console.error('Failed to save CBT result:', err)
    }

    setViewMode('results')
  }

  const handleGetAiExplanation = async (q: Question) => {
    if (aiExplanations[q.id] || isExplaining === q.id) return

    setIsExplaining(q.id)
    try {
      const explanation = await cbtApi.getExplanation(q.question, q.options[q.correctAnswer], q.options)
      setAiExplanations(prev => ({ ...prev, [q.id]: explanation }))
    } catch (err) {
      console.error('Failed to get AI explanation:', err)
    } finally {
      setIsExplaining(null)
    }
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

  const resetAll = () => {
    clearCbtPersistedState()
    setSelectedExam(null)
    setSelectedYear('')
    setSelectedSubject('')
    setSelectedSchool('')
    setQuestions([])
    setShowResults(false)
    setCurrentIndex(0)
    setSelectedAnswers({})
    setFlaggedQuestions(new Set())
    setTimeRemaining(0)
    setIsTimerRunning(false)
    setIsPaused(false)
    setError(null)
    setViewMode('exam-select')
  }

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(selectedAnswers).length
  const score = showResults ? getScore() : null

  // Warn before leaving active exam — must be before any early return to satisfy Rules of Hooks
  useEffect(() => {
    if (viewMode !== 'test' || questions.length === 0) return
    const handlePopState = () => {
      const confirmed = window.confirm('You have an active exam. Leaving will lose your progress. Are you sure?')
      if (!confirmed) window.history.pushState(null, '', window.location.href)
    }
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      ;(e as any).returnValue = ''
    }
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [viewMode, questions.length])

  useEffect(() => {
    if (viewMode !== 'test' || questions.length === 0) return

    const handleVisibilityChange = () => {
      if (document.hidden && isTimerRunning && !isPaused && !showResults) {
        setIsPaused(true)
        setIsTimerRunning(false)
        localStorage.removeItem('examEndTime')
        localStorage.removeItem('examActive')
        localStorage.removeItem('examId')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [viewMode, questions.length, isTimerRunning, isPaused, showResults, setIsPaused])

  // Loading state — early return must come after all hooks
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
        <BackButton label="Dashboard" href="/dashboard" />
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

        <AdBanner className="mb-8" />

        {/* ====== EXAM SELECTION ====== */}
        {viewMode === 'exam-select' && (
          <div className="space-y-6">



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

              {/* School Select - only for Post-UTME */}
              {selectedExam === 'POST_UTME' && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select School
                  </label>
                  <select
                    value={selectedSchool}
                    onChange={e => setSelectedSchool(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
                               text-gray-900 dark:text-white bg-white dark:bg-gray-700 
                               focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Select University --</option>
                    {POST_UTME_SCHOOLS.map(s => (
                      <option key={s.short} value={s.short}>
                        {s.short} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
              {selectedYear && selectedSubject && (!(selectedExam === 'POST_UTME') || selectedSchool) && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Exam</span>
                    <span className="font-medium text-gray-900 dark:text-white">{currentExamConfig?.label}</span>
                  </div>
                  {selectedExam === 'POST_UTME' && selectedSchool && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">School</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {POST_UTME_SCHOOLS.find(s => s.short === selectedSchool)?.name || selectedSchool}
                      </span>
                    </div>
                  )}
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

              {/* Start / Study Mode buttons */}
              {selectedYear && selectedSubject && (!(selectedExam === 'POST_UTME') || selectedSchool) && (
                <div className="space-y-4">
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
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row gap-3">
                      <button
                        onClick={handleStartTest}
                        disabled={loading}
                        data-tour="cbt-start"
                        className="w-full md:flex-1 flex items-center justify-center gap-2 py-4 px-6 
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

                      <button
                        onClick={() => {
                          if (!selectedExam || !selectedYear || !selectedSubject || (selectedExam === 'POST_UTME' && !selectedSchool)) {
                            setError('Please complete the exam setup before starting Study Mode.')
                            return
                          }
                          router.push('/dashboard/cbt/study')
                        }}
                        className="w-full md:flex-1 flex items-center justify-center gap-2 py-4 px-6 
                               bg-white dark:bg-gray-900 border-2 border-blue-600/80 
                               text-blue-700 dark:text-blue-300 font-black uppercase tracking-widest rounded-xl 
                               transition hover:bg-blue-50 dark:hover:bg-blue-950/40"
                      >
                        <FiBookOpen className="text-xl" />
                        Study Mode
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/student/cbt/syllabus')}
                      className="cbt-topic-btn w-full flex flex-col sm:flex-row items-center justify-center gap-2 py-4 px-6 
                        bg-white dark:bg-gray-900 border-2 border-[#10B981] text-[#10B981] font-bold rounded-[14px] 
                        transition hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      style={{ borderWidth: '1.5px' }}
                    >
                      <span className="flex items-center gap-2">
                        <GraduationCap size={18} strokeWidth={2} />
                        <span>Study by Topic</span>
                      </span>
                      <span className="cbt-topic-badge text-[10px] uppercase tracking-wide px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 font-semibold">
                        JAMB • WAEC • NECO • Post-UTME
                      </span>
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Study Mode shows one question at a time with instant feedback and AI-powered explanations. No timer, just learning.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== INSTRUCTIONS VIEW ====== */}
        {viewMode === 'instructions' && selectedSubject && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                  <FiInfo className="text-2xl text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Exam Instructions</h2>
                  <p className="text-gray-500 dark:text-gray-400">{selectedSubject} — {selectedYear}</p>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none mb-8">
                <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {subjectInstructions[selectedSubject.toLowerCase()] || `
                      📘 General Instructions
                      • This is a practice exam for ${selectedSubject}.
                      • Total number of questions: ${questionCount}.
                      • Duration: ${currentExamConfig?.duration} minutes.
                      • Read each question carefully before choosing an option.
                      • You can navigate between questions using the numbers at the top.
                    `}
                  </pre>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 text-center">
                    <p className="text-xs font-black uppercase text-blue-400 tracking-widest mb-1">Time</p>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min={5}
                        max={240}
                        value={customDurationMinutes}
                        onChange={(e) => setCustomDurationMinutes(Math.max(5, Math.min(240, Number(e.target.value) || 5)))}
                        className="w-20 rounded-md border border-blue-200 dark:border-blue-800 bg-white dark:bg-blue-950/30 px-2 py-1 text-center font-bold text-blue-900 dark:text-blue-100"
                      />
                      <span className="font-bold text-blue-900 dark:text-blue-100">min</span>
                    </div>
                    <p className="mt-1 text-[11px] text-blue-700 dark:text-blue-300">Set your preferred exam time</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/50 text-center">
                    <p className="text-xs font-black uppercase text-purple-400 tracking-widest mb-1">Items</p>
                    <p className="font-bold text-purple-900 dark:text-purple-100">{questions.length} Questions</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewMode('configure')}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-blue-600/60 text-blue-700 dark:text-blue-300 font-bold rounded-xl transition hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                  <FiArrowLeft />
                  Go Back
                </button>

                <button
                  onClick={startActualTest}
                  data-tour="cbt-start"
                  className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl transition shadow-xl shadow-blue-500/20"
                >
                  Confirm & Start Exam
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ====== TEST VIEW (fallback if no questions e.g. after refresh) ====== */}
        {viewMode === 'test' && !currentQuestion && questions.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center max-w-md mx-auto">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your exam session was lost (e.g. after a page refresh). Please start a new exam.
            </p>
            <button
              onClick={resetAll}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
            >
              Start New Exam
            </button>
          </div>
        )}
        {viewMode === 'test' && currentQuestion && (
          <div className="cbt-wrapper">
            {/* Header */}
            <div className="cbt-header">
              <div className="cbt-subject">
                {currentExamConfig?.label} — {selectedSubject} {selectedYear}
              </div>
              <div className="flex items-center gap-3">
                {findDiagram(currentQuestion.question) && (
                  <button
                    type="button"
                    className="cbt-diagram-toggle"
                    onClick={() => setShowDiagram((s) => !s)}
                  >
                    {showDiagram ? <EyeOff size={15} /> : <Eye size={15} />}
                    {showDiagram ? 'Hide Diagram' : 'Show Diagram'}
                  </button>
                )}
                <div className={`cbt-timer ${timeRemaining <= 60 ? 'warning' : ''}`}>
                  <FiClock className="inline-block mr-1" />
                  {formatTime(timeRemaining)}
                </div>
                <button
                  onClick={handlePauseResume}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    isPaused
                      ? 'bg-green-500/20 text-green-200 hover:bg-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-200 hover:bg-yellow-500/30'
                  }`}
                  title={isPaused ? 'Resume timer' : 'Pause timer'}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={() => setShowCalculator(true)}
                  className="px-3 py-1 rounded-lg bg-white/10 text-xs font-medium hover:bg-white/20 transition"
                  title="Open Calculator"
                >
                  <MdCalculate className="inline-block mr-1" /> Calc
                </button>
                <button
                  onClick={() => setShowQuestionPanel(!showQuestionPanel)}
                  className="px-3 py-1 rounded-lg bg-white/10 text-xs font-medium hover:bg-white/20 transition"
                >
                  <FiGrid className="inline-block mr-1" /> Questions
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Exit test? Your progress will be lost.')) resetAll()
                  }}
                  className="px-3 py-1 rounded-lg bg-red-500/20 text-xs font-semibold text-red-200 hover:bg-red-500/30 transition"
                >
                  End
                </button>
              </div>
            </div>

            {/* Progress summary */}
            <div className="mt-2 mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span>
                Answered {answeredCount}/{questions.length}
                {flaggedQuestions.size > 0 && ` • ${flaggedQuestions.size} flagged`}
              </span>
            </div>

                {/* Question Grid Panel */}
                {showQuestionPanel && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-3">
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
                <div className="question-navigator">
                  {questions.map((_, idx) => {
                    const isAnswered = selectedAnswers[questions[idx].id] !== undefined
                    const isFlagged = flaggedQuestions.has(idx)
                    const isCurrent = idx === currentIndex

                    let stateClass = ''
                    if (isCurrent) stateClass = 'current'
                    else if (isFlagged) stateClass = 'skipped'
                    else if (isAnswered) stateClass = 'answered'

                    return (
                      <button
                        key={idx}
                        onClick={() => handleJumpToQuestion(idx)}
                        className={`nav-btn ${stateClass}`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    Current
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-400 rounded" />
                    Answered
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-300 rounded" />
                    Flagged
                  </span>
                </div>
              </div>
            )}

            {/* Question Card */}
            <div className="question-card">
              <div className="flex items-start justify-between mb-2">
                <p className="question-number">Question {currentIndex + 1}</p>
                <button
                  onClick={handleFlagQuestion}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg transition ${flaggedQuestions.has(currentIndex)
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
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

              {/* ── VISUAL LAB DIAGRAM (if available) ───────────── */}
              {(() => {
                const diagram = findDiagram(currentQuestion.question)
                if (!diagram || !showDiagram) return null
                return (
                  <div className="cbt-diagram-wrap">
                    <div className="cbt-diagram-header">
                      <span className="cbt-diagram-badge">
                        🔬 Visual Aid — {diagram.title}
                      </span>
                      <button
                        type="button"
                        className="cbt-diagram-expand"
                        onClick={() => setDiagramExpanded(true)}
                      >
                        ⤢ Expand
                      </button>
                    </div>
                    <div
                      className="cbt-diagram-svg"
                      dangerouslySetInnerHTML={{ __html: diagram.svg }}
                    />
                  </div>
                )
              })()}

              {/* ── QUESTION TEXT ───────────────────────────────── */}
              <div
                className="question-text"
                dangerouslySetInnerHTML={{ __html: renderQuestion(currentQuestion.question) }}
              />

              {/* Diagram / image */}
              <QuestionImage question={currentQuestion} />

              {/* ── OPTIONS ─────────────────────────────────────── */}
              <div className="options-list">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === index
                  const optionLetters = ['A', 'B', 'C', 'D', 'E']

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`option-btn ${isSelected ? 'selected' : ''}`}
                    >
                      <span className="option-letter">{optionLetters[index]}.</span>
                      <span
                        dangerouslySetInnerHTML={{ __html: renderQuestion(option) }}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="cbt-nav-buttons">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="nav-prev disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiArrowLeft className="inline-block mr-1" />
                Previous
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={() => {
                    const unanswered = questions.length - answeredCount
                    if (unanswered > 0) {
                      if (!window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return
                    }
                    handleSubmitTest()
                  }}
                  className="nav-submit"
                >
                  <FiCheckCircle className="inline-block mr-1" />
                  Submit Test
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="nav-next"
                >
                  Next
                  <FiArrowRight className="inline-block ml-1" />
                </button>
              )}
            </div>

            {/* Calculator Component */}
            {showCalculator && <CBTCalculator onClose={() => setShowCalculator(false)} />}

            {/* Expanded fullscreen diagram modal */}
            {diagramExpanded && (() => {
              const diagram = currentQuestion ? findDiagram(currentQuestion.question) : null
              if (!diagram) return null
              return (
                <div
                  className="cbt-diagram-modal-overlay"
                  onClick={() => setDiagramExpanded(false)}
                >
                  <div
                    className="cbt-diagram-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="cbt-diagram-modal-header">
                      <h3>{diagram.title}</h3>
                      <button type="button" onClick={() => setDiagramExpanded(false)}>
                        ✕ Close
                      </button>
                    </div>
                    <div
                      className="cbt-diagram-modal-svg"
                      dangerouslySetInnerHTML={{ __html: diagram.svg }}
                    />
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ====== RESULTS VIEW ====== */}
        {viewMode === 'results' && score && (
          <div className="result-page space-y-6">

            {/* Score Card */}
            <div className="result-summary">
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
              <div className="result-stats">
                <div className="result-stat">
                  <span className="num">{score.correct}</span>
                  <span className="label">Correct</span>
                </div>
                <div className="result-stat">
                  <span className="num">{score.attempted - score.correct}</span>
                  <span className="label">Wrong</span>
                </div>
                <div className="result-stat">
                  <span className="num">{score.total - score.attempted}</span>
                  <span className="label">Skipped</span>
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
            <div>
              <h3 className="mb-3 font-bold text-gray-900 dark:text-white" style={{ fontSize: 16 }}>Review All Questions</h3>
              <div className="answer-review-list">
                {questions.map((q, idx) => {
                  const userAnswer = selectedAnswers[q.id]
                  const isCorrect = userAnswer === q.correctAnswer
                  const isAttempted = userAnswer !== undefined
                  const optionLetters = ['A', 'B', 'C', 'D', 'E']
                  const cardClass = isCorrect ? 'correct' : isAttempted ? 'wrong' : 'skipped'
                  const badgeClass = isCorrect ? 'badge-correct' : isAttempted ? 'badge-wrong' : 'badge-skipped'
                  const badgeText = isCorrect ? 'Correct' : isAttempted ? 'Wrong' : 'Skipped'

                  return (
                    <div
                      key={q.id}
                      className={`answer-card ${cardClass}`}
                    >
                      <div className="answer-card-header">
                        <span className="answer-q-num">Q{idx + 1}</span>
                        <span className={`answer-status-badge ${badgeClass}`}>{badgeText}</span>
                      </div>

                      {q.instruction && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 
                                    bg-amber-50 dark:bg-amber-900/20 
                                    border border-amber-200 dark:border-amber-800 
                                    rounded-lg px-2 py-1 mb-2 inline-block">
                          {q.instruction}
                        </p>
                      )}
                      <p
                        className="answer-question-text"
                        dangerouslySetInnerHTML={{ __html: renderQuestion(q.question) }}
                      />
                      <QuestionImage question={q} />

                      <div className="answer-options">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`answer-option ${optIdx === q.correctAnswer ? 'correct-opt' : optIdx === userAnswer && !isCorrect ? 'user-wrong' : ''}`}
                          >
                            <span className="answer-opt-key">{optionLetters[optIdx]}.</span>
                            <span dangerouslySetInnerHTML={{ __html: renderQuestion(opt) }} />
                          </div>
                        ))}
                      </div>

                      {(q.explanation || aiExplanations[q.id]) ? (
                        <div className="answer-explanation">
                          <span dangerouslySetInnerHTML={{ __html: renderQuestion(q.explanation || aiExplanations[q.id] || '') }} />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGetAiExplanation(q)}
                          disabled={isExplaining === q.id}
                          className="mt-3 flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                        >
                          {isExplaining === q.id ? (
                            <><FiLoader className="animate-spin" /> Generating Explanation...</>
                          ) : (
                            <><HiOutlineLightBulb /> Get AI Explanation</>
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute >
  )
}
