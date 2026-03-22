'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BackButton from '@/components/BackButton'
import { apiClient } from '@/lib/api/client'
import { cbtApi, type TopicGeneratedQuestion } from '@/lib/api/cbt'
import {
  progressStorageKey,
  readTopicProgress,
  writeTopicProgress,
  SYLLABUS_SUBJECTS,
  type SyllabusExamKey,
  type SyllabusSubjectKey,
} from '@/lib/data/syllabus'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'
import { FiBookOpen, FiCheckCircle, FiLoader, FiSend } from 'react-icons/fi'

const PURPLE = '#5B4CF5'
const CARD = 'rounded-[14px] border-[1.5px] border-[#E8EAED] dark:border-gray-700 bg-white dark:bg-gray-900'

type ChatRole = 'user' | 'assistant'
interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  followUps?: string[]
}

function parseFollowUps(raw: string): { cleanText: string; followUps: string[] } {
  const match = raw.match(/\[\[(.*?)\]\]\s*$/s)
  if (!match) return { cleanText: raw.trim(), followUps: [] }
  const inner = match[1]
  const followUps = inner
    .split('||')
    .map((s) => s.trim())
    .filter(Boolean)
  const cleanText = raw.slice(0, match.index).trim()
  return { cleanText, followUps }
}

function normalizeQuestion(q: TopicGeneratedQuestion): {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
} | null {
  const opts = q?.options
  if (!opts) return null
  const order = ['A', 'B', 'C', 'D'] as const
  const arr = order.map((k) => String(opts[k] ?? '').trim())
  if (arr.some((x) => !x)) return null
  const letter = String(q.answer || 'A')
    .toUpperCase()
    .trim()
    .charAt(0)
  const idx = 'ABCD'.indexOf(letter)
  return {
    question: q.question,
    options: arr,
    correctIndex: idx >= 0 ? idx : 0,
    explanation: q.explanation || '',
  }
}

