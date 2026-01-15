import { apiClient } from './client'

export interface Question {
  id: string
  content: string
  status: 'pending' | 'answered'
  response?: string
  createdAt: string
  updatedAt: string
}

export interface CreateQuestionData {
  content: string
}

export const questionsApi = {
  getAll: async (): Promise<Question[]> => {
    const response = await apiClient.get<Question[]>('/questions')
    return response.data
  },

  getById: async (id: string): Promise<Question> => {
    const response = await apiClient.get<Question>(`/questions/${id}`)
    return response.data
  },

  create: async (data: CreateQuestionData): Promise<Question> => {
    const response = await apiClient.post<Question>('/questions', data)
    return response.data
  },
}
