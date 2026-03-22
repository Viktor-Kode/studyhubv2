'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import {
  SYLLABUS_SUBJECTS,
  getTopicsForExam,
  progressStorageKey,
  readTopicProgress,
  type SyllabusExamKey,
  type SyllabusSubjectKey,
} from '@/lib/data/syllabus'
import { FiArrowLeft, FiBook, FiCheckCircle, FiMessageCircle } from 'react-icons/fi'
import { HiOutlineAcademicCap } from 'react-icons/hi'

const EXAMS: {
  key: SyllabusExamKey
  label: string
  short: string
  icon: string
  border: string
  bg: string
  text: string
}[] = [
  {
    key: 'jamb',
    label: 'JAMB / UTME',
    short: 'JAMB',
    icon: '🎓',
    border: 'border-[#5B4CF5]',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-700 dark:text-violet-300',
  },
  {
    key: 'waec',
    label: 'WAEC (SSCE)',
    short: 'WAEC',
    icon: '📚',
    border: 'border-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    key: 'neco',
    label: 'NECO',
    short: 'NECO',
    icon: '📝',
    border: 'border-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
  },
  {
    key: 'postutme',
    label: 'Post-UTME',
    short: 'Post-UTME',
    icon: '🏫',
    border: 'border-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-700 dark:text-orange-300',
  },
]

const CARD =
  'rounded-[14px] border-[1.5px] border-[#E8EAED] dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm'

export default function SyllabusStudyPage() {
  const router = useRouter()
  const [exam, setExam] = useState<SyllabusExamKey | null>(null)
  const [subject, setSubject] = useState<SyllabusSubjectKey | null>(null)
  const [step, setStep] = useState<'pick' | 'topics'>('pick')

  const topics = useMemo(() => {
    if (!exam || !subject) return []
    return getTopicsForExam(exam, subject)
  }, [exam, subject])

  const subjectLabel = SYLLABUS_SUBJECTS.find((s) => s.key === subject)?.label ?? ''

  const goTopic = (topic: string, tab: 'tutor' | 'practice') => {
    if (!exam || !subject) return
    const q = new URLSearchParams({
      exam,
      subject,
      topic,
      tab,
    })
    router.push(`/dashboard/student/cbt/syllabus/topic?${q.toString()}`)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 py-6 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <BackButton label="Back to CBT" href="/dashboard/cbt" />

          {step === 'pick' && (
            <>
              <div className={`${CARD} p-6`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600">
                    <HiOutlineAcademicCap className="text-2xl" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Study by Topic</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Pick an exam and subject, then work through syllabus topics with AI + practice.
                    </p>
                  </div>
                </div>

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Exam</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                  {EXAMS.map((e) => (
                    <button
                      key={e.key}
                      type="button"
                      onClick={() => setExam(e.key)}
                      className={`${CARD} p-4 text-left transition hover:shadow-md ${
                        exam === e.key ? `ring-2 ring-offset-2 ring-offset-[#F7F8FA] dark:ring-offset-slate-950 ${e.border}` : ''
                      } ${e.bg}`}
                    >
                      <span className="text-2xl mb-2 block">{e.icon}</span>
                      <span className={`font-bold text-sm ${e.text}`}>{e.label}</span>
                    </button>
                  ))}
                </div>

                {exam && (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Subject</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {SYLLABUS_SUBJECTS.map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => setSubject(s.key)}
                          className={`px-3 py-2 rounded-full text-sm font-medium border-[1.5px] transition ${
                            subject === s.key
                              ? 'border-[#5B4CF5] bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-200'
                              : 'border-[#E8EAED] dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {exam && subject && (
                  <button
                    type="button"
                    onClick={() => setStep('topics')}
                    className="w-full py-3.5 rounded-[14px] bg-[#5B4CF5] hover:bg-violet-600 text-white font-semibold transition"
                  >
                    View Syllabus
                  </button>
                )}
              </div>
            </>
          )}

          {step === 'topics' && exam && subject && (
            <div className={`${CARD} overflow-hidden`}>
              <div className="p-4 border-b border-[#E8EAED] dark:border-gray-700 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('pick')}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600"
                  aria-label="Back"
                >
                  <FiArrowLeft className="text-lg" />
                </button>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-900/50 text-violet-800 dark:text-violet-200 uppercase">
                  {EXAMS.find((e) => e.key === exam)?.short}
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex-1">{subjectLabel}</h2>
              </div>
              <ul className="divide-y divide-[#E8EAED] dark:divide-gray-700">
                {topics.map((topic) => {
                  const key = progressStorageKey(exam, subject, topic)
                  const prog = readTopicProgress(key)
                  const studied = (prog?.attempted ?? 0) > 0
                  return (
                    <li
                      key={topic}
                      className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {studied ? (
                          <FiCheckCircle className="text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <FiBook className="text-gray-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white">{topic}</p>
                          {prog && prog.attempted > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {prog.attempted} practice attempt{prog.attempted === 1 ? '' : 's'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => goTopic(topic, 'practice')}
                          className="px-3 py-2 rounded-[10px] text-sm font-semibold bg-[#5B4CF5] text-white hover:bg-violet-600 transition"
                        >
                          Practice
                        </button>
                        <button
                          type="button"
                          onClick={() => goTopic(topic, 'tutor')}
                          className="px-3 py-2 rounded-[10px] text-sm font-semibold border-[1.5px] border-[#E8EAED] dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5"
                        >
                          <FiMessageCircle />
                          Ask Tutor
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
