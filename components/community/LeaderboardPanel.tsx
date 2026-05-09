'use client'

import { Crown, Flame, Zap, ChevronUp, Bell, MapPin, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

type TimeframeMode = 'today' | 'week' | 'lifetime'

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
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3, 10) // Limit to rank 4-10 as per screenshot
  
  // Sort top3 for podium: [2nd, 1st, 3rd]
  const podiumData = [top3[1], top3[0], top3[2]]

  return (
    <div className="lb-v2-container">
      {/* Mini Header / Location - As seen in screenshot */}
      <div className="flex items-center gap-2 mb-6 text-slate-400">
        <MapPin className="w-4 h-4" />
        <span className="text-xs font-bold">Abeokuta, Nigeria</span>
      </div>

      {/* Tabs */}
      <div className="lb-v2-tabs mb-8">
        {[
          { id: 'lifetime', label: 'Global Hall of Fame' },
          { id: 'week', label: 'Weekly Sprints' },
          { id: 'today', label: 'Subject Kings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTimeframe(tab.id as TimeframeMode)}
            className={`lb-v2-tab ${timeframe === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {lbLoading ? (
        <div className="grid grid-cols-3 gap-4 h-48 mb-8">
          <div className="bg-white/5 rounded-3xl animate-pulse" />
          <div className="bg-white/5 rounded-3xl animate-pulse transform -translate-y-4" />
          <div className="bg-white/5 rounded-3xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="lb-v2-podium"
            >
              {podiumData.map((row, idx) => {
                if (!row) return <div key={idx} />
                const isFirst = row.rank === 1
                const isSecond = row.rank === 2
                const isThird = row.rank === 3
                
                return (
                  <motion.div
                    key={row.userId}
                    variants={itemVariants}
                    className={`lb-v2-podium-card ${isFirst ? 'lb-v2-podium-card--1st' : ''} ${isSecond ? 'lb-v2-podium-card--2nd' : ''} ${isThird ? 'lb-v2-podium-card--3rd' : ''}`}
                  >
                    <span className="lb-v2-rank-badge">{row.rank}</span>
                    
                    <div className="lb-v2-avatar-wrap">
                      {isFirst && (
                        <div className="lb-v2-crown">
                          <Crown className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                        </div>
                      )}
                      {row.avatar ? (
                        <img src={row.avatar} className="lb-v2-avatar" alt="" />
                      ) : (
                        <div className="lb-v2-avatar bg-slate-800 flex items-center justify-center text-2xl">
                          👤
                        </div>
                      )}
                      
                      {/* Floating mini crowns for 1st place as seen in screenshot */}
                      {isFirst && (
                         <>
                            <Crown className="absolute -right-2 top-2 w-4 h-4 text-amber-400 fill-amber-400 rotate-12" />
                            <Crown className="absolute -left-2 top-8 w-4 h-4 text-amber-400 fill-amber-400 -rotate-12" />
                         </>
                      )}
                    </div>

                    <p className="lb-v2-name truncate">{row.name}</p>
                    
                    <div className="lb-v2-xp-badge">
                      {isFirst && <Crown className="w-3 h-3" />}
                      {(row.displayXP || row.totalXP).toLocaleString()} XP
                    </div>

                    <div className="lb-v2-badges-row">
                      {row.badges.slice(0, 3).map((b) => (
                        <div key={b.id} className="lb-v2-badge-mini" title={b.name}>
                          {b.icon}
                        </div>
                      ))}
                      {row.badges.length === 0 && (
                        <>
                          <div className="lb-v2-badge-mini">🏆</div>
                          <div className="lb-v2-badge-mini">🛡️</div>
                          <div className="lb-v2-badge-mini">📚</div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* Rank 4-10 Grid */}
          <div className="mb-12">
            <h3 className="lb-v2-list-header">Rank 4-10</h3>
            <div className="lb-v2-grid">
              <AnimatePresence mode="popLayout">
                {rest.map((row, idx) => (
                  <motion.div
                    key={row.userId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="lb-v2-row"
                  >
                    <div className="lb-v2-row-rank">
                      {row.rank}
                    </div>
                    <div className="lb-v2-row-avatar relative">
                      {row.avatar ? (
                         <img src={row.avatar} className="w-full h-full rounded-full object-cover" alt="" />
                      ) : (
                         <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-lg">👤</div>
                      )}
                    </div>
                    
                    <div className="lb-v2-row-info">
                      <p className="lb-v2-row-name truncate">{row.name}</p>
                      <p className="lb-v2-row-xp">{(row.displayXP || row.totalXP).toLocaleString()} XP</p>
                    </div>

                    <div className="lb-v2-row-badge">
                      {row.badges[0]?.icon || (idx % 3 === 0 ? '🏆' : idx % 3 === 1 ? '🛡️' : '📚')}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Sticky You Bar */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="lb-v2-you-bar"
          >
            <div className="lb-v2-you-info">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                {user?.avatar ? (
                   <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'You'}`} className="w-full h-full object-cover" alt="" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                   <p className="lb-v2-you-label">YOU</p>
                   <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-black rounded-md">Pinned</span>
                </div>
                <div className="lb-v2-you-streak">
                  <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>{progress?.streak || 0} Day Streak</span>
                </div>
              </div>
            </div>

            <div className="lb-v2-streak-recovery">
               {/* Svg Circle Progress */}
               <svg className="w-full h-full -rotate-90">
                 <circle
                   cx="25" cy="25" r="20"
                   fill="transparent"
                   stroke="rgba(255,255,255,0.1)"
                   strokeWidth="4"
                 />
                 <circle
                   cx="25" cy="25" r="20"
                   fill="transparent"
                   stroke="#00D2FF"
                   strokeWidth="4"
                   strokeDasharray="125.6"
                   strokeDashoffset="30"
                   strokeLinecap="round"
                 />
               </svg>
               <span className="lb-v2-streak-recovery-text">Streak<br/>Recovery</span>
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}
