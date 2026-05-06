'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { useAuthStore } from '@/lib/store/authStore'
import { progressApi } from '@/lib/api/progressApi'
import { useProgress } from '@/hooks/useProgress'
import LeaderboardPanel, { type BoardRow } from '@/components/community/LeaderboardPanel'
import BadgesPanel from '@/components/community/BadgesPanel'
import SharePanel from '@/components/community/SharePanel'
import { Trophy, Award, Share2, Medal } from 'lucide-react'

export default function CommunityPage() {
  const { user } = useAuthStore()
  const { progress, loading: progLoading } = useProgress()
  const [tab, setTab] = useState<'leaderboard' | 'badges' | 'share'>('leaderboard')
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'lifetime'>('today')
  const [leaderboard, setLeaderboard] = useState<BoardRow[]>([])
  const [myRank, setMyRank] = useState(0)
  const [myWeeklyXP, setMyWeeklyXP] = useState(0)
  const [lbLoading, setLbLoading] = useState(true)

  const loadBoard = useCallback(async () => {
    setLbLoading(true)
    try {
      const params = { timeframe }
      const res = await progressApi.getLeaderboard(params)
      const d = res.data as { leaderboard: BoardRow[]; myRank: number; myDisplayXP: number }
      setLeaderboard(d.leaderboard || [])
      setMyRank(d.myRank || 0)
      setMyWeeklyXP(d.myDisplayXP ?? 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLbLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    void loadBoard()
  }, [loadBoard])

  useEffect(() => {
    const t = setInterval(() => void loadBoard(), 60000)
    return () => clearInterval(t)
  }, [loadBoard])

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen py-8 px-4 pb-28 max-w-5xl mx-auto overflow-hidden transition-colors">
        <div className="mb-6">
            <BackButton label="Back" href="/dashboard/student" />
        </div>

        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20" />
                <div className="relative p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-blue-500 shadow-sm">
                    <Trophy className="w-6 h-6" />
                </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none mb-1">
                Leaderboard
              </h1>
              <p className="text-xs font-bold text-slate-400">
                Track your progress & earn rewards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-x-auto no-scrollbar">
            {(
              [
                ['leaderboard', 'Ranking', Medal],
                ['badges', 'Badges', Award],
                ['share', 'Share', Share2],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`relative flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap ${
                  tab === id ? 'text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {tab === id && (
                    <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                )}
                <Icon className={`w-3.5 h-3.5 relative z-10 ${tab === id ? 'animate-pulse' : ''}`} />
                <span className="relative z-10">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {tab === 'leaderboard' && (
              <LeaderboardPanel
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                leaderboard={leaderboard}
                lbLoading={lbLoading}
                myRank={myRank}
                myWeeklyXP={myWeeklyXP}
                progress={progress}
                progLoading={progLoading}
                user={user}
              />
            )}

            {tab === 'badges' && (
              <div className="space-y-6">
                {progress ? (
                  <BadgesPanel progress={progress} />
                ) : progLoading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="h-48 rounded-[28px] bg-slate-200 dark:bg-slate-800/50 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm px-6">
                    <p className="text-slate-500 font-bold mb-0">Progress could not be loaded.</p>
                    <button onClick={() => window.location.reload()} className="mt-4 text-violet-600 font-black text-sm uppercase tracking-widest">Retry</button>
                  </div>
                )}
              </div>
            )}

            {tab === 'share' && (
              <div className="space-y-6">
                {progress ? (
                   <SharePanel progress={progress} progLoading={progLoading} user={user} myRank={myRank} />
                ) : progLoading ? (
                    <div className="h-96 rounded-[32px] bg-slate-200 dark:bg-slate-800/50 animate-pulse" />
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm px-6">
                        <p className="text-slate-500 font-bold mb-0">Stats could not be loaded.</p>
                        <button onClick={() => window.location.reload()} className="mt-4 text-violet-600 font-black text-sm uppercase tracking-widest">Retry</button>
                    </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  )
}
