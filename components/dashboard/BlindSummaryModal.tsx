'use client'

import { useState, useEffect } from 'react'
import FormattedMarkdown from '@/components/FormattedMarkdown'
import {
  FiEyeOff, FiCheckCircle, FiZap, FiX, FiArrowRight,
  FiRotateCw, FiAward, FiBookOpen, FiHelpCircle, FiLock
} from 'react-icons/fi'
import { BiBrain } from 'react-icons/bi'
import { useProgress } from '@/hooks/useProgress'

export interface BlindSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  onSkip?: () => void
  originalSummaryText?: string
  title?: string
  onComplete?: (points: string[]) => void
}

export default function BlindSummaryModal({
  isOpen,
  onClose,
  onSkip,
  originalSummaryText = '',
  title = 'AI Summary Active Recall',
  onComplete,
}: BlindSummaryModalProps) {
  const { awardXP } = useProgress()
  const [point1, setPoint1] = useState('')
  const [point2, setPoint2] = useState('')
  const [point3, setPoint3] = useState('')

  const [submitted, setSubmitted] = useState(false)
  const [isAwarding, setIsAwarding] = useState(false)
  const [earnedXp, setEarnedXp] = useState<number | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPoint1('')
      setPoint2('')
      setPoint3('')
      setSubmitted(false)
      setIsAwarding(false)
      setEarnedXp(null)
      setShowOriginal(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const filledCount = [point1, point2, point3].filter((p) => p.trim().length > 0).length
  const canSubmit = filledCount >= 1

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onClose()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isAwarding) return

    setIsAwarding(true)
    const typedPoints = [point1.trim(), point2.trim(), point3.trim()].filter(Boolean)

    try {
      const res = await awardXP('blind_summary', {
        title,
        pointsCount: typedPoints.length,
      })
      setEarnedXp(res?.xpAdded ?? 25)
    } catch {
      setEarnedXp(25)
    } finally {
      setIsAwarding(false)
      setSubmitted(true)
      if (onComplete) {
        onComplete(typedPoints)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden my-8">

        {/* Header bar */}
        <div className="relative p-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white flex items-center justify-between overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3 z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl shadow-inner">
              🙈
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-yellow-400 text-gray-950 rounded-full shadow-sm">
                  Active Recall
                </span>
                <span className="text-xs font-medium text-white flex items-center gap-1">
                  <FiZap className="w-3.5 h-3.5 text-yellow-300" /> +25 XP
                </span>
              </div>
              <h3 className="text-lg font-bold mt-0.5 text-white leading-snug">
                Blind Summary Challenge
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
            title="Skip or Close"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {!submitted ? (
            <>
              {/* Context Banner */}
              <div className="p-4 bg-[#5b4cf5] text-white dark:bg-purple-950/60 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-white/20 text-white rounded-xl mt-0.5">
                  <FiLock className="w-5 h-5" />
                </div>
                <div className="text-sm text-white">
                  <p className="font-bold text-white">
                    Content hidden for recall testing: <span className="font-black underline text-white">{title}</span>
                  </p>
                  <p className="text-xs text-white/90 font-medium mt-1">
                    Without looking back at your summary or notes, test your retention by typing 3 main points you remember.
                  </p>
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold uppercase tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BiBrain className="w-4 h-4 text-[#5b4cf5]" />
                    Type 3 Main Points Below:
                  </label>
                  <span className="text-xs font-bold text-white bg-[#5b4cf5] dark:bg-purple-900/50 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
                    {filledCount} / 3 Completed
                  </span>
                </div>

                {/* Point 1 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#5b4cf5] text-white text-xs font-bold flex items-center justify-center">1</span>
                    First Main Point
                  </label>
                  <textarea
                    rows={2}
                    value={point1}
                    onChange={(e) => setPoint1(e.target.value)}
                    placeholder="e.g. The core concept or primary principle discussed..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#5b4cf5] focus:border-transparent outline-none transition-all dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                {/* Point 2 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#5b4cf5] text-white text-xs font-bold flex items-center justify-center">2</span>
                    Second Main Point
                  </label>
                  <textarea
                    rows={2}
                    value={point2}
                    onChange={(e) => setPoint2(e.target.value)}
                    placeholder="e.g. Key rule, definition, or supporting detail..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#5b4cf5] focus:border-transparent outline-none transition-all dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                {/* Point 3 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#5b4cf5] text-white text-xs font-bold flex items-center justify-center">3</span>
                    Third Main Point
                  </label>
                  <textarea
                    rows={2}
                    value={point3}
                    onChange={(e) => setPoint3(e.target.value)}
                    placeholder="e.g. Conclusion, formula, or practical takeaway..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#5b4cf5] focus:border-transparent outline-none transition-all dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Skip for now
                  </button>

                  <button
                    type="submit"
                    disabled={!canSubmit || isAwarding}
                    className="px-6 py-2.5 bg-[#5b4cf5] hover:bg-[#4b3ce5] text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all transform active:scale-95"
                  >
                    {isAwarding ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit & Claim +25 XP <FiZap className="w-4 h-4 text-yellow-300" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Results & Review State */
            <div className="space-y-6 animate-fadeIn">
              {/* Celebration Card */}
              <div className="p-6 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-emerald-500/10 border border-purple-200 dark:border-purple-800/60 rounded-xl text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-white text-3xl shadow-xl shadow-amber-500/30 animate-bounce">
                  ⚡
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">
                    Recall Completed! +{earnedXp ?? 25} XP Earned!
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                    Awesome job! Forcing your brain to retrieve knowledge strengthens memory pathways by up to 40%.
                  </p>
                </div>
              </div>

              {/* Side by side comparison */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4 text-emerald-500" /> Your Recalled Points:
                  </h4>
                  {originalSummaryText && (
                    <button
                      type="button"
                      onClick={() => setShowOriginal(!showOriginal)}
                      className="text-xs font-bold text-[#5b4cf5] dark:text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <FiBookOpen className="w-3.5 h-3.5" />
                      {showOriginal ? 'Hide Original Note' : 'Compare with Original Note'}
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {[point1, point2, point3].filter(Boolean).map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#5b4cf5] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {pt}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Original note reveal (Optional comparison) */}
                {showOriginal && originalSummaryText && (
                  <div className="mt-4 p-4 bg-[#5b4cf5] text-white dark:bg-purple-950/50 rounded-2xl space-y-2 max-h-60 overflow-y-auto">
                    <span className="text-xs font-bold uppercase tracking-wider text-white dark:text-purple-300 flex items-center gap-1.5">
                      <FiBookOpen className="w-3.5 h-3.5" /> Original Summary Material:
                    </span>
                    <div className="text-xs text-white dark:text-slate-200 leading-relaxed font-medium">
                      <FormattedMarkdown content={originalSummaryText} />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white text-sm font-bold rounded-xl transition-all shadow-md"
                >
                  Done & Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
