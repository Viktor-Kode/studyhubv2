'use client'

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  type LearningNode,
  type StudyPathTopic
} from '@/lib/data/studyPath'
import '../../study-path.css'
import '../map.css'
import { extractTextFromFile } from '@/lib/utils/extraction'
import { getStudyPath, getActiveStudyPath, getUserStudyPaths, uploadStudyMaterial } from '@/src/services/api'

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
  FiPlus,
  FiUploadCloud,
  FiEdit3,
  FiLoader,
  FiCheckCircle
} from 'react-icons/fi'
import { IoSparklesSharp } from 'react-icons/io5'

type InputMode = 'upload' | 'text'

// Human-friendly label shown while a document is being read
function getExtractionLabel(file: File): string {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'Scanning image with OCR...'
  if (ext === '.pdf') return 'Extracting PDF pages...'
  if (ext === '.docx') return 'Reading Word document...'
  if (ext === '.pptx' || ext === '.ppt') return 'Extracting presentation text...'
  return 'Reading document...'
}

function StudyPathMapContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()

  const rawParamId = params?.topicId as string
  const topicId = rawParamId && rawParamId !== 'default' ? rawParamId : ''

  // Topic State
  const [topic, setTopic] = useState<StudyPathTopic | null>(null)
  const [userTopics, setUserTopics] = useState<StudyPathTopic[]>([])
  const [isLoadingPath, setIsLoadingPath] = useState(true)
  const [selectedNode, setSelectedNode] = useState<LearningNode | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showNewTopicModal, setShowNewTopicModal] = useState(false)

  // New topic input state (upload document or paste text)
  const [inputMode, setInputMode] = useState<InputMode>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [manualText, setManualText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractionLabel, setExtractionLabel] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Load all user topics for dropdown switcher (no demo data)
  useEffect(() => {
    let cancelled = false

    const loadAllTopics = async () => {
      const topicMap = new Map<string, StudyPathTopic>()

      // 1. From localStorage
      if (typeof window !== 'undefined') {
        try {
          const rawActive = localStorage.getItem('studyhelp_active_topic')
          if (rawActive) {
            const parsed = JSON.parse(rawActive)
            if (parsed?.topicId && !parsed.topicId.startsWith('csc202') && !parsed.topicId.startsWith('mth201')) {
              topicMap.set(parsed.topicId, parsed)
            }
          }
          const rawSaved = localStorage.getItem('studyhelp_saved_topics')
          if (rawSaved) {
            const list: StudyPathTopic[] = JSON.parse(rawSaved)
            if (Array.isArray(list)) {
              list.forEach((t) => {
                if (t?.topicId && !t.topicId.startsWith('csc202') && !t.topicId.startsWith('mth201')) {
                  topicMap.set(t.topicId, t)
                }
              })
            }
          }
        } catch {}
      }

      // 2. From Backend
      try {
        const backendList = await getUserStudyPaths()
        if (Array.isArray(backendList)) {
          backendList.forEach((t) => {
            if (t?.topicId && !t.topicId.startsWith('csc202') && !t.topicId.startsWith('mth201')) {
              topicMap.set(t.topicId, t)
            }
          })
        }
      } catch {}

      if (!cancelled) {
        setUserTopics(Array.from(topicMap.values()))
      }
    }

    loadAllTopics()
    return () => { cancelled = true }
  }, [topic?.topicId])

  // Load topic: try backend by topicId, then localStorage
  useEffect(() => {
    let cancelled = false
    setIsLoadingPath(true)

    const loadFromLocal = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('studyhelp_active_topic')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            if (parsed && (parsed.topicId === topicId || !topicId)) {
              if (!cancelled) setTopic(parsed)
              return true
            }
          } catch { /* ignore */ }
        }
        const rawSaved = localStorage.getItem('studyhelp_saved_topics')
        if (rawSaved) {
          try {
            const list: StudyPathTopic[] = JSON.parse(rawSaved)
            const found = list.find((t) => t.topicId === topicId || !topicId)
            if (found) {
              if (!cancelled) setTopic(found)
              return true
            }
          } catch {}
        }
      }
      return false
    }

    const backendFetch = topicId
      ? getStudyPath(topicId)
      : getActiveStudyPath()

    backendFetch
      .then((backendPath) => {
        if (cancelled) return
        if (backendPath && backendPath.nodes?.length > 0) {
          setTopic(backendPath)
          if (typeof window !== 'undefined') {
            localStorage.setItem('studyhelp_active_topic', JSON.stringify(backendPath))
            try {
              const rawSaved = localStorage.getItem('studyhelp_saved_topics')
              const list: StudyPathTopic[] = rawSaved ? JSON.parse(rawSaved) : []
              const updated = [backendPath, ...list.filter((p) => p.topicId !== backendPath.topicId)]
              localStorage.setItem('studyhelp_saved_topics', JSON.stringify(updated))
            } catch {}
          }
        } else {
          const foundLocal = loadFromLocal()
          if (!foundLocal && !cancelled) setTopic(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          const foundLocal = loadFromLocal()
          if (!foundLocal) setTopic(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPath(false)
      })

    return () => { cancelled = true }
  }, [topicId])

  // Active node (UP NEXT) — safe when topic is null during loading
  const activeNode = useMemo(() => {
    if (!topic) return null
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
    if (!topic || !topic.nodes) return 0
    return topic.nodes.filter((n) => n.status === 'completed').length
  }, [topic])

  const totalCount = topic?.nodes?.length || 0


  // Recalculate SVG connector coordinates
  useEffect(() => {
    const updateLines = () => {
      if (!containerRef.current || !topic || !topic.nodes) return
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

  // Open / close the new topic modal
  const openNewTopicModal = () => {
    setInputError(null)
    setShowNewTopicModal(true)
  }

  const closeNewTopicModal = () => {
    setShowNewTopicModal(false)
    setInputError(null)
  }

  // File upload & text extraction
  const handleFile = useCallback(async (file: File) => {
    const MAX_MB = 50
    if (file.size > MAX_MB * 1024 * 1024) {
      setInputError(`File too large. Maximum is ${MAX_MB}MB.`)
      return
    }
    setUploadedFile(file)
    setExtractedText('')
    setInputError(null)
    setExtractionLabel(getExtractionLabel(file))
    setExtracting(true)
    try {
      const text = await extractTextFromFile(file)
      if (!text || text.trim().length < 30) {
        setInputError('Could not extract readable text from this file. Please try a different file or paste text manually.')
        setUploadedFile(null)
        setExtractedText('')
      } else {
        setExtractedText(text)
      }
    } catch (e: any) {
      setInputError(e?.message || 'Failed to read file.')
      setUploadedFile(null)
      setExtractedText('')
    } finally {
      setExtracting(false)
      setExtractionLabel('')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const sourceText = inputMode === 'upload' ? extractedText : manualText
  const textReady =
    inputMode === 'upload'
      ? !!extractedText && !extracting
      : manualText.trim().length >= 50

  // Handle generation — sends PDF/text to the real backend
  const handleGenerateStudyPath = async () => {
    if (!textReady) return
    setInputError(null)
    setGenerateError(null)
    setIsGenerating(true)
    try {
      const title =
        inputMode === 'upload' && uploadedFile
          ? uploadedFile.name.replace(/\.[^/.]+$/, '')
          : sourceText.split('\n')[0].slice(0, 60).trim() || 'Study Material'

      let studyPath: StudyPathTopic
      if (inputMode === 'upload' && uploadedFile) {
        studyPath = await uploadStudyMaterial(uploadedFile, { title })
      } else {
        studyPath = await uploadStudyMaterial(null as any, { text: sourceText, title })
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('studyhelp_active_topic', JSON.stringify(studyPath))
        try {
          const rawSaved = localStorage.getItem('studyhelp_saved_topics')
          const list: StudyPathTopic[] = rawSaved ? JSON.parse(rawSaved) : []
          const updated = [studyPath, ...list.filter((p) => p.topicId !== studyPath.topicId)]
          localStorage.setItem('studyhelp_saved_topics', JSON.stringify(updated))
        } catch {}
      }
      setTopic(studyPath)
      setUserTopics((prev) => [studyPath, ...prev.filter((p) => p.topicId !== studyPath.topicId)])
      setShowNewTopicModal(false)
      setUploadedFile(null)
      setExtractedText('')
      setManualText('')
      router.push(`/dashboard/student/map/${encodeURIComponent(studyPath.topicId)}`)
    } catch (err: any) {
      setGenerateError(err?.message || 'Failed to generate study path. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Scroll to active node
  const handleScrollToFocus = () => {
    if (!activeNode || !topic) return
    const idx = topic.nodes.findIndex((n) => n.id === activeNode.id)
    if (idx !== -1 && circleRefs.current[idx]) {
      circleRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setSelectedNode(activeNode)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['student', 'teacher']}>
      <div className="sm-map-root">
        {/* Loading skeleton while fetching path from backend */}
        {isLoadingPath && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
            <FiLoader size={28} style={{ color: '#22c55e', animation: 'spin 1s linear infinite' }} />
            <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, letterSpacing: '0.05em' }}>Loading your study path...</span>
          </div>
        )}
        {!isLoadingPath && !topic && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
            <span style={{ color: '#94a3b8', fontSize: 15 }}>No study path found.</span>
            <button className="sm-btn-back" onClick={() => router.push('/dashboard/student')} style={{ padding: '10px 24px' }}>← Back to Dashboard</button>
          </div>
        )}
        {!isLoadingPath && topic && (
          <>
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
                <span className="sm-course-pill-text">{topic?.courseCode}</span>
                <FiChevronDown />
              </button>

              {dropdownOpen && (
                <div className="sm-course-dropdown-menu">
                  {/* + New Topic at top of dropdown */}
                  <div
                    className="sm-course-dropdown-item sm-course-dropdown-new"
                    onClick={() => {
                      setDropdownOpen(false)
                      openNewTopicModal()
                    }}
                  >
                    <FiPlus size={15} />
                    <span>+ New Topic</span>
                  </div>

                  {userTopics.length > 0 && <div className="sm-course-dropdown-divider" />}

                  {userTopics.map((item) => (
                    <div
                      key={item.topicId}
                      className={`sm-course-dropdown-item ${
                        item.topicId === topic?.topicId ? 'active' : ''
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
              {(topic?.nodes || []).map((node, i) => {
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
              ) : selectedNode.status === 'completed' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
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
                    onClick={() => {
                      const id = selectedNode.id
                      setSelectedNode(null)
                      router.push(`/vault/${topic?.topicId || topicId}?nodeId=${id}`)
                    }}
                  >
                    <FiZap />
                    <span>Active Recall</span>
                  </button>
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
          </>
        )}

        {/* ── NEW TOPIC MODAL (upload document or paste text) ── */}
        {showNewTopicModal && (
          <div className="sp-modal-overlay" onClick={closeNewTopicModal}>
            <div className="sp-modal-box sp-modal-box-lg" onClick={(e) => e.stopPropagation()}>
              <div className="sp-modal-header">
                <div>
                  <h3 className="sp-modal-title">New Topic</h3>
                  <p className="sp-tool-sub" style={{ marginTop: 4 }}>
                    Upload a document or paste text to generate your study path.
                  </p>
                </div>
                <button
                  className="sp-modal-close-btn"
                  onClick={closeNewTopicModal}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="sp-input-tabs">
                <button
                  className={`sp-input-tab ${inputMode === 'upload' ? 'active' : ''}`}
                  onClick={() => setInputMode('upload')}
                >
                  <FiUploadCloud /> Upload Document
                </button>
                <button
                  className={`sp-input-tab ${inputMode === 'text' ? 'active' : ''}`}
                  onClick={() => setInputMode('text')}
                >
                  <FiEdit3 /> Paste Text
                </button>
              </div>

              {/* Upload Mode */}
              {inputMode === 'upload' && (
                <div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !extracting && fileInputRef.current?.click()}
                    className={`sp-dropzone ${isDragging ? 'dragging' : ''} ${
                      uploadedFile && extractedText ? 'done' : ''
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="sp-hidden-input"
                      accept=".pdf,.docx,.pptx,.ppt,.txt,.md,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />

                    {extracting ? (
                      <>
                        <FiLoader className="animate-spin sp-dropzone-loader" />
                        <p className="sp-dropzone-title">{extractionLabel}</p>
                      </>
                    ) : uploadedFile && extractedText ? (
                      <>
                        <div className="sp-dropzone-icon done">
                          <FiCheckCircle />
                        </div>
                        <div>
                          <p className="sp-dropzone-title sp-dropzone-file">{uploadedFile.name}</p>
                          <p className="sp-dropzone-sub">
                            {extractedText.length.toLocaleString()} characters extracted
                          </p>
                        </div>
                        <button
                          className="sp-dropzone-remove"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadedFile(null)
                            setExtractedText('')
                          }}
                        >
                          <FiX /> Remove file
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="sp-dropzone-icon">
                          <FiUploadCloud />
                        </div>
                        <div>
                          <p className="sp-dropzone-title">Drop your document here</p>
                          <p className="sp-dropzone-sub">
                            or click to browse &mdash; PDF, Word, PPT, Images (max 50 MB)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="sp-dropzone-hint">
                    Supports PDF, DOCX, PPTX, TXT, and images (JPG, PNG)
                  </p>
                </div>
              )}

              {/* Paste Text Mode */}
              {inputMode === 'text' && (
                <div>
                  <label className="sp-input-label">Your Content</label>
                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    rows={8}
                    placeholder="Paste your lecture notes, textbook excerpt, or study material here... (minimum 50 characters)"
                    className="sp-modal-textarea"
                  />
                  <p
                    className={`sp-char-count ${
                      manualText.trim().length < 50 ? 'warn' : 'ok'
                    }`}
                  >
                    {manualText.trim().length} / 50 min characters
                  </p>
                </div>
              )}

              {inputError && <p className="sp-input-error">{inputError}</p>}

              {generateError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5',
                  fontSize: 13,
                  lineHeight: 1.5,
                  marginTop: 4
                }}>
                  ⚠️ {generateError}
                </div>
              )}

              <button
                className="sp-btn-generate sp-generate-full"
                onClick={handleGenerateStudyPath}
                disabled={!textReady || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <FiLoader style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Analysing with AI...</span>
                  </>
                ) : (
                  <>
                    <IoSparklesSharp />
                    <span>Generate Study Path</span>
                  </>
                )}
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

