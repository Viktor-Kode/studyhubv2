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

export type GroupGoal = {
  _id: string
  groupId: string
  title: string
  description?: string
  dueDate?: string | null
  completed: boolean
  completedBy?: string | null
  createdBy: string
  createdAt?: string
  updatedAt?: string
}

export type GroupTopic = {
  _id: string
  groupId: string
  topic: string
  assignedTo?: string | null
  status: 'pending' | 'in-progress' | 'completed'
  notes?: string
  createdBy: string
  createdAt?: string
  updatedAt?: string
}

export type GroupQuizDoc = {
  _id: string
  groupId: string
  question: string
  options: string[]
  correctOption: number
  explanation?: string
  createdBy: string
  createdAt?: string
  answeredBy: { userId: string; answer: number; correct: boolean; answeredAt: string }[]
}

export type GroupWhiteboardDoc = {
  _id?: string
  groupId: string
  content: string
  version: number
  lastEditedBy?: string | null
  lastEditedAt?: string | null
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

  listGoals: (id: string) => apiClient.get<GroupGoal[]>(`/study-groups/${id}/goals`),

  createGoal: (id: string, body: { title: string; description?: string; dueDate?: string | null }) =>
    apiClient.post<GroupGoal>(`/study-groups/${id}/goals`, body),

  updateGoal: (id: string, goalId: string, body: Partial<{ title: string; description: string; dueDate: string | null; completed: boolean }>) =>
    apiClient.put<GroupGoal>(`/study-groups/${id}/goals/${goalId}`, body),

  deleteGoal: (id: string, goalId: string) => apiClient.delete<{ success: boolean }>(`/study-groups/${id}/goals/${goalId}`),

  listTopics: (id: string) => apiClient.get<GroupTopic[]>(`/study-groups/${id}/topics`),

  createTopic: (id: string, body: { topic: string; assignedTo?: string; notes?: string }) =>
    apiClient.post<GroupTopic>(`/study-groups/${id}/topics`, body),

  updateTopic: (
    id: string,
    topicId: string,
    body: Partial<{ topic: string; notes: string; assignedTo: string | null; status: GroupTopic['status']; claim: boolean }>,
  ) => apiClient.put<GroupTopic>(`/study-groups/${id}/topics/${topicId}`, body),

  deleteTopic: (id: string, topicId: string) => apiClient.delete<{ success: boolean }>(`/study-groups/${id}/topics/${topicId}`),

  listQuizzes: (id: string) => apiClient.get<GroupQuizDoc[]>(`/study-groups/${id}/quizzes`),

  createQuiz: (
    id: string,
    body: { question: string; options: string[]; correctOption: number; explanation?: string },
  ) => apiClient.post<GroupQuizDoc>(`/study-groups/${id}/quizzes`, body),

  generateQuizAi: (id: string) => apiClient.post<GroupQuizDoc>(`/study-groups/${id}/quizzes/ai`, {}),

  answerQuiz: (id: string, quizId: string, body: { answer: number }) =>
    apiClient.post<GroupQuizDoc>(`/study-groups/${id}/quizzes/${quizId}/answer`, body),

  getWhiteboard: (id: string) => apiClient.get<GroupWhiteboardDoc>(`/study-groups/${id}/whiteboard`),

  updateWhiteboard: (id: string, body: { content: string; version: number }) =>
    apiClient.put<GroupWhiteboardDoc>(`/study-groups/${id}/whiteboard`, body),
}
