'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { FileDown, Loader, Plus, Trash2, Sparkles, Save } from 'lucide-react'
import { generateReportSheet, type ReportStudent } from '@/lib/utils/pdfGenerator'
import { apiClient } from '@/lib/api/client'
import { triggerUpgradeModal } from '@/lib/upgradeHandler'
import { ToolInput } from '../_components/shared'

const SUBJECTS = [
  'English Language',
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'Economics',
  'Government',
  'Literature',
  'Geography',
  'Agricultural Science',
  'Civic Education',
  'Computer Studies',
  'Further Mathematics',
  'French',
]

function emptyStudent(name = ''): ReportStudent {
  return {
    name,
    subjects: SUBJECTS.slice(0, 8).map((s) => ({
      name: s,
      ca1: '',
      ca2: '',
      exam: '',
      total: '',
      grade: '',
      remark: '',
    })),
    totalScore: '',
    average: '',
    position: '',
    classSize: '',
    overallGrade: '',
    teacherComment: '',
  }
}

function gradeFromTotal(total: number): string {
  if (total >= 75) return 'A1'
  if (total >= 70) return 'B2'
  if (total >= 65) return 'B3'
  if (total >= 60) return 'C4'
  if (total >= 55) return 'C5'
  if (total >= 50) return 'C6'
  if (total >= 45) return 'D7'
  if (total >= 40) return 'E8'
  return 'F9'
}

