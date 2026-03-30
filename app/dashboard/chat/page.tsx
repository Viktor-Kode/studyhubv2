'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { useAuthStore } from '@/lib/store/authStore'
import { apiClient } from '@/lib/api/client'
import {
  getTutorChatHistory,
  getTutorChatSession,
  saveTutorChatSession,
  deleteTutorChatSession,
  TutorChatSessionPreview,
} from '@/lib/api/quizApi'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { HiOutlineArrowLeft, HiOutlineSparkles } from 'react-icons/hi'
import { FiTrash2, FiSend, FiCopy, FiCheck } from 'react-icons/fi'

import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'

type ChatRole = 'user' | 'assistant'

interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: string
  followUps?: string[]
}

const SAVE_DEBOUNCE_MS = 1500

const SUBJECTS = [
  'Maths',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Government',
  'Literature',
  'Geography',
  'Civic Ed',
  'Agric',
  'Further Maths',
] as const

type Subject = (typeof SUBJECTS)[number]

const PURPLE = '#5B4CF5'

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

function extractTopicFromMessage(message: string): string | null {
  if (!message) return null
  const cleaned = message.replace(/\[\[(.|\s)*\]\]\s*$/s, '').trim()
  if (!cleaned) return null
  const firstSentence = cleaned.split(/[\n\.?!]/)[0]?.trim()
  if (!firstSentence) return null
  return firstSentence.length > 80 ? `${firstSentence.slice(0, 77)}...` : firstSentence
}

