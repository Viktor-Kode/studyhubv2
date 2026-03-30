'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  isAlarmActive,
  requestNotificationPermission
} from '@/utils/alarmManager'
import {
  FiPlus, FiTrash2, FiEdit2, FiClock, FiCalendar, FiX, FiCheck, FiCheckCircle,
  FiBell, FiBellOff, FiPlay, FiPause, FiRotateCcw, FiTarget, FiCoffee,
  FiClipboard, FiBookOpen, FiZap
} from 'react-icons/fi'
import { toast } from 'react-hot-toast'
import { BiBrain, BiTimer, BiChair } from 'react-icons/bi'
import { getFirebaseToken } from '@/lib/store/authStore'
import { useTimerStore } from '@/lib/store/timerStore'

type TabMode = 'timer' | 'goals' | 'history'

const GOAL_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899'
]

const PRESETS = [
  { label: 'Pomodoro', minutes: 25, type: 'work' as const, color: 'bg-red-500', icon: <BiTimer className="text-xl" /> },
  { label: 'Short Break', minutes: 5, type: 'break' as const, color: 'bg-green-500', icon: <FiCoffee className="text-xl" /> },
  { label: 'Long Break', minutes: 15, type: 'break' as const, color: 'bg-blue-500', icon: <BiChair className="text-xl" /> },
  { label: 'Deep Work', minutes: 52, type: 'work' as const, color: 'bg-purple-500', icon: <BiBrain className="text-xl" /> },
]

