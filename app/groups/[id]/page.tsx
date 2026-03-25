'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/lib/store/authStore'
import { groupsApi, type GroupChatMessage, type GroupComment, type GroupPost, type GroupResource, type GroupStudySession, type GroupTodo } from '@/lib/api/groupsApi'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/useToast'
import { Calendar, Check, Clock, FileText, MessageSquare, Plus, RefreshCcw, Trash2, Users, Upload } from 'lucide-react'

type Tab = 'feed' | 'chat' | 'resources' | 'members' | 'study'

function privacyBadge(isPrivate: boolean) {
  return isPrivate ? { label: 'Private', variant: 'outline' as const } : { label: 'Public', variant: 'secondary' as const }
}

function initials(name: string) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatPomodoro(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function GroupPage() {
  const params = useParams<{ id: string }>()
  const groupId = params?.id || ''
  const router = useRouter()
  const { toast, showToast } = useToast(2500)
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<Tab>('feed')

  const myUid = user?.uid || ''
  const myRole = group?.myRole as 'admin' | 'moderator' | 'member' | undefined
  const canManage = myRole === 'admin' || myRole === 'moderator'
  const canAdmin = myRole === 'admin'

  // Feed
  const [postsLoading, setPostsLoading] = useState(false)
  const [posts, setPosts] = useState<GroupPost[]>([])
  const [postDraft, setPostDraft] = useState('')
  const [postType, setPostType] = useState<GroupPost['type']>('post')
  const [commentsOpen, setCommentsOpen] = useState<Record<string, boolean>>({})
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({})
  const [commentsByPost, setCommentsByPost] = useState<Record<string, GroupComment[]>>({})

  // Chat
  const [chatLoading, setChatLoading] = useState(false)
  const [messages, setMessages] = useState<GroupChatMessage[]>([])
  const [chatDraft, setChatDraft] = useState('')

  // Resources
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [resources, setResources] = useState<GroupResource[]>([])
  const [resourceType, setResourceType] = useState<'file' | 'link'>('link')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceDesc, setResourceDesc] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [resourceFile, setResourceFile] = useState<File | null>(null)

  // Members
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [addMemberId, setAddMemberId] = useState('')

  // Study Tools: Pomodoro (local) + sessions + todos
  const [todos, setTodos] = useState<GroupTodo[]>([])
  const [sessions, setSessions] = useState<GroupStudySession[]>([])

  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [pomodoroPaused, setPomodoroPaused] = useState(false)
  const [pomodoroSecsLeft, setPomodoroSecsLeft] = useState(25 * 60)
  const pomodoroTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [todoTitle, setTodoTitle] = useState('')
  const [todoDesc, setTodoDesc] = useState('')
  const [todoAssignedTo, setTodoAssignedTo] = useState('')
  const [todoDueDate, setTodoDueDate] = useState('')

  // Edit drafts for assigning/updating existing todos
  const [todoAssignedDraftById, setTodoAssignedDraftById] = useState<Record<string, string>>({})
  const [todoDueDraftById, setTodoDueDraftById] = useState<Record<string, string>>({})

  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionStartTime, setSessionStartTime] = useState('')
  const [sessionEndTime, setSessionEndTime] = useState('')
  const [sessionMeetingLink, setSessionMeetingLink] = useState('')

  const pb = useMemo(() => privacyBadge(!!group?.isPrivate), [group?.isPrivate])

  const fetchGroup = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    try {
      const res = await groupsApi.getGroup(groupId)
      setGroup(res.data?.group)
    } catch (e: any) {
      showToast(e?.message || 'Failed to load group')
    } finally {
      setLoading(false)
    }
  }, [groupId, showToast])

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true)
    try {
      const res = await groupsApi.getPosts(groupId, { page: 1, limit: 30, sort: 'newest' })
      setPosts((res.data?.posts as GroupPost[]) || [])
    } catch (e: any) {
      showToast(e?.message || 'Failed to load posts')
    } finally {
      setPostsLoading(false)
    }
  }, [groupId, showToast])

  const fetchChat = useCallback(async () => {
    setChatLoading(true)
    try {
      const res = await groupsApi.getChat(groupId, { page: 1, limit: 80 })
      setMessages((res.data?.messages as GroupChatMessage[]) || [])
    } catch (e: any) {
      showToast(e?.message || 'Failed to load chat')
    } finally {
      setChatLoading(false)
    }
  }, [groupId, showToast])

  const fetchResources = useCallback(async () => {
    setResourcesLoading(true)
    try {
      const res = await groupsApi.getResources(groupId)
      setResources((res.data?.resources as GroupResource[]) || [])
    } catch (e: any) {
      showToast(e?.message || 'Failed to load resources')
    } finally {
      setResourcesLoading(false)
    }
  }, [groupId, showToast])

  const fetchTodos = useCallback(async () => {
    try {
      const res = await groupsApi.getTodos(groupId)
      setTodos((res.data?.todos as GroupTodo[]) || [])
    } catch (e: any) {
      showToast(e?.message || 'Failed to load todos')
    }
  }, [groupId, showToast])

  const fetchSessions = useCallback(async () => {
    try {
      const res = await groupsApi.getSessions(groupId)
      setSessions((res.data?.sessions as GroupStudySession[]) || [])
    } catch (e: any) {
      showToast(e?.message || 'Failed to load sessions')
    }
  }, [groupId, showToast])

  useEffect(() => {
    if (!groupId) return
    void fetchGroup()
    void fetchPosts()
    void fetchChat()
    void fetchResources()
    void fetchTodos()
    void fetchSessions()
  }, [fetchChat, fetchGroup, fetchPosts, fetchResources, fetchSessions, fetchTodos, groupId])

  useEffect(() => {
    if (!pomodoroRunning || pomodoroPaused) return
    pomodoroTimerRef.current = setInterval(() => {
      setPomodoroSecsLeft((s) => Math.max(0, s - 1))
    }, 1000)

    return () => {
      if (pomodoroTimerRef.current) clearInterval(pomodoroTimerRef.current)
      pomodoroTimerRef.current = null
    }
  }, [pomodoroPaused, pomodoroRunning])

  useEffect(() => {
    if (!pomodoroRunning) return
    if (pomodoroSecsLeft > 0) return
    setPomodoroRunning(false)
    setPomodoroPaused(false)
    setPomodoroSecsLeft(25 * 60)
    showToast('Focus complete. Nice work!')
    void fetchSessions()
  }, [fetchSessions, pomodoroRunning, pomodoroSecsLeft, showToast])

  const activeSession = useMemo(() => {
    const now = Date.now()
    return (
      sessions.find((s) => {
        const start = new Date(s.startTime).getTime()
        const end = s.endTime ? new Date(s.endTime).getTime() : start + 25 * 60 * 1000
        return now >= start && now <= end
      }) || null
    )
  }, [sessions])

  const rootCommentsForPost = useCallback(
    (postId: string) => (commentsByPost[postId] || []).filter((c) => !c.parentId),
    [commentsByPost],
  )

  const loadComments = useCallback(
    async (postId: string) => {
      try {
        const res = await groupsApi.getComments(groupId, postId)
        setCommentsByPost((prev) => ({ ...prev, [postId]: (res.data?.comments as GroupComment[]) || [] }))
      } catch (e: any) {
        showToast(e?.message || 'Failed to load comments')
      }
    },
    [groupId, showToast],
  )

  const submitPost = useCallback(async () => {
    const content = postDraft.trim()
    if (!content) return
    try {
      const res = await groupsApi.createPost(groupId, { content, type: postType, subject: group?.subject || null })
      const created = res.data?.post as GroupPost | undefined
      setPostDraft('')
      if (created) showToast('Post published')
      await fetchPosts()
    } catch (e: any) {
      showToast(e?.message || 'Failed to create post')
    }
  }, [fetchPosts, group?.subject, groupId, postDraft, postType, showToast])

  const toggleLike = useCallback(
    async (post: GroupPost) => {
      try {
        const res = await groupsApi.likePost(groupId, post._id)
        setPosts((prev) =>
          prev.map((p) =>
            p._id !== post._id
              ? p
              : {
                  ...p,
                  isLiked: !!res.data?.liked,
                  likesCount: Number(res.data?.likesCount || 0),
                },
          ),
        )
      } catch (e: any) {
        showToast(e?.message || 'Failed to like')
      }
    },
    [groupId, showToast],
  )

  const submitComment = useCallback(
    async (post: GroupPost) => {
      const content = (commentDraftByPost[post._id] || '').trim()
      if (!content) return
      try {
        const res = await groupsApi.addComment(groupId, post._id, { content, parentId: null })
        const created = res.data?.comment as GroupComment | undefined
        if (created) {
          setCommentsByPost((prev) => ({ ...prev, [post._id]: [...(prev[post._id] || []), created] }))
          setCommentDraftByPost((prev) => ({ ...prev, [post._id]: '' }))
          await fetchPosts()
        }
      } catch (e: any) {
        showToast(e?.message || 'Failed to comment')
      }
    },
    [commentDraftByPost, fetchPosts, groupId, showToast],
  )

  const handleInvite = useCallback(async () => {
    try {
      const res = await groupsApi.generateInvite(groupId)
      setInviteCode(res.data?.inviteCode || null)
      setInviteLink(res.data?.inviteLink || null)
      setInviteOpen(true)
    } catch (e: any) {
      showToast(e?.message || 'Failed to generate invite')
    }
  }, [groupId, showToast])

  const handleInviteCopy = useCallback(async () => {
    if (!inviteCode) return
    await navigator.clipboard.writeText(inviteCode)
    showToast('Invite code copied')
  }, [inviteCode, showToast])

  const handleStartPomodoro = useCallback(async () => {
    if (pomodoroRunning) return
    setPomodoroRunning(true)
    setPomodoroPaused(false)
    setPomodoroSecsLeft(25 * 60)

    // Create a session so others can RSVP.
    try {
      const startIso = new Date().toISOString()
      const endIso = new Date(Date.now() + 25 * 60 * 1000).toISOString()
      await groupsApi.createSession(groupId, {
        title: 'Pomodoro Focus',
        startTime: startIso,
        endTime: endIso,
        meetingLink: null,
      })
      await fetchSessions()
    } catch {
      // Timer still runs even if the session creation fails.
    }
  }, [fetchSessions, groupId, pomodoroRunning])

  const handlePausePomodoro = useCallback(() => {
    if (!pomodoroRunning) return
    setPomodoroPaused(true)
    setPomodoroRunning(false)
  }, [pomodoroRunning])

  const handleResumePomodoro = useCallback(() => {
    if (!pomodoroPaused) return
    setPomodoroPaused(false)
    setPomodoroRunning(true)
  }, [pomodoroPaused])

  const handleResetPomodoro = useCallback(() => {
    setPomodoroRunning(false)
    setPomodoroPaused(false)
    setPomodoroSecsLeft(25 * 60)
  }, [])

  const handleScheduleSession = useCallback(async () => {
    if (!sessionTitle.trim()) return
    if (!sessionStartTime) return
    try {
      const startIso = new Date(sessionStartTime).toISOString()
      const endIso = sessionEndTime ? new Date(sessionEndTime).toISOString() : null
      await groupsApi.createSession(groupId, {
        title: sessionTitle.trim(),
        startTime: startIso,
        endTime: endIso,
        meetingLink: sessionMeetingLink.trim() || null,
      })
      setSessionTitle('')
      setSessionStartTime('')
      setSessionEndTime('')
      setSessionMeetingLink('')
      showToast('Session scheduled')
      await fetchSessions()
    } catch (e: any) {
      showToast(e?.message || 'Failed to schedule session')
    }
  }, [fetchSessions, groupId, sessionEndTime, sessionMeetingLink, sessionStartTime, sessionTitle, showToast])

  const handleRsvp = useCallback(
    async (session: GroupStudySession, attending: boolean) => {
      try {
        await groupsApi.rsvpSession(groupId, session._id, { attending })
        await fetchSessions()
      } catch (e: any) {
        showToast(e?.message || 'Failed to update RSVP')
      }
    },
    [fetchSessions, groupId, showToast],
  )

  const handleCreateTodo = useCallback(async () => {
    if (!todoTitle.trim()) return
    try {
      const dueIso = todoDueDate ? new Date(todoDueDate).toISOString() : null
      await groupsApi.createTodo(groupId, {
        title: todoTitle.trim(),
        description: todoDesc.trim(),
        assignedTo: todoAssignedTo.trim() || null,
        dueDate: dueIso,
      })
      setTodoTitle('')
      setTodoDesc('')
      setTodoAssignedTo('')
      setTodoDueDate('')
      showToast('To-do created')
      await fetchTodos()
    } catch (e: any) {
      showToast(e?.message || 'Failed to create to-do')
    }
  }, [fetchTodos, groupId, showToast, todoAssignedTo, todoDesc, todoDueDate, todoTitle])

  const handleToggleTodo = useCallback(
    async (todo: GroupTodo) => {
      try {
        await groupsApi.updateTodo(groupId, todo._id, { completed: !todo.completed })
        await fetchTodos()
      } catch (e: any) {
        showToast(e?.message || 'Failed to update to-do')
      }
    },
    [fetchTodos, groupId, showToast],
  )

  const handleSaveTodoMeta = useCallback(
    async (todo: GroupTodo) => {
      try {
        const assignedToRaw = todoAssignedDraftById[todo._id]
        const dueRaw = todoDueDraftById[todo._id]

        const assignedTo = assignedToRaw?.trim() ? assignedToRaw.trim() : null
        const dueDate = dueRaw ? new Date(dueRaw).toISOString() : null

        await groupsApi.updateTodo(groupId, todo._id, { assignedTo, dueDate })
        setTodoAssignedDraftById((prev) => {
          const next = { ...prev }
          delete next[todo._id]
          return next
        })
        setTodoDueDraftById((prev) => {
          const next = { ...prev }
          delete next[todo._id]
          return next
        })
        await fetchTodos()
        showToast('To-do updated')
      } catch (e: any) {
        showToast(e?.message || 'Failed to update to-do')
      }
    },
    [fetchTodos, groupId, showToast, todoAssignedDraftById, todoDueDraftById],
  )

  const handleUploadResource = useCallback(async () => {
    if (resourceType === 'link') {
      if (!resourceUrl.trim()) return
      await groupsApi.uploadResource(groupId, {
        type: 'link',
        url: resourceUrl.trim(),
        title: resourceTitle.trim() || undefined,
        description: resourceDesc.trim() || undefined,
      })
    } else {
      if (!resourceFile) return
      await groupsApi.uploadResource(groupId, {
        type: 'file',
        file: resourceFile,
        title: resourceTitle.trim() || undefined,
        description: resourceDesc.trim() || undefined,
      })
    }
  }, [groupId, resourceDesc, resourceFile, resourceTitle, resourceType, resourceUrl])

  const handleUpdateMemberRole = useCallback(
    async (userId: string, role: 'admin' | 'moderator' | 'member') => {
      try {
        await groupsApi.updateMemberRole(groupId, userId, { role })
        await fetchGroup()
        showToast('Member role updated')
      } catch (e: any) {
        showToast(e?.message || 'Failed to update role')
      }
    },
    [fetchGroup, groupId, showToast],
  )

  const handleRemoveMember = useCallback(
    async (userId: string) => {
      try {
        await groupsApi.removeGroupMember(groupId, userId)
        await fetchGroup()
        showToast('Member removed')
      } catch (e: any) {
        showToast(e?.message || 'Failed to remove member')
      }
    },
    [fetchGroup, groupId, showToast],
  )

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 dark:from-slate-950 dark:to-slate-900">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900">Loading group…</div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!group) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 dark:from-slate-950 dark:to-slate-900">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900">
            Group not found or you don't have access.
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 pb-16 pt-6 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-7xl space-y-4">
          <header className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => router.push('/groups')}
                  >
                    Back
                  </button>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{group.name}</h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{group.subject}</p>
                  </div>
                  <Badge variant={pb.variant}>{pb.label}</Badge>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {(group.membersCount ?? group.members?.length ?? 0)} members · last active{' '}
                    {group.lastActiveAt ? formatDistanceToNow(new Date(group.lastActiveAt), { addSuffix: true }) : '—'}
                  </div>
                </div>
              </div>

              {canAdmin ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => void handleInvite()}>
                    <Users className="h-4 w-4" /> Invite
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={async () => {
                      await groupsApi.deleteGroup(groupId)
                      router.push('/groups')
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              ) : null}
            </div>
          </header>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
            <TabsList className="w-full justify-start overflow-auto">
              <TabsTrigger value="feed" className="gap-2">
                <FileText className="h-4 w-4" /> Feed
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="h-4 w-4" /> Chat
              </TabsTrigger>
              <TabsTrigger value="resources" className="gap-2">
                <Upload className="h-4 w-4" /> Resources
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-2">
                <Users className="h-4 w-4" /> Members
              </TabsTrigger>
              <TabsTrigger value="study" className="gap-2">
                <Clock className="h-4 w-4" /> Study Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
              <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Create a post</h2>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Discuss topics with your group.</p>
                    </div>
                    <select
                      value={postType}
                      onChange={(e) => setPostType(e.target.value as any)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="post">Post</option>
                      <option value="question">Question</option>
                    </select>
                  </div>

                  <textarea
                    value={postDraft}
                    onChange={(e) => setPostDraft(e.target.value)}
                    placeholder="Share study insights…"
                    className="mt-3 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <div className="mt-3 flex justify-end">
                    <Button disabled={!postDraft.trim() || postsLoading} onClick={() => void submitPost()} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Publish
                    </Button>
                  </div>
                </section>

                <aside className="space-y-4">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Posts</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{postsLoading ? 'Loading…' : `${posts.length} total`}</p>
                  </section>
                </aside>
              </div>

              <div className="mt-4 space-y-4">
                {postsLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900">
                    Loading feed…
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900">
                    No posts yet. Be the first to share!
                  </div>
                ) : (
                  posts.map((post) => {
                    const isOpen = !!commentsOpen[post._id]
                    const roots = rootCommentsForPost(post._id)
                    return (
                      <article key={post._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-slate-100 text-xs font-bold text-slate-700 flex items-center justify-center dark:bg-slate-800 dark:text-slate-100">
                                {initials(post.authorName)}
                              </div>
                              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{post.authorName}</div>
                              {post.type === 'question' ? (
                                <Badge variant="outline" className="text-xs">
                                  Question
                                </Badge>
                              ) : null}
                            </div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : ''}
                            </div>
                          </div>

                          <Button variant="outline" size="sm" onClick={() => void toggleLike(post)} className="gap-2">
                            <Check className="h-4 w-4" />
                            {post.isLiked ? 'Liked' : 'Like'} ({post.likesCount})
                          </Button>
                        </div>

                        <div className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{post.content}</div>

                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              setCommentsOpen((prev) => ({ ...prev, [post._id]: !prev[post._id] }))
                              if (!isOpen) await loadComments(post._id)
                            }}
                          >
                            Comments ({post.commentsCount})
                          </Button>
                        </div>

                        {isOpen ? (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                            <textarea
                              value={commentDraftByPost[post._id] || ''}
                              onChange={(e) => setCommentDraftByPost((prev) => ({ ...prev, [post._id]: e.target.value }))}
                              className="w-full min-h-20 rounded-xl border border-slate-200 bg-white p-2 text-xs outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                              placeholder="Write a comment… Use @name to mention"
                            />
                            <div className="mt-2 flex justify-end">
                              <Button
                                size="sm"
                                disabled={!((commentDraftByPost[post._id] || '').trim())}
                                onClick={() => void submitComment(post)}
                              >
                                Comment
                              </Button>
                            </div>

                            <div className="mt-4 space-y-2">
                              {roots.length === 0 ? (
                                <div className="text-xs text-slate-500">No comments yet.</div>
                              ) : (
                                roots.map((c) => (
                                  <div key={c._id} className="rounded-lg border border-slate-200 bg-white p-2 text-xs dark:border-slate-800 dark:bg-slate-900">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-semibold text-slate-800 dark:text-slate-100">{c.authorName}</span>
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}
                                      </span>
                                    </div>
                                    <div className="mt-1 whitespace-pre-wrap text-[12px] text-slate-700 dark:text-slate-200">{c.content}</div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ) : null}
                      </article>
                    )
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="chat">
              <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Group chat</h2>
                    <Button variant="outline" size="sm" onClick={() => void fetchChat()} disabled={chatLoading} className="gap-2">
                      <RefreshCcw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[420px] overflow-auto pr-2">
                    {messages.length === 0 ? (
                      <div className="text-sm text-slate-500">No messages yet.</div>
                    ) : (
                      messages.map((m) => (
                        <div key={m._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/30">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{m.senderName}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-200">{m.content}</div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 flex items-start gap-2">
                    <textarea
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      className="w-full min-h-16 rounded-xl border border-slate-200 bg-white p-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="Write a message… Use @name to mention"
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      disabled={!chatDraft.trim()}
                      onClick={async () => {
                        try {
                          await groupsApi.sendChatMessage(groupId, { content: chatDraft.trim() })
                          setChatDraft('')
                          await fetchChat()
                        } catch (e: any) {
                          showToast(e?.message || 'Failed to send message')
                        }
                      }}
                    >
                      Send
                    </Button>
                  </div>
                </section>

                <aside className="space-y-4">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Thread</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{messages.length} messages</p>
                  </section>
                </aside>
              </div>
            </TabsContent>

            <TabsContent value="resources">
              <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Resources</h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Upload PDFs/images or share links.</p>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={resourceType}
                        onChange={(e) => setResourceType(e.target.value as any)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      >
                        <option value="link">Link</option>
                        <option value="file">File</option>
                      </select>
                    </div>

                    <Input value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} placeholder="Title (optional)" />
                    <textarea
                      value={resourceDesc}
                      onChange={(e) => setResourceDesc(e.target.value)}
                      className="w-full min-h-16 rounded-xl border border-slate-200 bg-white p-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      placeholder="Description (optional)"
                    />

                    {resourceType === 'link' ? (
                      <Input value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} placeholder="Paste link URL" />
                    ) : (
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-slate-600 dark:text-slate-300"
                      />
                    )}

                    <div className="flex justify-end">
                      <Button
                        disabled={resourcesLoading || (resourceType === 'link' ? !resourceUrl.trim() : !resourceFile)}
                        onClick={async () => {
                          try {
                            await handleUploadResource()
                            setResourceTitle('')
                            setResourceDesc('')
                            setResourceUrl('')
                            setResourceFile(null)
                            showToast('Resource added')
                            await fetchResources()
                          } catch (e: any) {
                            showToast(e?.message || 'Failed to upload resource')
                          }
                        }}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Add resource
                      </Button>
                    </div>
                  </div>
                </section>

                <aside className="space-y-4">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Shared</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{resources.length} resources</p>
                  </section>
                </aside>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {resources.map((r) => (
                  <div key={r._id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{r.title}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {r.type.toUpperCase()} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      <Badge variant="outline">{r.type}</Badge>
                    </div>
                    {r.description ? <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{r.description}</div> : null}
                    <div className="mt-3">
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline underline-offset-2">
                        Open
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="members">
              <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Members</h2>
                    {canAdmin ? (
                      <Button variant="outline" size="sm" onClick={() => void handleInvite()} className="gap-2">
                        <Users className="h-4 w-4" />
                        Invite
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-4 space-y-3">
                    {(group.members || []).map((m: any) => (
                      <div key={m.userId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/30">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                            {m.avatar || initials(m.name || 'S')}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{m.name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.userId}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {canAdmin ? (
                            <select
                              value={m.role}
                              onChange={(e) => void handleUpdateMemberRole(m.userId, e.target.value as any)}
                              className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                              aria-label={`Role for ${m.name}`}
                            >
                              <option value="member">member</option>
                              <option value="moderator">moderator</option>
                              <option value="admin">admin</option>
                            </select>
                          ) : (
                            <Badge variant="secondary">{m.role}</Badge>
                          )}

                          {canAdmin && m.userId !== myUid ? (
                            <Button variant="destructive" size="icon" onClick={() => void handleRemoveMember(m.userId)} aria-label="Remove member">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <aside className="space-y-4">
                  {canAdmin ? (
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Add member</h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Enter user's firebase UID.</p>
                      <div className="mt-3 space-y-2">
                        <Input value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)} placeholder="userId (firebase UID)" />
                        <Button
                          disabled={!addMemberId.trim()}
                          onClick={async () => {
                            try {
                              await groupsApi.addGroupMember(groupId, { userId: addMemberId.trim(), role: 'member' })
                              setAddMemberId('')
                              await fetchGroup()
                              showToast('Member added')
                            } catch (e: any) {
                              showToast(e?.message || 'Failed to add member')
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </section>
                  ) : null}
                </aside>
              </div>
            </TabsContent>

            <TabsContent value="study">
              <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
                <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Pomodoro</h2>
                    <Badge variant={activeSession ? 'default' : 'outline'}>{activeSession ? 'Active focus' : 'Idle'}</Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/30">
                    <div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{formatPomodoro(pomodoroSecsLeft)}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {pomodoroRunning ? 'Running' : pomodoroPaused ? 'Paused' : 'Ready'}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      {!pomodoroRunning && !pomodoroPaused ? (
                        <Button className="gap-2" onClick={() => void handleStartPomodoro()}>
                          <Clock className="h-4 w-4" /> Start
                        </Button>
                      ) : null}
                      {pomodoroRunning ? (
                        <Button variant="outline" onClick={() => handlePausePomodoro()}>
                          Pause
                        </Button>
                      ) : null}
                      {pomodoroPaused ? (
                        <Button variant="outline" onClick={() => handleResumePomodoro()}>
                          Resume
                        </Button>
                      ) : null}
                      <Button variant="destructive" onClick={() => handleResetPomodoro()}>
                        Reset
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/30">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Attendees</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {activeSession ? `Session: ${activeSession.title}` : 'No active session.'}
                        </div>
                      </div>
                      {activeSession ? <div className="text-xs text-slate-500 dark:text-slate-400">{activeSession.attendees?.length || 0} people</div> : null}
                    </div>

                    {activeSession ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(group.members || [])
                          .filter((m: any) => (activeSession.attendees || []).includes(m.userId))
                          .map((m: any) => (
                            <Badge key={m.userId} variant="secondary">
                              {m.name}
                            </Badge>
                          ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/30">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Schedule a study session</div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <Input value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} placeholder="Title" />
                      <Input type="datetime-local" value={sessionStartTime} onChange={(e) => setSessionStartTime(e.target.value)} />
                      <Input type="datetime-local" value={sessionEndTime} onChange={(e) => setSessionEndTime(e.target.value)} />
                      <Input value={sessionMeetingLink} onChange={(e) => setSessionMeetingLink(e.target.value)} placeholder="Meeting link (optional)" />
                      <Button disabled={!sessionTitle.trim() || !sessionStartTime} className="w-full" onClick={() => void handleScheduleSession()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create session
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">RSVP</div>
                    <div className="mt-2 space-y-2">
                      {sessions.map((s) => {
                        const attending = (s.attendees || []).includes(myUid)
                        const startMs = new Date(s.startTime).getTime()
                        const isPast = startMs < Date.now() - 60 * 1000
                        return (
                          <div key={s._id} className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{s.title}</div>
                                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  {formatDistanceToNow(new Date(s.startTime), { addSuffix: true })}
                                  {s.meetingLink ? ' · meeting link' : ''}
                                </div>
                              </div>
                              <Badge variant={attending ? 'default' : 'outline'}>{attending ? 'Going' : isPast ? 'Done' : 'RSVP'}</Badge>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <Button size="sm" variant="outline" disabled={isPast} onClick={() => void handleRsvp(s, true)}>
                                RSVP
                              </Button>
                              <Button size="sm" variant="destructive" disabled={isPast} onClick={() => void handleRsvp(s, false)}>
                                Decline
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </section>

                <aside className="space-y-4">
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">To-dos</h3>
                      <Badge variant="outline">{todos.length}</Badge>
                    </div>

                    <div className="mt-3 space-y-2">
                      <Input value={todoTitle} onChange={(e) => setTodoTitle(e.target.value)} placeholder="Task title" />
                      <Input value={todoAssignedTo} onChange={(e) => setTodoAssignedTo(e.target.value)} placeholder="Assign to userId (optional)" />
                      <Input type="datetime-local" value={todoDueDate} onChange={(e) => setTodoDueDate(e.target.value)} />
                      <textarea
                        value={todoDesc}
                        onChange={(e) => setTodoDesc(e.target.value)}
                        className="w-full min-h-16 rounded-xl border border-slate-200 bg-white p-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder="Description (optional)"
                      />
                      <Button disabled={!canManage || !todoTitle.trim()} className="w-full" onClick={() => void handleCreateTodo()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create
                      </Button>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">List</div>
                    <div className="mt-2 space-y-2 max-h-[360px] overflow-auto pr-2">
                      {todos.map((t) => (
                        <div key={t._id} className={`rounded-xl border p-3 text-xs ${t.completed ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' : 'bg-white border-slate-200 dark:border-slate-800 dark:bg-slate-900'}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold line-clamp-1">{t.title}</div>
                              {canManage ? (
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={todoAssignedDraftById[t._id] ?? (t.assignedTo || '')}
                                      onChange={(e) => setTodoAssignedDraftById((prev) => ({ ...prev, [t._id]: e.target.value }))}
                                      placeholder="Assigned to userId"
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="datetime-local"
                                      value={todoDueDraftById[t._id] ?? (t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 16) : '')}
                                      onChange={(e) => setTodoDueDraftById((prev) => ({ ...prev, [t._id]: e.target.value }))}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div className="flex justify-end">
                                    <Button size="sm" variant="outline" onClick={() => void handleSaveTodoMeta(t)}>
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                    {t.dueDate ? `Due ${formatDistanceToNow(new Date(t.dueDate), { addSuffix: true })}` : 'No due date'}
                                  </div>
                                  {t.assignedTo ? <div className="text-[10px] text-slate-500 dark:text-slate-400">Assigned: {t.assignedTo}</div> : null}
                                </>
                              )}
                            </div>
                            {canManage ? (
                              <Button size="icon" variant="outline" onClick={() => void handleToggleTodo(t)} aria-label="Toggle todo">
                                <Check className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Badge variant={t.completed ? 'default' : 'secondary'}>{t.completed ? 'done' : 'open'}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {todos.length === 0 ? <div className="text-xs text-slate-500">No to-dos.</div> : null}
                    </div>
                  </section>
                </aside>
              </div>
            </TabsContent>
          </Tabs>

          {inviteOpen ? (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogContent>
                <DialogTitle className="mb-2">Invite members</DialogTitle>
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950/30">
                    {inviteCode || '—'}
                  </div>
                  {inviteLink ? (
                    <a className="text-indigo-600 underline underline-offset-2" href={inviteLink} target="_blank" rel="noreferrer">
                      Invite link
                    </a>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" disabled={!inviteCode} onClick={() => void handleInviteCopy()}>
                      Copy code
                    </Button>
                    <Button onClick={() => setInviteOpen(false)}>Done</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}

          {toast?.message ? (
            <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-xl">
              {toast.message}
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  )
}

