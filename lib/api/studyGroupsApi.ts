import { apiClient } from '@/lib/api/client'

export type StudyGroupMember = {
  userId: string
  name: string
  avatar?: string
  role: 'admin' | 'member'
  joinedAt?: string
  points?: number
}

export type StudyGroup = {
  _id: string
  name: string
  description?: string
  subject?: string
  coverColor?: string
  visibility: 'public' | 'private'
  joinCode?: string
  creatorId: string
  creatorName: string
  members: StudyGroupMember[]
  membersCount: number
  messagesCount?: number
  lastActivity?: string
  isPinned?: boolean
  lastRead?: { userId: string; lastReadAt: string }[]
  createdAt?: string
  updatedAt?: string
}

export type GroupChatMessage = {
  _id: string
  groupId: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  type: 'text' | 'system' | 'ai'
  reactions?: { emoji: string; users: string[] }[]
  replyTo?: {
    messageId: string
    authorName: string
    preview: string
  }
  createdAt: string
  updatedAt?: string
  editedAt?: string | null
  isDeleted?: boolean
  deletedAt?: string | null
  seenBy?: string[]
}

export const studyGroupsApi = {
  list: (params?: { tab?: 'my' | 'discover'; subject?: string }) =>
    apiClient.get<StudyGroup[]>('/study-groups', { params }),

  getOne: (id: string) => apiClient.get<StudyGroup>(`/study-groups/${id}`),

  create: (body: {
    name: string
    description?: string
    subject?: string
    visibility?: 'public' | 'private'
    coverColor?: string
  }) => apiClient.post<StudyGroup>('/study-groups', body),

  join: (body: { joinCode?: string; groupId?: string }) =>
    apiClient.post<StudyGroup>('/study-groups/join', body),

  leave: (id: string) => apiClient.post<{ success?: boolean; deleted?: boolean }>(`/study-groups/${id}/leave`),

  getMessages: (id: string, params?: { before?: string; limit?: number }) =>
    apiClient.get<GroupChatMessage[]>(`/study-groups/${id}/messages`, { params }),

  sendMessage: (
    id: string,
    body: { content: string; replyTo?: { messageId: string; authorName: string; preview: string } },
  ) => apiClient.post<GroupChatMessage>(`/study-groups/${id}/messages`, body),

  toggleReaction: (id: string, messageId: string, emoji: string) =>
    apiClient.patch<GroupChatMessage>(`/study-groups/${id}/messages/${messageId}/reactions`, { emoji }),

  editMessage: (id: string, messageId: string, body: { content: string }) =>
    apiClient.put<GroupChatMessage>(`/study-groups/${id}/messages/${messageId}`, body),

  deleteMessage: (id: string, messageId: string) =>
    apiClient.delete<GroupChatMessage>(`/study-groups/${id}/messages/${messageId}`),

  markRead: (id: string, body: { lastReadAt: string }) =>
    apiClient.post<{ success: boolean }>(`/study-groups/${id}/mark-read`, body),

  getUpdates: (id: string, params?: { since?: string }) =>
    apiClient.get<{ newMessages: GroupChatMessage[]; timestamp: string }>(`/study-groups/${id}/updates`, { params }),

  askAi: (id: string, body: { question: string; subject?: string }) =>
    apiClient.post<{ message: GroupChatMessage }>(`/study-groups/${id}/ask-ai`, body),
}
