'use client'

import { FiArrowRight, FiZap, FiCheck, FiX } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

const FEATURE_MESSAGES: Record<string, { title: string; desc: string }> = {
  cbt: { title: 'Unlock Unlimited CBT Practice', desc: 'Free users get 1 test per day. Upgrade for unlimited access.' },
  ai: { title: "You're one step away", desc: "Your explanation is ready to generate. Upgrade now and it runs instantly." },
  flashcard: { title: "You're one step away", desc: "Your flashcards are ready to generate. Upgrade now and it runs instantly." },
  analytics: { title: 'Unlock Advanced Analytics', desc: 'Detailed progress tracking is available on paid plans.' },
  mock: { title: 'Unlock Mock Exams', desc: 'Full mock exams are available on paid plans only.' },
  notes: { title: "You're one step away", desc: "Your study notes are ready to generate. Upgrade now and it runs instantly." },
  postutme: { title: 'Unlock Post-UTME Practice', desc: 'Post-UTME past questions require a paid plan.' },
  quiz: { title: "You're one step away", desc: "Your quiz is ready to generate. Upgrade now and it runs instantly." },
  default: { title: 'Upgrade to Continue', desc: 'This feature is available on paid plans.' }
}

interface UpgradeModalProps {
  /** Legacy: controlled visibility */
  isOpen?: boolean
  onClose: () => void
  /** Legacy: custom title */
  title?: string
  /** Legacy: custom message */
  message?: string
  /** New: feature key for preset message + plan cards */
  feature?: string
}

export default function UpgradeModal({
  isOpen = true,
  onClose,
  title,
  message,
  feature = 'default'
}: UpgradeModalProps) {
  const router = useRouter()

  const msg = FEATURE_MESSAGES[feature] || FEATURE_MESSAGES.default
  const displayTitle = title ?? msg.title
  const displayDesc = message ?? msg.desc
  const isGeneratorFlow = ['quiz', 'flashcard', 'notes', 'ai'].includes(feature)
  const showPlanCards = !title && !message && !isGeneratorFlow

  const goToPricing = (plan?: string) => {
    const url = plan ? `/dashboard/pricing?plan=${plan}` : '/dashboard/pricing'
    router.push(url)
    onClose()
  }

  const getButtonText = () => {
      if (feature === 'quiz') return 'Upgrade & Generate My Quiz'
      if (feature === 'flashcard') return 'Upgrade & Generate Flashcards'
      if (feature === 'notes') return 'Upgrade & Generate Notes'
      if (feature === 'ai') return 'Upgrade & Unlock AI Explanations'
      return 'Upgrade & Continue'
  }

  if (!isOpen) return null

  return (
    <div
      className="upgrade-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`upgrade-modal ${isGeneratorFlow ? 'max-w-md' : ''}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="upgrade-close"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX size={18} />
        </button>

        <div className="upgrade-icon-wrap">
          <div className="upgrade-icon bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20">
            <FiZap size={28} className="text-white animate-pulse" />
          </div>
        </div>

        <h3 className="upgrade-title text-2xl font-black text-gray-900 dark:text-white mt-4">{displayTitle}</h3>
        <p className="upgrade-desc text-gray-600 dark:text-gray-400 mt-2 px-4">{displayDesc}</p>

        {isGeneratorFlow ? (
          <div className="flex flex-col gap-4 mt-8 px-2 w-full">
            <button
              type="button"
              onClick={() => goToPricing('monthly')}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transform transition hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span className="text-lg">{getButtonText()}</span>
              <FiArrowRight className="text-2xl group-hover:translate-x-1 transition-transform" />
            </button>
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em]">
                UNLIMITED AI + CBT + ANALYTICS
              </p>
              <button 
                type="button"
                onClick={onClose} 
                className="text-sm text-gray-400 dark:text-gray-500 font-bold hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                 Maybe later
              </button>
            </div>
          </div>
        ) : showPlanCards ? (
          <>
            <div className="upgrade-plans">
              <div className="upgrade-plan">
                <div className="plan-name">Weekly</div>
                <div className="plan-price">₦600<span>/week</span></div>
                <ul className="plan-perks">
                  <li><FiCheck size={13} /> 80 AI messages</li>
                  <li><FiCheck size={13} /> Unlimited CBT</li>
                  <li><FiCheck size={13} /> 40 flashcard sets</li>
                </ul>
                <button type="button" className="plan-btn weekly" onClick={() => goToPricing('weekly')}>
                  Get Weekly
                </button>
              </div>
              <div className="upgrade-plan best">
                <div className="best-tag"><FiZap size={11} /> Best Value</div>
                <div className="plan-name">Monthly</div>
                <div className="plan-price">₦2,300<span>/month</span></div>
                <ul className="plan-perks">
                  <li><FiCheck size={13} /> 250 AI messages</li>
                  <li><FiCheck size={13} /> Unlimited CBT</li>
                  <li><FiCheck size={13} /> 120 flashcard sets</li>
                  <li><FiCheck size={13} /> Mock exams</li>
                  <li><FiCheck size={13} /> Advanced analytics</li>
                </ul>
                <button type="button" className="plan-btn monthly" onClick={() => goToPricing('monthly')}>
                  Get Monthly
                </button>
              </div>
            </div>
            <button
              type="button"
              className="addon-btn"
              onClick={() => goToPricing('addon')}
            >
              Just need AI messages? Get 100 more for ₦500
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-3 mt-4">
            <button
              type="button"
              onClick={() => goToPricing()}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              View Pricing Plans
              <FiArrowRight />
            </button>
            <button type="button" onClick={onClose} className="w-full py-3 text-gray-500 font-medium">
              Maybe Later
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
