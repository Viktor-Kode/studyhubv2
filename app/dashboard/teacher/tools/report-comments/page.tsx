'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ToolInput, ToolGenerateBtn, downloadText } from '../_components/shared'
import { apiClient } from '@/lib/api/client'
import { triggerUpgradeModal } from '@/lib/upgradeHandler'

interface StudentInput { name: string; score: string; grade: string; strengths: string; weaknesses: string }
interface Comment { name: string; comment: string }

export default function ReportCommentsPage() {
  const searchParams = useSearchParams()
  const [meta, setMeta] = useState({ subject: '', term: 'First Term' })
  const [students, setStudents] = useState<StudentInput[]>(
    Array(5)
      .fill(null)
      .map(() => ({ name: '', score: '', grade: '', strengths: '', weaknesses: '' }))
  )
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const savedId = searchParams.get('saved')
    const type = searchParams.get('type')
    if (!savedId || type !== 'report_comments') return
    apiClient.get(`/teacher-tools/saved/${type}/${savedId}`).then((res) => {
      const item = res.data?.item
      if (item?.content && Array.isArray(item.content)) {
        setComments(item.content)
        if (item.meta?.subject) setMeta((m) => ({ ...m, subject: String(item.meta.subject) }))
        if (item.meta?.term) setMeta((m) => ({ ...m, term: String(item.meta.term) }))
      }
    }).catch(() => {})
  }, [searchParams])

  const handleSave = async () => {
    if (!comments?.length) return
    setSaving(true)
    try {
      await apiClient.post('/teacher-tools/saved', {
        toolType: 'report_comments',
        title: `Report Comments – ${meta.subject} ${meta.term}`.trim() || 'Report Comments',
        meta: { subject: meta.subject, term: meta.term },
        content: comments,
      })
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const updateStudent = (index: number, field: keyof StudentInput, value: string) => {
    setStudents((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const generate = async () => {
    const valid = students.filter((s) => s.name.trim())
    if (valid.length === 0) {
      setError('Add at least one student')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/teacher-tools/report-comments', { ...meta, students: valid })
      if (res.data.success) setComments(res.data.comments)
      else setError(res.data.error || 'Failed')
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { showUpgrade?: boolean } } }
      if (e.response?.status === 403 && e.response?.data?.showUpgrade) triggerUpgradeModal('teacher')
      else setError((err as Error).message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadComments = () => {
    if (!comments) return
    const out = comments.map((c) => `${c.name}:\n${c.comment}`).join('\n\n')
    downloadText(out, 'Report Card Comments.txt')
  }

  if (comments) {
    return (
      <div className="tool-page space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-semibold text-sm" onClick={() => setComments(null)}>
            ← Edit
          </button>
          <button type="button" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save on site'}
          </button>
          <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm" onClick={downloadComments}>
            Download
          </button>
        </div>
        <div className="space-y-3">
          {comments.map((c, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <div className="font-bold text-sm mb-2">{c.name}</div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{c.comment}</p>
              <button
                type="button"
                className="text-xs px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded font-semibold"
                onClick={() => navigator.clipboard.writeText(c.comment)}
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="tool-page space-y-4">
      <div className="tool-header flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">💬</div>
        <div>
          <h1 className="text-xl font-bold">Report Card Comments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Generate personalised comments for students</p>
        </div>
      </div>

      <div className="tool-form space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput label="Subject" placeholder="e.g. Mathematics" value={meta.subject} onChange={(v) => setMeta((p) => ({ ...p, subject: v }))} />
          <div>
            <label className="block text-sm font-medium mb-1">Term</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" value={meta.term} onChange={(e) => setMeta((p) => ({ ...p, term: e.target.value }))}>
              <option>First Term</option>
              <option>Second Term</option>
              <option>Third Term</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-2 py-2 text-left w-10">#</th>
                <th className="px-2 py-2 text-left">Name</th>
                <th className="px-2 py-2 text-left w-20">Score</th>
                <th className="px-2 py-2 text-left">Strengths</th>
                <th className="px-2 py-2 text-left">Weaknesses</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i}>
                  <td className="px-2 py-1 text-gray-500">{i + 1}</td>
                  <td className="px-2 py-1">
                    <input className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm" placeholder="Full name" value={s.name} onChange={(e) => updateStudent(i, 'name', e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" className="w-16 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm" value={s.score} onChange={(e) => updateStudent(i, 'score', e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <input className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm" placeholder="e.g. Good at algebra" value={s.strengths} onChange={(e) => updateStudent(i, 'strengths', e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <input className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm" placeholder="e.g. Struggles with fractions" value={s.weaknesses} onChange={(e) => updateStudent(i, 'weaknesses', e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="w-full py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 text-indigo-600 font-semibold text-sm" onClick={() => setStudents((p) => [...p, ...Array(5).fill(null).map(() => ({ name: '', score: '', grade: '', strengths: '', weaknesses: '' }))])}>
            + Add 5 more
          </button>
        </div>
        {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg">{error}</div>}
        <ToolGenerateBtn loading={loading} onClick={generate} label="Generate Comments" />
      </div>
    </div>
  )
}
