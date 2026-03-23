import { apiClient } from '@/lib/api/client'

export type CommunityPost = {
  _id: string
  authorId: string
  authorName: string
  authorAvatar: string | null
  content: string
  imageUrl: string | null
  subject: string | null
  type: 'post' | 'poll'
  likesCount: number
  commentsCount: number
  isLiked: boolean
  poll?: {
    question: string | null
    options: { text: string | null; votes: string[] }[]
    endsAt: string | null
  }
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

  getComments: (id: string) => apiClient.get(`/community/posts/${id}/comments`),

  addComment: (id: string, content: string) =>
    apiClient.post(`/community/posts/${id}/comments`, { content }),

  votePoll: (id: string, optionIndex: number) =>
    apiClient.post(`/community/posts/${id}/vote`, { optionIndex }),

  getLeaderboard: () => apiClient.get('/community/leaderboard'),

  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return apiClient.post('/community/upload-image', formData)
  },
}

