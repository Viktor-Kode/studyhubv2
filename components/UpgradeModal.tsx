'use client'

import { FiArrowRight, FiZap, FiCheck, FiX } from 'react-icons/fi'
import { useRouter } from 'next/navigation'

const FEATURE_MESSAGES: Record<string, { title: string; desc: string }> = {
  cbt: { title: 'Unlock Unlimited CBT Practice', desc: 'Free users get 1 test per day. Upgrade for unlimited access.' },
  ai: { title: 'Unlock AI Explanations', desc: 'You have used all your free AI messages. Upgrade to continue.' },
  flashcard: { title: 'Unlock More Flashcard Sets', desc: 'You have reached your free flashcard generation limit.' },
  analytics: { title: 'Unlock Advanced Analytics', desc: 'Detailed progress tracking is available on paid plans.' },
  mock: { title: 'Unlock Mock Exams', desc: 'Full mock exams are available on paid plans only.' },
  notes: { title: 'Unlock Unlimited Notes', desc: 'You have reached your free notes limit. Upgrade to save more.' },
  postutme: { title: 'Unlock Post-UTME Practice', desc: 'Post-UTME past questions require a paid plan.' },
  quiz: { title: 'Unlock Practice Quizzes', desc: 'Generating quizzes from notes requires a paid plan.' },
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
  const showPlanCards = !title && !message

  const goToPricing = (plan?: string) => {
    const url = plan ? `/dashboard/pricing?plan=${plan}` : '/dashboard/pricing'
    router.push(url)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="upgrade-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="upgrade-modal"
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
          <div className="upgrade-icon">
            <FiZap size={28} className="text-white" />
          </div>
        </div>

        <h3 className="upgrade-title">{displayTitle}</h3>
        <p className="upgrade-desc">{displayDesc}</p>

        {showPlanCards ? (
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
