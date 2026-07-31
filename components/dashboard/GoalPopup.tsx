'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiFileText, FiCpu, FiCheckSquare, FiBook } from 'react-icons/fi'

const STORAGE_KEY = 'studyhelp_goal'
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

interface GoalOption {
  id: string
  icon: React.ElementType
  title: string
  description: string
  href: string
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'summarise',
    icon: FiFileText,
    title: 'Summarise lecture notes',
    description: 'Upload your handout or PDF',
    href: '/dashboard/pdf-summary',
  },
  {
    id: 'tutor',
    icon: FiCpu,
    title: 'Study with AI tutor',
    description: 'Understand a concept',
    href: '/dashboard/tutor',
  },
  {
    id: 'quiz',
    icon: FiCheckSquare,
    title: 'Generate practice quiz',
    description: 'From my course topic',
    href: '/dashboard/question-bank',
  },
  {
    id: 'pastquestions',
    icon: FiBook,
    title: 'Browse past questions',
    description: 'WAEC, JAMB, NECO',
    href: '/dashboard/cbt',
  },
]

interface StoredGoal {
  id: string
  timestamp: number
  skipped?: boolean
}

interface GoalPopupProps {
  onClose: (goalId?: string) => void
}

export default function GoalPopup({ onClose }: GoalPopupProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const handleLetsGo = () => {
    if (!selected) return
    const goal = GOAL_OPTIONS.find(o => o.id === selected)
    const data: StoredGoal = { id: selected, timestamp: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    onClose(selected)
    if (goal) router.push(goal.href)
  }

  const handleSkip = () => {
    const data: StoredGoal = { id: '', timestamp: Date.now(), skipped: true }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(7,15,30,0.88)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '1.5rem',
          maxWidth: 340,
          width: '100%',
        }}
      >
        <h2
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}
        >
          What do you want to do today?
        </h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginBottom: '1.25rem',
            lineHeight: 1.5,
          }}
        >
          Pick one thing to focus on. You can always switch later.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.25rem' }}>
          {GOAL_OPTIONS.map(option => {
            const isSelected = selected === option.id
            const Icon = option.icon
            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: `1px solid ${isSelected ? 'var(--purple-border)' : 'var(--border)'}`,
                  background: isSelected ? 'var(--purple-bg)' : 'var(--surface-2)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: isSelected ? 'var(--purple-border)' : 'var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} style={{ color: isSelected ? '#ffffff' : 'var(--text-secondary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: isSelected ? 'var(--purple)' : 'var(--text-primary)',
                      marginBottom: 2,
                    }}
                  >
                    {option.title}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: isSelected ? 'var(--purple)' : 'var(--text-muted)',
                      opacity: isSelected ? 0.85 : 1,
                    }}
                  >
                    {option.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={handleLetsGo}
          disabled={!selected}
          style={{
            width: '100%',
            padding: '13px 0',
            borderRadius: 10,
            background: selected ? 'var(--purple-deep)' : 'var(--surface)',
            border: 'none',
            color: selected ? '#fff' : 'var(--text-muted)',
            fontSize: 15,
            fontWeight: 700,
            cursor: selected ? 'pointer' : 'not-allowed',
            transition: 'all 0.18s ease',
            marginBottom: 12,
          }}
        >
          Let&apos;s go →
        </button>

        <button
          onClick={handleSkip}
          style={{
            display: 'block',
            width: '100%',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
            textAlign: 'center',
            padding: '4px 0',
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

/** Returns true if the goal popup should be shown */
export function shouldShowGoalPopup(): boolean {
  if (typeof window === 'undefined') return false
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return true
  try {
    const stored: StoredGoal = JSON.parse(raw)
    const elapsed = Date.now() - (stored.timestamp ?? 0)
    return elapsed > THREE_DAYS_MS
  } catch {
    return true
  }
}

/** Returns the stored goal id (null if skipped or not set) */
export function getStoredGoal(): string | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const stored: StoredGoal = JSON.parse(raw)
    return stored.skipped ? null : stored.id || null
  } catch {
    return null
  }
}
