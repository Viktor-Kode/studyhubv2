'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { type LearningNode, type StudyPathTopic } from '@/lib/data/studyPath'
import { getStudyPath, getActiveStudyPath, getUserStudyPaths, deleteStudyPath, getNodeStatuses, prepareStudyPathNode, retryStudyPathNode } from '@/src/services/api'
import CreateStudyPathModal from '@/components/dashboard/CreateStudyPathModal'
import { ArrowLeft, ChevronDown, Check, LockKeyhole, Play, MoreHorizontal, ArrowRight, Trophy, Upload, X, Clock3, Zap, Loader2, RotateCw } from 'lucide-react'
import '../../study-path.css'
import '../map.css'

function minutesFor(node: LearningNode): number {
  const match = String(node.duration || '').match(/\d+/)
  return match ? Number(match[0]) : 0
}

function mapStatus(status: LearningNode['status']): 'active' | 'locked' | 'done' {
  return status === 'completed' ? 'done' : status
}

function LoadingPath() {
  return (
    <main className="study-map-path study-map-loading" aria-label="Loading study map">
      {[0, 1, 2, 3, 4].map((item) => (
        <div className="study-map-skeleton" key={item}>
          <span className="study-map-skeleton-circle" />
          <span className="study-map-skeleton-card" />
        </div>
      ))}
    </main>
  )
}

function EmptyPath({ onUpload }: { onUpload: () => void }) {
  return (
    <main className="study-map-path study-map-empty">
      <div className="study-map-empty-card">
        <h2>No study nodes yet</h2>
        <p>Upload material to create your study map.</p>
        <button className="study-map-start" onClick={onUpload}>
          <Upload size={17} /> Upload material
        </button>
      </div>
    </main>
  )
}

function MapNode({
  node,
  status,
  side,
  onStart,
  onPreview,
  onRetry,
  elementRef,
}: {
  node: LearningNode
  status: 'active' | 'locked' | 'done'
  side: 'right' | 'left'
  onStart: (id: number) => void
  onPreview: (node: LearningNode) => void
  onRetry: (id: number) => void
  elementRef: (element: HTMLElement | null) => void
}) {
  const contentStatus = node.contentStatus || 'ready'

  if (contentStatus === 'generating') {
    return (
      <section ref={elementRef} className={`study-map-node generating ${side}`} aria-label={`${node.title}, generating`}>
        <span className="study-map-circle" aria-hidden="true">
          <Loader2 size={22} className="animate-spin" />
        </span>
        <span className="study-map-card">
          <span className="study-map-tag generating">
            <Loader2 size={12} className="animate-spin" /> PREPARING...
          </span>
          <span className="study-map-node-title">{node.title}</span>
          <span className="study-map-meta">AI generating lesson & quiz...</span>
        </span>
      </section>
    )
  }

  if (contentStatus === 'failed') {
    return (
      <section ref={elementRef} className={`study-map-node locked ${side}`} aria-label={`${node.title}, failed`}>
        <span className="study-map-circle" aria-hidden="true" style={{ borderColor: 'var(--map-danger)', color: 'var(--map-danger)' }}>
          <RotateCw size={20} />
        </span>
        <span className="study-map-card">
          <span className="study-map-tag failed">FAILED</span>
          <span className="study-map-node-title">{node.title}</span>
          <span className="study-map-meta">Could not generate lesson</span>
          <button className="study-map-retry-btn" type="button" onClick={() => onRetry(node.id)}>
            <RotateCw size={14} /> Retry
          </button>
        </span>
      </section>
    )
  }

  const isPending = contentStatus === 'pending'

  const content = (
    <>
      <span className="study-map-circle" aria-hidden="true">
        {status === 'active' ? <Play size={24} fill="currentColor" strokeWidth={1.5} /> : status === 'done' ? <Check size={25} strokeWidth={3} /> : <LockKeyhole size={20} strokeWidth={2} />}
      </span>
      <span className="study-map-card">
        {status === 'active' && <span className="study-map-tag">{isPending ? 'READY TO PREPARE' : 'UP NEXT'}</span>}
        <span className="study-map-node-title">{node.title}</span>
        <span className="study-map-meta">
          {status === 'active' ? `${minutesFor(node)} min · +${node.xp ?? 0} XP` : `${minutesFor(node)} min`}
        </span>
        {status === 'active' && (
          <button className="study-map-start" type="button" onClick={() => onStart(node.id)}>
            START <ArrowRight size={17} strokeWidth={3} />
          </button>
        )}
      </span>
    </>
  )

  if (status === 'locked' || isPending) {
    return <section ref={elementRef} className={`study-map-node locked ${side}`} aria-label={`${node.title}, locked`}>{content}</section>
  }
  if (status === 'done') {
    return (
      <button ref={elementRef as (element: HTMLButtonElement | null) => void} type="button" className={`study-map-node done ${side}`} onClick={() => onPreview(node)} aria-label={`Preview ${node.title}`}>
        {content}
      </button>
    )
  }
  return (
    <section ref={elementRef} className={`study-map-node active ${side}`} aria-label={`${node.title}, up next`}>
      <span className="study-map-circle" aria-hidden="true"><Play size={24} fill="currentColor" strokeWidth={1.5} /></span>
      <span className="study-map-card study-map-card-clickable">
        <button className="study-map-card-open" type="button" aria-label={`Preview ${node.title}`} onClick={() => onPreview(node)} />
        <span className="study-map-tag">UP NEXT</span>
        <span className="study-map-node-title">{node.title}</span>
        <span className="study-map-meta">{minutesFor(node)} min · +{node.xp ?? 0} XP</span>
        <button className="study-map-start" type="button" onClick={(event) => { event.stopPropagation(); onStart(node.id) }}>
          START <ArrowRight size={17} strokeWidth={3} />
        </button>
      </span>
    </section>
  )
}

