'use client'

import { Crown, Flame, Zap, TrendingUp, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
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

  return (
    <div className="space-y-6">
      <div className="gw-seg p-1" role="tablist" aria-label="Leaderboard filter">
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
            className={`relative py-2 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
              filter === id
                ? 'text-white shadow-lg'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            data-active={filter === id}
            onClick={() => setFilter(id)}
          >
            {filter === id && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl -z-10"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            {label}
          </button>
        ))}
      </div>

      <div className="gw-pick">
        {filter === 'exam' && (
          <motion.select
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            value={examSubject}
            onChange={(e) => setExamSubject(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold focus:ring-2 focus:ring-violet-500 outline-none"
          >
            {EXAM_FILTERS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </motion.select>
        )}
        {filter === 'subject' && (
          <motion.select
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            value={subjectPick}
            onChange={(e) => setSubjectPick(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold focus:ring-2 focus:ring-violet-500 outline-none"
          >
            {SUBJECT_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </motion.select>
        )}
      </div>

      {lbLoading ? (
        <div className="grid grid-cols-3 gap-4 h-48 mb-8">
          <div className="bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          <div className="bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse transform translate-y-[-10%]" />
          <div className="bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse transform translate-y-[5%]" />
        </div>
      ) : (
        <>
          {top3.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="gw-podium items-end mb-8 pt-4"
            >
              {[1, 0, 2].map((slot) => {
                const row = top3[slot]
                if (!row) return <div key={slot} />
                const order = slot === 1 ? 1 : slot === 0 ? 0 : 2
                return (
                  <motion.div
                    key={row.userId}
                    variants={itemVariants}
                    className={`${podiumClass(order)} ${
                      row.isMe ? 'ring-4 ring-violet-500 ring-offset-4 dark:ring-offset-slate-900' : ''
                    }`}
                  >
                    <div className="relative z-10 flex flex-col items-center">
                      {order === 1 && (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 3 }}
                        >
                          <Crown className="w-10 h-10 mb-2 text-amber-200 drop-shadow-md" />
                        </motion.div>
                      )}
                      {order !== 1 && <div className="h-10 mb-2" />}

                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 border-2 border-white/30 shadow-inner overflow-hidden">
                        {row.userId === user?.uid && user?.avatar ? (
                          <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-2xl">🎓</span>
                        )}
                      </div>

                      <div className="text-center">
                        <p className="text-[10px] font-black tracking-widest uppercase opacity-80">Rank #{row.rank}</p>
                        <p className="font-extrabold text-sm md:text-lg mb-1 drop-shadow-sm truncate w-full px-2">
                          {row.name}
                        </p>
                        <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
                          <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                          {row.weeklyXP.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {rest.map((row, idx) => (
                <motion.div
                  key={row.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group relative overflow-hidden flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                    row.isMe
                      ? 'bg-violet-50/50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 shadow-md ring-1 ring-violet-500'
                      : 'bg-white/70 dark:bg-slate-900/70 border-slate-100 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 backdrop-blur-sm shadow-sm'
                  }`}
                >
                  {/* Decorative background pulse for 'Me' */}
                  {row.isMe && (
                    <div className="absolute inset-0 bg-violet-500/5 animate-pulse pointer-events-none" />
                  )}

                  <div className="flex-shrink-0 w-10 text-center">
                    <span className={`text-lg font-black ${
                      row.isMe ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'
                    }`}>
                      #{row.rank}
                    </span>
                  </div>

                  <div className="relative flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-violet-400 transition-colors">
                    {row.userId === user?.uid && user?.avatar ? (
                      <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-2">
                      {row.name}
                      {row.isMe && (
                          <span className="px-2 py-0.5 bg-violet-600 text-[10px] text-white rounded-full font-black uppercase">You</span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        {row.levelName}
                      </p>
                      <p className="text-xs font-bold text-slate-400">·</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        {row.streak}d
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-400 font-black text-sm">
                      <Zap className="w-4 h-4 fill-current" />
                      {row.weeklyXP}
                    </div>
                    <div className="flex -space-x-1.5 overflow-hidden">
                       {row.badges.slice(0, 3).map((b) => (
                           <div key={b.id} title={b.name} className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-xs shadow-sm">
                               {b.icon}
                           </div>
                       ))}
                       {row.badges.length > 3 && (
                           <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[8px] font-bold text-slate-600 dark:text-slate-300">
                               +{row.badges.length - 3}
                           </div>
                       )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {leaderboard.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800"
              >
                <div className="text-4xl mb-4">🌍</div>
                <p className="text-slate-500 font-bold">No rankings yet this week. Be the first!</p>
              </motion.div>
            )}
          </div>

          {progress && !progLoading && !meInList && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="sticky bottom-6 left-1/2 -ml-[45%] w-[90%] md:ml-0 md:left-0 md:w-full z-40"
            >
              <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-3xl p-5 shadow-2xl flex items-center justify-between gap-4 text-white">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase">Your Rank</span>
                    <ChevronUp className="w-4 h-4 animate-bounce" />
                  </div>
                  <p className="font-extrabold text-xl truncate tracking-tight">{user?.name || 'Student'}</p>
                  <p className="text-xs text-white/70 font-bold flex items-center gap-2">
                    {myRank > 0 ? `#${myRank} overall` : 'Join the competition'}
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    Level {progress.level}
                  </p>
                </div>
                <div className="text-right">
                   <div className="flex items-center gap-2 bg-black/20 p-2 rounded-2xl">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-white/60 uppercase m-0 leading-none">Weekly XP</p>
                        <p className="text-xl font-black m-0 tracking-tight">{myWeeklyXP.toLocaleString()}</p>
                      </div>
                      <Zap className="w-8 h-8 text-yellow-300 fill-yellow-300 drop-shadow-lg" />
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
