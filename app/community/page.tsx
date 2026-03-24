'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useDropzone } from 'react-dropzone'
import {
  Heart,
  MessageCircle,
  Trash2,
  Send,
  Pencil,
  Bookmark,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FiMenu,
  FiX,
  FiHome,
  FiSettings,
  FiBook,
  FiBookOpen,
  FiClock,
  FiCalendar,
  FiCreditCard,
  FiBarChart2,
  FiFileText,
  FiAward,
  FiSun,
  FiMoon,
} from 'react-icons/fi'
import { BiCard } from 'react-icons/bi'
import { MdQuiz, MdSchool } from 'react-icons/md'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { useAuthStore } from '@/lib/store/authStore'
import {
  communityApi,
  type CommunityPost,
  type CommunityGroup,
  type CommunityGroupMessage,
} from '@/lib/api/communityApi'
import { useToast } from '@/hooks/useToast'
import { useThemeStore } from '@/lib/store/themeStore'

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

  const { theme, toggleTheme } = useThemeStore()
  const isDarkMode = theme === 'dark'

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/dashboard/settings', label: 'Settings', icon: FiSettings },
    { href: '/dashboard/question-bank', label: 'Question Generator', icon: FiBook },
    { href: '/dashboard/library', label: 'My Library', icon: FiBookOpen },
    { href: '/dashboard/study-timer', label: 'Study Timer', icon: FiClock },
    { href: '/dashboard/flip-cards', label: 'Flashcard Hub', icon: BiCard },
    { href: '/dashboard/timetable', label: 'Timetable & Reminders', icon: FiCalendar },
    { href: '/dashboard/cgpa', label: 'CGPA Calculator', icon: FiCreditCard },
    { href: '/dashboard/cbt', label: 'CBT Practice', icon: MdQuiz },
    { href: '/dashboard/analytics', label: 'Progress Analytics', icon: FiBarChart2 },
    { href: '/dashboard/question-history', label: 'Quiz History', icon: FiFileText },
    { href: '/community', label: 'Community', icon: FiAward },
  ]

  const [subject, setSubject] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortMode, setSortMode] = useState<'new' | 'hot'>('new')
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])

  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [commentsByPostId, setCommentsByPostId] = useState<Record<string, any[]>>({})
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({})

  // Your community points (for gamification)
  const [myPointsLoading, setMyPointsLoading] = useState(true)
  const [myPoints, setMyPoints] = useState<{
    communityPoints: number
    cbtPoints: number
    totalPoints: number
  } | null>(null)
  const [communitySection, setCommunitySection] = useState<'feed' | 'groups'>('feed')
  const [groups, setGroups] = useState<CommunityGroup[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupMessages, setGroupMessages] = useState<Record<string, CommunityGroupMessage[]>>({})
  const [groupMessageDraft, setGroupMessageDraft] = useState('')
  const [createGroupName, setCreateGroupName] = useState('')
  const [createGroupDescription, setCreateGroupDescription] = useState('')
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [memberSearchResults, setMemberSearchResults] = useState<Array<{ uid: string; name: string; email: string; avatar: string }>>([])

  // Like "bump" micro-interaction
  const [likeBumpPostId, setLikeBumpPostId] = useState<string | null>(null)
  const likeBumpTimerRef = useRef<number | null>(null)

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

  // Bookmarks are client-side only (stored locally).
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem('community_bookmarks_v1')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setBookmarkedIds(parsed.filter((x) => typeof x === 'string'))
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('community_bookmarks_v1', JSON.stringify(bookmarkedIds))
    } catch {
      /* ignore */
    }
  }, [bookmarkedIds])

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

  // Fetch my points once (from leaderboard endpoint).
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setMyPointsLoading(true)
        const res = await communityApi.getLeaderboard()
        const data = res.data as { myEntry?: any }
        if (!alive) return
        const entry = data?.myEntry
        if (!entry) {
          setMyPoints({ communityPoints: 0, cbtPoints: 0, totalPoints: 0 })
          return
        }
        setMyPoints({
          communityPoints: entry.communityPoints || 0,
          cbtPoints: entry.cbtPoints || 0,
          totalPoints: entry.totalPoints || 0,
        })
      } catch {
        if (!alive) return
        // Keep UI functional even if points fail.
        setMyPoints({ communityPoints: 0, cbtPoints: 0, totalPoints: 0 })
      } finally {
        if (!alive) return
        setMyPointsLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [user?.uid])

  const loadGroups = useCallback(async () => {
    try {
      setGroupsLoading(true)
      const res = await communityApi.getGroups()
      const data = res.data as { groups?: CommunityGroup[] }
      const next = data.groups || []
      setGroups(next)
      if (!selectedGroupId && next.length) setSelectedGroupId(next[0]._id)
    } catch {
      showToast('Something went wrong, try again')
    } finally {
      setGroupsLoading(false)
    }
  }, [selectedGroupId, showToast])

  useEffect(() => {
    if (communitySection !== 'groups') return
    void loadGroups()
  }, [communitySection, loadGroups])

  const selectedGroup = useMemo(
    () => groups.find((g) => g._id === selectedGroupId) || null,
    [groups, selectedGroupId],
  )

  const loadGroupMessages = useCallback(
    async (groupId: string) => {
      try {
        const res = await communityApi.getGroupMessages(groupId)
        const data = res.data as { messages?: CommunityGroupMessage[] }
        setGroupMessages((prev) => ({ ...prev, [groupId]: data.messages || [] }))
      } catch {
        showToast('Something went wrong, try again')
      }
    },
    [showToast],
  )

  useEffect(() => {
    if (!selectedGroupId || communitySection !== 'groups') return
    void loadGroupMessages(selectedGroupId)
  }, [selectedGroupId, communitySection, loadGroupMessages])

  useEffect(() => {
    let alive = true
    if (communitySection !== 'groups') return
    const q = memberSearchQuery.trim()
    if (q.length < 2) {
      setMemberSearchResults([])
      return
    }
    ;(async () => {
      try {
        const res = await communityApi.searchUsers(q)
        const data = res.data as { users?: Array<{ uid: string; name: string; email: string; avatar: string }> }
        if (!alive) return
        setMemberSearchResults(data.users || [])
      } catch {
        if (!alive) return
        setMemberSearchResults([])
      }
    })()
    return () => {
      alive = false
    }
  }, [communitySection, memberSearchQuery])

  const handleCreateGroup = useCallback(async () => {
    const name = createGroupName.trim()
    if (!name) return
    try {
      const res = await communityApi.createGroup({
        name,
        description: createGroupDescription.trim() || undefined,
      })
      const data = res.data as { group?: CommunityGroup }
      if (data.group) {
        setGroups((prev) => [data.group!, ...prev])
        setSelectedGroupId(data.group._id)
      }
      setCreateGroupName('')
      setCreateGroupDescription('')
      showToast('Study group created')
    } catch {
      showToast('Something went wrong, try again')
    }
  }, [createGroupName, createGroupDescription, showToast])

  const handleAddMember = useCallback(
    async (uid: string) => {
      if (!selectedGroupId) return
      try {
        const res = await communityApi.addGroupMember(selectedGroupId, uid)
        const data = res.data as { group?: CommunityGroup }
        if (data.group) {
          setGroups((prev) => prev.map((g) => (g._id === selectedGroupId ? data.group! : g)))
          showToast('Member added')
        }
      } catch {
        showToast('Something went wrong, try again')
      }
    },
    [selectedGroupId, showToast],
  )

  const handleSendGroupMessage = useCallback(async () => {
    const txt = groupMessageDraft.trim()
    if (!txt || !selectedGroupId) return
    try {
      const res = await communityApi.sendGroupMessage(selectedGroupId, txt)
      const data = res.data as { message?: CommunityGroupMessage }
      setGroupMessageDraft('')
      if (data.message) {
        setGroupMessages((prev) => ({
          ...prev,
          [selectedGroupId]: [...(prev[selectedGroupId] || []), data.message!],
        }))
      } else {
        void loadGroupMessages(selectedGroupId)
      }
    } catch {
      showToast('Something went wrong, try again')
    }
  }, [groupMessageDraft, selectedGroupId, loadGroupMessages, showToast])

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

  const trendingSubjects = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of posts) {
      const s = p.subject
      if (!s || s === 'All') continue
      counts[s] = (counts[s] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([subject, count]) => ({ subject, count }))
  }, [posts])

  const bookmarkedSet = useMemo(() => new Set(bookmarkedIds), [bookmarkedIds])

  const computeHotScore = useCallback((p: CommunityPost) => {
    const pollVotes =
      p.poll?.options?.reduce((sum, o) => sum + (o.votes?.length || 0), 0) || 0
    return p.likesCount * 2 + p.commentsCount * 3 + pollVotes
  }, [])

  const visiblePosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = posts

    if (q) {
      list = list.filter((p) => {
        const hay = `${p.authorName || ''} ${p.subject || ''} ${p.content || ''}`.toLowerCase()
        return hay.includes(q)
      })
    }

    const sorted = [...list]
    if (sortMode === 'hot') {
      sorted.sort((a, b) => computeHotScore(b) - computeHotScore(a) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return sorted
  }, [posts, searchQuery, sortMode, computeHotScore])

  const handleLike = useCallback(
    async (postId: string) => {
      if (likeBumpTimerRef.current) window.clearTimeout(likeBumpTimerRef.current)
      setLikeBumpPostId(postId)
      likeBumpTimerRef.current = window.setTimeout(() => setLikeBumpPostId(null), 500)

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
        showToast(data.liked ? 'Liked! +2 community pts' : 'Unliked. -2 community pts')
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

  const toggleBookmark = useCallback(
    (postId: string) => {
      setBookmarkedIds((prev) => {
        const has = prev.includes(postId)
        const next = has ? prev.filter((x) => x !== postId) : [...prev, postId]
        // Immediate feedback feels snappy.
        showToast(has ? 'Removed bookmark' : 'Saved bookmark')
        return next
      })
    },
    [showToast],
  )

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
        showToast('Comment added! +3 community pts')
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
        showToast(`${composerType === 'poll' ? 'Poll created' : 'Posted'}! +5 community pts`)
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
        showToast('Voted! +1 community pts')
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
          <ProtectedRoute allowedRoles={['student', 'admin']}>
      <div className={`min-h-screen bg-[#F7F8FA] dark:bg-slate-950 dark:text-white ${isDarkMode ? 'dark' : ''}`}>
        {/* Top navbar */}
        <nav className="fixed top-0 left-0 right-0 min-h-14 sm:min-h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 pt-[env(safe-area-inset-top)]">
          <div className="h-full px-3 sm:px-4 flex items-center justify-between min-w-0 w-full">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition lg:hidden"
                onClick={() => setSidebarOpen((v) => !v)}
                aria-label="Open menu"
              >
                {sidebarOpen ? <FiX className="text-xl text-gray-700 dark:text-gray-300" /> : <FiMenu className="text-xl text-gray-700 dark:text-gray-300" />}
              </button>

              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <MdSchool className="text-white text-xl" />
                </div>
                <span className="font-bold text-lg hidden sm:block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  StudyHelp
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                {isDarkMode ? (
                  <FiSun className="text-xl text-yellow-400" />
                ) : (
                  <FiMoon className="text-xl text-gray-600" />
                )}
              </button>

              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">{user?.name}</div>
              </div>
              <AvatarCircle name={user?.name || 'Student'} size={34} />
            </div>
          </div>
        </nav>

        {/* Mobile overlay */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-[45] lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Left sidebar */}
        <aside
          className={`fixed top-14 sm:top-16 left-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-[50] transition-transform duration-300 overflow-hidden
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
        >
          <div className="h-full overflow-y-auto py-4">
            <nav className="space-y-1 px-3 min-w-0">
              {navItems.map((item) => {
                const Icon = item.icon as any
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition min-w-0 ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`text-lg flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                    <span className="break-words min-w-0 flex-1">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        <main className="pt-[calc(3.5rem+env(safe-area-inset-top))] sm:pt-[calc(4rem+env(safe-area-inset-top))] lg:pl-64 min-w-0 w-full overflow-x-hidden">
          <div className="p-4 pb-28">
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

              {trendingSubjects.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-black text-[#0F172A] dark:text-white mb-2">Trending now</div>
                  <div className="flex flex-wrap gap-2">
                    {trendingSubjects.map((t) => (
                      <button
                        key={t.subject}
                        type="button"
                        onClick={() => setSubject(t.subject)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap"
                        style={{
                          background: isDarkMode ? 'rgba(91,76,245,0.22)' : 'rgba(91,76,245,0.12)',
                          color: isDarkMode ? '#A5B4FC' : '#5B4CF5',
                          borderColor: isDarkMode ? 'rgba(91,76,245,0.35)' : 'rgba(232,234,237,1)',
                        }}
                      >
                        {t.subject} · {t.count}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 rounded-[16px] border border-[#E8EAED] bg-white p-4 dark:bg-slate-900/60 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-[#0F172A] dark:text-white">My Community Points</div>
                  <div className="text-xs font-bold text-[#5B4CF5]">+2/+3</div>
                </div>

                {myPointsLoading ? (
                  <div className="mt-3 space-y-2">
                    <div className="h-4 bg-slate-100 dark:bg-gray-800 rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-slate-100 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="mt-3 text-lg font-black text-[#0F172A] dark:text-white">
                      {myPoints?.communityPoints?.toLocaleString() || 0} pts
                    </div>
                    <div
                      className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-help"
                      title={`Community: ${(myPoints?.communityPoints || 0).toLocaleString()} pts (CBT points are separate)`}
                    >
                      Community: {(myPoints?.communityPoints || 0).toLocaleString()}
                    </div>
                  </>
                )}
              </div>

              {/* Optional extra: show total points subtly */}
              {!myPointsLoading && (
                <div className="mt-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                  Total points: {myPoints?.totalPoints?.toLocaleString() || 0} pts
                </div>
              )}
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
                        <input
                          value={composerSubject}
                          onChange={(e) => setComposerSubject(e.target.value)}
                          className="w-full border border-[#E8EAED] rounded-[12px] p-3 outline-none text-sm bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                          placeholder="Type a subject (e.g., Biology)"
                          maxLength={40}
                        />
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

            <div className="mb-4 flex items-center gap-2 rounded-[14px] border border-[#E8EAED] bg-white p-2 dark:bg-slate-900/60 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setCommunitySection('feed')}
                className={`px-4 py-2 rounded-[10px] text-sm font-bold ${
                  communitySection === 'feed' ? 'bg-[#5B4CF5] text-white' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                Feed
              </button>
              <button
                type="button"
                onClick={() => setCommunitySection('groups')}
                className={`px-4 py-2 rounded-[10px] text-sm font-bold ${
                  communitySection === 'groups' ? 'bg-[#5B4CF5] text-white' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                Study Groups
              </button>
            </div>

            {/* Feed */}
            <div className={communitySection === 'feed' ? '' : 'hidden'}>
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts, subjects, or people..."
                  className="w-full border border-[#E8EAED] rounded-[14px] px-4 py-3 outline-none text-sm bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSortMode('new')}
                  className={`min-h-[44px] px-4 rounded-[14px] border font-bold text-sm whitespace-nowrap ${
                    sortMode === 'new'
                      ? 'bg-[#5B4CF5] text-white border-[#5B4CF5]'
                      : 'bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-slate-200 border-[#E8EAED] text-slate-700'
                  }`}
                >
                  Newest
                </button>
                <button
                  type="button"
                  onClick={() => setSortMode('hot')}
                  className={`min-h-[44px] px-4 rounded-[14px] border font-bold text-sm whitespace-nowrap ${
                    sortMode === 'hot'
                      ? 'bg-[#5B4CF5] text-white border-[#5B4CF5]'
                      : 'bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-slate-200 border-[#E8EAED] text-slate-700'
                  }`}
                >
                  Hot
                </button>
              </div>
            </div>
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
                {visiblePosts.length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-10 bg-white border border-[#E8EAED] rounded-[16px] dark:bg-slate-900/60 dark:border-gray-700 dark:text-slate-300">
                    No results{searchQuery.trim() ? ` for “${searchQuery.trim()}”` : ''}.
                  </div>
                ) : (
                  visiblePosts.map((post) => (
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
                            {post.authorRole === 'admin' && post.authorIsVerified && (
                              <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                                Verified Admin
                              </span>
                            )}
                            {post.subject && (
                              <span
                                className="text-[11px] font-bold px-2 py-1 rounded-full"
                                style={(() => {
                                  const def = SUBJECTS.find((s) => s.id === post.subject)
                                  const bg = def?.bg || '#EEF2FF'
                                  const text = def?.text || '#4F46E5'
                                  const bgDark = def?.bgDark || 'rgba(79,70,229,0.18)'
                                  const textDark = def?.textDark || '#A5B4FC'
                                  return {
                                    background: isDarkMode ? bgDark : bg,
                                    color: isDarkMode ? textDark : text,
                                  }
                                })()}
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
                          <input
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            className="w-full border border-[#E8EAED] rounded-[12px] p-3 outline-none text-sm bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                            placeholder="Type a subject (e.g., Biology)"
                            maxLength={40}
                          />
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
                          className={`flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 transition-transform ${likeBumpPostId === post._id ? 'scale-110' : 'scale-100'}`}
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

                      <button
                        type="button"
                        className="text-sm font-bold flex items-center gap-2 hover:opacity-80"
                        onClick={() => toggleBookmark(post._id)}
                        aria-label="Bookmark post"
                      >
                        <Bookmark
                          className="w-5 h-5"
                          fill={bookmarkedSet.has(post._id) ? '#5B4CF5' : 'transparent'}
                          color={bookmarkedSet.has(post._id) ? '#5B4CF5' : undefined}
                        />
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
                  ))
                )}
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
            </div>

            <div className={communitySection === 'groups' ? 'space-y-4' : 'hidden'}>
              <div className="rounded-[16px] border border-[#E8EAED] bg-white p-4 dark:bg-slate-900/60 dark:border-gray-700">
                <div className="text-sm font-black text-[#0F172A] dark:text-white mb-3">Create Study Group</div>
                <div className="grid gap-3">
                  <input
                    value={createGroupName}
                    onChange={(e) => setCreateGroupName(e.target.value)}
                    placeholder="Group name (e.g. WAEC Chemistry Squad)"
                    className="w-full border border-[#E8EAED] rounded-[12px] px-3 py-2 text-sm outline-none bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                  />
                  <textarea
                    value={createGroupDescription}
                    onChange={(e) => setCreateGroupDescription(e.target.value)}
                    placeholder="What this group is for"
                    rows={2}
                    className="w-full border border-[#E8EAED] rounded-[12px] px-3 py-2 text-sm outline-none bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreateGroup()}
                    disabled={!createGroupName.trim()}
                    className="min-h-[44px] rounded-[12px] font-bold text-sm px-4 py-2 bg-[#5B4CF5] text-white disabled:opacity-50"
                  >
                    Create Group
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
                <div className="rounded-[16px] border border-[#E8EAED] bg-white p-3 dark:bg-slate-900/60 dark:border-gray-700">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-300 mb-2">Your groups</div>
                  {groupsLoading ? (
                    <div className="text-sm text-slate-500">Loading...</div>
                  ) : groups.length === 0 ? (
                    <div className="text-sm text-slate-500">No groups yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {groups.map((g) => (
                        <button
                          key={g._id}
                          type="button"
                          onClick={() => setSelectedGroupId(g._id)}
                          className={`w-full text-left rounded-[10px] px-3 py-2 text-sm font-bold border ${
                            selectedGroupId === g._id
                              ? 'bg-[#5B4CF5] text-white border-[#5B4CF5]'
                              : 'border-[#E8EAED] text-slate-700 dark:text-slate-200 dark:border-gray-700'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-[16px] border border-[#E8EAED] bg-white p-4 dark:bg-slate-900/60 dark:border-gray-700">
                  {!selectedGroup ? (
                    <div className="text-sm text-slate-500">Pick a group to start discussing.</div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="text-sm font-black text-[#0F172A] dark:text-white">{selectedGroup.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-300">{selectedGroup.members.length} members</div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <input
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          placeholder="Search students to add..."
                          className="w-full border border-[#E8EAED] rounded-[12px] px-3 py-2 text-sm outline-none bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                        />
                        {memberSearchResults.length > 0 && (
                          <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
                            {memberSearchResults.map((u) => (
                              <div key={u.uid} className="flex items-center justify-between gap-2 text-xs border border-[#E8EAED] dark:border-gray-700 rounded-[10px] px-2 py-1">
                                <span className="font-bold text-slate-700 dark:text-slate-200">{u.name}</span>
                                <button
                                  type="button"
                                  onClick={() => void handleAddMember(u.uid)}
                                  className="text-[#5B4CF5] font-bold"
                                >
                                  Add
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border border-[#E8EAED] dark:border-gray-700 rounded-[12px] p-3 h-72 overflow-y-auto space-y-3">
                        {(groupMessages[selectedGroup._id] || []).map((m) => (
                          <div key={m._id} className={`text-sm ${m.authorId === myUid ? 'text-right' : 'text-left'}`}>
                            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 mb-1">{m.authorName}</div>
                            <div className="inline-block rounded-[10px] px-3 py-2 bg-[#EEF2FF] dark:bg-slate-800 text-[#0F172A] dark:text-slate-100">
                              {m.content}
                            </div>
                          </div>
                        ))}
                        {(groupMessages[selectedGroup._id] || []).length === 0 && (
                          <div className="text-sm text-slate-500">No messages yet.</div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <input
                          value={groupMessageDraft}
                          onChange={(e) => setGroupMessageDraft(e.target.value)}
                          placeholder="Share ideas, plans, past questions..."
                          className="flex-1 border border-[#E8EAED] rounded-[12px] px-3 py-2 text-sm outline-none bg-white dark:bg-slate-900/60 dark:border-gray-700 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => void handleSendGroupMessage()}
                          disabled={!groupMessageDraft.trim()}
                          className="min-h-[44px] rounded-[12px] px-4 font-bold text-sm bg-[#5B4CF5] text-white disabled:opacity-50"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
            </div>
          </div>

          <ToastHost message={toast?.message || null} />
        </main>
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

