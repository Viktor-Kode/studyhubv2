'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Send } from 'lucide-react'
import QuickReplies from './QuickReplies'
import MessageBubble from './MessageBubble'
import { deepseekAsk } from '@/lib/services/deepseek'

const FIXED_ANSWERS = {
  'how do i take a cbt test':
    'To take a CBT test, go to your **CBT** dashboard, select your exam type (JAMB/WAEC/NECO/etc.), choose the subject, then start the exam.\n\nDuring the test, use the question navigator to move between questions and submit when finished.',
  'how does the ai tutor work':
    'The **AI Tutor** helps you understand concepts and topics. Open the tutor from the dashboard and type your question in the input, then send to get an answer.\n\nTip: include your subject name for better results.',
  'how do i upload to my library':
    'To upload to your **Library**, open the Library page and click **Upload PDF** (or **Add Material**). Choose a PDF file, fill in the details, then publish/upload.\n\nAfter uploading, your file will appear in the bookshelf.',
  'how do i upgrade my plan':
    'To upgrade your **plan**, go to the Pricing page from your dashboard and select the option you want. Complete the payment flow, then refresh or return to the dashboard to unlock features.',
  'what is the community':
    'The **Community** is where learners and teachers share posts and ask questions. You can create discussions, vote on polls, and earn points for helpful activity.',
  'what is study mode':
    '**Study Mode** is the learning-focused CBT mode where you get one question at a time with feedback.\n\nIt helps you understand and practice before you take a timed exam.',
  'how do i earn points':
    'You earn points by participating in **Community** activities and completing learning tasks. The more you contribute (posting, answering, and helping others), the higher your points.',
  'how do i reset my password':
    'To reset your password, go to the login page and choose **Forgot Password**. Follow the prompts to verify your account and set a new password.',
}

function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function tryFixedAnswer(userText) {
  const norm = normalizeText(userText)
  if (!norm) return null

  // Exact match first
  if (Object.prototype.hasOwnProperty.call(FIXED_ANSWERS, norm)) return FIXED_ANSWERS[norm]

  // Fallback: allow "how do I take a cbt test?" style messages
  for (const key of Object.keys(FIXED_ANSWERS)) {
    if (norm === key) return FIXED_ANSWERS[key]
    if (norm.includes(key)) return FIXED_ANSWERS[key]
  }

  return null
}

function inferQuickReplies(lastUserText) {
  const t = normalizeText(lastUserText)

  if (t.includes('cbt') || t.includes('study mode') || t.includes('exam') || t.includes('test')) {
    return ['Study Mode', 'Subjects', 'Scoring']
  }
  if (t.includes('library') || t.includes('upload') || t.includes('pdf') || t.includes('material')) {
    return ['Upload PDF', 'Manage Folders', 'Library Search']
  }
  if (t.includes('upgrade') || t.includes('plan') || t.includes('payment')) {
    return ['Plans', 'Payment Success', 'Change Plan']
  }
  if (t.includes('community') || t.includes('points') || t.includes('leaderboard')) {
    return ['Community', 'Earning Points', 'Leaderboard']
  }
  if (t.includes('password') || t.includes('reset')) {
    return ['Reset Password', 'Login Help', 'Security Tips']
  }

  return ['How does the AI Tutor work', 'What is Study Mode', 'How do I upgrade my plan']
}

const INITIAL_REPLIES = [
  'How do I take a CBT test',
  'How does the AI Tutor work',
  'How do I upload to my library',
  'How do I upgrade my plan',
  'What is the community',
  'What is Study Mode',
  'How do I earn points',
  'How do I reset my password',
]

const SYSTEM_PROMPT = `You are the StudyHelp onboarding assistant. Answer ONLY questions about how to navigate or use StudyHelp (dashboards, CBT/Study Mode, Community, Library, pricing, authentication, and features). Keep answers short and practical (max 3 sentences). Use **bold** for feature names.

If the user asks something unrelated (like learning topics or general knowledge), politely redirect them to the **AI Tutor** instead of answering the topic.`

export default function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [quickReplies, setQuickReplies] = useState(INITIAL_REPLIES)
  const [showBounce, setShowBounce] = useState(false)

  const messagesEndRef = useRef(null)

  useEffect(() => {
    // Welcome message
    if (messages.length === 0) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'bot',
          content: "Hi! 👋 I'm your StudyHelp guide. How can I help you?",
        },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Slight bounce on first load for attention.
    setShowBounce(true)
    const t = window.setTimeout(() => setShowBounce(false), 1600)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen, isTyping])

  const send = async (text) => {
    const content = (text || '').trim()
    if (!content) return
    if (isTyping) return

    const userMessage = { id: `u-${Date.now()}`, role: 'user', content }
    const nextMessages = [...messages, userMessage]
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const fixed = tryFixedAnswer(content)
      let botText = ''

      if (fixed) {
        botText = fixed
      } else {
        const chatHistory = nextMessages
          .filter((m) => m.role === 'user' || m.role === 'bot')
          .slice(-6)
          .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }))

        botText = await deepseekAsk({
          message: content,
          systemPrompt: SYSTEM_PROMPT,
          chatHistory,
        })
      }

      const botMessage = { id: `b-${Date.now()}`, role: 'bot', content: botText || 'Sorry, I could not respond right now.' }
      setMessages((prev) => [...prev, botMessage])

      setQuickReplies(inferQuickReplies(content))
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'bot',
          content: 'Sorry, something went wrong. Please try again in a moment.',
        },
      ])
      setQuickReplies(INITIAL_REPLIES.slice(0, 3))
    } finally {
      setIsTyping(false)
    }
  }

  const isDisabled = isTyping || !input.trim()

  const typingDots = (
    <div className="mb-3 flex justify-start">
      <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-900 border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
          <span className="h-2.5 w-2.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
          <span className="h-2.5 w-2.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          aria-label="Open help chat"
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-[1250] flex h-14 w-14 items-center justify-center rounded-full bg-[#5B4CF5] text-white shadow-xl hover:bg-[#4F3FE5] transition select-none ${
            showBounce ? 'animate-bounce' : ''
          }`}
        >
          <span className="text-2xl leading-none">💬</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[1250]">
          <div className="mb-3 w-[340px] h-[480px] overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-100 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 bg-[#5B4CF5] text-white">
              <div className="flex items-center gap-2 font-bold">
                <span>🤖</span>
                <span>StudyHelp Help</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10 transition"
                aria-label="Close help chat"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
              {messages.map((m) => (
                <MessageBubble key={m.id} role={m.role} content={m.content} />
              ))}
              {isTyping && typingDots}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-3 pb-3">
              <QuickReplies replies={quickReplies} onPick={(r) => void send(r)} />

              <div className="mt-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 flex items-end gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about StudyHelp... (e.g. How do I take a CBT test?)"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void send(input)
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => void send(input)}
                  className="mb-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#5B4CF5] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4F3FE5] transition"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="hidden"
              aria-hidden
            />
          </div>
        </div>
      )}
    </>
  )
}