export default function ChatPage() {
  const profileClassLevel = useAuthStore((s) => s.user?.classLevel)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Maths')
  const [studyTopic, setStudyTopic] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<TutorChatSessionPreview[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (profileClassLevel) {
      setStudentClass((prev) => (prev.trim() ? prev : profileClassLevel))
    }
  }, [profileClassLevel])

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const currentTopic = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastAssistant) return null
    return extractTopicFromMessage(lastAssistant.content)
  }, [messages])

  useEffect(() => {
    if (!bottomRef.current) return
    bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isSending])

  const loadHistory = async (loadLatest = false) => {
    setHistoryLoading(true)
    try {
      const data = await getTutorChatHistory()
      if (data.success) {
        const sessions = data.sessions || []
        setChatSessions(sessions)
        if (loadLatest && sessions.length > 0) {
          await loadSession(sessions[0].sessionId)
        }
      }
    } catch {
      // ignore background history fetch errors
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadSession = async (sid: string) => {
    try {
      const data = await getTutorChatSession(sid)
      if (!data.success) return
      const loadedMessages = (data.session.messages || []).map((m, index) => ({
        id: `${Date.now()}-${index}-${m.role}`,
        role: m.role,
        content: m.content,
        createdAt: (m.timestamp ? new Date(m.timestamp) : new Date()).toISOString(),
      }))
      setSessionId(data.session.sessionId)
      setMessages(loadedMessages)
    } catch {
      // ignore session load error
    }
  }

  const persistCurrentChat = async () => {
    if (!messages.length) return
    try {
      const payload = messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.createdAt,
      }))
      const result = await saveTutorChatSession(sessionId, payload, selectedSubject)
      if (!sessionId && result?.sessionId) setSessionId(result.sessionId)
      await loadHistory(false)
    } catch {
      // ignore save errors
    }
  }

  const startNewChat = async () => {
    if (messages.length > 0) {
      await persistCurrentChat()
    }
    setSessionId(null)
    setMessages([])
    setInput('')
    setShowClearConfirm(false)
  }

  const removeSession = async (sid: string) => {
    try {
      await deleteTutorChatSession(sid)
      setChatSessions((prev) => prev.filter((s) => s.sessionId !== sid))
      if (sid === sessionId) {
        setSessionId(null)
        setMessages([])
      }
    } catch {
      // ignore delete failures
    }
  }

  useEffect(() => {
    void loadHistory(true)
  }, [])

  useEffect(() => {
    if (!messages.length) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void persistCurrentChat()
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [messages, sessionId, selectedSubject])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxHeight = 5 * 24
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [input])

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || isSending) return

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: content,
      createdAt: new Date().toISOString(),
    }

    const contextParts = [
      `Subject: ${selectedSubject}.`,
      studyTopic.trim() ? `Topic the student wants to learn: ${studyTopic.trim()}.` : '',
      studentClass.trim() ? `Class / level: ${studentClass.trim()}.` : '',
    ].filter(Boolean)
    const tutorContext =
      contextParts.join(' ') ||
      'General tutoring. Ask the student to set subject, topic, and class above if helpful.'

    const chatHistoryPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsSending(true)

    try {
      const res = await apiClient.post('/ai/chat', {
        message: content,
        context: tutorContext,
        chatHistory: chatHistoryPayload,
      })

      const reply: string = res.data?.reply || ''
      const { cleanText, followUps } = parseFollowUps(reply)

      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: cleanText || reply || 'No response.',
        createdAt: new Date().toISOString(),
        followUps,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      const errorText = err?.message || 'Something went wrong. Please try again.'
      const errorMessage: ChatMessage = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: `I could not complete that request:\n\n${errorText}`,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim()) {
        handleSend()
      }
    }
  }

  const handleCopy = (message: ChatMessage) => {
    navigator.clipboard
      .writeText(message.content)
      .then(() => {
        setCopiedId(message.id)
        setTimeout(() => setCopiedId(null), 2000)
      })
      .catch(() => {
        // ignore clipboard failures silently
      })
  }

  const handleFollowUpClick = (question: string) => {
    handleSend(question)
  }

  const handleClearChat = () => {
    if (!showClearConfirm) {
      setShowClearConfirm(true)
      return
    }
    void startNewChat()
  }

  const characterCount = input.length

  const renderEmptyState = () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-center px-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-900">
          <HiOutlineSparkles size={28} color={PURPLE} />
        </div>
        <h2 className="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
          Hi there 👋
        </h2>
        <p className="mb-2 text-sm text-gray-500 dark:text-slate-300">
          I&apos;m your AI tutor. Set your <strong className="text-gray-700 dark:text-slate-200">subject</strong>,{' '}
          <strong className="text-gray-700 dark:text-slate-200">topic</strong>, and{' '}
          <strong className="text-gray-700 dark:text-slate-200">class</strong> above, then type your question below.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            'Explain the water cycle 💧',
            'Solve: 2x² + 5x - 3 = 0 ✏️',
            'What caused World War I? 🌍',
            'Describe photosynthesis 🌿',
          ].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleSend(example)}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user'
    const time = new Date(message.createdAt).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    })

    if (isUser) {
      return (
        <div key={message.id} className="mb-3 flex justify-end">
          <div className="max-w-[75%] text-right">
            <div
              className="inline-block rounded-[18px_18px_4px_18px] px-4 py-2 text-sm text-white"
              style={{ backgroundColor: PURPLE }}
            >
              {message.content}
            </div>
            <div className="mt-1 text-xs text-gray-400 dark:text-slate-400">{time}</div>
          </div>
        </div>
      )
    }

    return (
      <div key={message.id} className="mb-4 flex items-start gap-3">
        <div
          className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: PURPLE }}
        >
          <HiOutlineSparkles size={16} className="text-white" />
        </div>
        <div className="relative max-w-[80%]">
          <div
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <button
              type="button"
              onClick={() => handleCopy(message)}
              className="absolute right-3 top-3 text-gray-300 hover:text-gray-500 dark:text-slate-500 dark:hover:text-slate-300"
            >
              {copiedId === message.id ? <FiCheck size={14} /> : <FiCopy size={14} />}
            </button>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-400 dark:text-slate-400">{time}</div>

          {message.followUps && message.followUps.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.followUps.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleFollowUpClick(q)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col bg-[#F7F8FA] dark:bg-slate-950">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-4 pt-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BackButton label="Dashboard" href="/dashboard" />
              <Link
                href="/dashboard/student"
                className="hidden items-center gap-2 text-xs text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-slate-100 sm:flex"
              >
                <HiOutlineArrowLeft />
                Back to student dashboard
              </Link>
            </div>
          </div>

          <div
            className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    AI Tutor
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-300">
                    {currentTopic
                      ? `Discussing: ${currentTopic}`
                      : 'Choose subject, topic & class—then ask your question.'}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <label
                    htmlFor="ai-tutor-subject"
                    className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400"
                  >
                    Subject
                  </label>
                  <select
                    id="ai-tutor-subject"
                    data-tour="ai-tutor-subject"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value as Subject)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-[#5B4CF5] focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex min-w-0 flex-col gap-1 sm:col-span-1">
                  <label
                    htmlFor="ai-tutor-topic"
                    className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400"
                  >
                    Topic
                  </label>
                  <input
                    id="ai-tutor-topic"
                    type="text"
                    data-tour="ai-tutor-topic"
                    value={studyTopic}
                    onChange={(e) => setStudyTopic(e.target.value)}
                    placeholder="e.g. Quadratic equations, Cell division"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none ring-[#5B4CF5] focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <label
                    htmlFor="ai-tutor-class"
                    className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400"
                  >
                    Class
                  </label>
                  <input
                    id="ai-tutor-class"
                    type="text"
                    data-tour="ai-tutor-class"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="e.g. SS2, JSS 3, 200 Level"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none ring-[#5B4CF5] focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            <div className="ml-3 flex flex-col items-end">
              <button
                type="button"
                onClick={handleClearChat}
                className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:border-red-200 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-red-400"
              >
                <FiTrash2 size={13} />
                {showClearConfirm ? 'Tap again to confirm' : 'New chat'}
              </button>
            </div>
          </div>

          <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">Saved conversations</span>
              <button
                type="button"
                onClick={() => void loadHistory(false)}
                className="text-[11px] text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Refresh
              </button>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1">
              {historyLoading ? (
                <p className="text-xs text-gray-400 dark:text-slate-500">Loading chats...</p>
              ) : chatSessions.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500">No chats yet.</p>
              ) : (
                chatSessions.map((session) => (
                  <button
                    key={session.sessionId}
                    type="button"
                    onClick={() => void loadSession(session.sessionId)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs transition flex items-center justify-between gap-2 ${
                      session.sessionId === sessionId
                        ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="truncate">{session.title || 'New Chat'}</span>
                    <span
                      className="text-gray-400 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        void removeSession(session.sessionId)
                      }}
                    >
                      <FiTrash2 size={12} />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div
            className="relative mb-3 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-transparent dark:border-slate-800"
          >
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
                {messages.length === 0 ? (
                  renderEmptyState()
                ) : (
                  <>
                    {messages.map((m) => renderMessage(m))}
                    {isSending && (
                      <div className="mb-4 flex items-start gap-3">
                        <div
                          className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: PURPLE }}
                        >
                          <HiOutlineSparkles size={16} className="text-white" />
                        </div>
                        <div className="max-w-[80%]">
                          <div
                            className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                          >
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0.15s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0.3s]" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>
            </div>
          </div>

          <div
            className="sticky bottom-0 mt-auto w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-4 sm:py-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                data-tour="ai-tutor-input"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask anything... e.g. Explain photosynthesis in simple terms"
                className="max-h-32 flex-1 resize-none border-none bg-transparent px-1 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                data-tour="ai-tutor-send"
                onClick={() => handleSend()}
                disabled={!input.trim() || isSending}
                className="mb-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition"
                style={{
                  backgroundColor: !input.trim() || isSending ? '#E5E7EB' : PURPLE,
                  cursor: !input.trim() || isSending ? 'not-allowed' : 'pointer',
                }}
              >
                <FiSend size={15} />
              </button>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-xs text-gray-400 dark:text-slate-400">
                Press Enter to send • Shift+Enter for new line
              </span>
              {characterCount > 200 && (
                <span className="text-xs text-gray-400 dark:text-slate-400">{characterCount} characters</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
