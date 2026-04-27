'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/lib/store/authStore'
import { useUpgrade } from '@/context/UpgradeContext'
import BackButton from '@/components/BackButton'
import { usePersistedState } from '@/hooks/usePersistedState'
import { CBTQuestion, ExamType, cbtApi, renderQuestion } from '@/lib/api/cbt'
import { progressApi } from '@/lib/api/progressApi'
import {
  FiCheckCircle,
  FiXCircle,
  FiChevronRight,
  FiBookOpen,
  FiLoader,
  FiHome,
  FiStar,
  FiTarget
} from 'react-icons/fi'
import Link from 'next/link'

interface StudyAnswer {
  isCorrect: boolean
  correctIndex: number
  selectedIndex: number | null
  explanation?: string
}

export default function StudyModePage() {
  const [selectedExam] = usePersistedState<ExamType | null>('cbt_exam', null)
  const [selectedYear] = usePersistedState<string>('cbt_year', '')
  const [selectedSubject] = usePersistedState<string>('cbt_subject', '')
  const [questionCount] = usePersistedState<number>('cbt_count', 20)

  const { user } = useAuthStore()
  const { showUpgrade } = useUpgrade()
  const router = useRouter()

  useEffect(() => {
    if (user && user.plan?.type === 'free') {
      router.replace('/dashboard/cbt')
      showUpgrade('cbt')
    }
  }, [user, router, showUpgrade])

  const [questions, setQuestions] = useState<CBTQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [loadingExp, setLoadingExp] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const [answers, setAnswers] = useState<StudyAnswer[]>([])

  useEffect(() => {
    const loadQuestions = async () => {
      if (!selectedExam || !selectedYear || !selectedSubject) {
        setError('No CBT configuration found. Go back and set up your exam first.')
        setLoading(false)
        return
      }

      try {
        const res = await cbtApi.getQuestions(selectedExam, selectedYear, selectedSubject, questionCount || 20)
        if (!res.questions || res.questions.length === 0) {
          setError('No questions found for this configuration. Try a different year or subject.')
          return
        }
        setQuestions(res.questions)
      } catch (err: any) {
        console.error('[Study Mode] Failed to load questions:', err)
        setError(err.message || 'Failed to load questions. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadQuestions()
  }, [selectedExam, selectedYear, selectedSubject, questionCount])

  const handleSelect = async (optionIndex: number) => {
    try {
      const currentQuestion = questions[current]
      if (!currentQuestion || revealed) return

      const options = Array.isArray(currentQuestion.options) ? currentQuestion.options : []
      const correctIndex =
        typeof currentQuestion.correctAnswer === 'number'
          ? currentQuestion.correctAnswer
          : 0

      if (!options.length) {
        console.error('[Study Mode] Question has no options', currentQuestion)
        return
      }

      setSelected(optionIndex)
      setRevealed(true)

      const isCorrect = optionIndex === correctIndex
      if (isCorrect) setScore((s) => s + 1)

      setAnswers((prev) => {
        const next = [...prev]
        next[current] = {
          isCorrect,
          correctIndex,
          selectedIndex: optionIndex
        }
        return next
      })

      void progressApi.award('study_question').catch(() => {})

      setLoadingExp(true)
      let expText = ''
      try {
        const correctText = options[correctIndex] ?? ''
        expText = await cbtApi.getExplanation(currentQuestion.question, correctText, options)
        setExplanation(expText)
      } catch (err) {
        console.error('[Study Mode] Failed to get explanation:', err)
        expText = 'The correct answer is highlighted above.'
        setExplanation(expText)
      } finally {
        setLoadingExp(false)
        setAnswers((prev) => {
          const next = [...prev]
          if (next[current]) {
            next[current].explanation = expText
          }
          return next
        })
      }
    } catch (err) {
      console.error('[Study Mode] Error while selecting option:', err)
      setExplanation('Something went wrong while handling your answer. Please try the next question.')
      setRevealed(true)
      setLoadingExp(false)
    } finally {
      // no-op; loadingExp handled in inner try/finally
    }
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true)
      return
    }
    const nextIdx = current + 1
    setCurrent(nextIdx)
    restoreQuestionState(nextIdx)
  }

  const handlePrevious = () => {
    if (current <= 0) return
    const prevIdx = current - 1
    setCurrent(prevIdx)
    restoreQuestionState(prevIdx)
  }

  const restoreQuestionState = (idx: number) => {
    const answer = answers[idx]
    if (answer) {
      setSelected(answer.selectedIndex)
      setRevealed(true)
      setExplanation(answer.explanation || '')
    } else {
      setSelected(null)
      setRevealed(false)
      setExplanation('')
    }
  }

  const handleRetry = () => {
    setCurrent(0)
    setSelected(null)
    setRevealed(false)
    setExplanation('')
    setAnswers([])
    setFinished(false)
    setScore(0)
  }

  const optionLetters = ['A', 'B', 'C', 'D', 'E']

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950/95 py-6 px-4 flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-6">
          <BackButton label="Back to CBT" href="/dashboard/cbt" />

          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200">
                <FiBookOpen className="text-xl" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-500">
                  Study Mode
                </p>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  One question at a time
                </h1>
                {selectedSubject && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedSubject} • {selectedExam} • {selectedYear}
                  </p>
                )}
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
              ✅ {score} correct
            </div>
          </div>

          {/* Loading / error states */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 dark:text-slate-300">
              <FiLoader className="animate-spin text-2xl text-indigo-500" />
              <p className="text-sm font-medium">Loading study session...</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center space-y-3">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
              <Link
                href="/dashboard/cbt"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
              >
                <FiHome className="text-sm" />
                Go back to CBT setup
              </Link>
            </div>
          )}

          {!loading && !error && finished && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <FiTarget className="text-2xl text-amber-500 dark:text-amber-300" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  Study session complete
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You answered {score} out of {questions.length} questions correctly.
                </p>
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="text-5xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                  {pct}%
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  Accuracy
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.25em]">
                  Question breakdown
                </p>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {questions.map((question, index) => {
                    const record = answers[index]
                    const isCorrect = record?.isCorrect
                    const correctLetter = optionLetters[question.correctAnswer] || ''

                    return (
                      <div
                        key={question.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs ${
                          isCorrect
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                            : 'bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/80 dark:bg-slate-900/70 text-[10px] font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold mr-1">
                            {isCorrect ? 'Correct' : 'Wrong'}
                          </span>
                          {!isCorrect && (
                            <span className="opacity-80">
                              — Answer was {correctLetter}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleRetry}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  <FiChevronRight className="text-sm" />
                  Retry session
                </button>
                <Link
                  href="/dashboard/cbt"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <FiHome className="text-sm" />
                  Back to CBT
                </Link>
              </div>
            </div>
          )}

          {!loading && !error && !finished && questions[current] && (
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {current + 1} / {questions.length}
                </span>
              </div>

              {/* Question card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-7 shadow-sm space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                      Question {current + 1}
                    </p>
                    <div
                      className="mt-2 text-sm md:text-[15px] leading-relaxed text-slate-900 dark:text-slate-50"
                      dangerouslySetInnerHTML={{ __html: renderQuestion(questions[current].question) }}
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                  {questions[current].options.map((opt, idx) => {
                    const isSelected = selected === idx
                    const isCorrect = idx === questions[current].correctAnswer

                    let base =
                      'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left text-sm transition shadow-sm'
                    let stateClasses =
                      'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400/80 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/20'
                    if (revealed) {
                      if (isCorrect) {
                        stateClasses =
                          'border-emerald-400/80 bg-emerald-50 dark:bg-emerald-900/25 text-emerald-900 dark:text-emerald-100'
                      } else if (isSelected) {
                        stateClasses =
                          'border-rose-400/80 bg-rose-50 dark:bg-rose-900/25 text-rose-900 dark:text-rose-100'
                      } else {
                        stateClasses =
                          'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 opacity-60'
                      }
                    } else if (isSelected) {
                      stateClasses =
                        'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100'
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={revealed}
                        onClick={() => handleSelect(idx)}
                        className={`${base} ${stateClasses}`}
                      >
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          {optionLetters[idx]}
                        </span>
                        <span
                          className="flex-1 text-[13px] md:text-sm text-slate-800 dark:text-slate-100"
                          dangerouslySetInnerHTML={{ __html: renderQuestion(opt) }}
                        />
                        {revealed && isCorrect && (
                          <FiCheckCircle className="text-emerald-500" />
                        )}
                        {revealed && isSelected && !isCorrect && (
                          <FiXCircle className="text-rose-500" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Feedback + explanation */}
                {revealed && (
                  <div
                    className={`mt-4 rounded-xl border px-4 py-4 space-y-3 text-sm ${
                      answers[current]?.isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                        : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
                      {answers[current]?.isCorrect ? (
                        <>
                          <FiCheckCircle className="text-emerald-500" />
                          Correct!
                        </>
                      ) : (
                        <>
                          <FiXCircle className="text-rose-500" />
                          Wrong answer
                        </>
                      )}
                    </div>

                    <div className="rounded-lg bg-white/80 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800 px-3 py-3 space-y-2">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">
                        <FiStar className="text-xs" />
                        AI Explanation
                      </div>
                      {loadingExp ? (
                        <div className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-300">
                          <FiLoader className="animate-spin text-sm" />
                          Generating explanation...
                        </div>
                      ) : (
                        <p className="text-[13px] leading-relaxed text-slate-800 dark:text-slate-100">
                          {explanation}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={current === 0}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-30"
                  >
                    Previous
                  </button>

                  {revealed ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition"
                    >
                      {current + 1 >= questions.length ? 'See results' : 'Next question'}
                      <FiChevronRight className="text-sm" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-sm font-semibold cursor-not-allowed"
                    >
                      Answer first
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

