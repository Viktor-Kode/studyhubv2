'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ToolInput, ToolGenerateBtn, downloadText } from '../_components/shared'
import { apiClient } from '@/lib/api/client'
import { triggerUpgradeModal } from '@/lib/upgradeHandler'

interface Question { text: string; marks: number; type?: string }
interface SchemeItem { questionNumber: number; question: string; marks: number; keyPoints?: string[]; modelAnswer?: string; commonErrors?: string[] }

export default function MarkingSchemePage() {
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ subject: '', totalMarks: 100 })
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', marks: 5 },
    { text: '', marks: 10 },
  ])
  const [result, setResult] = useState<SchemeItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const savedId = searchParams.get('saved')
    const type = searchParams.get('type')
    if (!savedId || type !== 'marking_scheme') return
    apiClient.get(`/teacher-tools/saved/${type}/${savedId}`).then((res) => {
      const item = res.data?.item
      if (item?.content && Array.isArray(item.content)) {
        setResult(item.content)
        if (item.meta?.subject) setForm((f) => ({ ...f, subject: String(item.meta.subject) }))
        if (item.meta?.totalMarks) setForm((f) => ({ ...f, totalMarks: Number(item.meta.totalMarks) || 100 }))
      }
    }).catch(() => {})
  }, [searchParams])

  const handleSave = async () => {
    if (!result?.length) return
    setSaving(true)
    try {
      await apiClient.post('/teacher-tools/saved', {
        toolType: 'marking_scheme',
        title: `Marking Scheme – ${form.subject}`.trim() || 'Marking Scheme',
        meta: { subject: form.subject, totalMarks: form.totalMarks },
        content: result,
      })
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const addQuestion = () => {
    setQuestions((p) => [...p, { text: '', marks: 5 }])
  }

  const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)))
  }

  const generate = async () => {
    const valid = questions.filter((q) => q.text.trim())
    if (valid.length === 0) {
      setError('Add at least one question')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/teacher-tools/marking-scheme', {
        subject: form.subject,
        totalMarks: form.totalMarks,
        questions: valid,
      })
      if (res.data.success) setResult(res.data.scheme)
      else setError(res.data.error || 'Failed')
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { showUpgrade?: boolean } } }
      if (e.response?.status === 403 && e.response?.data?.showUpgrade) triggerUpgradeModal('teacher')
      else setError((err as Error).message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadScheme = () => {
    if (!result) return
    let out = `MARKING SCHEME\nSubject: ${form.subject} | Total: ${form.totalMarks} marks\n\n`
    result.forEach((s) => {
      out += `Q${s.questionNumber} [${s.marks} marks]\n`
      out += `${s.question}\n`
      out += `Key Points:\n${(s.keyPoints || []).map((k) => `- ${k}`).join('\n')}\n`
      out += `Model Answer: ${s.modelAnswer || ''}\n`
      if (s.commonErrors?.length) out += `Common Errors: ${s.commonErrors.join('; ')}\n`
      out += '\n'
    })
    downloadText(out, `Marking Scheme - ${form.subject}.txt`)
  }

  if (result) {
    return (
      <div className="tool-page space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-semibold text-sm" onClick={() => setResult(null)}>
            ← New
          </button>
          <button type="button" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save on site'}
          </button>
          <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm" onClick={downloadScheme}>
            Download
          </button>
        </div>
        <div className="space-y-4">
          {result.map((s, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <div className="font-bold text-indigo-600 mb-2">Q{s.questionNumber} [{s.marks} marks]</div>
              <p className="text-sm mb-3">{s.question}</p>
              <div className="text-sm">
                <strong>Key Points:</strong>
                <ul className="list-disc pl-5 mt-1">{(s.keyPoints || []).map((k, j) => <li key={j}>{k}</li>)}</ul>
              </div>
              <p className="text-sm mt-2"><strong>Model Answer:</strong> {s.modelAnswer}</p>
              {(s.commonErrors || []).length > 0 && (
                <p className="text-sm mt-1 text-amber-600"><strong>Common Errors:</strong> {s.commonErrors?.join('; ')}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="tool-page space-y-4">
      <div className="tool-header flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">✅</div>
        <div>
          <h1 className="text-xl font-bold">Marking Scheme Builder</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Detailed marking guide with key points per question</p>
        </div>
      </div>
      <div className="tool-form space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput label="Subject" placeholder="e.g. Mathematics" value={form.subject} onChange={(v) => setForm((p) => ({ ...p, subject: v }))} />
          <ToolInput label="Total Marks" type="number" value={form.totalMarks} onChange={(v) => setForm((p) => ({ ...p, totalMarks: parseInt(v) || 100 }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Questions</label>
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder={`Question ${i + 1}`}
                value={q.text}
                onChange={(e) => updateQuestion(i, 'text', e.target.value)}
              />
              <input
                type="number"
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                placeholder="Marks"
                value={q.marks}
                onChange={(e) => updateQuestion(i, 'marks', parseInt(e.target.value) || 0)}
              />
            </div>
          ))}
          <button type="button" className="text-sm text-indigo-600 font-semibold" onClick={addQuestion}>
            + Add question
          </button>
        </div>
        {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg">{error}</div>}
        <ToolGenerateBtn loading={loading} onClick={generate} label="Generate Marking Scheme" />
      </div>
    </div>
  )
}
