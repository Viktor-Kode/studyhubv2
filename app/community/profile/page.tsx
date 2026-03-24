'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  type InfiniteData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Award,
  Bookmark,
  Calendar,
  Crown,
  Flame,
  Medal,
  PenLine,
  ThumbsUp,
  Trophy,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { CommunityPostCard, type CommunityComment } from '@/components/community/CommunityPostCard'
import { useAuthStore } from '@/lib/store/authStore'
import { communityApi, type CommunityPost, type CommunityProfile } from '@/lib/api/communityApi'
import { rankFromPoints } from '@/lib/community/utils'
import { useToast } from '@/hooks/useToast'

type PostsPage = {
  posts?: CommunityPost[]
  page: number
  totalPages: number
  totalPosts?: number
}

type ActivityTab = 'posts' | 'liked' | 'bookmarks'

function profileQueryKey(target: string | undefined) {
  return ['community-profile', target ?? 'self'] as const
}

function authorPostsKey(uid: string) {
  return ['community-posts-author', uid] as const
}

const likedPostsKey = ['community-liked-posts'] as const
const bookmarksKey = ['community-bookmarks'] as const

const BADGE_ICON_MAP: Record<string, LucideIcon> = {
  PenLine,
  Flame,
  Medal,
  ThumbsUp,
}

function BadgeLucide({ iconName }: { iconName: string }) {
  const Cmp = BADGE_ICON_MAP[iconName] || Award
  return <Cmp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
}

