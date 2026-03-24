import { apiClient } from '@/lib/api/client'

export type CommunityPost = {
  _id: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  content: string
  imageUrl: string | null
  subject: string | null
  type: 'post' | 'poll' | 'question'
  likesCount: number
  commentsCount: number
  isLiked: boolean
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

export const communityApi = {
  getPosts: (params?: { page?: number; limit?: number; subject?: string }) =>
    apiClient.get('/community/posts', { params }),

  createPost: (payload: {
    content: string
    subject?: string | null
    imageUrl?: string | null
    type?: 'post' | 'poll'
    poll?: {
      question: string
      options: { text: string }[]
      endsAt: string
    }
  }) => apiClient.post('/community/posts', payload),

  likePost: (id: string) => apiClient.post(`/community/posts/${id}/like`),

  deletePost: (id: string) => apiClient.delete(`/community/posts/${id}`),
  updatePost: (id: string, payload: { content?: string; subject?: string | null; imageUrl?: string | null }) =>
    apiClient.patch(`/community/posts/${id}`, payload),

  getComments: (id: string) => apiClient.get(`/community/posts/${id}/comments`),

  addComment: (id: string, content: string) =>
    apiClient.post(`/community/posts/${id}/comments`, { content }),

  markBestAnswer: (id: string, commentId: string) =>
    apiClient.post(`/community/posts/${id}/best-answer`, { commentId }),

  votePoll: (id: string, optionIndex: number) =>
    apiClient.post(`/community/posts/${id}/vote`, { optionIndex }),

  getTrending: () => apiClient.get('/community/trending'),
  getMe: () => apiClient.get('/community/me'),
  getLeaderboard: () => apiClient.get('/community/leaderboard'),

  // Groups
  searchUsers: (q: string) => apiClient.get('/community/users/search', { params: { q } }),
  getGroups: () => apiClient.get('/community/groups'),
  createGroup: (payload: { name: string; description?: string; memberIds?: string[] }) =>
    apiClient.post('/community/groups', payload),
  addGroupMember: (groupId: string, userId: string) =>
    apiClient.post(`/community/groups/${groupId}/members`, { userId }),
  getGroupMessages: (groupId: string) => apiClient.get(`/community/groups/${groupId}/messages`),
  sendGroupMessage: (groupId: string, content: string) =>
    apiClient.post(`/community/groups/${groupId}/messages`, { content }),

  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return apiClient.post('/community/upload-image', formData)
  },
}

