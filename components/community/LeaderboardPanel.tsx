'use client'

import { Trophy, Sparkles, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import type { ProgressPayload } from '@/hooks/useProgress'
import type { AppUser } from '@/lib/types/auth'
import '@/styles/leaderboard-v2.css'

export type BoardRow = {
  rank: number
  userId: string
  isMe?: boolean
  name: string
  avatar?: string | null
  examType?: string | null
  weeklyXP: number
  totalXP: number
  level: number
  levelName: string
  streak: number
  badges: { id: string; name: string; icon: string }[]
  displayXP?: number
}

type TimeframeMode = 'today' | 'lifetime'

type Props = {
  timeframe: TimeframeMode
  setTimeframe: (f: TimeframeMode) => void
  leaderboard: BoardRow[]
  lbLoading: boolean
  myRank: number
  myWeeklyXP: number
  progress: ProgressPayload | null
  progLoading: boolean
  user: AppUser | null
}

export default function LeaderboardPanel({
  timeframe,
  setTimeframe,
  leaderboard,
  lbLoading,
  myRank,
  myWeeklyXP,
  progress,
  progLoading,
  user,
}: Props) {
  return (
    <div className="lb-v2-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center text-center py-20 px-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl my-4"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shadow-xl">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Coming Soon</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          Leaderboard Rankings Coming Soon!
        </h2>

        <p className="text-slate-400 max-w-md text-sm font-medium leading-relaxed mb-6">
          We're finalizing the national student leaderboard. Soon you will be able to compete with peers across Nigeria, track your weekly rank, and win exclusive rewards.
        </p>

        <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-800/60 px-4 py-2 rounded-xl border border-slate-700/50">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Check back in the next update</span>
        </div>
      </motion.div>
    </div>
  )
}
