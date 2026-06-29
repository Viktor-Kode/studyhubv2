'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { getFirebaseToken } from '@/lib/store/authStore'
import ReactMarkdown from 'react-markdown'
import { Clock, Send, Trash2, X, Plus, Bot, User, FileText, Loader2, Sparkles } from 'lucide-react'
import { chatWithTutor } from '@/lib/api/quizApi'
import { extractTextFromFile } from '@/lib/utils/extraction'
import { toast } from 'react-hot-toast'

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

  // Document context upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string>('')
  const [extracting, setExtracting] = useState(false)

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    void loadMostRecentChat()
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
    setUploadedFile(null)
    setExtractedText('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [messages, sessionId, subject])

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.md', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.webp']
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(extension)) {
      toast.error('Unsupported file format. Please upload PDF, Word, PPT, TXT, or Image files.')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds the 15MB limit.')
      return
    }

    setUploadedFile(file)
    setExtracting(true)
    try {
      const text = await extractTextFromFile(file)
      if (text && text.trim().length > 0) {
        setExtractedText(text)
        toast.success(`Context ready: ${file.name}`)
      } else {
        toast.error('Could not extract readable text from this document.')
        setUploadedFile(null)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to parse the file: ' + (err.message || ''))
      setUploadedFile(null)
    } finally {
      setExtracting(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userText = input.trim()
    setInput('')
    setLoading(true)

    const userMsg: ChatMessage = {
      role: 'user',
      content: userText,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '', timestamp: new Date() }])

    try {
      const historyForModel = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      await chatWithTutor(
        userText,
        extractedText || undefined,
        historyForModel,
        (chunk) => {
          setMessages((prev) => {
            const copy = [...prev]
            const lastIdx = copy.length - 1
            if (lastIdx >= 0 && copy[lastIdx].role === 'assistant') {
              copy[lastIdx] = {
                ...copy[lastIdx],
                content: copy[lastIdx].content + chunk,
              }
            }
            return copy
          })
        }
      )
    } catch (err: any) {
      console.error('Tutor chat error:', err)
      setMessages((prev) => {
        const copy = [...prev]
        const lastIdx = copy.length - 1
        if (lastIdx >= 0 && copy[lastIdx].role === 'assistant') {
          copy[lastIdx] = {
            ...copy[lastIdx],
            content: 'Sorry, I encountered an error. Please try again.',
          }
        }
        return copy
      })
      toast.error('Failed to connect to the tutor.')
    } finally {
      setLoading(false)
    }
  }

  const STARTER_PROMPTS = [
    'Explain Nigeria\'s history',
    'Help me solve a math equation',
    'What is photosynthesis?',
    'Who founded StudyHelp?',
  ]

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-dvh w-full overflow-hidden bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 animate-in fade-in duration-200" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <BackButton label="Dashboard" href="/dashboard/student" />
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm leading-none">AI Study Tutor</h1>
                <span className="text-[10px] text-gray-400 font-medium">Nigerian Syllabus Expert</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {uploadedFile && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 rounded-full text-[10px] font-bold">
                <Sparkles size={11} className="animate-pulse" />
                <span className="truncate max-w-[120px]">{uploadedFile.name} active</span>
              </div>
            )}

            <button
              onClick={() => {
                setShowHistory(true)
                void fetchHistory()
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition"
            >
              <Clock size={13} />
              <span className="hidden sm:inline">History</span>
            </button>
            
            <button
              onClick={startNewChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-750 hover:to-indigo-750 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-500/20 transition"
            >
              <Plus size={13} />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin dark:scrollbar-track-gray-900">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {messages.length === 0 ? (
              /* Empty state suggestions */
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-violet-500 rounded-full blur-xl opacity-20 scale-125 animate-pulse" />
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg relative">
                    <Bot size={32} className="text-white" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight">Your AI Study Buddy</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
                    Upload documents, paste study notes, or type any academic topic. I am tailored to your syllabus!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setInput(p)}
                      className="text-left px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-semibold hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50/10 dark:hover:bg-violet-950/10 transition duration-200"
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
                  className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                      <Bot size={15} className="text-white" />
                    </div>
                  )}

                  <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm break-words overflow-hidden ${
                        msg.role === 'user'
                          ? 'bg-violet-600 text-white rounded-tr-sm'
                          : 'bg-white dark:bg-gray-900 text-gray-850 dark:text-gray-105 border border-gray-200/60 dark:border-gray-800 rounded-tl-sm'
                      }`}
                      style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                    >
                      {msg.role === 'user' ? (
                        <span>{msg.content}</span>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-p:mb-2 prose-ul:list-disc prose-ul:pl-4">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              code: ({ children, ...props }: any) =>
                                props.inline ? (
                                  <code className="bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                                ) : (
                                  <pre className="bg-gray-900 text-gray-100 rounded-xl p-3.5 overflow-x-auto text-xs font-mono my-2 border border-gray-800" style={{ whiteSpace: 'pre', wordBreak: 'normal' }}>
                                    <code>{children}</code>
                                  </pre>
                                ),
                              ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2">{children}</ol>,
                              li: ({ children }) => <li className="text-xs sm:text-sm">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1 font-medium">
                      {new Date(msg.timestamp || new Date()).toLocaleTimeString('en-NG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 border border-violet-200/50 dark:border-violet-800/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <User size={15} className="text-violet-600 dark:text-violet-400" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Pulsing loading state */}
            {loading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={15} className="text-white animate-spin" />
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 1, 2].map((x) => (
                      <span
                        key={x}
                        className="w-2.5 h-2.5 rounded-full bg-violet-400 dark:bg-violet-500 animate-bounce"
                        style={{ animationDelay: `${x * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <footer className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 pt-3" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <div className="max-w-3xl mx-auto space-y-3">
            
            {/* Active file context indicator */}
            {uploadedFile && (
              <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl max-w-sm text-xs text-emerald-700 dark:text-emerald-300">
                <div className="flex items-center gap-2 truncate">
                  <FileText size={15} className="text-emerald-500 flex-shrink-0" />
                  <span className="truncate font-bold">{uploadedFile.name}</span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-full font-bold">
                    {extracting ? 'Processing...' : 'Context Active'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null)
                    setExtractedText('')
                  }}
                  className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg text-emerald-505 transition"
                  title="Remove context"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input Row */}
            <div className="flex gap-2.5 items-center relative">
              
              {/* Document upload hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.txt,.md,.ppt,.pptx,image/*"
                onChange={handleFileSelect}
              />
              
              {/* Add document button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
                className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl transition flex-shrink-0 shadow-sm"
                title="Upload document"
              >
                {extracting ? (
                  <Loader2 size={20} className="animate-spin text-violet-500" />
                ) : (
                  <Plus size={20} className="stroke-[2.5]" />
                )}
              </button>

              {/* Chat Input — font-size must be >=16px to prevent iOS Safari zoom on focus */}
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3.5 outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-all text-gray-900 dark:text-gray-100 shadow-inner"
                style={{ fontSize: '16px', lineHeight: '1.5' }}
                placeholder={extracting ? "Reading file context..." : "Ask your tutor anything..."}
                disabled={extracting}
              />

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={loading || extracting || !input.trim()}
                className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-750 hover:to-indigo-750 transition disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 dark:disabled:from-gray-800 dark:disabled:to-gray-800 dark:disabled:text-gray-600 flex-shrink-0 shadow-md shadow-violet-500/10"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center font-medium">Press Enter to send · Support PDF, DOCX, PPT, Image context</p>
          </div>
        </footer>

        {/* Sliding History Drawer */}
        {showHistory && (
          <div className="fixed inset-0 z-[150] flex justify-end">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setShowHistory(false)}
            />

            <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock size={16} className="text-violet-500" />
                  <span>Chat Sessions</span>
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-450 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="animate-spin text-violet-500" />
                    <span className="text-xs text-gray-400">Loading chats...</span>
                  </div>
                ) : chatSessions.length === 0 ? (
                  <div className="text-center py-12 text-xs text-gray-400">No recent tutoring sessions.</div>
                ) : (
                  chatSessions.map((s) => (
                    <div
                      key={s.sessionId}
                      onClick={() => void loadSession(s.sessionId)}
                      className={`group flex items-start justify-between gap-2 p-3 rounded-xl cursor-pointer transition border ${
                        s.sessionId === sessionId
                          ? 'bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300'
                          : 'bg-gray-50 dark:bg-gray-900/30 border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs truncate leading-snug">{s.title}</p>
                        {s.subject && (
                          <span className="inline-block text-[9px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full mt-1 font-semibold">
                            {s.subject}
                          </span>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1 truncate leading-none">
                          {s.messageCount} messages
                        </p>
                      </div>
                      <button
                        onClick={(e) => void deleteSession(s.sessionId, e)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                        title="Delete chat"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Start new chat footer inside drawer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <button
                  onClick={startNewChat}
                  className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:from-violet-700 hover:to-indigo-750 transition"
                >
                  + Start New Chat
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  )
}