function StudyMapContent() {
  const params = useParams()
  const router = useRouter()
  const rawTopicId = params?.topicId as string | undefined
  const topicId = rawTopicId && rawTopicId !== 'default' ? rawTopicId : ''
  const [topic, setTopic] = useState<StudyPathTopic | null>(null)
  const [userTopics, setUserTopics] = useState<StudyPathTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [topicMenuOpen, setTopicMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [previewNode, setPreviewNode] = useState<LearningNode | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const nodeElements = useRef(new Map<number, HTMLElement>())
  const challengeElement = useRef<HTMLElement | null>(null)
  const switcherRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  // Progressive generation: track node content statuses
  const [nodeContentStatuses, setNodeContentStatuses] = useState<Record<number, { contentStatus: string; generationError?: string | null }>>({})
  const [retryingNodeIds, setRetryingNodeIds] = useState<Set<number>>(new Set())
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const allReadyRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const load = async () => {
      try {
        const result = topicId ? await getStudyPath(topicId) : await getActiveStudyPath()
        let resolved = result as StudyPathTopic | null
        if (!resolved && typeof window !== 'undefined') {
          const active = localStorage.getItem('studyhelp_active_topic')
          const saved = localStorage.getItem('studyhelp_saved_topics')
          const choices: StudyPathTopic[] = [
            ...(active ? [JSON.parse(active) as StudyPathTopic] : []),
            ...(saved ? JSON.parse(saved) as StudyPathTopic[] : []),
          ]
          resolved = choices.find((item) => item?.topicId === topicId || (!topicId && item?.topicId)) || resolved
        }
        if (!cancelled) {
          setTopic(resolved)
          if (resolved?.topicId && typeof window !== 'undefined') {
            localStorage.setItem('studyhelp_active_topic', JSON.stringify(resolved))
          }
        }
      } catch {
        if (!cancelled) setTopic(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [topicId])

  useEffect(() => {
    let cancelled = false
    const loadTopics = async () => {
      const topics = new Map<string, StudyPathTopic>()
      try {
        const active = localStorage.getItem('studyhelp_active_topic')
        const saved = localStorage.getItem('studyhelp_saved_topics')
        if (active) {
          const item = JSON.parse(active) as StudyPathTopic
          if (item.topicId) topics.set(item.topicId, item)
        }
        if (saved) {
          const items = JSON.parse(saved) as StudyPathTopic[]
          if (Array.isArray(items)) items.forEach((item) => { if (item?.topicId) topics.set(item.topicId, item) })
        }
      } catch { /* ignore malformed local cache */ }
      try {
        const remote = await getUserStudyPaths()
        if (Array.isArray(remote)) remote.forEach((item: StudyPathTopic) => { if (item?.topicId) topics.set(item.topicId, item) })
      } catch { /* local topics remain available */ }
      if (!cancelled) setUserTopics(Array.from(topics.values()))
    }
    void loadTopics()
    return () => { cancelled = true }
  }, [topicId, topic?.topicId])

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      const target = event.target as Node
      if (!switcherRef.current?.contains(target)) setTopicMenuOpen(false)
      if (!menuRef.current?.contains(target)) setMoreMenuOpen(false)
    }
    document.addEventListener('mousedown', closeMenus)
    return () => document.removeEventListener('mousedown', closeMenus)
  }, [])

  useEffect(() => {
    if (!previewNode) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewNode(null)
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [previewNode])

  const nodes = topic?.nodes || []
  const completedCount = useMemo(() => nodes.filter((node) => node.status === 'completed').length, [nodes])
  const isChallengeCompleted = Boolean(topic?.challenge?.status === 'completed' || topic?.challenge?.passed || topic?.completed)
  const totalCount = nodes.length + 1 // Challenge is part of the displayed map total.
  const displayCompletedCount = completedCount + (isChallengeCompleted ? 1 : 0)
  const allDone = nodes.length > 0 && completedCount === nodes.length
  const activeNode = nodes.find((node) => node.status === 'active')
  const maxXp = topic?.challenge?.maxXp || 50
  const bestScore = topic?.challenge?.bestScore ?? 0
  const bestXp = topic?.challenge?.bestXp ?? 0
  const setNodeElement = useCallback((id: number, element: HTMLElement | null) => {
    if (element) nodeElements.current.set(id, element)
    else nodeElements.current.delete(id)
  }, [])

  useEffect(() => {
    if (loading) return
    const target = activeNode ? nodeElements.current.get(activeNode.id) : allDone ? challengeElement.current : null
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [loading, topic, activeNode, allDone])

  // Progressive generation polling – runs while any node is pending/generating
  const startPolling = useCallback((id: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      if (allReadyRef.current) { clearInterval(pollingRef.current!); pollingRef.current = null; return }
      try {
        const statusData = await getNodeStatuses(id)
        if (!statusData) return
        const map: Record<number, { contentStatus: string; generationError?: string | null }> = {}
        for (const n of statusData.nodes) map[n.id] = { contentStatus: n.contentStatus, generationError: n.generationError }
        setNodeContentStatuses(map)
        if (statusData.allReady) {
          allReadyRef.current = true
          clearInterval(pollingRef.current!); pollingRef.current = null
          const fresh = await getStudyPath(id)
          if (fresh) { setTopic(fresh); if (typeof window !== 'undefined') localStorage.setItem('studyhelp_active_topic', JSON.stringify(fresh)) }
        }
      } catch { /* ignore transient polling errors */ }
    }, 3000)
  }, [])

  useEffect(() => {
    if (!topicId || loading || !topic) return
    const hasPending = topic.nodes.some((n) => n.contentStatus === 'pending' || n.contentStatus === 'generating')
    if (hasPending) { allReadyRef.current = false; startPolling(topicId) }
    else allReadyRef.current = true
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [topicId, loading, topic, startPolling])

  const openLesson = useCallback(async (nodeId: number) => {
    if (!topic?.topicId) { router.push(`/dashboard/student/lesson/${nodeId}`); return }
    const node = topic.nodes.find((n) => n.id === nodeId)
    const cs = nodeContentStatuses[nodeId]?.contentStatus || node?.contentStatus || 'ready'
    if (cs === 'generating') return // still generating, ignore clicks
    if (cs === 'pending' || cs === 'failed') {
      // Priority prepare this node first
      try {
        const preparedNode = await prepareStudyPathNode(topic.topicId, nodeId, { bufferNext: true })
        if (preparedNode) {
          // The lesson reads its initial content from localStorage. Keep that
          // cache in sync with the freshly generated node before navigating.
          const preparedTopic = {
            ...topic,
            nodes: topic.nodes.map((item) => item.id === nodeId ? { ...item, ...preparedNode } : item),
          }
          setTopic(preparedTopic)
          setNodeContentStatuses((previous) => ({
            ...previous,
            [nodeId]: { contentStatus: preparedNode.contentStatus || 'ready' },
          }))
          localStorage.setItem('studyhelp_active_topic', JSON.stringify(preparedTopic))
        }
      } catch { /* fall through */ }
    }
    router.push(`/dashboard/student/lesson/${nodeId}`)
  }, [topic, nodeContentStatuses, router])

  const handleRetryNode = useCallback(async (nodeId: number) => {
    if (!topic?.topicId) return
    setRetryingNodeIds((prev) => new Set(prev).add(nodeId))
    setNodeContentStatuses((prev) => ({ ...prev, [nodeId]: { contentStatus: 'generating' } }))
    try {
      await retryStudyPathNode(topic.topicId, nodeId)
      allReadyRef.current = false
      startPolling(topic.topicId)
    } catch { /* polling will pick up failed state */ }
    setRetryingNodeIds((prev) => { const next = new Set(prev); next.delete(nodeId); return next })
  }, [topic, startPolling])

  const deleteTopic = async () => {
    if (!topic?.topicId || !window.confirm('Delete this topic and all its progress? This cannot be undone.')) return
    const deletingId = topic.topicId
    try { await deleteStudyPath(deletingId) } catch { /* clear local copy even if the backend is unavailable */ }
    try {
      const active = localStorage.getItem('studyhelp_active_topic')
      if (active && (JSON.parse(active) as StudyPathTopic).topicId === deletingId) localStorage.removeItem('studyhelp_active_topic')
      const saved = localStorage.getItem('studyhelp_saved_topics')
      if (saved) {
        const remaining = (JSON.parse(saved) as StudyPathTopic[]).filter((item) => item.topicId !== deletingId)
        localStorage.setItem('studyhelp_saved_topics', JSON.stringify(remaining))
      }
    } catch { /* ignore malformed local cache */ }
    const remainingTopics = userTopics.filter((item) => item.topicId !== deletingId)
    setUserTopics(remainingTopics)
    if (remainingTopics[0]) router.push(`/dashboard/student/map/${encodeURIComponent(remainingTopics[0].topicId)}`)
    else router.push('/dashboard/student')
  }

  const selectTopic = (item: StudyPathTopic) => {
    setTopicMenuOpen(false)
    router.push(`/dashboard/student/map/${encodeURIComponent(item.topicId)}`)
  }

  return (
    <ProtectedRoute allowedRoles={['student', 'teacher']}>
      <div className="study-map-shell">
        <div className="study-map-frame">
          <nav className="study-map-bar" aria-label="Study map navigation">
            <button className="study-map-icon-button" aria-label="Back to dashboard" onClick={() => router.push('/dashboard/student')}>
              <ArrowLeft size={19} strokeWidth={2.4} />
            </button>
            <div className="study-map-switcher" ref={switcherRef}>
              <button className="study-map-topic-select" aria-label="Switch topic" aria-expanded={topicMenuOpen} onClick={() => setTopicMenuOpen((open) => !open)}>
                <span>{topic?.courseCode || topic?.title || 'Study topic'}</span><ChevronDown size={16} strokeWidth={2.5} />
              </button>
              {topicMenuOpen && (
                <div className="study-map-topic-menu" role="menu">
                  {userTopics.length ? userTopics.map((item) => (
                    <button key={item.topicId} role="menuitem" className={item.topicId === topic?.topicId ? 'selected' : ''} onClick={() => selectTopic(item)}>
                      <span>{item.courseCode || item.title}</span><small>{item.title}</small>
                    </button>
                  )) : <p className="study-map-menu-empty">No other topics</p>}
                </div>
              )}
            </div>
            <div className={`study-map-menu ${moreMenuOpen ? 'open' : ''}`} ref={menuRef}>
              <button className="study-map-icon-button" aria-label="More options" aria-expanded={moreMenuOpen} onClick={() => setMoreMenuOpen((open) => !open)}>
                <MoreHorizontal size={20} strokeWidth={2.5} />
              </button>
              {moreMenuOpen && <div className="study-map-menu-list"><button className="danger" onClick={() => { setMoreMenuOpen(false); void deleteTopic() }}>Delete topic</button></div>}
            </div>
          </nav>

          <header className="study-map-head">
            {topic?.courseCode && <p className="study-map-course">{topic.courseCode}</p>}
            <h1>{topic?.title || 'Study map'}</h1>
            <div className="study-map-progress" aria-label={`${displayCompletedCount} of ${totalCount} complete`}>
              <span className="study-map-track">
                <span className="study-map-fill" style={{ width: `${totalCount ? (displayCompletedCount / totalCount) * 100 : 0}%` }} />
              </span>
              <b>{displayCompletedCount} / {totalCount}</b>
            </div>
          </header>

          {loading ? <LoadingPath /> : !topic || nodes.length === 0 ? (
            <EmptyPath onUpload={() => setShowUploadModal(true)} />
          ) : (
            <main className="study-map-path">
              {nodes.map((node, index) => {
                const previousUnit = index > 0 ? nodes[index - 1].unit?.trim() : undefined
                const currentUnit = node.unit?.trim()
                const showUnit = Boolean(currentUnit && currentUnit !== previousUnit)
                const status = mapStatus(node.status)
                // Merge live poll status over the DB value for real-time updates
                const liveStatus = nodeContentStatuses[node.id]
                const mergedNode: LearningNode = liveStatus
                  ? { ...node, contentStatus: liveStatus.contentStatus as LearningNode['contentStatus'], generationError: liveStatus.generationError ?? undefined }
                  : node
                return (
                  <div key={node.id} className="study-map-entry">
                    {showUnit && <div className="study-map-unit">{currentUnit}</div>}
                    <MapNode
                      node={mergedNode}
                      status={status}
                      side={index % 2 === 0 ? 'right' : 'left'}
                      onStart={openLesson}
                      onPreview={setPreviewNode}
                      onRetry={handleRetryNode}
                      elementRef={(element) => setNodeElement(node.id, element)}
                    />
                  </div>
                )
              })}
              {isChallengeCompleted ? (
                <button
                  ref={(element) => { challengeElement.current = element }}
                  type="button"
                  className="study-map-node challenge completed available"
                  aria-label={`Unit challenge passed, ${bestScore} of 10, ${bestXp} XP`}
                  onClick={() => router.push(`/dashboard/student/map/${encodeURIComponent(topic.topicId)}/challenge`)}
                >
                  <span className="study-map-circle" aria-hidden="true"><Trophy size={24} strokeWidth={2.2} /></span>
                  <span className="study-map-card">
                    <span className="study-map-node-title">Unit challenge</span>
                    <span className="study-map-meta">Passed · {bestScore}/10 · {bestXp} XP</span>
                  </span>
                </button>
              ) : allDone ? (
                <button
                  ref={(element) => { challengeElement.current = element }}
                  type="button"
                  className="study-map-node challenge available active"
                  aria-label="Start the 10 question unit challenge"
                  onClick={() => router.push(`/dashboard/student/map/${encodeURIComponent(topic.topicId)}/challenge`)}
                >
                  <span className="study-map-circle" aria-hidden="true"><Trophy size={24} strokeWidth={2.2} /></span>
                  <span className="study-map-card">
                    <span className="study-map-node-title">Unit challenge</span>
                    <span className="study-map-meta">10 questions · overview · up to {maxXp} XP</span>
                  </span>
                </button>
              ) : (
                <section
                  ref={(element) => { challengeElement.current = element }}
                  className="study-map-node challenge locked"
                  aria-label="Unit challenge, locked until all lessons are complete"
                >
                  <span className="study-map-circle" aria-hidden="true"><LockKeyhole size={20} strokeWidth={2} /></span>
                  <span className="study-map-card">
                    <span className="study-map-node-title">Unit challenge</span>
                    <span className="study-map-meta">Complete all nodes first</span>
                  </span>
                </section>
              )}
            </main>
          )}
          {previewNode && (
            <div className="study-map-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewNode(null) }}>
              <section className="study-map-preview" role="dialog" aria-modal="true" aria-labelledby="study-map-preview-title">
                <button type="button" className="study-map-preview-close" aria-label="Close lesson preview" onClick={() => setPreviewNode(null)}><X size={19} /></button>
                <p className={`study-map-preview-eyebrow ${previewNode.status === 'completed' ? 'completed' : ''}`}>{previewNode.status === 'completed' ? 'COMPLETED LESSON' : 'UP NEXT'}</p>
                <h2 id="study-map-preview-title">{previewNode.title}</h2>
                <div className="study-map-preview-meta"><span><Clock3 size={15} />{minutesFor(previewNode)} min</span><span><Zap size={15} />+{previewNode.xp ?? 0} XP</span></div>
                {previewNode.summary?.trim() && <p className="study-map-preview-summary">{previewNode.summary.trim()}</p>}
                <div className="study-map-preview-actions">
                  <button className="study-map-preview-primary" onClick={() => openLesson(previewNode.id)}><Play size={16} fill="currentColor" /> Start Learning</button>
                  {previewNode.status === 'completed' && <button className="study-map-preview-secondary" onClick={() => router.push(`/blurting/${previewNode.id}`)}>Active Recall <ArrowRight size={16} /></button>}
                </div>
              </section>
            </div>
          )}
          {showUploadModal && <CreateStudyPathModal onClose={() => setShowUploadModal(false)} />}
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function StudyPathMapPage() {
  return <StudyMapContent />
}
