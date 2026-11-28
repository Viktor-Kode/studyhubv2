'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FiCheck, FiClock, FiX, FiBookOpen, FiLoader, FiPlus, FiRefreshCw } from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import { checkGapAnswer, finishGapQuiz, GapQuizQuestion } from '@/lib/api/quizApi'
import { cbtApi } from '@/lib/api/cbt'
import { createFlashCard } from '@/lib/api/flashcardApi'

const STORAGE_KEY = 'qgen_gap_quiz_v1'
type GapResult = 'correct' | 'almost' | 'wrong'
interface GapSession {
  questions: GapQuizQuestion[]
  sessionId: string
  sourceName: string
  questionType: string
  difficulty: 'easy' | 'medium' | 'hard'
  timerMinutes: number
  gapHint: 'first-letter' | 'none'
  startedAt: string
}
interface GapAnswer {
  result: GapResult
  typedAnswer: string
  correctAnswer: string
}
interface FinalResult {
  correctAnswers: number
  totalQuestions: number
  answers: Array<{
    questionId: string
    question: string
    selectedAnswer: string
    correctAnswer: string
    explanation: string
    isCorrect: boolean
    result: GapResult
  }>
}

function formatClock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function Sentence({ sentence, gap, onGapChange, onGapSubmit, revealed }: {
  sentence: string
  gap: string
  onGapChange?: (value: string) => void
  onGapSubmit?: () => void
  revealed?: string
}) {
  const [before, after = ''] = sentence.split('____')
  return <p className="text-2xl sm:text-3xl md:text-[34px] font-semibold leading-relaxed tracking-tight text-slate-100 break-words">
    {before}
    {revealed ? <span className="inline-block mx-1 px-2 border-b-2 border-emerald-400 text-emerald-300 bg-emerald-400/10 rounded-t-md">{revealed}</span> : (
      <input aria-label="Missing word" autoComplete="off" autoCapitalize="off" spellCheck={false} value={gap}
        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); onGapSubmit?.() } }}
        onChange={(event) => onGapChange?.(event.target.value)}
        className="inline-block align-baseline mx-1 w-[min(42vw,260px)] min-w-[125px] rounded-t-lg border-0 border-b-2 border-indigo-400 bg-indigo-500/15 px-3 py-1.5 text-center text-xl sm:text-2xl font-semibold text-white outline-none placeholder:text-slate-400 focus:bg-indigo-500/25 focus:ring-0"
        placeholder="type the word" />
    )}
    {after}
  </p>
}

