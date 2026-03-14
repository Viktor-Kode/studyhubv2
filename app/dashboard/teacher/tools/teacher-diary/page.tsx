'use client'

import { useState } from 'react'
import { FileDown, Loader, Sparkles } from 'lucide-react'
import { generateTeacherDiary, type DiaryEntry } from '@/lib/utils/pdfGenerator'
import { apiClient } from '@/lib/api/client'
import { triggerUpgradeModal } from '@/lib/upgradeHandler'
import { ToolInput } from '../_components/shared'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const emptyEntry = (): DiaryEntry => ({
  subject: '',
  topic: '',
  objectives: '',
  activities: '',
  resources: '',
  remarks: '',
})

export default function TeacherDiaryPage() {
  const [meta, setMeta] = useState({
    schoolName: '',
    classTeacher: '',
    term: '',
    year: '',
    className: '',
    weekNumber: '',
    startDate: '',
  })
  const [entries, setEntries] = useState<DiaryEntry[]>(DAYS.map(() => emptyEntry()))
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const [aiLoading, setAiLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const handleMeta = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setMeta((m) => ({ ...m, [e.target.name]: e.target.value }))

  const updateEntry = (i: number, field: keyof DiaryEntry, value: string) => {
    setEntries((prev) =>
      prev.map((e, idx) => (idx === i ? { ...e, [field]: value } : e))
    )
  }

  const generateAIDiary = async () => {
    setAiLoading(true)
    try {
      const res = await apiClient.post('/teacher-tools/diary', {
        className: meta.className,
        weekNumber: meta.weekNumber,
        entries: entries.map((e, i) => ({
          day: DAYS[i],
          subject: e.subject,
          topic: e.topic,
        })),
      })
      const data = res.data as { entries?: DiaryEntry[] }
      if (data.entries && Array.isArray(data.entries)) setEntries(data.entries)
    } catch (err) {
      console.error(err)
      const e = err as { response?: { status?: number; data?: { showUpgrade?: boolean } } }
      if (e.response?.status === 403 && e.response?.data?.showUpgrade) {
        triggerUpgradeModal('teacher')
      }
    } finally {
      setAiLoading(false)
    }
  }

  const handleDownload = async () => {
    setGenerating(true)
    try {
      await generateTeacherDiary({ ...meta, entries })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="tool-page space-y-4">
      <div className="tool-header flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <span className="text-2xl">📓</span>
        </div>
        <div>
          <h1 className="text-xl font-bold">Teacher&apos;s Diary</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Plan your week and download as PDF
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
          ✨ AI Generate
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
            placeholder="Your name"
            value={meta.classTeacher}
            onChange={(v) => setMeta((p) => ({ ...p, classTeacher: v }))}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ToolInput
            label="Class"
            placeholder="e.g. JSS3B"
            value={meta.className}
            onChange={(v) => setMeta((p) => ({ ...p, className: v }))}
          />
          <ToolInput
            label="Week Number"
            placeholder="e.g. 5"
            value={meta.weekNumber}
            onChange={(v) => setMeta((p) => ({ ...p, weekNumber: v }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Week Start Date</label>
            <input
              type="date"
              className="teacher-input w-full"
              name="startDate"
              value={meta.startDate}
              onChange={handleMeta}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
            <select
              className="teacher-input w-full"
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

        {DAYS.map((day, i) => (
          <div
            key={day}
            className="tt-diary-day rounded-xl border border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-800/50 space-y-3"
          >
            <div className="text-sm font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              {day}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToolInput
                label="Subject"
                placeholder="Subject"
                value={entries[i]?.subject || ''}
                onChange={(v) => updateEntry(i, 'subject', v)}
              />
              <ToolInput
                label="Topic"
                placeholder="Topic"
                value={entries[i]?.topic || ''}
                onChange={(v) => updateEntry(i, 'topic', v)}
              />
            </div>
            <ToolInput
              label="Objectives"
              placeholder="Learning objectives"
              value={entries[i]?.objectives || ''}
              onChange={(v) => updateEntry(i, 'objectives', v)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToolInput
                label="Activities"
                placeholder="Class activities"
                value={entries[i]?.activities || ''}
                onChange={(v) => updateEntry(i, 'activities', v)}
              />
              <ToolInput
                label="Resources"
                placeholder="Materials needed"
                value={entries[i]?.resources || ''}
                onChange={(v) => updateEntry(i, 'resources', v)}
              />
            </div>
          </div>
        ))}

        {mode === 'ai' && (
          <button
            type="button"
            className="w-full py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={generateAIDiary}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Generating diary...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                AI Fill This Week&apos;s Diary
              </>
            )}
          </button>
        )}

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
              Download Diary PDF
            </>
          )}
        </button>
      </div>
    </div>
  )
}
