import { apiClient } from '@/lib/api/client'

export type SharedNote = {
  _id: string
  userId: string
  title: string
  content: string
  isPublic: boolean
  sharedWith: string[]
  subject?: string
  tags: string[]
  likes: string[]
  viewCount: number
  likeCount?: number
  likedByMe?: boolean
  isOwner?: boolean
  createdAt?: string
  updatedAt?: string
}

export const sharedNotesApi = {
  mine: () => apiClient.get<{ success: boolean; notes: SharedNote[] }>('shared-notes/mine'),
  withMe: (params?: { subject?: string; tag?: string; search?: string }) =>
    apiClient.get<{ success: boolean; notes: SharedNote[] }>('shared-notes/with-me', { params }),
  search: (params?: { q?: string; subject?: string; tag?: string }) =>
    apiClient.get<{ success: boolean; notes: SharedNote[] }>('shared-notes/search', { params }),
  getOne: (id: string) => apiClient.get<{ success: boolean; note: SharedNote }>(`shared-notes/${id}`),
  create: (body: {
    title: string
    content: string
    subject?: string
    tags?: string[]
    isPublic?: boolean
  }) => apiClient.post<{ success: boolean; note: SharedNote }>('shared-notes', body),
  update: (id: string, body: Partial<Pick<SharedNote, 'title' | 'content' | 'subject' | 'tags' | 'isPublic'>>) =>
    apiClient.put<{ success: boolean; note: SharedNote }>(`shared-notes/${id}`, body),
  remove: (id: string) => apiClient.delete(`shared-notes/${id}`),
  setPublic: (id: string, isPublic: boolean) =>
    apiClient.patch<{ success: boolean; note: SharedNote }>(`shared-notes/${id}/public`, { isPublic }),
  shareWith: (id: string, body: { email?: string; userId?: string }) =>
    apiClient.post<{ success: boolean; note: SharedNote }>(`shared-notes/${id}/share`, body),
  like: (id: string) => apiClient.post<{ success: boolean; note: SharedNote }>(`shared-notes/${id}/like`),
  searchUsers: (q: string) =>
    apiClient.get<{ success: boolean; users: { id: string; name: string; email: string }[] }>(
      'shared-notes/users/search',
      { params: { q } }
    ),
}
