'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  isAlarmActive,
  startAlarm,
  stopAlarm,
  showTimerNotification,
  requestNotificationPermission
} from '@/utils/alarmManager'
import {
  FiPlay, FiPause, FiRotateCcw, FiCheckCircle, FiTrash2,
  FiTarget, FiClipboard, FiClock, FiCoffee, FiSettings,
  FiBell, FiBellOff, FiZap, FiCalendar, FiBookOpen,
  FiX, FiPlus
} from 'react-icons/fi'
import { BiBrain, BiTimer, BiChair } from 'react-icons/bi'

type TabMode = 'timer' | 'goals' | 'history'

const GOAL_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899'
]

const PRESETS = [
  { label: 'Pomodoro', minutes: 25, color: 'bg-red-500', icon: <BiTimer className="text-xl" /> },
  { label: 'Short Break', minutes: 5, color: 'bg-green-500', icon: <FiCoffee className="text-xl" /> },
  { label: 'Long Break', minutes: 15, color: 'bg-blue-500', icon: <BiChair className="text-xl" /> },
  { label: 'Deep Work', minutes: 52, color: 'bg-purple-500', icon: <BiBrain className="text-xl" /> },
  { label: 'Custom', minutes: 0, color: 'bg-gray-500', icon: <FiSettings className="text-xl" /> },
]