export default function ReportSheetPage() {
  const searchParams = useSearchParams()
  const [meta, setMeta] = useState({
    schoolName: '',
    classTeacher: '',
    term: '',
    year: '',
    className: '',
  })
  const [students, setStudents] = useState<ReportStudent[]>([emptyStudent()])
  const [generating, setGenerating] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')

  useEffect(() => {
    const savedId = searchParams.get('saved')
    const type = searchParams.get('type')
    if (!savedId || type !== 'report_sheet') return
    apiClient.get(`/teacher-tools/saved/${type}/${savedId}`).then((res) => {
      const item = res.data?.item
      if (item?.content?.students) {
        if (item.content.meta) setMeta(item.content.meta)
        setStudents(Array.isArray(item.content.students) ? item.content.students : [emptyStudent()])
      }
    }).catch(() => {})
  }, [searchParams])

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiClient.post('/teacher-tools/saved', {
        toolType: 'report_sheet',
        title: `Report Sheet – ${meta.className} ${meta.term}`.trim() || 'Report Sheet',
        meta,
        content: { meta, students },
      })
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const handleMeta = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setMeta((m) => ({ ...m, [e.target.name]: e.target.value }))

  const addStudent = () => setStudents((s) => [...s, emptyStudent()])
  const removeStudent = (i: number) => setStudents((s) => s.filter((_, idx) => idx !== i))

  const updateStudent = (si: number, field: keyof ReportStudent, value: string) => {
    setStudents((prev) =>
      prev.map((s, i) => (i === si ? { ...s, [field]: value } : s))
    )
  }

  const updateSubject = (
    si: number,
    sj: number,
    field: string,
    value: string
  ) => {
    setStudents((prev) =>
      prev.map((s, i) => {
        if (i !== si) return s
        const subjects = (s.subjects || []).map((sub, j) =>
          j === sj ? { ...sub, [field]: value } : sub
        )
        return { ...s, subjects }
      })
    )
  }

  const calcTotal = (si: number, sj: number, field: string, value: string) => {
    updateSubject(si, sj, field, value)
    const student = students[si]
    const sub = { ...student.subjects![sj], [field]: value }
    const total =
      (parseInt(sub.ca1 || '0', 10) || 0) +
      (parseInt(sub.ca2 || '0', 10) || 0) +
      (parseInt(sub.exam || '0', 10) || 0)
    const grade = total ? gradeFromTotal(total) : ''
    updateSubject(si, sj, 'total', total ? String(total) : '')
    updateSubject(si, sj, 'grade', grade)
  }

  const generateAIComments = async () => {
    setAiLoading(true)
    try {
      const updated = await Promise.all(
        students.map(async (student) => {
          const subjectSummary = (student.subjects || [])
            .filter((s) => s.total)
            .map((s) => `${s.name}: ${s.total}/100 (${s.grade})`)
            .join(', ')
          if (!subjectSummary) return student
          try {
            const res = await apiClient.post('/teacher-tools/report-comment', {
              studentName: student.name,
              scores: subjectSummary,
              average: student.average,
              className: meta.className,
            })
            const data = res.data as { comment?: string }
            return { ...student, teacherComment: data.comment || student.teacherComment }
          } catch (e) {
            const err = e as { response?: { status?: number; data?: { showUpgrade?: boolean } } }
            if (err.response?.status === 403 && err.response?.data?.showUpgrade) {
              triggerUpgradeModal('teacher')
            }
            return student
          }
        })
      )
      setStudents(updated)
    } catch (err) {
      console.error(err)
    } finally {
      setAiLoading(false)
    }
  }

  const handleDownload = async () => {
    setGenerating(true)
    try {
      await generateReportSheet({ ...meta, students })
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="tool-page space-y-4">
      <div className="tool-header flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <div>
          <h1 className="text-xl font-bold">Report Sheet</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate full termly report cards for each student (PDF)
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
            mode === 'manual'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
          }`}
          onClick={() => setMode('manual')}
        >
          ✏️ Manual
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${
            mode === 'ai'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
          }`}
          onClick={() => setMode('ai')}
        >
          ✨ AI Comments
        </button>
      </div>

      <div className="tool-form space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput
            label="School Name"
            placeholder="School name"
            value={meta.schoolName}
            onChange={(v) => setMeta((p) => ({ ...p, schoolName: v }))}
          />
          <ToolInput
            label="Class Teacher"
            placeholder="Teacher's name"
            value={meta.classTeacher}
            onChange={(v) => setMeta((p) => ({ ...p, classTeacher: v }))}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ToolInput
            label="Class"
            placeholder="e.g. SS2A"
            value={meta.className}
            onChange={(v) => setMeta((p) => ({ ...p, className: v }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
            <select
              className="teacher-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              name="term"
              value={meta.term}
              onChange={handleMeta}
            >
              <option value="">Select</option>
              <option>First Term</option>
              <option>Second Term</option>
              <option>Third Term</option>
            </select>
          </div>
          <ToolInput
            label="Year"
            placeholder="2024/2025"
            value={meta.year}
            onChange={(v) => setMeta((p) => ({ ...p, year: v }))}
          />
        </div>

        {students.map((student, si) => (
          <div
            key={si}
            className="tt-student-block rounded-xl border border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800/50 space-y-3"
          >
            <div className="flex items-center gap-2">
              <input
                className="teacher-input flex-1 font-semibold"
                value={student.name || ''}
                onChange={(e) => updateStudent(si, 'name', e.target.value)}
                placeholder={`Student ${si + 1} Name`}
              />
              <button
                type="button"
                className="p-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-600"
                onClick={() => removeStudent(si)}
                aria-label="Remove student"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300">
                    <th className="px-2 py-2 text-left font-bold">Subject</th>
                    <th className="px-2 py-2 text-left w-20 font-bold">CA1 (10)</th>
                    <th className="px-2 py-2 text-left w-20 font-bold">CA2 (10)</th>
                    <th className="px-2 py-2 text-left w-20 font-bold">Exam (80)</th>
                    <th className="px-2 py-2 text-left w-16 font-bold">Total</th>
                    <th className="px-2 py-2 text-left w-14 font-bold">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {(student.subjects || []).map((sub, sj) => (
                    <tr key={sj}>
                      <td className="px-2 py-1">
                        <input
                          className="teacher-input w-full text-sm"
                          value={sub.name || ''}
                          onChange={(e) => updateSubject(si, sj, 'name', e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          className="teacher-input w-full text-sm"
                          value={sub.ca1 || ''}
                          onChange={(e) => calcTotal(si, sj, 'ca1', e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min={0}
                          max={10}
                          className="teacher-input w-full text-sm"
                          value={sub.ca2 || ''}
                          onChange={(e) => calcTotal(si, sj, 'ca2', e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          min={0}
                          max={80}
                          className="teacher-input w-full text-sm"
                          value={sub.exam || ''}
                          onChange={(e) => calcTotal(si, sj, 'exam', e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input className="teacher-input w-full text-sm bg-gray-100 dark:bg-gray-700 font-semibold" value={sub.total || ''} readOnly />
                      </td>
                      <td className="px-2 py-1">
                        <input className="teacher-input w-full text-sm bg-gray-100 dark:bg-gray-700 font-semibold" value={sub.grade || ''} readOnly />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ToolInput
                label="Position"
                placeholder="e.g. 3"
                value={student.position || ''}
                onChange={(v) => updateStudent(si, 'position', v)}
              />
              <ToolInput
                label="Class Size"
                placeholder="e.g. 35"
                value={student.classSize || ''}
                onChange={(v) => updateStudent(si, 'classSize', v)}
              />
              <ToolInput
                label="Average"
                placeholder="e.g. 68.5"
                value={student.average || ''}
                onChange={(v) => updateStudent(si, 'average', v)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teacher&apos;s Comment</label>
              <textarea
                className="teacher-input teacher-textarea w-full"
                value={student.teacherComment || ''}
                onChange={(e) => updateStudent(si, 'teacherComment', e.target.value)}
                placeholder="Enter comment or use AI to generate..."
                rows={2}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 font-semibold flex items-center justify-center gap-2"
          onClick={addStudent}
        >
          <Plus size={18} />
          Add Student
        </button>

        {mode === 'ai' && (
          <button
            type="button"
            className="w-full py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={generateAIComments}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Generating comments...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate AI Comments for All
              </>
            )}
          </button>
        )}

        <button
          type="button"
          className="w-full py-3 border border-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save on site'}
        </button>
        <button
          type="button"
          className="generate-btn flex items-center justify-center gap-2 w-full"
          onClick={handleDownload}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader size={18} className="animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <FileDown size={18} />
              Download Report Cards PDF
            </>
          )}
        </button>
      </div>
    </div>
  )
}