function CommunityProfileInner() {
  const searchParams = useSearchParams()
  const targetUser = searchParams.get('user')?.trim() || undefined
  const { user } = useAuthStore()
  const myUid = user?.uid || ''
  const { toast, showToast } = useToast(2200)
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<ActivityTab>('posts')
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [menuPostId, setMenuPostId] = useState<string | null>(null)
  const [likeEffectPost, setLikeEffectPost] = useState<string | null>(null)

  const { data: profile, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: profileQueryKey(targetUser),
    queryFn: async () => {
      const res = await communityApi.getProfile(targetUser ? { user: targetUser } : {})
      return res.data?.profile as CommunityProfile | undefined
    },
    enabled: !!myUid,
  })

  const { data: selfProfile } = useQuery({
    queryKey: profileQueryKey(undefined),
    queryFn: async () => {
      const res = await communityApi.getProfile()
      return res.data?.profile as CommunityProfile | undefined
    },
    enabled: !!myUid && !!profile && !profile.isSelf,
  })

  const rankBadgeForCards = rankFromPoints(
    ((profile?.isSelf ? profile?.totalPoints : selfProfile?.totalPoints) ?? 0) + 1,
  )

  useEffect(() => {
    if (profile && !profile.isSelf && (tab === 'liked' || tab === 'bookmarks')) setTab('posts')
  }, [profile, tab])

  const invalidatePostLists = useCallback(async () => {
    if (profile?.userId) await queryClient.invalidateQueries({ queryKey: authorPostsKey(profile.userId) })
    if (profile?.isSelf) {
      await queryClient.invalidateQueries({ queryKey: likedPostsKey })
      await queryClient.invalidateQueries({ queryKey: bookmarksKey })
    }
  }, [profile?.userId, profile?.isSelf, queryClient])

  const postsInfinite = useInfiniteQuery({
    queryKey: authorPostsKey(profile?.userId || '_'),
    enabled: tab === 'posts' && !!profile?.userId,
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<PostsPage> => {
      const uid = profile!.userId
      const res = await communityApi.getPosts({ page: pageParam, limit: 8, author: uid })
      const d = res.data || {}
      return {
        posts: d.posts || [],
        page: d.page ?? pageParam,
        totalPages: d.totalPages ?? 1,
        totalPosts: d.totalPosts,
      }
    },
    getNextPageParam: (last) => {
      const pg = last.page ?? 1
      const tp = last.totalPages ?? 1
      return pg < tp ? pg + 1 : undefined
    },
  })

  const likedInfinite = useInfiniteQuery({
    queryKey: likedPostsKey,
    enabled: tab === 'liked' && !!profile?.isSelf,
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<PostsPage> => {
      const res = await communityApi.getLikedPosts({ page: pageParam, limit: 8 })
      const d = res.data || {}
      return {
        posts: d.posts || [],
        page: d.page ?? pageParam,
        totalPages: d.totalPages ?? 1,
        totalPosts: d.totalPosts,
      }
    },
    getNextPageParam: (last) => {
      const pg = last.page ?? 1
      const tp = last.totalPages ?? 1
      return pg < tp ? pg + 1 : undefined
    },
  })

  const bookmarksInfinite = useInfiniteQuery({
    queryKey: bookmarksKey,
    enabled: tab === 'bookmarks' && !!profile?.isSelf,
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<PostsPage> => {
      const res = await communityApi.getBookmarkedPosts({ page: pageParam, limit: 8 })
      const d = res.data || {}
      return {
        posts: d.posts || [],
        page: d.page ?? pageParam,
        totalPages: d.totalPages ?? 1,
        totalPosts: d.totalPosts,
      }
    },
    getNextPageParam: (last) => {
      const pg = last.page ?? 1
      const tp = last.totalPages ?? 1
      return pg < tp ? pg + 1 : undefined
    },
  })

  const activeInfinite = tab === 'posts' ? postsInfinite : tab === 'liked' ? likedInfinite : bookmarksInfinite

  const listQueryKey = useMemo(() => {
    if (tab === 'posts' && profile?.userId) return authorPostsKey(profile.userId)
    if (tab === 'liked') return likedPostsKey
    return bookmarksKey
  }, [tab, profile?.userId])

  const listPosts = useMemo(
    () => activeInfinite.data?.pages.flatMap((p) => p.posts || []) ?? [],
    [activeInfinite.data],
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
      if (!commentsByPost[postId]) await loadComments(postId)
    },
    [commentsByPost, loadComments],
  )

  const toggleBookmark = useCallback(
    async (postId: string) => {
      const current = listPosts.find((p) => p._id === postId)
      if (!current) return
      const next = !current.isBookmarked
      queryClient.setQueryData(listQueryKey, (old: InfiniteData<PostsPage> | undefined) => {
        if (!old?.pages) return old
        if (tab === 'bookmarks' && !next) {
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: (page.posts || []).filter((p) => p._id !== postId),
            })),
          }
        }
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: (page.posts || []).map((p) =>
              p._id === postId ? { ...p, isBookmarked: next } : p,
            ),
          })),
        }
      })
      try {
        await communityApi.toggleBookmark(postId)
        showToast(next ? 'Saved to bookmarks' : 'Removed from bookmarks')
        await invalidatePostLists()
      } catch {
        queryClient.invalidateQueries({ queryKey: listQueryKey })
        showToast('Could not update bookmark')
      }
    },
    [invalidatePostLists, listPosts, listQueryKey, queryClient, showToast, tab],
  )

  const toggleLike = useCallback(
    async (postId: string) => {
      const current = listPosts.find((p) => p._id === postId)
      if (!current) return
      const nextLiked = !current.isLiked
      const updater = (rows: CommunityPost[]) =>
        rows.map((post) =>
          post._id === postId
            ? { ...post, isLiked: nextLiked, likesCount: Math.max(0, post.likesCount + (nextLiked ? 1 : -1)) }
            : post,
        )
      queryClient.setQueryData(listQueryKey, (old: InfiniteData<PostsPage> | undefined) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: updater(page.posts || []),
          })),
        }
      })
      if (nextLiked) {
        setLikeEffectPost(postId)
        window.setTimeout(() => setLikeEffectPost(null), 650)
      }
      try {
        await communityApi.likePost(postId)
        await invalidatePostLists()
      } catch {
        queryClient.invalidateQueries({ queryKey: listQueryKey })
        showToast('Failed to update like')
      }
    },
    [invalidatePostLists, listPosts, listQueryKey, queryClient, showToast],
  )

  const votePoll = useCallback(
    async (postId: string, optionIndex: number) => {
      const previous = listPosts.find((p) => p._id === postId)
      if (!previous?.poll) return
      queryClient.setQueryData(listQueryKey, (old: InfiniteData<PostsPage> | undefined) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: (page.posts || []).map((post) => {
              if (post._id !== postId || !post.poll) return post
              const options = post.poll.options.map((option, index) => {
                const votesWithoutMe = (option.votes || []).filter((vote) => vote !== myUid)
                return index === optionIndex
                  ? { ...option, votes: [...votesWithoutMe, myUid] }
                  : { ...option, votes: votesWithoutMe }
              })
              return { ...post, poll: { ...post.poll, options } }
            }),
          })),
        }
      })
      try {
        await communityApi.votePoll(postId, optionIndex)
        showToast('+1 point for voting')
        await invalidatePostLists()
      } catch {
        queryClient.invalidateQueries({ queryKey: listQueryKey })
        showToast('Failed to vote')
      }
    },
    [invalidatePostLists, listPosts, listQueryKey, myUid, queryClient, showToast],
  )

  const addComment = useCallback(
    async (postId: string) => {
      const content = (commentDrafts[postId] || '').trim()
      if (!content) return
      try {
        await communityApi.addComment(postId, content)
        setCommentDrafts((prev) => ({ ...prev, [postId]: '' }))
        await loadComments(postId)
        await invalidatePostLists()
        showToast('+3 points for commenting')
      } catch {
        showToast('Failed to comment')
      }
    },
    [commentDrafts, invalidatePostLists, loadComments, showToast],
  )

  const markBestAnswer = useCallback(
    async (postId: string, commentId: string) => {
      const current = listPosts.find((p) => p._id === postId)
      if (!current) return
      queryClient.setQueryData(listQueryKey, (old: InfiniteData<PostsPage> | undefined) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: (page.posts || []).map((post) =>
              post._id === postId ? { ...post, bestAnswerCommentId: commentId } : post,
            ),
          })),
        }
      })
      try {
        await communityApi.markBestAnswer(postId, commentId)
        showToast('+10 points for best answer')
        await invalidatePostLists()
      } catch {
        queryClient.invalidateQueries({ queryKey: listQueryKey })
        showToast('Failed to mark best answer')
      }
    },
    [invalidatePostLists, listPosts, listQueryKey, queryClient, showToast],
  )

  const memberLabel = profile?.memberSince
    ? format(new Date(profile.memberSince), 'MMM yyyy')
    : '—'

  const rankLabel = profile?.rank ?? profile?.rankTier ?? 'Beginner'

  return (
    <ProtectedRoute allowedRoles={['student', 'admin']}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 pb-16 pt-6 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <Link
              href="/community"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Community
            </Link>
          </div>

          {profileLoading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              Loading profile…
            </div>
          )}

          {profileError && !profileLoading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
              Could not load this profile.
            </div>
          )}

          {profile && !profileLoading && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
              <aside className="h-fit space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-4 flex flex-col items-center text-center">
                    <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-md">
                      {profile.avatar || '?'}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile.name}</h2>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 dark:bg-indigo-950/40">
                      <Crown className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{rankLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <Trophy className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>
                        Total points:{' '}
                        <strong>{(profile.totalPoints ?? 0).toLocaleString()}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <Award className="h-4 w-4 shrink-0 text-violet-600" />
                      <span>
                        Community: {(profile.communityPoints ?? 0).toLocaleString()} · CBT:{' '}
                        {(profile.cbtPoints ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <Flame className="h-4 w-4 shrink-0 text-orange-500" />
                      <span>
                        Streak: <strong>{profile.streak ?? 0}</strong> days
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
                      <span>Member since {memberLabel}</span>
                    </div>
                    {profile.leaderboardRank > 0 && profile.role !== 'admin' && (
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <Medal className="h-4 w-4 shrink-0 text-indigo-600" />
                        <span>
                          Leaderboard: <strong>#{profile.leaderboardRank}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Achievements
                  </h3>
                  {profile.badges && profile.badges.length > 0 ? (
                    <ul className="grid grid-cols-2 gap-3">
                      {profile.badges.map((b) => (
                        <li
                          key={b.id}
                          title={b.description}
                          className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2 py-3 text-center dark:border-slate-800 dark:bg-slate-800/50"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-900">
                            <BadgeLucide iconName={b.icon} />
                          </span>
                          <span className="text-xs font-semibold leading-tight text-slate-800 dark:text-slate-100">
                            {b.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No badges yet. Post, comment, and stay active to unlock milestones.
                    </p>
                  )}
                </div>
              </aside>

              <section className="min-w-0 space-y-4">
                <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                  <button
                    type="button"
                    onClick={() => setTab('posts')}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      tab === 'posts'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {profile.isSelf ? 'My posts' : 'Posts'}
                  </button>
                  {profile.isSelf && (
                    <>
                      <button
                        type="button"
                        onClick={() => setTab('liked')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          tab === 'liked'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        Liked posts
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab('bookmarks')}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          tab === 'bookmarks'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <Bookmark className="h-4 w-4" />
                        Bookmarks
                      </button>
                    </>
                  )}
                </div>

                {activeInfinite.isLoading && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                    Loading posts…
                  </div>
                )}

                {!activeInfinite.isLoading && listPosts.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {tab === 'bookmarks'
                        ? 'Save interesting posts to read later.'
                        : tab === 'liked'
                          ? 'No liked posts yet. Explore the feed and use the like button on posts you enjoy.'
                          : profile.isSelf
                            ? 'No posts yet. Create your first post to earn points!'
                            : 'No posts yet.'}
                    </p>
                    {tab === 'posts' && profile.isSelf && (
                      <Link
                        href="/community"
                        className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                      >
                        Go to community feed
                      </Link>
                    )}
                    {tab === 'bookmarks' && profile.isSelf && (
                      <Link
                        href="/community"
                        className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                      >
                        Browse community
                      </Link>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  {listPosts.map((post) => (
                    <CommunityPostCard
                      key={post._id}
                      post={post}
                      myUid={myUid}
                      showOwnerMenu={false}
                      rankBadge={rankBadgeForCards}
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
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onMarkBestAnswer={(commentId) => void markBestAnswer(post._id, commentId)}
                      onToggleBookmark={() => void toggleBookmark(post._id)}
                    />
                  ))}
                </div>

                {activeInfinite.hasNextPage && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      disabled={activeInfinite.isFetchingNextPage}
                      onClick={() => void activeInfinite.fetchNextPage()}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {activeInfinite.isFetchingNextPage ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {toast?.message && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-xl">
            {toast.message}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

export default function CommunityProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 px-4 py-10 text-center text-slate-500 dark:bg-slate-950 dark:text-slate-400">
          Loading…
        </div>
      }
    >
      <CommunityProfileInner />
    </Suspense>
  )
}
