import { apiClient } from '@/lib/api/client'

export const progressApi = {
  getMe: () => apiClient.get('/progress/me'),
  // Alias used in some parts of the app
  getProgress: () => apiClient.get('/progress/me'),
  award: (action: string, metadata?: Record<string, unknown>) =>
    apiClient.post('/progress/award', { action, metadata }),
  updateDailyGoal: (dailyGoalTarget: number) =>
    apiClient.put('/progress/goal', { dailyGoalTarget }),
  getLeaderboard: (params?: { timeframe?: 'today' | 'lifetime' }) =>
    apiClient.get('/progress/leaderboard', { params }),
}
