'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/lib/store/authStore'
import { apiClient } from '@/lib/api/client'
import BottomNav from '@/components/dashboard/MobileBottomNav'
import { FiTarget, FiClock, FiChevronRight, FiBook, FiCpu, FiFileText, FiCheckSquare, FiPlay } from 'react-icons/fi'
import { BiBrain } from 'react-icons/bi'
import '@/app/dashboard/student/dashboard-v3.css'

// ── Types ──────────────────────────────────────────────────
interface ActivityItem {
  id: string | number
  title: string
  subtitle: string
  date?: string
  type?: string
  score?: number | null
}

// ── Helpers ────────────────────────────────────────────────
function getInitials(name?: string | null): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function scoreColor(score?: number | null, type?: string): string {
  if (type === 'summarise' || score == null) return 'var(--text-muted)'
  if (score >= 50) return 'var(--green)'
  return 'var(--red)'
}

// ── Study tools config ────────────────────────────────────
const STUDY_TOOLS = [
  {
    id: 'pastquestions',
    icon: FiBook,
    iconBg: 'var(--blue-bg)',
    title: 'Past Questions',
    description: 'WAEC, JAMB, NECO — pick your subject and year',
    href: '/dashboard/cbt',
  },
  {
    id: 'tutor',
    icon: FiCpu,
    iconBg: 'var(--green-bg)',
    title: 'AI Tutor',
    description: 'Ask a question, explain a topic, upload your notes',
    href: '/dashboard/tutor',
  },
  {
    id: 'summarise',
    icon: FiFileText,
    iconBg: 'var(--purple-bg)',
    title: 'Summarise Notes',
    description: 'Upload a PDF, doc, or image — get a clean summary',
    href: '/dashboard/pdf-summary',
  },
  {
    id: 'quiz',
    icon: FiCheckSquare,
    iconBg: 'var(--amber-bg-dark)',
    title: 'Quick Quiz',
    description: 'Just 3 questions. 60 seconds. Build the habit.',
    href: '/dashboard/cbt?quick=true',
  },
]

// ── Component ──────────────────────────────────────────────
export default function StudyPage() {
  const { user } = useAuthStore()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [lastSession, setLastSession] = useState<ActivityItem | null>(null)
  const [loading, setLoading] = useState(true)

  const initials = getInitials(user?.name)

  const loadData = useCallback(async () => {
    if (!user?.uid) return
    try {
      const [summaryRes] = await Promise.all([
        apiClient.get('/dashboard/summary').catch(() => null),
      ])
      if (summaryRes?.data?.data) {
        const d = summaryRes.data.data
        const timeline: ActivityItem[] = (d.recentActivity ?? []).map(
          (item: { id?: string | number; title?: string; subtitle?: string; date?: string; type?: string; score?: number | null }, i: number) => ({
            id: item.id ?? i,
            title: item.title ?? 'Activity',
            subtitle: item.subtitle ?? '',
            date: item.date,
            type: item.type,
            score: item.score ?? null,
          })
        )
        setActivities(timeline.slice(0, 3))
        setLastSession(timeline[0] ?? null)
      }
    } catch (e) {
      console.error('Study page load error:', e)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => { loadData() }, [loadData])

  return (
    <ProtectedRoute allowedRoles={['student', 'teacher']}>
      <div className="sd-page">

        {/* ── Top bar ── */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 16px 12px',
          }}
        >
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Study
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Pick what to do today
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            aria-label="Profile"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--purple-bg)',
              border: '2px solid var(--purple-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--purple)',
              textDecoration: 'none',
              flexShrink: 0,
              overflow: 'hidden',
              padding: 0,
            }}
          >
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Student'}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt="Profile"
            />
          </Link>
        </header>

        {/* ── Hero card — last session ── */}
        {lastSession && (
          <div style={{ padding: '0 16px', marginBottom: 20 }}>
            <div
              style={{
                background: '#1A1040',
                border: '1px solid #3B2F8A',
                borderRadius: 16,
                padding: '16px',
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--purple)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 6,
                }}
              >
                Continue where you left off
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {lastSession.title}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                {lastSession.subtitle}
              </p>
              <Link
                href="/dashboard/cbt"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 18px',
                  borderRadius: 99,
                  background: 'var(--purple-deep)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <FiPlay size={12} style={{ fill: '#fff' }} /> Resume session
              </Link>
            </div>
          </div>
        )}

        {/* ── Study tools — full-width list ── */}
        <div style={{ padding: '0 16px', marginBottom: 20 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            Study Tools
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {STUDY_TOOLS.map(tool => (
              <Link
                key={tool.id}
                href={tool.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'border-color 0.18s ease',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: tool.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <tool.icon size={20} style={{ color: '#ffffff' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                    {tool.title}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {tool.description}
                  </p>
                </div>
                <FiChevronRight style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 16px 20px' }} />

        {/* ── Recent activity ── */}
        <div style={{ padding: '0 16px', marginBottom: 20 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            Recent Activity
          </p>
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>
          ) : activities.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No recent sessions yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activities.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'var(--surface-2)',
                    borderRadius: 12,
                    padding: '12px 14px',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.type === 'cbt_result' ? (
                      <FiTarget style={{ color: 'var(--purple)' }} />
                    ) : item.type === 'flashcard_created' ? (
                      <BiBrain style={{ color: 'var(--green)' }} />
                    ) : (
                      <FiClock style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {formatDate(item.date)}
                    </p>
                  </div>
                  {item.score != null && (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: scoreColor(item.score, item.type),
                        flexShrink: 0,
                      }}
                    >
                      {item.score}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
