'use client'

import { Crown, Flame, Zap } from 'lucide-react'
import type { ProgressPayload } from '@/hooks/useProgress'
import type { AppUser } from '@/lib/types/auth'

export type BoardRow = {
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

type FilterMode = 'all' | 'exam' | 'subject'

type Props = {
  filter: FilterMode
  setFilter: (f: FilterMode) => void
  examSubject: string
  setExamSubject: (s: string) => void
  subjectPick: string
  setSubjectPick: (s: string) => void
  leaderboard: BoardRow[]
  lbLoading: boolean
  myRank: number
  myWeeklyXP: number
  progress: ProgressPayload | null
  progLoading: boolean
  user: AppUser | null
}

export default function LeaderboardPanel({
  filter,
  setFilter,
  examSubject,
  setExamSubject,
  subjectPick,
  setSubjectPick,
  leaderboard,
  lbLoading,
  myRank,
  myWeeklyXP,
  progress,
  progLoading,
  user,
}: Props) {
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)
  const meInList = leaderboard.some((r) => r.isMe)

  const podiumClass = (order: number) => {
    if (order === 1) return 'gw-podium-slot gw-podium-slot--gold'
    if (order === 0) return 'gw-podium-slot gw-podium-slot--silver'
    return 'gw-podium-slot gw-podium-slot--bronze'
  }

  const podiumHeight = (order: number) => {
    if (order === 1) return { minHeight: 168 }
    if (order === 0) return { minHeight: 140 }
    return { minHeight: 120 }
  }

  return (
    <div className="space-y-4">
      <div className="gw-seg" role="tablist" aria-label="Leaderboard filter">
        {(
          [
            ['all', 'All'],
            ['exam', 'By exam'],
            ['subject', 'By subject'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            data-active={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="gw-pick">
        {filter === 'exam' && (
          <select value={examSubject} onChange={(e) => setExamSubject(e.target.value)}>
            {EXAM_FILTERS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        )}
        {filter === 'subject' && (
          <select value={subjectPick} onChange={(e) => setSubjectPick(e.target.value)}>
            {SUBJECT_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </div>

      {lbLoading ? (
        <div className="h-48 rounded-[20px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
      ) : (
        <>
          {top3.length > 0 && (
            <div className="gw-podium">
              {[1, 0, 2].map((slot) => {
                const row = top3[slot]
                if (!row) return <div key={slot} />
                const order = slot === 1 ? 1 : slot === 0 ? 0 : 2
                return (
                  <div
                    key={row.userId}
                    className={`${podiumClass(order)} ${row.isMe ? 'gw-podium-slot--me' : ''}`}
                    style={podiumHeight(order)}
                  >
                    {order === 1 && (
                      <Crown className="gw-crown w-7 h-7 mx-auto mb-1 text-amber-100" aria-hidden />
                    )}
                    {order !== 1 && <div className="h-7 mb-1" aria-hidden />}
                    <p className="text-xs font-bold opacity-90">#{row.rank}</p>
                    <p className="font-black text-sm md:text-base truncate px-1">{row.name}</p>
                    <p className="text-xs opacity-90 flex items-center justify-center gap-1 mt-1">
                      <Zap className="w-3.5 h-3.5" /> {row.weeklyXP} XP
                    </p>
                    <p className="text-[10px] opacity-85 mt-0.5">
                      {row.levelName} · 🔥{row.streak}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Mobile cards */}
          <div className="gw-lb-cards">
            {rest.map((row) => (
              <div
                key={row.userId}
                className={`gw-lb-card ${row.isMe ? 'gw-lb-card--me' : ''}`}
              >
                <div className="gw-lb-card-top">
                  <div>
                    <p className="font-black text-slate-900 dark:text-white truncate">{row.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {row.levelName} · L{row.level}
                      {row.examType ? ` · ${row.examType}` : ''}
                    </p>
                  </div>
                  <span className="gw-lb-rank-big">#{row.rank}</span>
                </div>
                <div className="gw-lb-card-mid">
                  <span className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400">
                    <Zap className="w-4 h-4" />
                    {row.weeklyXP} XP
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Flame className="w-4 h-4" />
                    {row.streak} streak
                  </span>
                </div>
                <div className="gw-lb-badges-row">
                  {row.badges.map((b) => (
                    <span key={b.id} title={b.name}>
                      {b.icon}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="p-8 text-center text-slate-500 text-sm rounded-[20px] bg-white dark:bg-gray-900 border border-[#E8EAED] dark:border-gray-700">
                No rankings yet this week.
              </p>
            )}
          </div>

          {/* Desktop table */}
          <div className="gw-lb-table">
            <div className="gw-lb-thead">
              <span>Rank</span>
              <span>Student</span>
              <span>Weekly XP</span>
              <span>Streak</span>
              <span>Badges</span>
            </div>
            {rest.map((row) => (
              <div
                key={row.userId}
                className={`gw-lb-row ${row.isMe ? 'gw-lb-row--me' : ''}`}
              >
                <span className="font-black text-slate-400">#{row.rank}</span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white truncate">{row.name}</p>
                  <p className="text-xs text-slate-500">
                    {row.levelName} · L{row.level}
                    {row.examType ? ` · ${row.examType}` : ''}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-violet-600 font-bold text-sm">
                  <Zap className="w-4 h-4 shrink-0" />
                  {row.weeklyXP}
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-bold text-sm">
                  <Flame className="w-4 h-4 shrink-0" />
                  {row.streak}
                </span>
                <div className="flex gap-0.5 flex-wrap text-base">
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
            <div className="gw-you-bar">
              <div className="flex-1 min-w-[200px]">
                <p className="text-xs font-bold text-violet-600 uppercase tracking-wide">You</p>
                <p className="font-black text-slate-900 dark:text-white">{user?.name || 'Student'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Weekly XP: {myWeeklyXP} · Rank:{' '}
                  {myRank > 0 ? `#${myRank}` : 'Not in top list'}
                </p>
              </div>
              <div className="flex gap-2 text-sm font-bold text-violet-600 items-center">
                <Zap className="w-5 h-5" />
                {progress.xp.toLocaleString()} total XP
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