export default function GapQuizPage() {
  const router = useRouter()
  const [session, setSession] = useState<GapSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState<GapAnswer | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [savingReview, setSavingReview] = useState(false)
  const [savedFlashcards, setSavedFlashcards] = useState(false)
  const startedAtRef = useRef<number>(Date.now())

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) { router.replace('/dashboard/question-bank'); return }
      const parsed = JSON.parse(raw) as GapSession
      if (!parsed.questions?.length || !parsed.sessionId) { router.replace('/dashboard/question-bank'); return }
      setSession(parsed)
      if (parsed.timerMinutes > 0) setSecondsLeft(parsed.timerMinutes * 60)
    } catch {
      router.replace('/dashboard/question-bank')
    } finally {
      setLoading(false)
    }
  }, [router])

  const question = session?.questions[index]
  const progress = session ? Math.round(((index + (checked ? 1 : 0)) / session.questions.length) * 100) : 0

  const finish = useCallback(async () => {
    if (!session || busy) return
    setBusy(true)
    try {
      const result = await finishGapQuiz({ sessionId: session.sessionId, timeTaken: Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)) })
      setFinalResult(result)
      sessionStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'We couldn’t save your results.')
    } finally {
      setBusy(false)
    }
  }, [session, busy])

  useEffect(() => {
    if (secondsLeft === null || finalResult) return
    if (secondsLeft <= 0) {
      void finish()
      return
    }
    const timer = window.setTimeout(() => setSecondsLeft((value) => value === null ? null : value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft, finalResult, finish])

  const submitAnswer = async (answer: string) => {
    if (!session || !question || busy || checked) return
    setBusy(true)
    try {
      const result = await checkGapAnswer({ sessionId: session.sessionId, questionId: question._id, answer })
      const next: GapAnswer = { result: result.result, typedAnswer: answer, correctAnswer: result.correctAnswer }
      setChecked(next)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'We couldn’t check that answer.')
    } finally {
      setBusy(false)
    }
  }

  const continueQuiz = () => {
    if (!session || !question) return
    if (index >= session.questions.length - 1) { void finish(); return }
    setIndex((value) => value + 1)
    setChecked(null)
    setTyped('')
    setExplanation('')
  }

  const retryMissed = () => {
    if (!session || !finalResult) return
    const missedIds = new Set(finalResult.answers.filter((answer) => !answer.isCorrect).map((answer) => answer.questionId))
    const missed = session.questions.filter((item) => missedIds.has(item._id))
    if (!missed.length) return
    setSession({ ...session, questions: missed })
    setIndex(0)
    setTyped('')
    setChecked(null)
    setFinalResult(null)
    setSecondsLeft(session.timerMinutes > 0 ? session.timerMinutes * 60 : null)
    startedAtRef.current = Date.now()
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, questions: missed }))
  }

  const handleExplain = async (qText: string, answer: string) => {
    setExplaining(true)
    try {
      const response = await cbtApi.getExplanation(qText.replace('____', answer), answer)
      setExplanation(response)
    } catch {
      toast.error('Could not get an explanation right now.')
    } finally {
      setExplaining(false)
    }
  }

  const saveMissedFlashcards = async () => {
    if (!finalResult || savedFlashcards) return
    const missed = finalResult.answers.filter((answer) => !answer.isCorrect)
    try {
      await Promise.all(missed.map((answer) => createFlashCard({
        front: answer.question.replace('____', '_____'),
        back: [answer.correctAnswer, answer.explanation].filter(Boolean).join(' — '),
        category: 'Question Bank Review',
        difficulty: session?.difficulty || 'medium',
        tags: ['fill-in-gap', 'missed-question'],
      })))
      setSavedFlashcards(true)
      toast.success('Missed gaps added to your flashcards.')
    } catch {
      toast.error('Could not add the missed gaps to flashcards.')
    }
  }

  const saveCurrentForReview = async () => {
    if (!session || !question || !checked || savingReview) return
    setSavingReview(true)
    try {
      await createFlashCard({
        front: question.content,
        back: [checked.correctAnswer, question.knowledgeDeepDive].filter(Boolean).join(' — '),
        category: 'Question Bank Review',
        difficulty: session.difficulty,
        tags: ['fill-in-gap', 'review'],
      })
      toast.success('Added to your review list.')
    } catch {
      toast.error('Could not add this gap to your review list.')
    } finally {
      setSavingReview(false)
    }
  }

  if (loading || !session) return <div className="min-h-[70vh] grid place-items-center bg-slate-950 text-slate-300"><FiLoader className="animate-spin text-2xl" /></div>

  if (finalResult) {
    const score = finalResult.correctAnswers
    const total = finalResult.totalQuestions
    const percent = total ? Math.round(score / total * 100) : 0
    const missed = finalResult.answers.filter((answer) => !answer.isCorrect)
    const almostCount = finalResult.answers.filter((answer) => answer.result === 'almost').length
    return <ProtectedRoute allowedRoles={['student']}>
      <main className="min-h-[calc(100dvh-2rem)] bg-slate-950 text-slate-100 px-4 py-8 pb-28 sm:pb-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 text-center">
            <div className="mx-auto grid h-32 w-32 place-items-center rounded-full" style={{ background: `conic-gradient(#818cf8 ${percent}%, #263248 0)` }}>
              <div className="grid h-28 w-28 place-items-center rounded-full bg-slate-900"><div><strong className="block text-3xl">{score}/{total}</strong><span className="text-sm text-slate-400">{percent}%</span></div></div>
            </div>
            <h1 className="mt-5 text-2xl font-bold">Quiz complete</h1>
            <p className="mt-2 text-slate-400">{session.sourceName}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-800/80 p-3"><b className="block text-emerald-300">{finalResult.answers.filter(a => a.result === 'correct').length}</b><span className="text-xs text-slate-400">Correct</span></div>
              <div className="rounded-2xl bg-slate-800/80 p-3"><b className="block text-amber-300">{almostCount}</b><span className="text-xs text-slate-400">Almost · counted</span></div>
              <div className="rounded-2xl bg-slate-800/80 p-3"><b className="block text-rose-300">{missed.length}</b><span className="text-xs text-slate-400">Missed</span></div>
              <div className="rounded-2xl bg-slate-800/80 p-3"><b className="block">{formatClock(Math.floor((Date.now() - startedAtRef.current) / 1000))}</b><span className="text-xs text-slate-400">Time taken</span></div>
            </div>
          </section>

          {!!missed.length && <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold">Gaps to review</h2>
            <div className="space-y-4">
              {missed.map((answer) => <article key={answer.questionId} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <Sentence sentence={answer.question} gap="" revealed={answer.correctAnswer} />
                <p className="mt-3 text-sm text-slate-400">Your answer: <s className="text-rose-300">{answer.selectedAnswer || 'Skipped'}</s></p>
                {answer.explanation && <p className="mt-3 text-sm text-slate-400"><span className="text-indigo-300">FROM YOUR NOTES</span> · {answer.explanation}</p>}
                <button onClick={() => void handleExplain(answer.question, answer.correctAnswer)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-800"><FiBookOpen /> Explain</button>
                {explanation && <p className="mt-2 text-sm text-slate-300">{explanation}</p>}
              </article>)}
            </div>
          </section>}

          <div className="grid gap-3 sm:grid-cols-3">
            {missed.length > 0 && <button onClick={retryMissed} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold hover:bg-indigo-500"><FiRefreshCw className="mr-2 inline" />Retry missed gaps</button>}
            {missed.length > 0 && <button onClick={() => void saveMissedFlashcards()} disabled={savedFlashcards} className="rounded-xl border border-slate-700 px-4 py-3 font-bold hover:bg-slate-800 disabled:opacity-50"><FiPlus className="mr-2 inline" />{savedFlashcards ? 'Added to flashcards' : 'Add missed to flashcards'}</button>}
            <button onClick={() => router.push('/dashboard/question-bank')} className="rounded-xl border border-slate-700 px-4 py-3 font-bold hover:bg-slate-800">New quiz</button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  }

  if (!question) return null
  const hintOn = session.gapHint === 'first-letter'
  const feedbackText = checked?.result === 'correct' ? 'Correct' : checked?.result === 'almost' ? 'Almost — counted as correct' : 'Not quite'
  return <ProtectedRoute allowedRoles={['student']}>
    <main className="min-h-[calc(100dvh-2rem)] bg-slate-950 text-slate-100 pb-28 sm:pb-8">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 px-3 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button aria-label="Exit quiz" onClick={() => router.push('/dashboard/question-bank')} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-700 hover:bg-slate-800"><FiX /></button>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs sm:text-sm"><span className="font-bold">Question {index + 1} of {session.questions.length}</span><span className="text-slate-400">Fill in the gap</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
          {secondsLeft !== null && <div className="flex shrink-0 items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-sm font-bold"><FiClock className="text-indigo-300" />{formatClock(secondsLeft)}</div>}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-10">
          <div className="mb-10 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="w-fit rounded-full border border-indigo-500/50 bg-indigo-500/10 px-3 py-1.5 font-bold tracking-wide text-indigo-200">FROM YOUR NOTES</span>
            <span className="text-slate-400">{question.sourceFileName || session.sourceName}</span>
          </div>
          <Sentence sentence={question.content} gap={typed} onGapChange={setTyped} onGapSubmit={() => void submitAnswer(typed)} revealed={checked?.correctAnswer} />
          {hintOn && !checked && <div className="mt-7 flex flex-wrap items-center gap-2 text-sm text-amber-300">
            <span>Hint</span><span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">Starts with “{question.hintFirstLetter}”</span><span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">{question.answerLength} letters</span>
          </div>}
          {checked && <div className={`mt-8 rounded-2xl border p-4 ${checked.result === 'correct' ? 'border-emerald-500/30 bg-emerald-500/10' : checked.result === 'almost' ? 'border-amber-500/30 bg-amber-500/10' : 'border-rose-500/30 bg-rose-500/10'}`}>
            <h2 className={`font-bold ${checked.result === 'correct' ? 'text-emerald-300' : checked.result === 'almost' ? 'text-amber-300' : 'text-rose-300'}`}>{feedbackText}</h2>
            {checked.result === 'almost' && <p className="mt-1 text-sm text-slate-300">Your answer was close. The right spelling is <b>{checked.correctAnswer}</b>.</p>}
            {checked.result === 'wrong' && <p className="mt-1 text-sm text-slate-300">You typed “{checked.typedAnswer || 'nothing'}”. The answer is <b>{checked.correctAnswer}</b>.</p>}
            {checked.result === 'wrong' && <div className="mt-3 border-t border-white/10 pt-3 text-sm text-slate-300"><p className="text-[11px] font-bold tracking-wider text-indigo-200">FROM YOUR NOTES</p><p className="mt-1">{question.sourceQuote}</p><p className="mt-2">{question.knowledgeDeepDive}</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => void handleExplain(question.content, checked.correctAnswer)} className="rounded-lg border border-slate-700 px-3 py-2 font-semibold">{explaining ? 'Explaining…' : 'Explain this'}</button><button onClick={() => void saveCurrentForReview()} disabled={savingReview} className="rounded-lg border border-slate-700 px-3 py-2 font-semibold disabled:opacity-50">{savingReview ? 'Adding…' : 'Add to review list'}</button></div>{explanation && <p className="mt-2">{explanation}</p>}</div>}
          </div>}
        </section>
        <p className="mt-4 text-center text-xs text-slate-400">Spelling doesn’t need to be perfect. Close answers still count.</p>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-800 bg-slate-950/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-auto sm:mt-4 sm:max-w-4xl sm:border-0 sm:bg-transparent sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          {!checked ? <>
            <button onClick={() => void submitAnswer('')} disabled={busy} className="rounded-xl border border-slate-700 px-5 py-3 font-bold hover:bg-slate-800">Skip</button>
            <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-400 sm:inline">Press Enter to check</span><button onClick={() => void submitAnswer(typed)} disabled={!typed.trim() || busy} className="rounded-xl bg-indigo-600 px-6 py-3 font-bold hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <FiLoader className="animate-spin" /> : <><FiCheck className="mr-2 inline" />Check answer</>}</button></div>
          </> : <button onClick={continueQuiz} disabled={busy} className="ml-auto w-full rounded-xl bg-indigo-600 px-6 py-3 font-bold hover:bg-indigo-500 sm:w-auto">{busy ? 'Saving…' : index === session.questions.length - 1 ? 'See results' : 'Continue'}</button>}
        </div>
      </footer>
    </main>
  </ProtectedRoute>
}
