'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Crown,
  Flag,
  Flame,
  Heart,
  HelpCircle,
  MessageSquare,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Send,
  Share2,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { communityApi } from '@/lib/api/communityApi'
import type { CommunityPost } from '@/lib/api/communityApi'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export type CommunityPostCardComment = {
  _id: string
  postId: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  authorRank: string
  parentId: string | null
  content: string
  createdAt: string
  likesCount: number
  isLiked: boolean
}

export type CommunityComment = CommunityPostCardComment

export type CommunityPostCardProps = {
  post: CommunityPost
  myUid: string
  myName: string
  myRank: string
  showOwnerMenu?: boolean
  isAdmin?: boolean
  rankBadge: string
  comments: CommunityPostCardComment[]
  commentsOpen: boolean
  commentsLoading?: boolean
  commentDraft: string
  onToggleComments: () => void
  onCommentDraftChange: (value: string) => void
  onSubmitComment: () => void
  likeEffectActive: boolean
  onLike: () => void
  onVotePoll: (optionIndex: number) => void
  onShare: () => void
  menuPostId: string | null
  onMenuToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onMarkBestAnswer: (commentId: string) => void
  onToast?: (message: string) => void
  onToggleBookmark?: () => void
  onReport?: (reason: string) => void | Promise<void>
  onTogglePin?: () => void | Promise<void>
  onTagClick?: (tag: string) => void
}

const timeAgo = (dateString: string) => formatDistanceToNow(new Date(dateString), { addSuffix: true })

const initials = (name: string) =>
  name
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

function mentionTokenRegex() {
  return /(@[^\s@]{2,48})/g
}

function renderRichText(text: string) {
  const mentionRegex = mentionTokenRegex()
  const urlRegex = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/g

  const renderMentionsAndLinks = (s: string, keyPrefix: string) => {
    const parts = s.split(urlRegex)
    return parts.map((part, idx) => {
      const key = `${keyPrefix}-u-${idx}`
      if (!part) return <span key={key} />

      const isUrl = /^https?:\/\//i.test(part) || /^www\./i.test(part)
      if (isUrl) {
        const href = /^www\./i.test(part) ? `https://${part}` : part
        return (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-400"
          >
            {part}
          </a>
        )
      }

      const mentionParts = part.split(mentionRegex)
      return mentionParts.map((mp, j) => {
        const mentionKey = `${key}-${j}`
        if (mp && mp.startsWith('@')) {
          return (
            <span
              key={mentionKey}
              className="inline-flex items-center rounded-full bg-indigo-50 px-1 py-0.5 text-[11px] font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300"
            >
              {mp}
            </span>
          )
        }
        return <span key={mentionKey}>{mp}</span>
      })
    })
  }

  // Minimal markdown support: **bold**
  const boldParts = text.split(/\*\*([^*]+)\*\*/g)
  return boldParts.map((part, idx) => {
    const key = `rt-b-${idx}`
    if (idx % 2 === 1) {
      return (
        <strong key={key} className="font-semibold">
          {renderMentionsAndLinks(part, key)}
        </strong>
      )
    }
    return <span key={key}>{renderMentionsAndLinks(part, key)}</span>
  })
}

