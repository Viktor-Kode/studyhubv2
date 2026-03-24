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

export type CommunityPostCardComment = {
  _id: string
  postId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
  rank?: string
}

export type CommunityComment = CommunityPostCardComment

export type CommunityPostCardProps = {
  post: CommunityPost
  myUid: string
  showOwnerMenu?: boolean
  isAdmin?: boolean
  rankBadge: string
  comments: CommunityPostCardComment[]
  commentsOpen: boolean
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

function highlightMentions(text: string) {
  const parts = text.split(/(@[^\s@]+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="font-semibold text-indigo-600 dark:text-indigo-400">
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function CommunityPostCard({
  post,
  myUid,
  showOwnerMenu = true,
  isAdmin = false,
  rankBadge,
  comments,
  commentsOpen,
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
      const next = `${commentDraft.slice(0, i)}@${userName.replace(/\s+/g, '')} `
      onCommentDraftChange(next)
      setMentionUsers([])
    },
    [commentDraft, onCommentDraftChange],
  )

  const submitReport = useCallback(async () => {
    const r = reportReason.trim()
    if (r.length < 3 || !onReport) return
    await onReport(r.slice(0, 500))
    setReportOpen(false)
    setReportReason('')
    onMenuToggle()
  }, [onReport, reportReason, onMenuToggle])

  const showOverflowMenu = (isOwner && showOwnerMenu) || (!isOwner && onReport) || (isAdmin && onTogglePin)

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

      {commentsOpen && (
        <div className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <div className="mb-3 space-y-3">
            {comments.map((comment) => {
              const isBestAnswer = post.bestAnswerCommentId === comment._id
              return (
                <div
                  key={comment._id}
                  className={`rounded-lg border p-2 ${
                    isBestAnswer ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{comment.authorName}</p>
                    {isBestAnswer && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <Crown className="h-3.5 w-3.5" />
                        Best answer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{highlightMentions(comment.content)}</p>
                  {isOwner &&
                    post.type === 'question' &&
                    !post.bestAnswerCommentId &&
                    !isBestAnswer && (
                      <button
                        type="button"
                        onClick={() => onMarkBestAnswer(comment._id)}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark best answer
                      </button>
                    )}
                </div>
              )
            })}
          </div>
          <div className="relative flex items-start gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                value={commentDraft}
                onChange={(e) => onCommentDraftChange(e.target.value)}
                placeholder="Write a comment… Use @name to mention"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              {mentionUsers.length > 0 && (
                <ul className="absolute bottom-full left-0 z-30 mb-1 max-h-40 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-xs shadow-lg dark:border-slate-600 dark:bg-slate-900">
                  {mentionUsers.map((u) => (
                    <li key={u.uid}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                        onClick={() => insertMention(u.name)}
                      >
                        @{u.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="button" onClick={onSubmitComment} className="rounded-lg bg-indigo-600 p-2 text-white">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </article>
  )
}