export default function StudyTimer() {
  // Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionType, setSessionType] = useState<'work' | 'break'>('work')
  const [subject, setSubject] = useState('')
  const [pomodoroCount, setPomodoroCount] = useState(0)
  const [breaks, setBreaks] = useState(0)
  const [totalDuration, setTotalDuration] = useState(25 * 60)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [customMinutes, setCustomMinutes] = useState(25)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [alarmFiring, setAlarmFiring] = useState(false)
  const [activeTab, setActiveTab] = useState<TabMode>('timer')

  // Goal state
  const [goals, setGoals] = useState<any[]>([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalForm, setGoalForm] = useState({
    title: '',
    targetMinutes: 60,
    period: 'daily' as 'daily' | 'weekly',
    subject: '',
    color: GOAL_COLORS[0]
  })

  // History
  const [sessions, setSessions] = useState<any[]>([])

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // ============ INIT - Load saved state on mount ============

  useEffect(() => {
    requestNotificationPermission()

    // Check if alarm was active
    if (isAlarmActive()) {
      setAlarmFiring(true)
      startAlarm()
    }

    const loadData = async () => {
      try {
        const match = typeof document !== 'undefined'
          ? document.cookie.match(/(^| )auth-token=([^;]+)/)
          : null
        const token = match ? decodeURIComponent(match[2]) : ''
        const headers = { 'Authorization': `Bearer ${token}` }

        // Load active timer from DB
        const timerRes = await fetch('/api/active-timer', { headers })
        const { timer } = await timerRes.json()

        // Load history from DB
        const historyRes = await fetch('/api/study-sessions', { headers })
        const { sessions: historySessions } = await historyRes.json()
        if (historySessions) setSessions(historySessions)

        // Load goals from DB
        const goalsRes = await fetch('/api/goals', { headers })
        const { goals: dbGoals } = await goalsRes.json()
        if (dbGoals) setGoals(dbGoals)

        if (timer) {
          const now = Date.now()
          const startedAt = timer.startedAt ? new Date(timer.startedAt).getTime() : null
          let remaining = timer.remainingAtPause

          if (timer.isActive && !timer.isPaused && startedAt) {
            const elapsedSeconds = Math.floor((now - startedAt) / 1000)
            remaining = Math.max(0, timer.remainingAtPause - elapsedSeconds)
          }

          setTotalDuration(timer.totalDuration)
          setSessionType(timer.sessionType)
          setSubject(timer.subject || '')
          setPomodoroCount(timer.pomodoroCount || 0)
          setSessionStartTime(timer.sessionStartTime ? new Date(timer.sessionStartTime).getTime() : null)

          if (remaining <= 0 && timer.isActive) {
            setTimeLeft(0)
            setIsActive(false)
            setIsPaused(false)
            handleTimerComplete(timer.subject, timer.totalDuration, timer.sessionType, timer.sessionStartTime)
          } else {
            setTimeLeft(remaining)
            setIsActive(timer.isActive && !timer.isPaused)
            setIsPaused(timer.isPaused)
          }
        }
      } catch (error) {
        console.error('Failed to load timer state or history:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // ============ TIMER TICK ============

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setIsActive(false)

            // Sync completion to DB
            handleTimerComplete(subject, totalDuration, sessionType, sessionStartTime)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, isPaused, subject, totalDuration, sessionType, sessionStartTime])

  // ============ SAVE STATE ON CHANGE (Sync to MongoDB) ============

  useEffect(() => {
    const syncTimer = async () => {
      if (!isActive && !isPaused && timeLeft === totalDuration) return

      const state = {
        isActive,
        isPaused,
        startedAt: isActive && !isPaused ? new Date() : null,
        remainingAtPause: timeLeft,
        totalDuration,
        sessionType,
        subject,
        pomodoroCount,
        sessionStartTime: sessionStartTime ? new Date(sessionStartTime) : null
      }

      try {
        const match = typeof document !== 'undefined'
          ? document.cookie.match(/(^| )auth-token=([^;]+)/)
          : null
        const token = match ? decodeURIComponent(match[2]) : ''

        await fetch('/api/active-timer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ timer: state })
        })
      } catch (error) {
        console.error('Failed to sync timer to DB:', error)
      }
    }

    // Debounced sync to avoid excessive DB writes, or just sync on major changes
    const timer = setTimeout(syncTimer, 5000)
    return () => clearTimeout(timer)
  }, [isActive, isPaused, timeLeft, sessionType, subject, pomodoroCount, sessionStartTime, totalDuration])

  // ============ HANDLE PAGE VISIBILITY ============

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) return

      // Recalculate from DB
      const match = typeof document !== 'undefined'
        ? document.cookie.match(/(^| )auth-token=([^;]+)/)
        : null
      const token = match ? decodeURIComponent(match[2]) : ''
      const headers = { 'Authorization': `Bearer ${token}` }

      const timerRes = await fetch('/api/active-timer', { headers })
      const { timer } = await timerRes.json()

      if (!timer) return

      const now = Date.now()
      const startedAt = timer.startedAt ? new Date(timer.startedAt).getTime() : null
      let remaining = timer.remainingAtPause

      if (timer.isActive && !timer.isPaused && startedAt) {
        const elapsedSeconds = Math.floor((now - startedAt) / 1000)
        remaining = Math.max(0, timer.remainingAtPause - elapsedSeconds)
      }

      if (remaining <= 0 && timer.isActive) {
        setTimeLeft(0)
        setIsActive(false)
        setIsPaused(false)
        handleTimerComplete(timer.subject, timer.totalDuration, timer.sessionType, timer.sessionStartTime)
      } else {
        setTimeLeft(remaining)
      }

      if (isAlarmActive()) setAlarmFiring(true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [subject, totalDuration, sessionType, sessionStartTime])

  // ============ TIMER COMPLETE ============

  const handleTimerComplete = useCallback(async (
    subj: string,
    duration: number,
    type: 'work' | 'break',
    startTime: number | null
  ) => {
    startAlarm()
    setAlarmFiring(true)

    if (type === 'work') {
      await showTimerNotification(
        '⏰ Study Session Complete!',
        `Great work on "${subj || 'your session'}"! Time for a break.`
      )
    } else {
      await showTimerNotification(
        '☕ Break Time Over!',
        'Ready to get back to studying?'
      )
    }

    // Save session to MongoDB
    if (type === 'work' && subj) {
      const match = typeof document !== 'undefined'
        ? document.cookie.match(/(^| )auth-token=([^;]+)/)
        : null
      const token = match ? decodeURIComponent(match[2]) : ''

      const durationMinutes = Math.round(duration / 60)
      const res = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: subj,
          duration: durationMinutes,
          type: 'study',
          startTime: startTime ? new Date(startTime) : new Date()
        })
      })
      const { session: newSession } = await res.json()
      if (newSession) {
        setSessions(prev => [newSession, ...prev])
        setPomodoroCount(prev => prev + 1)
      }
    }

    // Clear active timer in DB
    const match = typeof document !== 'undefined'
      ? document.cookie.match(/(^| )auth-token=([^;]+)/)
      : null
    const token = match ? decodeURIComponent(match[2]) : ''
    await fetch('/api/active-timer', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }, [])

  // ============ STOP ALARM ============

  const handleStopAlarm = () => {
    stopAlarm()
    setAlarmFiring(false)

    // Auto-switch to break/work after stopping alarm
    if (sessionType === 'work') {
      const breakMins = (pomodoroCount + 1) % 4 === 0 ? 15 : 5
      setSessionType('break')
      setTimeLeft(breakMins * 60)
      setTotalDuration(breakMins * 60)
    } else {
      setSessionType('work')
      setTimeLeft(25 * 60)
      setTotalDuration(25 * 60)
    }
  }

  // ============ CONTROLS ============

  const handleStart = () => {
    if (!subject.trim() && sessionType === 'work') {
      alert('Please enter what you are studying')
      return
    }

    const state: TimerState = {
      isActive: true,
      isPaused: false,
      startedAt: Date.now(),
      remainingAtPause: timeLeft,
      totalDuration,
      sessionType,
      subject,
      pomodoroCount,
      breaks,
      sessionStartTime: sessionStartTime || Date.now()
    }

    saveTimerState(state)
    setSessionStartTime(state.sessionStartTime)
    setIsActive(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsPaused(true)
    setBreaks(prev => prev + 1)

    const state: TimerState = {
      isActive: true,
      isPaused: true,
      startedAt: null,
      remainingAtPause: timeLeft,
      totalDuration,
      sessionType,
      subject,
      pomodoroCount,
      breaks: breaks + 1,
      sessionStartTime
    }
    saveTimerState(state)
  }

  const handleResume = () => {
    const state: TimerState = {
      isActive: true,
      isPaused: false,
      startedAt: Date.now(),
      remainingAtPause: timeLeft,
      totalDuration,
      sessionType,
      subject,
      pomodoroCount,
      breaks,
      sessionStartTime
    }
    saveTimerState(state)
    setIsPaused(false)
  }

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    clearTimerState()
    setIsActive(false)
    setIsPaused(false)
    setTimeLeft(totalDuration)
    setBreaks(0)
    setSessionStartTime(null)
  }

  const applyPreset = (minutes: number) => {
    if (minutes === 0) {
      setShowCustomInput(true)
      return
    }
    setShowCustomInput(false)
    handleReset()
    const secs = minutes * 60
    setTotalDuration(secs)
    setTimeLeft(secs)
    setCustomMinutes(minutes)
  }

  const applyCustomDuration = () => {
    if (customMinutes < 1) return
    const secs = customMinutes * 60
    setTotalDuration(secs)
    setTimeLeft(secs)
    setIsActive(false)
    setIsPaused(false)
    clearTimerState()
    setShowCustomInput(false)
  }

  // ============ GOAL ACTIONS ============

  const handleAddGoal = async () => {
    if (!goalForm.title.trim()) {
      alert('Please enter a goal title')
      return
    }

    try {
      const match = typeof document !== 'undefined'
        ? document.cookie.match(/(^| )auth-token=([^;]+)/)
        : null
      const token = match ? decodeURIComponent(match[2]) : ''

      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalForm)
      })
      const { goals: newGoals } = await res.json()
      if (newGoals) setGoals(newGoals)

      setGoalForm({
        title: '',
        targetMinutes: 60,
        period: 'daily',
        subject: '',
        color: GOAL_COLORS[0]
      })
      setShowGoalForm(false)
    } catch (error) {
      console.error('Failed to add goal:', error)
    }
  }

  const handleDeleteGoal = async (id: string) => {
    try {
      const match = typeof document !== 'undefined'
        ? document.cookie.match(/(^| )auth-token=([^;]+)/)
        : null
      const token = match ? decodeURIComponent(match[2]) : ''

      const res = await fetch(`/api/goals?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const { goals: newGoals } = await res.json()
      if (newGoals) setGoals(newGoals)
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  // ============ HELPERS ============

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const progress = totalDuration > 0
    ? ((totalDuration - timeLeft) / totalDuration) * 100
    : 0

  const circumference = 2 * Math.PI * 110
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  // Calculate goal progress locally based on history
  const goalProgress = goals.map(goal => {
    // Filter sessions that match the goal subject (if any) and period
    const relevantSessions = sessions.filter(s => {
      if (goal.subject && s.title?.toLowerCase() !== goal.subject.toLowerCase()) return false

      const sessionDate = new Date(s.createdAt || s.startTime)
      const now = new Date()
      if (goal.period === 'daily') {
        return sessionDate.toDateString() === now.toDateString()
      } else {
        // weekly - within last 7 days for simplicity
        return now.getTime() - sessionDate.getTime() < 7 * 24 * 60 * 60 * 1000
      }
    })

    const completedMinutes = relevantSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const percentage = Math.min(100, Math.round((completedMinutes / goal.targetMinutes) * 100))

    return {
      goal,
      completedMinutes,
      percentage,
      isCompleted: percentage >= 100
    }
  })

  // ============ RENDER ============

  return (
    <div className="space-y-6">

      {/* Alarm Banner - shows when alarm is firing */}
      {alarmFiring && (
        <div className="bg-red-500 text-white rounded-xl p-4 flex items-center justify-between animate-pulse shadow-lg">
          <div className="flex items-center gap-3">
            <FiBell className="text-2xl" />
            <div>
              <p className="font-bold text-lg">
                {sessionType === 'break' ? 'Break Over! Time to Study!' : 'Session Complete!'}
              </p>
              <p className="text-red-100 text-sm">
                Alarm is ringing — click Stop Alarm to silence it
              </p>
            </div>
          </div>
          <button
            onClick={handleStopAlarm}
            className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-red-50 transition shadow-md text-sm whitespace-nowrap"
          >
            <FiBellOff /> Stop Alarm
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {(['timer', 'goals', 'history'] as TabMode[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition capitalize ${activeTab === tab
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
          >
            {tab === 'timer' && <BiTimer />}
            {tab === 'goals' && <FiTarget />}
            {tab === 'history' && <FiClipboard />}
            {tab}
          </button>
        ))}
      </div>

      {/* ============ TIMER TAB ============ */}
      {activeTab === 'timer' && (
        <div className="space-y-6">

          {/* Main Timer Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">

            {/* Session Type Badge */}
            <div className="text-center mb-6">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${sessionType === 'work'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }`}>
                {sessionType === 'work' ? <FiBookOpen /> : <FiCoffee />}
                {sessionType === 'work' ? 'Focus Session' : 'Break Time'}
              </span>
            </div>

            {/* Circular Timer */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg width="260" height="260" className="-rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="130" cy="130" r="110"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="130" cy="130" r="110"
                    fill="none"
                    stroke={sessionType === 'work' ? '#3B82F6' : '#10B981'}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000"
                  />
                </svg>

                {/* Timer Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {isActive && !isPaused ? <><FiPlay className="text-xs" /> Running</> : isPaused ? <><FiPause className="text-xs" /> Paused</> : <><FiRotateCcw className="text-xs" /> Ready</>}
                  </div>
                  {isActive && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <FiZap className="text-orange-500" /> {pomodoroCount} pomodoros
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subject Input - only when not active */}
            {!isActive && sessionType === 'work' && (
              <div className="mb-6">
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="What are you studying? (required)"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
                />
              </div>
            )}

            {/* Active subject label */}
            {isActive && subject && (
              <p className="flex justify-center items-center gap-2 text-center text-gray-600 dark:text-gray-400 mb-6">
                <FiBookOpen /> Studying: <span className="font-semibold text-gray-900 dark:text-white">{subject}</span>
              </p>
            )}

            {/* Control Buttons */}
            <div className="flex justify-center gap-3 mb-6">
              {!isActive ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md text-lg"
                >
                  <FiPlay /> Start
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button
                      onClick={handleResume}
                      className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition"
                    >
                      <FiPlay /> Resume
                    </button>
                  ) : (
                    <button
                      onClick={handlePause}
                      className="flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition"
                    >
                      <FiPause /> Pause
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition"
                  >
                    <FiRotateCcw /> Reset
                  </button>
                </>
              )}
            </div>

            {/* Presets */}
            {!isActive && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3 uppercase tracking-wider">
                  Quick Presets
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => applyPreset(preset.minutes)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition text-center ${(preset.minutes > 0 && totalDuration === preset.minutes * 60) ||
                        (preset.minutes === 0 && showCustomInput)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                        }`}
                    >
                      <div className="mb-1 text-gray-700 dark:text-gray-300">
                        {preset.icon}
                      </div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {preset.label}
                      </span>
                      {preset.minutes > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {preset.minutes}m
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                {showCustomInput && (
                  <div className="mt-4 flex gap-2 items-center">
                    <input
                      type="number"
                      min={1}
                      max={480}
                      value={customMinutes}
                      onChange={e => setCustomMinutes(Number(e.target.value))}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter minutes"
                    />
                    <span className="text-gray-500 dark:text-gray-400 text-sm">minutes</span>
                    <button
                      onClick={applyCustomDuration}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      Set
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Session Stats while active */}
            {isActive && (
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{pomodoroCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Pomodoros</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{breaks}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Breaks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(progress)}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Complete</p>
                </div>
              </div>
            )}
          </div>

          {/* Goal Progress Cards - shown in timer tab */}
          {goalProgress.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white mb-4">
                <FiTarget /> Today's Goals
              </h3>
              <div className="space-y-3">
                {goalProgress.filter(g => g.goal.period === 'daily').map(({ goal, completedMinutes, percentage, isCompleted }) => (
                  <div key={goal._id}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: goal.color }}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {goal.title}
                          {goal.subject && <span className="text-gray-400 ml-1">({goal.subject})</span>}
                        </span>
                        {isCompleted && <FiCheckCircle className="text-green-500" />}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDuration(completedMinutes)} / {formatDuration(goal.targetMinutes)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: goal.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ GOALS TAB ============ */}
      {activeTab === 'goals' && (
        <div className="space-y-4">

          {/* Add Goal Button */}
          <div className="flex justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {goals.length} active goal{goals.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
            >
              {showGoalForm ? <><FiX /> Cancel</> : <><FiPlus /> Add Goal</>}
            </button>
          </div>

          {/* Goal Form */}
          {showGoalForm && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiTarget className="text-blue-500" /> Create Study Goal
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    value={goalForm.title}
                    onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
                    placeholder="e.g. Study 2 hours daily"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Duration
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={goalForm.targetMinutes}
                        onChange={e => setGoalForm({ ...goalForm, targetMinutes: Number(e.target.value) })}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">min</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Period
                    </label>
                    <select
                      value={goalForm.period}
                      onChange={e => setGoalForm({ ...goalForm, period: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject (optional)
                  </label>
                  <input
                    type="text"
                    value={goalForm.subject}
                    onChange={e => setGoalForm({ ...goalForm, subject: e.target.value })}
                    placeholder="e.g. Mathematics, Biology..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {GOAL_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setGoalForm({ ...goalForm, color })}
                        style={{ backgroundColor: color }}
                        className={`w-8 h-8 rounded-full transition border-4 ${goalForm.color === color
                          ? 'border-gray-900 dark:border-white scale-110'
                          : 'border-transparent hover:scale-105'
                          }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAddGoal}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
                >
                  Create Goal
                </button>
              </div>
            </div>
          )}

          {/* Goals List */}
          {goals.length === 0 && !showGoalForm ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <FiTarget className="text-5xl mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No goals yet. Set a study goal to stay motivated!
              </p>
              <button
                onClick={() => setShowGoalForm(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Set Your First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {goalProgress.map(({ goal, completedMinutes, percentage, isCompleted }) => (
                <div
                  key={goal._id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border-2 shadow-sm ${isCompleted
                    ? 'border-green-400 dark:border-green-600'
                    : 'border-gray-200 dark:border-gray-700'
                    }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: goal.color }}
                      />
                      <div>
                        <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                          {goal.title}
                          {isCompleted && <FiCheckCircle className="text-green-500" />}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          {goal.period === 'daily' ? <><FiCalendar className="text-xs" /> Daily</> : <><FiCalendar className="text-xs" /> Weekly</>}
                          {goal.subject && ` • ${goal.subject}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="text-gray-400 hover:text-red-500 transition p-1"
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatDuration(completedMinutes)} completed
                      </span>
                      <span className="font-medium" style={{ color: goal.color }}>
                        {percentage}% of {formatDuration(goal.targetMinutes)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: goal.color
                        }}
                      />
                    </div>
                    {!isCompleted && (
                      <p className="text-xs text-gray-400">
                        {formatDuration(goal.targetMinutes - completedMinutes)} remaining
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ HISTORY TAB ============ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
              <FiClipboard className="text-5xl mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                No study sessions yet. Complete a session to see your history!
              </p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'Total Sessions',
                    value: sessions.length,
                    color: 'blue'
                  },
                  {
                    label: 'Total Hours',
                    value: `${(sessions.reduce((s, r) => s + (r.duration || 0), 0) / 60).toFixed(1)}h`,
                    color: 'green'
                  },
                  {
                    label: 'This Week',
                    value: sessions.filter(s =>
                      new Date(s.createdAt || s.startTime).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
                    ).length,
                    color: 'purple'
                  }
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className={`bg-${color}-50 dark:bg-${color}-900/20 rounded-xl p-4 text-center border border-${color}-200 dark:border-${color}-800`}
                  >
                    <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>
                      {value}
                    </p>
                    <p className={`text-xs text-${color}-700 dark:text-${color}-300`}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Session List */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white">Recent Sessions</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {sessions.map(session => (
                    <div key={session._id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-lg">
                          <FiBookOpen className="text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {session.title || session.subject}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(session.createdAt || session.startTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDuration(session.duration)}
                        </p>
                        <p className="flex items-center gap-1 justify-end text-xs text-green-600 dark:text-green-400">
                          <FiCheckCircle /> Completed
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
