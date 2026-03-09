'use client'

import { useState } from 'react'
import { ToolInput, ToolGenerateBtn, downloadText } from '../_components/shared'
import { apiClient } from '@/lib/api/client'
import { triggerUpgradeModal } from '@/lib/upgradeHandler'

interface Week { week: number; topic: string; subtopics?: string[]; objectives?: string[]; resources?: string[]; evaluation?: string }

export default function SchemeOfWorkPage() {
  const [form, setForm] = useState({ subject: '', classLevel: '', term: 'First Term', weeksCount: 13 })
  const [result, setResult] = useState<Week[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    if (!form.subject || !form.classLevel) {
      setError('Subject and class required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/teacher-tools/scheme-of-work', form)
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
    let out = `SCHEME OF WORK\nSubject: ${form.subject} | Class: ${form.classLevel} | Term: ${form.term}\n\n`
    result.forEach((w) => {
      out += `WEEK ${w.week}: ${w.topic}\n`
      out += `Subtopics: ${(w.subtopics || []).join(', ')}\n`
      out += `Objectives: ${(w.objectives || []).join('; ')}\n`
      out += `Resources: ${(w.resources || []).join(', ')}\n`
      out += `Evaluation: ${w.evaluation || ''}\n\n`
    })
    downloadText(out, `Scheme of Work - ${form.subject} ${form.term}.txt`)
  }

  if (result) {
    return (
      <div className="tool-page space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-semibold text-sm" onClick={() => setResult(null)}>
            ← New Scheme
          </button>
          <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm" onClick={downloadScheme}>
            Download
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-3 py-2 text-left font-bold w-14">Week</th>
                <th className="px-3 py-2 text-left font-bold">Topic</th>
                <th className="px-3 py-2 text-left font-bold">Subtopics</th>
                <th className="px-3 py-2 text-left font-bold">Objectives</th>
                <th className="px-3 py-2 text-left font-bold">Resources</th>
                <th className="px-3 py-2 text-left font-bold">Evaluation</th>
              </tr>
            </thead>
            <tbody>
              {result.map((w, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 font-bold text-indigo-600">{w.week}</td>
                  <td className="px-3 py-2 font-semibold">{w.topic}</td>
                  <td className="px-3 py-2">
                    <ul className="list-disc pl-4">{w.subtopics?.map((s, j) => <li key={j}>{s}</li>)}</ul>
                  </td>
                  <td className="px-3 py-2">
                    <ul className="list-disc pl-4">{w.objectives?.map((o, j) => <li key={j}>{o}</li>)}</ul>
                  </td>
                  <td className="px-3 py-2">
                    <ul className="list-disc pl-4">{w.resources?.map((r, j) => <li key={j}>{r}</li>)}</ul>
                  </td>
                  <td className="px-3 py-2">{w.evaluation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="tool-page space-y-4">
      <div className="tool-header flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">📅</div>
        <div>
          <h1 className="text-xl font-bold">Scheme of Work</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Full term scheme aligned to NERDC curriculum</p>
        </div>
      </div>
      <div className="tool-form space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput label="Subject *" placeholder="e.g. Mathematics" value={form.subject} onChange={(v) => setForm((p) => ({ ...p, subject: v }))} />
          <ToolInput label="Class / Level *" placeholder="e.g. SS2, JSS3" value={form.classLevel} onChange={(v) => setForm((p) => ({ ...p, classLevel: v }))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Term</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" value={form.term} onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))}>
              <option>First Term</option>
              <option>Second Term</option>
              <option>Third Term</option>
            </select>
          </div>
          <ToolInput label="Number of Weeks" type="number" value={form.weeksCount} onChange={(v) => setForm((p) => ({ ...p, weeksCount: parseInt(v) || 13 }))} />
        </div>
        {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg">{error}</div>}
        <ToolGenerateBtn loading={loading} onClick={generate} label="Generate Scheme of Work" />
      </div>
    </div>
  )
}
