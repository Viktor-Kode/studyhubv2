export const LEVELS = [
  { level: 1, name: 'Beginner', minXP: 0, icon: '🌱' },
  { level: 2, name: 'Learner', minXP: 200, icon: '📚' },
  { level: 3, name: 'Student', minXP: 500, icon: '✏️' },
  { level: 4, name: 'Scholar', minXP: 1000, icon: '🎓' },
  { level: 5, name: 'Expert', minXP: 2000, icon: '⭐' },
  { level: 6, name: 'Master', minXP: 3500, icon: '🏆' },
  { level: 7, name: 'Legend', minXP: 5000, icon: '👑' },
] as const

export type BadgeDef = {
  id: string
  name: string
  description: string
  icon: string
}

export const BADGES: BadgeDef[] = [
  { id: 'first_cbt', name: 'First Test', description: 'Completed your first CBT', icon: '🎯' },
  { id: 'streak_3', name: '3-Day Streak', description: 'Logged in 3 days in a row', icon: '🔥' },
  { id: 'streak_7', name: 'Week Warrior', description: 'Logged in 7 days in a row', icon: '⚡' },
  { id: 'streak_30', name: 'Monthly Master', description: 'Logged in 30 days in a row', icon: '💎' },
  { id: 'top_10', name: 'Top 10', description: 'Reached top 10 on the leaderboard', icon: '🏅' },
  { id: 'century', name: 'Century', description: 'Answered 100 questions', icon: '💯' },
  { id: 'high_scorer', name: 'High Scorer', description: 'Scored 80%+ on a CBT', icon: '⭐' },
  { id: 'topic_explorer', name: 'Topic Explorer', description: 'Studied 10 different topics', icon: '🗺️' },
  { id: 'scholar', name: 'Scholar', description: 'Reached Scholar level', icon: '🎓' },
  { id: 'legend', name: 'Legend', description: 'Reached Legend level', icon: '👑' },
]

export function getLevelFromXP(xp: number) {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXP) current = lvl
  }
  const nextLevel = LEVELS.find((l) => l.minXP > xp)
  const progress = nextLevel
    ? Math.round(((xp - current.minXP) / (nextLevel.minXP - current.minXP)) * 100)
    : 100
  return { ...current, nextLevel, progress }
}

export type ProgressLike = {
  xp?: number
  streak?: number
  totalQuestionsAnswered?: number
  totalTopicsStudied?: number
  totalCBTDone?: number
  highScoreCBTCount?: number
  level?: number
}

/** Progress toward countable badges (0–100 for bar). */
export function badgeCounterProgress(
  badgeId: string,
  p: ProgressLike
): { label: string; pct: number } | null {
  const xp = p.xp ?? 0
  const streak = p.streak ?? 0
  const q = p.totalQuestionsAnswered ?? 0
  const topics = p.totalTopicsStudied ?? 0
  const cbt = p.totalCBTDone ?? 0
  const hi = p.highScoreCBTCount ?? 0
  const level = p.level ?? 1

  switch (badgeId) {
    case 'streak_3':
      return { label: `${Math.min(streak, 3)}/3 login streak`, pct: Math.min(100, (Math.min(streak, 3) / 3) * 100) }
    case 'streak_7':
      return { label: `${Math.min(streak, 7)}/7 login streak`, pct: Math.min(100, (Math.min(streak, 7) / 7) * 100) }
    case 'streak_30':
      return { label: `${Math.min(streak, 30)}/30 login streak`, pct: Math.min(100, (Math.min(streak, 30) / 30) * 100) }
    case 'century':
      return { label: `${Math.min(q, 100)}/100 questions`, pct: Math.min(100, (Math.min(q, 100) / 100) * 100) }
    case 'topic_explorer':
      return { label: `${Math.min(topics, 10)}/10 topics`, pct: Math.min(100, (Math.min(topics, 10) / 10) * 100) }
    case 'first_cbt':
      return { label: `${Math.min(cbt, 1)}/1 CBT`, pct: Math.min(100, cbt >= 1 ? 100 : 0) }
    case 'high_scorer':
      return { label: hi >= 1 ? '1/1 high scores' : '0/1 (80%+ CBT)', pct: hi >= 1 ? 100 : 0 }
    case 'scholar':
      return { label: `Level ${Math.min(level, 4)}/4`, pct: level >= 4 ? 100 : Math.min(100, (level / 4) * 100) }
    case 'legend':
      return { label: `Level ${Math.min(level, 7)}/7`, pct: level >= 7 ? 100 : Math.min(100, (level / 7) * 100) }
    case 'top_10':
      return { label: 'Finish week in top 10', pct: 0 }
    default:
      return null
  }
}
