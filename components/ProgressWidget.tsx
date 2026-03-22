'use client'

import { Trophy, Zap, Flame } from 'lucide-react'
import { useProgress } from '@/hooks/useProgress'
import './ProgressWidget.css'

type Props = {
  onViewFull?: () => void
}

export default function ProgressWidget({ onViewFull }: Props) {
  const { progress, loading } = useProgress()
  if (loading || !progress) return <div className="pw-skeleton" aria-hidden />

  const { levelInfo, xp, streak, badges, weeklyXP } = progress
  const xpToNext = levelInfo.nextLevel ? levelInfo.nextLevel.minXP - xp : 0

  return (
    <div className="pw-card">
      <div className="pw-top">
        <div className="pw-level-badge">
          <span className="pw-level-icon">{levelInfo.icon}</span>
          <div>
            <span className="pw-level-name">{levelInfo.name}</span>
            <span className="pw-level-num">Level {levelInfo.level}</span>
          </div>
        </div>
        <div className="pw-stats">
          <div className="pw-stat">
            <Zap size={14} color="#5B4CF5" aria-hidden />
            <span>{xp.toLocaleString()} XP</span>
          </div>
          <div className="pw-stat">
            <Flame size={14} color="#EF4444" aria-hidden />
            <span>{streak} day streak</span>
          </div>
        </div>
      </div>

      <div className="pw-xp-bar-wrap">
        <div className="pw-xp-bar-track">
          <div className="pw-xp-bar-fill" style={{ width: `${levelInfo.progress}%` }} />
        </div>
        <span className="pw-xp-label">
          {levelInfo.nextLevel
            ? `${xpToNext} XP to ${levelInfo.nextLevel.name}`
            : 'Max Level!'}
        </span>
      </div>

      <div className="pw-weekly">
        <Trophy size={13} color="#F59E0B" aria-hidden />
        <span>{weeklyXP} XP this week</span>
      </div>

      {badges.length > 0 && (
        <div className="pw-badges">
          {badges.slice(-5).map((b) => (
            <div key={b.id} className="pw-badge" title={b.name}>
              {b.icon}
            </div>
          ))}
        </div>
      )}

      {onViewFull && (
        <button type="button" className="pw-view-btn" onClick={onViewFull}>
          View Full Profile →
        </button>
      )}
    </div>
  )
}
