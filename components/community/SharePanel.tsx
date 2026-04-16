'use client'

import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Link as LinkIcon, Download, ImageIcon, Twitter, Sparkles, Copy, Check, Share2, Rocket } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [copyTextOk, setCopyTextOk] = useState(false)

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

  const copyText = async () => {
      try {
          await navigator.clipboard.writeText(shareText)
          setCopyTextOk(true)
          setTimeout(() => setCopyTextOk(false), 2000)
      } catch { /* ignore */ }
  }

  if (!progress || progLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="h-48 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden group rounded-[32px] p-8 shadow-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700"
      >
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 p-12 -mr-16 -mt-16 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 p-12 -ml-16 -mb-16 bg-black/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Progress Card
            </div>
            <h2 className="text-3xl font-black text-white m-0 tracking-tight leading-tight mb-3">
              Show off your <br className="hidden md:block" /> hard work
            </h2>
            <p className="text-indigo-100 font-medium leading-relaxed max-w-sm mb-6">
              Brag a little — you've earned those XP points. Share your stats and referral link to climb the ranks with friends.
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                 <button
                   type="button"
                   onClick={() => void copyImage()}
                   disabled={!cardUrl}
                   className="flex items-center gap-2 px-6 py-3 bg-white text-violet-700 rounded-2xl font-black text-sm shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                 >
                   {copyImgOk ? <Check className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                   {copyImgOk ? 'Ready to Paste!' : 'Copy Image'}
                 </button>
                 <button
                   type="button"
                   onClick={() => cardUrl && downloadShareCardDataUrl(cardUrl)}
                   disabled={!cardUrl}
                   className="p-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl transition-all hover:scale-105 active:scale-95"
                   title="Download PNG"
                 >
                   <Download className="w-5 h-5" />
                 </button>
            </div>
          </div>

          <div className="relative group/card w-full max-w-[400px]">
            <AnimatePresence mode="wait">
              {cardUrl ? (
                <motion.div
                  initial={{ opacity: 0, rotateY: -20, scale: 0.9 }}
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="relative preserve-3d"
                >
                  <img 
                    src={cardUrl} 
                    alt="StudyHelp progress card" 
                    className="w-full h-auto rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.3)] group-hover/card:scale-[1.02] transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-white/30 pointer-events-none" />
                </motion.div>
              ) : (
                <div className="aspect-[1.66] w-full bg-black/20 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/20">
                  <p className="text-white/60 font-bold animate-pulse">Designing your card...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 ml-1">
            <Share2 className="w-5 h-5 text-violet-600" />
            Quick Share
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => shareToWhatsApp(waMessage)}
              className="flex items-center justify-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl font-black transition-all hover:translate-y-[-2px] hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </button>
            <button
              onClick={() => shareToTwitter(shareText)}
              className="flex items-center justify-center gap-3 p-4 bg-slate-900 text-white rounded-2xl font-black transition-all hover:translate-y-[-2px] hover:shadow-lg hover:shadow-slate-900/20 active:scale-95"
            >
              <Twitter className="w-5 h-5" />
              X (Twitter)
            </button>
          </div>
          <button
            onClick={copyText}
            className="w-full flex items-center justify-center gap-3 p-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-2xl font-black transition-all hover:border-violet-600 active:scale-95 shadow-sm"
          >
            {copyTextOk ? <Check className="w-5 h-5 text-violet-600" /> : <LinkIcon className="w-5 h-5" />}
            {copyTextOk ? 'Text Copied!' : 'Copy invite text'}
          </button>
        </div>

        <motion.div 
           whileHover={{ y: -4 }}
           className="relative overflow-hidden p-6 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col justify-between"
        >
          <div className="mb-6">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mb-4">
              <Rocket className="w-6 h-6 text-violet-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white m-0 tracking-tight">Refer a friend</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              When friends join using your link, they're automatically added to your network. Share yours everywhere.
            </p>
          </div>

          <div className="space-y-3">
             <div className="relative group">
               <input
                 readOnly
                 value={referral}
                 onClick={(e) => (e.target as HTMLInputElement).select()}
                 className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 pr-16 text-xs font-mono font-bold text-slate-600 dark:text-slate-300 focus:border-violet-600 outline-none transition-all"
               />
               <button
                 onClick={copyReferral}
                 className="absolute right-2 top-2 bottom-2 px-3 bg-violet-600 text-white rounded-xl font-black text-[10px] uppercase transition-all hover:bg-violet-700 active:scale-90 flex items-center gap-1.5"
               >
                 {copyOk ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                 {copyOk ? 'Copied' : 'Copy'}
               </button>
             </div>
             
             <div className="flex items-center gap-4 px-2">
                 <button 
                  onClick={() => shareToWhatsApp(`Join me on StudyHelp: ${referral}`)}
                  className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest hover:underline"
                 >
                   WhatsApp
                 </button>
                 <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                 <button 
                  onClick={() => shareToTwitter(`Join me on StudyHelp: ${referral}`)}
                  className="text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest hover:underline"
                 >
                   Twitter
                 </button>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
