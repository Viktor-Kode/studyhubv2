'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/lib/store/authStore'
import { progressApi } from '@/lib/api/progressApi'
import { apiClient } from '@/lib/api/client'
import './study-path.css'

import {
  FiCheck,
  FiLock,
  FiPlay,
  FiZap,
  FiBookOpen,
  FiFileText,
  FiUser,
  FiCpu,
  FiCheckSquare,
  FiAward,
  FiPlus,
  FiX,
  FiClock,
  FiLayers,
  FiArrowRight,
  FiUploadCloud
} from 'react-icons/fi'
import { FaFire } from 'react-icons/fa'
import { IoSparklesSharp } from 'react-icons/io5'
import {
  type LearningNode,
  type StudyPathTopic,
  DEFAULT_TOPIC
} from '@/lib/data/studyPath'

export type { LearningNode, StudyPathTopic }
export { DEFAULT_TOPIC }


export default function StudentDashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  // State
  const [topic, setTopic] = useState<StudyPathTopic | null>(DEFAULT_TOPIC)
  const [selectedNode, setSelectedNode] = useState<LearningNode | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [rawText, setRawText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Real progress state
  const [realStats, setRealStats] = useState({
    streak: 12,
    xp: 2480,
    dailyGoalXp: 30,
    dailyGoalTarget: 50
  })

  // Dynamic path connector line coordinates
  const containerRef = useRef<HTMLDivElement>(null)
  const circleRefs = useRef<(HTMLDivElement | null)[]>([])
  const [lineSegments, setLineSegments] = useState<{
    id: string
    x1: number
    y1: number
    x2: number
    y2: number
    isSolid: boolean
  }[]>([])

  // Recalculate line coordinates whenever topic changes or container resizes
  useEffect(() => {
    const updateLines = () => {
      if (!containerRef.current || !topic || !topic.nodes) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const lines: typeof lineSegments = []

      for (let i = 0; i < topic.nodes.length - 1; i++) {
        const el1 = circleRefs.current[i]
        const el2 = circleRefs.current[i + 1]
        if (!el1 || !el2) continue

        const r1 = el1.getBoundingClientRect()
        const r2 = el2.getBoundingClientRect()

        const isSolid = topic.nodes[i].status === 'completed'

        lines.push({
          id: `line-${topic.nodes[i].id}-${topic.nodes[i + 1].id}`,
          x1: r1.left - containerRect.left + r1.width / 2,
          y1: r1.top - containerRect.top + r1.height / 2,
          x2: r2.left - containerRect.left + r2.width / 2,
          y2: r2.top - containerRect.top + r2.height / 2,
          isSolid
        })
      }
      setLineSegments(lines)
    }

    // Call immediately and after DOM renders
    updateLines()
    const timer1 = setTimeout(updateLines, 40)
    const timer2 = setTimeout(updateLines, 200)

    window.addEventListener('resize', updateLines)

    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(updateLines)
      ro.observe(containerRef.current)
    }

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      window.removeEventListener('resize', updateLines)
      if (ro) ro.disconnect()
    }
  }, [topic])

  // Load saved topic or default
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studyhelp_active_topic')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setTopic(parsed)
        } catch {
          setTopic(DEFAULT_TOPIC)
        }
      }
    }
  }, [])

  // Fetch real progress from backend if logged in
  useEffect(() => {
    if (!user?.uid) return
    progressApi
      .getMe()
      .then((res) => {
        const d = res?.data
        if (d) {
          setRealStats((prev) => ({
            ...prev,
            streak: typeof d.streak === 'number' && d.streak > 0 ? d.streak : prev.streak,
            xp: typeof d.xp === 'number' && d.xp > 0 ? d.xp : prev.xp
          }))
        }
      })
      .catch(() => {})
  }, [user?.uid])

  // Save topic changes
  const saveTopic = (newTopic: StudyPathTopic | null) => {
    setTopic(newTopic)
    if (typeof window !== 'undefined') {
      if (newTopic) {
        localStorage.setItem('studyhelp_active_topic', JSON.stringify(newTopic))
      } else {
        localStorage.removeItem('studyhelp_active_topic')
      }
    }
  }

  // Handle mock generation from raw text
  const handleGenerateStudyPath = () => {
    setIsGenerating(true)
    setTimeout(() => {
      // Create new study path
      const title = rawText.trim() ? rawText.split('\n')[0].slice(0, 32) : 'Data Structures & Algorithms'
      const generated: StudyPathTopic = {
        topicId: 'custom-topic-' + Date.now(),
        title: title || 'Computer Science Concepts',
        courseCode: 'CS 101 · Interactive Study Path',
        currentProgress: 0,
        nodes: [
          {
            id: 1,
            title: 'Foundational Concepts',
            status: 'active',
            xp: 20,
            duration: '5 min',
            summary: 'Core foundational principles extracted from your uploaded material.',
            keyConcepts: ['Core Definition', 'Key Principles', 'Terminology']
          },
          {
            id: 2,
            title: 'Core Mechanics',
            status: 'locked',
            xp: 25,
            duration: '7 min',
            summary: 'In-depth analysis of architectural mechanisms and standard patterns.',
            keyConcepts: ['Mechanisms', 'Internal State', 'Standard Operations']
          },
          {
            id: 3,
            title: 'Applied Problem Solving',
            status: 'locked',
            xp: 30,
            duration: '8 min',
            summary: 'Hands-on practical execution and algorithmic problem solving.',
            keyConcepts: ['Edge Cases', 'Efficiency', 'Patterns']
          },
          {
            id: 4,
            title: 'Unit Assessment',
            status: 'locked',
            xp: 50,
            duration: '10 min',
            summary: 'Comprehensive active recall quiz testing mastery of the full subject matter.',
            keyConcepts: ['Active Recall', 'Synthesized Knowledge', 'Retention Quiz']
          }
        ]
      }
      saveTopic(generated)
      setIsGenerating(false)
      setShowGenerateModal(false)
      setRawText('')
    }, 1000)
  }

  // Greeting
  const firstName = user?.name?.split(' ')[0] || 'Vkay'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Calculations for desktop zig-zag horizontal percentage offsets
  // Creates the smooth S-curve shown in the desktop mockup
  const getNodePosition = (index: number) => {
    // 8 steps oscillating: left -> center-left -> center -> center-right -> center -> center-left -> left -> center-left
    const desktopOffsets = [18, 32, 46, 58, 46, 34, 20, 34]
    return desktopOffsets[index % desktopOffsets.length]
  }

  // Completed count
  const completedCount = useMemo(() => {
    if (!topic) return 0
    return topic.nodes.filter((n) => n.status === 'completed').length
  }, [topic])

  const totalCount = topic?.nodes.length || 8

  // Active node (for Resume Learning)
  const activeNode = useMemo(() => {
    return topic?.nodes.find((n) => n.status === 'active') || topic?.nodes[0]
  }, [topic])

  return (
    <ProtectedRoute allowedRoles={['student', 'teacher']}>
      <div className="sp-dashboard-root">
        {/* ── LEFT SIDEBAR (Desktop) ── */}
        <aside className="sp-sidebar">
          <Link href="/dashboard/student" className="sp-logo-wrap">
            <div className="sp-logo-icon">
              <IoSparklesSharp size={20} />
            </div>
            <span className="sp-logo-text">StudyHelp</span>
          </Link>

          <nav>
            <ul className="sp-nav-list">
              <li>
                <Link href="/dashboard/student" className="sp-nav-item active">
                  <FiBookOpen className="sp-nav-icon" />
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/flip-cards" className="sp-nav-item">
                  <FiLayers className="sp-nav-icon" />
                  <span>Flashcard Vault</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/notes-history" className="sp-nav-item">
                  <FiFileText className="sp-nav-icon" />
                  <span>Notes Library</span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/profile" className="sp-nav-item">
                  <FiUser className="sp-nav-icon" />
                  <span>Profile</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="sp-main-container">
          {/* Top Bar */}
          <header className="sp-topbar">
            <div>
              <div className="sp-greeting-sub">{greeting},</div>
              <h1 className="sp-greeting-name">{firstName}</h1>
            </div>

            <div className="sp-topbar-pills">
              {/* Streak Pill */}
              <div className="sp-stat-pill">
                <FaFire className="sp-stat-pill-icon" style={{ color: '#f59e0b' }} />
                <span>{realStats.streak}</span>
              </div>

              {/* XP Pill */}
              <div className="sp-stat-pill">
                <FiZap className="sp-stat-pill-icon" style={{ color: '#fbbf24' }} />
                <span>{realStats.xp.toLocaleString()}</span>
              </div>
            </div>
          </header>

          {/* ── ACTIVE TOPIC CARD OR EMPTY STATE ── */}
          {topic ? (
            <section className="sp-topic-card">
              <div className="sp-topic-card-left">
                <div className="sp-topic-label">ACTIVE TOPIC</div>
                <h2 className="sp-topic-title">{topic.title}</h2>
                <p className="sp-topic-course">{topic.courseCode}</p>

                <div className="sp-topic-progress-wrap">
                  <div className="sp-topic-play-badge">
                    <FiPlay size={12} style={{ marginLeft: 2 }} />
                  </div>
                  <div className="sp-topic-progress-bar-wrap">
                    <div className="sp-topic-progress-text">
                      Node {completedCount + 1} of {totalCount} · {completedCount} complete
                    </div>
                    <div className="sp-topic-progress-track">
                      <div
                        className="sp-topic-progress-fill"
                        style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sp-topic-card-right">
                <button
                  className="sp-btn-resume"
                  onClick={() => {
                    const targetTopicId = topic.topicId || 'csc202-queues-deques'
                    router.push(`/dashboard/student/map/${targetTopicId}`)
                  }}
                >
                  <span>RESUME LEARNING</span>
                  <FiPlay size={14} />
                </button>
                <button className="sp-btn-new-topic" onClick={() => setShowGenerateModal(true)}>
                  <FiPlus size={16} />
                  <span>New Topic</span>
                </button>
              </div>
            </section>
          ) : (
            <section className="sp-empty-card">
              <div className="sp-topic-label">GET STARTED</div>
              <h2 className="sp-topic-title">No Active Topic</h2>
              <p className="sp-empty-desc">
                Upload a lecture PDF, textbook chapter, or syllabus to generate your first interactive learning path.
              </p>
              <div className="sp-empty-actions">
                <button className="sp-btn-generate" onClick={() => setShowGenerateModal(true)}>
                  <FiPlus size={18} />
                  <span>GENERATE STUDY PATH</span>
                </button>
                <button className="sp-btn-paste" onClick={() => setShowGenerateModal(true)}>
                  Paste text instead
                </button>
              </div>
            </section>
          )}

          {/* ── QUICK TOOLS (Prominently Right Under Active Section) ── */}
          <div className="sp-mobile-tools-wrap" style={{ marginTop: 8 }}>
            <h3 className="sp-section-heading">QUICK TOOLS</h3>
            <div className="sp-quick-tools-grid">
              <Link href="/dashboard/pdf-summary" className="sp-quick-tool-card">
                <div className="sp-tool-icon-box sp-tool-icon-green">
                  <FiFileText />
                </div>
                <div>
                  <h4 className="sp-tool-title">Summarise Notes</h4>
                  <p className="sp-tool-sub">Upload a PDF</p>
                </div>
              </Link>

              <Link href="/dashboard/tutor" className="sp-quick-tool-card">
                <div className="sp-tool-icon-box sp-tool-icon-purple">
                  <FiCpu />
                </div>
                <div>
                  <h4 className="sp-tool-title">AI Tutor</h4>
                  <p className="sp-tool-sub">Ask anything</p>
                </div>
              </Link>

              <Link href="/dashboard/cbt" className="sp-quick-tool-card">
                <div className="sp-tool-icon-box sp-tool-icon-gold">
                  <FiCheckSquare />
                </div>
                <div>
                  <h4 className="sp-tool-title">Question Generator</h4>
                  <p className="sp-tool-sub">Active recall quiz</p>
                </div>
              </Link>

              <Link href="/dashboard/leaderboard" className="sp-quick-tool-card">
                <div className="sp-tool-icon-box sp-tool-icon-trophy">
                  <FiAward />
                </div>
                <div>
                  <h4 className="sp-tool-title">Leaderboard</h4>
                  <p className="sp-tool-sub">Top 5% · Global League</p>
                </div>
              </Link>
            </div>
          </div>

          {/* ── YOUR PATH SECTION ── */}
          <section className="sp-path-container">
            <div className="sp-section-heading">
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                onClick={() => {
                  if (topic) router.push(`/dashboard/student/map/${topic.topicId}`)
                }}
              >
                <span>YOUR PATH</span>
                <FiArrowRight size={14} style={{ color: '#22c55e' }} />
              </div>
              {topic && (
                <span
                  className="sp-fraction"
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/dashboard/student/map/${topic.topicId}`)}
                >
                  {completedCount} of {totalCount} · View Map
                </span>
              )}
            </div>

            <div className="sp-path-scroll-area">
              {topic ? (
                <div className="sp-path-interactive" ref={containerRef}>
                  {/* SVG Curve Path Connectors (Both Solid & Broken Lines Connecting the Dots) */}
                  <svg className="sp-path-svg-canvas" xmlns="http://www.w3.org/2000/svg">
                    {lineSegments.map((seg) => {
                      if (seg.isSolid) {
                        // Solid green line connecting completed nodes
                        return (
                          <line
                            key={seg.id}
                            x1={seg.x1}
                            y1={seg.y1}
                            x2={seg.x2}
                            y2={seg.y2}
                            stroke="#22c55e"
                            strokeWidth="5"
                            strokeLinecap="round"
                          />
                        )
                      } else {
                        // Broken / dashed line connecting the dots for upcoming & locked nodes
                        return (
                          <line
                            key={seg.id}
                            x1={seg.x1}
                            y1={seg.y1}
                            x2={seg.x2}
                            y2={seg.y2}
                            stroke="#4e6288"
                            strokeWidth="4"
                            strokeDasharray="6 8"
                            strokeLinecap="round"
                          />
                        )
                      }
                    })}
                  </svg>

                  {/* Nodes List */}
                  <div className="sp-path-nodes-list">
                    {topic.nodes.map((node, i) => {
                      const isCompleted = node.status === 'completed'
                      const isActive = node.status === 'active'
                      const isLocked = node.status === 'locked'

                      return (
                        <div
                          key={node.id}
                          className={`sp-path-row sp-path-row-${i % 8}`}
                        >
                          <div
                            className="sp-node-anchor"
                            onClick={() => {
                              const targetTopicId = topic.topicId || 'csc202-queues-deques'
                              router.push(`/dashboard/student/map/${targetTopicId}?node=${node.id}`)
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            {/* Node Circle */}
                            <div
                              ref={(el) => {
                                circleRefs.current[i] = el
                              }}
                              className={`sp-node-circle ${
                                isCompleted ? 'completed' : isActive ? 'active' : 'locked'
                              }`}
                            >
                              {isActive && <span className="sp-up-next-badge">UP NEXT</span>}

                              {isCompleted ? (
                                <FiCheck strokeWidth={3} />
                              ) : isActive ? (
                                <FiPlay size={18} style={{ marginLeft: 2 }} />
                              ) : (
                                <FiLock size={16} />
                              )}
                            </div>

                            {/* Node Card */}
                            <div className={`sp-node-card ${isActive ? 'active' : ''}`}>
                              <h4 className="sp-node-card-title">{node.title}</h4>
                              <p className={`sp-node-card-sub ${isCompleted ? 'completed' : ''}`}>
                                {isCompleted && `Completed · +${node.xp} XP`}
                                {isActive && `${node.duration} · +${node.xp} XP`}
                                {isLocked && (node.id === topic.nodes.length ? `Locked · +${node.xp} XP` : 'Locked')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                /* Empty State Placeholder Dotted Box */
                <div className="sp-empty-path-box">
                  <svg
                    className="sp-empty-nodes-icon"
                    width="80"
                    height="48"
                    viewBox="0 0 80 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  >
                    <circle cx="16" cy="36" r="10" stroke="currentColor" />
                    <circle cx="40" cy="14" r="10" stroke="currentColor" />
                    <circle cx="64" cy="36" r="10" stroke="currentColor" />
                    <line x1="24" y1="28" x2="32" y2="20" stroke="currentColor" />
                    <line x1="48" y1="20" x2="56" y2="28" stroke="currentColor" />
                  </svg>
                  <p className="sp-empty-path-text">
                    Your interactive node path will appear here once you upload a document.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* ── RIGHT SIDEBAR (Desktop Widgets) ── */}
        <aside className="sp-right-sidebar">
          {/* Daily Goal Widget */}
          <div className="sp-widget-card">
            <div className="sp-daily-goal-content">
              {/* Radial Progress Ring (60%) */}
              <div className="sp-radial-chart">
                <svg width="68" height="68" viewBox="0 0 68 68">
                  <circle
                    cx="34"
                    cy="34"
                    r="28"
                    stroke="#1e2942"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="34"
                    cy="34"
                    r="28"
                    stroke="#22c55e"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - 0.6)}
                    strokeLinecap="round"
                    transform="rotate(-90 34 34)"
                  />
                </svg>
                <div className="sp-radial-text">60%</div>
              </div>

              <div className="sp-daily-goal-info">
                <h4>DAILY GOAL</h4>
                <div className="sp-daily-goal-value">
                  {realStats.dailyGoalXp} / {realStats.dailyGoalTarget} XP
                </div>
                <div className="sp-daily-goal-sub">One more lesson to go</div>
              </div>
            </div>
          </div>

          {/* Streak Widget */}
          <div className="sp-widget-card">
            <div className="sp-widget-header">
              <span className="sp-widget-title">STREAK</span>
              <span className="sp-widget-highlight">{realStats.streak} day streak</span>
            </div>

            <div className="sp-streak-days-row">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                const isDone = i < 6 // Mon through Sat done in mockup
                return (
                  <div key={i} className="sp-streak-day-item">
                    <div className={`sp-streak-circle ${isDone ? 'done' : 'pending'}`}>
                      {isDone && <FiCheck strokeWidth={3} />}
                    </div>
                    <span className="sp-streak-day-label">{day}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Global League Leaderboard Widget */}
          <div className="sp-widget-card">
            <div className="sp-widget-header">
              <span className="sp-widget-title">GLOBAL LEAGUE</span>
              <span className="sp-widget-highlight">Top 5%</span>
            </div>

            <div className="sp-league-list">
              <div className="sp-league-row">
                <div className="sp-league-left">
                  <span className="sp-league-rank-num">1</span>
                  <div className="sp-league-avatar-badge sp-league-avatar-gold">1</div>
                  <span className="sp-league-name">[Student name]</span>
                </div>
                <span className="sp-league-xp">[XP] XP</span>
              </div>

              <div className="sp-league-row">
                <div className="sp-league-left">
                  <span className="sp-league-rank-num">2</span>
                  <div className="sp-league-avatar-badge sp-league-avatar-silver">2</div>
                  <span className="sp-league-name">[Student name]</span>
                </div>
                <span className="sp-league-xp">[XP] XP</span>
              </div>

              <div className="sp-league-row">
                <div className="sp-league-left">
                  <span className="sp-league-rank-num">3</span>
                  <div className="sp-league-avatar-badge sp-league-avatar-bronze">3</div>
                  <span className="sp-league-name">[Student name]</span>
                </div>
                <span className="sp-league-xp">[XP] XP</span>
              </div>

              {/* Current User Row */}
              <div className="sp-league-row current-user">
                <div className="sp-league-left">
                  <span className="sp-league-rank-num">·</span>
                  <div className="sp-league-avatar-badge sp-league-avatar-green">
                    {firstName[0].toUpperCase()}
                  </div>
                  <span className="sp-league-name">You</span>
                </div>
                <span className="sp-league-xp">{realStats.xp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MOBILE BOTTOM NAVIGATION ── */}
        <nav className="sp-bottom-nav">
          <Link href="/dashboard/student" className="sp-bottom-nav-item active">
            <FiBookOpen className="sp-bottom-nav-icon" />
            <span>Home</span>
          </Link>
          <Link href="/dashboard/flip-cards" className="sp-bottom-nav-item">
            <FiLayers className="sp-bottom-nav-icon" />
            <span>Flashcards</span>
          </Link>
          <Link href="/dashboard/notes-history" className="sp-bottom-nav-item">
            <FiFileText className="sp-bottom-nav-icon" />
            <span>Notes</span>
          </Link>
          <Link href="/dashboard/profile" className="sp-bottom-nav-item">
            <FiUser className="sp-bottom-nav-icon" />
            <span>Profile</span>
          </Link>
        </nav>

        {/* ── NODE DETAIL MODAL ── */}
        {selectedNode && (
          <div className="sp-modal-overlay" onClick={() => setSelectedNode(null)}>
            <div className="sp-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="sp-modal-header">
                <div>
                  <span
                    className={`sp-modal-badge ${
                      selectedNode.status === 'completed'
                        ? 'completed'
                        : selectedNode.status === 'active'
                        ? 'active'
                        : 'locked'
                    }`}
                  >
                    {selectedNode.status === 'completed' && 'Completed'}
                    {selectedNode.status === 'active' && 'Up Next'}
                    {selectedNode.status === 'locked' && 'Locked'}
                  </span>
                  <h3 className="sp-modal-title">{selectedNode.title}</h3>
                </div>
                <button
                  className="sp-modal-close-btn"
                  onClick={() => setSelectedNode(null)}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>

              <div className="sp-modal-meta-row">
                <div className="sp-modal-meta-item">
                  <FiClock />
                  <span>{selectedNode.duration}</span>
                </div>
                <div className="sp-modal-meta-item">
                  <FiZap style={{ color: '#fbbf24' }} />
                  <span>+{selectedNode.xp} XP</span>
                </div>
              </div>

              <p className="sp-modal-summary">{selectedNode.summary}</p>

              {selectedNode.keyConcepts && selectedNode.keyConcepts.length > 0 && (
                <div>
                  <div className="sp-modal-concepts-title">Key Concepts</div>
                  <div className="sp-modal-concepts-tags">
                    {selectedNode.keyConcepts.map((concept, idx) => (
                      <span key={idx} className="sp-modal-tag">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.status !== 'locked' ? (
                <button
                  className="sp-modal-btn-primary"
                  onClick={() => {
                    setSelectedNode(null)
                    router.push('/dashboard/cbt')
                  }}
                >
                  <FiPlay />
                  <span>
                    {selectedNode.status === 'completed' ? 'Review Concept' : 'Start Learning'}
                  </span>
                </button>
              ) : (
                <button
                  className="sp-btn-paste"
                  style={{ width: '100%', opacity: 0.7 }}
                  disabled
                >
                  Complete previous nodes to unlock
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── GENERATE STUDY PATH / NEW TOPIC MODAL ── */}
        {showGenerateModal && (
          <div className="sp-modal-overlay" onClick={() => setShowGenerateModal(false)}>
            <div className="sp-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="sp-modal-header">
                <div>
                  <h3 className="sp-modal-title">Generate Study Path</h3>
                  <p className="sp-tool-sub" style={{ marginTop: 4 }}>
                    Convert raw lecture notes, syllabus, or topics into a gamified path.
                  </p>
                </div>
                <button
                  className="sp-modal-close-btn"
                  onClick={() => setShowGenerateModal(false)}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste lecture notes, syllabus, or topic outline here (e.g. CSC 202 Data Structures, Queues, Graphs, Trees...)"
                  rows={5}
                  style={{
                    width: '100%',
                    background: '#0d1322',
                    border: '1px solid #1f2b45',
                    borderRadius: 12,
                    padding: 12,
                    color: '#ffffff',
                    fontSize: 13,
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                  className="sp-btn-generate"
                  style={{ flex: 1 }}
                  onClick={handleGenerateStudyPath}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <span>Deconstructing with AI...</span>
                  ) : (
                    <>
                      <IoSparklesSharp />
                      <span>Create Path</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dev Quick Actions to toggle empty/mockup state */}
              <div
                style={{
                  borderTop: '1px solid #1f2b45',
                  paddingTop: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10
                }}
              >
                <button
                  className="sp-btn-paste"
                  style={{ fontSize: 11, padding: '8px 12px' }}
                  onClick={() => {
                    saveTopic(DEFAULT_TOPIC)
                    setShowGenerateModal(false)
                  }}
                >
                  Load Queues & Deques Mockup
                </button>
                <button
                  className="sp-btn-paste"
                  style={{ fontSize: 11, padding: '8px 12px' }}
                  onClick={() => {
                    saveTopic(null)
                    setShowGenerateModal(false)
                  }}
                >
                  Show Empty State Mockup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
