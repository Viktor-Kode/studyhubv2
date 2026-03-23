'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useDropzone } from 'react-dropzone'
import {
  Globe,
  Heart,
  MessageCircle,
  Trash2,
  Send,
  Pencil,
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { useAuthStore } from '@/lib/store/authStore'
import { communityApi, type CommunityPost } from '@/lib/api/communityApi'
import { useToast } from '@/hooks/useToast'

type SubjectDef = {
  id: string
  label: string
  bg: string
  text: string
  bgDark: string
  textDark: string
}

const SUBJECTS: SubjectDef[] = [
  { id: 'All', label: 'All', bg: '#EEF2FF', text: '#4F46E5', bgDark: 'rgba(79,70,229,0.18)', textDark: '#A5B4FC' },
  { id: 'Mathematics', label: 'Mathematics', bg: '#DBEAFE', text: '#1D4ED8', bgDark: 'rgba(29,78,216,0.22)', textDark: '#93C5FD' }, // blue
  { id: 'English', label: 'English', bg: '#D1FAE5', text: '#065F46', bgDark: 'rgba(5,150,105,0.20)', textDark: '#6EE7B7' }, // green
  { id: 'Physics', label: 'Physics', bg: '#E9D5FF', text: '#6D28D9', bgDark: 'rgba(109,40,217,0.20)', textDark: '#C4B5FD' }, // purple
  { id: 'Chemistry', label: 'Chemistry', bg: '#FFEDD5', text: '#9A3412', bgDark: 'rgba(154,52,18,0.20)', textDark: '#FDBA74' }, // orange
  { id: 'Biology', label: 'Biology', bg: '#DCFCE7', text: '#166534', bgDark: 'rgba(22,101,52,0.20)', textDark: '#86EFAC' }, // green
  { id: 'Economics', label: 'Economics', bg: '#FEF3C7', text: '#92400E', bgDark: 'rgba(146,64,14,0.22)', textDark: '#FDE68A' }, // amber
  { id: 'Government', label: 'Government', bg: '#E0E7FF', text: '#3730A3', bgDark: 'rgba(55,48,163,0.22)', textDark: '#C7D2FE' }, // indigo
  { id: 'Literature', label: 'Literature', bg: '#FCE7F3', text: '#9D174D', bgDark: 'rgba(157,23,77,0.20)', textDark: '#F9A8D4' }, // pink
  { id: 'Geography', label: 'Geography', bg: '#E0F2FE', text: '#0369A1', bgDark: 'rgba(3,105,161,0.22)', textDark: '#7DD3FC' }, // sky
  { id: 'Agric', label: 'Agric', bg: '#DCFCE7', text: '#15803D', bgDark: 'rgba(21,128,61,0.20)', textDark: '#86EFAC' }, // green
  { id: 'Civic Ed', label: 'Civic Ed', bg: '#F1F5F9', text: '#334155', bgDark: 'rgba(51,65,85,0.22)', textDark: '#CBD5E1' }, // slate
]

function initials(name: string) {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return 'U'
  const a = words[0]?.[0] || 'U'
  const b = words[1]?.[0] || ''
  return (a + b).toUpperCase()
}

function colorFromName(name: string) {
  // Deterministic palette based on characters
  const str = String(name || '')
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) % 360
  const hue = hash
  return `hsl(${hue} 80% 45%)`
}

function timeAgo(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value
  const s = formatDistanceToNow(d, { addSuffix: true })
  return s.replace(/^about\s+/i, '')
}

function timeUntil(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value
  const s = formatDistanceToNow(d, { addSuffix: false })
  return s.replace(/^about\s+/i, '')
}

function SubjectPill({
  subject,
  active,
  onClick,
  isDark,
}: {
  subject: SubjectDef
  active: boolean
  isDark: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap"
      style={{
        background: active ? '#5B4CF5' : isDark ? subject.bgDark : subject.bg,
        color: active ? '#fff' : isDark ? subject.textDark : subject.text,
        borderColor: active ? '#5B4CF5' : isDark ? 'rgba(148,163,184,0.35)' : 'rgba(232,234,237,1)',
      }}
    >
      {subject.label}
    </button>
  )
}

function AvatarCircle({ name, size = 38 }: { name: string; size?: number }) {
  const c = colorFromName(name)
  return (
    <div
      className="rounded-full flex items-center justify-center font-black text-white"
      style={{ width: size, height: size, backgroundColor: c }}
      aria-hidden
    >
      {initials(name)}
    </div>
  )
}

