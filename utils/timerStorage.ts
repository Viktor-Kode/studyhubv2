/**
 * @deprecated Timer state is now managed via backend API at /api/backend/study/active-timer
 * This file is kept for backward compatibility but should not be used for new code.
 */

export interface TimerState {
    isActive: boolean
    isPaused: boolean
    startedAt: number | null
    remainingAtPause: number
    totalDuration: number
    sessionType: 'work' | 'break'
    subject: string
    pomodoroCount: number
    breaks: number
    sessionStartTime: number | null
}

export const saveTimerState = (state: TimerState) => {
    // No-op: handled in StudyTimer component via API
}

export const loadTimerState = (): TimerState | null => {
    return null // Must be loaded async in component
}

export const clearTimerState = () => {
    // No-op
}

export const calculateRemainingTime = (state: TimerState): number => {
    if (!state.isActive || state.isPaused) {
        return state.remainingAtPause
    }

    if (!state.startedAt) return state.remainingAtPause

    const elapsedSeconds = Math.floor((Date.now() - state.startedAt) / 1000)
    const remaining = state.remainingAtPause - elapsedSeconds
    return Math.max(0, remaining)
}
