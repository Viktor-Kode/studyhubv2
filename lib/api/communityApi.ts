import { apiClient } from '@/lib/api/client'
import { getFirebaseToken } from '@/lib/store/authStore'

export type CommunityPost = {
  _id: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  content: string
  imageUrl: string | null
  subject: string | null
  tags?: string[]
  type: 'post' | 'poll' | 'question'
  likesCount: number
  commentsCount: number
  isLiked: boolean
  isBookmarked?: boolean
  isPinned?: boolean
  views?: number
  isTrending?: boolean
  authorRole?: string | null
  authorIsVerified?: boolean
  bestAnswerCommentId?: string | null
  title?: string | null
  poll?: {
    question: string | null
    options: { text: string | null; votes: string[] }[]
    endsAt: string | null
  }
  createdAt: string
}

export type CommunityBadge = {
  id: string
  name: string
  icon: string
  description: string
}

export type CommunityMe = {
  userId: string
  name: string
  rank: string
  totalPoints: number
  communityPoints: number
  streak: number
  bookmarksCount: number
  unreadNotifications: number
  badges: CommunityBadge[]
  badgeIds: string[]
  role: string
}

export type CommunityNotificationItem = {
  _id: string
  type: string
  actorName: string | null
  postId: string | null
  commentId: string | null
  meta: Record<string, unknown>
  read: boolean
  createdAt: string
}

export type CommunityGroup = {
  _id: string
  name: string
  description?: string
  createdBy: string
  members: string[]
  createdAt: string
  updatedAt: string
}

export type CommunityGroupMessage = {
  _id: string
  groupId: string
  authorId: string
  authorName: string
  authorAvatar?: string | null
  content: string
  createdAt: string
}

export type CommunityProfile = {
  userId: string
  name: string
  avatar: string
  rankTier: string
  rank?: string
  totalPoints: number
  communityPoints: number
  cbtPoints?: number
  postsCount?: number
  streak: number
  memberSince: string | null
  leaderboardRank: number
  isSelf: boolean
  role: string
  isVerified: boolean
  badges?: CommunityBadge[]
  badgeIds?: string[]
}

export const communityApi = {
  getProfile: (params?: { userId?: string; user?: string }) => {
    const q: Record<string, string> = {}
    if (params?.user) q.user = params.user
    else if (params?.userId) q.userId = params.userId
    return apiClient.get('/community/profile', Object.keys(q).length ? { params: q } : {})
  },

  getPosts: (params?: {
    page?: number
    limit?: number
    subject?: string
    author?: string
    q?: string
    query?: string
    tag?: string
    sort?: 'feed' | 'newest' | 'trending'
  }) => apiClient.get('/community/posts', { params }),

  searchPosts: (params: { q: string; page?: number; limit?: number; subject?: string; tag?: string }) =>
    apiClient.get('/community/search', { params }),

  getLikedPosts: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/community/liked-posts', { params }),

  getBookmarkedPosts: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/community/bookmarks', { params }),

  getMe: () => apiClient.get('/community/me'),
  getStats: () => apiClient.get('/community/stats'),
  getTrending: () => apiClient.get('/community/trending'),
  getNotifications: (params?: { limit?: number }) =>
    apiClient.get('/community/notifications', { params }),
  markNotificationRead: (id: string) => apiClient.put(`/community/notifications/${id}/read`),

  createPost: (payload: {
    content: string
    subject?: string | null
    imageUrl?: string | null
    type?: 'post' | 'poll' | 'question'
    tags?: string[]
    poll?: {
      question: string
      options: { text: string }[]
      endsAt: string
    }
  }) => apiClient.post('/community/posts', payload),

  likePost: (id: string) => apiClient.post(`/community/posts/${id}/like`),
  toggleBookmark: (id: string) => apiClient.post(`/community/posts/${id}/bookmark`),

  deletePost: (id: string) => apiClient.delete(`/community/posts/${id}`),
  updatePost: (
    id: string,
    payload: {
      content?: string
      subject?: string | null
      imageUrl?: string | null
      pollOptions?: string[]
      tags?: string[]
    },
  ) => apiClient.put(`/community/posts/${id}`, payload),

  reportPost: (id: string, payload: { reason: string; commentId?: string }) =>
    apiClient.post(`/community/posts/${id}/report`, payload),

  pinPost: (id: string, pinned: boolean) => apiClient.post(`/community/posts/${id}/pin`, { pinned }),

  getComments: (id: string, params?: { parentId?: string | null }) =>
    apiClient.get(`/community/posts/${id}/comments`, params?.parentId ? { params: { parentId: params.parentId } } : {}),

  addComment: (id: string, content: string, parentId?: string | null) =>
    apiClient.post(`/community/posts/${id}/comments`, parentId ? { content, parentId } : { content }),

  toggleCommentLike: (postId: string, commentId: string) =>
    apiClient.post(`/community/posts/${postId}/comments/${commentId}/like`),

  updateComment: (postId: string, commentId: string, content: string) =>
    apiClient.put(`/community/posts/${postId}/comments/${commentId}`, { content }),

  deleteComment: (postId: string, commentId: string) => apiClient.delete(`/community/posts/${postId}/comments/${commentId}`),

  markBestAnswer: (id: string, commentId: string) =>
    apiClient.post(`/community/posts/${id}/best-answer`, { commentId }),

  votePoll: (id: string, optionIndex: number) =>
    apiClient.post(`/community/posts/${id}/vote`, { optionIndex }),

  getLeaderboard: () => apiClient.get('/community/leaderboard'),

  searchUsers: (q: string) => apiClient.get('/community/users/search', { params: { q } }),
  getGroups: () => apiClient.get('/community/groups'),
  createGroup: (payload: { name: string; description?: string; memberIds?: string[] }) =>
    apiClient.post('/community/groups', payload),
  addGroupMember: (groupId: string, userId: string) =>
    apiClient.post(`/community/groups/${groupId}/members`, { userId }),
  getGroupMessages: (groupId: string) => apiClient.get(`/community/groups/${groupId}/messages`),
  sendGroupMessage: (groupId: string, content: string) =>
    apiClient.post(`/community/groups/${groupId}/messages`, { content }),

  /** Uses fetch so multipart boundaries are always correct (axios + default JSON Content-Type often breaks multer). */
  uploadImage: async (file: File) => {
    const postOnce = async (forceRefresh: boolean) => {
      const token = await getFirebaseToken(forceRefresh)
      const headers: HeadersInit = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const formData = new FormData()
      formData.append('image', file)

      return fetch('/api/backend/community/upload-image', {
        method: 'POST',
        headers,
        body: formData,
      })
    }

    let res = await postOnce(false)
    if (res.status === 401) {
      res = await postOnce(true)
    }

    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean
      imageUrl?: string
      error?: string
      message?: string
    }

    if (!res.ok) {
      const msg = data.error || data.message || `Upload failed (${res.status})`
      const err = new Error(msg) as Error & { response?: { status: number; data: unknown } }
      err.response = { status: res.status, data }
      throw err
    }

    return { data }
  },
}