export function CommunityPostCard({
  post,
  myUid,
  myName,
  myRank,
  showOwnerMenu = true,
  isAdmin = false,
  rankBadge,
  comments,
  commentsOpen,
  commentsLoading = false,
  commentDraft,
  onToggleComments,
  onCommentDraftChange,
  onSubmitComment,
  likeEffectActive,
  onLike,
  onVotePoll,
  onShare,
  menuPostId,
  onMenuToggle,
  onEdit,
  onDelete,
  onMarkBestAnswer,
  onToast,
  onToggleBookmark,
  onReport,
  onTogglePin,
  onTagClick,
}: CommunityPostCardProps) {
  const isOwner = post.authorId === myUid
  const profileHref =
    post.authorId === myUid ? '/community/profile' : `/community/profile?user=${encodeURIComponent(post.authorId)}`

  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [mentionUsers, setMentionUsers] = useState<{ uid: string; name: string }[]>([])

  useEffect(() => {
    const m = commentDraft.match(/@([\w-]{2,20})$/)
    if (!m) {
      setMentionUsers([])
      return
    }
    const q = m[1]
    const t = window.setTimeout(async () => {
      try {
        const r = await communityApi.searchUsers(q)
        const users = (r.data?.users || []) as { uid: string; name: string }[]
        setMentionUsers(users.slice(0, 6))
      } catch {
        setMentionUsers([])
      }
    }, 220)
    return () => window.clearTimeout(t)
  }, [commentDraft])

  const insertMention = useCallback(
    (userName: string) => {
      const i = commentDraft.lastIndexOf('@')
      if (i < 0) return
      const next = `${commentDraft.slice(0, i)}@${userName} `
      onCommentDraftChange(next)
      setMentionUsers([])
    },
    [commentDraft, onCommentDraftChange],
  )

  const [localComments, setLocalComments] = useState<CommunityPostCardComment[]>(comments)
  useEffect(() => {
    setLocalComments((prev) => {
      const incomingIds = new Set((comments || []).map((c) => c._id))
      const extras = (prev || []).filter((c) => !incomingIds.has(c._id))
      return [...(comments || []), ...extras]
    })
  }, [comments])

  const ROOT_PARENT_KEY = '__root__'

  const childrenByParentId = (() => {
    const map = new Map<string, CommunityPostCardComment[]>()
    for (const c of localComments || []) {
      const key = c.parentId || ROOT_PARENT_KEY
      const list = map.get(key) || []
      list.push(c)
      map.set(key, list)
    }
    map.forEach((list) => {
      list.sort(
        (a: CommunityPostCardComment, b: CommunityPostCardComment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
    })
    return map
  })()

  const topLevelComments = childrenByParentId.get(ROOT_PARENT_KEY) || []

  const [openReplyForId, setOpenReplyForId] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replyMentionUsers, setReplyMentionUsers] = useState<{ uid: string; name: string }[]>([])

  useEffect(() => {
    if (!openReplyForId) {
      setReplyDraft('')
      setReplyMentionUsers([])
      return
    }
    const m = replyDraft.match(/@([\w-]{2,20})$/)
    if (!m) {
      setReplyMentionUsers([])
      return
    }
    const q = m[1]
    const t = window.setTimeout(async () => {
      try {
        const r = await communityApi.searchUsers(q)
        const users = (r.data?.users || []) as { uid: string; name: string }[]
        setReplyMentionUsers(users.slice(0, 6))
      } catch {
        setReplyMentionUsers([])
      }
    }, 220)
    return () => window.clearTimeout(t)
  }, [openReplyForId, replyDraft])

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editMentionUsers, setEditMentionUsers] = useState<{ uid: string; name: string }[]>([])

  useEffect(() => {
    if (!editingCommentId) {
      setEditDraft('')
      setEditMentionUsers([])
      return
    }
    const m = editDraft.match(/@([\w-]{2,20})$/)
    if (!m) {
      setEditMentionUsers([])
      return
    }
    const q = m[1]
    const t = window.setTimeout(async () => {
      try {
        const r = await communityApi.searchUsers(q)
        const users = (r.data?.users || []) as { uid: string; name: string }[]
        setEditMentionUsers(users.slice(0, 6))
      } catch {
        setEditMentionUsers([])
      }
    }, 220)
    return () => window.clearTimeout(t)
  }, [editingCommentId, editDraft])

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [likeBump, setLikeBump] = useState<{ commentId: string; value: number } | null>(null)

  const submitReport = useCallback(async () => {
    const r = reportReason.trim()
    if (r.length < 3 || !onReport) return
    await onReport(r.slice(0, 500))
    setReportOpen(false)
    setReportReason('')
    onMenuToggle()
  }, [onReport, reportReason, onMenuToggle])

  const handleToggleCommentLike = useCallback(
    async (commentId: string) => {
      const current = localComments.find((c) => c._id === commentId)
      if (!current) return

      const nextLiked = !current.isLiked
      const nextLikesCount = Math.max(0, current.likesCount + (nextLiked ? 1 : -1))
      const prevSnapshot = current

      setLocalComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, isLiked: nextLiked, likesCount: nextLikesCount } : c,
        ),
      )
      if (nextLiked) {
        setLikeBump({ commentId, value: 1 })
        window.setTimeout(() => setLikeBump((b) => (b?.commentId === commentId ? null : b)), 700)
      }

      try {
        const res = await communityApi.toggleCommentLike(post._id, commentId)
        const liked = !!res.data?.liked
        const likesCount = Number(res.data?.likesCount || 0)
        setLocalComments((prev) =>
          prev.map((c) => (c._id === commentId ? { ...c, isLiked: liked, likesCount } : c)),
        )
      } catch {
        setLocalComments((prev) => prev.map((c) => (c._id === commentId ? prevSnapshot : c)))
        onToast?.('Failed to update like')
      }
    },
    [localComments, onToast, post._id],
  )

  const collectDescendants = useCallback(
    (rootId: string) => {
      const toDelete = new Set<string>([rootId])
      let changed = true
      while (changed) {
        changed = false
        for (const c of localComments) {
          if (c.parentId && toDelete.has(c.parentId) && !toDelete.has(c._id)) {
            toDelete.add(c._id)
            changed = true
          }
        }
      }
      return toDelete
    },
    [localComments],
  )

  const handleAddReply = useCallback(
    async (parentId: string) => {
      const content = replyDraft.trim()
      if (!content) return

      const tempId = `temp-reply-${Date.now()}`
      const optimistic: CommunityPostCardComment = {
        _id: tempId,
        postId: post._id,
        parentId,
        authorId: myUid,
        authorName: myName || 'Student',
        authorAvatar: null,
        authorRank: myRank || 'Beginner',
        content,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        isLiked: false,
      }

      setLocalComments((prev) => [...prev, optimistic])
      setOpenReplyForId(null)
      setReplyDraft('')
      setReplyMentionUsers([])

      try {
        const res = await communityApi.addComment(post._id, content, parentId)
        const newComment = res.data?.comment as CommunityPostCardComment | undefined
        if (!newComment) throw new Error('Missing comment payload')

        setLocalComments((prev) => prev.map((c) => (c._id === tempId ? newComment : c)))
        onToast?.('Reply posted')

        window.setTimeout(() => {
          document.getElementById(`comment-${newComment._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 60)
      } catch {
        setLocalComments((prev) => prev.filter((c) => c._id !== tempId))
        onToast?.('Failed to post reply')
      }
    },
    [myName, myRank, myUid, onToast, post._id, replyDraft],
  )

  const handleSaveEdit = useCallback(
    async (commentId: string) => {
      const nextContent = editDraft.trim()
      if (!nextContent) return
      const current = localComments.find((c) => c._id === commentId)
      if (!current) return

      const prevSnapshot = current
      setLocalComments((prev) => prev.map((c) => (c._id === commentId ? { ...c, content: nextContent } : c)))

      try {
        const res = await communityApi.updateComment(post._id, commentId, nextContent)
        const updated = res.data?.comment as CommunityPostCardComment | undefined
        if (!updated) throw new Error('Missing updated comment payload')
        setLocalComments((prev) => prev.map((c) => (c._id === commentId ? updated : c)))
        setEditingCommentId(null)
        setEditDraft('')
        setEditMentionUsers([])
        onToast?.('Comment updated')
      } catch {
        setLocalComments((prev) => prev.map((c) => (c._id === commentId ? prevSnapshot : c)))
        onToast?.('Failed to update comment')
      }
    },
    [editDraft, localComments, onToast, post._id],
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTargetId) return
    const root = localComments.find((c) => c._id === deleteTargetId)
    if (!root) return
    const toDelete = collectDescendants(deleteTargetId)
    const snapshot = localComments.filter((c) => toDelete.has(c._id))

    setDeleteBusy(true)
    setDeleteDialogOpen(false)
    setDeleteTargetId(null)
    setLocalComments((prev) => prev.filter((c) => !toDelete.has(c._id)))

    try {
      await communityApi.deleteComment(post._id, deleteTargetId)
      onToast?.('Comment deleted')
    } catch {
      setLocalComments((prev) => [...snapshot, ...prev.filter((c) => !toDelete.has(c._id))])
      onToast?.('Failed to delete comment')
    } finally {
      setDeleteBusy(false)
    }
  }, [collectDescendants, deleteTargetId, localComments, onToast, post._id])

  const insertReplyMention = useCallback(
    (userName: string) => {
      const i = replyDraft.lastIndexOf('@')
      if (i < 0) return
      const next = `${replyDraft.slice(0, i)}@${userName} `
      setReplyDraft(next)
      setReplyMentionUsers([])
    },
    [replyDraft],
  )

  const insertEditMention = useCallback(
    (userName: string) => {
      const i = editDraft.lastIndexOf('@')
      if (i < 0) return
      const next = `${editDraft.slice(0, i)}@${userName} `
      setEditDraft(next)
      setEditMentionUsers([])
    },
    [editDraft],
  )

  const showOverflowMenu = (isOwner && showOwnerMenu) || (!isOwner && onReport) || (isAdmin && onTogglePin)

  const insertMentionToken = (name: string) => name.replace(/\s+/g, '')

  const CommentNode = ({ comment, depth }: { comment: CommunityPostCardComment; depth: number }) => {
    const isBestAnswer = post.bestAnswerCommentId === comment._id
    const isCommentOwner = comment.authorId === myUid
    const children = childrenByParentId.get(comment._id) || []
    const isEditing = editingCommentId === comment._id
    const isReplying = openReplyForId === comment._id

    const avatarSize = depth > 0 ? 'h-7 w-7' : 'h-8 w-8'
    const avatarTextSize = depth > 0 ? 'text-[11px]' : 'text-xs'

    return (
      <motion.div
        key={comment._id}
        id={`comment-${comment._id}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className={depth > 0 ? 'relative border-l-2 border-slate-200 pl-3 ml-2' : 'relative'}
      >
        <div className="rounded-xl bg-slate-50 p-3 transition hover:shadow dark:bg-slate-950 dark:border dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`flex ${avatarSize} shrink-0 items-center justify-center rounded-full bg-slate-100 ${avatarTextSize} font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100`}>
                {initials(comment.authorName || 'U')}
              </div>
              <div className="min-w-0">
                <div className="mb-0.5 flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {comment.authorName}
                  </p>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                    {comment.authorRank || 'Beginner'}
                  </span>
                  {isBestAnswer && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <Crown className="h-3.5 w-3.5" />
                      Best answer
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{timeAgo(comment.createdAt)}</p>
              </div>
            </div>

            {!isEditing && isCommentOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Comment actions"
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onSelect={() => {
                      setEditingCommentId(comment._id)
                      setEditDraft(comment.content || '')
                    }}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4 text-indigo-600" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setDeleteTargetId(comment._id)
                      setDeleteDialogOpen(true)
                    }}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {!isEditing ? (
            <>
              <div className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                {renderRichText(comment.content || '')}
              </div>

              {isOwner && post.type === 'question' && !post.bestAnswerCommentId && !isBestAnswer && (
                <button
                  type="button"
                  onClick={() => onMarkBestAnswer(comment._id)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark best answer
                </button>
              )}

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  aria-label={comment.isLiked ? 'Unlike comment' : 'Like comment'}
                  onClick={() => void handleToggleCommentLike(comment._id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Heart
                    className={`h-4 w-4 ${comment.isLiked ? 'fill-red-500 text-red-500' : 'fill-transparent text-slate-500 dark:text-slate-400'}`}
                    strokeWidth={comment.isLiked ? 2 : 1.75}
                  />
                  {comment.likesCount > 0 && (
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {comment.likesCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  aria-label="Reply"
                  onClick={() => {
                    if (openReplyForId === comment._id) {
                      setOpenReplyForId(null)
                      setReplyDraft('')
                      setReplyMentionUsers([])
                    } else {
                      setOpenReplyForId(comment._id)
                      setReplyDraft('')
                      setReplyMentionUsers([])
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <MessageSquare className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              <AnimatePresence>
                {likeBump?.commentId === comment._id && comment.isLiked && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: -12 }}
                    exit={{ opacity: 0, y: -24 }}
                    className="pointer-events-none absolute right-2 top-2 z-10 inline-flex items-center gap-1 text-sm font-bold text-red-500"
                  >
                    +{likeBump.value}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="mt-2">
              <div className="relative">
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                {editMentionUsers.length > 0 && (
                  <ul className="absolute bottom-full left-0 z-30 mb-1 max-h-40 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-xs shadow-lg dark:border-slate-600 dark:bg-slate-900">
                    {editMentionUsers.map((u) => {
                      const token = insertMentionToken(u.name)
                      return (
                        <li key={u.uid}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => insertEditMention(token)}
                          >
                            @{token}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              <div className="mt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCommentId(null)
                    setEditDraft('')
                    setEditMentionUsers([])
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={() => void handleSaveEdit(comment._id)}>
                  Save
                </Button>
              </div>
            </div>
          )}

          {isReplying && !isEditing && (
            <div className="mt-3">
              <div className="relative">
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  placeholder="Write a reply… Use @name to mention"
                />
                {replyMentionUsers.length > 0 && (
                  <ul className="absolute bottom-full left-0 z-30 mb-1 max-h-40 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-xs shadow-lg dark:border-slate-600 dark:bg-slate-900">
                    {replyMentionUsers.map((u) => {
                      const token = insertMentionToken(u.name)
                      return (
                        <li key={u.uid}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => insertReplyMention(token)}
                          >
                            @{token}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
              <div className="mt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => void handleAddReply(comment._id)}
                  disabled={!replyDraft.trim()}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 p-2 text-white hover:bg-indigo-500 disabled:opacity-60"
                  aria-label="Post reply"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              {children.length === 0 && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                  No replies yet. Be the first to answer!
                </div>
              )}
            </div>
          )}

          {children.length > 0 && !isEditing && (
            <div className="mt-3 space-y-3">
              {children.map((child) => (
                <CommentNode key={child._id} comment={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <article
      id={`post-${post._id}`}
      className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:scale-[1.005] dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Link
              href={profileHref}
              className="flex min-w-0 items-center gap-2 rounded-lg outline-none ring-indigo-500/0 transition hover:bg-slate-50 focus-visible:ring-2 dark:hover:bg-slate-800/80"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                {initials(post.authorName || 'S')}
              </div>
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{post.authorName}</p>
            </Link>
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
              {rankBadge}
            </span>
            {post.isPinned && (
              <Badge variant="secondary" className="gap-0.5 text-[10px]">
                <Pin className="h-3 w-3" />
                Pinned
              </Badge>
            )}
            {post.isTrending && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-200">
                <Flame className="h-3.5 w-3.5" />
                Trending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {timeAgo(post.createdAt)}
            {typeof post.views === 'number' ? ` · ${post.views} views` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onToggleBookmark && (
            <button
              type="button"
              aria-label={post.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              onClick={onToggleBookmark}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {post.isBookmarked ? (
                <BookmarkCheck className="h-5 w-5 text-indigo-600" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </button>
          )}
          {showOverflowMenu && (
            <div className="relative">
              <button
                type="button"
                aria-label="Post actions"
                onClick={onMenuToggle}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {menuPostId === post._id && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {isOwner && showOwnerMenu && (
                    <>
                      <button
                        type="button"
                        onClick={onEdit}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit post
                      </button>
                      <button
                        type="button"
                        onClick={onDelete}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete post
                      </button>
                    </>
                  )}
                  {isAdmin && onTogglePin && (
                    <button
                      type="button"
                      onClick={() => void onTogglePin()}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {post.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      {post.isPinned ? 'Unpin post' : 'Pin post'}
                    </button>
                  )}
                  {!isOwner && onReport && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportOpen(true)
                        onMenuToggle()
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Flag className="h-4 w-4 text-amber-600" />
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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

      {(post.tags || []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(post.tags || []).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick?.(tag)}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-indigo-100 hover:text-indigo-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-200"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {post.imageUrl && (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl} alt="" className="max-h-80 w-full object-cover" />
        </div>
      )}

      {post.type === 'poll' && post.poll && (
        <div className="mt-3 space-y-2">
          {post.poll.options.map((option, index) => {
            const votes = option.votes?.length || 0
            const totalVotes =
              post.poll?.options.reduce((sum, item) => sum + (item.votes?.length || 0), 0) || 0
            const width = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
            return (
              <button
                key={`${post._id}-${index}`}
                type="button"
                onClick={() => onVotePoll(index)}
                className="w-full rounded-xl border border-slate-200 p-2 text-left text-xs dark:border-slate-700"
              >
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

      <div className="relative mt-3 flex flex-wrap items-center gap-3 text-xs">
        <button
          type="button"
          onClick={onLike}
          className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 font-semibold transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ThumbsUp
            className={`h-4 w-4 shrink-0 transition-colors ${
              post.isLiked
                ? 'fill-red-500 stroke-red-500 text-red-500'
                : 'fill-transparent stroke-slate-400 text-slate-400 dark:stroke-slate-500 dark:text-slate-500'
            }`}
            strokeWidth={post.isLiked ? 2 : 1.75}
          />
          <span className={post.isLiked ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}>
            {post.likesCount}
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleComments}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <MessageSquare className="h-4 w-4" />
          {post.commentsCount}
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>

      <AnimatePresence>
        {likeEffectActive && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: -14 }}
            exit={{ opacity: 0, y: -24 }}
            className="pointer-events-none absolute left-0 top-full mt-0 inline-flex items-center gap-0.5 text-sm font-bold text-red-500"
          >
            +2
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogTitle>Report content</DialogTitle>
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
            Tell us briefly what is wrong. Moderators will review.
          </p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={4}
            className="mb-3 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            placeholder="Reason (min 3 characters)"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => void submitReport()} disabled={reportReason.trim().length < 3}>
              Submit report
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setDeleteBusy(false)
            setDeleteTargetId(null)
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Delete comment</DialogTitle>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Are you sure? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteBusy(false)
                setDeleteTargetId(null)
              }}
              disabled={deleteBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleteBusy}
              onClick={() => void handleDeleteConfirm()}
            >
              {deleteBusy ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {commentsOpen && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Comments</span>
          </div>

          {commentsLoading && topLevelComments.length === 0 ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl bg-white p-3 shadow-sm">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-full animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : topLevelComments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
              No comments yet. Be the first to share an answer!
            </div>
          ) : (
            <div className="space-y-3">
              {topLevelComments.map((c) => (
                <CommentNode key={c._id} comment={c} depth={0} />
              ))}
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="relative flex items-start gap-2">
              <div className="relative min-w-0 flex-1">
                <textarea
                  value={commentDraft}
                  onChange={(e) => onCommentDraftChange(e.target.value)}
                  placeholder="Write a comment… Use @name to mention"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                {mentionUsers.length > 0 && (
                  <ul className="absolute bottom-full left-0 z-30 mb-1 max-h-40 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-xs shadow-lg dark:border-slate-600 dark:bg-slate-900">
                    {mentionUsers.map((u) => {
                      const token = insertMentionToken(u.name)
                      return (
                        <li key={u.uid}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => insertMention(token)}
                          >
                            @{token}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <button
                type="button"
                onClick={onSubmitComment}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 p-2 text-white hover:bg-indigo-500"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
