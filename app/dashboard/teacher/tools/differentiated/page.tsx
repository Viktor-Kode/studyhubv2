'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ToolInput, ToolGenerateBtn, Section } from '../_components/shared'
import { apiClient } from '@/lib/api/client'
import { triggerUpgradeModal } from '@/lib/upgradeHandler'

interface Q { text: string; options?: string[]; answer: string; marks?: number }

export default function DifferentiatedPage() {
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ topic: '', subject: '', classLevel: '', questionCount: 10, documentText: '' })
  const [result, setResult] = useState<{ easy: { label: string; description: string; questions: Q[] }; medium: { label: string; description: string; questions: Q[] }; hard: { label: string; description: string; questions: Q[] } } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeVersion, setActiveVersion] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const savedId = searchParams.get('saved')
    const type = searchParams.get('type')
    if (!savedId || type !== 'differentiated') return
    apiClient.get(`/teacher-tools/saved/${type}/${savedId}`).then((res) => {
      const item = res.data?.item
      if (item?.content?.easy) {
        setResult(item.content)
        if (item.meta?.topic) setForm((f) => ({ ...f, topic: String(item.meta.topic) }))
        if (item.meta?.subject) setForm((f) => ({ ...f, subject: String(item.meta.subject) }))
      }
    }).catch(() => {})
  }, [searchParams])

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      await apiClient.post('/teacher-tools/saved', {
        toolType: 'differentiated',
        title: `Differentiated – ${form.topic} ${form.subject}`.trim() || 'Differentiated Questions',
        meta: { topic: form.topic, subject: form.subject, classLevel: form.classLevel },
        content: result,
      })
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const generate = async () => {
    if (!form.topic || !form.subject) {
      setError('Topic and subject required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/teacher-tools/differentiated', form)
      if (res.data.success) setResult(res.data.sets)
      else setError(res.data.error || 'Failed')
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { showUpgrade?: boolean } } }
      if (e.response?.status === 403 && e.response?.data?.showUpgrade) triggerUpgradeModal('teacher')
      else setError((err as Error).message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    const v = result[activeVersion]
    return (
      <div className="tool-page space-y-4">
        <div className="flex gap-2 flex-wrap items-center">
          <button type="button" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-semibold text-sm" onClick={() => setResult(null)}>
            ← New
          </button>
          <button type="button" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save on site'}
          </button>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`px-4 py-2 rounded-lg font-semibold text-sm ${activeVersion === key ? 'bg-cyan-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
                onClick={() => setActiveVersion(key)}
              >
                {result[key].label}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{v.description}</p>
          <Section title="Questions">
            {v.questions?.map((q, i) => (
              <div key={i} className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-semibold text-sm mb-2">{i + 1}. {q.text}</div>
                {q.options && q.options.length > 0 && (
                  <ul className="space-y-1 pl-4">
                    {q.options.map((o, j) => (
                      <li key={j} className={`text-sm ${o === q.answer ? 'text-emerald-600 font-semibold' : ''}`}>
                        {o} {o === q.answer && '✓'}
                      </li>
                    ))}
                  </ul>
                )}
                {(!q.options || q.options.length === 0) && <p className="text-sm text-gray-500">Answer: {q.answer}</p>}
              </div>
            ))}
          </Section>
        </div>
      </div>
    )
  }

  return (
    <div className="tool-page space-y-4">
      <div className="tool-header flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">📚</div>
        <div>
          <h1 className="text-xl font-bold">Differentiated Questions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">3 difficulty versions of same test from one document</p>
        </div>
      </div>
      <div className="tool-form space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput label="Topic *" placeholder="e.g. Photosynthesis" value={form.topic} onChange={(v) => setForm((p) => ({ ...p, topic: v }))} />
          <ToolInput label="Subject *" placeholder="e.g. Biology" value={form.subject} onChange={(v) => setForm((p) => ({ ...p, subject: v }))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput label="Class / Level" placeholder="e.g. SS2" value={form.classLevel} onChange={(v) => setForm((p) => ({ ...p, classLevel: v }))} />
          <ToolInput label="Questions per version" type="number" value={form.questionCount} onChange={(v) => setForm((p) => ({ ...p, questionCount: parseInt(v) || 10 }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Document text (optional)</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 min-h-[120px]"
            placeholder="Paste document content for context..."
            value={form.documentText}
            onChange={(e) => setForm((p) => ({ ...p, documentText: e.target.value }))}
          />
        </div>
        {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg">{error}</div>}
        <ToolGenerateBtn loading={loading} onClick={generate} label="Generate Differentiated Questions" />
      </div>
    </div>
  )
}
