'use client'

import { useState } from 'react'
import { FileDown, Loader } from 'lucide-react'
import { generateClassRegister } from '@/lib/utils/pdfGenerator'
import { ToolInput, ToolGenerateBtn } from '../_components/shared'

export default function ClassRegisterPage() {
  const [form, setForm] = useState({
    schoolName: '',
    classTeacher: '',
    term: '',
    year: '',
    className: '',
    students: 30,
    subjects: '',
    weeks: 4,
  })
  const [generating, setGenerating] = useState(false)

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleDownload = async () => {
    setGenerating(true)
    try {
      await generateClassRegister({
        ...form,
        students: form.students,
        weeks: form.weeks,
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="tool-page space-y-4">
      <div className="tool-header flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <span className="text-2xl">📋</span>
        </div>
        <div>
          <h1 className="text-xl font-bold">Class Register</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generate a class register with attendance and score columns (PDF)
          </p>
        </div>
      </div>

      <div className="tool-form space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput
            label="School Name"
            placeholder="e.g. Sunshine Secondary School"
            value={form.schoolName}
            onChange={(v) => setForm((p) => ({ ...p, schoolName: v }))}
          />
          <ToolInput
            label="Class Teacher"
            placeholder="e.g. Mr. Adeyemi"
            value={form.classTeacher}
            onChange={(v) => setForm((p) => ({ ...p, classTeacher: v }))}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
            <select
              className="teacher-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              name="term"
              value={form.term}
              onChange={handle}
            >
              <option value="">Select term</option>
              <option>First Term</option>
              <option>Second Term</option>
              <option>Third Term</option>
            </select>
          </div>
          <ToolInput
            label="Year"
            placeholder="e.g. 2024/2025"
            value={form.year}
            onChange={(v) => setForm((p) => ({ ...p, year: v }))}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput
            label="Class Name"
            placeholder="e.g. SS2A"
            value={form.className}
            onChange={(v) => setForm((p) => ({ ...p, className: v }))}
          />
          <ToolInput
            label="Number of Students"
            type="number"
            value={form.students}
            onChange={(v) => setForm((p) => ({ ...p, students: parseInt(v, 10) || 30 }))}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput
            label="Subjects (comma separated)"
            placeholder="e.g. Maths, English, Biology"
            value={form.subjects}
            onChange={(v) => setForm((p) => ({ ...p, subjects: v }))}
          />
          <ToolInput
            label="Number of Weeks"
            type="number"
            value={form.weeks}
            onChange={(v) => setForm((p) => ({ ...p, weeks: parseInt(v, 10) || 4 }))}
          />
        </div>

        <button
          type="button"
          className="generate-btn flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors"
          onClick={handleDownload}
          disabled={generating}
        >
          {generating ? (
            <>
              <Loader size={18} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown size={18} />
              Download Register PDF
            </>
          )}
        </button>
      </div>
    </div>
  )
}
