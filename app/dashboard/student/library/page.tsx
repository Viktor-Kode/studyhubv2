'use client'

import { useCallback, useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import ProgressWidget from '@/components/ProgressWidget'
import { useRouter } from 'next/navigation'
import { useProgress } from '@/hooks/useProgress'
import { sharedLibraryApi, type SharedLibraryItem } from '@/lib/api/sharedLibraryApi'
import { toast } from 'react-hot-toast'
import { FiLoader, FiLink, FiFile, FiAlignLeft, FiThumbsUp, FiThumbsDown, FiDownload } from 'react-icons/fi'

export default function SharedLibraryPage() {
  const router = useRouter()
  const { refetch } = useProgress()
  const [tab, setTab] = useState<'browse' | 'submit' | 'mine'>('browse')
  const [items, setItems] = useState<SharedLibraryItem[]>([])
  const [mine, setMine] = useState<SharedLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'recent' | 'upvotes'>('recent')
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState('')
  const [detail, setDetail] = useState<SharedLibraryItem | null>(null)

  const [submit, setSubmit] = useState({
    type: 'link' as 'link' | 'file' | 'text',
    title: '',
    description: '',
    url: '',
    textContent: '',
    subject: '',
    tags: '',
    file: null as File | null,
  })

  const loadBrowse = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await sharedLibraryApi.items({
        sort,
        search: search || undefined,
        subject: subject || undefined,
      })
      setItems(data.items || [])
    } catch {
      toast.error('Could not load library')
    } finally {
      setLoading(false)
    }
  }, [sort, search, subject])

  const loadMine = useCallback(async () => {
    try {
      const { data } = await sharedLibraryApi.mine()
      setMine(data.items || [])
    } catch {
      toast.error('Could not load submissions')
    }
  }, [])

  useEffect(() => {
    if (tab === 'browse') void loadBrowse()
    else if (tab === 'mine') void loadMine()
  }, [tab, loadBrowse, loadMine])

  const vote = async (id: string, direction: 'up' | 'down' | 'clear') => {
    try {
      const { data } = await sharedLibraryApi.vote(id, direction)
      toast.success(direction === 'up' ? 'Upvoted' : direction === 'down' ? 'Downvoted' : 'Vote cleared')
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, ...data.item } : x)))
      if (detail?._id === id) setDetail(data.item)
      await refetch()
    } catch {
      toast.error('Vote failed')
    }
  }

  const openResource = async (it: SharedLibraryItem) => {
    try {
      const { data } = await sharedLibraryApi.download(it._id)
      if (it.type === 'link' && data.url) window.open(data.url, '_blank', 'noopener,noreferrer')
      else if (it.type === 'file' && data.fileUrl) window.open(data.fileUrl, '_blank', 'noopener,noreferrer')
      else if (it.type === 'text') setDetail(it)
      setItems((prev) =>
        prev.map((x) => (x._id === it._id ? { ...x, downloads: data.downloads ?? x.downloads } : x)),
      )
    } catch {
      if (it.type === 'text') {
        setDetail(it)
        return
      }
      toast.error('Could not open resource')
    }
  }

  const sendSubmit = async () => {
    try {
      const fd = new FormData()
      fd.append('title', submit.title)
      fd.append('description', submit.description)
      fd.append('type', submit.type)
      fd.append('subject', submit.subject)
      fd.append('tags', submit.tags)
      if (submit.type === 'link') fd.append('url', submit.url)
      if (submit.type === 'text') fd.append('textContent', submit.textContent)
      if (submit.type === 'file' && submit.file) fd.append('file', submit.file)
      await sharedLibraryApi.submit(fd)
      toast.success('Submitted — pending admin approval')
      setSubmit({ type: 'link', title: '', description: '', url: '', textContent: '', subject: '', tags: '', file: null })
      setTab('mine')
      void loadMine()
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Submit failed')
    }
  }

  const typeIcon = (t: string) => {
    if (t === 'link') return <FiLink className="text-indigo-500" />
    if (t === 'file') return <FiFile className="text-amber-500" />
    return <FiAlignLeft className="text-emerald-500" />
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <BackButton href="/dashboard/student/study-groups" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Shared library</h1>
          </div>
          <div className="hidden sm:block shrink-0">
            <ProgressWidget onViewFull={() => router.push('/community')} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
          {(['browse', 'submit', 'mine'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              {t === 'mine' ? 'My submissions' : t}
            </button>
          ))}
        </div>

        {tab === 'browse' && (
          <div className="flex flex-wrap gap-2">
            <input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[140px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
            <input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-36 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            />
            <select value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'upvotes')} className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm">
              <option value="recent">Newest</option>
              <option value="upvotes">Top upvotes</option>
            </select>
            <button type="button" onClick={() => void loadBrowse()} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold dark:bg-gray-100 dark:text-gray-900">
              Search
            </button>
          </div>
        )}

        {tab === 'browse' && (
          loading ? (
            <div className="flex justify-center py-16 text-gray-500 gap-2"><FiLoader className="animate-spin text-xl" /> Loading…</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((it) => (
                <button
                  key={it._id}
                  type="button"
                  onClick={() => setDetail(it)}
                  className="text-left rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 p-4 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-600 transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {typeIcon(it.type)}
                    <span className="font-semibold text-gray-900 dark:text-white line-clamp-2">{it.title}</span>
                  </div>
                  {it.subject ? <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">{it.subject}</p> : null}
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{it.description}</p>
                  <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                    <span>{it.authorName}</span>
                    <span>▲ {it.upvoteCount ?? it.upvotes?.length ?? 0}</span>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {tab === 'submit' && (
          <div className="max-w-xl space-y-3 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800/60">
            <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
              Submissions are reviewed by admins before they appear in the public library.
            </p>
            <label className="block text-sm font-medium">Type</label>
            <select value={submit.type} onChange={(e) => setSubmit((s) => ({ ...s, type: e.target.value as 'link' | 'file' | 'text' }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900">
              <option value="link">Link</option>
              <option value="file">File</option>
              <option value="text">Text</option>
            </select>
            <input placeholder="Title" value={submit.title} onChange={(e) => setSubmit((s) => ({ ...s, title: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
            <textarea placeholder="Description" value={submit.description} onChange={(e) => setSubmit((s) => ({ ...s, description: e.target.value }))} rows={3} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
            <input placeholder="Subject" value={submit.subject} onChange={(e) => setSubmit((s) => ({ ...s, subject: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
            <input placeholder="Tags (comma-separated)" value={submit.tags} onChange={(e) => setSubmit((s) => ({ ...s, tags: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
            {submit.type === 'link' && (
              <input placeholder="https://…" value={submit.url} onChange={(e) => setSubmit((s) => ({ ...s, url: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
            )}
            {submit.type === 'text' && (
              <textarea placeholder="Paste text…" value={submit.textContent} onChange={(e) => setSubmit((s) => ({ ...s, textContent: e.target.value }))} rows={6} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
            )}
            {submit.type === 'file' && (
              <input type="file" onChange={(e) => setSubmit((s) => ({ ...s, file: e.target.files?.[0] ?? null }))} className="w-full text-sm" />
            )}
            <button type="button" onClick={() => void sendSubmit()} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold">
              Submit
            </button>
          </div>
        )}

        {tab === 'mine' && (
          <ul className="space-y-2">
            {mine.length === 0 ? <p className="text-gray-500 py-8 text-center">No submissions yet.</p> : null}
            {mine.map((it) => (
              <li key={it._id} className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex flex-wrap justify-between gap-2 bg-white dark:bg-gray-800/60">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{it.title}</p>
                  <p className="text-xs text-gray-500">{it.type} · {new Date(it.createdAt || '').toLocaleString()}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${it.moderationStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : it.moderationStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>
                  {it.moderationStatus}
                </span>
              </li>
            ))}
          </ul>
        )}

        {detail ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDetail(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start gap-2">
                {typeIcon(detail.type)}
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{detail.title}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{detail.description}</p>
              {detail.type === 'text' && detail.textContent ? (
                <pre className="text-sm bg-gray-100 dark:bg-gray-800 rounded-lg p-3 overflow-x-auto max-h-48">{detail.textContent}</pre>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void vote(detail._id, detail.userVote === 'up' ? 'clear' : 'up')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold">
                  <FiThumbsUp /> {detail.upvoteCount ?? detail.upvotes?.length}
                </button>
                <button type="button" onClick={() => void vote(detail._id, detail.userVote === 'down' ? 'clear' : 'down')} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold">
                  <FiThumbsDown /> {detail.downvoteCount ?? detail.downvotes?.length}
                </button>
                <button
                  type="button"
                  onClick={() => void openResource(detail)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
                >
                  <FiDownload /> Open / View
                </button>
              </div>
              <button type="button" className="text-sm text-gray-500 underline" onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  )
}
