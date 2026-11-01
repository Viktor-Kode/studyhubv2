'use client'

import { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  type LearningNode,
  type StudyPathTopic,
  DEFAULT_TOPIC,
  SAMPLE_TOPICS
} from '@/lib/data/studyPath'
import '../map.css'
import RetentionModeSwitcher from '@/components/study/RetentionModeSwitcher'

import {
  FiArrowLeft,
  FiChevronDown,
  FiCheck,
  FiLock,
  FiPlay,
  FiZap,
  FiClock,
  FiAward,
  FiX,
  FiPlus
} from 'react-icons/fi'

function StudyPathMapContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const topicId = (params?.topicId as string) || DEFAULT_TOPIC.topicId

  // Topic State
  const [topic, setTopic] = useState<StudyPathTopic>(DEFAULT_TOPIC)
  const [selectedNode, setSelectedNode] = useState<LearningNode | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showNewTopicModal, setShowNewTopicModal] = useState(false)
  const [newTopicText, setNewTopicText] = useState('')
  const [isCreatingTopic, setIsCreatingTopic] = useState(false)
  const [showRecallModes, setShowRecallModes] = useState(false)

  // Circle refs for dynamic SVG connector lines
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

  // Load topic from localStorage or default/sample
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('studyhelp_active_topic')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed && (parsed.topicId === topicId || !topicId)) {
            setTopic(parsed)
            return
          }
        } catch {
          // ignore error
        }
      }
    }

    // Match in samples
    const found = SAMPLE_TOPICS.find((t) => t.topicId === topicId)
    if (found) {
      setTopic(found)
    } else {
      setTopic(DEFAULT_TOPIC)
    }
  }, [topicId])

  // Active node (UP NEXT)
  const activeNode = useMemo(() => {
    return topic.nodes.find((n) => n.status === 'active') || topic.nodes[0]
  }, [topic])

  // Auto-select node if requested in URL query (e.g. ?node=4)
  useEffect(() => {
    const nodeParam = searchParams.get('node')
    if (nodeParam && topic) {
      const targetId = parseInt(nodeParam, 10)
      const target = topic.nodes.find((n) => n.id === targetId)
      if (target) {
        setSelectedNode(target)
      }
    }
  }, [searchParams, topic])

  // Completed count and totals
  const completedCount = useMemo(() => {
    return topic.nodes.filter((n) => n.status === 'completed').length
  }, [topic])

  const totalCount = topic.nodes.length


  // Recalculate SVG connector coordinates
  useEffect(() => {
    const updateLines = () => {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newSegments: {
        id: string
        x1: number
        y1: number
        x2: number
        y2: number
        isSolid: boolean
      }[] = []

      for (let i = 0; i < topic.nodes.length - 1; i++) {
        const c1 = circleRefs.current[i]
        const c2 = circleRefs.current[i + 1]
        if (!c1 || !c2) continue

        const r1 = c1.getBoundingClientRect()
        const r2 = c2.getBoundingClientRect()

        const x1 = r1.left + r1.width / 2 - containerRect.left
        const y1 = r1.top + r1.height / 2 - containerRect.top
        const x2 = r2.left + r2.width / 2 - containerRect.left
        const y2 = r2.top + r2.height / 2 - containerRect.top

        const node1 = topic.nodes[i]
        const node2 = topic.nodes[i + 1]

        // Solid green path connects completed nodes; dotted connects upcoming & locked
        const isSolid =
          node1.status === 'completed' &&
          (node2.status === 'completed' || node2.status === 'active')

        newSegments.push({
          id: `seg-${node1.id}-${node2.id}`,
          x1,
          y1,
          x2,
          y2,
          isSolid
        })
      }

      setLineSegments(newSegments)
    }

    const timer = setTimeout(updateLines, 100)
    window.addEventListener('resize', updateLines)

    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => updateLines())
      ro.observe(containerRef.current)
    }

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateLines)
      if (ro) ro.disconnect()
    }
  }, [topic])

  // Create new topic handler
  const handleCreateNewTopic = () => {
    setIsCreatingTopic(true)
    setTimeout(() => {
      const title = newTopicText.trim() ? newTopicText.split('\n')[0].slice(0, 32) : 'Custom Learning Path'
      const newTopicObj: StudyPathTopic = {
        topicId: 'custom-' + Date.now(),
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
            title: 'Unit Challenge',
            status: 'locked',
            xp: 50,
            duration: '15 min',
            summary: 'Capstone mastery test challenging concept understanding and practical applications.',
            keyConcepts: ['Capstone Challenge', 'Mastery Review']
          }
        ]
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('studyhelp_active_topic', JSON.stringify(newTopicObj))
      }
      setTopic(newTopicObj)
      setIsCreatingTopic(false)
      setShowNewTopicModal(false)
      setNewTopicText('')
      router.push(`/dashboard/student/map/${newTopicObj.topicId}`)
    }, 350)
  }

  // Scroll to active node
  const handleScrollToFocus = () => {
    if (!activeNode) return
    const idx = topic.nodes.findIndex((n) => n.id === activeNode.id)
    if (idx !== -1 && circleRefs.current[idx]) {
      circleRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setSelectedNode(activeNode)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['student', 'teacher']}>
      <div className="sm-map-root">
        <div className="sm-map-container">
          {/* ── TOP BAR ── */}
          <header className="sm-topbar">
            {/* Back button */}
            <button
              className="sm-btn-back"
              onClick={() => router.push('/dashboard/student')}
              aria-label="Back to Dashboard"
            >
              <FiArrowLeft />
            </button>

            {/* Course dropdown pill */}
            <div className="sm-course-pill-wrap">
              <button
                className="sm-course-pill"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <span className="sm-course-pill-text">{topic.courseCode}</span>
                <FiChevronDown />
              </button>

              {dropdownOpen && (
                <div className="sm-course-dropdown-menu">
                  {/* + New Topic at top of dropdown */}
                  <div
                    className="sm-course-dropdown-item sm-course-dropdown-new"
                    onClick={() => {
                      setDropdownOpen(false)
                      setShowNewTopicModal(true)
                    }}
                  >
                    <FiPlus size={15} />
                    <span>+ New Topic</span>
                  </div>

                  <div className="sm-course-dropdown-divider" />

                  {SAMPLE_TOPICS.map((item) => (
                    <div
                      key={item.topicId}
                      className={`sm-course-dropdown-item ${
                        item.topicId === topic.topicId ? 'active' : ''
                      }`}
                      onClick={() => {
                        setTopic(item)
                        setDropdownOpen(false)
                        router.push(`/dashboard/student/map/${item.topicId}`)
                      }}
                    >
                      <span>{item.title}</span>
                      <span className="sm-course-dropdown-sub">{item.courseCode}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress fraction & mini-bar */}
            <div className="sm-progress-indicator">
              <span className="sm-progress-fraction">
                {completedCount} / {totalCount}
              </span>
              <div className="sm-progress-bar-track">
                <div
                  className="sm-progress-bar-fill"
                  style={{
                    width: `${Math.round((completedCount / totalCount) * 100)}%`
                  }}
                />
              </div>
            </div>
          </header>

          {/* ── HERO HEADING ── */}
          <section className="sm-hero-section">
            <h1 className="sm-hero-title">{topic.title}</h1>
            <p className="sm-hero-subtitle">{topic.courseCode}</p>

            {activeNode && (
              <button className="sm-focus-pill" onClick={handleScrollToFocus}>
                <FiPlay className="sm-focus-icon" />
                <span>
                  Current Focus: Node {activeNode.id} · {activeNode.title}
                </span>
              </button>
            )}
          </section>

          {/* ── WINDING INTERACTIVE PATH ── */}
          <section className="sm-path-area" ref={containerRef}>
            {/* SVG Connector Lines */}
            <svg className="sm-svg-canvas" xmlns="http://www.w3.org/2000/svg">
              {lineSegments.map((seg) => {
                if (seg.isSolid) {
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

            {/* Nodes Trail */}
            <div className="sm-nodes-flow">
              {topic.nodes.map((node, i) => {
                const isCompleted = node.status === 'completed'
                const isActive = node.status === 'active'
                const isLocked = node.status === 'locked'
                const isUnitChallenge = i === topic.nodes.length - 1

                // Layout alignment classes
                // Node 0: row-0 (circle left, card right)
                // Node 1: row-1 (circle left, card right)
                // Node 2: row-2 (circle right, card left -> reverse)
                // Node 3: row-3 (circle right, card left -> reverse)
                // Node 4: row-4 (circle center-right, card left -> reverse)
                // Node 5: row-5 (circle center-left, card right)
                // Node 6: row-6 (circle left, card right)
                // Node 7: row-7 (centered, column layout for Unit Challenge)
                const isReversed = i === 2 || i === 3 || i === 4

                return (
                  <div
                    key={node.id}
                    className={`sm-node-row sm-node-row-${i % 8}`}
                  >
                    <div
                      className={`sm-node-combo ${
                        isUnitChallenge ? 'column' : isReversed ? 'reverse' : ''
                      }`}
                      onClick={() => setSelectedNode(node)}
                      role="button"
                      tabIndex={0}
                    >
                      {/* Circle Element */}
                      {isUnitChallenge ? (
                        <div
                          ref={(el) => {
                            circleRefs.current[i] = el
                          }}
                          className="sm-trophy-circle"
                        >
                          <FiAward className="sm-trophy-icon" />
                          <div className="sm-trophy-lock-badge">
                            <FiLock />
                          </div>
                        </div>
                      ) : (
                        <div
                          ref={(el) => {
                            circleRefs.current[i] = el
                          }}
                          className={`sm-circle ${
                            isCompleted ? 'completed' : isActive ? 'active' : 'locked'
                          }`}
                        >
                          {isCompleted ? (
                            <FiCheck strokeWidth={3} />
                          ) : isActive ? (
                            <FiPlay style={{ marginLeft: 3 }} />
                          ) : (
                            <FiLock />
                          )}
                        </div>
                      )}

                      {/* Card Element */}
                      {isUnitChallenge ? (
                        <div className="sm-challenge-card">
                          <h4 className="sm-challenge-title">UNIT CHALLENGE</h4>
                          <p className="sm-challenge-sub">Locked · +{node.xp} XP</p>
                        </div>
                      ) : (
                        <div className={`sm-node-card ${isActive ? 'active' : ''}`}>
                          {isActive && (
                            <div className="sm-node-card-upnext">UP NEXT</div>
                          )}
                          <h4 className="sm-node-card-title">{node.title}</h4>
                          <p className="sm-node-card-sub">
                            {isCompleted && (
                              <>
                                <span className="sm-badge-xp-green">+{node.xp} XP</span>
                                <span>Completed</span>
                              </>
                            )}
                            {isActive && <span>{node.duration} · +{node.xp} XP</span>}
                            {isLocked && <span>Locked · {node.duration}</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* ── NODE DETAIL MODAL ── */}
        {selectedNode && (
          <div className="sm-modal-overlay" onClick={() => setSelectedNode(null)}>
            <div className="sm-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="sm-modal-header">
                <div>
                  <span
                    className={`sm-modal-badge ${
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
                  <h3 className="sm-modal-title">{selectedNode.title}</h3>
                </div>
                <button
                  className="sm-modal-close-btn"
                  onClick={() => setSelectedNode(null)}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>

              <div className="sm-modal-meta-row">
                <div className="sm-modal-meta-item">
                  <FiClock />
                  <span>{selectedNode.duration}</span>
                </div>
                <div className="sm-modal-meta-item">
                  <FiZap style={{ color: '#fbbf24' }} />
                  <span>+{selectedNode.xp} XP</span>
                </div>
              </div>

              <p className="sm-modal-summary">{selectedNode.summary}</p>

              {selectedNode.keyConcepts && selectedNode.keyConcepts.length > 0 && (
                <div>
                  <div className="sm-modal-concepts-title">Key Concepts</div>
                  <div className="sm-modal-concepts-tags">
                    {selectedNode.keyConcepts.map((concept, idx) => (
                      <span key={idx} className="sm-modal-tag">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.status === 'active' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      className="sm-modal-btn-purple"
                      onClick={() => {
                        const id = selectedNode.id
                        setSelectedNode(null)
                        router.push(`/dashboard/student/lesson/${id}`)
                      }}
                    >
                      <FiPlay />
                      <span>Start Learning</span>
                    </button>
                    <button
                      className="sm-modal-btn-purple"
                      style={{
                        background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
                      }}
                      onClick={() => setShowRecallModes((prev) => !prev)}
                    >
                      <FiZap />
                      <span>Active Recall</span>
                    </button>
                  </div>

                  {showRecallModes && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Retention Study Mode:
                      </span>
                      <RetentionModeSwitcher
                        courseId={topic.topicId}
                        nodeId={selectedNode.id}
                        activeMode="flashcards"
                        onChangeMode={(mode) => {
                          const id = selectedNode.id
                          setSelectedNode(null)
                          if (mode === 'flashcards') {
                            router.push(`/vault/${topic.topicId}?nodeId=${id}`)
                          } else {
                            router.push(`/blurting/${id}`)
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : selectedNode.status === 'completed' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      className="sm-modal-btn-primary"
                      onClick={() => {
                        const id = selectedNode.id
                        setSelectedNode(null)
                        router.push(`/dashboard/student/lesson/${id}`)
                      }}
                    >
                      <FiPlay />
                      <span>Review Concept</span>
                    </button>
                    <button
                      className="sm-modal-btn-purple"
                      style={{
                        background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                      }}
                      onClick={() => setShowRecallModes((prev) => !prev)}
                    >
                      <FiZap />
                      <span>Active Recall</span>
                    </button>
                  </div>

                  {/* Mode Switcher Tab */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      High-Retention Recall Modes:
                    </span>
                    <RetentionModeSwitcher
                      courseId={topic.topicId}
                      nodeId={selectedNode.id}
                      activeMode="flashcards"
                      onChangeMode={(mode) => {
                        const id = selectedNode.id
                        setSelectedNode(null)
                        if (mode === 'flashcards') {
                          router.push(`/vault/${topic.topicId}?nodeId=${id}`)
                        } else {
                          router.push(`/blurting/${id}`)
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <button className="sm-modal-btn-locked" disabled>
                  <FiLock />
                  <span>Complete previous nodes to unlock</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── CREATE NEW TOPIC MODAL ── */}
        {showNewTopicModal && (
          <div className="sm-modal-overlay" onClick={() => setShowNewTopicModal(false)}>
            <div className="sm-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="sm-modal-header">
                <div>
                  <h3 className="sm-modal-title">New Study Path</h3>
                  <p className="sm-modal-summary" style={{ margin: '4px 0 0', fontSize: 13 }}>
                    Enter topic or course name to create a new learning trail.
                  </p>
                </div>
                <button
                  className="sm-modal-close-btn"
                  onClick={() => setShowNewTopicModal(false)}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <textarea
                  value={newTopicText}
                  onChange={(e) => setNewTopicText(e.target.value)}
                  placeholder="e.g. MTH 301 Complex Analysis, Residues, Contour Integration..."
                  rows={4}
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

              <button
                className="sm-modal-btn-primary"
                onClick={handleCreateNewTopic}
                disabled={isCreatingTopic}
              >
                <FiPlus size={18} />
                <span>{isCreatingTopic ? 'Generating Trail...' : 'Create Path'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

export default function StudyPathMapPage() {
  return (
    <Suspense fallback={<div className="sm-map-root" />}>
      <StudyPathMapContent />
    </Suspense>
  )
}

