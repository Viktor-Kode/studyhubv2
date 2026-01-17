'use client'

import { useState, useEffect, useRef } from 'react'
import { FaPlay, FaPause, FaStop, FaClock, FaPlus, FaMinus, FaFire } from 'react-icons/fa'

interface StudyTimerProps {
  className?: string
}

export default function StudyTimer({ className = '' }: StudyTimerProps) {
  const [initialMinutes, setInitialMinutes] = useState(25)
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [isBreak, setIsBreak] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [streak, setStreak] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timeRef = useRef({ minutes: 25, seconds: 0 })
  const hasPlayedSoundRef = useRef(false)

  // Create audio element for alarm
  useEffect(() => {
    // Create a continuous alarm sound using Web Audio API
    const createAlarmSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 800 // Higher pitch
        oscillator.type = 'sine'

        // Set volume and play for 6 seconds
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 5.5) // Keep volume steady
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 6) // Fade out at the end

        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 6) // Play for 6 seconds
      } catch (error) {
        console.error('Error playing alarm sound:', error)
      }
    }

    audioRef.current = { play: createAlarmSound } as any
  }, [])

  // Load streak and sessions from localStorage on mount
  useEffect(() => {
    const savedStreak = localStorage.getItem('studyStreak')
    const lastStudyDate = localStorage.getItem('lastStudyDate')
    const savedSessions = localStorage.getItem('completedSessions')
    const today = new Date().toDateString()
    
    // Initialize completed sessions if not set
    if (savedSessions) {
      setSessions(parseInt(savedSessions))
    }

    if (savedStreak && lastStudyDate) {
      const lastDate = new Date(lastStudyDate).toDateString()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toDateString()

      if (lastDate === today) {
        // Already studied today, keep streak
        setStreak(parseInt(savedStreak))
      } else if (lastDate === yesterdayStr) {
        // Studied yesterday, continue streak
        setStreak(parseInt(savedStreak))
      } else {
        // Missed a day, reset streak
        setStreak(0)
        localStorage.setItem('studyStreak', '0')
      }
    }
  }, [])

  // Sync ref with state
  useEffect(() => {
    timeRef.current = { minutes, seconds }
  }, [minutes, seconds])

  useEffect(() => {
    if (isRunning && !isCompleted) {
      hasPlayedSoundRef.current = false
      intervalRef.current = setInterval(() => {
        const current = timeRef.current

        // Check if timer has reached 00:00
        if (current.minutes === 0 && current.seconds === 0) {
          // Timer completed - stop at 00:00
          setIsRunning(false)
          setIsCompleted(true)
          handleTimerComplete()
          // Play alarm sound only once
          if (audioRef.current && !hasPlayedSoundRef.current) {
            audioRef.current.play()
            hasPlayedSoundRef.current = true
          }
          return
        }

        // Decrement time
        if (current.seconds === 0) {
          // Move to next minute
          if (current.minutes > 0) {
            setMinutes((prev) => {
              const newMinutes = Math.max(0, prev - 1)
              timeRef.current.minutes = newMinutes
              return newMinutes
            })
            setSeconds(59)
            timeRef.current.seconds = 59
          }
        } else {
          setSeconds((prev) => {
            const newSeconds = Math.max(0, prev - 1)
            timeRef.current.seconds = newSeconds
            return newSeconds
          })
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isCompleted])

  const handleTimerComplete = () => {
    if (isBreak) {
      // Break completed, reset to new session
      setIsBreak(false)
      setIsCompleted(false)
      setMinutes(initialMinutes)
      setSeconds(0)
    } else {
      // Study session completed
      setSessions((s) => {
        const newSessions = s + 1
        // Store completed sessions in localStorage
        localStorage.setItem('completedSessions', newSessions.toString())
        return newSessions
      })
      updateStreak()
    }
  }

  const updateStreak = () => {
    const today = new Date().toDateString()
    const lastStudyDate = localStorage.getItem('lastStudyDate')
    const savedStreak = parseInt(localStorage.getItem('studyStreak') || '0')

    if (!lastStudyDate) {
      // First time studying
      setStreak(1)
      localStorage.setItem('studyStreak', '1')
      localStorage.setItem('lastStudyDate', today)
    } else {
      const lastDate = new Date(lastStudyDate).toDateString()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toDateString()

      if (lastDate === today) {
        // Already studied today, don't increment
        return
      } else if (lastDate === yesterdayStr) {
        // Studied yesterday, continue streak
        const newStreak = savedStreak + 1
        setStreak(newStreak)
        localStorage.setItem('studyStreak', newStreak.toString())
        localStorage.setItem('lastStudyDate', today)
      } else {
        // Missed a day, reset streak to 1
        setStreak(1)
        localStorage.setItem('studyStreak', '1')
        localStorage.setItem('lastStudyDate', today)
      }
    }
  }

  const startBreak = () => {
    setIsCompleted(false)
    setIsBreak(true)
    setMinutes(5) // 5 minute break
    setSeconds(0)
    timeRef.current = { minutes: 5, seconds: 0 }
  }

  const startNewSession = () => {
    setIsCompleted(false)
    setIsBreak(false)
    setMinutes(initialMinutes)
    setSeconds(0)
    timeRef.current = { minutes: initialMinutes, seconds: 0 }
  }

  const startTimer = () => {
    if (isCompleted && !isBreak) {
      // Timer completed, offer to start break
      return
    }
    setIsRunning(true)
    setIsCompleted(false)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setIsBreak(false)
    setIsCompleted(false)
    setMinutes(initialMinutes)
    setSeconds(0)
    timeRef.current = { minutes: initialMinutes, seconds: 0 }
  }

  const adjustTime = (delta: number) => {
    if (isRunning || isBreak) return // Don't allow adjustment while running or during break
    
    const newMinutes = Math.max(5, Math.min(120, initialMinutes + delta)) // Min 5 min, Max 120 min
    setInitialMinutes(newMinutes)
    setMinutes(newMinutes)
    setSeconds(0)
    timeRef.current = { minutes: newMinutes, seconds: 0 }
  }

  const formatTime = (m: number, s: number) => {
    // Ensure time never goes negative
    const safeMinutes = Math.max(0, m)
    const safeSeconds = Math.max(0, s)
    return `${safeMinutes.toString().padStart(2, '0')}:${safeSeconds.toString().padStart(2, '0')}`
  }

  const progress = isBreak
    ? ((5 * 60 - (minutes * 60 + seconds)) / (5 * 60)) * 100
    : isCompleted
    ? 100
    : ((initialMinutes * 60 - (minutes * 60 + seconds)) / (initialMinutes * 60)) * 100

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <FaClock className="text-emerald-500 text-xl" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Study Timer</h3>
      </div>

      <div className="text-center mb-6">
        <div className="relative w-48 h-48 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
              className="text-emerald-500 transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                {formatTime(minutes, seconds)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isCompleted && isBreak
                  ? 'Break Complete!'
                  : isCompleted
                  ? 'Session Complete!'
                  : isBreak
                  ? 'Break Time'
                  : 'Focus Time'}
              </div>
            </div>
          </div>
        </div>

        {!isRunning && !isBreak && (
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => adjustTime(-5)}
              disabled={initialMinutes <= 5}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Decrease by 5 minutes"
            >
              <FaMinus />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {initialMinutes} min session
            </span>
            <button
              onClick={() => adjustTime(5)}
              disabled={initialMinutes >= 120}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Increase by 5 minutes"
            >
              <FaPlus />
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          {isCompleted && !isBreak ? (
            <>
              <button
                onClick={startBreak}
                className="flex items-center gap-2 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                Start Break
              </button>
              <button
                onClick={startNewSession}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
              >
                New Session
              </button>
            </>
          ) : isCompleted && isBreak ? (
            <button
              onClick={startNewSession}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
            >
              Start New Session
            </button>
          ) : !isRunning ? (
            <button
              onClick={startTimer}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
            >
              <FaPlay />
              Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-2 px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
            >
              <FaPause />
              Pause
            </button>
          )}
          <button
            onClick={resetTimer}
            className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            <FaStop />
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Sessions Completed</span>
          <span className="font-bold text-emerald-500">{sessions}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <FaFire className="text-orange-500" />
            <span>Study Streak</span>
          </div>
          <span className="font-bold text-orange-500">{streak} {streak === 1 ? 'day' : 'days'}</span>
        </div>
      </div>
    </div>
  )
}
