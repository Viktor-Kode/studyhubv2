'use client'

import { Lock } from 'lucide-react'
import type { ProgressPayload } from '@/hooks/useProgress'
import { BADGES, badgeCounterProgress } from '@/lib/config/gamification'

type Props = {
  progress: ProgressPayload
}

export default function BadgesPanel({ progress }: Props) {
  return (
    <div className="gw-badges-grid">
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
            className={`gw-badge-card ${earned ? 'gw-badge-card--earned' : 'gw-badge-card--locked'}`}
          >
            <span className="gw-badge-card-icon" aria-hidden>
              {def.icon}
            </span>
            <div className="flex items-center justify-center gap-2 w-full">
              <h3>{def.name}</h3>
              {!earned && <Lock className="w-4 h-4 text-slate-400 shrink-0" aria-hidden />}
            </div>
            <p>{def.description}</p>
            {earned?.earnedAt && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-auto pt-2 font-semibold">
                Earned {new Date(earned.earnedAt).toLocaleDateString()}
              </p>
            )}
            {!earned && counter && (
              <div className="w-full mt-auto pt-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>{counter.label}</span>
                  <span>{Math.round(counter.pct)}%</span>
                </div>
                <div className="gw-badge-mini-bar">
                  <div className="gw-badge-mini-fill" style={{ width: `${counter.pct}%` }} />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
