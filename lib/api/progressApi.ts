import { apiClient } from '@/lib/api/client'

export const progressApi = {
  getMe: () => apiClient.get('/progress/me'),
  // Alias used in some parts of the app
  getProgress: () => apiClient.get('/progress/me'),
  award: (action: string, metadata?: Record<string, unknown>) =>
    apiClient.post('/progress/award', { action, metadata }),
  getLeaderboard: (params?: { filter?: string; subject?: string }) =>
    apiClient.get('/progress/leaderboard', { params }),
}
