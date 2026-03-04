import { apiClient } from './client'

export interface Note {
  _id: string
  title: string
  content: string
  subject?: string
  topic?: string
  source?: string
  tags?: string[]
  color?: string
  isPinned?: boolean
  createdAt: string
  updatedAt: string
}

export const notesApi = {
  getAll: async (params?: { subject?: string; search?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.subject && params.subject.toLowerCase() !== 'all') {
      searchParams.append('subject', params.subject)
    }
    if (params?.search) {
      searchParams.append('search', params.search)
    }
    const url = searchParams.toString() ? `/notes?${searchParams}` : '/notes'
    const response = await apiClient.get<{ success: boolean; notes: Note[] }>(url)
    return response.data
  },
  create: async (data: {
    title: string
    content: string
    subject?: string
    topic?: string
    tags?: string[]
    color?: string
  }) => {
    const response = await apiClient.post<{ success: boolean; note: Note }>('/notes', data)
    return response.data
  },
  update: async (id: string, data: Partial<Note>) => {
    const response = await apiClient.put<{ success: boolean; note: Note }>(`/notes/${id}`, data)
    return response.data
  },
  delete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean }>(`/notes/${id}`)
    return response.data
  },
  togglePin: async (id: string) => {
    const response = await apiClient.put<{ success: boolean; note: Note }>(`/notes/${id}/pin`)
    return response.data
  },
  createFromAI: async (data: {
    title: string
    content: string
    subject?: string
    topic?: string
    tags?: string[]
    color?: string
  }) => {
    const response = await apiClient.post<{ success: boolean; note: Note }>('/notes/from-ai', data)
    return response.data
  },
}
