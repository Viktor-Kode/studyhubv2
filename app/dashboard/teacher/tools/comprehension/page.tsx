'use client'

import { useState } from 'react'
import { ToolInput, ToolGenerateBtn, Section, downloadText } from '../_components/shared'
import { apiClient } from '@/lib/api/client'
import { triggerUpgradeModal } from '@/lib/upgradeHandler'

interface Q { type?: string; text: string; options?: string[]; answer: string; marks?: number }
interface Vocab { word: string; meaning: string; usedInSentence?: string }

export default function ComprehensionPage() {
  const [form, setForm] = useState({ passage: '', classLevel: '', questionCount: 10 })
  const [result, setResult] = useState<{ questions?: Q[]; summary_question?: string; vocabulary?: Vocab[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    if (!form.passage || form.passage.trim().length < 100) {
      setError('Please enter a passage of at least 100 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/teacher-tools/comprehension', form)
      if (res.data.success) setResult(res.data.comprehension)
      else setError(res.data.error || 'Failed')
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { showUpgrade?: boolean } } }
      if (e.response?.status === 403 && e.response?.data?.showUpgrade) triggerUpgradeModal('teacher')
      else setError((err as Error).message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadComprehension = () => {
    if (!result) return
    let out = 'COMPREHENSION EXERCISE\n\n'
    result.questions?.forEach((q, i) => {
      out += `${i + 1}. ${q.text}\n`
      q.options?.forEach((o) => { out += `   ${o}\n` })
      out += `Answer: ${q.answer}\n\n`
    })
    out += `\nSUMMARY QUESTION:\n${result.summary_question || ''}\n\n`
    out += `VOCABULARY:\n`
    result.vocabulary?.forEach((v) => { out += `${v.word}: ${v.meaning}\n` })
    downloadText(out, 'Comprehension Exercise.txt')
  }

  if (result) {
    return (
      <div className="tool-page space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-semibold text-sm" onClick={() => setResult(null)}>
            ← New Passage
          </button>
          <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm" onClick={downloadComprehension}>
            Download
          </button>
        </div>

        <Section title="Questions">
          {result.questions?.map((q, i) => (
            <div key={i} className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="font-semibold text-sm mb-2">{i + 1}. {q.text} ({q.marks || 2} mks)</div>
              {q.options && q.options.length > 0 && (
                <ul className="space-y-1 pl-4">
                  {q.options.map((o, j) => (
                    <li key={j} className={`text-sm ${o === q.answer ? 'text-emerald-600 font-semibold' : ''}`}>
                      {o} {o === q.answer && '✓'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>

        <Section title="Summary Question">
          <p>{result.summary_question}</p>
        </Section>

        <Section title="Vocabulary">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="px-3 py-2 text-left font-bold">Word</th>
                  <th className="px-3 py-2 text-left font-bold">Meaning</th>
                  <th className="px-3 py-2 text-left font-bold">Used in Sentence</th>
                </tr>
              </thead>
              <tbody>
                {result.vocabulary?.map((v, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-semibold">{v.word}</td>
                    <td className="px-3 py-2">{v.meaning}</td>
                    <td className="px-3 py-2">{v.usedInSentence || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    )
  }

  return (
    <div className="tool-page space-y-4">
      <div className="tool-header flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">📖</div>
        <div>
          <h1 className="text-xl font-bold">Comprehension Builder</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Generate questions, vocabulary and summary tasks</p>
        </div>
      </div>
      <div className="tool-form space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput label="Class / Level" placeholder="e.g. SS1, JSS2" value={form.classLevel} onChange={(v) => setForm((p) => ({ ...p, classLevel: v }))} />
          <ToolInput label="Number of Questions" type="number" value={form.questionCount} onChange={(v) => setForm((p) => ({ ...p, questionCount: parseInt(v) || 10 }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Paste Passage *</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 min-h-[200px]"
            placeholder="Paste your reading passage here (minimum 100 characters)..."
            value={form.passage}
            onChange={(e) => setForm((p) => ({ ...p, passage: e.target.value }))}
          />
          <span className="text-xs text-gray-500">{form.passage.length} characters</span>
        </div>
        {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg">{error}</div>}
        <ToolGenerateBtn loading={loading} onClick={generate} label="Generate Comprehension Exercise" />
      </div>
    </div>
  )
}