function PollCard({
  post,
  myUid,
  onVote,
}: {
  post: CommunityPost
  myUid: string
  onVote: (optionIndex: number) => void
}) {
  const poll = post.poll
  const endsAt = poll?.endsAt ? new Date(poll.endsAt) : null
  const isEnded = endsAt ? endsAt.getTime() < Date.now() : false
  const options = poll?.options || []

  const yourVoteIndex = useMemo(() => {
    if (!myUid) return -1
    return options.findIndex((o) => (o.votes || []).includes(myUid))
  }, [options, myUid])

  const [changeMode, setChangeMode] = useState(false)

  const votesTotal = options.reduce((sum, o) => sum + (o.votes?.length || 0), 0)

  return (
    <div className="mt-3 rounded-[14px] border border-[#E8EAED] bg-white dark:bg-slate-900/60 dark:border-gray-700">
      <div className="px-4 py-3">
        <div className="text-sm font-black text-[#0F172A] dark:text-white mb-3">{poll?.question}</div>

        {/* Before vote: radio selection */}
        {!isEnded && yourVoteIndex < 0 && (
          <div className="space-y-2">
            {options.map((o, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name={`poll-${post._id}`}
                  checked={idx === yourVoteIndex}
                  onChange={() => onVote(idx)}
                />
                <span className="text-sm text-[#0F172A] dark:text-white">{o.text}</span>
              </label>
            ))}
          </div>
        )}

        {/* After vote / results mode */}
        {(isEnded || yourVoteIndex >= 0) && (
          <div className="space-y-3">
            <div className="space-y-2">
              {options.map((o, idx) => {
                const count = o.votes?.length || 0
                const pct = votesTotal > 0 ? Math.round((count / votesTotal) * 100) : 0
                const selected = idx === yourVoteIndex
                const barColor = selected ? '#5B4CF5' : 'rgba(91,76,245,0.12)'
                return (
                  <div key={idx} className="flex items-center gap-3">
                  <div className="w-16 text-xs font-black text-slate-700 dark:text-slate-200">
                      {selected ? '●' : '○'} {o.text?.slice(0, 10)}
                    </div>
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-[#EEF2FF] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-[width] duration-600 ease"
                          style={{ width: `${pct}%`, background: barColor }}
                        />
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                        {pct}% ({count} votes)
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold">{votesTotal} votes</span>
              {endsAt && (
                <span className="font-bold">
                  {isEnded ? `Ended ${timeAgo(endsAt)}` : `Ends in ${timeUntil(endsAt)}`}
                </span>
              )}
            </div>

            {!isEnded && yourVoteIndex >= 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs font-bold text-[#5B4CF5]"
                  onClick={() => setChangeMode((v) => !v)}
                >
                  {changeMode ? 'Cancel change' : 'Change vote'}
                </button>
              </div>
            )}

            {!isEnded && yourVoteIndex >= 0 && changeMode && (
              <div className="space-y-2">
                {options.map((o, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name={`poll-${post._id}-change`}
                      checked={idx === yourVoteIndex}
                      onChange={() => onVote(idx)}
                    />
                    <span className="text-sm text-[#0F172A] dark:text-white">{o.text}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ToastHost({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 px-4">
      <div className="bg-[#0F172A] text-white text-sm font-bold px-4 py-2 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
        {message}
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const { user } = useAuthStore()
  const { toast, showToast } = useToast(2000)

  const myUid = user?.uid || ''

  const [isDarkMode, setIsDarkMode] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    const sync = () => setIsDarkMode(root.classList.contains('dark'))
    sync()
    const obs = new MutationObserver(sync)
    obs.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const [subject, setSubject] = useState<string>('All')

  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [commentsByPostId, setCommentsByPostId] = useState<Record<string, any[]>>({})
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({})

  // Composer
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerType, setComposerType] = useState<'post' | 'poll'>('post')
  const [composerContent, setComposerContent] = useState('')
  const [composerSubject, setComposerSubject] = useState<string>('Mathematics')
  const [composerImage, setComposerImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)

  // Edit existing post (author-only)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editSubject, setEditSubject] = useState<string>('Mathematics')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<string | null>(null)
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null)
  const [editingImageUploading, setEditingImageUploading] = useState(false)

  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState<string[]>(['', '', '', ''])
  const [pollEndsAt, setPollEndsAt] = useState<string>('') // YYYY-MM-DD

  const pollEndedInvalid = useMemo(() => {
    if (!pollEndsAt) return false
    const d = new Date(pollEndsAt)
    return Number.isNaN(d.getTime()) ? false : d.getTime() < Date.now()
  }, [pollEndsAt])

  useEffect(() => {
    setComposerSubject(subject === 'All' ? 'Mathematics' : subject)
  }, [subject])

  const resetComposer = useCallback(() => {
    setComposerOpen(false)
    setComposerType('post')
    setComposerContent('')
    setComposerImage(null)
    setImagePreviewUrl(null)
    setUploadedImageUrl(null)
    setPollQuestion('')
    setPollOptions(['', '', '', ''])
    setPollEndsAt('')
    setUploadingImage(false)
  }, [])

  const startEditPost = useCallback((post: CommunityPost) => {
    if (editImagePreviewUrl) URL.revokeObjectURL(editImagePreviewUrl)
    setEditingPostId(post._id)
    setEditContent(post.content || '')
    setEditSubject(post.subject || 'Mathematics')
    setEditImageFile(null)
    setEditImagePreviewUrl(null)
    setEditImageUrl(post.imageUrl || null)
    setEditingImageUploading(false)
  }, [editImagePreviewUrl])

  const cancelEditPost = useCallback(() => {
    if (editImagePreviewUrl) URL.revokeObjectURL(editImagePreviewUrl)
    setEditingPostId(null)
    setEditContent('')
    setEditSubject('Mathematics')
    setEditImageFile(null)
    setEditImagePreviewUrl(null)
    setEditImageUrl(null)
    setEditingImageUploading(false)
  }, [editImagePreviewUrl])

  const handleEditImagePick = useCallback(
    (file: File | null) => {
      // Revoke previous preview URL to avoid leaks
      if (editImagePreviewUrl) URL.revokeObjectURL(editImagePreviewUrl)
      setEditImageFile(file)
      if (!file) {
        setEditImagePreviewUrl(null)
        return
      }
      setEditImagePreviewUrl(URL.createObjectURL(file))
    },
    [editImagePreviewUrl],
  )

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted?.[0]
    if (!file) return
    setComposerImage(file)
    setUploadedImageUrl(null)
    const url = URL.createObjectURL(file)
    setImagePreviewUrl(url)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    maxFiles: 1,
  })

  const loadPosts = useCallback(
    async ({ nextPage, mode }: { nextPage: number; mode: 'replace' | 'append' }) => {
      try {
        if (mode === 'replace') setInitialLoading(true)
        if (mode === 'append') setLoadingMore(true)

        const res = await communityApi.getPosts({
          page: nextPage,
          limit: 10,
          subject,
        })

        const data = res.data as {
          posts: CommunityPost[]
          totalPages: number
          totalPosts?: number
        }

        if (mode === 'replace') setPosts(data.posts || [])
        else setPosts((prev) => [...prev, ...(data.posts || [])])

        setTotalPages(data.totalPages || 1)
        if (mode === 'replace') setPage(nextPage)
      } catch (e: any) {
        showToast(e?.message || 'Something went wrong, try again')
      } finally {
        if (mode === 'replace') setInitialLoading(false)
        if (mode === 'append') setLoadingMore(false)
      }
    },
    [showToast, subject],
  )

  useEffect(() => {
    void loadPosts({ nextPage: 1, mode: 'replace' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject])

  const activeToday = useMemo(() => {
    const seen = new Set<string>()
    const list: { name: string }[] = []
    for (const p of posts) {
      if (!p.authorName) continue
      if (seen.has(p.authorName)) continue
      seen.add(p.authorName)
      list.push({ name: p.authorName })
      if (list.length >= 5) break
    }
    return list
  }, [posts])

  const handleLike = useCallback(
    async (postId: string) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== postId) return p
          const nextLiked = !p.isLiked
          const nextLikesCount = p.likesCount + (nextLiked ? 1 : -1)
          return { ...p, isLiked: nextLiked, likesCount: Math.max(0, nextLikesCount) }
        })
      )

      // Sync with backend; revert on failure.
      const previous = posts.find((p) => p._id === postId)
      try {
        const res = await communityApi.likePost(postId)
        const data = res.data as { liked: boolean; likesCount: number }
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, isLiked: data.liked, likesCount: data.likesCount } : p)))
      } catch (e) {
        if (previous) {
          setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, isLiked: previous.isLiked, likesCount: previous.likesCount } : p)))
        }
        showToast('Something went wrong, try again')
      }
    },
    [myUid, posts, showToast],
  )

  const handleShare = useCallback(async (postId: string) => {
    const url = `${window.location.href.split('?')[0]}?post=${postId}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('Post shared! Link copied.')
    } catch {
      showToast('Something went wrong, try again')
    }
  }, [showToast])

  const handleDelete = useCallback(
    async (postId: string) => {
      const target = posts.find((p) => p._id === postId)
      if (!target) return
      const ok = window.confirm('Delete this post?')
      if (!ok) return

      try {
        await communityApi.deletePost(postId)
        setPosts((prev) => prev.filter((p) => p._id !== postId))
        showToast('Post deleted')
      } catch {
        showToast('Something went wrong, try again')
      }
    },
    [posts, showToast],
  )

  const submitEdit = useCallback(
    async (postId: string) => {
      const trimmed = editContent.trim()
      if (!trimmed) return

      const prev = posts.find((p) => p._id === postId)
      if (!prev) return

      let nextImageUrl: string | null = editImageFile ? null : editImageUrl
      if (editImageFile) {
        // Upload selected image before updating the post
        setEditingImageUploading(true)
        try {
          const res = await communityApi.uploadImage(editImageFile)
          const data = res.data as { imageUrl?: string }
          nextImageUrl = data.imageUrl || null
        } catch (e: any) {
          showToast(e?.message || 'Something went wrong, try again')
          return
        } finally {
          setEditingImageUploading(false)
        }
      }

      const payload = {
        content: trimmed,
        subject: editSubject ? editSubject : null,
        imageUrl: nextImageUrl,
      }

      // Optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === postId
            ? {
                ...p,
                content: payload.content,
                subject: payload.subject,
                imageUrl: payload.imageUrl,
              }
            : p,
        ),
      )

      try {
        const res = await communityApi.updatePost(postId, payload)
        const data = res.data as { post: CommunityPost }
        setPosts((prevPosts) => prevPosts.map((p) => (p._id === postId ? data.post : p)))
        showToast('Post updated')
        setEditingPostId(null)
      } catch {
        // Revert on error
        if (prev) {
          setPosts((prevPosts) => prevPosts.map((p) => (p._id === postId ? prev : p)))
        }
        showToast('Something went wrong, try again')
      }
    },
    [
      editContent,
      editSubject,
      editImageFile,
      editImageUrl,
      posts,
      showToast,
    ],
  )

  const toggleComments = useCallback(
    async (postId: string) => {
      setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }))

      // Lazy load on expand
      if (!commentsByPostId[postId]) {
        setCommentsLoading((prev) => ({ ...prev, [postId]: true }))
        try {
          const res = await communityApi.getComments(postId)
          const data = res.data as { comments: any[] }
          setCommentsByPostId((prev) => ({ ...prev, [postId]: data.comments || [] }))
        } catch {
          showToast('Something went wrong, try again')
        } finally {
          setCommentsLoading((prev) => ({ ...prev, [postId]: false }))
        }
      }
    },
    [commentsByPostId, showToast],
  )

  const submitComment = useCallback(
    async (postId: string) => {
      const content = (commentDrafts[postId] || '').trim()
      if (!content) return
      if (content.length > 500) return

      const prevComments = commentsByPostId[postId] || []
      const optimisticComment = {
        _id: `temp-comment-${Date.now()}`,
        postId,
        authorId: myUid,
        authorName: user?.name || 'Student',
        authorAvatar: initials(user?.name || 'Student'),
        content,
        likes: [],
        createdAt: new Date().toISOString(),
      }

      setCommentsByPostId((prev) => ({ ...prev, [postId]: [...prevComments, optimisticComment] }))
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }))
      setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p)))

      try {
        const res = await communityApi.addComment(postId, content)
        const data = res.data as { success: boolean; comment: any }
        setCommentsByPostId((prev) => ({
          ...prev,
          [postId]: (prev[postId] || []).map((c) => (String(c._id).startsWith('temp-comment') ? data.comment : c)),
        }))
      } catch {
        showToast('Something went wrong, try again')
        // If comment failed, keep optimistic (simple) or revert by reloading; here we revert by filtering temp.
        setCommentsByPostId((prev) => ({
          ...prev,
          [postId]: (prev[postId] || []).filter((c) => !String(c._id).startsWith('temp-comment')),
        }))
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p)))
      }
    },
    [commentDrafts, commentsByPostId, myUid, showToast, user?.name],
  )

  const validComposer = useMemo(() => {
    if (!composerOpen) return false
    if (!composerContent.trim()) return false
    if (composerType === 'post') return true
    const questionOk = pollQuestion.trim().length > 0
    const optionsOk = pollOptions.map((o) => o.trim()).filter(Boolean).length >= 2
    const endsOk = !!pollEndsAt && !pollEndedInvalid
    return questionOk && optionsOk && endsOk
  }, [composerContent, composerOpen, composerType, pollEndsAt, pollEndedInvalid, pollOptions, pollQuestion])

  const uploadImageIfNeeded = useCallback(async () => {
    if (!composerImage) return uploadedImageUrl
    if (uploadedImageUrl) return uploadedImageUrl
    setUploadingImage(true)
    try {
      const res = await communityApi.uploadImage(composerImage)
      const data = res.data as { imageUrl?: string }
      const url = data.imageUrl || null
      setUploadedImageUrl(url)
      return url
    } catch (e: any) {
      showToast(e?.message || 'Something went wrong, try again')
      return null
    } finally {
      setUploadingImage(false)
    }
  }, [composerImage, showToast, uploadedImageUrl])

  const submitPost = useCallback(
    async () => {
      if (!validComposer) return
      const tempId = `temp-post-${Date.now()}`

      const yourPostType = composerType
      const pollOptionsTrimmed = pollOptions.map((o) => o.trim()).filter(Boolean)

      const optimistic: CommunityPost = {
        _id: tempId,
        authorId: myUid,
        authorName: user?.name || 'Student',
        authorAvatar: user?.name ? initials(user.name) : null,
        content: composerContent.trim(),
        imageUrl: uploadedImageUrl || null,
        subject: composerSubject || null,
        type: yourPostType,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        poll:
          yourPostType === 'poll'
            ? {
                question: pollQuestion.trim(),
                options: pollOptionsTrimmed.map((t) => ({
                  text: t,
                  votes: [],
                })),
                endsAt: pollEndsAt ? new Date(pollEndsAt + 'T23:59:59.000Z').toISOString() : null,
              }
            : undefined,
        createdAt: new Date().toISOString(),
      }

      setPosts((prev) => [optimistic, ...prev])
      resetComposer()

      try {
        const imageUrl = await uploadImageIfNeeded()
        const payload =
          yourPostType === 'post'
            ? ({
                content: optimistic.content,
                subject: optimistic.subject,
                imageUrl,
                type: 'post' as const,
              })
            : ({
                content: optimistic.content,
                subject: optimistic.subject,
                imageUrl,
                type: 'poll' as const,
                poll: {
                  question: pollQuestion.trim(),
                  options: pollOptionsTrimmed.map((t) => ({ text: t })),
                  endsAt: new Date(pollEndsAt + 'T23:59:59.000Z').toISOString(),
                },
              })

        const res = await communityApi.createPost(payload)
        const data = res.data as { post: CommunityPost; success?: boolean }
        setPosts((prev) => prev.map((p) => (p._id === tempId ? { ...(data.post as any) } : p)))
      } catch {
        setPosts((prev) => prev.filter((p) => p._id !== tempId))
        showToast('Something went wrong, try again')
      }
    },
    [
      composerContent,
      composerSubject,
      composerType,
      myUid,
      pollEndsAt,
      pollOptions,
      pollQuestion,
      resetComposer,
      showToast,
      uploadImageIfNeeded,
      uploadedImageUrl,
      user?.name,
      validComposer,
    ],
  )

  const votePoll = useCallback(
    async (postId: string, optionIndex: number) => {
      try {
        const previous = posts.find((p) => p._id === postId)
        if (!previous?.poll) return

        // Optimistic update: adjust votes arrays to reflect new counts + your vote selection.
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id !== postId || !p.poll) return p
            const options = p.poll.options.map((o) => ({ ...o }))
            options.forEach((o) => {
              o.votes = (o.votes || []).filter((v) => v !== myUid)
            })
            const target = options[optionIndex]
            target.votes = (target.votes || []).filter((v) => v !== myUid)
            target.votes.push(myUid)
            return { ...p, poll: { ...p.poll, options } }
          })
        )

        const res = await communityApi.votePoll(postId, optionIndex)
        const data = res.data as { options: { text: string; votesCount: number }[]; yourVoteIndex: number }
        const updatedPoll = {
          ...previous.poll,
          options: data.options.map((o, idx) => {
            const isMine = idx === data.yourVoteIndex
            const base = Array(Math.max(0, o.votesCount - (isMine ? 1 : 0))).fill('x')
            return { text: o.text, votes: isMine ? [myUid, ...base] : base }
          }),
        }

        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, poll: updatedPoll } : p)))
        showToast('Voted!')
      } catch {
        showToast('Something went wrong, try again')
      }
    },
    [myUid, posts, showToast],
  )

  // Deep-link support: if URL has ?post=ID, expand comments section automatically.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const postId = params.get('post')
    if (!postId) return
    setOpenComments((prev) => ({ ...prev, [postId]: true }))
  }, [])

  // If comments were opened via deep-link, load them lazily once.
  useEffect(() => {
    const ids = Object.keys(openComments).filter((id) => openComments[id] && !commentsByPostId[id] && !commentsLoading[id])
    if (ids.length === 0) return

    ids.forEach((postId) => {
      setCommentsLoading((prev) => ({ ...prev, [postId]: true }))
      communityApi
        .getComments(postId)
        .then((res) => {
          const data = res.data as { comments: any[] }
          setCommentsByPostId((prev) => ({ ...prev, [postId]: data.comments || [] }))
        })
        .catch(() => {
          showToast('Something went wrong, try again')
        })
        .finally(() => {
          setCommentsLoading((prev) => ({ ...prev, [postId]: false }))
        })
    })
  }, [commentsByPostId, commentsLoading, openComments, showToast])

  const canLoadMore = page < totalPages

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 dark:text-white py-6 px-4 pb-28">
        <div className="flex items-center justify-between max-w-[1120px] mx-auto">
          <div className="flex items-center gap-3">
            <BackButton label="Back" href="/dashboard/student" />
          </div>
          <div className="flex items-center gap-2 font-black text-[#0F172A] dark:text-white">
            <div className="p-2 rounded-2xl bg-violet-100 text-[#5B4CF5] shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="text-base md:text-lg">StudyHelp Community</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">{user?.name}</div>
            </div>
            <AvatarCircle name={user?.name || 'Student'} size={38} />
          </div>
        </div>

        <div className="max-w-[1120px] mx-auto mt-6 flex flex-col lg:flex-row gap-6">
          {/* LEFT: Subject sidebar */}
          <aside className="w-full lg:w-[240px] lg:shrink-0">
            {/* Mobile chips */}
            <div className="lg:hidden overflow-x-auto pb-2">
              <div className="flex gap-2">
                {SUBJECTS.map((s) => (
                  <SubjectPill
                    key={s.id}
                    subject={s}
                    active={subject === s.id}
                    isDark={isDarkMode}
                    onClick={() => setSubject(s.id)}
                  />
                ))}
              </div>
            </div>

            <div className="hidden lg:block rounded-[16px] border border-[#E8EAED] bg-white p-4 dark:bg-slate-900/60 dark:border-gray-700">
              <div className="text-sm font-black text-[#0F172A] dark:text-white mb-3">Subjects</div>
              <div className="space-y-2">
                {SUBJECTS.filter((s) => s.id !== 'All').map((s) => (
                  <SubjectPill
                    key={s.id}
                    subject={s}
                    active={subject === s.id}
                    isDark={isDarkMode}
                    onClick={() => setSubject(s.id)}
                  />
                ))}
                <SubjectPill
                  subject={SUBJECTS[0]}
                  active={subject === 'All'}
                  isDark={isDarkMode}
                  onClick={() => setSubject('All')}
                />
              </div>

              <div className="mt-6">
                <div className="text-sm font-black text-[#0F172A] dark:text-white mb-2">Active Today</div>
                <div className="flex -space-x-2">
                  {activeToday.map((u, i) => (
                    <div key={`${u.name}-${i}`} className="border-2 border-[#F7F8FA] rounded-full">
                      <AvatarCircle name={u.name} size={34} />
                    </div>
                  ))}
                  {activeToday.length === 0 && <div className="text-xs text-slate-500">No activity yet</div>}
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN feed */}
          <main className="flex-1 w-full max-w-[680px] mx-auto lg:mx-0">
            {/* Create Post Box */}
            <div
              className="rounded-[16px] border border-[#E8EAED] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] mb-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow dark:bg-slate-900/60 dark:border-gray-700"
              onClick={() => setComposerOpen(true)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-start gap-3">
                <AvatarCircle name={user?.name || 'Student'} size={42} />
                {!composerOpen ? (
                  <div className="flex-1">
                    <div className="text-sm text-slate-500">What&apos;s on your mind?</div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <textarea
                      value={composerContent}
                      onChange={(e) => setComposerContent(e.target.value)}
                      maxLength={1000}
                      placeholder="Write your post..."
                      className="w-full resize-none border border-[#E8EAED] rounded-[12px] p-3 outline-none text-sm bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                    />
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span>
                        {composerContent.length}/{1000}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-xs font-bold text-[#5B4CF5]"
                          onClick={(e) => {
                            e.stopPropagation()
                            resetComposer()
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    {/* Toggle */}
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="flex-1 min-h-[40px] rounded-[12px] border border-[#E8EAED] font-bold text-sm"
                        style={{
                          background: composerType === 'post' ? '#5B4CF5' : '#fff',
                          color: composerType === 'post' ? '#fff' : '#0F172A',
                          borderColor: composerType === 'post' ? '#5B4CF5' : '#E8EAED',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setComposerType('post')
                        }}
                      >
                        Post
                      </button>
                      <button
                        type="button"
                        className="flex-1 min-h-[40px] rounded-[12px] border border-[#E8EAED] font-bold text-sm"
                        style={{
                          background: composerType === 'poll' ? '#5B4CF5' : '#fff',
                          color: composerType === 'poll' ? '#fff' : '#0F172A',
                          borderColor: composerType === 'poll' ? '#5B4CF5' : '#E8EAED',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setComposerType('poll')
                        }}
                      >
                        Poll
                      </button>
                    </div>

                    {/* Subject + Image */}
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Subject</div>
                        <select
                          className="w-full border border-[#E8EAED] rounded-[12px] p-3 outline-none text-sm bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                          value={composerSubject}
                          onChange={(e) => setComposerSubject(e.target.value)}
                        >
                          {SUBJECTS.filter((s) => s.id !== 'All').map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Image</div>
                        <div
                          {...getRootProps()}
                          className="border border-dashed border-[#E8EAED] rounded-[12px] p-3 text-sm bg-[#F7F8FA] dark:bg-slate-900/60 dark:border-gray-700 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input {...getInputProps()} />
                          {isDragActive ? (
                            <div className="text-xs font-bold text-[#5B4CF5]">Drop the image here...</div>
                          ) : imagePreviewUrl ? (
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imagePreviewUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-[#E8EAED]" />
                              <button
                                type="button"
                                className="text-xs font-bold text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setComposerImage(null)
                                  setImagePreviewUrl(null)
                                  setUploadedImageUrl(null)
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-slate-600 dark:text-slate-300">Drag & drop, or click to upload</div>
                          )}
                          {composerImage && <div className="text-[11px] text-slate-500 mt-2">Max 5MB</div>}
                        </div>
                      </div>
                    </div>

                    {/* Poll fields */}
                    {composerType === 'poll' && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Poll question</div>
                          <input
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            className="w-full border border-[#E8EAED] rounded-[12px] p-3 outline-none text-sm bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                            placeholder="Ask a question..."
                          />
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Options</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {pollOptions.map((v, idx) => (
                              <input
                                key={idx}
                                value={v}
                                onChange={(e) => {
                                  const next = [...pollOptions]
                                  next[idx] = e.target.value
                                  setPollOptions(next)
                                }}
                                className="w-full border border-[#E8EAED] rounded-[12px] p-3 outline-none text-sm bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Expiry date</div>
                          <input
                            type="date"
                            value={pollEndsAt}
                            onChange={(e) => setPollEndsAt(e.target.value)}
                            className="w-full border border-[#E8EAED] rounded-[12px] p-3 outline-none text-sm bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          void submitPost()
                        }}
                        disabled={!validComposer || uploadingImage}
                        className="flex-1 min-h-[44px] rounded-[12px] font-bold text-sm px-4 py-2 bg-[#5B4CF5] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingImage ? 'Uploading...' : composerType === 'poll' ? 'Create Poll' : 'Post'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          resetComposer()
                        }}
                        className="min-h-[44px] rounded-[12px] border border-[#E8EAED] font-bold text-sm px-4 bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Feed */}
            {initialLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-[16px] border border-[#E8EAED] bg-white p-4 animate-pulse dark:bg-slate-900/60 dark:border-gray-700"
                  >
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-5/6 mt-3" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-10 bg-white border border-[#E8EAED] rounded-[16px] dark:bg-slate-900/60 dark:border-gray-700 dark:text-slate-300">
                No posts yet.
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post._id}
                    className="rounded-[16px] border border-[#E8EAED] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow p-4 dark:bg-slate-900/60 dark:border-gray-700"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <AvatarCircle name={post.authorName} size={42} />
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-black text-[#0F172A] dark:text-white">{post.authorName}</div>
                            {post.subject && (
                              <span
                                className="text-[11px] font-bold px-2 py-1 rounded-full"
                                style={{
                                  background:
                                    SUBJECTS.find((s) => s.id === post.subject)?.bg || '#EEF2FF',
                                  color: SUBJECTS.find((s) => s.id === post.subject)?.text || '#4F46E5',
                                }}
                              >
                                {post.subject}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1">{timeAgo(post.createdAt)}</div>
                        </div>
                      </div>

                      {post.authorId === myUid && (
                        <div className="flex items-center gap-2">
                          {editingPostId !== post._id && (
                            <button
                              type="button"
                              className="text-[#5B4CF5] hover:opacity-80"
                              onClick={() => startEditPost(post)}
                              aria-label="Edit post"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="text-red-600 hover:opacity-80"
                            onClick={() => void handleDelete(post._id)}
                            aria-label="Delete post"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    {editingPostId === post._id ? (
                      <div className="mt-3 space-y-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          maxLength={1000}
                          className="w-full resize-none border border-[#E8EAED] rounded-[12px] p-3 outline-none text-sm bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                          rows={4}
                        />
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {editContent.length}/{1000}
                          </span>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Subject</div>
                          <select
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            className="w-full border border-[#E8EAED] rounded-[12px] p-3 outline-none text-sm bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                          >
                            {SUBJECTS.filter((s) => s.id !== 'All').map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Image</div>
                          <input
                            type="file"
                            accept="image/*"
                            className="block w-full text-xs text-slate-600 dark:text-slate-300"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null
                              handleEditImagePick(file)
                            }}
                          />
                          {(editImagePreviewUrl || editImageUrl) && (
                            <div className="mt-3 flex items-start gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={editImagePreviewUrl || editImageUrl || ''}
                                alt="Edit preview"
                                className="w-16 h-16 rounded-lg object-cover border border-[#E8EAED]"
                              />
                              <button
                                type="button"
                                className="text-xs font-bold text-red-600"
                                onClick={() => {
                                  handleEditImagePick(null)
                                  setEditImageUrl(null)
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            disabled={editingImageUploading || !editContent.trim()}
                            onClick={() => void submitEdit(post._id)}
                            className="flex-1 min-h-[44px] rounded-[12px] font-bold text-sm px-4 py-2 bg-[#5B4CF5] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {editingImageUploading ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditPost}
                            className="min-h-[44px] rounded-[12px] border border-[#E8EAED] font-bold text-sm px-4 bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-[#0F172A] dark:text-white leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </div>
                    )}

                    {/* Image */}
                    {editingPostId !== post._id && post.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        className="mt-3 w-full rounded-[14px] border border-[#E8EAED] object-cover"
                      />
                    )}

                    {/* Poll */}
                    {post.type === 'poll' && post.poll && (
                      <PollCard
                        post={post}
                        myUid={myUid}
                        onVote={(idx) => {
                          void votePoll(post._id, idx)
                        }}
                      />
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                        className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200"
                          onClick={() => void handleLike(post._id)}
                        >
                          <Heart className={post.isLiked ? 'w-5 h-5 fill-[#DC2626] text-[#DC2626]' : 'w-5 h-5 text-[#DC2626]'} />
                          <span>{post.likesCount}</span>
                        </button>
                        <button
                          type="button"
                        className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200"
                          onClick={() => void toggleComments(post._id)}
                        >
                          <MessageCircle className="w-5 h-5 text-[#5B4CF5]" />
                          <span>{post.commentsCount} comments</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        className="text-sm font-bold text-[#5B4CF5] hover:opacity-80"
                        onClick={() => void handleShare(post._id)}
                      >
                        🔗 Share
                      </button>
                    </div>

                    {/* Inline comments */}
                    <div
                      className="mt-4 overflow-hidden"
                      style={{
                        maxHeight: openComments[post._id] ? 800 : 0,
                        transition: 'max-height 0.35s ease',
                      }}
                    >
                      <div className="pb-4">
                        <div className="text-sm font-black text-[#0F172A] dark:text-white mb-3">
                          Comments
                        </div>

                        {commentsLoading[post._id] ? (
                          <div className="text-sm text-slate-500">Loading comments...</div>
                        ) : (
                          <div className="space-y-3">
                            {(commentsByPostId[post._id] || []).map((c) => (
                              <div key={String(c._id)} className="flex items-start gap-3">
                                <AvatarCircle name={c.authorName || 'Student'} size={34} />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-xs font-black text-[#0F172A] dark:text-white">{c.authorName}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{timeAgo(c.createdAt)}</div>
                                  </div>
                                  <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mt-1">{c.content}</div>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                                      <Heart className="w-4 h-4 text-[#DC2626]" />
                                      {(c.likes?.length || 0).toString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {(commentsByPostId[post._id] || []).length === 0 && (
                              <div className="text-sm text-slate-500 dark:text-slate-300 py-6">No comments yet.</div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-4">
                          <input
                            value={commentDrafts[post._id] || ''}
                            onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))}
                            maxLength={500}
                            placeholder="Write a comment..."
                          className="flex-1 border border-[#E8EAED] rounded-[12px] px-3 py-2 text-sm outline-none bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                          />
                          <button
                            type="button"
                            className="min-h-[44px] rounded-[12px] px-4 font-bold bg-[#5B4CF5] text-white disabled:opacity-50"
                            disabled={!(commentDrafts[post._id] || '').trim()}
                            onClick={() => void submitComment(post._id)}
                          >
                            <Send className="w-4 h-4 inline mr-2" />
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load more */}
            {!initialLoading && posts.length > 0 && canLoadMore && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  className="min-h-[48px] px-6 rounded-[14px] bg-[#5B4CF5] text-white font-bold text-sm disabled:opacity-50"
                  disabled={loadingMore}
                  onClick={() => {
                    void loadPosts({ nextPage: page + 1, mode: 'append' }).then(() => setPage((p) => p + 1))
                  }}
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </main>

          {/* RIGHT: Leaderboard */}
          <aside className="w-full lg:w-[280px] lg:shrink-0">
            <LeaderboardPanel
              showToast={showToast}
              api={communityApi}
            />
          </aside>
        </div>

        <ToastHost message={toast?.message || null} />
      </div>
    </ProtectedRoute>
  )
}

function LeaderboardPanel({
  api,
  showToast,
}: {
  api: typeof communityApi
  showToast: (msg: string) => void
}) {
  const [leaderboard, setLeaderboard] = useState<
    {
      name: string
      avatar: string
      totalPoints: number
      cbtPoints: number
      communityPoints: number
      postsCount: number
      userId?: string
    }[]
  >([])
  const [myRank, setMyRank] = useState<number>(0)
  const [myEntry, setMyEntry] = useState<{ totalPoints: number; cbtPoints: number; communityPoints: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await api.getLeaderboard()
        const data = res.data as { leaderboard: any[]; myRank: number; myEntry: any }
        if (!alive) return
        setLeaderboard(data.leaderboard || [])
        setMyRank(data.myRank || 0)
        setMyEntry(data.myEntry || null)
      } catch (e: any) {
        if (!alive) return
        showToast(e?.message || 'Something went wrong, try again')
      } finally {
        if (!alive) return
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [api, showToast])

  const top = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="rounded-[16px] border border-[#E8EAED] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] dark:bg-slate-900/60 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-black text-[#0F172A] dark:text-white">Leaderboard</div>
        <div className="text-xs font-bold text-slate-500">🏆</div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            {[...top, ...rest].slice(0, 10).map((row, idx) => {
              const rank = idx + 1
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : ' '
              return (
                <div key={row.userId || row.name + idx} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="text-xs">{medal}</div>
                    <div className="text-sm font-black truncate text-[#0F172A] dark:text-white">{row.name}</div>
                  </div>
                  <div className="text-sm font-black text-[#0F172A] dark:text-white">{row.totalPoints.toLocaleString()} pts</div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-[#E8EAED] pt-3 mt-3">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">You</div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-black">
                #{myRank} — {myEntry?.totalPoints?.toLocaleString() || '0'} pts
              </div>
              <div
                className="text-xs font-bold text-[#5B4CF5] cursor-help"
                title={`CBT: ${(myEntry?.cbtPoints || 0).toLocaleString()} pts + Community: ${(myEntry?.communityPoints || 0).toLocaleString()} pts`}
              >
                ? 
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

