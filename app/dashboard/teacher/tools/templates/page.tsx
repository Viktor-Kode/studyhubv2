'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { generateBlankTemplate } from '@/lib/utils/pdfGenerator'
import { ToolInput } from '../_components/shared'

const TEMPLATES = [
  { id: 'lesson_note', title: 'Lesson Note Template', desc: 'Full NERDC-aligned lesson note format', icon: '📝' },
  { id: 'scheme_of_work', title: 'Scheme of Work Template', desc: '14-week scheme of work table', icon: '📅' },
  { id: 'marking_scheme', title: 'Marking Scheme Template', desc: 'Question-by-question marking guide', icon: '✅' },
  { id: 'reading_comprehension', title: 'Reading Comprehension Template', desc: 'Passage + questions + vocabulary', icon: '📖' },
  { id: 'exam_timetable', title: 'Exam Timetable Template', desc: 'Full term examination schedule', icon: '🗓️' },
  { id: 'parent_teacher', title: 'Parent-Teacher Meeting Record', desc: 'Meeting notes and action points', icon: '👥' },
]

export default function TemplatesPage() {
  const [meta, setMeta] = useState({ schoolName: '', classTeacher: '', term: '', year: '' })
  const [downloading, setDownloading] = useState<string | null>(null)

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setMeta((m) => ({ ...m, [e.target.name]: e.target.value }))

  const handleDownload = async (id: string) => {
    setDownloading(id)
    try {
      await generateBlankTemplate(id, meta)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="tool-page space-y-4">
      <div className="tool-header flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <span className="text-2xl">📄</span>
        </div>
        <div>
          <h1 className="text-xl font-bold">Blank Templates</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Download ready-to-use PDF templates for your classroom
          </p>
        </div>
      </div>

      <div className="tool-form space-y-4" style={{ marginBottom: 24 }}>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
          Optional: Add your school details to all templates
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput
            label="School Name"
            placeholder="e.g. Sunshine Secondary School"
            value={meta.schoolName}
            onChange={(v) => setMeta((p) => ({ ...p, schoolName: v }))}
          />
          <ToolInput
            label="Class Teacher"
            placeholder="Your name"
            value={meta.classTeacher}
            onChange={(v) => setMeta((p) => ({ ...p, classTeacher: v }))}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
            <select
              className="teacher-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              name="term"
              value={meta.term}
              onChange={handle}
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
      </div>

      <div className="space-y-3">
        {TEMPLATES.map((t) => (
          <div
            key={t.id}
            className="tt-template-card flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-indigo-500 transition-colors"
          >
            <div className="text-2xl flex-shrink-0">{t.icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 dark:text-gray-100">{t.title}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.desc}</p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex-shrink-0"
              onClick={() => handleDownload(t.id)}
              disabled={downloading === t.id}
            >
              <FileDown size={16} />
              {downloading === t.id ? 'Downloading...' : 'Download'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
