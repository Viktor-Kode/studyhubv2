'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { getFirebaseToken } from '@/lib/store/authStore'
import ReactMarkdown from 'react-markdown'
import { Clock, Send, Trash2, X, Plus, Bot, User } from 'lucide-react'

const SAVE_DEBOUNCE = 3000

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string | Date
}

interface ChatSessionPreview {
  sessionId: string
  title: string
  subject: string
  messageCount: number
  lastMessage: string
  createdAt: string
  updatedAt: string
}

interface ChatSessionFull {
  sessionId: string
  subject: string
  messages: ChatMessage[]
}

export default function AiTutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSessionPreview[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState('')
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    loadMostRecentChat()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (messages.length === 0) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void saveCurrentChat()
    }, SAVE_DEBOUNCE)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, subject, sessionId])

  const getToken = async () => getFirebaseToken()

  const loadMostRecentChat = async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/backend/chat/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success && data.sessions.length > 0) {
        const latest = data.sessions[0] as ChatSessionPreview
        setChatSessions(data.sessions)
        await loadSession(latest.sessionId)
      }
    } catch (err) {
      console.error('Failed to load chat history:', err)
    }
  }

  const loadSession = async (sid: string) => {
    try {
      const token = await getToken()
      const res = await fetch(`/api/backend/chat/history/${sid}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        const session: ChatSessionFull = data.session
        setMessages(session.messages || [])
        setSessionId(session.sessionId)
        setSubject(session.subject || '')
        setShowHistory(false)
      }
    } catch (err) {
      console.error('Failed to load session:', err)
    }
  }

  const saveCurrentChat = async () => {
    if (messages.length === 0) return
    try {
      const token = await getToken()
      await fetch('/api/backend/chat/history', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, messages, subject }),
      })
    } catch (err) {
      console.error('Failed to save chat:', err)
    }
  }

  const startNewChat = useCallback(() => {
    void saveCurrentChat()
    setMessages([])
    setSessionId(null)
    setSubject('')
    setInput('')
    setShowHistory(false)
    setTimeout(() => inputRef.current?.focus(), 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/backend/chat/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) setChatSessions(data.sessions)
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const deleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const token = await getToken()
      await fetch(`/api/backend/chat/history/${sid}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setChatSessions((prev) => prev.filter((s) => s.sessionId !== sid))
      if (sid === sessionId) startNewChat()
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const token = await getToken()
      const res = await fetch('/api/backend/ai/chat', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg.content,
          context: '',
          chatHistory: messages.slice(-10),
        }),
      })
      const data = await res.json()
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply || data.message || 'Sorry, something went wrong.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      console.error('Failed to send tutor message:', err)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I could not connect. Please try again.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const STARTER_PROMPTS = [
    'Explain the water cycle',
    'Help me with quadratic equations',
    'What caused World War 1?',
    'Quiz me on Biology',
  ]

  return (
    <ProtectedRoute>
      {/* Full-screen chat layout using dynamic viewport height to handle mobile keyboard */}
      <div
        className="flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden"
        style={{ height: 'calc(100dvh - 56px)' }}
      >
        {/* ── Top Header ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 gap-2">
          {/* Left: back + breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <BackButton label="Dashboard" href="/dashboard/student" />
            <span className="text-xs text-gray-400 hidden sm:block">/ AI Tutor</span>
          </div>

          {/* Centre: title + auto-save badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm text-gray-900 dark:text-white hidden sm:block">AI Tutor</span>
            {messages.length > 0 && (
              <span className="text-[10px] text-gray-400 hidden sm:block">💾 Auto-saved</span>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setShowHistory(true)
                void fetchHistory()
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <Clock size={13} />
              <span>History</span>
            </button>
            <button
              onClick={startNewChat}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition"
            >
              <Plus size={13} />
              <span className="hidden sm:block">New</span>
            </button>
          </div>
        </div>

        {/* ── Messages Area ───────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto w-full">
            {messages.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-6 py-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Bot size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Ask me anything</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[280px]">
                    I can explain topics, answer questions, and quiz you on any subject.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setInput(p)}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-500 dark:hover:text-violet-400 transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar — assistant only */}
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <Bot size={14} className="text-white" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] min-w-0 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    style={{ minWidth: 0, overflow: 'hidden' }}
                  >
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm break-words overflow-hidden ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white rounded-tr-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
                      }`}
                      style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', maxWidth: '100%' }}
                    >
                      {msg.role === 'user' ? (
                        <span>{msg.content}</span>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                              code: ({ children, ...props }: any) =>
                                props.inline ? (
                                  <code className="bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                                ) : (
                                  <pre className="bg-gray-900 text-gray-100 rounded-xl p-3 overflow-x-auto text-xs font-mono mt-2 mb-1" style={{ whiteSpace: 'pre', wordBreak: 'normal' }}>
                                    <code>{children}</code>
                                  </pre>
                                ),
                              ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 my-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 my-1">{children}</ol>,
                              li: ({ children }) => <li className="text-sm">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-0.5">{children}</h3>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {new Date(msg.timestamp || new Date()).toLocaleTimeString('en-NG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Avatar — user only */}
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={14} className="text-violet-600 dark:text-violet-400" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Input Area ──────────────────────────────────── */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3"
          style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-3xl mx-auto flex gap-2 items-center">
            <input
              ref={inputRef}
              className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-all text-gray-900 dark:text-gray-100 min-w-0"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void sendMessage()}
              onFocus={() => {
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
                }, 350)
              }}
            />
            <button
              onClick={() => void sendMessage()}
              disabled={loading || !input.trim()}
              className="w-11 h-11 flex items-center justify-center bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700 flex-shrink-0 shadow-md shadow-violet-500/20"
            >
              <Send size={17} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">Press Enter to send</p>
        </div>
      </div>

      {/* ── History Drawer ────────────────────────────────── */}
      {showHistory && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowHistory(false)}
          />

          {/* Drawer panel */}
          <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={15} className="text-violet-500" />
                Chat History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition"
              >
                <X size={17} />
              </button>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {historyLoading ? (
                <div className="text-center py-8 text-xs text-gray-400">Loading...</div>
              ) : chatSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">No previous chats</div>
              ) : (
                chatSessions.map((s) => (
                  <div
                    key={s.sessionId}
                    onClick={() => void loadSession(s.sessionId)}
                    className={`group flex items-start gap-2 p-3 rounded-xl cursor-pointer transition border ${
                      s.sessionId === sessionId
                        ? 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800'
                        : 'bg-gray-50 dark:bg-gray-900/30 border-transparent hover:bg-gray-100 dark:hover:bg-gray-900'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[13px] text-gray-900 dark:text-white truncate">{s.title}</p>
                      {s.subject && (
                        <span className="text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 px-1.5 py-0.5 rounded-full font-semibold">
                          {s.subject}
                        </span>
                      )}
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">{s.lastMessage}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {s.messageCount} msgs · {getTimeAgo(s.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => void deleteSession(s.sessionId, e)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 text-gray-400 transition opacity-0 group-hover:opacity-100"
                      title="Delete chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* New chat CTA */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={startNewChat}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition shadow-md shadow-violet-500/20"
              >
                + Start New Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}

const getTimeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