export default function StudyTimer() {
  const store = useTimerStore()

  // UI local state (not in store)
  const [activeTab, setActiveTab] = useState<TabMode>('timer')
  const [loading, setLoading] = useState(true)
  const [customMinutes, setCustomMinutes] = useState(25)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [customHours, setCustomHours] = useState(0)
  const [customSecs, setCustomSecs] = useState(0)
  const [localSubject, setLocalSubject] = useState('')

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
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)

  // History
  const [sessions, setSessions] = useState<any[]>([])

  const fetchHistoryAndGoals = async () => {
    try {
      const token = await getFirebaseToken()
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const [historyRes, goalsRes] = await Promise.all([
        fetch('/api/backend/study/history', { headers, cache: 'no-store' }),
        fetch('/api/backend/study/goals', { headers, cache: 'no-store' })
      ])

      const historyData = await historyRes.json()
      const goalsData = await goalsRes.json()

      if (historyData.sessions) setSessions(historyData.sessions)
      if (goalsData.goals) setGoals(goalsData.goals)
    } catch (err) {
      console.error('Failed to load history/goals:', err)
    } finally {
      setLoading(false)
    }
  }

  // ============ INIT ============
  useEffect(() => {
    requestNotificationPermission()

    const initData = async () => {
      await store.init()
      setLocalSubject(store.subject || '')
      await fetchHistoryAndGoals()
    }

    initData()
  }, [])

  useEffect(() => {
    // Whenever a complete event increments the pomodoroCount, refetch history and goals
    if (store.pomodoroCount > 0) {
      fetchHistoryAndGoals()
    }
  }, [store.pomodoroCount])

  // ============ TIMER TICK ============
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (store.isActive && !store.isPaused) {
      interval = setInterval(() => {
        handleTickStep()
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [store.isActive, store.isPaused])

  // ============ CONTROLS ============
  const handleStart = () => {
    store.start(localSubject, store.totalDuration, store.sessionType)
  }

  const handleSessionComplete = (result: any) => {
    if (result?.goalCompleted) {
      toast.success(`🎉 Goal Completed: ${result.goalTitle}!`, {
        duration: 6000,
        icon: '🏆',
      })
      // If we had a confetti function, we'd call it here
    }
  }

  const handleTickStep = () => {
    if (store.timeLeft <= 1 && store.isActive) {
      store.handleComplete(handleSessionComplete)
    } else {
      store.tick()
    }
  }

  const applyPreset = (minutes: number, type: 'work' | 'break') => {
    store.reset()
    // Update local subject for work sessions
    if (type === 'work' && !localSubject.trim()) {
      // Just keep old subject or stay empty
    }

    useTimerStore.setState({
      timeLeft: minutes * 60,
      totalDuration: minutes * 60,
      sessionType: type,
      isActive: false
    })
  }

  const applyCustomDuration = () => {
    const totalSeconds = (customHours * 3600) + (customMinutes * 60) + customSecs
    if (totalSeconds < 60) return
    useTimerStore.setState({ timeLeft: totalSeconds, totalDuration: totalSeconds, isActive: false })
    setShowTimePicker(false)
  }
  const openTimePicker = () => {
    const base = store.totalDuration || store.timeLeft || 1500
    setCustomHours(Math.floor(base / 3600))
    setCustomMinutes(Math.floor((base % 3600) / 60))
    setCustomSecs(base % 60)
    setShowTimePicker(true)
  }


  // ============ GOAL ACTIONS ============
  const handleAddGoal = async () => {
    if (!goalForm.title.trim()) {
      toast.error('Please enter a goal title')
      return
    }
    try {
      const token = await getFirebaseToken()
      const url = editingGoalId
        ? `/api/backend/study/goals?id=${editingGoalId}`
        : '/api/backend/study/goals'
      const method = editingGoalId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalForm)
      })
      const { goals: newGoals } = await res.json()
      if (newGoals) setGoals(newGoals)
      setGoalForm({ title: '', targetMinutes: 60, period: 'daily', subject: '', color: GOAL_COLORS[0] })
      setEditingGoalId(null)
      setShowGoalForm(false)
      toast.success(editingGoalId ? 'Goal updated!' : 'Goal added!')
    } catch (error) {
      toast.error(editingGoalId ? 'Failed to update goal' : 'Failed to add goal')
    }
  }

  const handleDeleteGoal = async (id: string) => {
    try {
      const token = await getFirebaseToken()
      const res = await fetch(`/api/backend/study/goals?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const { goals: newGoals } = await res.json()
      if (newGoals) setGoals(newGoals)
      toast.success('Goal deleted')
    } catch (error) {
      toast.error('Failed to delete goal')
    }
  }

  // ============ HELPERS ============
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const progress = store.totalDuration > 0
    ? ((store.totalDuration - store.timeLeft) / store.totalDuration) * 100
    : 0

  const circumference = 2 * Math.PI * 110
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  }

  const goalProgress = goals.map(goal => {
    const relevantSessions = sessions.filter(s => {
      if (goal.subject && s.title?.toLowerCase() !== goal.subject.toLowerCase()) return false
      const sessionDate = new Date(s.createdAt || s.startTime)
      const now = new Date()
      if (goal.period === 'daily') return sessionDate.toDateString() === now.toDateString()
      return now.getTime() - sessionDate.getTime() < 7 * 24 * 60 * 60 * 1000
    })
    const completedMinutes = relevantSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
    const percentage = Math.min(100, Math.round((completedMinutes / goal.targetMinutes) * 100))
    return { goal, completedMinutes, percentage, isCompleted: percentage >= 100 }
  })

  // Do not block UI for history/goals

  return (
    <div className="space-y-6">
      {store.alarmFiring && (
        <div className="bg-red-500 text-white rounded-xl p-4 flex items-center justify-between animate-pulse shadow-lg">
          <div className="flex items-center gap-3">
            <FiBell className="text-2xl" />
            <div>
              <p className="font-bold text-lg">
                {store.sessionType === 'break' ? 'Break Over! Time to Study!' : 'Session Complete!'}
              </p>
              <p className="text-red-100 text-sm">Alarm is ringing — silence it to continue</p>
            </div>
          </div>
          <button
            onClick={() => store.stopAlarm()}
            className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-red-50 transition shadow-md text-sm"
          >
            <FiBellOff /> Stop Alarm
          </button>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {(['timer', 'goals', 'history'] as TabMode[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition capitalize ${activeTab === tab
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            {tab === 'timer' && <BiTimer />}
            {tab === 'goals' && <FiTarget />}
            {tab === 'history' && <FiClipboard />}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'timer' && (
        <div className="space-y-6">
          {/* GOAL SELECTION BAR */}
          {goals.length > 0 && !store.isActive && !store.isPaused && store.sessionType === 'work' && (
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 transition-all">
              <div className="flex items-center gap-3 whitespace-nowrap">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600">
                  <FiTarget className="text-xl" />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Goal Linking</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Study for a specific goal?</p>
                </div>
              </div>

              <select
                value={store.selectedGoalId || ''}
                onChange={(e) => {
                  const goalId = e.target.value;
                  const goal = goals.find(g => g._id === goalId);
                  useTimerStore.setState({ selectedGoalId: goalId || null });
                  if (goal) {
                    setLocalSubject(goal.title);
                  }
                  store.syncWithDB();
                }}
                className="flex-1 w-full sm:w-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              >
                <option value="">None (Free Study)</option>
                {goals.map(g => (
                  <option key={g._id} value={g._id}>
                    {g.title} ({Math.round((g.completedMinutes / g.targetMinutes) * 100)}% complete)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ACTIVE GOAL PREVIEW */}
          {store.selectedGoalId && goals.find(g => g._id === store.selectedGoalId) && (
            <div className={`p-4 rounded-2xl border transition-all ${store.isActive ? 'bg-blue-600 text-white border-transparent' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'}`}>
              {(() => {
                const goal = goals.find(g => g._id === store.selectedGoalId);
                if (!goal) return null;
                const pct = Math.min(100, Math.round((goal.completedMinutes / goal.targetMinutes) * 100));
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="flex items-center gap-2">
                        <FiTarget className={store.isActive ? 'text-blue-100' : 'text-blue-600'} />
                        {goal.title}
                      </span>
                      <span className={store.isActive ? 'text-blue-100' : 'text-gray-500'}>{pct}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${store.isActive ? 'bg-blue-400' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      <div
                        className={`h-full transition-all duration-500 ${store.isActive ? 'bg-white' : 'bg-blue-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${store.sessionType === 'work'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
                {store.sessionType === 'work' ? <FiBookOpen /> : <FiCoffee />}
                {store.sessionType === 'work' ? 'Study Time' : 'Break Time'}
              </span>
            </div>

            <div className="flex justify-center mb-6">
              <button
                type="button"
                onClick={() => {
                  if (!store.isActive && !store.isPaused) openTimePicker()
                }}
                className="relative"
                title={!store.isActive && !store.isPaused ? 'Set custom time' : undefined}
              >
                <svg width="260" height="260" className="-rotate-90">
                  <circle cx="130" cy="130" r="110" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-200 dark:text-gray-700" />
                  <circle cx="130" cy="130" r="110" fill="none" stroke={store.sessionType === 'work' ? '#3B82F6' : '#10B981'} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold text-gray-900 dark:text-white tabular-nums">{formatTime(store.timeLeft)}</div>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {store.isActive && !store.isPaused ? <><FiPlay className="text-xs" /> Running</> : store.isPaused ? <><FiPause className="text-xs" /> Paused</> : <><FiRotateCcw className="text-xs" /> Ready</>}
                  </div>
                  {store.pomodoroCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <FiZap className="text-orange-500" /> {store.pomodoroCount} pomodoros
                    </div>
                  )}
                </div>
              </button>
            </div>

            {!store.isActive && !store.isPaused && store.sessionType === 'work' && (
              <div className="mb-6">
                <input
                  type="text"
                  value={localSubject}
                  onChange={e => setLocalSubject(e.target.value)}
                  placeholder="What are you studying? (optional)"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-center"
                />
              </div>
            )}

            {(store.isActive || store.isPaused) && store.subject && (
              <p className="flex justify-center items-center gap-2 text-center text-gray-600 dark:text-gray-400 mb-6">
                <FiBookOpen /> Studying: <span className="font-semibold text-gray-900 dark:text-white">{store.subject}</span>
              </p>
            )}

            <div className="flex justify-center gap-3 mb-6">
              {!store.isActive && !store.isPaused ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md text-lg"
                >
                  <FiPlay /> Start
                </button>
              ) : (
                <>
                  {store.isPaused ? (
                    <button onClick={() => store.resume()} className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition"><FiPlay /> Resume</button>
                  ) : (
                    <button onClick={() => store.pause()} className="flex items-center gap-2 px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition"><FiPause /> Pause</button>
                  )}
                  <button onClick={() => store.reset()} className="flex items-center gap-2 px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition"><FiRotateCcw /> Reset</button>
                </>
              )}
            </div>

            {!store.isActive && !store.isPaused && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3 uppercase tracking-wider">Quick Presets</p>
                <div className="grid grid-cols-4 gap-2">
                  {PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => applyPreset(p.minutes, p.type)}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition text-center ${(store.totalDuration === p.minutes * 60) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
                    >
                      <div className="mb-1 text-gray-700 dark:text-gray-300">{p.icon}</div>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{p.label}</span>
                      {p.minutes > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">{p.minutes}m</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showTimePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Set Custom Timer</h3>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" min={0} max={23} value={customHours} onChange={(e) => setCustomHours(Number(e.target.value))} className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700" placeholder="Hours" />
              <input type="number" min={0} max={59} value={customMinutes} onChange={(e) => setCustomMinutes(Number(e.target.value))} className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700" placeholder="Minutes" />
              <input type="number" min={0} max={59} value={customSecs} onChange={(e) => setCustomSecs(Number(e.target.value))} className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700" placeholder="Seconds" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowTimePicker(false)} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">Cancel</button>
              <button onClick={applyCustomDuration} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Apply</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">{goals.length} active goal{goals.length !== 1 ? 's' : ''}</p>
            <button onClick={() => {
              setEditingGoalId(null)
              setGoalForm({ title: '', targetMinutes: 60, period: 'daily', subject: '', color: GOAL_COLORS[0] })
              setShowGoalForm(!showGoalForm)
            }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">{showGoalForm ? <><FiX /> Cancel</> : <><FiPlus /> Add Goal</>}</button>
          </div>
          {showGoalForm && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FiTarget className="text-blue-500" /> {editingGoalId ? 'Edit Study Goal' : 'Create Study Goal'}</h3>
              <div className="space-y-4">
                <input type="text" value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="Goal Title *" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={goalForm.targetMinutes} onChange={e => setGoalForm({ ...goalForm, targetMinutes: Number(e.target.value) })} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                  <select value={goalForm.period} onChange={e => setGoalForm({ ...goalForm, period: e.target.value as any })} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <input type="text" value={goalForm.subject} onChange={e => setGoalForm({ ...goalForm, subject: e.target.value })} placeholder="Subject (optional)" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                <div className="flex gap-2">
                  {GOAL_COLORS.map(c => <button key={c} onClick={() => setGoalForm({ ...goalForm, color: c })} style={{ backgroundColor: c }} className={`w-8 h-8 rounded-full border-4 ${goalForm.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`} />)}
                </div>
                <button onClick={handleAddGoal} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">{editingGoalId ? 'Update Goal' : 'Create Goal'}</button>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {goalProgress.map(({ goal, completedMinutes, percentage, isCompleted }) => (
              <div key={goal._id} className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border-2 ${isCompleted ? 'border-green-400' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: goal.color }} />
                    <div>
                      <h4 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">{goal.title} {isCompleted && <FiCheckCircle className="text-green-500" />}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{goal.period} {goal.subject && ` • ${goal.subject}`}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setGoalForm({
                        title: goal.title,
                        targetMinutes: goal.targetMinutes,
                        period: goal.period,
                        subject: goal.subject || '',
                        color: goal.color
                      })
                      setEditingGoalId(goal._id)
                      setShowGoalForm(true)
                    }} className="text-gray-400 hover:text-blue-500 p-1"><FiEdit2 /></button>
                    <button onClick={() => handleDeleteGoal(goal._id)} className="text-gray-400 hover:text-red-500 p-1"><FiTrash2 /></button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div className="h-3 rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: goal.color }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatDuration(completedMinutes)} / {formatDuration(goal.targetMinutes)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700"><h3 className="font-bold">Recent Sessions</h3></div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {sessions.map(s => (
                <div key={s._id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><FiBookOpen className="text-blue-500" /></div>
                    <div>
                      <p className="font-medium text-sm">{s.title || s.subject}</p>
                      <p className="text-xs text-gray-500">{new Date(s.createdAt || s.startTime).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatDuration(s.duration)}</p>
                    <p className="text-xs text-green-600 flex items-center gap-1"><FiCheckCircle /> Completed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
