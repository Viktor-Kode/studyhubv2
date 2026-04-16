'use client'

import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Link as LinkIcon, Download, ImageIcon, Twitter, Sparkles } from 'lucide-react'
import type { ProgressPayload } from '@/hooks/useProgress'
import {
  generateShareCard,
  shareToTwitter,
  shareToWhatsApp,
  downloadShareCardDataUrl,
  copyShareCardImage,
} from '@/lib/utils/shareCard'
import type { AppUser } from '@/lib/types/auth'

type Props = {
  progress: ProgressPayload
  progLoading: boolean
  user: AppUser | null
  myRank: number
}

export default function SharePanel({ progress, progLoading, user, myRank }: Props) {
  const [cardUrl, setCardUrl] = useState<string | null>(null)
  const [copyOk, setCopyOk] = useState(false)
  const [copyImgOk, setCopyImgOk] = useState(false)

  const referral = useMemo(() => {
    if (typeof window === 'undefined' || !user?.uid) return ''
    return `${window.location.origin}/auth/login?ref=${encodeURIComponent(user.uid)}`
  }, [user?.uid])

  const shareText = useMemo(
    () =>
      progress
        ? `I'm ${progress.levelInfo?.name} (Level ${progress.level}) on StudyHelp with ${progress.xp.toLocaleString()} XP and a ${progress.streak}-day streak! 🎓 Join me: https://www.studyhelp.site`
        : 'Study with me on StudyHelp — https://www.studyhelp.site',
    [progress]
  )

  const waMessage = useMemo(() => {
    const link = referral || 'https://www.studyhelp.site'
    return `${shareText}\n\n${link}`
  }, [shareText, referral])

  useEffect(() => {
    if (!progress || progLoading) return
    let cancelled = false
    ;(async () => {
      try {
        const url = await generateShareCard(
          progress,
          user?.name || 'Student',
          myRank > 0 ? myRank : null,
          {
            avatarUrl: user?.avatar,
            referralUrl: referral || undefined,
          }
        )
        if (!cancelled) setCardUrl(url)
      } catch {
        if (!cancelled) setCardUrl(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [progress, progLoading, user?.name, user?.avatar, myRank, referral])

  const copyReferral = async () => {
    if (!referral) return
    try {
      await navigator.clipboard.writeText(referral)
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const copyImage = async () => {
    if (!cardUrl) return
    const ok = await copyShareCardImage(cardUrl)
    setCopyImgOk(ok)
    setTimeout(() => setCopyImgOk(false), 2000)
    if (!ok) {
      downloadShareCardDataUrl(cardUrl)
    }
  }

  if (!progress || progLoading) {
    return <div className="h-64 rounded-[20px] bg-slate-200 dark:bg-slate-800 animate-pulse" />
  }

  return (
    <div className="space-y-6">
      <div className="gw-share-hero">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-white/20 shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white m-0 tracking-tight">Your share card</h2>
            <p className="text-sm text-white/80 m-0 mt-1">
              Brag a little — you earned it. Share stats, QR, and your referral link.
            </p>
          </div>
        </div>

        <div className="gw-share-card-wrap">
          {cardUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cardUrl} alt="StudyHelp progress card" />
          ) : (
            <p className="text-white/90 text-sm font-semibold">Generating card…</p>
          )}
        </div>
      </div>

      <div className="gw-share-actions">
        <button
          type="button"
          className="gw-share-btn gw-share-btn--wa"
          onClick={() => shareToWhatsApp(waMessage)}
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
          WhatsApp
        </button>
        <button
          type="button"
          className="gw-share-btn gw-share-btn--x"
          onClick={() => shareToTwitter(shareText)}
        >
          <Twitter className="w-5 h-5 shrink-0" />
          X
        </button>
        <button
          type="button"
          className="gw-share-btn gw-share-btn--copy"
          onClick={() => void navigator.clipboard.writeText(shareText)}
        >
          <LinkIcon className="w-5 h-5 shrink-0" />
          Copy text
        </button>
        <button
          type="button"
          className="gw-share-btn gw-share-btn--img"
          onClick={() => cardUrl && downloadShareCardDataUrl(cardUrl)}
          disabled={!cardUrl}
        >
          <Download className="w-5 h-5 shrink-0" />
          PNG
        </button>
      </div>

      <button
        type="button"
        className="gw-share-btn gw-share-btn--copy w-full min-h-[48px]"
        onClick={() => void copyImage()}
        disabled={!cardUrl}
      >
        <ImageIcon className="w-5 h-5 shrink-0" />
        {copyImgOk ? 'Copied image!' : 'Copy image'}
      </button>

      <div className="gw-referral-card">
        <div className="flex flex-wrap gap-4 items-start">
          <div className="text-4xl" aria-hidden>
            🚀
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-slate-900 dark:text-white m-0 text-lg tracking-tight">
              Refer a friend
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-0 leading-relaxed">
              When they sign up with your link, your ref code is in the URL — share anywhere.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <input
            readOnly
            value={referral}
            className="flex-1 text-xs font-mono rounded-xl border border-[#E8EAED] dark:border-gray-600 bg-slate-50 dark:bg-slate-800 px-3 py-3 min-h-[48px]"
          />
          <button
            type="button"
            onClick={() => void copyReferral()}
            className="gw-share-btn gw-share-btn--img px-6 min-h-[48px] whitespace-nowrap"
          >
            {copyOk ? 'Copied!' : 'Copy link'}
          </button>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm font-bold">
          <button
            type="button"
            className="text-emerald-600 dark:text-emerald-400 min-h-[44px]"
            onClick={() => shareToWhatsApp(`Join me on StudyHelp: ${referral}`)}
          >
            Share link on WhatsApp
          </button>
          <button
            type="button"
            className="text-slate-700 dark:text-slate-300 min-h-[44px]"
            onClick={() => shareToTwitter(`Join me on StudyHelp: ${referral}`)}
          >
            Share link on X
          </button>
        </div>
      </div>
    </div>
  )
}
