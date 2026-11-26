'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getFirebaseToken, useAuthStore } from '@/lib/store/authStore'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import {
  Plus,
  MessageSquare,
  MoreVertical,
  ArrowLeft,
  Menu,
  X,
  Lightbulb,
  Paperclip,
  FileText,
  ArrowUp,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Trash2,
  History,
  Loader2,
  Sparkles
} from 'lucide-react'
import { chatWithTutor } from '@/lib/api/quizApi'
import { extractTextFromFile } from '@/lib/utils/extraction'
import { toast } from 'react-hot-toast'
import { triggerUpgradeModal } from '@/lib/upgradeHandler'

const SAVE_DEBOUNCE = 3000

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string | Date
  files?: string[]
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
  const { user } = useAuthStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSessionPreview[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState('')

  // Document context upload states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [extractedText, setExtractedText] = useState<string>('')
  const [extracting, setExtracting] = useState(false)

  // Copy feedback state
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const chatFeedRef = useRef<HTMLDivElement | null>(null)
  const autoFollowRef = useRef(true)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    void loadMostRecentChat()
  }, [])

  useEffect(() => {
    if (!autoFollowRef.current) return

    const frame = window.requestAnimationFrame(() => {
      const feed = chatFeedRef.current
      if (feed) feed.scrollTop = feed.scrollHeight
    })
    return () => window.cancelAnimationFrame(frame)
  }, [messages, loading])

  useEffect(() => {
    const viewport = window.visualViewport
    const updateHeight = () => {
      const height = viewport?.height || window.innerHeight
      document.documentElement.style.setProperty('--ai-tutor-viewport-height', `${Math.round(height)}px`)
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    viewport?.addEventListener('resize', updateHeight)

    return () => {
      window.removeEventListener('resize', updateHeight)
      viewport?.removeEventListener('resize', updateHeight)
      document.documentElement.style.removeProperty('--ai-tutor-viewport-height')
    }
  }, [])

  const handleFeedScroll = () => {
    const feed = chatFeedRef.current
    if (!feed) return
    autoFollowRef.current = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 96
  }

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

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/backend/chat/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.sessions)) {
        setChatSessions(data.sessions)
      }
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadMostRecentChat = async () => {
    try {
      const token = await getToken()
      const res = await fetch('/api/backend/chat/history', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success && data.sessions && data.sessions.length > 0) {
        setChatSessions(data.sessions)
        const latest = data.sessions[0] as ChatSessionPreview
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
        autoFollowRef.current = true
        setMessages(session.messages || [])
        setSessionId(session.sessionId)
        setSubject(session.subject || '')
        setIsSidebarOpen(false)
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
    autoFollowRef.current = true
    setMessages([])
    setSessionId(null)
    setSubject('')
    setInput('')
    setIsSidebarOpen(false)
    setUploadedFiles([])
    setExtractedText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      // Avoid popping open the iPhone keyboard just because a new chat was created.
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        textareaRef.current.focus()
      }
    }
  }, [messages, sessionId, subject])

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
      toast.success('Chat deleted')
    } catch (err) {
      console.error('Failed to delete session:', err)
      toast.error('Could not delete session')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt', '.md', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.webp']
    for (const file of files) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!allowedTypes.includes(extension)) {
        toast.error(`Unsupported file: ${file.name}. Please upload PDF, Word, PPT, TXT, or Image files.`)
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds the 50MB limit.`)
        return
      }
    }

    setUploadedFiles(files)
    setExtracting(true)
    let combinedText = ''

    try {
      for (const file of files) {
        const text = await extractTextFromFile(file)
        if (text && text.trim().length > 0) {
          combinedText += `\n--- Context from ${file.name} ---\n` + text + '\n'
        }
      }

      if (combinedText.trim().length > 0) {
        setExtractedText(combinedText)
        toast.success(`Context ready: ${files.map(f => f.name).join(', ')}`)

        // Append user upload notice to chat
        const fileNames = files.map(f => f.name).join(', ')
        const uploadUserMsg: ChatMessage = {
          role: 'user',
          content: `Uploaded file${files.length > 1 ? 's' : ''}: ${fileNames}`,
          timestamp: new Date(),
          files: files.map(f => f.name)
        }
        autoFollowRef.current = true
        setMessages(prev => [...prev, uploadUserMsg])

        // Automatically trigger AI acknowledgment
        setLoading(true)
        setTimeout(() => {
          setLoading(false)
          const aiMsg: ChatMessage = {
            role: 'assistant',
            content: `I've received your file${files.length > 1 ? 's' : ''}: **${fileNames}**.\n\nI'm analyzing the content. Here's what I can help with:\n- Summarize key points\n- Generate practice questions from this material\n- Explain difficult concepts\n- Create study notes\n\nWhat would you like me to do with this file?`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMsg])
        }, 1200)

      } else {
        toast.error('Could not extract readable text from the uploaded files.')
        setUploadedFiles([])
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to parse file: ' + (err.message || ''))
      setUploadedFiles([])
    } finally {
      setExtracting(false)
    }
  }

  const removeFiles = () => {
    setUploadedFiles([])
    setExtractedText('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const sendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText !== undefined ? overrideText : input).trim()
    if (!textToSend && uploadedFiles.length === 0) return
    if (loading) return

    const userText = textToSend
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setLoading(true)
    autoFollowRef.current = true

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

      const isPaywall =
        err?.status === 403 ||
        err?.showUpgrade === true ||
        err?.code === 'AI_LIMIT_REACHED' ||
        err?.code === 'SUBSCRIPTION_EXPIRED'

      setMessages((prev) => {
        const copy = [...prev]
        const lastIdx = copy.length - 1
        if (lastIdx >= 0 && copy[lastIdx].role === 'assistant') {
          copy[lastIdx] = {
            ...copy[lastIdx],
            content: isPaywall
              ? "You've used all your free AI credits. Upgrade to keep chatting! 🚀"
              : 'Sorry, I encountered an error. Please try again.',
          }
        }
        return copy
      })

      if (isPaywall) {
        triggerUpgradeModal('ai')
      } else {
        toast.error('Failed to connect to the tutor.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content)
    setCopiedIndex(index)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const formatSessionDate = (dateString?: string) => {
    if (!dateString) return 'Recent'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 14) return '1 week ago'
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
  }

  const userName = (user as any)?.displayName || user?.name || 'Student'
  const userEmail = user?.email || 'student@studyhelp.site'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <ProtectedRoute>
      {/* Keep the tutor's loading animation local to this page. */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>

      <div
        className="flex w-full max-w-full overflow-hidden bg-[#f6f7fb] text-slate-900 dark:bg-[#0a0e1a] dark:text-slate-100 font-sans relative"
        style={{ height: 'var(--ai-tutor-viewport-height, 100dvh)' }}
      >

        {/* ===== SIDEBAR OVERLAY (mobile) ===== */}
        <div
          className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* ===== SIDEBAR ===== */}
        <aside
          className={`w-[260px] md:w-[280px] bg-white dark:bg-[#0d1322] border-r border-slate-200 dark:border-white/10 flex flex-col flex-shrink-0 h-full p-4 pt-[max(16px,env(safe-area-inset-top))] transition-transform duration-300 ease-out z-50 fixed md:relative left-0 top-0 bottom-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}
        >
          {/* Chat History Heading */}
          <div className="flex items-center gap-2.5 px-1 pb-4 border-b border-slate-200 dark:border-white/10 mb-4 text-slate-600 dark:text-white/70">
            <History className="w-5 h-5 text-green-700 dark:text-[#34d399]" />
            <span className="text-sm font-semibold">History</span>
          </div>

          {/* New Chat Button */}
          <button
            onClick={startNewChat}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 bg-white dark:bg-[#111a2e] hover:bg-green-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-green-700 dark:text-[#34d399] text-sm font-medium transition duration-200 mb-4 group"
          >
            <Plus className="w-4 h-4 text-slate-400 dark:text-white/50 group-hover:text-green-700 dark:group-hover:text-[#34d399] transition-colors" />
            <span>New chat</span>
          </button>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-thin">
            {chatSessions.length === 0 ? (
              <div className="text-xs text-slate-400 dark:text-white/40 px-3 py-4 text-center">
                No recent tutoring sessions.
              </div>
            ) : (
              chatSessions.map((s) => {
                const isActive = s.sessionId === sessionId
                return (
                  <div
                    key={s.sessionId}
                    onClick={() => void loadSession(s.sessionId)}
                    className={`group flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 min-h-[40px] ${isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-[#34d399]'
                        : 'text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-green-700 dark:text-[#34d399]' : 'text-slate-400 dark:text-white/40'}`} />
                      <span className="truncate flex-1">{s.title || 'Tutoring Session'}</span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[10px] text-slate-400 dark:text-white/30 group-hover:text-slate-600 dark:group-hover:text-white/50">
                        {formatSessionDate(s.updatedAt || s.createdAt)}
                      </span>
                      <button
                        onClick={(e) => void deleteSession(s.sessionId, e)}
                        className="p-1 text-slate-400 dark:text-white/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Sidebar Footer (User Card) */}
          <div className="border-t border-slate-200 dark:border-white/10 pt-3 mt-1">
            <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-green-600 dark:bg-[#34d399] text-white dark:text-[#052e16] flex items-center justify-center font-bold text-xs flex-shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-900 dark:text-white truncate">{userName}</div>
                <div className="text-[11px] text-slate-500 dark:text-white/40 truncate">{userEmail}</div>
              </div>
              <MoreVertical className="w-4 h-4 text-slate-400 dark:text-white/40 flex-shrink-0" />
            </div>
          </div>
        </aside>

        {/* ===== MAIN CHAT ===== */}
        <main className="flex-1 flex flex-col min-h-0 bg-[#f6f7fb] dark:bg-[#0a0e1a] overflow-hidden">

          {/* Chat Header */}
          <header className="relative z-20 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] border-b border-slate-200 dark:border-white/10 flex items-center justify-between flex-shrink-0 min-h-[56px] bg-white/90 dark:bg-[#111a2e]/90 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <a
                href="/dashboard/student"
                className="flex items-center gap-1.5 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition font-medium text-decoration-none"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </a>

              <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 whitespace-nowrap">
                <span>AI Tutor</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-white/40 hidden sm:flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Online
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {/* Messages Feed */}
          <div
            ref={chatFeedRef}
            onScroll={handleFeedScroll}
            className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-4 sm:p-6 space-y-8 scrollbar-thin [-webkit-overflow-scrolling:touch]"
          >

            {/* AI Welcome State */}
            {messages.length === 0 && (
              <section className="w-full max-w-5xl mx-auto animate-fadeIn text-base sm:text-lg leading-8 text-slate-700 dark:text-white/85">
                <p className="mb-3">Hello! I&apos;m your AI tutor. I can help you with:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-1 list-disc pl-6 mb-4 text-slate-600 dark:text-white/75">
                  <li>Understanding difficult concepts</li>
                  <li>Generating practice questions</li>
                  <li>Breaking down past exam questions</li>
                  <li>Creating study notes from your materials</li>
                </ul>
                <p>What would you like to learn today?</p>
              </section>
            )}

            {/* Chat Messages */}
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              return (
                <div
                  key={i}
                  className={`w-full max-w-5xl mx-auto animate-fadeIn ${isUser ? 'flex justify-end' : ''}`}
                >
                  {/* Message Body */}
                  <div className={`${isUser ? 'max-w-[85%] text-left' : 'w-full'} min-w-0`}>
                    <div
                      className={`${isUser
                          ? 'bg-green-700 text-white px-4 py-2.5 rounded-2xl inline-block text-left shadow-sm'
                          : 'w-full text-base sm:text-lg leading-8 text-slate-800 dark:text-white/90'
                        }`}
                    >
                      {isUser ? (
                        <div>
                          {msg.files && msg.files.length > 0 && (
                            <div className="mb-1 text-xs text-green-100 dark:text-green-900 font-medium flex items-center gap-1.5">
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>Uploaded: {msg.files.join(', ')}</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ) : (
                        <div className="prose prose-slate dark:prose-invert max-w-none prose-p:leading-8 prose-p:mb-4 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3 prose-strong:font-bold prose-ul:my-4 prose-ol:my-4 prose-li:my-1">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                              code: ({ children, ...props }: any) => (
                                <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-lg p-3 my-2 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                                  {children}
                                </div>
                              ),
                              blockquote: ({ children }) => (
                                <div className="bg-green-50 dark:bg-green-950/30 border-l-4 border-green-600 dark:border-[#34d399] px-3.5 py-2.5 rounded-r-lg my-2 text-slate-800 dark:text-slate-100">
                                  {children}
                                </div>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {/* AI Message Actions */}
                    {!isUser && msg.content && (
                      <div className="flex items-center gap-2 mt-2 opacity-80 hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toast.success('Thanks for your feedback!')}
                          aria-label="Helpful"
                          title="Helpful"
                          className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded transition"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toast('Thanks for your feedback! We will work to improve.', { icon: '👍' })}
                          aria-label="Not helpful"
                          title="Not helpful"
                          className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded transition"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleCopy(msg.content, i)}
                          aria-label={copiedIndex === i ? 'Copied response' : 'Copy response'}
                          title={copiedIndex === i ? 'Copied' : 'Copy'}
                          className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded transition"
                        >
                          {copiedIndex === i ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Typing Indicator */}
            {loading && (
              <div className="w-full max-w-5xl mx-auto flex gap-1 items-center px-1 py-1.5 text-green-700 dark:text-[#34d399]">
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-white/40 rounded-full animate-[typingBounce_1.4s_infinite]" />
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-white/40 rounded-full animate-[typingBounce_1.4s_infinite_0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-white/40 rounded-full animate-[typingBounce_1.4s_infinite_0.4s]" />
              </div>
            )}

          </div>

          {/* Input Bar */}
          <div className="flex-shrink-0 bg-transparent px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <div className="max-w-4xl mx-auto">

            {/* File status tag */}
            {uploadedFiles.length > 0 && (
              <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-xs text-green-700 dark:text-green-300">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate font-medium">
                    {uploadedFiles.map(f => f.name).join(', ')}
                  </span>
                </div>
                <button
                  onClick={removeFiles}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 dark:text-white/50 transition"
                  title="Remove context"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

              {/* Floating Input Wrapper */}
              <div className="flex items-end gap-2 bg-white dark:bg-[#111a2e] border border-slate-200 dark:border-white/10 rounded-[28px] px-3 py-2 shadow-[0_8px_28px_rgba(15,23,42,0.10)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.35)] focus-within:border-green-600 dark:focus-within:border-[#34d399] transition duration-200">

                {/* Upload Plus Button */}
                <label
                  className="p-2 mb-0.5 text-slate-400 dark:text-white/50 hover:text-green-700 dark:hover:text-[#34d399] hover:bg-slate-100 dark:hover:bg-white/5 rounded-full cursor-pointer transition flex-shrink-0"
                  title="Upload study document"
                >
                  <Plus className="w-5 h-5" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.ppt,.pptx"
                    multiple
                    onChange={handleFileSelect}
                  />
                </label>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void sendMessage()
                    }
                  }}
                  placeholder={extracting ? "Extracting file text..." : "Message your AI tutor..."}
                  disabled={extracting}
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2 resize-none min-h-[40px] max-h-[120px] leading-relaxed"
                />

                {/* Send Button */}
                <button
                  onClick={() => void sendMessage()}
                  disabled={loading || extracting || (!input.trim() && uploadedFiles.length === 0)}
                  className="w-10 h-10 bg-green-700 hover:bg-green-800 dark:bg-[#34d399] dark:hover:bg-[#22c55e] disabled:opacity-30 text-white dark:text-[#052e16] rounded-full font-bold flex items-center justify-center transition flex-shrink-0"
                  aria-label="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

              {/* Suggestion Chips */}
              <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => void sendMessage("Generate quiz on this topic")}
                  className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-white/60 bg-white dark:bg-[#111a2e] hover:bg-green-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full transition duration-200 whitespace-nowrap flex-shrink-0"
                >
                  <Zap className="w-3 h-3 text-green-700 dark:text-[#34d399]" />
                  <span>Generate quiz</span>
                </button>
                <button
                  onClick={() => void sendMessage("Explain concept simply with real-life examples")}
                  className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-white/60 bg-white dark:bg-[#111a2e] hover:bg-green-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full transition duration-200 whitespace-nowrap flex-shrink-0"
                >
                  <Lightbulb className="w-3 h-3 text-green-700 dark:text-[#34d399]" />
                  <span>Explain concept</span>
                </button>
                <button
                  onClick={() => void sendMessage("Summarize study notes into bullet points")}
                  className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-white/60 bg-white dark:bg-[#111a2e] hover:bg-green-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full transition duration-200 whitespace-nowrap flex-shrink-0"
                >
                  <FileText className="w-3 h-3 text-green-700 dark:text-[#34d399]" />
                  <span>Summarize notes</span>
                </button>
              </div>
            </div>
          </div>

        </main>

      </div>
    </ProtectedRoute>
  )
}
