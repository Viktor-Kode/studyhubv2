'use client'

import { useCallback, useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { useAuthStore } from '@/lib/store/authStore'
import { progressApi } from '@/lib/api/progressApi'
import { useProgress } from '@/hooks/useProgress'
import { BADGES, badgeCounterProgress } from '@/lib/config/gamification'
import { generateShareCard, shareToTwitter, shareToWhatsApp } from '@/lib/utils/shareCard'
import { Crown, Lock, Trophy, Share2, Link as LinkIcon, Flame, Zap } from 'lucide-react'

type BoardRow = {
  rank: number
  userId: string
  isMe?: boolean
  name: string
  examType?: string | null
  weeklyXP: number
  totalXP: number
  level: number
  levelName: string
  streak: number
  badges: { id: string; name: string; icon: string }[]
}

const EXAM_FILTERS = ['JAMB', 'WAEC', 'NECO', 'POST_UTME', 'BECE'] as const

const SUBJECT_FILTERS = [
  'Mathematics',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Government',
  'Literature',
  'Geography',
  'Commerce',
  'Accounting',
  'Agriculture',
]

export default function CommunityPage() {
  const { user } = useAuthStore()
  const { progress, loading: progLoading } = useProgress()
  const [tab, setTab] = useState<'leaderboard' | 'badges' | 'share'>('leaderboard')
  const [filter, setFilter] = useState<'all' | 'exam' | 'subject'>('all')
  const [examSubject, setExamSubject] = useState<string>('JAMB')
  const [subjectPick, setSubjectPick] = useState<string>('Mathematics')
  const [leaderboard, setLeaderboard] = useState<BoardRow[]>([])
  const [myRank, setMyRank] = useState(0)
  const [myWeeklyXP, setMyWeeklyXP] = useState(0)
  const [lbLoading, setLbLoading] = useState(true)
  const [cardUrl, setCardUrl] = useState<string | null>(null)
  const [copyOk, setCopyOk] = useState(false)

  const loadBoard = useCallback(async () => {
    setLbLoading(true)
    try {
      const params: { filter?: string; subject?: string } = {}
      if (filter === 'exam') {
        params.filter = 'exam'
        params.subject = examSubject
      } else if (filter === 'subject') {
        params.filter = 'subject'
        params.subject = subjectPick
      }
      const res = await progressApi.getLeaderboard(params)
      const d = res.data as { leaderboard: BoardRow[]; myRank: number; myWeeklyXP: number }
      setLeaderboard(d.leaderboard || [])
      setMyRank(d.myRank || 0)
      setMyWeeklyXP(d.myWeeklyXP ?? 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLbLoading(false)
    }
  }, [filter, examSubject, subjectPick])

  useEffect(() => {
    void loadBoard()
  }, [loadBoard])

  useEffect(() => {
    const t = setInterval(() => void loadBoard(), 60000)
    return () => clearInterval(t)
  }, [loadBoard])

  useEffect(() => {
    if (!progress || tab !== 'share') return
    const url = generateShareCard(progress, user?.name || 'Student', myRank > 0 ? myRank : null)
    setCardUrl(url)
  }, [progress, tab, user?.name, myRank])

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)
  const meInList = leaderboard.some((r) => r.isMe)
  const shareText = progress
    ? `I'm ${progress.levelInfo?.name} (Level ${progress.level}) on StudyHelp with ${progress.xp.toLocaleString()} XP and a ${progress.streak}-day streak! 🎓 Join me: https://studyhubv2-self.vercel.app`
    : 'Study with me on StudyHelp — https://studyhubv2-self.vercel.app'

  const referral =
    typeof window !== 'undefined' && user?.uid
      ? `${window.location.origin}/auth/login?ref=${encodeURIComponent(user.uid)}`
      : ''

  const copyReferral = async () => {
    if (!referral) return
    try {
      await navigator.clipboard.writeText(referral)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 2000)
    } catch {
      // ignore
    }
  }

  const podiumColors = [
    'from-amber-400 to-amber-600 ring-amber-200',
    'from-slate-300 to-slate-500 ring-slate-200',
    'from-orange-300 to-orange-600 ring-orange-200',
  ]

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 py-6 px-4 pb-28 max-w-4xl mx-auto">
        <BackButton label="Back to dashboard" href="/dashboard/student" />

        <div className="flex items-center gap-3 mt-2 mb-6">
          <div className="p-3 rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-violet-600">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Community</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Leaderboard, badges & share cards</p>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-white dark:bg-gray-900 border border-[#E8EAED] dark:border-gray-700 mb-6">
          {(
            [
              ['leaderboard', 'Leaderboard'],
              ['badges', 'My Badges'],
              ['share', 'Share'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition ${
                tab === id
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="text-sm font-semibold rounded-lg border border-[#E8EAED] dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
              >
                <option value="all">All students</option>
                <option value="exam">By exam</option>
                <option value="subject">By subject</option>
              </select>
              {filter === 'exam' && (
                <select
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value)}
                  className="text-sm font-semibold rounded-lg border border-[#E8EAED] dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                >
                  {EXAM_FILTERS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              )}
              {filter === 'subject' && (
                <select
                  value={subjectPick}
                  onChange={(e) => setSubjectPick(e.target.value)}
                  className="text-sm font-semibold rounded-lg border border-[#E8EAED] dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                >
                  {SUBJECT_FILTERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {lbLoading ? (
              <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : (
              <>
                {top3.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 md:gap-4 items-end pt-4">
                    {[1, 0, 2].map((slot) => {
                      const row = top3[slot]
                      if (!row) return <div key={slot} />
                      const order = slot === 1 ? 1 : slot === 0 ? 0 : 2
                      const h = order === 0 ? 'h-36 md:h-44' : order === 1 ? 'h-28 md:h-36' : 'h-24 md:h-32'
                      return (
                        <div
                          key={row.userId}
                          className={`rounded-2xl p-4 text-center text-white bg-gradient-to-b shadow-lg ring-2 ${podiumColors[order]} ${
                            row.isMe ? 'ring-violet-500 ring-offset-2' : ''
                          } ${h} flex flex-col justify-end`}
                        >
                          <Crown className="w-6 h-6 mx-auto mb-1 opacity-90" />
                          <p className="text-xs font-bold opacity-90">#{row.rank}</p>
                          <p className="font-black text-sm md:text-base truncate">{row.name}</p>
                          <p className="text-xs opacity-90 flex items-center justify-center gap-1 mt-1">
                            <Zap className="w-3 h-3" /> {row.weeklyXP} XP
                          </p>
                          <p className="text-[10px] opacity-80 mt-0.5">
                            {row.levelName} · 🔥{row.streak}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="rounded-2xl border border-[#E8EAED] dark:border-gray-700 bg-white dark:bg-gray-900 divide-y divide-[#E8EAED] dark:divide-gray-700 overflow-hidden">
                  {rest.map((row) => (
                    <div
                      key={row.userId}
                      className={`flex items-center gap-3 px-4 py-3 text-sm ${
                        row.isMe ? 'bg-violet-50 dark:bg-violet-950/40 border-l-4 border-violet-600' : ''
                      }`}
                    >
                      <span className="w-8 font-black text-slate-400">#{row.rank}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{row.name}</p>
                        <p className="text-xs text-slate-500">
                          {row.levelName} · L{row.level}
                          {row.examType ? ` · ${row.examType}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-violet-600">
                        <Zap className="w-3.5 h-3.5" />
                        {row.weeklyXP}
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-600 text-xs font-bold">
                        <Flame className="w-3.5 h-3.5" />
                        {row.streak}
                      </div>
                      <div className="flex gap-0.5">
                        {row.badges.map((b) => (
                          <span key={b.id} title={b.name}>
                            {b.icon}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {leaderboard.length === 0 && (
                    <p className="p-8 text-center text-slate-500 text-sm">No rankings yet this week.</p>
                  )}
                </div>

                {progress && !progLoading && !meInList && (
                  <div className="sticky bottom-4 z-20 rounded-2xl border-2 border-violet-500 bg-white dark:bg-gray-900 shadow-xl p-4 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-xs font-bold text-violet-600 uppercase">You</p>
                      <p className="font-black text-slate-900 dark:text-white">{user?.name || 'Student'}</p>
                      <p className="text-xs text-slate-500">
                        Weekly XP: {myWeeklyXP} · Rank: {myRank > 0 ? `#${myRank}` : 'Not in top list'}
                      </p>
                    </div>
                    <div className="flex gap-2 text-sm font-bold text-violet-600">
                      <Zap className="w-4 h-4" />
                      {progress.xp} total XP
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tab === 'badges' && progress && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BADGES.map((def) => {
              const earned = progress.badges.find((b) => b.id === def.id)
              const counter = badgeCounterProgress(def.id, {
                xp: progress.xp,
                streak: progress.streak,
                totalQuestionsAnswered: progress.totalQuestionsAnswered,
                totalTopicsStudied: progress.totalTopicsStudied,
                totalCBTDone: progress.totalCBTDone,
                highScoreCBTCount: progress.highScoreCBTCount,
                level: progress.level,
              })
              return (
                <div
                  key={def.id}
                  className={`rounded-2xl border p-4 ${
                    earned
                      ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800'
                      : 'border-[#E8EAED] dark:border-gray-700 bg-white dark:bg-gray-900 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-3xl shrink-0 ${earned ? '' : 'opacity-35 grayscale'}`}
                      aria-hidden
                    >
                      {def.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 dark:text-white">{def.name}</h3>
                        {!earned && <Lock className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{def.description}</p>
                      {earned?.earnedAt && (
                        <p className="text-[10px] text-slate-500 mt-2">
                          Earned {new Date(earned.earnedAt).toLocaleDateString()}
                        </p>
                      )}
                      {!earned && counter && (
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>{counter.label}</span>
                            <span>{Math.round(counter.pct)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full transition-all"
                              style={{ width: `${counter.pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'badges' && progLoading && <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />}

        {tab === 'share' && (
          <div className="space-y-6">
            {!progress || progLoading ? (
              <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : (
              <>
                <div className="rounded-2xl border border-[#E8EAED] dark:border-gray-700 bg-white dark:bg-gray-900 p-4 overflow-hidden">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Your share card</p>
                  {cardUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cardUrl} alt="StudyHelp progress card" className="w-full max-w-lg mx-auto rounded-xl shadow-lg" />
                  ) : (
                    <p className="text-sm text-slate-500">Generating…</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => shareToWhatsApp(shareText)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => shareToTwitter(shareText)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold"
                  >
                    <Share2 className="w-4 h-4" />
                    X / Twitter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(shareText)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8EAED] dark:border-gray-600 text-sm font-bold"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Copy message
                  </button>
                  {cardUrl && (
                    <a
                      href={cardUrl}
                      download="studyhelp-card.png"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold"
                    >
                      Download PNG
                    </a>
                  )}
                </div>

                <div className="rounded-2xl border border-[#E8EAED] dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-3">
                  <h3 className="font-black text-slate-900 dark:text-white">Refer a friend</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Share your link — when they sign up, you can track referrals with the ref code in the URL.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      readOnly
                      value={referral}
                      className="flex-1 text-xs font-mono rounded-lg border border-[#E8EAED] dark:border-gray-600 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => void copyReferral()}
                      className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold"
                    >
                      {copyOk ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => shareToWhatsApp(`Join me on StudyHelp: ${referral}`)}
                      className="text-sm font-bold text-emerald-600"
                    >
                      Share on WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => shareToTwitter(`Join me on StudyHelp: ${referral}`)}
                      className="text-sm font-bold text-slate-700 dark:text-slate-300"
                    >
                      Share on X
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
