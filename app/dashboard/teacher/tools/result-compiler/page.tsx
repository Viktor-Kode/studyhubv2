'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ToolInput, ToolGenerateBtn, downloadText } from '../_components/shared'
import { apiClient } from '@/lib/api/client'
import { triggerUpgradeModal } from '@/lib/upgradeHandler'

interface Student { name: string; ca: string; exam: string }
interface ProcessedStudent extends Student { total: number; grade: string; remark: string; position: number }

export default function ResultCompilerPage() {
  const searchParams = useSearchParams()
  const [meta, setMeta] = useState({
    className: '',
    subject: '',
    term: 'First Term',
    year: '2024/2025',
    gradingType: 'weighted',
    caWeight: 40,
    examWeight: 60,
  })
  const [students, setStudents] = useState<Student[]>(
    Array(10)
      .fill(null)
      .map(() => ({ name: '', ca: '', exam: '' }))
  )
  const [result, setResult] = useState<{
    students: ProcessedStudent[]
    stats: { classAverage: string; highest: number; lowest: number; passed: number; total: number }
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedId = searchParams.get('saved')
    const type = searchParams.get('type')
    if (!savedId || type !== 'result_compiler') return
    apiClient.get(`/teacher-tools/saved/${type}/${savedId}`).then((res) => {
      const item = res.data?.item
      if (item?.content?.students) {
        const stats = item.content.stats || {}
        setResult({
          students: item.content.students,
          stats: {
            classAverage: stats.classAverage ?? '',
            highest: stats.highest ?? 0,
            lowest: stats.lowest ?? 0,
            passed: stats.passed ?? 0,
            total: stats.total ?? 0,
          },
        })
        if (item.meta?.className) setMeta((m) => ({ ...m, className: String(item.meta.className) }))
        if (item.meta?.subject) setMeta((m) => ({ ...m, subject: String(item.meta.subject) }))
        if (item.meta?.term) setMeta((m) => ({ ...m, term: String(item.meta.term) }))
        if (item.meta?.year) setMeta((m) => ({ ...m, year: String(item.meta.year) }))
      }
    }).catch(() => {})
  }, [searchParams])

  const updateStudent = (index: number, field: keyof Student, value: string) => {
    setStudents((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const addRows = () => {
    setStudents((prev) => [...prev, ...Array(5).fill(null).map(() => ({ name: '', ca: '', exam: '' }))])
  }

  const compile = async () => {
    const valid = students.filter((s) => s.name.trim() && s.exam !== '')
    if (valid.length === 0) {
      setError('Add at least one student with a name and exam score')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/teacher-tools/compile-results', { ...meta, students: valid })
      if (res.data.success) setResult(res.data)
      else setError(res.data.error || 'Failed')
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { showUpgrade?: boolean } } }
      if (e.response?.status === 403 && e.response?.data?.showUpgrade) triggerUpgradeModal('teacher')
      else setError((err as Error).message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadResults = () => {
    if (!result) return
    let csv = `Class: ${meta.className}, Subject: ${meta.subject}, Term: ${meta.term}\n\n`
    csv += `Position,Name,CA,Exam,Total,Grade,Remark\n`
    ;[...result.students]
      .sort((a, b) => a.position - b.position)
      .forEach((s) => {
        csv += `${s.position},${s.name},${s.ca},${s.exam},${s.total},${s.grade},${s.remark}\n`
      })
    csv += `\nClass Average: ${result.stats.classAverage}, Highest: ${result.stats.highest}, Lowest: ${result.stats.lowest}, Passed: ${result.stats.passed}/${result.stats.total}`
    downloadText(csv, `Results - ${meta.className} ${meta.subject}.csv`)
  }

  if (result) {
    const sorted = [...result.students].sort((a, b) => a.position - b.position)
    return (
      <div className="tool-page space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button type="button" className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-semibold text-sm" onClick={() => setResult(null)}>
            ← Edit
          </button>
          <span className="px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">Saved on site</span>
          <button type="button" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm" onClick={downloadResults}>
            Download (.csv)
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 text-center">
            <div className="text-2xl font-bold text-indigo-600">{result.stats.classAverage}</div>
            <div className="text-xs text-gray-500">Class Average</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 text-center">
            <div className="text-2xl font-bold">{result.stats.highest}</div>
            <div className="text-xs text-gray-500">Highest</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 text-center">
            <div className="text-2xl font-bold">{result.stats.lowest}</div>
            <div className="text-xs text-gray-500">Lowest</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 text-center">
            <div className="text-2xl font-bold">{result.stats.passed}/{result.stats.total}</div>
            <div className="text-xs text-gray-500">Passed</div>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-3 py-2 text-left font-bold">Position</th>
                <th className="px-3 py-2 text-left font-bold">Name</th>
                <th className="px-3 py-2 text-left font-bold">CA</th>
                <th className="px-3 py-2 text-left font-bold">Exam</th>
                <th className="px-3 py-2 text-left font-bold">Total</th>
                <th className="px-3 py-2 text-left font-bold">Grade</th>
                <th className="px-3 py-2 text-left font-bold">Remark</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr key={i} className={s.total < 50 ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                  <td className="px-3 py-2 font-bold text-indigo-600">{s.position}</td>
                  <td className="px-3 py-2 font-semibold">{s.name}</td>
                  <td className="px-3 py-2">{s.ca}</td>
                  <td className="px-3 py-2">{s.exam}</td>
                  <td className="px-3 py-2 font-bold">{s.total}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold grade-${s.grade.toLowerCase()}`}>
                      {s.grade}
                    </span>
                  </td>
                  <td className="px-3 py-2">{s.remark}</td>
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
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">📊</div>
        <div>
          <h1 className="text-xl font-bold">Result Compiler</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Compile, grade and rank student results</p>
        </div>
      </div>

      <div className="tool-form space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput label="Class Name" placeholder="e.g. SS2A" value={meta.className} onChange={(v) => setMeta((p) => ({ ...p, className: v }))} />
          <ToolInput label="Subject" placeholder="e.g. Mathematics" value={meta.subject} onChange={(v) => setMeta((p) => ({ ...p, subject: v }))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Term</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              value={meta.term}
              onChange={(e) => setMeta((p) => ({ ...p, term: e.target.value }))}
            >
              <option>First Term</option>
              <option>Second Term</option>
              <option>Third Term</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Grading Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              value={meta.gradingType}
              onChange={(e) => setMeta((p) => ({ ...p, gradingType: e.target.value }))}
            >
              <option value="weighted">Weighted (CA + Exam)</option>
              <option value="total">Total (CA + Exam = 100)</option>
            </select>
          </div>
        </div>
        {meta.gradingType === 'weighted' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ToolInput label="CA Weight (%)" type="number" value={meta.caWeight} onChange={(v) => setMeta((p) => ({ ...p, caWeight: parseInt(v) || 40 }))} />
            <ToolInput label="Exam Weight (%)" type="number" value={meta.examWeight} onChange={(v) => setMeta((p) => ({ ...p, examWeight: parseInt(v) || 60 }))} />
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="px-2 py-2 text-left w-10">#</th>
                <th className="px-2 py-2 text-left">Student Name</th>
                <th className="px-2 py-2 text-left w-24">CA</th>
                <th className="px-2 py-2 text-left w-24">Exam</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={i}>
                  <td className="px-2 py-1 text-gray-500">{i + 1}</td>
                  <td className="px-2 py-1">
                    <input
                      className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                      placeholder="Full name"
                      value={s.name}
                      onChange={(e) => updateStudent(i, 'name', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      className="w-20 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                      placeholder="0"
                      value={s.ca}
                      onChange={(e) => updateStudent(i, 'ca', e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      className="w-20 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                      placeholder="0"
                      value={s.exam}
                      onChange={(e) => updateStudent(i, 'exam', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="w-full py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 text-indigo-600 font-semibold text-sm" onClick={addRows}>
            + Add 5 more rows
          </button>
        </div>
        {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg">{error}</div>}
        <ToolGenerateBtn loading={loading} onClick={compile} label="Compile Results" />
      </div>
    </div>
  )
}
