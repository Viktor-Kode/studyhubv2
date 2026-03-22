import type { ProgressPayload } from '@/hooks/useProgress'

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
  ctx.fill()
}

export function generateShareCard(progress: ProgressPayload, userName: string, weeklyRank: number | null): string {
  const canvas = document.createElement('canvas')
  canvas.width = 600
  canvas.height = 315
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const grad = ctx.createLinearGradient(0, 0, 600, 315)
  grad.addColorStop(0, '#5B4CF5')
  grad.addColorStop(1, '#8B5CF6')
  ctx.fillStyle = grad
  fillRoundRect(ctx, 0, 0, 600, 315, 20)

  ctx.fillStyle = 'rgba(255,255,255,0.1)'
  fillRoundRect(ctx, 20, 20, 560, 275, 14)

  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = 'bold 14px system-ui, sans-serif'
  ctx.fillText('StudyHelp', 40, 55)

  ctx.fillStyle = 'white'
  ctx.font = 'bold 28px system-ui, sans-serif'
  ctx.fillText(userName || 'Student', 40, 100)

  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font = '16px system-ui, sans-serif'
  const li = progress.levelInfo
  ctx.fillText(`${li?.icon ?? ''} ${li?.name ?? ''} — Level ${progress.level}`, 40, 130)

  ctx.fillStyle = '#FCD34D'
  ctx.font = 'bold 22px system-ui, sans-serif'
  ctx.fillText(`⚡ ${(progress.xp ?? 0).toLocaleString()} XP`, 40, 175)

  ctx.fillStyle = 'white'
  ctx.font = '16px system-ui, sans-serif'
  ctx.fillText(`🔥 ${progress.streak ?? 0} day streak`, 40, 205)
  ctx.fillText(`🏆 ${progress.weeklyXP ?? 0} XP this week`, 40, 230)
  if (weeklyRank != null && weeklyRank > 0) {
    ctx.fillText(`📊 Weekly rank #${weeklyRank}`, 40, 255)
  }

  const recentBadges = (progress.badges || []).slice(-4)
  ctx.font = '26px system-ui, sans-serif'
  recentBadges.forEach((b, i) => {
    ctx.fillText(b.icon, 40 + i * 40, 275)
  })

  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = '13px system-ui, sans-serif'
  ctx.fillText('studyhubv2.vercel.app', 380, 290)

  return canvas.toDataURL('image/png')
}

export function shareToWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

export function shareToTwitter(text: string) {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
}
