'use client'

import { Lock, CheckCircle2, Trophy, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProgressPayload } from '@/hooks/useProgress'
import { BADGES, badgeCounterProgress } from '@/lib/config/gamification'

type Props = {
  progress: ProgressPayload
}

export default function BadgesPanel({ progress }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
      {BADGES.map((def, idx) => {
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
          <motion.div
            key={def.id}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`relative group overflow-hidden flex flex-col items-center text-center p-5 rounded-[28px] border transition-all duration-300 ${
              earned 
                ? 'bg-white dark:bg-slate-900 border-violet-200 dark:border-violet-800 shadow-xl' 
                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-80'
            }`}
          >
            {/* Background Glow for Earned */}
            {earned && (
              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
            )}
            
            <div className="relative mb-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-transform duration-500 group-hover:rotate-12 ${
                earned 
                  ? 'bg-gradient-to-br from-violet-100 to-white dark:from-slate-800 dark:to-slate-900 border-2 border-violet-100 dark:border-violet-800' 
                  : 'bg-slate-100 dark:bg-slate-800 border-2 border-transparent grayscale'
              }`}>
                {def.icon}
              </div>
              
              {earned ? (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-lg ring-4 ring-white dark:ring-slate-900"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </motion.div>
              ) : (
                <div className="absolute -bottom-1 -right-1 bg-slate-400 text-white rounded-full p-1 shadow-lg ring-4 ring-white dark:ring-slate-900">
                  <Lock className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center">
              <h3 className={`font-black text-sm mb-1 tracking-tight ${
                earned ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {def.name}
              </h3>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 leading-tight line-clamp-2 px-2">
                {def.description}
              </p>
            </div>

            <div className="w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                {earned ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      UNLOCKED
                    </span>
                    <p className="text-[10px] font-bold text-slate-400">
                      {new Date(earned.earnedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                ) : counter ? (
                  <div className="w-full">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 px-1 uppercase tracking-tighter">
                      <span>{counter.label}</span>
                      <span className="text-violet-600 dark:text-violet-400">{Math.round(counter.pct)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${counter.pct}%` }}
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full"
                      />
                    </div>
                  </div>
                ) : (
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      SECRET TASK
                   </span>
                )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
