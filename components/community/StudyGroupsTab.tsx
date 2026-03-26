'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  BookOpen,
  ChevronRight,
  Copy,
  KeyRound,
  Loader2,
  Lock,
  Globe,
  Plus,
  Users,
} from 'lucide-react'
import { studyGroupsApi, type StudyGroup } from '@/lib/api/studyGroupsApi'
import { initials } from '@/lib/community/utils'
import { GroupChatView } from '@/components/community/GroupChatView'

const SUBJECT_OPTIONS = [
  'Mathematics',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Government',
  'Literature',
  'Geography',
]

const COVER_OPTIONS = ['#5B4CF5', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#64748B']

type Props = {
  myUid: string
  showToast: (message: string) => void
}

export function StudyGroupsTab({ myUid, showToast }: Props) {
  const [listTab, setListTab] = useState<'my' | 'discover'>('my')
  const [subjectFilter, setSubjectFilter] = useState<string>('')
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [openGroup, setOpenGroup] = useState<StudyGroup | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createBusy, setCreateBusy] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [newVisibility, setNewVisibility] = useState<'public' | 'private'>('public')
  const [newCover, setNewCover] = useState(COVER_OPTIONS[0])
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [groupAfterCode, setGroupAfterCode] = useState<StudyGroup | null>(null)

  const [joinOpen, setJoinOpen] = useState(false)
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [joinBusy, setJoinBusy] = useState(false)

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true)
      const res = await studyGroupsApi.list({
        tab: listTab,
        ...(listTab === 'discover' && subjectFilter ? { subject: subjectFilter } : {}),
      })
      setGroups(Array.isArray(res.data) ? res.data : [])
    } catch {
      showToast('Failed to load study groups')
      setGroups([])
    } finally {
      setLoading(false)
    }
  }, [listTab, subjectFilter, showToast])

  useEffect(() => {
    void loadGroups()
  }, [loadGroups])

  const isMember = (g: StudyGroup) => g.members?.some((m) => m.userId === myUid)

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      showToast('Join code copied')
    } catch {
      showToast('Could not copy')
    }
  }

  const submitCreate = async () => {
    const name = newName.trim()
    if (!name) {
      showToast('Group name is required')
      return
    }
    setCreateBusy(true)
    try {
      const res = await studyGroupsApi.create({
        name,
        description: newDesc.trim() || undefined,
        subject: newSubject || undefined,
        visibility: newVisibility,
        coverColor: newCover,
      })
      const g = res.data as StudyGroup
      setCreatedCode(g.joinCode || null)
      setGroupAfterCode(g)
      showToast('Group created')
      await loadGroups()
      setCreateOpen(false)
      setNewName('')
      setNewDesc('')
      setNewSubject('')
      setNewVisibility('public')
      setNewCover(COVER_OPTIONS[0])
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      showToast(msg || 'Could not create group')
    } finally {
      setCreateBusy(false)
    }
  }

  const submitJoinCode = async () => {
    const code = joinCodeInput.trim().toUpperCase()
    if (code.length < 4) {
      showToast('Enter a valid join code')
      return
    }
    setJoinBusy(true)
    try {
      const res = await studyGroupsApi.join({ joinCode: code })
      const g = res.data as StudyGroup
      showToast('Joined group')
      setJoinOpen(false)
      setJoinCodeInput('')
      await loadGroups()
      setOpenGroup(g)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error
      showToast(msg || 'Could not join')
    } finally {
      setJoinBusy(false)
    }
  }

  if (openGroup) {
    return (
      <GroupChatView
        group={openGroup}
        myUid={myUid}
        member={isMember(openGroup)}
        onBack={() => {
          setOpenGroup(null)
          void loadGroups()
        }}
        showToast={showToast}
        onGroupUpdated={(g) => setOpenGroup(g)}
      />
    )
  }

  return (
    <div className="study-groups-tab space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Create group
          </button>
          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <KeyRound className="h-4 w-4 text-indigo-600" />
            Join with code
          </button>
        </div>

        <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${listTab === 'my' ? 'bg-white shadow dark:bg-slate-900' : 'text-slate-600 dark:text-slate-300'}`}
            onClick={() => setListTab('my')}
          >
            My groups
          </button>
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${listTab === 'discover' ? 'bg-white shadow dark:bg-slate-900' : 'text-slate-600 dark:text-slate-300'}`}
            onClick={() => setListTab('discover')}
          >
            Discover
          </button>
        </div>
      </div>

      {listTab === 'discover' && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Subject</label>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">All subjects</option>
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading groups…
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <Users className="mx-auto mb-3 h-10 w-10 text-indigo-500" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {listTab === 'my' ? 'You are not in any study groups yet. Create one or join with a code.' : 'No public groups match this filter.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <button
              key={g._id}
              type="button"
              onClick={() => setOpenGroup(g)}
              className="group-card text-left"
            >
              <div className="group-card-strip" style={{ background: g.coverColor || '#5B4CF5' }} />
              <div className="group-card-body">
                <div className="group-card-header">
                  <BookOpen className="h-[18px] w-[18px] shrink-0 text-indigo-600" />
                  <h3 className="group-card-name">{g.name}</h3>
                </div>
                <p className="group-card-meta">
                  {g.subject || 'General'}
                  <span aria-hidden> · </span>
                  <Users className="inline h-3.5 w-3.5" />
                  {g.membersCount ?? g.members?.length ?? 0} members
                </p>
                {g.description ? <p className="group-card-desc">{g.description}</p> : null}
                <div className="group-card-footer">
                  <div className="group-avatars">
                    {(g.members || []).slice(0, 5).map((m, i) => (
                      <div
                        key={`${m.userId}-${i}`}
                        className="group-avatar"
                        style={{
                          background: `hsl(${(i * 47 + g.name.length * 7) % 360} 55% 45%)`,
                        }}
                        title={m.name}
                      >
                        {initials(m.name || '?')}
                      </div>
                    ))}
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400" aria-hidden />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreateOpen(false)
          }}
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Create study group</h2>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={60}
              className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="Group name"
            />
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Description (optional)</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              maxLength={300}
              rows={3}
              className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">Subject</label>
            <select
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">General</option>
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Visibility</p>
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setNewVisibility('public')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                  newVisibility === 'public'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm dark:border-indigo-500 dark:bg-indigo-600 dark:text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Globe className="h-4 w-4 shrink-0 opacity-90" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setNewVisibility('private')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                  newVisibility === 'private'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm dark:border-indigo-500 dark:bg-indigo-600 dark:text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Lock className="h-4 w-4 shrink-0 opacity-90" />
                Private
              </button>
            </div>
            <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Cover colour</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {COVER_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Colour ${c}`}
                  onClick={() => setNewCover(c)}
                  className={`h-9 w-9 rounded-full border-2 ${newCover === c ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createBusy}
                onClick={() => void submitCreate()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {createBusy ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {createdCode && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCreatedCode(null)
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Your join code</h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Share this code so others can join.</p>
            <div className="group-join-code mb-4">
              <div className="group-join-code-value">
                {createdCode}
                <button type="button" className="copy-btn" onClick={() => void copyCode(createdCode)} aria-label="Copy join code">
                  <Copy className="h-5 w-5" />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (groupAfterCode) setOpenGroup(groupAfterCode)
                setGroupAfterCode(null)
                setCreatedCode(null)
              }}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {joinOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setJoinOpen(false)
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Join with code</h2>
            <input
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. XK29TF"
              className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-lg tracking-widest dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              maxLength={8}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setJoinOpen(false)} className="rounded-xl border px-4 py-2 text-sm font-semibold dark:border-slate-600">
                Cancel
              </button>
              <button
                type="button"
                disabled={joinBusy}
                onClick={() => void submitJoinCode()}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {joinBusy ? 'Joining…' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
