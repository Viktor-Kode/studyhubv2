'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import {
  BarChart2,
  Bell,
  CheckCircle2,
  FileText,
  Flame,
  Hash,
  HelpCircle,
  Lightbulb,
  Medal,
  Plus,
  Pencil,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { CommunityPostCard, type CommunityComment } from '@/components/community/CommunityPostCard'
import { useAuthStore } from '@/lib/store/authStore'
import { communityApi, type CommunityPost } from '@/lib/api/communityApi'
import { initials, pollVotesTotal, rankFromPoints } from '@/lib/community/utils'
import { useToast } from '@/hooks/useToast'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type FeedTab = 'post' | 'question' | 'poll'

type FeedMeStats = {
  rank: string
  streak: number
  totalPoints: number
  leaderboardPosition: number
}

type LeaderboardRow = {
  userId?: string
  uid?: string
  username?: string
  name?: string
  rank?: string
  totalPoints: number
}

const SUBJECTS = [
  'All',
  'Mathematics',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Government',
  'Literature',
  'Geography',
]

function ToastHost({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-xl">
      {message}
    </div>
  )
}

export default function CommunityPage() {
  const { user } = useAuthStore()
  const { toast, showToast } = useToast(2200)
  const myUid = user?.uid || ''

  const [subject, setSubject] = useState('All')
  const [selectedTab, setSelectedTab] = useState<FeedTab>('post')
  const [postText, setPostText] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [trending, setTrending] = useState<CommunityPost[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([])
  const [me, setMe] = useState<FeedMeStats | null>(null)
  const [communityStats, setCommunityStats] = useState<{
    totalMembers: number
    postsToday: number
    activeUsers: number
  } | null>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<'feed' | 'newest' | 'trending'>('feed')
  const [extraTags, setExtraTags] = useState('')
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [expandedLeaderboard, setExpandedLeaderboard] = useState(false)
  const [likeEffectPost, setLikeEffectPost] = useState<string | null>(null)
  const [streakPulse, setStreakPulse] = useState(false)
  const [menuPostId, setMenuPostId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editPollOptionTexts, setEditPollOptionTexts] = useState<string[]>([])
  const [editSaving, setEditSaving] = useState(false)
  const [deletingPost, setDeletingPost] = useState<CommunityPost | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImageFile(acceptedFiles[0] || null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  })

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 320)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      const [postsRes, leaderboardRes, trendRes, statsRes, meRes] = await Promise.all([
        communityApi.getPosts({
          subject: subject === 'All' ? undefined : subject,
          tag: tagFilter || undefined,
          q: debouncedSearch || undefined,
          sort: sortMode,
          limit: 30,
        }),
        communityApi.getLeaderboard(),
        communityApi.getTrending().catch(() => ({ data: { posts: [] } })),
        communityApi.getStats().catch(() => ({ data: {} })),
        communityApi.getMe().catch(() => ({ data: null })),
      ])

      const postsData = postsRes.data || {}
      const leaderboardData = leaderboardRes.data || {}
      const nextPosts = postsData.posts || []
      const myEntry =
        leaderboardData.myEntry ||
        (leaderboardData.leaderboard || []).find(
          (row: LeaderboardRow) => (row.userId || row.uid) === myUid,
        ) ||
        null
      const myRank = leaderboardData.myRank || 0

      const apiMe = meRes.data?.me
      const streak = apiMe?.streak ?? myEntry?.streak ?? 0

      setPosts(nextPosts)
      setTrending((trendRes.data?.posts as CommunityPost[]) || [])
      setLeaderboard(leaderboardData.leaderboard || [])
      setMe({
        rank: apiMe?.rank || myEntry?.rank || rankFromPoints(myEntry?.totalPoints || 0),
        streak,
        totalPoints: apiMe?.totalPoints ?? myEntry?.totalPoints ?? 0,
        leaderboardPosition: myRank,
      })
      const statsPayload = statsRes.data as { stats?: { totalMembers: number; postsToday: number; activeUsers: number } } | undefined
      setCommunityStats(statsPayload?.stats ?? null)
      setUnreadNotifications(apiMe?.unreadNotifications ?? 0)
    } catch {
      showToast('Failed to load community data')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, myUid, showToast, sortMode, subject, tagFilter])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    if (!me?.streak) return
    setStreakPulse(true)
    const t = window.setTimeout(() => setStreakPulse(false), 700)
    return () => window.clearTimeout(t)
  }, [me?.streak])

  const createPost = useCallback(async () => {
    const content = selectedTab === 'post' ? postText.trim() : selectedTab === 'question' ? questionText.trim() : pollQuestion.trim()
    if (!content) return

    const tagList = extraTags
      .split(/[,]+/)
      .map((x) => x.trim().replace(/^#/, '').toLowerCase())
      .filter(Boolean)
      .slice(0, 8)

    let pollPayload: { question: string; options: { text: string }[]; endsAt: string } | undefined
    if (selectedTab === 'poll') {
      const cleaned = pollOptions.map((x) => x.trim()).filter(Boolean)
      if (cleaned.length < 2) {
        showToast('Add at least two poll options')
        return
      }
      pollPayload = {
        question: content,
        options: cleaned.map((text) => ({ text })),
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    }

    const tempId = `temp-${Date.now()}`
    const optimistic: CommunityPost = {
      _id: tempId,
      authorId: myUid,
      authorName: user?.name || 'Student',
      authorAvatar: null,
      content,
      imageUrl: imageFile ? URL.createObjectURL(imageFile) : null,
      subject: subject === 'All' ? null : subject,
      tags: tagList,
      type: selectedTab,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isBookmarked: false,
      isPinned: false,
      createdAt: new Date().toISOString(),
      poll:
        selectedTab === 'poll'
          ? {
              question: content,
              options: pollOptions
                .map((x) => x.trim())
                .filter(Boolean)
                .map((text) => ({ text, votes: [] })),
              endsAt: pollPayload?.endsAt || null,
            }
          : undefined,
    }

    setPosts((prev) => [optimistic, ...prev])
    setSubmitting(true)

    try {
      let imageUrl: string | null = null
      if (imageFile) {
        const uploadRes = await communityApi.uploadImage(imageFile)
        imageUrl = uploadRes.data?.imageUrl || null
      }
      const response = await communityApi.createPost({
        type: selectedTab,
        content,
        subject: subject === 'All' ? undefined : subject,
        imageUrl,
        poll: pollPayload,
        ...(tagList.length ? { tags: tagList } : {}),
      })
      const created = response.data?.post
      if (created) {
        setPosts((prev) => prev.map((post) => (post._id === tempId ? created : post)))
      }
      setPostText('')
      setQuestionText('')
      setPollQuestion('')
      setPollOptions(['', ''])
      setImageFile(null)
      setExtraTags('')
      showToast('+5 points for creating a post')
      await loadAll()
    } catch {
      setPosts((prev) => prev.filter((post) => post._id !== tempId))
      showToast('Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }, [selectedTab, postText, questionText, pollQuestion, pollOptions, myUid, user?.name, imageFile, subject, extraTags, showToast, loadAll])

  const toggleLike = useCallback(
    async (postId: string) => {
      const current = posts.find((post) => post._id === postId)
      if (!current) return
      const nextLiked = !current.isLiked
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, isLiked: nextLiked, likesCount: Math.max(0, post.likesCount + (nextLiked ? 1 : -1)) } : post,
        ),
      )
      if (nextLiked) {
        setLikeEffectPost(postId)
        window.setTimeout(() => setLikeEffectPost(null), 650)
      }
      try {
        await communityApi.likePost(postId)
      } catch {
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId ? { ...post, isLiked: current.isLiked, likesCount: current.likesCount } : post,
          ),
        )
        showToast('Failed to update like')
      }
    },
    [posts, showToast],
  )

  const openEditModal = useCallback((post: CommunityPost) => {
    setEditingPost(post)
    setEditContent(post.content || '')
    setEditSubject(post.subject || '')
    setEditPollOptionTexts(
      post.type === 'poll' && post.poll?.options?.length
        ? post.poll.options.map((o) => (o.text || '').trim())
        : ['', ''],
    )
    setMenuPostId(null)
  }, [])

  const saveEditedPost = useCallback(async () => {
    if (!editingPost) return
    const trimmed = editContent.trim()
    if (!trimmed) {
      showToast('Content is required')
      return
    }
    const votesTotal = pollVotesTotal(editingPost)
    let pollOptionsPayload: string[] | undefined
    if (editingPost.type === 'poll' && votesTotal === 0) {
      const cleaned = editPollOptionTexts.map((x) => x.trim()).filter(Boolean)
      if (cleaned.length < 2) {
        showToast('Poll needs at least two options')
        return
      }
      pollOptionsPayload = cleaned.slice(0, 4)
    }

    const prevSnapshot = editingPost
    setEditSaving(true)
    setPosts((prev) =>
      prev.map((p) => {
        if (p._id !== editingPost._id) return p
        const next: CommunityPost = {
          ...p,
          content: trimmed,
          subject: editSubject || null,
        }
        if (p.type === 'poll' && p.poll) {
          next.poll = {
            ...p.poll,
            question: trimmed,
            ...(pollOptionsPayload
              ? { options: pollOptionsPayload.map((text) => ({ text, votes: [] as string[] })) }
              : {}),
          }
        }
        return next
      }),
    )
    try {
      const res = await communityApi.updatePost(editingPost._id, {
        content: trimmed,
        subject: editSubject || null,
        ...(pollOptionsPayload ? { pollOptions: pollOptionsPayload } : {}),
      })
      const updated = res.data?.post as CommunityPost | undefined
      if (updated) {
        setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
      }
      showToast('Post updated')
      setEditingPost(null)
    } catch {
      setPosts((prev) => prev.map((p) => (p._id === prevSnapshot._id ? prevSnapshot : p)))
      showToast('Failed to update post')
    } finally {
      setEditSaving(false)
    }
  }, [editContent, editPollOptionTexts, editSubject, editingPost, showToast])

  const confirmDeletePost = useCallback(async () => {
    if (!deletingPost) return
    const id = deletingPost._id
    const snapshot = deletingPost
    setDeleteBusy(true)
    setPosts((prev) => prev.filter((p) => p._id !== id))
    setDeletingPost(null)
    try {
      await communityApi.deletePost(id)
      showToast('Post deleted')
      setCommentsByPost((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch {
      setPosts((prev) => [snapshot, ...prev])
      showToast('Failed to delete post')
    } finally {
      setDeleteBusy(false)
    }
  }, [deletingPost, showToast])

  const loadComments = useCallback(
    async (postId: string) => {
      try {
        const response = await communityApi.getComments(postId)
        setCommentsByPost((prev) => ({ ...prev, [postId]: response.data?.comments || [] }))
      } catch {
        showToast('Failed to load comments')
      }
    },
    [showToast],
  )

  const toggleCommentSection = useCallback(
    async (postId: string) => {
      setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }))
      if (!commentsByPost[postId]) {
        await loadComments(postId)
      }
    },
    [commentsByPost, loadComments],
  )

  const addComment = useCallback(
    async (postId: string) => {
      const content = (commentDrafts[postId] || '').trim()
      if (!content) return
      const optimistic: CommunityComment = {
        _id: `temp-comment-${Date.now()}`,
        postId,
        authorId: myUid,
        authorName: user?.name || 'Student',
        content,
        createdAt: new Date().toISOString(),
        rank: me?.rank,
      }
      const prevComments = commentsByPost[postId] || []
      setCommentsByPost((prev) => ({ ...prev, [postId]: [...prevComments, optimistic] }))
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }))
      setPosts((prev) => prev.map((post) => (post._id === postId ? { ...post, commentsCount: post.commentsCount + 1 } : post)))
      try {
        const response = await communityApi.addComment(postId, content)
        const newComment = response.data?.comment
        if (newComment) {
          setCommentsByPost((prev) => ({
            ...prev,
            [postId]: (prev[postId] || []).map((comment) => (comment._id.startsWith('temp-comment-') ? newComment : comment)),
          }))
        }
        showToast('+3 points for commenting')
      } catch {
        setCommentsByPost((prev) => ({ ...prev, [postId]: prevComments }))
        setPosts((prev) => prev.map((post) => (post._id === postId ? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) } : post)))
        showToast('Failed to comment')
      }
    },
    [commentDrafts, commentsByPost, me?.rank, myUid, showToast, user?.name],
  )

  const markBestAnswer = useCallback(
    async (postId: string, commentId: string) => {
      const current = posts.find((post) => post._id === postId)
      if (!current) return
      setPosts((prev) => prev.map((post) => (post._id === postId ? { ...post, bestAnswerCommentId: commentId } : post)))
      try {
        await communityApi.markBestAnswer(postId, commentId)
        showToast('+10 points for best answer')
      } catch {
        setPosts((prev) =>
          prev.map((post) => (post._id === postId ? { ...post, bestAnswerCommentId: current.bestAnswerCommentId || null } : post)),
        )
        showToast('Failed to mark best answer')
      }
    },
    [posts, showToast],
  )

  const votePoll = useCallback(
    async (postId: string, optionIndex: number) => {
      const previous = posts.find((post) => post._id === postId)
      if (!previous?.poll) return
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id !== postId || !post.poll) return post
          const options = post.poll.options.map((option, index) => {
            const votesWithoutMe = (option.votes || []).filter((vote) => vote !== myUid)
            return index === optionIndex ? { ...option, votes: [...votesWithoutMe, myUid] } : { ...option, votes: votesWithoutMe }
          })
          return { ...post, poll: { ...post.poll, options } }
        }),
      )
      try {
        await communityApi.votePoll(postId, optionIndex)
        showToast('+1 point for voting')
      } catch {
        setPosts((prev) => prev.map((post) => (post._id === postId ? previous : post)))
        showToast('Failed to vote')
      }
    },
    [myUid, posts, showToast],
  )

  const toggleBookmark = useCallback(
    async (postId: string) => {
      const current = posts.find((p) => p._id === postId)
      if (!current) return
      const next = !current.isBookmarked
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, isBookmarked: next } : p)))
      try {
        await communityApi.toggleBookmark(postId)
        showToast(next ? 'Saved to bookmarks' : 'Removed from bookmarks')
      } catch {
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, isBookmarked: current.isBookmarked } : p)))
        showToast('Could not update bookmark')
      }
    },
    [posts, showToast],
  )

  const submitReport = useCallback(
    async (postId: string, reason: string) => {
      await communityApi.reportPost(postId, { reason })
      showToast('Thanks — report submitted for review')
    },
    [showToast],
  )

  const togglePin = useCallback(
    async (postId: string) => {
      const current = posts.find((p) => p._id === postId)
      if (!current) return
      const nextPinned = !current.isPinned
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, isPinned: nextPinned } : p)))
      try {
        await communityApi.pinPost(postId, nextPinned)
        showToast(nextPinned ? 'Post pinned' : 'Post unpinned')
      } catch {
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, isPinned: current.isPinned } : p)))
        showToast('Could not update pin')
      }
    },
    [posts, showToast],
  )

  const displayedLeaderboard = expandedLeaderboard ? leaderboard : leaderboard.slice(0, 10)

  return (
    <ProtectedRoute allowedRoles={['student', 'admin']}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 pb-16 pt-6 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">StudyHelp Community</h1>
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search posts, people, tags…"
                  className="h-10 w-full pl-9"
                  aria-label="Search community"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {(['feed', 'newest', 'trending'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSortMode(mode)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
                      sortMode === mode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
                {tagFilter && (
                  <Badge variant="outline" className="gap-1">
                    <Hash className="h-3 w-3" />
                    {tagFilter}
                    <button type="button" className="ml-1 font-bold" onClick={() => setTagFilter(null)} aria-label="Clear tag">
                      ×
                    </button>
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/community/profile"
                  className="flex items-center gap-2 rounded-xl px-1 py-0.5 outline-none ring-indigo-500/0 transition hover:bg-slate-100 focus-visible:ring-2 dark:hover:bg-slate-800"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    {initials(user?.name || 'Student')}
                  </div>
                  <span className="hidden max-w-[140px] truncate text-sm font-semibold text-slate-800 dark:text-slate-100 sm:inline">
                    {user?.name || 'Profile'}
                  </span>
                </Link>
                <div className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-1 text-xs font-semibold text-white">
                  {me?.rank || 'Beginner'}
                </div>
                <motion.div
                  animate={streakPulse ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-200"
                >
                  <Flame className="h-4 w-4" />
                  {me?.streak || 0}
                </motion.div>
                <Link
                  href="/community/notifications"
                  className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)_300px]">
            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Subjects</h2>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setSubject(item)
                        setTagFilter(null)
                      }}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        subject === item
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {subject === item && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-white to-indigo-50 p-4 dark:border-indigo-900/40 dark:from-slate-900 dark:to-indigo-950/30">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Current streak: {me?.streak || 0}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">Don&apos;t break it! Next milestone in {Math.max(1, 7 - ((me?.streak || 0) % 7))} days.</p>
              </div>

              {communityStats && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <Users className="h-4 w-4 text-indigo-600" />
                    Community stats
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex justify-between">
                      <span>Members</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {communityStats.totalMembers.toLocaleString()}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span>Posts today</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{communityStats.postsToday}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Active (24h)</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{communityStats.activeUsers}</span>
                    </li>
                  </ul>
                </div>
              )}
            </aside>

            <main className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTab('post')}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${selectedTab === 'post' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                  >
                    <FileText className="h-4 w-4" />
                    Post
                  </button>
                  <button
                    onClick={() => setSelectedTab('question')}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${selectedTab === 'question' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Ask Question
                  </button>
                  <button
                    onClick={() => setSelectedTab('poll')}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${selectedTab === 'poll' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                  >
                    <BarChart2 className="h-4 w-4" />
                    Poll
                  </button>
                </div>

                {selectedTab === 'post' && (
                  <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Share study insights..." className="min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                )}
                {selectedTab === 'question' && (
                  <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Ask a question..." className="min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                )}
                {selectedTab === 'poll' && (
                  <div className="space-y-3">
                    <input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder="Poll question" className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
                    {pollOptions.map((option, index) => (
                      <input
                        key={index}
                        value={option}
                        onChange={(e) => setPollOptions((prev) => prev.map((item, i) => (i === index ? e.target.value : item)))}
                        placeholder={`Option ${index + 1}`}
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                      />
                    ))}
                    <button onClick={() => setPollOptions((prev) => [...prev, ''])} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                      <Plus className="h-4 w-4" />
                      Add option
                    </button>
                  </div>
                )}

                <div className="mt-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Tags (optional)</label>
                  <Input
                    value={extraTags}
                    onChange={(e) => setExtraTags(e.target.value)}
                    placeholder="#biology, exam — or type #hashtag in the post body"
                    className="text-sm"
                  />
                </div>

                <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-3 dark:border-slate-700" {...getRootProps()}>
                  <input {...getInputProps()} />
                  <p className="text-xs text-slate-500 dark:text-slate-300">{isDragActive ? 'Drop image here' : imageFile ? imageFile.name : 'Drop image or click to upload'}</p>
                </div>

                <div className="mt-3 flex justify-end">
                  <button disabled={submitting} onClick={() => void createPost()} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60">
                    {submitting ? 'Posting...' : 'Publish'}
                  </button>
                </div>
              </section>

              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  Loading feed...
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                  <Lightbulb className="mx-auto mb-3 h-8 w-8 text-indigo-500" />
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                    {debouncedSearch
                      ? 'No posts match your search.'
                      : 'No discussions yet. Be the first to ask a question and earn points.'}
                  </p>
                  {!debouncedSearch && (
                    <button onClick={() => setSelectedTab('post')} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                      Create a post
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <CommunityPostCard
                      key={post._id}
                      post={post}
                      myUid={myUid}
                      isAdmin={user?.role === 'admin'}
                      rankBadge={rankFromPoints((me?.totalPoints || 0) + 1)}
                      comments={commentsByPost[post._id] || []}
                      commentsOpen={!!openComments[post._id]}
                      commentDraft={commentDrafts[post._id] || ''}
                      onToggleComments={() => void toggleCommentSection(post._id)}
                      onCommentDraftChange={(value) =>
                        setCommentDrafts((prev) => ({ ...prev, [post._id]: value }))
                      }
                      onSubmitComment={() => void addComment(post._id)}
                      likeEffectActive={likeEffectPost === post._id}
                      onLike={() => void toggleLike(post._id)}
                      onVotePoll={(optionIndex) => void votePoll(post._id, optionIndex)}
                      onShare={() =>
                        void navigator.clipboard.writeText(
                          `${window.location.origin}/community#post-${post._id}`,
                        )
                      }
                      menuPostId={menuPostId}
                      onMenuToggle={() =>
                        setMenuPostId((id) => (id === post._id ? null : post._id))
                      }
                      onEdit={() => openEditModal(post)}
                      onDelete={() => {
                        setDeletingPost(post)
                        setMenuPostId(null)
                      }}
                      onMarkBestAnswer={(commentId) => void markBestAnswer(post._id, commentId)}
                      onToggleBookmark={() => void toggleBookmark(post._id)}
                      onReport={(reason) => void submitReport(post._id, reason)}
                      onTogglePin={() => void togglePin(post._id)}
                      onTagClick={(tag) => {
                        setTagFilter(tag)
                        setSubject('All')
                      }}
                    />
                  ))}
                </div>
              )}
            </main>

            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Leaderboard</h2>
                  <Medal className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="space-y-2">
                  {displayedLeaderboard.map((row, index) => {
                    const rowId = row.userId || row.uid
                    const isMe = rowId === myUid
                    const profileHref =
                      rowId && !isMe
                        ? `/community/profile?user=${encodeURIComponent(String(rowId))}`
                        : '/community/profile'
                    return (
                      <div key={`${rowId || row.name}-${index}`} className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${isMe ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-slate-50 dark:bg-slate-800'}`}>
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="shrink-0 font-semibold text-slate-600 dark:text-slate-300">{index + 1}</span>
                          <Link
                            href={profileHref}
                            className="truncate font-semibold text-slate-800 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                          >
                            {row.name || row.username || 'User'}
                          </Link>
                        </div>
                        <span className="shrink-0 font-semibold text-slate-600 dark:text-slate-300">{row.totalPoints}</span>
                      </div>
                    )
                  })}
                </div>
                {leaderboard.length > 10 && (
                  <button onClick={() => setExpandedLeaderboard((prev) => !prev)} className="mt-3 text-xs font-semibold text-indigo-600">
                    {expandedLeaderboard ? 'Show less' : 'View all'}
                  </button>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Trending</h2>
                </div>
                <div className="space-y-2">
                  {trending.slice(0, 5).map((post) => (
                    <button key={post._id} onClick={() => document.getElementById(`post-${post._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-left text-xs hover:border-indigo-400 dark:border-slate-700 dark:text-slate-200">
                      <p className="line-clamp-2">{post.content}</p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{post.likesCount} likes • {post.commentsCount} comments</p>
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {editingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-post-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditingPost(null)
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 id="edit-post-title" className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Pencil className="h-5 w-5 text-indigo-600" />
              Edit post
            </h2>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Subject</label>
            <select
              value={editSubject || ''}
              onChange={(e) => setEditSubject(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">All / none</option>
              {SUBJECTS.filter((s) => s !== 'All').map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {editingPost.type === 'poll' ? 'Poll question' : 'Content'}
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="mb-4 min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {editingPost.type === 'poll' && editingPost.poll && (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Poll options</p>
                {pollVotesTotal(editingPost) > 0 ? (
                  <ul className="space-y-2">
                    {editingPost.poll.options.map((opt, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {opt.text}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <>
                    {editPollOptionTexts.map((opt, i) => (
                      <input
                        key={i}
                        value={opt}
                        onChange={(e) =>
                          setEditPollOptionTexts((prev) => prev.map((t, j) => (j === i ? e.target.value : t)))
                        }
                        className="w-full rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        placeholder={`Option ${i + 1}`}
                      />
                    ))}
                    <button
                      type="button"
                      disabled={editPollOptionTexts.length >= 4}
                      onClick={() => setEditPollOptionTexts((prev) => [...prev, ''])}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                      Add option
                    </button>
                    {editPollOptionTexts.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setEditPollOptionTexts((prev) => prev.slice(0, -1))}
                        className="ml-3 text-xs font-semibold text-slate-600 dark:text-slate-400"
                      >
                        Remove last option
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={editSaving}
                onClick={() => void saveEditedPost()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {editSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-post-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDeletingPost(null)
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 id="delete-post-title" className="mb-2 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete post
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Are you sure? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingPost(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                onClick={() => void confirmDeletePost()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
              >
                {deleteBusy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastHost message={toast?.message || null} />
    </ProtectedRoute>
  )
}

