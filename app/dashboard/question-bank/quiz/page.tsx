'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { cbtApi } from '@/lib/api/cbt'
import { studyPlanApi } from '@/lib/api/studyPlanApi'
import { Question } from '@/lib/api/quizApi'
import { toast } from 'react-hot-toast'
import {
  FiArrowLeft,
  FiClock,
  FiCheck,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiFlag,
  FiAward,
} from 'react-icons/fi'
import { BiBrain } from 'react-icons/bi'
import ReactMarkdown from 'react-markdown'

const QUIZ_SESSION_KEY = 'qgen_quiz_session_v2'

type Difficulty = 'easy' | 'medium' | 'hard'

interface QuizSession {
  questions: Question[]
  sessionId?: string
  sourceName: string
  questionType: string
  difficulty: Difficulty
  timerMinutes: number
  startedAt: string
}

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', pill: 'bg-emerald-500 text-white' },
  medium: { label: 'Medium', color: 'text-amber-500',   bg: 'bg-amber-500/10 border-amber-500/20',   pill: 'bg-amber-500 text-white' },
  hard:   { label: 'Hard',   color: 'text-red-500',     bg: 'bg-red-500/10 border-red-500/20',       pill: 'bg-red-500 text-white' },
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function compareAnswers(userAnsw: any, correctAnsw: any, options: string[] = []): boolean {
  if (userAnsw === undefined || userAnsw === null || correctAnsw === undefined || correctAnsw === null) return false
  const normalize = (s: any) => String(s).toLowerCase().trim()
  const uNorm = normalize(userAnsw)
  const cNorm = normalize(correctAnsw)
  if (uNorm === cNorm) return true
  const isLetter = (s: string) => /^[a-e]$/.test(s)
  const isIndex = (s: string) => /^[0-4]$/.test(s)
  if (isLetter(uNorm) && isIndex(cNorm)) {
    if (uNorm.charCodeAt(0) - 97 === parseInt(cNorm)) return true
  }
  if (options && options.length > 0 && isLetter(uNorm)) {
    const idx = uNorm.charCodeAt(0) - 97
    if (idx < options.length && normalize(options[idx]) === cNorm) return true
  }
  return false
}

function getAnswerDisplayText(ans: any, options: string[] = []): string {
  if (ans === undefined || ans === null || ans === '') return 'Skipped'
  const normalize = (s: any) => String(s).trim()
  const val = normalize(ans)
  const isNumeric = /^[0-4]$/.test(val)
  const isLetter = /^[a-e]$/i.test(val)

  if (options && options.length > 0) {
    if (isNumeric) {
      const idx = parseInt(val)
      if (idx < options.length) {
        return `Option ${String.fromCharCode(65 + idx)}: ${options[idx]}`
      }
    } else if (isLetter) {
      const idx = val.toLowerCase().charCodeAt(0) - 97
      if (idx < options.length) {
        return `Option ${val.toUpperCase()}: ${options[idx]}`
      }
    }
  }
  return val
}

