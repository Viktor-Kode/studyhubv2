'use client'

import ReactMarkdown from 'react-markdown'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Check,
  CheckCircle,
  CheckCircle2,
  Circle,
  Clock,
  Edit3,
  Eye,
  HelpCircle,
  Loader2,
  Pencil,
  Save,
  Send,
  Sparkles,
  Trash2,
  User,
  XCircle,
} from 'lucide-react'
import {
  studyGroupsApi,
  type GroupGoal,
  type GroupQuizDoc,
  type GroupTopic,
  type GroupWhiteboardDoc,
  type StudyGroup,
  type StudyGroupMember,
} from '@/lib/api/studyGroupsApi'

type ToolSubTab = 'goals' | 'topics' | 'quiz' | 'whiteboard'

type Props = {
  groupId: string
  group: StudyGroup
  myUid: string
  member: boolean
  showToast: (message: string) => void
  onPointsUpdated: () => void
}

function isAdmin(g: StudyGroup, uid: string) {
  const m = g.members?.find((x) => x.userId === uid)
  return m?.role === 'admin' || g.creatorId === uid
}

function formatDate(iso?: string | null) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return ''
  }
}

function memberName(members: StudyGroupMember[], uid: string) {
  return members.find((m) => m.userId === uid)?.name || uid
}

