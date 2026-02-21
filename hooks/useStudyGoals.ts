import { useState, useEffect } from 'react'
import { userStorage } from '@/lib/utils/userStorage'

export interface StudyGoal {
    id: string
    title: string
    targetMinutes: number
    period: 'daily' | 'weekly'
    subject?: string
    color: string
    createdAt: number
}

export interface GoalProgress {
    goal: StudyGoal
    completedMinutes: number
    percentage: number
    isCompleted: boolean
}

const GOALS_KEY = 'studyGoals'
const SESSIONS_KEY = 'studySessionsLocal'

export const useStudyGoals = () => {
    const [goals, setGoals] = useState<StudyGoal[]>([])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const saved = userStorage.getItem(GOALS_KEY)
        if (saved) {
            try { setGoals(JSON.parse(saved)) } catch { }
        }
    }, [])

    const saveGoals = (updated: StudyGoal[]) => {
        if (typeof window === 'undefined') return
        setGoals(updated)
        userStorage.setItem(GOALS_KEY, JSON.stringify(updated))
    }

    const addGoal = (goal: Omit<StudyGoal, 'id' | 'createdAt'>) => {
        const newGoal: StudyGoal = {
            ...goal,
            id: Date.now().toString(),
            createdAt: Date.now()
        }
        saveGoals([...goals, newGoal])
        return newGoal
    }

    const deleteGoal = (id: string) => {
        saveGoals(goals.filter(g => g.id !== id))
    }

    const getGoalProgress = (goal: StudyGoal): GoalProgress => {
        const sessions = getLocalSessions()
        const now = Date.now()

        let startTime: number
        if (goal.period === 'daily') {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            startTime = today.getTime()
        } else {
            startTime = now - 7 * 24 * 60 * 60 * 1000
        }

        const relevantSessions = sessions.filter(s => {
            const sessionTime = s.completedAt
            if (sessionTime < startTime) return false
            if (goal.subject && s.subject !== goal.subject) return false
            return true
        })

        const completedMinutes = relevantSessions.reduce((sum, s) => sum + s.duration, 0)
        const percentage = Math.min(100, Math.round((completedMinutes / goal.targetMinutes) * 100))

        return {
            goal,
            completedMinutes,
            percentage,
            isCompleted: completedMinutes >= goal.targetMinutes
        }
    }

    const getAllProgress = (): GoalProgress[] => {
        return goals.map(getGoalProgress)
    }

    return { goals, addGoal, deleteGoal, getGoalProgress, getAllProgress }
}

// Local session storage helpers
export interface LocalSession {
    id: string
    subject: string
    duration: number
    completedAt: number
    sessionType: string
}

export const saveLocalSession = (session: Omit<LocalSession, 'id'>) => {
    if (typeof window === 'undefined') return { ...session, id: Date.now().toString() } as LocalSession

    const sessions = getLocalSessions()
    const newSession = { ...session, id: Date.now().toString() }
    sessions.push(newSession)
    // Keep last 100 sessions only
    const trimmed = sessions.slice(-100)
    userStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed))
    return newSession
}

export const getLocalSessions = (): LocalSession[] => {
    if (typeof window === 'undefined') return []
    try {
        const saved = userStorage.getItem(SESSIONS_KEY)
        return saved ? JSON.parse(saved) : []
    } catch {
        return []
    }
}
