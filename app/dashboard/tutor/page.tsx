'use client'

import { useState, useEffect, useRef } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { getFirebaseToken } from '@/lib/store/authStore'
import { Clock, Send, Trash2 } from 'lucide-react'

const SAVE_DEBOUNCE = 3000 // save 3 seconds after last message

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

  // Load most recent chat on mount
  useEffect(() => {
    loadMostRecentChat()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-save chat after every new message (debounced)
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

  const getToken = async () => {
    const token = await getFirebaseToken()
    return token
  }

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

  const startNewChat = () => {
    void saveCurrentChat()
    setMessages([])
    setSessionId(null)
    setSubject('')
    setInput('')
  }

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

  return (
    <ProtectedRoute>
      <div className="tutor-layout">
        {/* Sidebar — Chat History */}
        <div className={`tutor-sidebar ${showHistory ? 'open' : ''}`}>
          <div className="tutor-sidebar-header">
            <h3>Chat History</h3>
            <button className="new-chat-btn" onClick={startNewChat}>
              + New Chat
            </button>
          </div>

          {historyLoading ? (
            <div className="history-loading">Loading...</div>
          ) : chatSessions.length === 0 ? (
            <div className="history-empty">No previous chats</div>
          ) : (
            <div className="history-list">
              {chatSessions.map((s) => (
                <div
                  key={s.sessionId}
                  className={`history-item ${s.sessionId === sessionId ? 'active' : ''}`}
                  onClick={() => void loadSession(s.sessionId)}
                >
                  <div className="history-item-content">
                    <span className="history-title">{s.title}</span>
                    {s.subject && <span className="history-subject">{s.subject}</span>}
                    <span className="history-meta">
                      {s.messageCount} messages • {getTimeAgo(s.updatedAt)}
                    </span>
                    <span className="history-preview">{s.lastMessage}</span>
                  </div>
                  <button
                    className="history-delete-btn"
                    onClick={(e) => void deleteSession(s.sessionId, e)}
                    title="Delete chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="tutor-main">
          <div className="px-4 pt-4 flex items-center gap-3">
            <BackButton label="Dashboard" href="/dashboard/student" />
            <span className="text-xs text-gray-400">/ AI Tutor</span>
          </div>

          {/* Chat Header */}
          <div className="tutor-header">
            <button
              className="history-toggle-btn"
              onClick={() => {
                const next = !showHistory
                setShowHistory(next)
                if (!next) return
                void fetchHistory()
              }}
            >
              <Clock size={16} />
              History
            </button>
            <div className="tutor-header-center">
              <span className="tutor-title">AI Tutor</span>
              {messages.length > 0 && (
                <span className="auto-save-indicator">💾 Auto-saved</span>
              )}
            </div>
            <button className="new-chat-header-btn" onClick={startNewChat}>
              + New
            </button>
          </div>

          {/* Messages */}
          <div className="tutor-messages">
            {messages.length === 0 ? (
              <div className="tutor-empty">
                <div className="tutor-empty-icon">🤖</div>
                <h3>Ask me anything</h3>
                <p>
                  I can help you understand any topic, explain answers, or quiz you on any
                  subject.
                </p>
                <div className="starter-prompts">
                  {[
                    'Explain the water cycle',
                    'Help me with quadratic equations',
                    'What caused World War 1?',
                    'Quiz me on Biology',
                  ].map((p) => (
                    <button
                      key={p}
                      className="starter-prompt-btn"
                      onClick={() => {
                        setInput(p)
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`message-bubble ${msg.role}`}>
                  <div className="message-content">{msg.content}</div>
                  <span className="message-time">
                    {new Date(msg.timestamp || new Date()).toLocaleTimeString('en-NG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
            {loading && (
              <div className="message-bubble assistant">
                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="tutor-input-area">
            <div className="tutor-input-row">
              <input
                className="tutor-input"
                placeholder="Ask anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void sendMessage()}
              />
              <button
                className="tutor-send-btn"
                onClick={() => void sendMessage()}
                disabled={loading || !input.trim()}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="tutor-hint">Press Enter to send</p>
          </div>
        </div>

        {/* Overlay for mobile history */}
        {showHistory && (
          <div className="sidebar-overlay" onClick={() => setShowHistory(false)} />
        )}
      </div>
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

