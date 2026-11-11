'use client'

import { Trophy, Zap } from 'lucide-react'
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
  dailyXP?: number
  weeklyXP?: number
  totalXP?: number
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
  myDisplayXP: number
  progress: ProgressPayload | null
  user: AppUser | null
}

const numberFormat = new Intl.NumberFormat()

function displayName(name: string) {
  return name?.trim() || 'Anonymous student'
}

function avatarFallback(name: string) {
  return displayName(name).slice(0, 1).toUpperCase()
}

function Avatar({
  row,
  large = false,
  currentAvatar
}: {
  row: BoardRow
  large?: boolean
  currentAvatar?: string | null
}) {
  const effectiveAvatar = (row.isMe && currentAvatar) ? currentAvatar : row.avatar
  const isUrl = typeof effectiveAvatar === 'string' && (effectiveAvatar.startsWith('http') || effectiveAvatar.startsWith('data:'))
  const finalSrc = isUrl
    ? effectiveAvatar
    : (row.isMe
        ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(row.name || 'Felix')}&backgroundColor=b6e3f4`
        : null)

  return (
    <div className={`lb-v2-avatar-wrap ${large ? 'lb-v2-avatar-wrap--large' : ''}`}>
      {finalSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="lb-v2-avatar" src={finalSrc} alt={`${displayName(row.name)} avatar`} />
      ) : (
        <div className="lb-v2-avatar lb-v2-avatar-fallback" aria-label={`${displayName(row.name)} avatar`}>
          {avatarFallback(row.name)}
        </div>
      )}
    </div>
  )
}

function scoreFor(row: BoardRow, timeframe: TimeframeMode) {
  return row.displayXP ?? (timeframe === 'today' ? row.dailyXP : row.totalXP) ?? 0
}

function PodiumCard({
  row,
  place,
  timeframe,
  currentAvatar
}: {
  row: BoardRow
  place: number
  timeframe: TimeframeMode
  currentAvatar?: string | null
}) {
  const xp = scoreFor(row, timeframe)
  const placeClass = place === 1 ? '1st' : place === 2 ? '2nd' : '3rd'
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: place * 0.05 }}
      className={`lb-v2-podium-card lb-v2-podium-card--${placeClass} ${row.isMe ? 'is-me' : ''}`}
    >
      <span className="lb-v2-rank-badge">#{row.rank || place}</span>
      {place === 1 && <Trophy className="lb-v2-crown" size={24} fill="currentColor" aria-label="First place" />}
      <Avatar row={row} large={place === 1} currentAvatar={currentAvatar} />
      <div className="lb-v2-name">{displayName(row.name)}{row.isMe ? ' · You' : ''}</div>
      <span className="lb-v2-podium-level">{row.levelName || `Level ${row.level || 1}`}</span>
      <span className="lb-v2-xp-badge"><Zap size={14} fill="currentColor" /> {numberFormat.format(xp)} XP</span>
      {row.badges?.length > 0 && (
        <div className="lb-v2-badges-row" aria-label="Recent badges">
          {row.badges.slice(0, 3).map((badge) => (
            <span key={badge.id} className="lb-v2-badge-mini" title={badge.name}>{badge.icon || '🏅'}</span>
          ))}
        </div>
      )}
      <div className={`lb-v2-podium-bar lb-v2-podium-bar--${placeClass}`} aria-label={`${place} place`}>{place}</div>
    </motion.article>
  )
}

export default function LeaderboardPanel({
  timeframe,
  setTimeframe,
  leaderboard,
  lbLoading,
  myRank,
  myDisplayXP,
  progress,
  user,
}: Props) {
  // Inject the current user's chosen avatar (from authStore / settings / localStorage) into
  // their own leaderboard row so it always reflects the profile pick.
  const storedAvatar = typeof window !== 'undefined' ? localStorage.getItem('studyhelp_avatar') : null
  const userAvatar = user?.avatar || storedAvatar || null
  const isAvatarUrl = typeof userAvatar === 'string' &&
    (userAvatar.startsWith('http') || userAvatar.startsWith('data:'))
  const resolvedUserAvatar = isAvatarUrl ? userAvatar : null

  const rows = [...leaderboard]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 10)
    .map((row) =>
      row.isMe && resolvedUserAvatar
        ? { ...row, avatar: resolvedUserAvatar }
        : row
    )
  const topRows = rows.slice(0, 3)
  const limit = 10
  const showPinnedYou = Boolean(user && myRank > 10 && !rows.some((row) => row.isMe))

  return (
    <div className="lb-v2-container">
      <div className="lb-v2-heading-row">
        <div>
          <h2 className="lb-v2-list-header">Top 10 students</h2>
          <p className="lb-v2-subtitle">Daily and all time rankings, based on XP earned.</p>
        </div>
        <div className="lb-v2-tabs" role="group" aria-label="Leaderboard timeframe">
              {(['today', 'lifetime'] as const).map((period) => (
            <button
              key={period}
              type="button"
              className={`lb-v2-tab ${timeframe === period ? 'active' : ''}`}
              aria-pressed={timeframe === period}
              onClick={() => setTimeframe(period)}
            >
              {period === 'today' ? 'Today' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {lbLoading ? (
        <div className="lb-v2-loading" aria-label="Loading leaderboard" aria-busy="true">
          <div className="lb-v2-podium">
            {[1, 2, 3].map((item) => <div className="lb-v2-skeleton-podium" key={item} />)}
          </div>
          <div className="lb-v2-grid">
            {[1, 2, 3, 4].map((item) => <div className="lb-v2-skeleton-row" key={item} />)}
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="lb-v2-empty">
          <div className="lb-v2-empty-icon"><Trophy size={28} /></div>
          <h3>No rankings yet</h3>
          <p>{timeframe === 'today' ? 'Earn XP today to appear on the daily leaderboard.' : 'Students will appear here as they earn XP.'}</p>
        </div>
      ) : (
        <>
          {topRows.length > 0 && (
            <section className="lb-v2-podium" aria-label="Top three students">
              {topRows.map((row) => (
                <PodiumCard
                  key={row.userId}
                  row={row}
                  place={row.rank}
                  timeframe={timeframe}
                  currentAvatar={resolvedUserAvatar}
                />
              ))}
            </section>
          )}

          {rows.length > 0 && (
            <section aria-labelledby="lb-v2-list-title">
              <h3 id="lb-v2-list-title" className="lb-v2-list-header">Rankings</h3>
              <div className="lb-v2-table" role="table" aria-label="Top 10 student rankings">
                <div className="lb-v2-table-head" role="row">
                  <span role="columnheader">Rank</span><span role="columnheader">Student &amp; level</span><span role="columnheader">Points</span>
                </div>
              <div className="lb-v2-grid">
                {rows.map((row) => {
                  const xp = scoreFor(row, timeframe)
                  return (
                    <article key={row.userId} role="row" className={`lb-v2-row ${row.isMe ? 'is-me' : ''}`}>
                      <span className="lb-v2-row-rank" role="cell">{row.rank}</span>
                      <Avatar row={row} currentAvatar={resolvedUserAvatar} />
                      <div className="lb-v2-row-info" role="cell">
                        <div className="lb-v2-row-name">{displayName(row.name)}{row.isMe ? ' · You' : ''}</div>
                        <div className="lb-v2-row-xp">{row.levelName || `Level ${row.level || 1}`}</div>
                      </div>
                      {row.badges?.[0] && <span className="lb-v2-row-badge" title={row.badges[0].name}>{row.badges[0].icon || '🏅'}</span>}
                      <span className="lb-v2-row-score" role="cell">{numberFormat.format(xp)}</span>
                    </article>
                  )
                })}
                {showPinnedYou && user && (
                  <article role="row" className="lb-v2-row lb-v2-row--you">
                    <span className="lb-v2-row-rank" role="cell">{myRank}</span>
                    <div className="lb-v2-avatar-wrap">
                      {(resolvedUserAvatar || (user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:')))) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="lb-v2-avatar" src={(resolvedUserAvatar || user.avatar)!} alt={`${user.name} avatar`} />
                      ) : <div className="lb-v2-avatar lb-v2-avatar-fallback">{avatarFallback(user.name)}</div>}
                    </div>
                    <div className="lb-v2-row-info" role="cell">
                      <div className="lb-v2-row-name">You</div>
                      <div className="lb-v2-row-xp">{progress?.levelName || `Level ${progress?.level ?? 1}`}</div>
                    </div>
                    <span className="lb-v2-row-score" role="cell">{numberFormat.format(myDisplayXP)}</span>
                  </article>
                )}
              </div>
              </div>
            </section>
          )}
          <p className="lb-v2-cap-note">Showing the top {limit} · Refreshes every minute</p>
        </>
      )}

    </div>
  )
}
