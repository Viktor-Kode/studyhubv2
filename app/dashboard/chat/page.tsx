'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { apiClient } from '@/lib/api/client'
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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Maths')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const currentTopic = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastAssistant) return null
    return extractTopicFromMessage(lastAssistant.content)
  }, [messages])

  useEffect(() => {
    if (!bottomRef.current) return
    bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isSending])

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

    const subjectTag = selectedSubject ? `[Subject: ${selectedSubject}] ` : ''
    const payloadMessage = `${subjectTag}${content}`

    const chatHistoryPayload = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsSending(true)

    try {
      const res = await apiClient.post('/ai/chat', {
        message: payloadMessage,
        context: '',
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
    setMessages([])
    setShowClearConfirm(false)
  }

  const characterCount = input.length

  const renderEmptyState = () => (
    <div className="flex h-full items-center justify-center">
      <div className="text-center px-6">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <HiOutlineSparkles size={28} color={PURPLE} />
        </div>
        <h2 className="mb-1 text-xl font-semibold text-gray-900">
          Hi there 👋
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          I&apos;m your AI tutor. Ask me anything about your subjects.
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
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
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
            <div className="mt-1 text-xs text-gray-400">{time}</div>
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
            className="rounded-2xl border px-4 py-3 text-sm text-gray-800 bg-white"
            style={{
              borderColor: '#E8EAED',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <button
              type="button"
              onClick={() => handleCopy(message)}
              className="absolute right-3 top-3 text-gray-300 hover:text-gray-500"
            >
              {copiedId === message.id ? <FiCheck size={14} /> : <FiCopy size={14} />}
            </button>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-400">{time}</div>

          {message.followUps && message.followUps.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.followUps.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleFollowUpClick(q)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50"
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
      <div
        className="flex min-h-screen flex-col"
        style={{ backgroundColor: '#F7F8FA' }}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-4 pt-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BackButton label="Dashboard" href="/dashboard" />
              <Link
                href="/dashboard/student"
                className="hidden items-center gap-2 text-xs text-gray-500 hover:text-gray-700 sm:flex"
              >
                <HiOutlineArrowLeft />
                Back to student dashboard
              </Link>
            </div>
          </div>

          <div
            className="mb-3 flex items-center justify-between rounded-2xl border bg-white px-4 py-3"
            style={{
              borderColor: '#E8EAED',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    AI Tutor
                  </span>
                  <span className="text-xs text-gray-500">
                    {currentTopic ? `Discussing: ${currentTopic}` : 'Ask anything about your subjects.'}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {SUBJECTS.map((subject) => {
                  const active = subject === selectedSubject
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => setSelectedSubject(subject)}
                      className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium"
                      style={
                        active
                          ? {
                              backgroundColor: PURPLE,
                              color: 'white',
                            }
                          : {
                              border: '1px solid rgba(148, 163, 184, 0.7)',
                              color: '#4B5563',
                              backgroundColor: 'white',
                            }
                      }
                    >
                      {subject}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="ml-3 flex flex-col items-end">
              <button
                type="button"
                onClick={handleClearChat}
                className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:border-red-200 hover:text-red-600"
              >
                <FiTrash2 size={13} />
                {showClearConfirm ? 'Tap again to confirm' : 'Clear chat'}
              </button>
            </div>
          </div>

          <div
            className="relative mb-3 flex-1 overflow-hidden rounded-2xl border bg-transparent"
            style={{ borderColor: '#E8EAED' }}
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
                            className="inline-flex items-center gap-1 rounded-2xl border bg-white px-4 py-3"
                            style={{
                              borderColor: '#E8EAED',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            }}
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
            className="sticky bottom-0 mt-auto w-full rounded-2xl border bg-white px-3 py-2 sm:px-4 sm:py-3"
            style={{
              borderColor: '#E8EAED',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask anything... e.g. Explain photosynthesis in simple terms"
                className="max-h-32 flex-1 resize-none border-none bg-transparent px-1 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
              />
              <button
                type="button"
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
              <span className="text-xs text-gray-400">
                Press Enter to send • Shift+Enter for new line
              </span>
              {characterCount > 200 && (
                <span className="text-xs text-gray-400">{characterCount} characters</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
