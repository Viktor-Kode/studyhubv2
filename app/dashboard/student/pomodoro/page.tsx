'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import ProgressWidget from '@/components/ProgressWidget'
import { useRouter } from 'next/navigation'
import { useProgress, showXPToast } from '@/hooks/useProgress'
import { pomodoroApi } from '@/lib/api/pomodoroApi'
import { toast } from 'react-hot-toast'

const SETTINGS_KEY = 'studyhelp-pomodoro-settings-v1'

type Mode = 'work' | 'shortBreak' | 'longBreak'

type Settings = {
  work: number
  shortBreak: number
  longBreak: number
  autoStartBreak: boolean
  sound: boolean
}

const defaultSettings: Settings = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  autoStartBreak: false,
  sound: true,
}

function loadSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return defaultSettings
    return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    return defaultSettings
  }
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

export default function PomodoroTimerPage() {
  const router = useRouter()
  const { refetch } = useProgress()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [mode, setMode] = useState<Mode>('work')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [stats, setStats] = useState<Awaited<ReturnType<typeof pomodoroApi.stats>>['data'] | null>(null)
  const startedRef = useRef<number | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const s = loadSettings()
    setSettings(s)
    setSecondsLeft(Math.round(s.work * 60))
  }, [])

  const durationMin = useMemo(() => {
    if (mode === 'work') return settings.work
    if (mode === 'shortBreak') return settings.shortBreak
    return settings.longBreak
  }, [mode, settings])

  const clearTick = () => {
    if (tickRef.current) clearInterval(tickRef.current)
    tickRef.current = null
  }

  const onCompleteRef = useRef<(m: Mode, sec: number) => void>(() => {})

  const playChime = useCallback(() => {
    if (!settings.sound) return
    try {
      const ctx = new AudioContext()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g)
      g.connect(ctx.destination)
      o.frequency.value = 880
      g.gain.setValueAtTime(0.08, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      o.start(ctx.currentTime)
      o.stop(ctx.currentTime + 0.3)
    } catch {
      /* ignore */
    }
  }, [settings.sound])

  const notifyDone = useCallback(
    (label: string) => {
      playChime()
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Pomodoro', { body: label })
      } else if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
        void Notification.requestPermission()
      }
      toast.success(label)
    },
    [playChime],
  )

  const loadStats = useCallback(async () => {
    try {
      const { data } = await pomodoroApi.stats()
      setStats(data)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const onCompletePhase = useCallback(
    async (completedMode: Mode, actualSeconds: number) => {
      const startMs = startedRef.current
      startedRef.current = null
      const mins = Math.max(1, Math.round(actualSeconds / 60))
      try {
        const { data } = await pomodoroApi.log({
          duration: mins,
          type: completedMode,
          completed: true,
          taskName: completedMode === 'work' ? taskName : '',
          startTime: startMs ? new Date(startMs).toISOString() : undefined,
          endTime: new Date().toISOString(),
        })
        await loadStats()
        await refetch()
        if (data.xp?.pomodoro_complete) showXPToast(data.xp.pomodoro_complete)
        if (data.xp?.pomodoro_streak_daily) showXPToast(data.xp.pomodoro_streak_daily)
      } catch {
        toast.error('Could not log session')
      }

      const snap = loadSettings()
      if (completedMode === 'work') {
        notifyDone('Work session complete — take a break!')
        if (snap.autoStartBreak) {
          setMode('shortBreak')
          setSecondsLeft(Math.round(snap.shortBreak * 60))
          setRunning(true)
          startedRef.current = Date.now()
          return
        }
        setMode('shortBreak')
        setSecondsLeft(Math.round(snap.shortBreak * 60))
      } else {
        notifyDone('Break over — ready to focus?')
        setMode('work')
        setSecondsLeft(Math.round(snap.work * 60))
      }
    },
    [loadStats, notifyDone, refetch, taskName],
  )

  useEffect(() => {
    onCompleteRef.current = (m, sec) => {
      void onCompletePhase(m, sec)
    }
  }, [onCompletePhase])

  useEffect(() => {
    if (!running) {
      clearTick()
      return
    }
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTick()
          setRunning(false)
          const elapsed = startedRef.current
            ? Math.max(1, Math.round((Date.now() - startedRef.current) / 1000))
            : Math.round(durationMin * 60)
          const m = mode
          queueMicrotask(() => onCompleteRef.current(m, elapsed))
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearTick()
  }, [running, mode, durationMin])

  const start = () => {
    if (secondsLeft <= 0) setSecondsLeft(Math.round(durationMin * 60))
    startedRef.current = Date.now()
    setRunning(true)
  }

  const pause = () => {
    setRunning(false)
    clearTick()
  }

  const reset = () => {
    setRunning(false)
    clearTick()
    setSecondsLeft(Math.round(durationMin * 60))
    startedRef.current = null
  }

  const pct = durationMin > 0 ? 1 - secondsLeft / (durationMin * 60) : 0
  const mm = Math.floor(secondsLeft / 60)
  const ss = secondsLeft % 60

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      saveSettings(next)
      return next
    })
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <BackButton href="/dashboard/student/study-groups" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Pomodoro</h1>
          </div>
          <div className="hidden sm:block shrink-0">
            <ProgressWidget onViewFull={() => router.push('/community')} />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/70 p-6 sm:p-10 shadow-sm flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-2">
            {(['work', 'shortBreak', 'longBreak'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                disabled={running}
                onClick={() => {
                  setMode(m)
                  const min = m === 'work' ? settings.work : m === 'shortBreak' ? settings.shortBreak : settings.longBreak
                  setSecondsLeft(Math.round(min * 60))
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${mode === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              >
                {m === 'work' ? 'Focus' : m === 'shortBreak' ? 'Short break' : 'Long break'}
              </button>
            ))}
          </div>

          <input
            placeholder="What are you focusing on? (optional)"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            disabled={running && mode === 'work'}
            className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          />

          <div className="relative w-56 h-56 sm:w-64 sm:h-64">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" className="stroke-gray-200 dark:stroke-gray-600" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                className="stroke-indigo-500"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - Math.min(1, Math.max(0, pct)))}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl sm:text-5xl font-mono font-bold text-gray-900 dark:text-white">
                {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
              </span>
              <span className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{mode.replace(/([A-Z])/g, ' $1')}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {!running ? (
              <button type="button" onClick={start} className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg">
                Start
              </button>
            ) : (
              <button type="button" onClick={pause} className="px-8 py-3 rounded-xl bg-amber-500 text-white font-bold shadow-lg">
                Pause
              </button>
            )}
            <button type="button" onClick={reset} className="px-8 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-500 font-semibold text-gray-700 dark:text-gray-200">
              Reset
            </button>
          </div>

          <div className="w-full max-w-md rounded-2xl bg-gray-50 dark:bg-gray-900/50 p-4 space-y-3 text-sm">
            <p className="font-semibold text-gray-800 dark:text-gray-200">Settings</p>
            <label className="flex justify-between gap-2">
              Focus (min)
              <input type="number" min={1} max={120} value={settings.work} onChange={(e) => updateSetting('work', parseInt(e.target.value, 10) || 25)} className="w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-gray-900 dark:text-gray-100" />
            </label>
            <label className="flex justify-between gap-2">
              Short break
              <input type="number" min={1} max={60} value={settings.shortBreak} onChange={(e) => updateSetting('shortBreak', parseInt(e.target.value, 10) || 5)} className="w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-gray-900 dark:text-gray-100" />
            </label>
            <label className="flex justify-between gap-2">
              Long break
              <input type="number" min={1} max={60} value={settings.longBreak} onChange={(e) => updateSetting('longBreak', parseInt(e.target.value, 10) || 15)} className="w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-gray-900 dark:text-gray-100" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.autoStartBreak} onChange={(e) => updateSetting('autoStartBreak', e.target.checked)} />
              Auto-start break after focus
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.sound} onChange={(e) => updateSetting('sound', e.target.checked)} />
              Sound on complete
            </label>
          </div>
        </div>

        {stats ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800/60 space-y-4">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Today &amp; week</h2>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 p-4">
                <p className="text-gray-600 dark:text-gray-300">Pomodoros today</p>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{stats.stats.pomodorosToday}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4">
                <p className="text-gray-600 dark:text-gray-300">Focus time today</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.stats.focusHoursToday}h</p>
                <p className="text-xs text-gray-500">{stats.stats.focusMinutesToday} min</p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-4">
                <p className="text-gray-600 dark:text-gray-300">Active days (this week)</p>
                <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{stats.stats.weekStreakDays}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Recent sessions</h3>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300 max-h-40 overflow-y-auto">
                {(stats.recent || []).map((r) => (
                  <li key={r._id} className="flex justify-between border-b border-gray-100 dark:border-gray-700 py-1">
                    <span>{r.type} {r.completed ? '✓' : '·'} {r.taskName || ''}</span>
                    <span>{new Date(r.createdAt || '').toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  )
}
