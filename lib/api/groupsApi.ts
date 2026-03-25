import { apiClient } from './client'
import { getFirebaseToken } from '@/lib/store/authStore'

export type Group = {
  _id: string
  name: string
  description?: string
  subject: string
  isPrivate: boolean
  inviteCode: string | null
  bannerImage?: string | null
  createdBy: string
  createdAt: string
  lastActiveAt?: string
  settings?: {
    allowMemberPosts?: boolean
    requireApproval?: boolean
  }
  myRole?: 'admin' | 'moderator' | 'member'
  membersCount?: number
}

export type GroupPost = {
  _id: string
  group: string
  authorId: string
  authorName: string
  authorAvatar?: string | null
  content: string
  subject?: string | null
  type: 'post' | 'question' | 'poll' | 'resource'
  resource?: { type: 'file' | 'link'; url: string; title?: string | null } | null
  poll?: { question: string | null; options: { text: string | null; votes: string[] }[]; endsAt: string | null }
  likesCount: number
  commentsCount: number
  isLiked: boolean
  isPinned?: boolean
  bestAnswerCommentId?: string | null
  authorRole?: string | null
  authorIsVerified?: boolean
  createdAt?: string
}

export type GroupComment = {
  _id: string
  postId: string
  parentId: string | null
  authorId: string
  authorName: string
  authorAvatar?: string | null
  content: string
  createdAt: string
  likesCount: number
  isLiked: boolean
}

export type GroupResource = {
  _id: string
  group: string
  title: string
  description?: string
  type: 'file' | 'link'
  url: string
  uploadedBy: string
  createdAt: string
}

export type GroupChatMessage = {
  _id: string
  group: string
  sender: string
  senderName: string
  senderAvatar?: string | null
  content: string
  createdAt: string
  readByCount?: number
  isReadByMe?: boolean
}

export type GroupStudySession = {
  _id: string
  group: string
  title: string
  startTime: string
  endTime?: string | null
  meetingLink?: string | null
  createdBy: string
  attendees: string[]
}

export type GroupTodo = {
  _id: string
  group: string
  title: string
  description?: string
  completed: boolean
  assignedTo?: string | null
  createdBy: string
  dueDate?: string | null
  createdAt: string
}

export const groupsApi = {
  getMyGroups: () => apiClient.get('/groups'),
  createGroup: (payload: {
    name: string
    description?: string
    subject: string
    isPrivate: boolean
    settings?: { allowMemberPosts?: boolean; requireApproval?: boolean }
    bannerImage?: string | null
  }) => apiClient.post('/groups', payload),
  getGroup: (id: string) => apiClient.get(`/groups/${id}`),
  updateGroup: (id: string, payload: Partial<Pick<Group, 'name' | 'description' | 'subject' | 'isPrivate' | 'bannerImage'>> & { settings?: Group['settings'] }) =>
    apiClient.put(`/groups/${id}`, payload),
  deleteGroup: (id: string) => apiClient.delete(`/groups/${id}`),

  generateInvite: (id: string) => apiClient.post(`/groups/${id}/invite`),
  joinGroup: (id: string, payload: { inviteCode?: string | null }) => apiClient.post(`/groups/${id}/join`, payload),

  addGroupMember: (id: string, payload: { userId: string; role?: 'admin' | 'moderator' | 'member' }) => apiClient.post(`/groups/${id}/members`, payload),
  updateMemberRole: (id: string, userId: string, payload: { role: 'admin' | 'moderator' | 'member' }) => apiClient.put(`/groups/${id}/members/${userId}`, payload),
  removeGroupMember: (id: string, userId: string) => apiClient.delete(`/groups/${id}/members/${userId}`),

  getPosts: (id: string, params?: { page?: number; limit?: number; sort?: 'newest' | 'trending' }) => apiClient.get(`/groups/${id}/posts`, { params }),
  createPost: (id: string, payload: { content: string; subject?: string | null; type?: GroupPost['type']; poll?: GroupPost['poll']; resource?: GroupPost['resource'] | null }) =>
    apiClient.post(`/groups/${id}/posts`, payload),
  likePost: (id: string, postId: string) => apiClient.post(`/groups/${id}/posts/${postId}/like`),
  getComments: (id: string, postId: string) => apiClient.get(`/groups/${id}/posts/${postId}/comments`),
  addComment: (id: string, postId: string, payload: { content: string; parentId?: string | null }) => apiClient.post(`/groups/${id}/posts/${postId}/comments`, payload),

  getResources: (id: string) => apiClient.get(`/groups/${id}/resources`),
  uploadResource: async (id: string, payload: { type: 'file'; file: File; title?: string; description?: string } | { type: 'link'; url: string; title?: string; description?: string }) => {
    const token = await getFirebaseToken()
    const headers: HeadersInit = {}
    if (token) headers.Authorization = `Bearer ${token}`

    const formData = new FormData()
    formData.append('type', payload.type)
    formData.append('title', payload.title || '')
    formData.append('description', payload.description || '')

    if (payload.type === 'file') {
      formData.append('file', payload.file)
    } else {
      formData.append('url', payload.url)
    }

    const res = await fetch('/api/backend/groups/' + id + '/resources', {
      method: 'POST',
      headers,
      body: formData,
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = data?.error || data?.message || `Upload failed (${res.status})`
      throw new Error(msg)
    }
    return { data }
  },

  getChat: (id: string, params?: { page?: number; limit?: number }) => apiClient.get(`/groups/${id}/chat`, { params }),
  sendChatMessage: (id: string, payload: { content: string }) => apiClient.post(`/groups/${id}/chat`, payload),

  getSessions: (id: string) => apiClient.get(`/groups/${id}/sessions`),
  createSession: (id: string, payload: { title: string; startTime: string; endTime?: string | null; meetingLink?: string | null }) =>
    apiClient.post(`/groups/${id}/sessions`, payload),
  rsvpSession: (id: string, sessionId: string, payload: { attending: boolean }) => apiClient.post(`/groups/${id}/sessions/${sessionId}/rsvp`, payload),

  getTodos: (id: string) => apiClient.get(`/groups/${id}/todos`),
  createTodo: (id: string, payload: { title: string; description?: string; assignedTo?: string | null; dueDate?: string | null }) =>
    apiClient.post(`/groups/${id}/todos`, payload),
  updateTodo: (id: string, todoId: string, payload: { completed?: boolean; assignedTo?: string | null; dueDate?: string | null; description?: string }) =>
    apiClient.put(`/groups/${id}/todos/${todoId}`, payload),
}

