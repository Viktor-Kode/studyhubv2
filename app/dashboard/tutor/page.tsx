'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getFirebaseToken, useAuthStore } from '@/lib/store/authStore'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import {
  GraduationCap,
  Plus,
  MessageSquare,
  MoreVertical,
  ArrowLeft,
  Menu,
  X,
  Bot,
  User,
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
  Clock,
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    void loadMostRecentChat()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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
    setMessages([])
    setSessionId(null)
    setSubject('')
    setInput('')
    setIsSidebarOpen(false)
    setUploadedFiles([])
    setExtractedText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
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
      {/* Scope custom variables and css tweaks for authentic aesthetic */}
      <style>{`
        :root {
          --bg-main: #0a1a2e;
          --bg-sidebar: #0d1f33;
          --bg-chat: #0f2340;
          --bg-input: #1a2f4a;
          --bg-hover: #1f3552;
          --bg-user-msg: #1a2f4a;
          --border-color: rgba(255, 255, 255, 0.06);
          --text-primary: #ffffff;
          --text-secondary: rgba(255, 255, 255, 0.7);
          --text-muted: rgba(255, 255, 255, 0.4);
          --cyan: #00bcd4;
          --cyan-dark: #0097a7;
          --radius: 12px;
          --radius-sm: 8px;
        }

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

      <div className="flex h-[100dvh] w-screen overflow-hidden bg-[#0a1a2e] text-white font-sans relative">

        {/* ===== SIDEBAR OVERLAY (mobile) ===== */}
        <div
          className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 md:hidden ${
            isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* ===== SIDEBAR ===== */}
        <aside
          className={`w-[260px] md:w-[280px] bg-[#0d1f33] border-r border-white/5 flex flex-col flex-shrink-0 h-full p-4 pt-[max(16px,env(safe-area-inset-top))] transition-transform duration-300 ease-out z-50 fixed md:relative left-0 top-0 bottom-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/5 mb-4">
            <div className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
              <GraduationCap className="text-[#00bcd4] w-6 h-6" />
              <span>StudyHelp</span>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={startNewChat}
            className="flex items-center gap-2.5 w-full px-3.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-[#00bcd4]/50 rounded-lg text-[#00bcd4] text-sm font-medium transition duration-200 mb-4 group"
          >
            <Plus className="w-4 h-4 text-white/50 group-hover:text-[#00bcd4] transition-colors" />
            <span>New chat</span>
          </button>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
            {chatSessions.length === 0 ? (
              <div className="text-xs text-white/30 px-3 py-4 text-center">
                No recent tutoring sessions.
              </div>
            ) : (
              chatSessions.map((s) => {
                const isActive = s.sessionId === sessionId
                return (
                  <div
                    key={s.sessionId}
                    onClick={() => void loadSession(s.sessionId)}
                    className={`group flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 min-h-[40px] ${
                      isActive
                        ? 'bg-[#00bcd4]/10 text-[#00bcd4]'
                        : 'text-white/70 hover:bg-[#1f3552] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#00bcd4]' : 'text-white/40'}`} />
                      <span className="truncate flex-1">{s.title || 'Tutoring Session'}</span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[10px] text-white/30 group-hover:text-white/50">
                        {formatSessionDate(s.updatedAt || s.createdAt)}
                      </span>
                      <button
                        onClick={(e) => void deleteSession(s.sessionId, e)}
                        className="p-1 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
          <div className="border-t border-white/5 pt-3 mt-1">
            <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1f3552] transition cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-[#00bcd4] text-[#0a1a2e] flex items-center justify-center font-bold text-xs flex-shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{userName}</div>
                <div className="text-[11px] text-white/40 truncate">{userEmail}</div>
              </div>
              <MoreVertical className="w-4 h-4 text-white/40 flex-shrink-0" />
            </div>
          </div>
        </aside>

        {/* ===== MAIN CHAT ===== */}
        <main className="flex-1 flex flex-col h-full bg-[#0f2340] relative min-w-0">

          {/* Chat Header */}
          <header className="sticky top-0 z-20 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] border-b border-white/5 flex items-center justify-between flex-shrink-0 min-h-[56px] bg-[#0f2340]/95 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <a
                href="/dashboard/student"
                className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs sm:text-sm px-2.5 py-1.5 rounded-lg hover:bg-[#1f3552] transition font-medium text-decoration-none"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </a>

              <div className="text-sm font-semibold text-white flex items-center gap-2 whitespace-nowrap">
                <span>AI Tutor</span>
                <span className="text-[11px] font-normal text-white/40 hidden sm:flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Online
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 text-white/70 hover:text-white rounded-lg hover:bg-[#1f3552] transition"
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-36 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
            
            {/* AI Welcome State */}
            {messages.length === 0 && (
              <div className="flex gap-3 max-w-[88%] sm:max-w-[85%] self-start animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-[#00bcd4]/15 text-[#00bcd4] flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-sm leading-relaxed text-white/80">
                  <div className="font-semibold text-white/40 text-xs mb-1">AI Tutor</div>
                  <p className="mb-2">Hello! I&apos;m your AI tutor. I can help you with:</p>
                  <ul className="list-disc pl-5 mb-3 space-y-1 text-white/75">
                    <li>Understanding difficult concepts</li>
                    <li>Generating practice questions</li>
                    <li>Breaking down past exam questions</li>
                    <li>Creating study notes from your materials</li>
                  </ul>
                  <p>What would you like to learn today?</p>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              return (
                <div
                  key={i}
                  className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  } animate-fadeIn`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                      isUser
                        ? 'bg-white/10 text-white/70'
                        : 'bg-[#00bcd4]/15 text-[#00bcd4]'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Body */}
                  <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
                    {!isUser && (
                      <div className="text-[11px] font-semibold text-white/40 mb-1">AI Tutor</div>
                    )}

                    <div
                      className={`text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#1a2f4a] text-white px-4 py-2.5 rounded-2xl border border-white/5 inline-block text-left'
                          : 'text-white/85 bg-transparent p-0'
                      }`}
                    >
                      {isUser ? (
                        <div>
                          {msg.files && msg.files.length > 0 && (
                            <div className="mb-1 text-xs text-[#00bcd4] font-medium flex items-center gap-1.5">
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>Uploaded: {msg.files.join(', ')}</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ) : (
                        <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-p:mb-2.5 prose-strong:text-white prose-ul:my-2 prose-li:my-0.5">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                              code: ({ children, ...props }: any) => (
                                <div className="bg-[#1a2f4a] border border-white/5 rounded-lg p-3 my-2 font-mono text-xs text-white/80 overflow-x-auto whitespace-pre-wrap">
                                  {children}
                                </div>
                              ),
                              blockquote: ({ children }) => (
                                <div className="bg-[#00bcd4]/5 border-l-4 border-[#00bcd4] px-3.5 py-2.5 rounded-r-lg my-2 text-white/90">
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
                          className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white bg-white/[0.02] hover:bg-[#1f3552] px-2 py-1 rounded transition"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Helpful</span>
                        </button>
                        <button
                          onClick={() => toast('Thanks for your feedback! We will work to improve.', { icon: '👍' })}
                          className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white bg-white/[0.02] hover:bg-[#1f3552] px-2 py-1 rounded transition"
                        >
                          <ThumbsDown className="w-3 h-3" />
                          <span>Not helpful</span>
                        </button>
                        <button
                          onClick={() => handleCopy(msg.content, i)}
                          className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white bg-white/[0.02] hover:bg-[#1f3552] px-2 py-1 rounded transition"
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
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
              <div className="flex gap-3 items-center self-start text-[#00bcd4]">
                <div className="w-8 h-8 rounded-full bg-[#00bcd4]/15 flex items-center justify-center text-xs flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex gap-1 items-center px-2 py-1.5">
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-[typingBounce_1.4s_infinite]" />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-[typingBounce_1.4s_infinite_0.2s]" />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-[typingBounce_1.4s_infinite_0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Fixed Input Bar - anchored to bottom, out of document flow */}
          <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#0f2340]/95 backdrop-blur-md border-t border-white/5 pb-[env(safe-area-inset-bottom)]">

            {/* File status tag */}
            {uploadedFiles.length > 0 && (
              <div className="flex items-center justify-between px-3 py-1.5 mt-2 mx-3 bg-[#1a2f4a] border border-[#00bcd4]/30 rounded-lg text-xs text-[#00bcd4]">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate font-medium">
                    {uploadedFiles.map(f => f.name).join(', ')}
                  </span>
                </div>
                <button
                  onClick={removeFiles}
                  className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition"
                  title="Remove context"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="max-w-4xl mx-auto px-3 pt-2 pb-1">
              {/* Input Wrapper */}
              <div className="flex items-center gap-2 bg-[#1a2f4a] border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-[#00bcd4] transition duration-200">

                {/* Upload Plus Button */}
                <label
                  className="p-2 text-white/40 hover:text-[#00bcd4] hover:bg-[#00bcd4]/10 rounded-lg cursor-pointer transition flex-shrink-0"
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
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 text-sm py-2 resize-none min-h-[24px] max-h-[120px] leading-relaxed"
                />

                {/* Send Button */}
                <button
                  onClick={() => void sendMessage()}
                  disabled={loading || extracting || (!input.trim() && uploadedFiles.length === 0)}
                  className="w-9 h-9 bg-[#00bcd4] hover:bg-[#0097a7] disabled:opacity-30 disabled:hover:bg-[#00bcd4] text-[#0a1a2e] rounded-lg font-bold flex items-center justify-center transition flex-shrink-0"
                  aria-label="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[3]" />
                </button>
              </div>

              {/* Suggestion Chips — horizontal scroll, no wrapping = fixed height */}
              <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                <button
                  onClick={() => void sendMessage("Generate quiz on this topic")}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white bg-[#1a2f4a] hover:bg-[#1f3552] border border-white/5 hover:border-[#00bcd4]/50 px-3 py-1 rounded-full transition duration-200 whitespace-nowrap flex-shrink-0"
                >
                  <Zap className="w-3 h-3 text-[#00bcd4]" />
                  <span>Generate quiz</span>
                </button>
                <button
                  onClick={() => void sendMessage("Explain concept simply with real-life examples")}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white bg-[#1a2f4a] hover:bg-[#1f3552] border border-white/5 hover:border-[#00bcd4]/50 px-3 py-1 rounded-full transition duration-200 whitespace-nowrap flex-shrink-0"
                >
                  <Lightbulb className="w-3 h-3 text-[#00bcd4]" />
                  <span>Explain concept</span>
                </button>
                <button
                  onClick={() => void sendMessage("Summarize study notes into bullet points")}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white bg-[#1a2f4a] hover:bg-[#1f3552] border border-white/5 hover:border-[#00bcd4]/50 px-3 py-1 rounded-full transition duration-200 whitespace-nowrap flex-shrink-0"
                >
                  <FileText className="w-3 h-3 text-[#00bcd4]" />
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
