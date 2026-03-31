'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import ProgressWidget from '@/components/ProgressWidget'
import { useRouter } from 'next/navigation'
import { useProgress } from '@/hooks/useProgress'
import { groupCbtApi, type GroupCBTSession } from '@/lib/api/groupCbtApi'
import { getSubjectsForExam } from '@/lib/data/examSyllabi'
import { toast } from 'react-hot-toast'
import { FiLoader, FiPlay, FiUsers } from 'react-icons/fi'

const EXAM_OPTIONS = [
  { value: 'utme', label: 'JAMB / UTME' },
  { value: 'wassce', label: 'WAEC / WASSCE' },
  { value: 'neco', label: 'NECO' },
  { value: 'bece', label: 'BECE' },
]

export default function GroupCBTPage() {
  const router = useRouter()
  const { refetch } = useProgress()
  const [sessions, setSessions] = useState<GroupCBTSession[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<GroupCBTSession | null>(null)
  const [pollBusy, setPollBusy] = useState(false)

  const [createForm, setCreateForm] = useState({
    name: '',
    subject: 'mathematics',
    examType: 'utme',
    year: 'any',
    questionCount: 10,
  })
  const [inviteInput, setInviteInput] = useState('')

  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await groupCbtApi.list()
      setSessions(data.sessions || [])
    } catch {
      toast.error('Could not load groups')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshActive = useCallback(async (id: string) => {
    setPollBusy(true)
    try {
      const { data } = await groupCbtApi.get(id)
      setActive(data.session)
      await refetch()
    } catch {
      toast.error('Could not refresh session')
    } finally {
      setPollBusy(false)
    }
  }, [refetch])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (!active?._id) return
    if (active.status !== 'open' && active.status !== 'in_progress') return
    const id = active._id
    const t = setInterval(() => void refreshActive(id), 5000)
    return () => clearInterval(t)
  }, [active?._id, active?.status, refreshActive])

  const subjects = useMemo(() => {
    try {
      return getSubjectsForExam('JAMB')
    } catch {
      return ['mathematics', 'english', 'physics', 'chemistry', 'biology']
    }
  }, [])

  const openSession = async (s: GroupCBTSession) => {
    setActive(s)
    setQIndex(0)
    setAnswers({})
    await refreshActive(s._id)
  }

  const createGroup = async () => {
    try {
      const { data } = await groupCbtApi.create({
        name: createForm.name,
        subject: createForm.subject,
        examType: createForm.examType,
        year: createForm.year || 'any',
        questionCount: createForm.questionCount,
      })
      toast.success('Group created')
      await loadList()
      await openSession(data.session)
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Create failed')
    }
  }

  const joinGroup = async () => {
    try {
      const { data } = await groupCbtApi.join({ inviteCode: inviteInput.trim() })
      toast.success('Joined group')
      setInviteInput('')
      await loadList()
      await openSession(data.session)
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Join failed')
    }
  }

  const startSession = async () => {
    if (!active) return
    try {
      const { data } = await groupCbtApi.start(active._id)
      toast.success('Session started — CBT locked in for everyone')
      setActive(data.session)
      setQIndex(0)
      setAnswers({})
      void refetch()
      await loadList()
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Start failed — check ALOC/subject')
    }
  }

  const submitQuiz = async () => {
    if (!active?.questionsForClient?.length) return
    const payload = active.questionsForClient.map((_, idx) => ({
      questionIndex: idx,
      selectedAnswer: answers[idx] || '',
    }))
    try {
      const { data } = await groupCbtApi.submit(active._id, { answers: payload, timeTaken: 0 })
      toast.success(`Score: ${data.score?.correct ?? 0}/${data.score?.total ?? 0}`)
      setActive(data.session)
      await refetch()
      await refreshActive(active._id)
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Submit failed')
    }
  }

  const questions = active?.questionsForClient || []
  const current = questions[qIndex]

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <BackButton href="/dashboard/student" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Group CBT</h1>
          </div>
          <div className="hidden sm:block shrink-0">
            <ProgressWidget onViewFull={() => router.push('/community')} />
          </div>
        </div>

        {!active ? (
          <>
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800/60 space-y-4">
              <h2 className="font-bold flex items-center gap-2"><FiUsers /> My groups</h2>
              {loading ? (
                <p className="text-gray-500 flex items-center gap-2"><FiLoader className="animate-spin" /> Loading…</p>
              ) : (
                <ul className="space-y-2">
                  {sessions.map((s) => (
                    <li key={s._id}>
                      <button type="button" onClick={() => void openSession(s)} className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-600 px-4 py-3 hover:border-indigo-400 flex justify-between gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                        <span className="text-xs uppercase text-gray-500">{s.status.replace('_', ' ')}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!loading && sessions.length === 0 ? <p className="text-sm text-gray-500">No groups yet. Create or join one below.</p> : null}
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800/60 space-y-3">
                <h2 className="font-bold">Create group</h2>
                <input placeholder="Group name" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
                <select value={createForm.subject} onChange={(e) => setCreateForm((f) => ({ ...f, subject: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900">
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select value={createForm.examType} onChange={(e) => setCreateForm((f) => ({ ...f, examType: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900">
                  {EXAM_OPTIONS.map((e) => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
                <input placeholder="Year or any" value={createForm.year} onChange={(e) => setCreateForm((f) => ({ ...f, year: e.target.value }))} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900" />
                <label className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  Questions
                  <input type="number" min={5} max={40} value={createForm.questionCount} onChange={(e) => setCreateForm((f) => ({ ...f, questionCount: parseInt(e.target.value, 10) || 10 }))} className="w-20 rounded border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-900" />
                </label>
                <button type="button" onClick={() => void createGroup()} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold">Create</button>
              </section>

              <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800/60 space-y-3">
                <h2 className="font-bold">Join with code</h2>
                <input placeholder="Invite code" value={inviteInput} onChange={(e) => setInviteInput(e.target.value.toUpperCase())} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-900 uppercase font-mono" />
                <button type="button" onClick={() => void joinGroup()} className="w-full py-3 rounded-xl border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold">Join group</button>
              </section>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setActive(null)} className="text-sm text-indigo-600 font-semibold">← All groups</button>
              {pollBusy ? <span className="text-xs text-gray-400">Syncing…</span> : null}
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800/60 space-y-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{active.name}</h2>
              <p className="text-sm text-gray-500">Code: <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{active.inviteCode}</span> · {active.subject} · {active.examType} · {active.status}</p>

              {active.status === 'open' && (
                <>
                  <ul className="text-sm space-y-1">
                    {active.members?.map((m) => (
                      <li key={m.userId}>{m.name} {m.completed ? '✓' : '…'}</li>
                    ))}
                  </ul>
                  {active.isCreator ? (
                    <button type="button" onClick={() => void startSession()} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold">
                      <FiPlay /> Start CBT for everyone
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">Waiting for host to start…</p>
                  )}
                </>
              )}

              {active.status === 'in_progress' && (
                <>
                  <div className="text-sm mb-2">
                    <span className="font-semibold">Progress:</span>{' '}
                    {active.members?.filter((m) => m.completed).length ?? 0}/{active.members?.length ?? 0} done
                  </div>
                  {active.myMember?.completed ? (
                    <p className="text-emerald-600 font-medium">You finished. Waiting for others…</p>
                  ) : questions.length ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">Question {qIndex + 1} / {questions.length}</p>
                      {current ? (
                        <>
                          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{current.question}</p>
                          <div className="grid gap-2">
                            {current.options.map((opt, i) => {
                              const letter = String.fromCharCode(97 + i)
                              const sel = answers[qIndex] === letter
                              return (
                                <button
                                  key={letter}
                                  type="button"
                                  onClick={() => setAnswers((a) => ({ ...a, [qIndex]: letter }))}
                                  className={`text-left rounded-xl border px-4 py-3 text-sm ${sel ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' : 'border-gray-200 dark:border-gray-600'}`}
                                >
                                  <span className="font-bold mr-2">{letter.toUpperCase()}.</span>
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                          <div className="flex gap-2">
                            <button type="button" disabled={qIndex === 0} onClick={() => setQIndex((x) => Math.max(0, x - 1))} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40">Back</button>
                            {qIndex < questions.length - 1 ? (
                              <button type="button" onClick={() => setQIndex((x) => x + 1)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Next</button>
                            ) : (
                              <button type="button" onClick={() => void submitQuiz()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold">Submit all</button>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading questions…</p>
                  )}
                </>
              )}

              {active.status === 'completed' && active.leaderboard?.length ? (
                <div className="mt-4">
                  <h3 className="font-bold mb-2">Leaderboard</h3>
                  <ol className="space-y-2">
                    {active.leaderboard.map((row) => (
                      <li key={row.userId} className="flex justify-between rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm">
                        <span>#{row.rank} {row.name}</span>
                        <span>{row.accuracy}% ({row.score})</span>
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs text-gray-500 mt-2">Top 3 earn a bonus XP reward.</p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