export default function QuizPage() {
  const router = useRouter()
  const [session, setSession] = useState<QuizSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [timeExpired, setTimeExpired] = useState(false)
  const startTimeRef = useRef<number>(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  const [isExplaining, setIsExplaining] = useState<Record<string, boolean>>({})
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({})

  // Load session from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(QUIZ_SESSION_KEY)
      if (!raw) { router.replace('/dashboard/question-bank'); return }
      const parsed: QuizSession = JSON.parse(raw)
      if (!parsed.questions?.length) { router.replace('/dashboard/question-bank'); return }
      setSession(parsed)
      if (parsed.timerMinutes > 0) {
        setTimeLeft(parsed.timerMinutes * 60)
      }
    } catch {
      router.replace('/dashboard/question-bank')
    } finally {
      setLoading(false)
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || submitted) return
    if (timeLeft <= 0) {
      setTimeExpired(true)
      handleSubmit(true)
      return
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => (t ?? 1) - 1), 1000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [timeLeft, submitted])

  const handleSubmit = useCallback(async (auto = false) => {
    if (!session || submitting) return
    setSubmitting(true)
    try {
      let finalScore = 0
      const processedAnswers = session.questions.map(q => {
        const userAnswer = userAnswers[q._id]
        const correctAnswer = q.answer !== undefined ? q.answer : (q as any).correctAnswer
        const isCorrect = compareAnswers(userAnswer, correctAnswer, q.options)
        if (isCorrect) finalScore++
        const getLabel = (ans: any) => {
          if (typeof ans === 'string' && ans.length === 1 && /^[a-e]$/i.test(ans))
            return q.options[ans.toLowerCase().charCodeAt(0) - 97] ?? ans
          if (typeof ans === 'number') return q.options[ans] ?? String(ans)
          return ans ?? 'Skipped'
        }
        return {
          questionId: q._id,
          question: q.content || (q as any).question,
          selectedAnswer: getLabel(userAnswer) ?? 'Skipped',
          correctAnswer: getLabel(correctAnswer),
          explanation: q.knowledgeDeepDive || (q as any).explanation || 'No explanation available.',
          isCorrect,
        }
      })

      const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000)
      await cbtApi.saveResult({
        subject: session.questions[0]?.subject || 'AI Generated Quiz',
        examType: 'AI_STUDY',
        year: new Date().getFullYear().toString(),
        sessionId: (session.questions[0] as any)?.sessionId,
        totalQuestions: session.questions.length,
        correctAnswers: finalScore,
        wrongAnswers: session.questions.length - finalScore,
        accuracy: Math.round((finalScore / session.questions.length) * 100),
        timeTaken: timeTaken || 30,
        answers: processedAnswers,
      })
      studyPlanApi.autoCompleteTask('cbt').catch(() => {})
      setScore(finalScore)
      setSubmitted(true)
      if (!auto) toast.success('Quiz results saved!')
      // Clear session after submission
      try {
        sessionStorage.removeItem(QUIZ_SESSION_KEY)
        localStorage.removeItem('qgen_session_v1')
      } catch {}
    } catch {
      toast.error('Failed to save results. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [session, userAnswers, submitting])

  const handleGetAiExplanation = async (q: Question) => {
    if (aiExplanations[q._id] || isExplaining[q._id]) {
      setShowExplanations(prev => ({ ...prev, [q._id]: !prev[q._id] }))
      return
    }

    setIsExplaining(prev => ({ ...prev, [q._id]: true }))
    setShowExplanations(prev => ({ ...prev, [q._id]: true }))
    try {
      const qText = q.content || (q as any).question || ''
      const correctAnswer = q.answer !== undefined ? q.answer : (q as any).correctAnswer
      const correctAnsText = typeof correctAnswer === 'number' && q.options
        ? q.options[Number(correctAnswer)]
        : String(correctAnswer)

      setAiExplanations(prev => ({ ...prev, [q._id]: '' }))
      const explanation = await cbtApi.getExplanation(qText, correctAnsText, q.options || [], (chunk) => {
        setAiExplanations(prev => ({ ...prev, [q._id]: (prev[q._id] || '') + chunk }))
      })
      setAiExplanations(prev => ({ ...prev, [q._id]: explanation }))
    } catch (err) {
      console.error('Failed to get AI explanation:', err)
      toast.error('Failed to generate explanation.')
    } finally {
      setIsExplaining(prev => ({ ...prev, [q._id]: false }))
    }
  }

  const handleToggleExplain = (q: Question) => {
    const hasLocalExplanation = q.knowledgeDeepDive || (q as any).explanation || (q as any).knowledge_deep_dive || (q as any).modelAnswer || (q as any).solution || (q as any).explanationText || (q as any).reason || (q as any).solution || (q as any).discussion
    if (hasLocalExplanation && hasLocalExplanation !== 'No deep-dive available.' && hasLocalExplanation !== 'No explanation available.') {
      setShowExplanations(prev => ({ ...prev, [q._id]: !prev[q._id] }))
    } else {
      void handleGetAiExplanation(q)
    }
  }

  const handleNewSession = () => {
    try {
      sessionStorage.removeItem(QUIZ_SESSION_KEY)
      localStorage.removeItem('qgen_session_v1')
    } catch {}
    router.push('/dashboard/question-bank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="animate-spin text-blue-500 text-3xl" />
      </div>
    )
  }

  if (!session) return null

  const questions = session.questions
  const total = questions.length
  const currentQ = questions[currentIndex]
  const diffCfg = DIFFICULTY_CONFIG[session.difficulty] ?? DIFFICULTY_CONFIG.medium
  const answeredCount = Object.keys(userAnswers).length
  const progressPct = Math.round((answeredCount / total) * 100)

  // --- Results Screen ---
  if (submitted) {
    const pct = Math.round((score / total) * 100)
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl animate-in fade-in duration-300">
            {/* Score Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className={`p-8 text-center ${pct >= 80 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : pct >= 60 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : pct >= 40 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-pink-600'}`}>
                <div className="flex justify-center mb-3">
                  <FiAward className="text-6xl text-white animate-bounce" />
                </div>
                <h1 className="text-3xl font-black text-white mb-1">Quiz Complete!</h1>
                <p className="text-white/80 text-sm">{session.sourceName}</p>
              </div>

              {/* Stats */}
              <div className="p-8">
                <div className="flex items-center justify-center mb-8">
                  <div className="relative w-36 h-36">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={pct >= 80 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-gray-900 dark:text-white">{pct}%</span>
                      <span className="text-xs text-gray-500">score</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20">
                    <p className="text-2xl font-black text-emerald-600">{score}</p>
                    <p className="text-xs text-emerald-600 font-bold mt-1">Correct</p>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-red-50 dark:bg-red-900/20">
                    <p className="text-2xl font-black text-red-500">{total - score}</p>
                    <p className="text-xs text-red-500 font-bold mt-1">Wrong</p>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-2xl font-black text-blue-600">{total}</p>
                    <p className="text-xs text-blue-600 font-bold mt-1">Total</p>
                  </div>
                </div>

                {/* Difficulty badge */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${diffCfg.pill}`}>{diffCfg.label}</span>
                  <span className="text-xs text-gray-500">{session.questionType}</span>
                </div>

                {timeExpired && (
                  <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-center">
                    <p className="text-amber-600 text-sm font-bold">Time expired — quiz was auto-submitted</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleNewSession}
                    className="flex-1 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-center text-sm hover:bg-gray-50 dark:hover:bg-gray-750 transition animate-pulse"
                  >
                    New Session
                  </button>
                  <Link
                    href="/dashboard/question-history"
                    className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-center text-sm hover:opacity-90 transition shadow-lg shadow-blue-500/20"
                  >
                    View History
                  </Link>
                </div>
              </div>
            </div>

            {/* Answer Review */}
            <div className="mt-8 space-y-6">
              <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">Answer Review</h2>
              {questions.map((q, i) => {
                const userAnswer = userAnswers[q._id]
                const correctAnswer = q.answer !== undefined ? q.answer : (q as any).correctAnswer
                const isCorrect = compareAnswers(userAnswer, correctAnswer, q.options)

                const userAnswerText = getAnswerDisplayText(userAnswer, q.options)
                const correctAnswerText = getAnswerDisplayText(correctAnswer, q.options)

                return (
                  <div key={q._id} className="bg-white dark:bg-gray-800 border border-gray-250 dark:border-gray-750 rounded-2xl p-5 space-y-4 text-left shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center ${
                        isCorrect
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-grow min-w-0">
                        <div className="text-gray-900 dark:text-white font-bold leading-snug">
                          <ReactMarkdown>{q.content || (q as any).question || ''}</ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    {/* Answers Side-by-side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className={`p-3 border rounded-xl ${
                        isCorrect
                          ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/20'
                          : 'bg-red-50/30 dark:bg-red-950/10 border-red-100/50 dark:border-red-900/20'
                      }`}>
                        <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>Your Answer</span>
                        <p className={`text-xs font-semibold break-words ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{userAnswerText}</p>
                      </div>
                      <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 block mb-1">Correct Answer</span>
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 break-words">{correctAnswerText}</p>
                      </div>
                    </div>

                    {/* Explain Button */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleToggleExplain(q)}
                        className="px-4 py-2 border border-blue-600/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                      >
                        <BiBrain className="text-sm" />
                        {showExplanations[q._id] ? 'Hide Explanation' : 'Explain'}
                      </button>
                    </div>

                    {/* Explanation if toggled */}
                    {showExplanations[q._id] && (
                      <div className="p-4 bg-blue-50/20 dark:bg-blue-950/5 rounded-xl border border-blue-100/50 dark:border-blue-900/20 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 block mb-1">Concept Explanation</span>
                        {isExplaining[q._id] && !aiExplanations[q._id] ? (
                          <div className="flex items-center gap-2 py-2 text-xs text-blue-500">
                            <FiLoader className="animate-spin" /> Generating explanation...
                          </div>
                        ) : (
                          <div className="text-xs text-gray-750 dark:text-gray-300 leading-relaxed font-medium">
                            <ReactMarkdown>
                              {aiExplanations[q._id] || q.knowledgeDeepDive || (q as any).explanation || 'No explanation available.'}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // --- Quiz Taking Screen ---
  const optionLabels = ['A', 'B', 'C', 'D', 'E']

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700/60 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            {/* Back & Discard */}
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/question-bank"
                className="flex items-center gap-1.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition flex-shrink-0"
              >
                <FiArrowLeft /> Exit
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Discard this quiz and start a new session? Your progress will be lost.")) {
                    handleNewSession()
                  }
                }}
                className="text-xs font-bold text-red-500 hover:text-red-750 transition flex items-center gap-1"
              >
                <FiX /> Discard
              </button>
            </div>

            {/* Center: progress info */}
            <div className="flex items-center gap-2 min-w-0">
              <span className={`hidden sm:inline px-2.5 py-0.5 rounded-full text-[10px] font-black ${diffCfg.pill}`}>{diffCfg.label}</span>
              <span className="text-xs font-bold text-gray-400">
                {currentIndex + 1} / {total}
              </span>
            </div>

            {/* Timer */}
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm flex-shrink-0 ${timeLeft <= 60 ? 'bg-red-50 dark:bg-red-900/20 text-red-500 animate-pulse' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}>
                <FiClock size={14} />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Question Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
            {/* Question Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {currentIndex + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                  {session.questionType.replace(/-/g, ' ')}
                </p>
              </div>
              <div className="text-xs text-white/60 font-medium">{answeredCount}/{total} answered</div>
            </div>

            {/* Question Body */}
            <div className="p-6">
              <div className="text-gray-900 dark:text-white font-semibold text-base leading-relaxed mb-6">
                <ReactMarkdown>{currentQ.content || (currentQ as any).question || ''}</ReactMarkdown>
              </div>

              {/* MCQ Options */}
              {currentQ.options && currentQ.options.length > 0 ? (
                <div className="space-y-3">
                  {currentQ.options.map((opt, i) => {
                    const letter = optionLabels[i]?.toLowerCase() ?? String(i)
                    const isSelected = userAnswers[currentQ._id] === letter
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setUserAnswers(prev => ({ ...prev, [currentQ._id]: letter }))}
                        className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 font-medium text-sm ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md shadow-blue-100 dark:shadow-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-200 hover:bg-blue-50/40 dark:hover:border-blue-800 dark:hover:bg-blue-900/10'
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          {optionLabels[i]}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                // Theory / Fill-in-the-blank
                <textarea
                  value={userAnswers[currentQ._id] ?? ''}
                  onChange={(e) => setUserAnswers(prev => ({ ...prev, [currentQ._id]: e.target.value }))}
                  placeholder="Type your answer here..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-sm font-medium text-gray-900 dark:text-gray-100 outline-none focus:border-blue-400 transition resize-none"
                />
              )}
            </div>
          </div>

          {/* Question Nav Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Jump to question</p>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, i) => {
                const isAnswered = q._id in userAnswers
                const isCurrent = i === currentIndex
                return (
                  <button
                    key={q._id}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40 scale-110'
                        : isAnswered
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-650'
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <FiChevronLeft /> Prev
            </button>

            <div className="flex-1" />

            {currentIndex < total - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(i => Math.min(total - 1, i + 1))}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition shadow-lg shadow-blue-200 dark:shadow-blue-900/40"
              >
                Next <FiChevronRight />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm transition shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 disabled:opacity-60"
              >
                {submitting ? <FiLoader className="animate-spin" /> : <FiCheck />}
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            )}
          </div>

          {/* Early submit (show after ≥50% answered) */}
          {answeredCount >= Math.ceil(total / 2) && !submitted && currentIndex < total - 1 && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={submitting}
                className="text-xs text-gray-400 hover:text-red-500 transition font-bold underline underline-offset-2"
              >
                Submit early ({answeredCount}/{total} answered)
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
