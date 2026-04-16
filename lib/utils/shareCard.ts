import type { ProgressPayload } from '@/hooks/useProgress'

/** Rounded rect fill (logical coordinates after any ctx.scale). */
export function fillRoundRect(
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

function drawNoise(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.045})`
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2)
  }
  ctx.restore()
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('avatar load failed'))
    img.src = url
  })
}

async function drawAvatarCircle(
  ctx: CanvasRenderingContext2D,
  url: string,
  cx: number,
  cy: number,
  r: number
) {
  try {
    const img = await loadImage(url)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    const s = Math.max(img.width, img.height)
    const sx = (img.width - s) / 2
    const sy = (img.height - s) / 2
    ctx.drawImage(img, sx, sy, s, s, cx - r, cy - r, r * 2, r * 2)
    ctx.restore()
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  } catch {
    /* skip */
  }
}

const QUOTES = [
  'Keep pushing — every question counts.',
  'Small steps, big results.',
  'Your future self will thank you.',
  'Consistency beats intensity.',
]

export type ShareCardOptions = {
  avatarUrl?: string
  referralUrl?: string
}

/**
 * Renders a high-DPI share card. Returns a PNG data URL.
 */
export async function generateShareCard(
  progress: ProgressPayload,
  userName: string,
  weeklyRank: number | null,
  options?: ShareCardOptions
): Promise<string> {
  const W = 600
  const H = 360
  const dpr =
    typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 2, 3) : 2

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.scale(dpr, dpr)

  const grad = ctx.createLinearGradient(0, 0, W, H)
  grad.addColorStop(0, '#5B4CF5')
  grad.addColorStop(0.45, '#6D5CF6')
  grad.addColorStop(1, '#8B5CF6')
  ctx.fillStyle = grad
  fillRoundRect(ctx, 0, 0, W, H, 24)

  drawNoise(ctx, W, H)

  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  fillRoundRect(ctx, 20, 20, W - 40, H - 40, 18)

  const avatarCx = 92
  const avatarCy = 108
  const avatarR = 44

  if (options?.avatarUrl) {
    await drawAvatarCircle(ctx, options.avatarUrl, avatarCx, avatarCy, avatarR)
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.beginPath()
    ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.font = '42px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🎓', avatarCx, avatarCy + 2)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }

  const textX = 168
  let y = 52

  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = '600 13px system-ui, Inter, sans-serif'
  ctx.fillText('StudyHelp', textX, y)
  y += 30

  ctx.fillStyle = '#ffffff'
  ctx.font = '800 26px system-ui, Inter, sans-serif'
  ctx.fillText(userName || 'Student', textX, y)
  y += 34

  const li = progress.levelInfo
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = '600 16px system-ui, Inter, sans-serif'
  ctx.fillText(`${li?.icon ?? ''} ${li?.name ?? ''} · Level ${progress.level}`, textX, y)
  y += 28

  ctx.fillStyle = '#FCD34D'
  ctx.font = '800 22px system-ui, Inter, sans-serif'
  ctx.fillText(`⚡ ${(progress.xp ?? 0).toLocaleString()} XP`, textX, y)
  y += 30

  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.font = '600 15px system-ui, Inter, sans-serif'
  ctx.fillText(`🔥 ${progress.streak ?? 0} day streak`, textX, y)
  y += 26
  ctx.fillText(`🏆 ${progress.weeklyXP ?? 0} XP this week`, textX, y)
  y += 26
  if (weeklyRank != null && weeklyRank > 0) {
    ctx.fillText(`📊 Weekly rank #${weeklyRank}`, textX, y)
    y += 26
  }

  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = 'italic 13px system-ui, Inter, sans-serif'
  const maxW = 300
  wrapText(ctx, quote, textX, y, maxW, 18)

  const badges = (progress.badges || []).slice(-3)
  let bx = textX
  const by = H - 62
  ctx.font = '28px system-ui, sans-serif'
  badges.forEach((b) => {
    ctx.fillText(b.icon, bx, by)
    bx += 44
  })

  const ref = options?.referralUrl || 'https://www.studyhelp.site'
  try {
    const QRCode = (await import('qrcode')).default
    const qrCanvas = document.createElement('canvas')
    await QRCode.toCanvas(qrCanvas, ref, {
      width: 96,
      margin: 1,
      color: { dark: '#1e1b4b', light: '#ffffff' },
    })
    const qx = W - 96 - 28
    const qy = H - 96 - 36
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    fillRoundRect(ctx, qx - 6, qy - 6, 96 + 12, 96 + 28, 10)
    ctx.drawImage(qrCanvas, qx, qy, 96, 96)
    ctx.fillStyle = '#64748b'
    ctx.font = '600 10px system-ui, Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Scan to join', qx + 48, qy + 96 + 14)
    ctx.textAlign = 'left'
  } catch {
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillText(ref.slice(0, 40) + (ref.length > 40 ? '…' : ''), textX, H - 28)
  }

  return canvas.toDataURL('image/png')
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ')
  let line = ''
  let yy = y
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' '
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line, x, yy)
      line = `${words[n]} `
      yy += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, yy)
}

/** Download a canvas as PNG. */
export function downloadShareCard(canvas: HTMLCanvasElement, filename = 'studyhelp-card.png') {
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

/** Download from an existing data URL (e.g. from generateShareCard). */
export function downloadShareCardDataUrl(dataUrl: string, filename = 'studyhelp-card.png') {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export async function copyShareCardImage(dataUrl: string): Promise<boolean> {
  try {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    return true
  } catch {
    return false
  }
}

export function shareToWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

export function shareToTwitter(text: string) {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
}
