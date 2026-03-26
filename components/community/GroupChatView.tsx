'use client'

import ReactMarkdown from 'react-markdown'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  BookOpen,
  Bot,
  Copy,
  Crown,
  FileQuestion,
  FileText,
  Library,
  Loader2,
  Send,
  Settings,
  Timer,
  Trophy,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { studyGroupsApi, type GroupChatMessage, type StudyGroup, type StudyGroupMember } from '@/lib/api/studyGroupsApi'
import { initials } from '@/lib/community/utils'

const REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '👏', '💡']

type Props = {
  group: StudyGroup
  myUid: string
  member: boolean
  onBack: () => void
  showToast: (message: string) => void
  onGroupUpdated: (g: StudyGroup) => void
}

function systemIcon(content: string) {
  if (content.includes('left the group')) return <UserMinus className="h-3.5 w-3.5 shrink-0" />
  return <UserPlus className="h-3.5 w-3.5 shrink-0" />
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function GroupChatView({ group: initialGroup, myUid, member, onBack, showToast, onGroupUpdated }: Props) {
  const [group, setGroup] = useState(initialGroup)
  const [messages, setMessages] = useState<GroupChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadOlderBusy, setLoadOlderBusy] = useState(false)
  const [hasOlder, setHasOlder] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [aiMode, setAiMode] = useState(false)
  const [replyTo, setReplyTo] = useState<GroupChatMessage | null>(null)
  const [membersOpen, setMembersOpen] = useState(false)
  const [ctx, setCtx] = useState<{ x: number; y: number; msg: GroupChatMessage } | null>(null)
  const [emojiFor, setEmojiFor] = useState<GroupChatMessage | null>(null)
  const [pendingBelow, setPendingBelow] = useState(false)
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 })
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const [leaveBusy, setLeaveBusy] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const sinceRef = useRef<string>(new Date().toISOString())
  const idsRef = useRef<Set<string>>(new Set())
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stickBottomRef = useRef(true)

  const gid = group._id

  const refreshGroup = useCallback(async () => {
    try {
      const res = await studyGroupsApi.getOne(gid)
      const g = res.data as StudyGroup
      setGroup(g)
      onGroupUpdated(g)
    } catch {
      /* ignore */
    }
  }, [gid, onGroupUpdated])

  useEffect(() => {
    setGroup(initialGroup)
  }, [initialGroup])

  const loadInitial = useCallback(async () => {
    if (!member) {
      setLoading(false)
      setMessages([])
      return
    }
    try {
      setLoading(true)
      const res = await studyGroupsApi.getMessages(gid, { limit: 50 })
      const list = Array.isArray(res.data) ? res.data : []
      setMessages(list)
      idsRef.current = new Set(list.map((m) => m._id))
      const last = list[list.length - 1]
      sinceRef.current = last?.createdAt || new Date().toISOString()
      setHasOlder(list.length >= 50)
      stickBottomRef.current = true
      setPendingBelow(false)
    } catch {
      showToast('Could not load messages')
    } finally {
      setLoading(false)
    }
  }, [gid, member, showToast])

  useEffect(() => {
    void loadInitial()
  }, [loadInitial])

  useEffect(() => {
    if (!member) return
    const t = window.setInterval(() => void refreshGroup(), 15000)
    return () => window.clearInterval(t)
  }, [member, refreshGroup])

  const atBottom = () => {
    const el = scrollRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      stickBottomRef.current = atBottom()
      if (stickBottomRef.current) setPendingBelow(false)
    }
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!stickBottomRef.current || !scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!member || loading) return
    const poll = async () => {
      try {
        const res = await studyGroupsApi.getUpdates(gid, { since: sinceRef.current })
        const data = res.data
        const incoming = data?.newMessages || []
        const ts = data?.timestamp || new Date().toISOString()
        if (incoming.length) {
          const fresh = incoming.filter((m) => !idsRef.current.has(m._id))
          if (fresh.length) {
            fresh.forEach((m) => idsRef.current.add(m._id))
            setMessages((prev) => {
              const merged = [...prev, ...fresh].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
              )
              return merged
            })
            if (!stickBottomRef.current) setPendingBelow(true)
            void refreshGroup()
          }
        }
        sinceRef.current = ts
      } catch {
        /* silent */
      }
    }
    const id = window.setInterval(poll, 8000)
    void poll()
    return () => window.clearInterval(id)
  }, [gid, member, loading, refreshGroup])

  useEffect(() => {
    const close = () => {
      setCtx(null)
      setEmojiFor(null)
    }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const loadOlder = async () => {
    if (!messages.length || loadOlderBusy) return
    const first = messages[0]
    setLoadOlderBusy(true)
    const el = scrollRef.current
    const prevH = el?.scrollHeight || 0
    try {
      const res = await studyGroupsApi.getMessages(gid, { before: first.createdAt, limit: 50 })
      const older = Array.isArray(res.data) ? res.data : []
      older.forEach((m) => idsRef.current.add(m._id))
      setMessages((prev) => {
        const merged = [...older, ...prev].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        return merged
      })
      setHasOlder(older.length >= 50)
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevH
      })
    } catch {
      showToast('Could not load older messages')
    } finally {
      setLoadOlderBusy(false)
    }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    try {
      if (aiMode) {
        await studyGroupsApi.askAi(gid, { question: text, subject: group.subject })
        setInput('')
        setAiMode(false)
        setReplyTo(null)
        const res = await studyGroupsApi.getMessages(gid, { limit: 80 })
        const list = Array.isArray(res.data) ? res.data : []
        setMessages(list)
        idsRef.current = new Set(list.map((m) => m._id))
        sinceRef.current = list[list.length - 1]?.createdAt || sinceRef.current
        stickBottomRef.current = true
        void refreshGroup()
        showToast('AI response added to chat')
      } else {
        const body: { content: string; replyTo?: { messageId: string; authorName: string; preview: string } } = {
          content: text,
        }
        if (replyTo) {
          body.replyTo = {
            messageId: replyTo._id,
            authorName: replyTo.authorName,
            preview: (replyTo.content || '').slice(0, 60),
          }
        }
        const res = await studyGroupsApi.sendMessage(gid, body)
        const msg = res.data as GroupChatMessage
        if (msg && !idsRef.current.has(msg._id)) {
          idsRef.current.add(msg._id)
          setMessages((prev) => [...prev, msg])
        }
        setInput('')
        setReplyTo(null)
        sinceRef.current = msg?.createdAt || sinceRef.current
        stickBottomRef.current = true
        void refreshGroup()
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      showToast(msg || 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const toggleReaction = async (msg: GroupChatMessage, emoji: string) => {
    try {
      const res = await studyGroupsApi.toggleReaction(gid, msg._id, emoji)
      const updated = res.data as GroupChatMessage
      setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)))
      setEmojiFor(null)
      setCtx(null)
    } catch {
      showToast('Could not update reaction')
    }
  }

  const joinGroup = async () => {
    try {
      const res = await studyGroupsApi.join({ groupId: gid })
      const g = res.data as StudyGroup
      setGroup(g)
      onGroupUpdated(g)
      showToast('Joined group')
      void loadInitial()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      showToast(msg || 'Could not join')
    }
  }

  const confirmLeaveGroup = async () => {
    setLeaveBusy(true)
    try {
      await studyGroupsApi.leave(gid)
      setLeaveConfirmOpen(false)
      showToast('Left group')
      onBack()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      showToast(msg || 'Could not leave')
    } finally {
      setLeaveBusy(false)
    }
  }

  const copyCode = async () => {
    if (!group.joinCode) return
    try {
      await navigator.clipboard.writeText(group.joinCode)
      showToast('Code copied')
    } catch {
      showToast('Could not copy')
    }
  }

  const openMenu = (e: React.MouseEvent, msg: GroupChatMessage) => {
    e.preventDefault()
    e.stopPropagation()
    setPickerPos({ x: e.clientX, y: e.clientY })
    setCtx({ x: e.clientX, y: e.clientY, msg })
    setEmojiFor(null)
  }

  const onMsgContextMenu = (e: React.MouseEvent, msg: GroupChatMessage) => {
    if (msg.type !== 'text') return
    e.preventDefault()
    openMenu(e, msg)
  }

  const startLongPress = (msg: GroupChatMessage) => {
    longPressRef.current = setTimeout(() => {
      if (msg.type === 'text') {
        setCtx({ x: window.innerWidth / 2, y: 120, msg })
      }
    }, 550)
  }
  const endLongPress = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current)
    longPressRef.current = null
  }

  const sortedMembers: StudyGroupMember[] = [...(group.members || [])].sort(
    (a, b) => (b.points ?? 0) - (a.points ?? 0),
  )

  const renderMessageRow = (msg: GroupChatMessage, idx: number) => {
    const prev = messages[idx - 1]
    const showHeader =
      !prev ||
      prev.authorId !== msg.authorId ||
      prev.type !== msg.type ||
      msg.type === 'system' ||
      msg.type === 'ai'

    if (msg.type === 'system') {
      return (
        <div key={msg._id} className="group-msg system">
          <div className="group-msg-system-content">
            {systemIcon(msg.content)}
            <span>{msg.content}</span>
          </div>
        </div>
      )
    }

    if (msg.type === 'ai') {
      return (
        <div key={msg._id} className="group-msg other group-msg-ai max-w-[90%]">
          {showHeader && (
            <div className="group-msg-meta">
              <Bot className="h-3.5 w-3.5 text-violet-600" />
              {msg.authorName}
              <span>{formatTime(msg.createdAt)}</span>
            </div>
          )}
          <div className="group-msg-bubble prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
          {msg.reactions?.length ? (
            <div className="group-msg-reactions">
              {msg.reactions.map((r) => (
                <span key={r.emoji} className="group-msg-reaction-pill">
                  {r.emoji} {(r.users || []).length}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )
    }

    const own = msg.authorId === myUid
    return (
      <div
        key={msg._id}
        className={`group-msg ${own ? 'own' : 'other'}`}
        onContextMenu={(e) => onMsgContextMenu(e, msg)}
        onTouchStart={() => startLongPress(msg)}
        onTouchEnd={endLongPress}
        onTouchMove={endLongPress}
      >
        {showHeader && (
          <div className="group-msg-meta">
            {!own && <span className="font-medium text-slate-600 dark:text-slate-300">{msg.authorName}</span>}
            <span>{formatTime(msg.createdAt)}</span>
          </div>
        )}
        {msg.replyTo ? (
          <div className="mb-1 max-w-full rounded-lg border border-slate-200/80 bg-slate-100/80 px-2 py-1 text-left text-[11px] text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <span className="font-semibold">{msg.replyTo.authorName}</span>
            <span className="line-clamp-2 block opacity-90">{msg.replyTo.preview}</span>
          </div>
        ) : null}
        <div className="group-msg-bubble whitespace-pre-wrap break-words">{msg.content}</div>
        {msg.reactions?.length ? (
          <div className="group-msg-reactions justify-end">
            {msg.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                className="group-msg-reaction-pill"
                onClick={(e) => {
                  e.stopPropagation()
                  void toggleReaction(msg, r.emoji)
                }}
              >
                {r.emoji} {(r.users || []).length}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="group-chat-outer space-y-3">
      <div className="group-chat-wrap">
        <div className="group-chat-main">
          <div className="group-chat-header">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
              <span className="flex items-center gap-2 truncate font-bold text-slate-900 dark:text-white">
                <BookOpen className="h-4 w-4 shrink-0 text-indigo-600" />
                <span className="truncate">{group.name}</span>
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Users className="h-3.5 w-3.5" />
                {group.membersCount ?? group.members?.length ?? 0} members
              </span>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Settings"
              title="Coming soon"
              disabled
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 lg:hidden"
              aria-label="Members and leaderboard"
              onClick={() => setMembersOpen(true)}
            >
              <Users className="h-5 w-5" />
            </button>
          </div>

          <div className="group-chat-messages relative" ref={scrollRef}>
            {member && hasOlder && (
              <div className="mb-3 flex justify-center">
                <button
                  type="button"
                  disabled={loadOlderBusy}
                  onClick={() => void loadOlder()}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm dark:border-slate-600 dark:bg-slate-900"
                >
                  {loadOlderBusy ? 'Loading…' : 'Load older messages'}
                </button>
              </div>
            )}

            {!member ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12 text-center">
                <p className="max-w-sm text-sm text-slate-600 dark:text-slate-300">
                  Join this group to view and send messages{group.visibility === 'private' ? '.' : ' (public group).'}
                </p>
                <button
                  type="button"
                  onClick={() => void joinGroup()}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Join group
                </button>
              </div>
            ) : loading ? (
              <div className="flex flex-1 items-center justify-center gap-2 py-12 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading chat…
              </div>
            ) : (
              messages.map((m, i) => renderMessageRow(m, i))
            )}

            {pendingBelow && (
              <button
                type="button"
                className="group-new-msgs-btn"
                onClick={() => {
                  stickBottomRef.current = true
                  setPendingBelow(false)
                  if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <ArrowDown className="h-4 w-4" />
                  New messages
                </span>
              </button>
            )}
          </div>

          {member && (
            <div className="group-chat-input-bar">
              <button
                type="button"
                onClick={() => setAiMode((v) => !v)}
                className={`rounded-xl p-2.5 ${aiMode ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                aria-label={aiMode ? 'Switch to normal message' : 'Ask group AI'}
                title="Group AI tutor"
              >
                <Bot className="h-5 w-5" />
              </button>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {replyTo && (
                  <div className="flex items-start justify-between gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                    <div className="min-w-0">
                      <span className="font-semibold text-indigo-600">Reply to {replyTo.authorName}</span>
                      <p className="line-clamp-2 text-slate-600 dark:text-slate-300">{replyTo.content}</p>
                    </div>
                    <button type="button" aria-label="Cancel reply" onClick={() => setReplyTo(null)} className="shrink-0 p-1">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void send()
                    }
                  }}
                  placeholder={aiMode ? 'Ask the group AI…' : 'Type a message…'}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <button
                type="button"
                disabled={sending || !input.trim()}
                onClick={() => void send()}
                className="rounded-xl bg-indigo-600 p-2.5 text-white disabled:opacity-50"
                aria-label="Send"
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
          )}
        </div>

        <aside className={`group-members-panel ${membersOpen ? 'open' : ''}`}>
          <div className="flex items-center justify-between lg:hidden">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Members</span>
            <button type="button" onClick={() => setMembersOpen(false)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Leaderboard</h3>
            <div className="space-y-1">
              {sortedMembers.map((m, rank) => {
                const isMe = m.userId === myUid
                const trophy =
                  rank === 0 ? (
                    <Trophy className="mx-auto h-4 w-4 text-amber-500" />
                  ) : rank === 1 ? (
                    <Trophy className="mx-auto h-4 w-4 text-slate-400" />
                  ) : rank === 2 ? (
                    <Trophy className="mx-auto h-4 w-4 text-amber-700" />
                  ) : (
                    <span className="group-leaderboard-rank">{rank + 1}</span>
                  )
                return (
                  <div key={m.userId} className={`group-leaderboard-item ${isMe ? 'me' : ''}`}>
                    <div className="group-leaderboard-rank-icon">{trophy}</div>
                    <span className="group-leaderboard-name truncate">
                      {m.name}
                      {m.role === 'admin' ? <Crown className="ml-1 inline h-3.5 w-3.5 text-amber-500" /> : null}
                    </span>
                    <span className="group-leaderboard-points shrink-0">{m.points ?? 0} pts</span>
                  </div>
                )
              })}
            </div>
          </div>

          {member && group.joinCode && (
            <div className="group-join-code">
              <p className="mb-1 text-xs font-semibold text-slate-500">Join code</p>
              <div className="group-join-code-value text-lg">
                {group.joinCode}
                <button type="button" className="copy-btn" onClick={() => void copyCode()} aria-label="Copy join code">
                  <Copy className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {member && (
            <button
              type="button"
              onClick={() => setLeaveConfirmOpen(true)}
              className="w-full rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
            >
              Leave group
            </button>
          )}

          <div className="group-coming-soon">
            <button type="button" disabled>
              <FileText className="h-4 w-4" />
              Shared notes — Coming soon
            </button>
            <button type="button" disabled>
              <Library className="h-4 w-4" />
              Shared library — Coming soon
            </button>
            <button type="button" disabled>
              <FileQuestion className="h-4 w-4" />
              Group CBT — Coming soon
            </button>
            <button type="button" disabled>
              <Timer className="h-4 w-4" />
              Pomodoro timer — Coming soon
            </button>
          </div>
        </aside>
      </div>

      {ctx && (
        <div
          className="group-msg-ctx-menu"
          style={{ left: Math.min(ctx.x, typeof window !== 'undefined' ? window.innerWidth - 160 : ctx.x), top: ctx.y }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setReplyTo(ctx.msg)
              setCtx(null)
            }}
          >
            Reply
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setPickerPos({ x: ctx.x, y: ctx.y })
              setEmojiFor(ctx.msg)
              setCtx(null)
            }}
          >
            React
          </button>
        </div>
      )}

      {emojiFor && (
        <div
          className="group-msg-ctx-menu"
          style={{
            left: Math.min(pickerPos.x, typeof window !== 'undefined' ? window.innerWidth - 200 : pickerPos.x),
            top: pickerPos.y + 8,
          }}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="group-emoji-picker">
            {REACTION_EMOJIS.map((em) => (
              <button key={em} type="button" className="text-xl" onClick={() => void toggleReaction(emojiFor, em)}>
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {leaveConfirmOpen && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-group-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLeaveConfirmOpen(false)
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 id="leave-group-title" className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <UserMinus className="h-5 w-5 text-red-500" aria-hidden />
              Leave group?
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
              You will stop seeing messages and the leaderboard for <span className="font-semibold">{group.name}</span>.
              If you are the last member, the group will be deleted.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={leaveBusy}
                onClick={() => void confirmLeaveGroup()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
              >
                {leaveBusy ? 'Leaving…' : 'Leave group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
