export interface TimerState {
    isActive: boolean
    isPaused: boolean
    startedAt: number | null       // timestamp when timer last started/resumed
    remainingAtPause: number       // seconds remaining when paused
    totalDuration: number          // total duration in seconds
    sessionType: 'work' | 'break'
    subject: string
    pomodoroCount: number
    breaks: number
    sessionStartTime: number | null
}

const STORAGE_KEY = 'studyTimerState'

export const saveTimerState = (state: TimerState) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const loadTimerState = (): TimerState | null => {
    if (typeof window === 'undefined') return null
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (!saved) return null
        return JSON.parse(saved)
    } catch {
        return null
    }
}

export const clearTimerState = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
}

// Calculate current remaining time based on saved state
export const calculateRemainingTime = (state: TimerState): number => {
    if (!state.isActive || state.isPaused) {
        return state.remainingAtPause
    }

    if (!state.startedAt) return state.remainingAtPause

    const elapsedSeconds = Math.floor((Date.now() - state.startedAt) / 1000)
    const remaining = state.remainingAtPause - elapsedSeconds
    return Math.max(0, remaining)
}
