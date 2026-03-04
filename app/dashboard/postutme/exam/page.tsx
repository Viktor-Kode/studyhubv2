'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { postutmeApi, type PostUTMEQuestion } from '@/lib/api/postutmeApi'
import StudyGuideLoader from '@/components/loading/StudyGuideLoader'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiClock, FiArrowLeft, FiArrowRight, FiCheck, FiHome } from 'react-icons/fi'

const LETTERS = ['A', 'B', 'C', 'D']

export default function PostUTMEExamPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const uni = searchParams.get('uni')
  const subject = searchParams.get('subject') || ''
  const year = searchParams.get('year') || ''
  const countParam = searchParams.get('count') || '40'

  const [questions, setQuestions] = useState<PostUTMEQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(60 * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [startTime] = useState(Date.now())
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uniName, setUniName] = useState('')

  const count = Math.min(100, Math.max(10, parseInt(countParam, 10) || 40))
  const duration = Math.ceil(count * 1.5)
  const totalSeconds = duration * 60

  const loadQuestions = useCallback(async () => {
    if (!uni) {
      setError('Missing university. Please select from the home page.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await postutmeApi.getQuestions({
        university: uni,
        subject: subject || undefined,
        year: year || undefined,
        count,
      })
      if (!res.questions || res.questions.length === 0) {
        setError('No questions available yet. We\'re generating more — try again in a few minutes.')
        return
      }
      setQuestions(res.questions)
      setTimeRemaining(totalSeconds)
      setIsTimerRunning(true)
      setUniName(res.university || uni)
    } catch (e) {
      setError('Failed to load questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [uni, subject, year, count, totalSeconds])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  const handleSubmitRef = useRef<() => void>(() => {})
  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  })
  useEffect(() => {
    if (!isTimerRunning || submitted || questions.length === 0) return
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false)
          handleSubmitRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isTimerRunning, submitted, questions.length])

  const handleAnswerSelect = (optionIndex: number) => {
    if (submitted) return
    const q = questions[currentIndex]
    if (!q) return
    const id = q.id || q._id || ''
    setSelectedAnswers((prev) => ({ ...prev, [id]: optionIndex }))
  }

  const handleSubmit = async () => {
    if (submitted) return
    setSubmitted(true)
    setIsTimerRunning(false)

    const correct = questions.filter(
      (q) => selectedAnswers[q.id || q._id || ''] === q.correctAnswer
    ).length
    const attempted = Object.keys(selectedAnswers).length
    const wrong = attempted - correct
    const skipped = questions.length - attempted
    const accuracy = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)

    const answers = questions.map((q) => {
      const id = q.id || q._id || ''
      const sel = selectedAnswers[id]
      const optArr = q.options || []
      const selectedStr = sel != null && optArr[sel] ? LETTERS[sel] : 'Skipped'
      const correctStr = optArr[q.correctAnswer] ? LETTERS[q.correctAnswer] : 'A'
      return {
        questionId: id,
        questionText: q.question || q.questionText || '',
        selectedAnswer: selectedStr,
        correctAnswer: correctStr,
        explanation: q.explanation,
        isCorrect: sel === q.correctAnswer,
      }
    })

    setSaving(true)
    try {
      await postutmeApi.saveResult({
        universitySlug: uni || undefined,
        universityName: uniName,
        subject: subject || undefined,
        year: year ? parseInt(year, 10) : undefined,
        totalQuestions: questions.length,
        correctAnswers: correct,
        wrongAnswers: wrong,
        skipped,
        accuracy,
        timeTaken,
        answers,
      })
    } catch {
      console.error('Failed to save result')
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const correct = questions.filter(
    (q) => selectedAnswers[q.id || q._id || ''] === q.correctAnswer
  ).length
  const attempted = Object.keys(selectedAnswers).length
  const percentage = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0

  if (loading) {
    return (
      <ProtectedRoute>
        <StudyGuideLoader
          duration={2}
          networkSpeed="medium"
          text="Loading Post-UTME questions..."
          tooltipText="Fetching questions for your selected university..."
        />
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="postutme-page">
          <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <Link
              href="/dashboard/postutme"
              className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:underline"
            >
              <FiArrowLeft /> Back to universities
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (questions.length === 0) {
    return null
  }

  if (submitted) {
    return (
      <ProtectedRoute>
        <div className="postutme-page">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🎓 Post-UTME Result
            </h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-lg">
                <span className="text-gray-600 dark:text-gray-400">Correct</span>
                <span className="font-bold text-green-600">{correct} / {questions.length}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-600 dark:text-gray-400">Accuracy</span>
                <span className="font-bold text-indigo-600">{percentage}%</span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-600 dark:text-gray-400">Attempted</span>
                <span className="font-bold">{attempted}</span>
              </div>
            </div>
            {saving && <p className="text-sm text-gray-500 mb-4">Saving result...</p>}
            <div className="flex gap-4">
              <Link
                href="/dashboard/postutme"
                className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold text-center hover:bg-indigo-700"
              >
                <FiHome className="inline-block mr-2" />
                Back to Post-UTME
              </Link>
              <Link
                href="/dashboard/postutme/results"
                className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold text-center hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                View All Results
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const current = questions[currentIndex]
  const qId = current?.id || current?._id || ''
  const selected = selectedAnswers[qId]

  return (
    <ProtectedRoute>
      <div className="cbt-wrapper">
        <div className="cbt-header">
          <div className="cbt-subject">
            {uniName.toUpperCase()} Post-UTME — {subject || 'Mixed'} {year || 'Mixed'}
          </div>
          <div className={`cbt-timer ${timeRemaining <= 60 ? 'warning' : ''}`}>
            <FiClock className="inline-block mr-1" />
            {formatTime(timeRemaining)}
          </div>
        </div>

        <div className="question-navigator">
          {questions.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`nav-btn ${selectedAnswers[questions[i]?.id || questions[i]?._id || ''] != null ? 'answered' : ''} ${i === currentIndex ? 'current' : ''}`}
              onClick={() => setCurrentIndex(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="question-card">
          <p className="question-number">Question {currentIndex + 1} of {questions.length}</p>
          <p className="question-text">{current?.question || current?.questionText}</p>
          <div className="options-list">
            {(current?.options || []).map((opt, i) => (
              <button
                key={i}
                type="button"
                className={`option-btn ${selected === i ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(i)}
              >
                <span className="option-letter">{LETTERS[i]}.</span>
                <span>{opt}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="cbt-nav-buttons">
          <button
            type="button"
            className="nav-prev"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            <FiArrowLeft className="inline mr-1" /> Previous
          </button>
          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              className="nav-next"
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              Next <FiArrowRight className="inline ml-1" />
            </button>
          ) : (
            <button type="button" className="nav-submit" onClick={handleSubmit}>
              <FiCheck className="inline mr-1" /> Submit
            </button>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
