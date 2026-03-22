'use client'

import { Trophy, Zap, Flame } from 'lucide-react'
import { useProgress } from '@/hooks/useProgress'
type Props = {
  onViewFull?: () => void
}

const R = 40
const CIRC = 2 * Math.PI * R

export default function ProgressWidget({ onViewFull }: Props) {
  const { progress, loading } = useProgress()
  if (loading || !progress) return <div className="pw-skeleton" aria-hidden />

  const { levelInfo, xp, streak, badges, weeklyXP } = progress
  const xpToNext = levelInfo.nextLevel ? levelInfo.nextLevel.minXP - xp : 0
  const pct = Math.min(100, Math.max(0, levelInfo.progress))
  const dashOffset = CIRC - (pct / 100) * CIRC

  return (
    <div className="pw-card">
      <div className="pw-top">
        <div className="pw-level-pill">
          <span className="pw-level-icon">{levelInfo.icon}</span>
          <div>
            <span className="pw-level-name">{levelInfo.name}</span>
            <span className="pw-level-num">Level {levelInfo.level}</span>
          </div>
        </div>
      </div>

      <div className="pw-mid">
        <div className="pw-ring-wrap" aria-hidden>
          <svg className="pw-ring-svg" viewBox="0 0 108 108" width="108" height="108">
            <defs>
              <linearGradient id="pw-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5B4CF5" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <circle className="pw-ring-bg" cx="54" cy="54" r={R} />
            <circle
              className="pw-ring-fg"
              cx="54"
              cy="54"
              r={R}
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="pw-ring-label">
            <span className="pw-ring-pct">{pct}%</span>
            <span className="pw-ring-cap">to next</span>
          </div>
        </div>

        <div className="pw-stats-col">
          <div className="pw-stat">
            <Zap size={18} color="#5B4CF5" aria-hidden />
            <span>{xp.toLocaleString()} XP</span>
          </div>
          <div className="pw-streak-pill">
            <Flame size={18} color="#EF4444" aria-hidden />
            <span>{streak} day streak</span>
          </div>
        </div>
      </div>

      <div className="pw-xp-bar-wrap">
        <div className="pw-xp-bar-track">
          <div className="pw-xp-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="pw-xp-caption">
          {levelInfo.nextLevel
            ? `${xpToNext.toLocaleString()} XP to ${levelInfo.nextLevel.name}`
            : 'Max level reached — amazing work!'}
        </span>
      </div>

      <div className="pw-weekly">
        <Trophy size={16} color="#F59E0B" aria-hidden />
        <span>{weeklyXP.toLocaleString()} XP this week</span>
      </div>

      {badges.length > 0 && (
        <div className="pw-badges-scroll" role="list" aria-label="Recent badges">
          {badges.slice(-8).map((b) => (
            <div key={b.id} className="pw-badge" title={b.name} role="listitem">
              {b.icon}
            </div>
          ))}
        </div>
      )}

      {onViewFull && (
        <button type="button" className="pw-view-btn" onClick={onViewFull}>
          View full profile →
        </button>
      )}
    </div>
  )
}
