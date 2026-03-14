'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ToolInput, ToolGenerateBtn, Section, downloadText } from '../_components/shared'
import { apiClient } from '@/lib/api/client'
import { triggerUpgradeModal } from '@/lib/upgradeHandler'

export default function LessonNotePage() {
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ subject: '', topic: '', classLevel: '', duration: 40 })
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedId = searchParams.get('saved')
    const type = searchParams.get('type')
    if (!savedId || type !== 'lesson_note') return
    apiClient.get(`/teacher-tools/saved/${type}/${savedId}`).then((res) => {
      const item = res.data?.item
      if (item?.content) {
        setResult(item.content as Record<string, unknown>)
        if (item.meta?.subject) setForm((f) => ({ ...f, subject: String(item.meta.subject) }))
        if (item.meta?.topic) setForm((f) => ({ ...f, topic: String(item.meta.topic) }))
        if (item.meta?.classLevel) setForm((f) => ({ ...f, classLevel: String(item.meta.classLevel) }))
      }
    }).catch(() => {})
  }, [searchParams])

  const generate = async () => {
    if (!form.subject || !form.topic || !form.classLevel) {
      setError('Subject, topic and class are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await apiClient.post('/teacher-tools/lesson-note', form)
      const data = res.data
      if (data.success) setResult(data.note as Record<string, unknown>)
      else setError(data.error || 'Failed')
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { showUpgrade?: boolean } } }
      if (e.response?.status === 403 && e.response?.data?.showUpgrade) {
        triggerUpgradeModal('teacher')
      } else {
        setError((e as Error).message || 'Something went wrong')
      }
    } finally {
      setLoading(false)
    }
  }

  const downloadLessonNote = () => {
    if (!result) return
    let out = `LESSON NOTE\n${'='.repeat(40)}\n`
    out += `Subject: ${form.subject}\nTopic: ${form.topic}\nClass: ${form.classLevel}\nDuration: ${form.duration} mins\n\n`
    out += `OBJECTIVES:\n${(result.objectives as string[])?.map((o) => `- ${o}`).join('\n') || ''}\n\n`
    out += `PREVIOUS KNOWLEDGE:\n${result.previousKnowledge || ''}\n\n`
    out += `MATERIALS:\n${(result.materials as string[])?.map((m) => `- ${m}`).join('\n') || ''}\n\n`
    out += `INTRODUCTION:\n${result.introduction || ''}\n\n`
    ;(result.steps as Array<{ title: string; teacherActivity: string; studentActivity: string; content?: string }>)?.forEach(
      (s) => {
        out += `${s.title}\nTeacher: ${s.teacherActivity}\nStudents: ${s.studentActivity}\n${s.content || ''}\n\n`
      }
    )
    out += `EVALUATION:\n${(result.evaluation as string[])?.map((q, i) => `${i + 1}. ${q}`).join('\n') || ''}\n\n`
    out += `ASSIGNMENT:\n${result.assignment || ''}\n`
    downloadText(out, `Lesson Note - ${form.topic}.txt`)
  }

  if (result) {
    return (
      <div className="tool-page space-y-4">
        <div className="result-actions flex gap-2 flex-wrap">
          <button
            type="button"
            className="result-back-btn px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg font-semibold text-sm"
            onClick={() => setResult(null)}
          >
            ← New Note
          </button>
          <span className="px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">Saved on site</span>
          <button
            type="button"
            className="result-download-btn px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm"
            onClick={downloadLessonNote}
          >
            Download (.txt)
          </button>
        </div>

        <div className="lesson-note-output bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-2">
            {form.subject} — {form.topic}
          </h2>
          <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mb-5">
            <span>Class: {form.classLevel}</span>
            <span>Duration: {form.duration} mins</span>
          </div>

          <Section title="Objectives">
            <ul className="list-disc pl-5 space-y-1">
              {(result.objectives as string[])?.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </Section>
          <Section title="Previous Knowledge">{String(result.previousKnowledge || '')}</Section>
          <Section title="Materials">
            <ul className="list-disc pl-5 space-y-1">
              {(result.materials as string[])?.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </Section>
          <Section title="Introduction">{String(result.introduction || '')}</Section>

          {(result.steps as Array<{ title: string; teacherActivity: string; studentActivity: string; content?: string }>)?.map((step, i) => (
            <div key={i} className="lesson-step bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-3 border border-gray-100 dark:border-gray-700">
              <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">{step.title}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <strong className="text-xs uppercase text-gray-500">Teacher Activity</strong>
                  <p className="mt-1">{step.teacherActivity}</p>
                </div>
                <div>
                  <strong className="text-xs uppercase text-gray-500">Student Activity</strong>
                  <p className="mt-1">{step.studentActivity}</p>
                </div>
              </div>
              {step.content && <p className="mt-3 text-sm">{step.content}</p>}
            </div>
          ))}

          <Section title="Class Activity">{String(result.classActivity || '')}</Section>
          <Section title="Evaluation Questions">
            <ol className="list-decimal pl-5 space-y-1">
              {(result.evaluation as string[])?.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </Section>
          <Section title="Assignment">{String(result.assignment || '')}</Section>
          <Section title="Conclusion">{String(result.conclusion || '')}</Section>
        </div>
      </div>
    )
  }

  return (
    <div className="tool-page space-y-4">
      <div className="tool-header flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <span className="text-2xl">📝</span>
        </div>
        <div>
          <h1 className="text-xl font-bold">Lesson Note Generator</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Generate full lesson notes from topic name</p>
        </div>
      </div>

      <div className="tool-form space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput label="Subject *" placeholder="e.g. Biology, English Language" value={form.subject} onChange={(v) => setForm((p) => ({ ...p, subject: v }))} />
          <ToolInput label="Topic *" placeholder="e.g. Photosynthesis, Comprehension" value={form.topic} onChange={(v) => setForm((p) => ({ ...p, topic: v }))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToolInput label="Class / Level *" placeholder="e.g. SS2, JSS1, Primary 5" value={form.classLevel} onChange={(v) => setForm((p) => ({ ...p, classLevel: v }))} />
          <ToolInput label="Duration (minutes)" type="number" value={form.duration} onChange={(v) => setForm((p) => ({ ...p, duration: parseInt(v) || 40 }))} />
        </div>
        {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">{error}</div>}
        <ToolGenerateBtn loading={loading} onClick={generate} label="Generate Lesson Note" />
      </div>
    </div>
  )
}
