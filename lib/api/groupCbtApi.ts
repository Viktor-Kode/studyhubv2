import { apiClient } from '@/lib/api/client'

export type GroupCBTSession = {
  _id: string
  name: string
  createdBy: string
  subject: string
  examType: string
  year: string
  questionCount: number
  status: 'open' | 'in_progress' | 'completed'
  inviteCode?: string
  maxMembers: number
  startedAt?: string
  endedAt?: string
  members: {
   userId: string
    name: string
    joinedAt: string
    score?: number | null
    accuracy?: number | null
    completed: boolean
    finishedAt?: string | null
  }[]
  isCreator?: boolean
  myMember?: { userId: string; completed: boolean; accuracy?: number | null }
  questionsForClient?: { index: number; question: string; options: string[]; image?: string | null }[]
  leaderboard?: { rank: number; userId: string; name: string; accuracy: number; score: number }[]
}

export const groupCbtApi = {
  list: () => apiClient.get<{ success: boolean; sessions: GroupCBTSession[] }>('group-cbt'),
  create: (body: {
    name: string
    subject: string
    examType: string
    year?: string
    questionCount?: number
    maxMembers?: number
  }) => apiClient.post<{ success: boolean; session: GroupCBTSession }>('group-cbt', body),
  join: (body: { inviteCode?: string; groupId?: string }) =>
    apiClient.post<{ success: boolean; session: GroupCBTSession }>('group-cbt/join', body),
  get: (id: string) => apiClient.get<{ success: boolean; session: GroupCBTSession }>(`group-cbt/${id}`),
  start: (id: string) => apiClient.post<{ success: boolean; session: GroupCBTSession }>(`group-cbt/${id}/start`),
  submit: (
    id: string,
    body: {
      answers: { questionIndex: number; selectedAnswer: string }[]
      timeTaken?: number
    }
  ) => apiClient.post<{ success: boolean; session: GroupCBTSession; score?: { correct: number; total: number; accuracy: number } }>(
    `group-cbt/${id}/submit`,
    body
  ),
  leave: (id: string) => apiClient.post(`group-cbt/${id}/leave`),
}
