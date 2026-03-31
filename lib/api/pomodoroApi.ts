import { apiClient } from '@/lib/api/client'

export type PomodoroSessionDoc = {
  _id: string
  userId: string
  duration: number
  type: 'work' | 'shortBreak' | 'longBreak'
  completed: boolean
  taskName?: string
  startTime?: string
  endTime?: string
  createdAt?: string
}

export const pomodoroApi = {
  log: (body: {
    duration: number
    type: 'work' | 'shortBreak' | 'longBreak'
    completed: boolean
    taskName?: string
    startTime?: string
    endTime?: string
  }) =>
    apiClient.post<{
      success: boolean
      session: PomodoroSessionDoc
      xp?: { pomodoro_complete?: number; pomodoro_streak_daily?: number }
    }>('pomodoro/log', body),
  stats: () =>
    apiClient.get<{
      success: boolean
      stats: {
        pomodorosToday: number
        focusMinutesToday: number
        focusHoursToday: number
        weekStreakDays: number
        totalWorkSessionsWeek: number
      }
      recent: PomodoroSessionDoc[]
    }>('pomodoro/stats'),
  history: (limit?: number) =>
    apiClient.get<{ success: boolean; history: PomodoroSessionDoc[] }>('pomodoro/history', {
      params: { limit },
    }),
}