export function GroupStudyToolsPanel({ groupId, group, myUid, member, showToast, onPointsUpdated }: Props) {
  const [subTab, setSubTab] = useState<ToolSubTab>('goals')
  const [goals, setGoals] = useState<GroupGoal[]>([])
  const [topics, setTopics] = useState<GroupTopic[]>([])
  const [quizzes, setQuizzes] = useState<GroupQuizDoc[]>([])
  const [quizOrder, setQuizOrder] = useState<string[]>([])
  const [quizIndex, setQuizIndex] = useState(0)
  const [wb, setWb] = useState<GroupWhiteboardDoc | null>(null)
  const [wbDraft, setWbDraft] = useState('')
  const [wbSaving, setWbSaving] = useState(false)
  const [wbSavedAt, setWbSavedAt] = useState<string | null>(null)
  const [wbMode, setWbMode] = useState<'edit' | 'preview'>('edit')
  const wbAreaRef = useRef<HTMLTextAreaElement>(null)
  const wbTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wbVersionRef = useRef(0)
  const wbSavingRef = useRef(false)

  const admin = isAdmin(group, myUid)
  const members = group.members || []

  const refreshGoals = useCallback(async () => {
    if (!member) return
    try {
      const res = await studyGroupsApi.listGoals(groupId)
      setGoals(Array.isArray(res.data) ? res.data : [])
    } catch {
      /* ignore */
    }
  }, [groupId, member])

  const refreshTopics = useCallback(async () => {
    if (!member) return
    try {
      const res = await studyGroupsApi.listTopics(groupId)
      setTopics(Array.isArray(res.data) ? res.data : [])
    } catch {
      /* ignore */
    }
  }, [groupId, member])

  const refreshQuizzes = useCallback(async () => {
    if (!member) return
    try {
      const res = await studyGroupsApi.listQuizzes(groupId)
      const list = Array.isArray(res.data) ? res.data : []
      setQuizzes(list)
    } catch {
      /* ignore */
    }
  }, [groupId, member])

  const refreshWhiteboard = useCallback(async () => {
    if (!member) return
    try {
      const res = await studyGroupsApi.getWhiteboard(groupId)
      const data = res.data as GroupWhiteboardDoc
      setWb(data)
      wbVersionRef.current = data.version ?? 0
      setWbDraft(data.content ?? '')
    } catch {
      /* ignore */
    }
  }, [groupId, member])

  useEffect(() => {
    void refreshGoals()
    void refreshTopics()
    void refreshQuizzes()
    void refreshWhiteboard()
  }, [refreshGoals, refreshTopics, refreshQuizzes, refreshWhiteboard])

  useEffect(() => {
    if (!member) return
    const t = window.setInterval(() => {
      void refreshGoals()
      void refreshTopics()
      void refreshQuizzes()
    }, 15000)
    return () => window.clearInterval(t)
  }, [member, refreshGoals, refreshTopics, refreshQuizzes])

  useEffect(() => {
    const ids = quizzes.map((q) => q._id)
    setQuizOrder((prev) => {
      if (ids.length === 0) return []
      if (prev.length === 0) return [...ids].reverse()
      const same = prev.length === ids.length && prev.every((id) => ids.includes(id))
      if (same) return prev
      return [...ids].reverse()
    })
  }, [quizzes])

  useEffect(() => {
    setQuizIndex(0)
  }, [quizOrder.join(',')])

  const currentQuiz = useMemo(() => {
    const id = quizOrder[quizIndex]
    return quizzes.find((q) => q._id === id) || null
  }, [quizOrder, quizIndex, quizzes])

  const shuffleQuizzes = () => {
    const ids = [...quizOrder]
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[ids[i], ids[j]] = [ids[j], ids[i]]
    }
    setQuizOrder(ids)
    setQuizIndex(0)
  }

  const flushWhiteboard = useCallback(async () => {
    if (!member || wbSavingRef.current) return
    const content = wbDraft
    const version = wbVersionRef.current
    wbSavingRef.current = true
    setWbSaving(true)
    try {
      const res = await studyGroupsApi.updateWhiteboard(groupId, { content, version })
      const data = res.data as GroupWhiteboardDoc
      wbVersionRef.current = data.version
      setWb(data)
      setWbSavedAt(new Date().toISOString())
      onPointsUpdated()
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: GroupWhiteboardDoc & { error?: string } } }
      if (err.response?.status === 409 && err.response.data) {
        const d = err.response.data
        showToast('Someone else edited the whiteboard. Their version was loaded.')
        wbVersionRef.current = d.version ?? 0
        setWbDraft(d.content ?? '')
        setWb(d as GroupWhiteboardDoc)
      } else {
        const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
        showToast(msg || 'Could not save whiteboard')
      }
    } finally {
      wbSavingRef.current = false
      setWbSaving(false)
    }
  }, [groupId, member, onPointsUpdated, showToast, wbDraft])

  useEffect(() => {
    if (subTab !== 'whiteboard' || !member) return
    if (wbTimer.current) clearTimeout(wbTimer.current)
    wbTimer.current = setTimeout(() => {
      void flushWhiteboard()
    }, 2000)
    return () => {
      if (wbTimer.current) clearTimeout(wbTimer.current)
    }
  }, [wbDraft, subTab, member, flushWhiteboard])

  const wrapMd = (open: string, close: string) => {
    const ta = wbAreaRef.current
    if (!ta) return
    const s = ta.selectionStart
    const e = ta.selectionEnd
    const v = ta.value
    const sel = v.slice(s, e)
    const next = v.slice(0, s) + open + sel + close + v.slice(e)
    setWbDraft(next)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = s + open.length + sel.length
      ta.setSelectionRange(pos, pos)
    })
  }

  if (!member) {
    return (
      <div className="study-tools-guest rounded-xl border border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        Join this group to use study tools.
      </div>
    )
  }

  return (
    <div className="study-tools-root flex min-h-[320px] flex-col gap-3">
      <div className="study-tools-subtabs flex gap-1 overflow-x-auto pb-1">
        {(
          [
            ['goals', 'Goals'],
            ['topics', 'Topics'],
            ['quiz', 'Quiz'],
            ['whiteboard', 'Board'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
              subTab === id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="study-tools-body min-h-[280px] flex-1 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
        {subTab === 'goals' ? (
          <GoalsSection
            groupId={groupId}
            group={group}
            myUid={myUid}
            goals={goals}
            showToast={showToast}
            onPointsUpdated={onPointsUpdated}
            refreshGoals={refreshGoals}
          />
        ) : null}
        {subTab === 'topics' ? (
          <TopicsSection
            groupId={groupId}
            group={group}
            myUid={myUid}
            topics={topics}
            showToast={showToast}
            onPointsUpdated={onPointsUpdated}
            refreshTopics={refreshTopics}
          />
        ) : null}
        {subTab === 'quiz' ? (
          <QuizSection
            groupId={groupId}
            group={group}
            myUid={myUid}
            quizzes={quizzes}
            currentQuiz={currentQuiz}
            quizIndex={quizIndex}
            quizOrderLen={quizOrder.length}
            showToast={showToast}
            onPointsUpdated={onPointsUpdated}
            refreshQuizzes={refreshQuizzes}
            onNext={() => setQuizIndex((i) => (quizOrder.length ? (i + 1) % quizOrder.length : 0))}
            onShuffle={shuffleQuizzes}
          />
        ) : null}
        {subTab === 'whiteboard' ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  title="Bold"
                  aria-label="Bold"
                  className="rounded-lg border border-slate-200 p-2 text-xs font-bold dark:border-slate-600"
                  onClick={() => wrapMd('**', '**')}
                >
                  B
                </button>
                <button
                  type="button"
                  title="Italic"
                  aria-label="Italic"
                  className="rounded-lg border border-slate-200 p-2 text-xs italic dark:border-slate-600"
                  onClick={() => wrapMd('*', '*')}
                >
                  I
                </button>
                <button
                  type="button"
                  title="Heading"
                  aria-label="Heading"
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-600"
                  onClick={() => wrapMd('## ', '')}
                >
                  H
                </button>
                <button
                  type="button"
                  title="List"
                  aria-label="List"
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-600"
                  onClick={() => wrapMd('- ', '')}
                >
                  List
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`rounded-lg p-2 ${wbMode === 'edit' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'text-slate-500'}`}
                  title="Edit"
                  aria-label="Edit mode"
                  onClick={() => setWbMode('edit')}
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`rounded-lg p-2 ${wbMode === 'preview' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'text-slate-500'}`}
                  title="Preview"
                  aria-label="Preview mode"
                  onClick={() => setWbMode('preview')}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-indigo-600 disabled:opacity-50"
                  title="Save now"
                  aria-label="Save now"
                  disabled={wbSaving}
                  onClick={() => void flushWhiteboard()}
                >
                  {wbSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {wbMode === 'edit' ? (
              <textarea
                ref={wbAreaRef}
                value={wbDraft}
                onChange={(e) => setWbDraft(e.target.value)}
                rows={14}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 font-mono text-sm text-slate-900 outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Shared notes and solutions (Markdown supported)"
              />
            ) : (
              <div className="prose prose-sm max-h-[400px] max-w-none overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 dark:prose-invert dark:border-slate-700 dark:bg-slate-900">
                <ReactMarkdown>{wbDraft || '*Nothing yet*'}</ReactMarkdown>
              </div>
            )}
            <p className="text-xs text-slate-500">
              {wb?.lastEditedAt
                ? `Last edited ${formatDate(wb.lastEditedAt)} by ${memberName(members, wb.lastEditedBy || '') || 'unknown'}`
                : 'No edits yet'}
              {wbSavedAt ? ` · Saved` : ''}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function GoalsSection({
  groupId,
  group,
  myUid,
  goals,
  showToast,
  onPointsUpdated,
  refreshGoals,
}: {
  groupId: string
  group: StudyGroup
  myUid: string
  goals: GroupGoal[]
  showToast: (s: string) => void
  onPointsUpdated: () => void
  refreshGoals: () => Promise<void>
}) {
  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const admin = isAdmin(group, myUid)
  const members = group.members || []
  const done = goals.filter((g) => g.completed).length

  const create = async () => {
    const t = title.trim()
    if (!t) return
    setBusy(true)
    try {
      await studyGroupsApi.createGoal(groupId, {
        title: t,
        description: desc.trim() || undefined,
        dueDate: due ? new Date(due).toISOString() : undefined,
      })
      setModal(false)
      setTitle('')
      setDesc('')
      setDue('')
      await refreshGoals()
      onPointsUpdated()
    } catch (e: unknown) {
      showToast((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not create goal')
    } finally {
      setBusy(false)
    }
  }

  const toggleComplete = async (g: GroupGoal) => {
    try {
      await studyGroupsApi.updateGoal(groupId, g._id, { completed: !g.completed })
      await refreshGoals()
      onPointsUpdated()
    } catch (e: unknown) {
      showToast((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Update failed')
    }
  }

  const remove = async (g: GroupGoal) => {
    try {
      await studyGroupsApi.deleteGoal(groupId, g._id)
      await refreshGoals()
    } catch {
      showToast('Could not delete goal')
    }
  }

  const saveEdit = async () => {
    if (!editId) return
    setBusy(true)
    try {
      await studyGroupsApi.updateGoal(groupId, editId, {
        title: title.trim(),
        description: desc,
        dueDate: due ? new Date(due).toISOString() : null,
      })
      setEditId(null)
      setTitle('')
      setDesc('')
      setDue('')
      await refreshGoals()
    } catch {
      showToast('Could not update goal')
    } finally {
      setBusy(false)
    }
  }

  const openEdit = (g: GroupGoal) => {
    setEditId(g._id)
    setTitle(g.title)
    setDesc(g.description || '')
    setDue(g.dueDate ? String(g.dueDate).slice(0, 10) : '')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Progress: {done}/{goals.length} completed
        </p>
        <button
          type="button"
          onClick={() => {
            setModal(true)
            setEditId(null)
            setTitle('')
            setDesc('')
            setDue('')
          }}
          className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white sm:text-sm"
        >
          Create goal
        </button>
      </div>
      {goals.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No goals yet. Create one to keep your group on track.</p>
      ) : (
        <ul className="space-y-2">
          {goals.map((g) => {
            const canComplete = g.createdBy === myUid || admin
            const canEditDel = g.createdBy === myUid || admin
            return (
              <li
                key={g._id}
                className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/50"
              >
                <button
                  type="button"
                  disabled={!canComplete}
                  onClick={() => canComplete && void toggleComplete(g)}
                  className="mt-0.5 text-indigo-600 disabled:opacity-40"
                  title={g.completed ? 'Mark incomplete' : 'Mark complete'}
                  aria-label={g.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {g.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold text-slate-900 dark:text-white ${g.completed ? 'line-through opacity-70' : ''}`}>
                    {g.title}
                  </p>
                  {g.description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{g.description}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">
                    {g.dueDate ? `Due ${formatDate(g.dueDate)}` : 'No due date'}
                  </p>
                </div>
                {canEditDel ? (
                  <div className="flex shrink-0 gap-1">
                    <button type="button" title="Edit" aria-label="Edit goal" className="rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-800" onClick={() => openEdit(g)}>
                      <Pencil className="h-4 w-4 text-slate-600" />
                    </button>
                    <button type="button" title="Delete" aria-label="Delete goal" className="rounded-lg p-2 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => void remove(g)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}

      {modal && (
        <Modal title="New goal" onClose={() => !busy && setModal(false)}>
          <input
            className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            placeholder="Description (optional)"
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <input
            type="date"
            className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600" onClick={() => setModal(false)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white" disabled={busy || !title.trim()} onClick={() => void create()}>
              {busy ? 'Saving…' : 'Create'}
            </button>
          </div>
        </Modal>
      )}

      {editId && (
        <Modal title="Edit goal" onClose={() => !busy && setEditId(null)}>
          <input
            className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
          <input type="date" className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white" value={due} onChange={(e) => setDue(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setEditId(null)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white" disabled={busy} onClick={() => void saveEdit()}>
              Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function TopicsSection({
  groupId,
  group,
  myUid,
  topics,
  showToast,
  onPointsUpdated,
  refreshTopics,
}: {
  groupId: string
  group: StudyGroup
  myUid: string
  topics: GroupTopic[]
  showToast: (s: string) => void
  onPointsUpdated: () => void
  refreshTopics: () => Promise<void>
}) {
  const [modal, setModal] = useState(false)
  const [topicName, setTopicName] = useState('')
  const [assignee, setAssignee] = useState('')
  const [busy, setBusy] = useState(false)
  const admin = isAdmin(group, myUid)
  const members = group.members || []

  const statusClass = (s: GroupTopic['status']) => {
    if (s === 'completed') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
    if (s === 'in-progress') return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
    return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
  }

  const create = async () => {
    const t = topicName.trim()
    if (!t) return
    setBusy(true)
    try {
      await studyGroupsApi.createTopic(groupId, {
        topic: t,
        assignedTo: assignee || undefined,
      })
      setModal(false)
      setTopicName('')
      setAssignee('')
      await refreshTopics()
      onPointsUpdated()
    } catch (e: unknown) {
      showToast((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not add topic')
    } finally {
      setBusy(false)
    }
  }

  const saveNotes = async (doc: GroupTopic, notes: string) => {
    try {
      await studyGroupsApi.updateTopic(groupId, doc._id, { notes })
      await refreshTopics()
    } catch {
      showToast('Could not save notes')
    }
  }

  const updateStatus = async (doc: GroupTopic, status: GroupTopic['status']) => {
    try {
      await studyGroupsApi.updateTopic(groupId, doc._id, { status })
      await refreshTopics()
      onPointsUpdated()
    } catch (e: unknown) {
      showToast((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Update failed')
    }
  }

  const claim = async (doc: GroupTopic) => {
    try {
      await studyGroupsApi.updateTopic(groupId, doc._id, { claim: true })
      await refreshTopics()
    } catch (e: unknown) {
      showToast((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not claim')
    }
  }

  const remove = async (doc: GroupTopic) => {
    try {
      await studyGroupsApi.deleteTopic(groupId, doc._id)
      await refreshTopics()
    } catch {
      showToast('Could not delete')
    }
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setModal(true)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white sm:text-sm">
        Add topic
      </button>
      {topics.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No topics assigned yet.</p>
      ) : (
        <ul className="space-y-3">
          {topics.map((t) => {
            const isCreator = t.createdBy === myUid
            const isAssignee = t.assignedTo === myUid
            const canManage = isCreator || admin
            return (
              <li key={t._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{t.topic}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <User className="h-3.5 w-3.5" />
                      {t.assignedTo ? memberName(members, t.assignedTo) : 'Unassigned'}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusClass(t.status)}`}>{t.status.replace('-', ' ')}</span>
                </div>
                {!t.assignedTo ? (
                  <button type="button" className="mt-2 text-xs font-semibold text-indigo-600" onClick={() => void claim(t)}>
                    Claim this topic
                  </button>
                ) : null}
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  Added {formatDate(t.createdAt)}
                </div>
                <textarea
                  defaultValue={t.notes || ''}
                  onBlur={(e) => {
                    if (e.target.value !== (t.notes || '')) void saveNotes(t, e.target.value)
                  }}
                  rows={2}
                  className="mt-2 w-full rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  placeholder="Notes and key points"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {isAssignee || canManage ? (
                    <>
                      {t.status !== 'in-progress' ? (
                        <button type="button" className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200" onClick={() => void updateStatus(t, 'in-progress')}>
                          In progress
                        </button>
                      ) : null}
                      {t.status !== 'completed' ? (
                        <button type="button" className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" onClick={() => void updateStatus(t, 'completed')}>
                          <Check className="mr-1 inline h-3.5 w-3.5" />
                          Complete
                        </button>
                      ) : null}
                    </>
                  ) : null}
                  {canManage ? (
                    <button type="button" className="ml-auto rounded-lg p-1 text-red-600" title="Delete" aria-label="Delete topic" onClick={() => void remove(t)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {modal && (
        <Modal title="Add topic" onClose={() => !busy && setModal(false)}>
          <input
            className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            placeholder="Topic name"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
          />
          <select
            className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          >
            <option value="">Assign later</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setModal(false)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white" disabled={busy} onClick={() => void create()}>
              Add
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function QuizSection({
  groupId,
  group,
  myUid,
  quizzes,
  currentQuiz,
  quizIndex,
  quizOrderLen,
  showToast,
  onPointsUpdated,
  refreshQuizzes,
  onNext,
  onShuffle,
}: {
  groupId: string
  group: StudyGroup
  myUid: string
  quizzes: GroupQuizDoc[]
  currentQuiz: GroupQuizDoc | null
  quizIndex: number
  quizOrderLen: number
  showToast: (s: string) => void
  onPointsUpdated: () => void
  refreshQuizzes: () => Promise<void>
  onNext: () => void
  onShuffle: () => void
}) {
  const [modal, setModal] = useState(false)
  const [q, setQ] = useState('')
  const [opts, setOpts] = useState(['', '', '', ''])
  const [correct, setCorrect] = useState(0)
  const [expl, setExpl] = useState('')
  const [busy, setBusy] = useState(false)
  const [pick, setPick] = useState<number | null>(null)
  const membersCount = group.membersCount || group.members?.length || 0

  const myEntry = currentQuiz?.answeredBy?.find((a) => a.userId === myUid)

  useEffect(() => {
    setPick(null)
  }, [currentQuiz?._id])

  const submitAnswer = async (idx: number) => {
    if (!currentQuiz || myEntry) return
    setPick(idx)
    try {
      await studyGroupsApi.answerQuiz(groupId, currentQuiz._id, { answer: idx })
      await refreshQuizzes()
      onPointsUpdated()
    } catch (e: unknown) {
      showToast((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not submit')
    }
  }

  const create = async () => {
    const question = q.trim()
    const options = opts.map((o) => o.trim()).filter(Boolean)
    if (!question || options.length < 2) return
    setBusy(true)
    try {
      await studyGroupsApi.createQuiz(groupId, {
        question,
        options,
        correctOption: Math.min(correct, options.length - 1),
        explanation: expl.trim() || undefined,
      })
      setModal(false)
      setQ('')
      setOpts(['', '', '', ''])
      setCorrect(0)
      setExpl('')
      await refreshQuizzes()
      onPointsUpdated()
    } catch (e: unknown) {
      showToast((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not create question')
    } finally {
      setBusy(false)
    }
  }

  const genAi = async () => {
    setBusy(true)
    try {
      await studyGroupsApi.generateQuizAi(groupId)
      await refreshQuizzes()
      onPointsUpdated()
    } catch (e: unknown) {
      showToast((e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'AI quiz failed')
    } finally {
      setBusy(false)
    }
  }

  const answeredCount = currentQuiz?.answeredBy?.length ?? 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setModal(true)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white sm:text-sm">
          Create question
        </button>
        <button type="button" onClick={() => void genAi()} disabled={busy} className="flex items-center gap-1 rounded-lg border border-violet-300 px-3 py-2 text-xs font-semibold text-violet-700 dark:border-violet-700 dark:text-violet-300 sm:text-sm">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          AI question
        </button>
        <button type="button" onClick={onShuffle} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-600">
          Shuffle order
        </button>
      </div>

      {!currentQuiz ? (
        <p className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <HelpCircle className="h-5 w-5" />
          No quiz questions yet.
        </p>
      ) : (
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <p className="text-xs text-slate-500">
            Question {quizIndex + 1} of {quizOrderLen}
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{currentQuiz.question}</p>
          <p className="mt-2 text-xs text-slate-500">
            {answeredCount} of {membersCount} members answered
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {currentQuiz.options.map((opt, i) => {
              const wrong = myEntry && myEntry.answer === i && !myEntry.correct
              const right = myEntry && i === currentQuiz.correctOption
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!!myEntry}
                  onClick={() => void submitAnswer(i)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default ${
                    myEntry
                      ? right
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                        : wrong
                          ? 'border-red-400 bg-red-50 dark:bg-red-950/40'
                          : 'border-slate-200 opacity-60 dark:border-slate-600'
                      : pick === i
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                        : 'border-slate-200 hover:border-indigo-300 dark:border-slate-600'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
          {myEntry ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-600 dark:bg-slate-900">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                {myEntry.correct ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Correct
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    Incorrect
                  </>
                )}
              </div>
              {currentQuiz.explanation ? (
                <div className="prose prose-sm dark:prose-invert">
                  <ReactMarkdown>{currentQuiz.explanation}</ReactMarkdown>
                </div>
              ) : null}
            </div>
          ) : null}
          <button type="button" onClick={onNext} className="mt-4 flex items-center gap-1 text-sm font-semibold text-indigo-600">
            <Send className="h-4 w-4" />
            Next question
          </button>
        </div>
      )}

      {modal && (
        <Modal title="New quiz question" onClose={() => !busy && setModal(false)}>
          <textarea className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white" rows={3} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Question" />
          {opts.map((o, i) => (
            <input
              key={i}
              className="mb-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              placeholder={`Option ${i + 1}${i >= 2 ? ' (optional)' : ''}`}
              value={o}
              onChange={(e) => {
                const next = [...opts]
                next[i] = e.target.value
                setOpts(next)
              }}
            />
          ))}
          <label className="mb-2 mt-1 block text-xs text-slate-500">Correct option index (0 first)</label>
          <input type="number" min={0} max={3} className="mb-2 w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-900 dark:text-white" value={correct} onChange={(e) => setCorrect(Number(e.target.value) || 0)} />
          <textarea className="mb-3 w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white" rows={2} value={expl} onChange={(e) => setExpl(e.target.value)} placeholder="Explanation" />
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => setModal(false)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white" disabled={busy} onClick={() => void create()}>
              Save
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[1001] flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        {children}
      </div>
    </div>
  )
}
