import { create } from 'zustand'
import { getFirebaseToken } from './authStore'
import {
    startAlarm as playAlarm,
    stopAlarm as stopAlarmSound,
    showTimerNotification
} from '@/utils/alarmManager'

interface TimerState {
    isActive: boolean
    isPaused: boolean
    timeLeft: number
    totalDuration: number
    sessionType: 'work' | 'break'
    subject: string
    pomodoroCount: number
    breaks: number
    sessionStartTime: number | null
    startedAt: number | null // Use for calculating elapsed time on refresh
}

interface TimerStore extends TimerState {
    isLoading: boolean
    alarmFiring: boolean

    // Actions
    init: () => Promise<void>
    start: (subject: string, duration: number, type: 'work' | 'break') => void
    pause: () => void
    resume: () => void
    reset: () => void
    stopAlarm: () => void
    tick: () => void
    syncWithDB: () => Promise<void>
    clearDB: () => Promise<void>
    handleComplete: () => Promise<void>
}

export const useTimerStore = create<TimerStore>((set, get) => ({
    isActive: false,
    isPaused: false,
    timeLeft: 1500, // 25 minutes default
    totalDuration: 1500,
    sessionType: 'work',
    subject: '',
    pomodoroCount: 0,
    breaks: 0,
    sessionStartTime: null,
    startedAt: null,
    isLoading: true,
    alarmFiring: false,

    init: async () => {
        try {
            const token = await getFirebaseToken()
            const headers: Record<string, string> = {}
            if (token) headers['Authorization'] = `Bearer ${token}`

            const response = await fetch('/api/backend/study/active-timer', { headers })
            const { timer } = await response.json()

            if (timer) {
                const now = Date.now()
                const startedAt = timer.startedAt ? new Date(timer.startedAt).getTime() : null
                let remaining = timer.remainingAtPause

                if (timer.isActive && !timer.isPaused && startedAt) {
                    const elapsedSeconds = Math.floor((now - startedAt) / 1000)
                    remaining = Math.max(0, timer.remainingAtPause - elapsedSeconds)
                }

                set({
                    isActive: timer.isActive && remaining > 0 && !timer.isPaused,
                    isPaused: timer.isPaused,
                    timeLeft: isNaN(remaining) ? 0 : remaining,
                    totalDuration: timer.totalDuration || 0,
                    sessionType: timer.sessionType,
                    subject: timer.subject,
                    pomodoroCount: timer.pomodoroCount || 0,
                    breaks: timer.breaks || 0,
                    sessionStartTime: timer.sessionStartTime ? new Date(timer.sessionStartTime).getTime() : null,
                    startedAt: startedAt,
                    isLoading: false
                })

                if (remaining <= 0 && timer.isActive) {
                    get().handleComplete()
                }
            } else {
                set({ isLoading: false })
            }
        } catch (error) {
            console.error('[TimerStore] Init failed:', error)
            set({ isLoading: false })
        }
    },

    start: (subject, duration, type) => {
        const now = Date.now()
        const sessionStart = get().sessionStartTime || now

        const newState = {
            isActive: true,
            isPaused: false,
            subject,
            totalDuration: duration,
            timeLeft: duration,
            sessionType: type,
            startedAt: now,
            sessionStartTime: sessionStart,
            alarmFiring: false
        }

        set(newState)
        get().syncWithDB()
    },

    pause: () => {
        const { timeLeft, breaks } = get()
        set({
            isPaused: true,
            isActive: false,
            startedAt: null,
            breaks: breaks + 1
        })
        get().syncWithDB()
    },

    resume: () => {
        const now = Date.now()
        set({
            isPaused: false,
            isActive: true,
            startedAt: now
        })
        get().syncWithDB()
    },

    reset: () => {
        const { totalDuration } = get()
        set({
            isActive: false,
            isPaused: false,
            timeLeft: totalDuration,
            startedAt: null,
            sessionStartTime: null,
            alarmFiring: false
        })
        get().clearDB()
    },

    stopAlarm: () => {
        stopAlarmSound()
        set({ alarmFiring: false })

        // Reset to default study state after any session ends
        set({
            sessionType: 'work',
            timeLeft: 1500, // Reset to 25 mins
            totalDuration: 1500,
            isActive: false,
            alarmFiring: false
        })
    },

    tick: () => {
        const { isActive, isPaused, timeLeft } = get()
        if (isActive && !isPaused && timeLeft > 0) {
            const newTime = timeLeft - 1
            set({ timeLeft: newTime })

            if (newTime <= 0) {
                get().handleComplete()
            }
        }
    },

    handleComplete: async () => {
        const { subject, sessionType, totalDuration, sessionStartTime, pomodoroCount } = get()

        set({ isActive: false, alarmFiring: true })
        playAlarm()

        if (sessionType === 'work') {
            showTimerNotification('⏰ Session Complete!', `Great job on ${subject || 'your task'}!`)

            // Save session history
            try {
                const token = await getFirebaseToken()
                await fetch('/api/backend/study/log', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: `${subject || 'Study Session'} - Completed`,
                        duration: Math.round(totalDuration / 60),
                        type: 'study',
                        startTime: sessionStartTime ? new Date(sessionStartTime) : new Date()
                    })
                })
                set({ pomodoroCount: pomodoroCount + 1 })
            } catch (err) {
                console.error('Failed to save session:', err)
            }
        } else {
            showTimerNotification('☕ Break Over!', 'Ready to work?')
        }

        get().clearDB()
    },

    syncWithDB: async () => {
        const state = get()
        try {
            const token = await getFirebaseToken()
            await fetch('/api/backend/study/active-timer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    timer: {
                        isActive: state.isActive,
                        isPaused: state.isPaused,
                        startedAt: state.startedAt ? new Date(state.startedAt) : null,
                        remainingAtPause: state.timeLeft,
                        totalDuration: state.totalDuration,
                        sessionType: state.sessionType,
                        subject: state.subject,
                        pomodoroCount: state.pomodoroCount,
                        breaks: state.breaks,
                        sessionStartTime: state.sessionStartTime ? new Date(state.sessionStartTime) : null
                    }
                })
            })
        } catch (err) {
            console.error('DB Sync failed:', err)
        }
    },

    clearDB: async () => {
        try {
            const token = await getFirebaseToken()
            await fetch('/api/backend/study/active-timer', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
        } catch (err) {
            console.error('DB Clear failed:', err)
        }
    }
}))
