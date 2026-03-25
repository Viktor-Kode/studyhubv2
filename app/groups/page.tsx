'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import ProtectedRoute from '@/components/ProtectedRoute'
import { groupsApi, type Group } from '@/lib/api/groupsApi'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users } from 'lucide-react'

const SUBJECTS = [
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

function groupPrivacyLabel(isPrivate: boolean) {
  return isPrivate ? 'Private' : 'Public'
}

export default function GroupsDashboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    subject: SUBJECTS[0] || 'Mathematics',
    isPrivate: true,
  })
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await groupsApi.getMyGroups()
      setGroups((res.data?.groups as Group[]) || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const canCreate = useMemo(() => !!form.name.trim() && !!form.subject.trim(), [form.name, form.subject])

  const handleCreate = useCallback(async () => {
    if (!canCreate) return
    try {
      setSubmitting(true)
      const res = await groupsApi.createGroup({
        name: form.name.trim(),
        description: form.description.trim(),
        subject: form.subject,
        isPrivate: form.isPrivate,
        settings: { allowMemberPosts: true, requireApproval: false },
      })
      const groupId = res.data?.groupId || res.data?.group?._id
      if (groupId) {
        setCreateOpen(false)
        router.push(`/groups/${groupId}`)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to create group')
    } finally {
      setSubmitting(false)
    }
  }, [canCreate, form.description, form.isPrivate, form.name, form.subject, router])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 pb-16 pt-6 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Study Groups</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Collaborate with classmates in focused spaces.</p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create group
            </Button>
          </header>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              Loading groups…
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <Users className="mx-auto mb-3 h-8 w-8 text-indigo-600" />
              <p className="text-sm text-slate-600 dark:text-slate-300">You are not in any groups yet.</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Create one to start posting, chatting, and sharing resources.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((g) => (
                <button
                  key={g._id}
                  type="button"
                  onClick={() => router.push(`/groups/${g._id}`)}
                  className="text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md hover:scale-[1.01] dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-slate-900 dark:text-white">{g.name}</h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{g.subject}</p>
                    </div>
                    <div className="shrink-0">
                      <Badge variant={g.isPrivate ? 'outline' : 'secondary'}>{groupPrivacyLabel(!!g.isPrivate)}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {g.membersCount ?? 0} members
                    </span>
                    <span>
                      Last active{' '}
                      {g.lastActiveAt ? formatDistanceToNow(new Date(g.lastActiveAt), { addSuffix: true }) : '—'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogTitle className="mb-2">Create a group</DialogTitle>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Name</label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. WAEC Physics Squad" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="What will you study together?"
                  className="w-full min-h-20 rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Private group</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Invite code required to join.</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.isPrivate}
                  onChange={(e) => setForm((p) => ({ ...p, isPrivate: e.target.checked }))}
                  className="h-5 w-5 rounded border border-slate-300 bg-white text-indigo-600 accent-indigo-600"
                  aria-label="Private group"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={!canCreate || submitting} onClick={() => void handleCreate()}>
                  {submitting ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}

