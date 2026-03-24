'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { formatDistanceToNow } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  BarChart2,
  CheckCircle2,
  Crown,
  FileText,
  Flame,
  HelpCircle,
  Lightbulb,
  Medal,
  MessageSquare,
  Plus,
  Send,
  Share2,
  ThumbsUp,
  User,
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/lib/store/authStore'
import { communityApi, type CommunityPost } from '@/lib/api/communityApi'
import { useToast } from '@/hooks/useToast'

type FeedTab = 'post' | 'question' | 'poll'

type CommunityComment = {
  _id: string
  postId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
  rank?: string
}

type CommunityMe = {
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

const rankFromPoints = (totalPoints: number) => {
  if (totalPoints >= 2000) return 'Campus Champion'
  if (totalPoints >= 1000) return 'Top Scholar'
  if (totalPoints >= 500) return 'Serious Scholar'
  if (totalPoints >= 200) return 'Active Learner'
  return 'Beginner'
}

const timeAgo = (dateString: string) => formatDistanceToNow(new Date(dateString), { addSuffix: true })

const initials = (name: string) =>
  name
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

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
  const [me, setMe] = useState<CommunityMe | null>(null)
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [expandedLeaderboard, setExpandedLeaderboard] = useState(false)
  const [likeEffectPost, setLikeEffectPost] = useState<string | null>(null)
  const [streakPulse, setStreakPulse] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImageFile(acceptedFiles[0] || null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  })

  const selectedSubjectPosts = useMemo(() => {
    if (subject === 'All') return posts
    return posts.filter((post) => post.subject === subject)
  }, [posts, subject])

  const loadAll = useCallback(async () => {
    try {
      setLoading(true)
      const [postsRes, trendingRes, meRes, leaderboardRes] = await Promise.all([
        communityApi.getPosts(),
        communityApi.getTrending(),
        communityApi.getMe(),
        communityApi.getLeaderboard(),
      ])

      const postsData = postsRes.data || {}
      const trendingData = trendingRes.data || {}
      const meData = meRes.data || {}
      const leaderboardData = leaderboardRes.data || {}
      const nextPosts = postsData.posts || []
      const nextTrending = trendingData.posts || trendingData.trending || []
      const mePayload = meData.me || meData

      setPosts(nextPosts)
      setTrending(nextTrending)
      setLeaderboard(leaderboardData.leaderboard || [])
      setMe({
        rank: mePayload.rank || rankFromPoints(mePayload.totalPoints || 0),
        streak: mePayload.streak || 0,
        totalPoints: mePayload.totalPoints || 0,
        leaderboardPosition: mePayload.leaderboardPosition || 0,
      })
    } catch {
      showToast('Failed to load community data')
    } finally {
      setLoading(false)
    }
  }, [showToast])

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
      type: selectedTab,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
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
      showToast('+5 points for creating a post')
      await loadAll()
    } catch {
      setPosts((prev) => prev.filter((post) => post._id !== tempId))
      showToast('Failed to create post')
    } finally {
      setSubmitting(false)
    }
  }, [selectedTab, postText, questionText, pollQuestion, pollOptions, myUid, user?.name, imageFile, subject, showToast, loadAll])

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
      setLikeEffectPost(postId)
      window.setTimeout(() => setLikeEffectPost(null), 650)
      try {
        await communityApi.likePost(postId)
        showToast(nextLiked ? '+2 points for receiving a like' : 'Like removed')
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

  const displayedLeaderboard = expandedLeaderboard ? leaderboard : leaderboard.slice(0, 10)

  return (
    <ProtectedRoute allowedRoles={['student', 'admin']}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 pb-16 pt-6 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">StudyHelp Community</h1>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <User className="h-5 w-5" />
                </div>
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
                <button className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                  <Bell className="h-5 w-5" />
                </button>
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
                      onClick={() => setSubject(item)}
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
              ) : selectedSubjectPosts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                  <Lightbulb className="mx-auto mb-3 h-8 w-8 text-indigo-500" />
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">No discussions yet. Be the first to ask a question and earn points.</p>
                  <button onClick={() => setSelectedTab('post')} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                    Create a post
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSubjectPosts.map((post) => {
                    const comments = commentsByPost[post._id] || []
                    const isOwner = post.authorId === myUid
                    return (
                      <article key={post._id} id={`post-${post._id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:scale-[1.005] dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">{initials(post.authorName || 'S')}</div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{post.authorName}</p>
                              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">{rankFromPoints((me?.totalPoints || 0) + 1)}</span>
                              {post.isTrending && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-200">
                                  <Flame className="h-3.5 w-3.5" />
                                  Trending
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{timeAgo(post.createdAt)}</p>
                          </div>
                        </div>

                        {post.type === 'question' && (
                          <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
                            <HelpCircle className="h-3.5 w-3.5" />
                            Question
                          </div>
                        )}

                        <div className="prose prose-sm max-w-none text-slate-700 dark:prose-invert dark:text-slate-200">
                          <ReactMarkdown>{post.content || ''}</ReactMarkdown>
                        </div>

                        {post.type === 'poll' && post.poll && (
                          <div className="mt-3 space-y-2">
                            {post.poll.options.map((option, index) => {
                              const votes = option.votes?.length || 0
                              const totalVotes = post.poll?.options.reduce((sum, item) => sum + (item.votes?.length || 0), 0) || 0
                              const width = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
                              return (
                                <button key={`${post._id}-${index}`} onClick={() => void votePoll(post._id, index)} className="w-full rounded-xl border border-slate-200 p-2 text-left text-xs dark:border-slate-700">
                                  <div className="mb-1 flex items-center justify-between">
                                    <span>{option.text}</span>
                                    <span>{votes}</span>
                                  </div>
                                  <div className="h-2 rounded bg-slate-100 dark:bg-slate-800">
                                    <motion.div initial={false} animate={{ width: `${width}%` }} className="h-2 rounded bg-indigo-500" />
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                          <button onClick={() => void toggleLike(post._id)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <ThumbsUp className="h-4 w-4" />
                            {post.likesCount}
                          </button>
                          <button onClick={() => void toggleCommentSection(post._id)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <MessageSquare className="h-4 w-4" />
                            {post.commentsCount}
                          </button>
                          <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/community#post-${post._id}`)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            <Share2 className="h-4 w-4" />
                            Share
                          </button>
                        </div>

                        <AnimatePresence>
                          {likeEffectPost === post._id && (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: -10 }} exit={{ opacity: 0, y: -20 }} className="pointer-events-none mt-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                              <Plus className="h-4 w-4" />
                              2
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {openComments[post._id] && (
                          <div className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                            <div className="mb-3 space-y-3">
                              {comments.map((comment) => {
                                const isBestAnswer = post.bestAnswerCommentId === comment._id
                                return (
                                  <div key={comment._id} className={`rounded-lg border p-2 ${isBestAnswer ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'}`}>
                                    <div className="mb-1 flex items-center justify-between">
                                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{comment.authorName}</p>
                                      {isBestAnswer && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                          <Crown className="h-3.5 w-3.5" />
                                          Best answer
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300">{comment.content}</p>
                                    {isOwner && post.type === 'question' && !isBestAnswer && (
                                      <button onClick={() => void markBestAnswer(post._id, comment._id)} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Mark best answer
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                value={commentDrafts[post._id] || ''}
                                onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))}
                                placeholder="Write a comment..."
                                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                              />
                              <button onClick={() => void addComment(post._id)} className="rounded-lg bg-indigo-600 p-2 text-white">
                                <Send className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  })}
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
                    return (
                      <div key={`${rowId || row.name}-${index}`} className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${isMe ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-slate-50 dark:bg-slate-800'}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">{index + 1}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{row.name || row.username || 'User'}</span>
                        </div>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{row.totalPoints}</span>
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
      <ToastHost message={toast?.message || null} />
    </ProtectedRoute>
  )
}

