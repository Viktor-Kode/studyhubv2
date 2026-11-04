'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuthStore } from '@/lib/store/authStore'
import { progressApi } from '@/lib/api/progressApi'
import './study-path.css'
import './dashboard-redesign.css'
import { getActiveStudyPath, getUserStudyPaths, deleteStudyPath } from '@/src/services/api'
import CreateStudyPathModal from '@/components/dashboard/CreateStudyPathModal'
import { firebaseSignOut } from '@/lib/firebase-auth'

import {
  FiCheck,
  FiChevronDown,
  FiLock,
  FiPlay,
  FiZap,
  FiBookOpen,
  FiHome,
  FiMap,
  FiFileText,
  FiBarChart2,
  FiUser,
  FiCpu,
  FiCheckSquare,
  FiAward,
  FiPlus,
  FiX,
  FiEdit3,
  FiLoader,
  FiTrash2,
  FiUsers,
  FiPhone,
  FiMessageCircle,
  FiLogOut,
  FiMoreHorizontal
} from 'react-icons/fi'
import { FaFire } from 'react-icons/fa'
import { IoSparklesSharp } from 'react-icons/io5'
import {
  type LearningNode,
  type StudyPathTopic
} from '@/lib/data/studyPath'

export type { LearningNode, StudyPathTopic }

