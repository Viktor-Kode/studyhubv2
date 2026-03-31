import { apiClient } from '@/lib/api/client'

export type SharedLibraryItem = {
  _id: string
  userId: string
  title: string
  description?: string
  type: 'link' | 'file' | 'text'
  url?: string
  fileUrl?: string
  textContent?: string
  subject?: string
  tags: string[]
  upvotes: string[]
  downvotes: string[]
  downloads: number
  moderationStatus: 'pending' | 'approved' | 'rejected'
  authorName?: string
  upvoteCount?: number
  downvoteCount?: number
  userVote?: 'up' | 'down' | null
  createdAt?: string
}

export const sharedLibraryApi = {
  items: (params?: { page?: number; limit?: number; sort?: string; subject?: string; search?: string; tag?: string }) =>
    apiClient.get<{ success: boolean; items: SharedLibraryItem[]; page: number; total: number; hasMore: boolean }>(
      'shared-library/items',
      { params }
    ),
  mine: () => apiClient.get<{ success: boolean; items: SharedLibraryItem[] }>('shared-library/mine'),
  submit: (fd: FormData) =>
    apiClient.post<{ success: boolean; item: SharedLibraryItem }>('shared-library/submit', fd),
  vote: (id: string, direction: 'up' | 'down' | 'clear') =>
    apiClient.post<{ success: boolean; item: SharedLibraryItem }>(`shared-library/${id}/vote`, { direction }),
  download: (id: string) =>
    apiClient.post<{ success: boolean; downloads: number; url?: string; fileUrl?: string }>(
      `shared-library/${id}/download`
    ),
}
