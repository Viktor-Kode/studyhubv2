'use client'

import { useCallback, useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import ProgressWidget from '@/components/ProgressWidget'
import { useRouter } from 'next/navigation'
import { useProgress } from '@/hooks/useProgress'
import { sharedNotesApi, type SharedNote } from '@/lib/api/sharedNotesApi'
import { toast } from 'react-hot-toast'
import { FiLoader, FiPlus, FiTrash2, FiEdit2, FiShare2, FiGlobe, FiLock } from 'react-icons/fi'

export default function SharedNotesPage() {
  const router = useRouter()
  const { refetch } = useProgress()
  const [tab, setTab] = useState<'mine' | 'shared'>('mine')
  const [notes, setNotes] = useState<SharedNote[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ subject: '', search: '' })
  const [modal, setModal] = useState<'create' | 'edit' | 'share' | null>(null)
  const [editing, setEditing] = useState<SharedNote | null>(null)
  const [form, setForm] = useState({ title: '', content: '', subject: '', tags: '', isPublic: false })
  const [shareEmail, setShareEmail] = useState('')
  const [userQuery, setUserQuery] = useState('')
  const [userHits, setUserHits] = useState<{ id: string; name: string; email: string }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'mine') {
        const { data } = await sharedNotesApi.mine()
        setNotes(data.notes || [])
      } else {
        const { data } = await sharedNotesApi.withMe({
          subject: filter.subject || undefined,
          search: filter.search || undefined,
        })
        setNotes(data.notes || [])
      }
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [tab, filter.subject, filter.search])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => {
      if (modal !== 'share' || userQuery.trim().length < 2) {
        setUserHits([])
        return
      }
      void sharedNotesApi.searchUsers(userQuery.trim()).then((r) => setUserHits(r.data.users || [])).catch(() => setUserHits([]))
    }, 300)
    return () => clearTimeout(t)
  }, [userQuery, modal])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', content: '', subject: '', tags: '', isPublic: false })
    setModal('create')
  }

  const openEdit = (n: SharedNote) => {
    setEditing(n)
    setForm({
      title: n.title,
      content: n.content,
      subject: n.subject || '',
      tags: (n.tags || []).join(', '),
      isPublic: n.isPublic,
    })
    setModal('edit')
  }

  const saveNote = async () => {
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (modal === 'create') {
        await sharedNotesApi.create({
          title: form.title,
          content: form.content,
          subject: form.subject,
          tags,
          isPublic: form.isPublic,
        })
        toast.success('Note created')
      } else if (editing) {
        await sharedNotesApi.update(editing._id, {
          title: form.title,
          content: form.content,
          subject: form.subject,
          tags,
          isPublic: form.isPublic,
        })
        toast.success('Note updated')
      }
      setModal(null)
      void load()
      await refetch()
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this note?')) return
    try {
      await sharedNotesApi.remove(id)
      toast.success('Deleted')
      void load()
    } catch {
      toast.error('Delete failed')
    }
  }

  const makePublic = async (n: SharedNote) => {
    try {
      await sharedNotesApi.setPublic(n._id, !n.isPublic)
      toast.success(n.isPublic ? 'Note is now private' : 'Note is public')
      void load()
      await refetch()
    } catch {
      toast.error('Update failed')
    }
  }

  const like = async (n: SharedNote) => {
    try {
      await sharedNotesApi.like(n._id)
      void load()
    } catch {
      toast.error('Like failed')
    }
  }

  const shareByEmail = async (n: SharedNote) => {
    try {
      await sharedNotesApi.shareWith(n._id, { email: shareEmail.trim() })
      toast.success('Shared')
      setModal(null)
      setShareEmail('')
      void load()
    } catch {
      toast.error('Share failed — check email')
    }
  }

  const shareWithUserId = async (n: SharedNote, userId: string) => {
    try {
      await sharedNotesApi.shareWith(n._id, { userId })
      toast.success('Shared')
      setModal(null)
      void load()
    } catch {
      toast.error('Share failed')
    }
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <BackButton href="/dashboard/student/study-groups" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Shared notes</h1>
          </div>
          <div className="hidden sm:block shrink-0">
            <ProgressWidget onViewFull={() => router.push('/community')} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
          <button
            type="button"
            onClick={() => setTab('mine')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'mine' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            My notes
          </button>
          <button
            type="button"
            onClick={() => setTab('shared')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === 'shared' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
          >
            Shared with me
          </button>
          {tab === 'mine' && (
            <button type="button" onClick={openCreate} className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-md">
              <FiPlus /> New note
            </button>
          )}
        </div>

        {tab === 'shared' && (
          <div className="flex flex-wrap gap-2">
            <input
              placeholder="Subject"
              value={filter.subject}
              onChange={(e) => setFilter((f) => ({ ...f, subject: e.target.value }))}
              className="flex-1 min-w-[120px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
            <input
              placeholder="Search"
              value={filter.search}
              onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
              className="flex-[2] min-w-[160px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16 text-gray-500 gap-2">
            <FiLoader className="animate-spin text-xl" /> Loading…
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((n) => (
              <div
                key={n._id}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 p-4 shadow-sm flex flex-col gap-2 min-h-[140px]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900 dark:text-white line-clamp-2">{n.title}</h2>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${n.isPublic ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {n.isPublic ? <FiGlobe className="text-xs" /> : <FiLock className="text-xs" />}
                    {n.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                {n.subject ? <p className="text-xs text-indigo-600 dark:text-indigo-400">{n.subject}</p> : null}
                {n.tags?.length ? <p className="text-xs text-gray-500">#{(n.tags || []).join(' #')}</p> : null}
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 flex-1">{n.content}</p>
                <div className="text-xs text-gray-400 flex gap-3">
                  <span>❤️ {n.likeCount ?? (n.likes || []).length}</span>
                  <span>👁 {n.viewCount ?? 0}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {tab === 'shared' && (
                    <button type="button" onClick={() => void like(n)} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 font-medium">
                      {n.likedByMe ? 'Unlike' : 'Like'}
                    </button>
                  )}
                  {tab === 'mine' && (
                    <>
                      <button type="button" onClick={() => openEdit(n)} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 inline-flex items-center gap-1"><FiEdit2 /> Edit</button>
                      <button type="button" onClick={() => { setEditing(n); setModal('share'); setUserQuery(''); setUserHits([]) }} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 inline-flex items-center gap-1"><FiShare2 /> Share</button>
                      <button type="button" onClick={() => void makePublic(n)} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 inline-flex items-center gap-1"><FiGlobe /> {n.isPublic ? 'Private' : 'Public'}</button>
                      <button type="button" onClick={() => void remove(n._id)} className="text-sm px-3 py-1.5 rounded-lg text-red-600 bg-red-50 dark:bg-red-950/40 inline-flex items-center gap-1"><FiTrash2 /> Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && notes.length === 0 && (
          <p className="text-center text-gray-500 py-12">No notes yet. {tab === 'mine' ? 'Create your first one!' : 'Nothing shared with you yet.'}</p>
        )}

        {modal === 'create' || modal === 'edit' ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-lg">{modal === 'create' ? 'New note' : 'Edit note'}</h3>
              <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-950" />
              <textarea placeholder="Content" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={6} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-950" />
              <input placeholder="Subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-950" />
              <input placeholder="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-950" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))} />
                Public (anyone with link can discover in search)
              </label>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600">Cancel</button>
                <button type="button" onClick={() => void saveNote()} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold">Save</button>
              </div>
            </div>
          </div>
        ) : null}

        {modal === 'share' && editing ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-lg">Share note</h3>
              <p className="text-sm text-gray-500">Add a student by email</p>
              <div className="flex gap-2">
                <input value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} placeholder="friend@school.edu" className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2" />
                <button type="button" onClick={() => void shareByEmail(editing)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold">Send</button>
              </div>
              <p className="text-sm text-gray-500 pt-2">Or search by name</p>
              <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Search…" className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2" />
              <ul className="max-h-40 overflow-y-auto space-y-1">
                {userHits.map((u) => (
                  <li key={u.id}>
                    <button type="button" className="w-full text-left text-sm py-2 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => void shareWithUserId(editing, u.id)}>
                      {u.name} <span className="text-gray-400">{u.email}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  )
}