export default function StudentDashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  // State
  const [topic, setTopic] = useState<StudyPathTopic | null>(null)
  const [allTopics, setAllTopics] = useState<StudyPathTopic[]>([])
  const [showTopicSwitcher, setShowTopicSwitcher] = useState(false)
  const topicSwitcherRef = useRef<HTMLDivElement>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [isLoadingPath, setIsLoadingPath] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showTopicMenu, setShowTopicMenu] = useState(false)
  const [isDeletingTopic, setIsDeletingTopic] = useState(false)
  const topicMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showTopicMenu) return
    const closeTopicMenu = (event: MouseEvent) => {
      if (!topicMenuRef.current?.contains(event.target as Node)) setShowTopicMenu(false)
    }
    document.addEventListener('mousedown', closeTopicMenu)
    return () => document.removeEventListener('mousedown', closeTopicMenu)
  }, [showTopicMenu])

  useEffect(() => {
    if (!showTopicSwitcher) return
    const closeSwitcher = (event: MouseEvent) => {
      if (!topicSwitcherRef.current?.contains(event.target as Node)) {
        setShowTopicSwitcher(false)
      }
    }
    document.addEventListener('mousedown', closeSwitcher)
    return () => document.removeEventListener('mousedown', closeSwitcher)
  }, [showTopicSwitcher])

  // Real progress state
  const [realStats, setRealStats] = useState({
    streak: 0,
    xp: 0,
    dailyGoalXp: 0,
    dailyGoalTarget: 50,
    weekDaysActive: [] as number[],
  })
  const [showGoalPicker, setShowGoalPicker] = useState(false)
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false)

  // Load topics: backend first, then localStorage fallback
  const loadTopics = useCallback(async () => {
    setIsLoadingPath(true)
    try {
      const [backendPaths, activeBackend] = await Promise.all([
        getUserStudyPaths().catch(() => [] as StudyPathTopic[]),
        getActiveStudyPath().catch(() => null),
      ])

      let localSaved: StudyPathTopic[] = []
      let localActive: StudyPathTopic | null = null
      if (typeof window !== 'undefined') {
        try {
          const rawSaved = localStorage.getItem('studyhelp_saved_topics')
          if (rawSaved) localSaved = JSON.parse(rawSaved)
          const rawActive = localStorage.getItem('studyhelp_active_topic')
          if (rawActive) localActive = JSON.parse(rawActive)
        } catch {}
      }

      const map = new Map<string, StudyPathTopic>()
      if (Array.isArray(backendPaths)) {
        backendPaths.forEach((p) => { if (p?.topicId) map.set(p.topicId, p) })
      }
      if (Array.isArray(localSaved)) {
        localSaved.forEach((p) => { if (p?.topicId && !map.has(p.topicId)) map.set(p.topicId, p) })
      }
      if (activeBackend?.topicId) map.set(activeBackend.topicId, activeBackend)
      if (localActive?.topicId && !map.has(localActive.topicId)) map.set(localActive.topicId, localActive)

      const merged = Array.from(map.values())
      setAllTopics(merged)

      const selected = (localActive && map.get(localActive.topicId)) || localActive || activeBackend || (merged.length > 0 ? merged[0] : null)
      setTopic(selected)
      if (selected && typeof window !== 'undefined') {
        localStorage.setItem('studyhelp_active_topic', JSON.stringify(selected))
      }
    } finally {
      setIsLoadingPath(false)
    }
  }, [])

  useEffect(() => {
    loadTopics()
  }, [loadTopics])

  // Fetch real progress from backend if logged in and maintain daily login activity
  const fetchProgress = useCallback(async () => {
    if (!user?.uid) return
    try {
      // Award daily login if not already awarded today
      await progressApi.award('daily_login').catch(() => {})
      const res = await progressApi.getMe()
      const d = res?.data
      if (d) {
        setRealStats({
          streak: typeof d.streak === 'number' ? d.streak : 0,
          xp: typeof d.xp === 'number' ? d.xp : 0,
          dailyGoalXp: typeof d.dailyXP === 'number' ? d.dailyXP : 0,
          dailyGoalTarget: typeof d.dailyGoalTarget === 'number' && d.dailyGoalTarget > 0 ? d.dailyGoalTarget : 50,
          weekDaysActive: Array.isArray(d.weekDaysActive) ? d.weekDaysActive : [],
        })
      }
    } catch {
      // Non-fatal, progress will retain current stats
    }
  }, [user?.uid])

  useEffect(() => {
    fetchProgress()
  }, [fetchProgress])

  const handleSelectGoalTarget = async (target: number) => {
    setIsUpdatingGoal(true)
    try {
      await progressApi.updateDailyGoal(target)
      setRealStats((prev) => ({ ...prev, dailyGoalTarget: target }))
      setShowGoalPicker(false)
    } catch (err) {
      console.warn('Failed to update daily goal:', err)
    } finally {
      setIsUpdatingGoal(false)
    }
  }

  // Save topic changes
  const saveTopic = (newTopic: StudyPathTopic | null) => {
    setTopic(newTopic)
    if (typeof window !== 'undefined') {
      if (newTopic) {
        localStorage.setItem('studyhelp_active_topic', JSON.stringify(newTopic))
        setAllTopics((prev) => {
          const exists = prev.some((t) => t.topicId === newTopic.topicId)
          const updated = exists
            ? prev.map((t) => (t.topicId === newTopic.topicId ? newTopic : t))
            : [newTopic, ...prev]
          try {
            localStorage.setItem('studyhelp_saved_topics', JSON.stringify(updated))
          } catch {}
          return updated
        })
      } else {
        localStorage.removeItem('studyhelp_active_topic')
      }
    }
  }
  }

  // Delete active topic
  const handleDeleteActiveTopic = async () => {
    if (!topic) return
    setIsDeletingTopic(true)
    try {
      await deleteStudyPath(topic.topicId)
    } catch (e) {
      console.warn('Failed to delete topic from server:', e)
    }
    saveTopic(null)
    if (typeof window !== 'undefined') {
      try {
        const rawSaved = localStorage.getItem('studyhelp_saved_topics')
        if (rawSaved) {
          const list = JSON.parse(rawSaved)
          localStorage.setItem('studyhelp_saved_topics', JSON.stringify(list.filter((t: any) => t.topicId !== topic.topicId)))
        }
      } catch {}
    }
    setIsDeletingTopic(false)
    setShowDeleteConfirm(false)
  }

  // Open / close the new topic modal
  const openGenerateModal = () => {
    setShowGenerateModal(true)
  }

  const closeGenerateModal = () => {
    setShowGenerateModal(false)
  }

  // Greeting
  const firstName = user?.name?.split(' ')[0] || 'Student'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Completed count
  const isTopicComplete = Boolean(topic?.completed || topic?.challenge?.status === 'completed' || topic?.challenge?.passed)
  const completedCount = useMemo(() => {
    if (!topic) return 0
    const nodeCount = topic.nodes.filter((n) => n.status === 'completed').length
    return isTopicComplete ? nodeCount + 1 : nodeCount
  }, [topic, isTopicComplete])

  const totalCount = topic ? topic.nodes.length + 1 : 0

  const goalPercent = Math.min(100, Math.round((realStats.dailyGoalXp / Math.max(realStats.dailyGoalTarget, 1)) * 100))
  const xpRemaining = Math.max(0, realStats.dailyGoalTarget - realStats.dailyGoalXp)
  const previewNodes = topic?.nodes.slice(0, 3) || []
  const pathRemaining = Math.max(0, (topic?.nodes.length || 0) + 1 - previewNodes.length)

  const todayDayIndex = (new Date().getDay() + 6) % 7
  const weekDays = [
    { label: 'M', name: 'Mon', index: 0 },
    { label: 'T', name: 'Tue', index: 1 },
    { label: 'W', name: 'Wed', index: 2 },
    { label: 'T', name: 'Thu', index: 3 },
    { label: 'F', name: 'Fri', index: 4 },
    { label: 'S', name: 'Sat', index: 5 },
    { label: 'S', name: 'Sun', index: 6 },
  ]

  return (
    <ProtectedRoute allowedRoles={['student', 'teacher']}>
      <div className="sr-page">
        <div className="sr-frame">
          <div className="sr-layout">
            <aside className="sr-sidebar">
              <Link href="/dashboard/student" className="sr-brand">
                <div style={{ width: 38, height: 38, borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid var(--sr-border)', flexShrink: 0, boxShadow: '0 2px 8px rgba(109,59,242,0.12)' }}>
                  <Image
                    src="/apple-touch-icon.png"
                    alt="StudyHelp"
                    width={38}
                    height={38}
                    priority
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <span>StudyHelp</span>
              </Link>
              <nav className="sr-nav" aria-label="Main navigation">
                <Link href="/dashboard/student" className="sr-nav-link active"><FiBookOpen />Home</Link>
                <Link href="/dashboard/notes-history" className="sr-nav-link"><FiFileText />Notes Library</Link>
                <Link href="/dashboard/profile" className="sr-nav-link"><FiUser />Profile</Link>
              </nav>
              <div className="sr-support">
                <h2>Support</h2>
                <Link href="/dashboard/settings?tab=referrals" className="sr-nav-link"><FiUsers />Refer &amp; Earn</Link>
                <a href="tel:+2349163345794" className="sr-nav-link"><FiPhone />Call Support</a>
                <a href="https://wa.me/2349163345794" target="_blank" rel="noopener noreferrer" className="sr-nav-link"><FiMessageCircle />WhatsApp Support</a>
                <button className="sr-nav-link sr-logout" onClick={async () => { await firebaseSignOut(); router.push('/auth/login') }}>
                  <FiLogOut />Log Out
                </button>
              </div>
            </aside>

            <div className="sr-main-column">
              <main className="sr-content">
                <header className="sr-head">
                  <div className="sr-hello"><small>{greeting},</small><h1>{firstName}</h1></div>
                  <div className="sr-pills">
                    <div className="sr-pill fire"><FaFire /><span>{realStats.streak}</span></div>
                    <div className="sr-pill xp"><FiZap /><span>{realStats.xp.toLocaleString()}</span></div>
                  </div>
                </header>

                {topic ? (
                  <section className="sr-card sr-topic">
                    <div className="sr-topic-menu" ref={topicMenuRef}>
                      <button className="sr-kebab" aria-label="Topic options" aria-expanded={showTopicMenu} onClick={() => setShowTopicMenu((open) => !open)}><FiMoreHorizontal /></button>
                      {showTopicMenu && <div className="sr-menu"><button onClick={() => { setShowTopicMenu(false); setShowDeleteConfirm(true) }}>Delete topic</button></div>}
                    </div>
                    <div className="sr-topic-header-row">
                      <p className="sr-eyebrow">{isTopicComplete ? 'Completed topic' : 'Active topic'}</p>
                      {allTopics.length > 1 && (
                        <div className="sr-topic-switcher-wrap" ref={topicSwitcherRef}>
                          <button
                            type="button"
                            className="sr-topic-switch-btn"
                            onClick={() => setShowTopicSwitcher((open) => !open)}
                            aria-expanded={showTopicSwitcher}
                            title="Switch study topic"
                          >
                            <span>Switch topic ({allTopics.length})</span>
                            <FiChevronDown className={`sr-switch-chevron ${showTopicSwitcher ? 'open' : ''}`} />
                          </button>
                          {showTopicSwitcher && (
                            <div className="sr-topic-dropdown-menu">
                              <div className="sr-dropdown-title">Your Topics</div>
                              <div className="sr-dropdown-list">
                                {allTopics.map((t) => {
                                  const isActiveTopic = t.topicId === topic.topicId
                                  const isDone = Boolean(t.completed || t.challenge?.status === 'completed' || t.challenge?.passed)
                                  const nodeDoneCount = t.nodes?.filter((n) => n.status === 'completed').length || 0
                                  const totalNodes = (t.nodes?.length || 0) + 1
                                  return (
                                    <button
                                      key={t.topicId}
                                      type="button"
                                      className={`sr-dropdown-item ${isActiveTopic ? 'selected' : ''}`}
                                      onClick={() => {
                                        saveTopic(t)
                                        setShowTopicSwitcher(false)
                                      }}
                                    >
                                      <div className="sr-dropdown-item-info">
                                        <b className="sr-dropdown-item-title">{t.title}</b>
                                        <span className="sr-dropdown-item-meta">
                                          {t.courseCode ? `${t.courseCode} · ` : ''}
                                          {isDone ? 'Completed' : `${nodeDoneCount}/${totalNodes} complete`}
                                        </span>
                                      </div>
                                      {isActiveTopic && <span className="sr-active-tag">Active</span>}
                                    </button>
                                  )
                                })}
                              </div>
                              <button
                                type="button"
                                className="sr-dropdown-add-btn"
                                onClick={() => {
                                  setShowTopicSwitcher(false)
                                  openGenerateModal()
                                }}
                              >
                                <FiPlus size={14} />
                                <span>Add new topic</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <h2>{topic.title}</h2>
                    <p className="sr-topic-code">{topic.courseCode}</p>
                    <div className="sr-progress-row">
                      <div className="sr-progress-track"><span style={{ width: `${Math.round((completedCount / Math.max(totalCount, 1)) * 100)}%` }} /></div>
                      <span>{isTopicComplete ? 'Completed' : `${completedCount} of ${totalCount} complete`}</span>
                    </div>
                    <div className="sr-actions">
                      {isTopicComplete ? (
                        <>
                          <button className="sr-btn sr-primary" onClick={openGenerateModal}><FiPlus />New topic</button>
                          <button className="sr-btn sr-outline" onClick={() => router.push(`/dashboard/student/map/${encodeURIComponent(topic.topicId)}`)}>Review map</button>
                        </>
                      ) : (
                        <>
                          <button className="sr-btn sr-primary" onClick={() => router.push(`/dashboard/student/map/${encodeURIComponent(topic.topicId)}`)}>RESUME LEARNING <FiPlay fill="currentColor" /></button>
                          <button className="sr-btn sr-outline" onClick={openGenerateModal}><FiPlus />New topic</button>
                        </>
                      )}
                    </div>
                  </section>
                ) : (
                  <section className="sr-card sr-topic">
                    <p className="sr-eyebrow">Active topic</p>
                    <h2>No active topic yet</h2>
                    <p className="sr-topic-code">Upload your material to build an interactive study path.</p>
                    <div className="sr-actions"><button className="sr-btn sr-primary" onClick={openGenerateModal}><FiPlus />Create a study path</button></div>
                  </section>
                )}

                <aside className="sr-card sr-goal">
                  <div className="sr-goal-top">
                    <div className="sr-ring" style={{ background: `conic-gradient(var(--sr-green) ${goalPercent * 3.6}deg, var(--sr-track) 0)` }}>
                      <div>{goalPercent}%</div>
                    </div>
                    <div className="sr-goal-top-text">
                      <div className="sr-goal-header-row">
                        <p className="sr-eyebrow">Daily goal</p>
                        <button
                          type="button"
                          className="sr-goal-edit-btn"
                          onClick={() => setShowGoalPicker((prev) => !prev)}
                          aria-label="Adjust daily goal target"
                        >
                          <FiEdit3 size={11} />
                          <span>{showGoalPicker ? 'Close' : 'Adjust'}</span>
                        </button>
                      </div>
                      <h2>{realStats.dailyGoalXp} / {realStats.dailyGoalTarget} XP</h2>
                      <p className="sr-muted">
                        {realStats.dailyGoalXp >= realStats.dailyGoalTarget
                          ? 'Goal complete today! Nice work!'
                          : `${xpRemaining} XP to go`}
                      </p>
                    </div>
                  </div>

                  {showGoalPicker && (
                    <div className="sr-goal-presets" aria-label="Select daily target">
                      {[20, 30, 50, 100, 150].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          disabled={isUpdatingGoal}
                          className={`sr-goal-chip ${realStats.dailyGoalTarget === preset ? 'active' : ''}`}
                          onClick={() => handleSelectGoalTarget(preset)}
                        >
                          {preset} XP
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="sr-week">
                    <p className="sr-eyebrow">This week</p>
                    <div className="sr-week-row">
                      {weekDays.map((d) => {
                        const isToday = d.index === todayDayIndex
                        const isDone = realStats.weekDaysActive.includes(d.index) || (isToday && realStats.dailyGoalXp > 0)
                        return (
                          <div
                            className={`sr-day ${isToday ? 'today' : ''}`}
                            key={d.index}
                            title={`${d.name}: ${isDone ? 'Activity logged' : isToday ? 'Today' : 'No activity yet'}`}
                          >
                            <span className={isDone ? 'done' : ''}>
                              {isDone ? <FiCheck /> : isToday ? '•' : null}
                            </span>
                            {d.label}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </aside>

                <section className="sr-tools">
                  <h2 className="sr-section-title">Quick tools</h2>
                  <div className="sr-tools-grid">
                    <Link href="/dashboard/tutor" className="sr-card sr-tool"><span className="sr-tool-icon purple"><FiCpu /></span><span><b>AI Tutor</b><small>Ask anything</small></span></Link>
                    <Link href="/dashboard/question-bank" className="sr-card sr-tool"><span className="sr-tool-icon orange"><FiCheckSquare /></span><span><b>Question Generation</b><small>Generate questions from a topic</small></span></Link>
                    <Link href="/dashboard/pdf-summary" className="sr-card sr-tool"><span className="sr-tool-icon green"><FiFileText /></span><span><b>Summarize PDF</b><small>Get key ideas from your PDF</small></span></Link>
                    <Link href="/dashboard/leaderboard" className="sr-card sr-tool"><span className="sr-tool-icon amber"><FiAward /></span><span><b>Leaderboard</b><small>Global league</small></span></Link>
                  </div>
                </section>

                <section className="sr-path">
                  <div className="sr-path-head"><h2 className="sr-section-title">Your path</h2>{topic && <Link href={`/dashboard/student/map/${encodeURIComponent(topic.topicId)}`}>{completedCount} of {totalCount} · View map</Link>}</div>
                  {isLoadingPath ? (
                    <div className="sr-rail sr-loading" aria-label="Loading your study path">{[0, 1, 2].map((item) => <div className="sr-node" key={item}><span className="sr-node-circle" /><span className="sr-node-card" /></div>)}</div>
                  ) : isTopicComplete && topic ? (
                    <div className="sr-card" style={{ padding: '24px', textAlign: 'center', background: 'var(--sr-card)', borderRadius: '16px', border: '1px solid var(--sr-border)' }}>
                      <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.15)', color: '#FBBF24', marginBottom: '8px' }}>
                        <FiAward size={28} />
                      </div>
                      <h3 style={{ margin: '4px 0', fontSize: '18px', fontWeight: 800 }}>Topic Completed!</h3>
                      <p style={{ margin: '4px 0 16px', color: 'var(--sr-muted)', fontSize: '14px' }}>
                        You passed the Unit Challenge. All {topic.nodes.length} lessons and overview questions are complete.
                      </p>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button className="sr-btn sr-primary" onClick={openGenerateModal}><FiPlus />New topic</button>
                        <Link href={`/dashboard/student/map/${encodeURIComponent(topic.topicId)}`} className="sr-btn sr-outline" style={{ display: 'inline-flex', alignItems: 'center' }}>Review map</Link>
                      </div>
                    </div>
                  ) : topic && previewNodes.length ? (
                    <div className="sr-rail">
                      {previewNodes.map((node) => {
                        const active = node.status === 'active'
                        const done = node.status === 'completed'
                        return <button key={node.id} className={`sr-node ${active ? 'active' : done ? 'done' : 'locked'}`} onClick={() => router.push(`/dashboard/student/map/${encodeURIComponent(topic.topicId)}?node=${node.id}`)}>
                          <span className="sr-node-circle">{done ? <FiCheck /> : active ? <FiPlay fill="currentColor" /> : <FiLock />}</span>
                          <span className="sr-node-card">{active && <span className="sr-up-next">Up next</span>}<b>{node.title}</b><small>{node.duration}{active ? ` · +${node.xp} XP` : ''}</small></span>
                        </button>
                      })}
                    </div>
                  ) : (
                    <div className="sr-empty-path"><IoSparklesSharp /><p>Your interactive lesson path will appear here once you upload a document.</p><button className="sr-btn sr-outline" onClick={openGenerateModal}>Upload material</button></div>
                  )}
                  {!isLoadingPath && topic && !isTopicComplete && pathRemaining > 0 && <p className="sr-more">+ {pathRemaining} more · <Link href={`/dashboard/student/map/${encodeURIComponent(topic.topicId)}`}>View map</Link></p>}
                </section>
              </main>

              <nav className="sr-tabbar" aria-label="Mobile navigation">
                <Link href={`/dashboard/student/map/${encodeURIComponent(topic?.topicId || 'default')}`}><FiMap />Map</Link>
                <Link href="/dashboard/notes-history"><FiFileText />Notes</Link>
                <Link href="/dashboard/student" className="active"><FiHome />Home</Link>
                <Link href="/dashboard/analytics"><FiBarChart2 />Analytics</Link>
                <Link href="/dashboard/profile"><FiUser />Profile</Link>
              </nav>
            </div>
          </div>
        </div>
        {showGenerateModal && <CreateStudyPathModal onClose={closeGenerateModal} />}
        {/* ── DELETE TOPIC CONFIRMATION MODAL ── */}
        {showDeleteConfirm && topic && (
          <div className="sp-modal-overlay" onClick={() => !isDeletingTopic && setShowDeleteConfirm(false)}>
            <div className="sp-modal-box" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
              <div className="sp-modal-header">
                <div>
                  <h3 className="sp-modal-title" style={{ color: '#ef4444' }}>Delete Topic</h3>
                  <p className="sp-tool-sub" style={{ marginTop: 4 }}>
                    Are you sure you want to delete &ldquo;{topic.title}&rdquo;? All learning nodes and progress for this topic will be removed.
                  </p>
                </div>
                <button
                  className="sp-modal-close-btn"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeletingTopic}
                  aria-label="Close"
                >
                  <FiX />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  className="sp-btn-paste"
                  style={{ padding: '8px 16px' }}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeletingTopic}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteActiveTopic}
                  disabled={isDeletingTopic}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 18px',
                    borderRadius: 10,
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: isDeletingTopic ? 'not-allowed' : 'pointer',
                    opacity: isDeletingTopic ? 0.7 : 1
                  }}
                >
                  {isDeletingTopic ? (
                    <>
                      <FiLoader style={{ animation: 'spin 1s linear infinite' }} size={15} />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 size={15} />
                      <span>Delete Topic</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