export default function TopicStudyClient() {
  const searchParams = useSearchParams()
  const exam = (searchParams.get('exam') || '').toLowerCase() as SyllabusExamKey
  const subjectKey = (searchParams.get('subject') || '') as SyllabusSubjectKey
  /** Next.js / URLSearchParams already decode this — do NOT decodeURIComponent again (throws on stray % and whitescreens the app). */
  const topicTitle = (searchParams.get('topic') || '').trim()
  const tabParam = searchParams.get('tab') === 'practice' ? 'practice' : 'tutor'

  const [mobileTab, setMobileTab] = useState<'tutor' | 'practice'>(tabParam)
  const subjectLabel = SYLLABUS_SUBJECTS.find((s) => s.key === subjectKey)?.label ?? subjectKey
  const examLabel =
    exam === 'postutme'
      ? 'Post-UTME'
      : exam
        ? exam.toUpperCase()
        : ''

  const examForApi =
    exam === 'jamb'
      ? 'JAMB'
      : exam === 'waec'
        ? 'WAEC'
        : exam === 'neco'
          ? 'NECO'
          : exam === 'postutme'
            ? 'POST_UTME'
            : String(exam || '').toUpperCase()

  const tutorContext = topicTitle
    ? `You are a Nigerian exam tutor helping a student study "${topicTitle}" in ${subjectLabel} for ${examLabel}. All your explanations, examples and questions should be based on the Nigerian ${examLabel} syllabus. Be clear, concise and exam-focused.`
    : ''

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [tutorInput, setTutorInput] = useState('')
  const [tutorSending, setTutorSending] = useState(false)
  const initialTutorSent = useRef(false)

  const [questions, setQuestions] = useState<ReturnType<typeof normalizeQuestion>[]>([])
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [expLoading, setExpLoading] = useState(false)
  const [score, setScore] = useState(0)
  const [roundDone, setRoundDone] = useState(false)
  const [attemptedRound, setAttemptedRound] = useState(0)

  useEffect(() => {
    setMobileTab(tabParam)
  }, [tabParam])

  useEffect(() => {
    initialTutorSent.current = false
    setMessages([])
    setTutorInput('')
    setQuestions([])
    setQIndex(0)
    setRoundDone(false)
    setGenError(null)
  }, [topicTitle, exam, subjectKey])

  const sendTutor = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || tutorSending || !tutorContext) return

      const userMessage: ChatMessage = {
        id: `${Date.now()}-u`,
        role: 'user',
        content: trimmed,
      }

      let historyPayload: { role: string; content: string }[] = []
      setMessages((m) => {
        historyPayload = m.map((x) => ({ role: x.role, content: x.content }))
        return [...m, userMessage]
      })
      setTutorSending(true)

      try {
        const res = await apiClient.post('/ai/chat', {
          message: trimmed,
          context: tutorContext,
          chatHistory: historyPayload.slice(-6),
        })
        const reply: string = res.data?.reply || ''
        const { cleanText, followUps } = parseFollowUps(reply)
        setMessages((m) => [
          ...m,
          {
            id: `${Date.now()}-a`,
            role: 'assistant',
            content: cleanText || reply || 'No response.',
            followUps,
          },
        ])
      } catch (e: any) {
        setMessages((m) => [
          ...m,
          {
            id: `${Date.now()}-e`,
            role: 'assistant',
            content: `Something went wrong: ${e?.message || 'try again'}`,
          },
        ])
      } finally {
        setTutorSending(false)
      }
    },
    [tutorContext, tutorSending]
  )

  useEffect(() => {
    if (!topicTitle || !exam || !subjectKey || !tutorContext) return
    if (initialTutorSent.current) return
    initialTutorSent.current = true
    const first = `Explain ${topicTitle} to me in simple terms with examples relevant to the ${examLabel} exam`
    void (async () => {
      setTutorSending(true)
      const userMessage: ChatMessage = {
        id: `${Date.now()}-u0`,
        role: 'user',
        content: first,
      }
      setMessages([userMessage])
      try {
        const res = await apiClient.post('/ai/chat', {
          message: first,
          context: tutorContext,
          chatHistory: [],
        })
        const reply: string = res.data?.reply || ''
        const { cleanText, followUps } = parseFollowUps(reply)
        setMessages([
          userMessage,
          {
            id: `${Date.now()}-a0`,
            role: 'assistant',
            content: cleanText || reply || 'No response.',
            followUps,
          },
        ])
      } catch (e: any) {
        setMessages([
          userMessage,
          {
            id: `${Date.now()}-e0`,
            role: 'assistant',
            content: `Could not reach the tutor: ${e?.message || 'error'}`,
          },
        ])
      } finally {
        setTutorSending(false)
      }
    })()
  }, [topicTitle, exam, subjectKey, tutorContext, examLabel])

  const generateQuestions = async () => {
    setGenError(null)
    setGenLoading(true)
    setRoundDone(false)
    setQIndex(0)
    setSelected(null)
    setRevealed(false)
    setExplanation('')
    setAttemptedRound(0)
    try {
      const raw = await cbtApi.generateTopicQuestions({
        exam: examForApi,
        subject: subjectLabel,
        topic: topicTitle,
        count: 5,
      })
      const normalized = raw.map(normalizeQuestion).filter(Boolean) as NonNullable<
        ReturnType<typeof normalizeQuestion>
      >[]
      if (normalized.length === 0) throw new Error('No valid questions in response')
      setQuestions(normalized)
      setScore(0)
    } catch (e: any) {
      setGenError(e?.message || 'Generation failed')
      setQuestions([])
    } finally {
      setGenLoading(false)
    }
  }

  const bumpProgress = () => {
    const k = progressStorageKey(exam, subjectKey, topicTitle)
    const prev = readTopicProgress(k) || { attempted: 0 }
    writeTopicProgress(k, {
      attempted: prev.attempted + 1,
      lastAt: new Date().toISOString(),
    })
  }

  const handleSelectOption = async (idx: number) => {
    const q = questions[qIndex]
    if (!q || revealed) return
    setSelected(idx)
    setRevealed(true)
    const correct = idx === q.correctIndex
    if (correct) setScore((s) => s + 1)
    setAttemptedRound((a) => a + 1)
    bumpProgress()

    setExpLoading(true)
    if (q.explanation) {
      setExplanation(q.explanation)
      setExpLoading(false)
    } else {
      try {
        const exp = await cbtApi.getExplanation(q.question, q.options[q.correctIndex], q.options)
        setExplanation(exp)
      } catch {
        setExplanation('Review the correct option above.')
      } finally {
        setExpLoading(false)
      }
    }
  }

  const handleNextQ = () => {
    if (qIndex + 1 >= questions.length) {
      setRoundDone(true)
      return
    }
    setQIndex((i) => i + 1)
    setSelected(null)
    setRevealed(false)
    setExplanation('')
  }

  const current = questions[qIndex]
  const validExam = ['jamb', 'waec', 'neco', 'postutme'].includes(exam)
  const validSubject = SYLLABUS_SUBJECTS.some((s) => s.key === subjectKey)
  const invalid = !validExam || !validSubject || !topicTitle

  const tutorPanel = (
    <div className={`${CARD} flex flex-col h-[min(720px,70vh)] lg:h-[calc(100vh-220px)]`}>
      <div className="p-3 border-b border-[#E8EAED] dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
        AI Tutor — {topicTitle || 'Topic'}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-[12px] p-3 text-sm ${msg.role === 'user' ? 'bg-violet-50 dark:bg-violet-950/30 ml-6' : 'bg-[#F7F8FA] dark:bg-gray-800/80 mr-6'}`}
          >
            {msg.role === 'assistant' ? (
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                className="prose prose-sm dark:prose-invert max-w-none"
              >
                {msg.content}
              </ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            )}
            {msg.followUps && msg.followUps.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {msg.followUps.map((f, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendTutor(f)}
                    className="text-xs px-2 py-1 rounded-full border border-[#E8EAED] dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700"
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {tutorSending && (
          <div className="text-xs text-gray-500 flex items-center gap-2 px-2">
            <FiLoader className="animate-spin" /> Tutor is typing…
          </div>
        )}
      </div>
      <div className="p-3 border-t border-[#E8EAED] dark:border-gray-700 flex gap-2">
        <input
          value={tutorInput}
          onChange={(e) => setTutorInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              const t = tutorInput.trim()
              if (t) {
                setTutorInput('')
                void sendTutor(t)
              }
            }
          }}
          placeholder="Ask a follow-up…"
          className="flex-1 rounded-[12px] border-[1.5px] border-[#E8EAED] dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            const t = tutorInput.trim()
            if (t) {
              setTutorInput('')
              void sendTutor(t)
            }
          }}
          disabled={tutorSending}
          className="p-2.5 rounded-[12px] text-white shrink-0 disabled:opacity-50"
          style={{ backgroundColor: PURPLE }}
          aria-label="Send"
        >
          <FiSend />
        </button>
      </div>
    </div>
  )

  const practicePanel = (
    <div className={`${CARD} flex flex-col min-h-[320px] lg:min-h-[calc(100vh-220px)]`}>
      <div className="p-3 border-b border-[#E8EAED] dark:border-gray-700 flex flex-wrap items-center gap-2 justify-between">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">Practice: {topicTitle}</p>
          <p className="text-xs text-gray-500">
            {attemptedRound > 0 ? `${attemptedRound} attempted this round` : 'AI-generated for this topic'}
          </p>
        </div>
        {questions.length > 0 && (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-200">
            Q {qIndex + 1}/{questions.length}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {genLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            <div className="grid gap-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-[10px]" />
              ))}
            </div>
          </div>
        )}

        {!genLoading && genError && (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-red-600 dark:text-red-400">{genError}</p>
            <button
              type="button"
              onClick={() => void generateQuestions()}
              className="px-4 py-2 rounded-[12px] bg-[#5B4CF5] text-white text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {!genLoading && !genError && questions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <FiBookOpen className="text-3xl text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs">
              Generate five exam-style questions for this topic. They are not from the main question bank.
            </p>
            <button
              type="button"
              onClick={() => void generateQuestions()}
              className="px-5 py-2.5 rounded-[14px] bg-[#5B4CF5] hover:bg-violet-600 text-white font-semibold"
            >
              Generate Questions
            </button>
          </div>
        )}

        {!genLoading && current && !roundDone && (
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {current.question}
              </ReactMarkdown>
            </div>
            <div className="grid gap-2">
              {current.options.map((opt, i) => {
                const letter = ['A', 'B', 'C', 'D'][i]
                const wrong = revealed && selected === i && i !== current.correctIndex
                const right = revealed && i === current.correctIndex
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={revealed}
                    onClick={() => void handleSelectOption(i)}
                    className={`text-left px-4 py-3 rounded-[12px] border-[1.5px] text-sm transition ${
                      wrong
                        ? 'border-red-300 bg-red-50 dark:bg-red-950/30'
                        : right
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                          : 'border-[#E8EAED] dark:border-gray-600 hover:border-violet-300'
                    }`}
                  >
                    <span className="font-bold text-violet-600 mr-2">{letter}.</span>
                    {opt}
                  </button>
                )
              })}
            </div>
            {revealed && (
              <div className="rounded-[12px] border-[1.5px] border-[#E8EAED] dark:border-gray-700 p-3 text-sm">
                {expLoading ? (
                  <span className="text-gray-500 flex items-center gap-2">
                    <FiLoader className="animate-spin" /> Explanation…
                  </span>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} className="prose prose-sm dark:prose-invert max-w-none">
                    {explanation}
                  </ReactMarkdown>
                )}
                <button
                  type="button"
                  onClick={handleNextQ}
                  className="mt-3 w-full py-2.5 rounded-[12px] font-semibold text-white"
                  style={{ backgroundColor: PURPLE }}
                >
                  {qIndex + 1 >= questions.length ? 'See results' : 'Next question'}
                </button>
              </div>
            )}
          </div>
        )}

        {roundDone && questions.length > 0 && (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
              <FiCheckCircle className="text-2xl" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              Score: {score} / {questions.length}
            </p>
            <p className="text-sm text-gray-500">{Math.round((score / questions.length) * 100)}% correct</p>
            <button
              type="button"
              onClick={() => void generateQuestions()}
              className="px-5 py-2.5 rounded-[14px] border-[1.5px] border-[#5B4CF5] text-[#5B4CF5] font-semibold hover:bg-violet-50 dark:hover:bg-violet-950/30"
            >
              Generate 5 More
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-[50vh] bg-[#F7F8FA] dark:bg-slate-950 py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-4">
        <BackButton label="Back to topics" href="/dashboard/student/cbt/syllabus" />
        {invalid ? (
          <div className={`${CARD} p-8 text-center`}>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Missing or invalid topic link.</p>
            <p className="text-xs text-gray-500 mb-4 font-mono break-all">
              exam={exam || '—'} · subject={subjectKey || '—'} · topic={topicTitle || '—'}
            </p>
            <Link href="/dashboard/student/cbt/syllabus" className="text-[#5B4CF5] font-semibold">
              Return to Study by Topic
            </Link>
          </div>
        ) : (
          <>
            <div className="flex lg:hidden gap-2 mb-2">
              <button
                type="button"
                onClick={() => setMobileTab('tutor')}
                className={`flex-1 py-2.5 rounded-[12px] text-sm font-semibold border-[1.5px] ${
                  mobileTab === 'tutor'
                    ? 'border-[#5B4CF5] bg-violet-50 dark:bg-violet-950/30 text-violet-800'
                    : 'border-[#E8EAED] dark:border-gray-600'
                }`}
              >
                📖 Tutor
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('practice')}
                className={`flex-1 py-2.5 rounded-[12px] text-sm font-semibold border-[1.5px] ${
                  mobileTab === 'practice'
                    ? 'border-[#5B4CF5] bg-violet-50 dark:bg-violet-950/30 text-violet-800'
                    : 'border-[#E8EAED] dark:border-gray-600'
                }`}
              >
                ✏️ Practice
              </button>
            </div>

            <div className="hidden lg:grid lg:grid-cols-2 gap-4 items-start">
              {tutorPanel}
              {practicePanel}
            </div>
            <div className="lg:hidden space-y-4">{mobileTab === 'tutor' ? tutorPanel : practicePanel}</div>
          </>
        )}
      </div>
    </div>
  )
}
