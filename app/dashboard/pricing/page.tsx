'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { paymentApi } from '@/lib/api/paymentApi'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import BottomNav from '@/components/dashboard/MobileBottomNav'
import {
  FiCheck, FiX, FiLoader, FiZap, FiAward, FiPhone, FiShield,
  FiHelpCircle, FiClock, FiStar, FiArrowRight, FiCheckCircle
} from 'react-icons/fi'
import { HiOutlineSparkles } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'
import { toast } from 'react-hot-toast'
import { PLANS } from '@/lib/config/plans'

const FAQ_ITEMS = [
  {
    q: 'How does payment work in Nigeria?',
    a: 'We process instant & secure payments via Flutterwave/Paystack. You can pay with bank transfer, debit card, USSD, or mobile money.',
  },
  {
    q: 'Can I change or cancel my plan anytime?',
    a: 'Yes! Plans are non-recurring by default, meaning you are never automatically charged. You choose when to renew.',
  },
  {
    q: 'What happens after my subscription expires?',
    a: 'Your account safely reverts back to the Free plan. All your test history, saved notes, and performance stats remain intact.',
  },
  {
    q: 'Can schools or tutorial centers get bulk discounts?',
    a: 'Absolutely! We offer custom multi-user packages for schools with 50+ students. Contact us directly on WhatsApp.',
  },
]

export default function PricingPage() {
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isTeacherFlow = searchParams?.get('from') === 'teacher'

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [status, setStatus] = useState<any | null>(null)
  const [cycle, setCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await paymentApi.getStatus()
        if (data?.success) setStatus(data)
      } catch {
        /* ignore */
      }
    }
    loadStatus()
  }, [])

  const handleSubscribe = async (planType: string) => {
    if (planType === 'free') return

    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('studyhelp_selected_plan', planType)
      }
      setLoadingPlan(planType)
      const data = await paymentApi.initializePayment(planType)

      if (data?.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        toast.error('Failed to start payment. Please try again.')
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  // Define plan cards
  const displayPlans = isTeacherFlow
    ? [
      {
        key: 'free',
        name: 'Teacher Free Trial',
        price: 0,
        period: 'forever',
        badge: null,
        highlight: false,
        desc: 'Test all teacher tools with free runs.',
        features: [
          'Access all teacher tools',
          '3 free runs per tool (Lesson Note, Scheme, etc.)',
          'Export lesson notes & reports as PDF/Word',
          'Try StudyHelp in your classroom',
        ],
        cta: 'Current Plan',
      },
      {
        key: 'weekly',
        name: 'Teacher Basic',
        price: 700,
        period: 'week',
        badge: 'Short Pass',
        highlight: false,
        desc: 'Short-term access for lesson prep.',
        features: [
          'Unlimited Lesson Notes & Scheme of Work',
          'Access to Result Compiler & Report Comments',
          'Unlock saving & exporting all content',
          'Priority AI generation speed',
        ],
        cta: 'Upgrade Basic',
      },
      {
        key: 'monthly',
        name: 'Teacher Premium',
        price: 1500,
        period: 'month',
        badge: 'Most Popular',
        highlight: true,
        desc: 'Best value for full-term planning.',
        features: [
          'Unlimited access to ALL Teacher Tools',
          'Unlimited downloads (Word, PDF, Excel)',
          'Full-term planning & assessments',
          'Priority support for teachers',
        ],
        cta: 'Get Teacher Premium',
      },
    ]
    : [
      {
        key: 'free',
        name: 'Free Starter',
        price: 0,
        period: 'forever',
        badge: null,
        highlight: false,
        desc: 'Perfect for exploring StudyHelp CBT & AI.',
        features: [
          '3 practice CBT sessions',
          'Basic study timer & tracking',
          'Limited analytics view',
        ],
        cta: status?.subscription?.plan === 'free' || !status?.subscription?.plan ? 'Current Plan' : 'Free Plan',
      },
      {
        key: 'weekly',
        name: '7-Day Sprint',
        price: PLANS.weekly.price,
        period: 'week',
        badge: 'Exam Rush',
        highlight: cycle === 'weekly',
        desc: 'Ideal for quick revision before test day.',
        features: [
          'Unlimited CBT tests (JAMB, WAEC, Post-UTME)',
          'Unlimited AI explanations & tutoring',
          'Smart study timer & streak tracking',
          'Full progress analytics',
        ],
        cta: 'Start 7-Day Pass',
      },
      {
        key: 'monthly',
        name: 'Monthly Pro',
        price: PLANS.monthly.price,
        period: 'month',
        badge: 'Best Value',
        highlight: cycle === 'monthly',
        desc: 'Complete power for continuous high scores.',
        features: [
          'Unlimited CBT tests & practice sessions',
          'Unlimited AI questions & tutoring',
          'All exam types (JAMB, WAEC, Post-UTME)',
          'Full analytics & progress tracking',
          'Saved notes, highlights & streaks',
          'Priority AI speed & 24/7 support',
        ],
        cta: 'Get Monthly Pro',
      },
      {
        key: 'yearly',
        name: 'Annual Pass',
        price: PLANS.yearly.price,
        period: 'year',
        badge: 'Save 30%',
        highlight: cycle === 'yearly',
        desc: 'Ultimate year-round exam dominance.',
        features: [
          'Everything in Monthly Pro for 365 days',
          'Guaranteed lowest cost per month',
          'All upcoming AI updates & new features',
          'VIP Priority support',
        ],
        cta: 'Get Annual Pass',
      },
    ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-white px-4 sm:px-6 lg:px-8 py-6 pb-28">
        <div className="max-w-7xl mx-auto space-y-10">



          {/* ── Header ───────────────────────────────────────────────────────── */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-extrabold uppercase tracking-widest">
              <HiOutlineSparkles className="animate-spin text-sm" />
              {isTeacherFlow ? 'Teacher Suite Plans' : 'Unlimited Exam Preparation'}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              {isTeacherFlow ? (
                <>Empower Your Teaching with <span className="text-blue-600 dark:text-blue-400">Pro Tools</span></>
              ) : (
                <>Simple Plans for <span className="text-blue-600 dark:text-blue-400">Maximum Scores</span></>
              )}
            </h1>

            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
              {isTeacherFlow
                ? 'Unlock automated lesson notes, scheme of work generators, and instant report card compilers.'
                : 'Accelerate your study journey with unlimited past questions, AI explanations, and progress analytics.'}
            </p>

            {/* Free sessions warning banner */}
            {!isTeacherFlow && (status?.subscription?.plan === 'free' || !status?.subscription?.plan) && (
              <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-sm font-bold flex items-center justify-center gap-3 shadow-sm animate-pulse">
                <span className="text-xl">⚠️</span>
                <span>You're on the free plan. Upgrade now to unlock unlimited CBT tests for JAMB/WAEC!</span>
              </div>
            )}

            {/* Cycle Selector (For student flow) */}
            {!isTeacherFlow && (
              <div className="pt-4 flex justify-center">
                <div className="inline-flex p-1.5 bg-gray-200/70 dark:bg-gray-800/80 rounded-2xl border border-gray-300 dark:border-gray-700">
                  {(['weekly', 'monthly', 'yearly'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setCycle(c)}
                      className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all capitalize ${cycle === c
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                      {c === 'weekly' ? 'Weekly' : c === 'monthly' ? 'Monthly 🔥' : 'Yearly (Save 30%)'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Active Subscription Status Card ────────────────────────────── */}
          {status?.subscription && (
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900/90 rounded-3xl border border-blue-500/30 p-5 sm:p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold shrink-0">
                    <FiShield />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Active Plan</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {status.subscription.plan !== 'free' ? 'SUBSCRIBED' : 'FREE TIER'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white capitalize mt-0.5">
                      {status.subscription.plan} Plan
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/70 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-700 w-full sm:w-auto justify-between sm:justify-start">
                  <FiClock className="text-amber-500 text-lg" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <span className="font-bold text-amber-600 dark:text-amber-400">{status.subscription.daysLeft ?? 0} day(s)</span> remaining
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── Pricing Grid ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
            {displayPlans.map((plan) => {
              const isFree = plan.price === 0
              const isLoading = loadingPlan === plan.key

              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-3xl transition-all duration-300 bg-white dark:bg-gray-900 border-2 overflow-hidden shadow-lg hover:shadow-2xl ${plan.highlight
                      ? 'border-blue-500 ring-4 ring-blue-500/20 dark:ring-blue-500/30 lg:-translate-y-2'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-widest py-1.5 text-center">
                      {plan.badge}
                    </div>
                  )}

                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">{plan.name}</h3>
                        <div className={`p-2 rounded-xl ${plan.highlight ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                          {isFree ? <FiAward size={20} /> : <FiZap size={20} />}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                            {isFree ? '₦0' : `₦${plan.price.toLocaleString()}`}
                          </span>
                          {!isFree && (
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">/{plan.period}</span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 min-h-[32px]">
                          {plan.desc}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mb-6">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 block mb-3">
                          What's Included:
                        </span>
                        <ul className="space-y-3">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              <FiCheckCircle className="text-emerald-500 mt-0.5 shrink-0 text-base" />
                              <span className="leading-snug">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={isFree || isLoading}
                      className={`w-full min-h-[48px] py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${plan.highlight
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:shadow-blue-500/40'
                          : isFree
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-default shadow-none'
                            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                        } disabled:opacity-50`}
                    >
                      {isLoading ? (
                        <FiLoader className="animate-spin text-lg" />
                      ) : (
                        <>
                          <span>{plan.cta}</span>
                          {!isFree && <FiArrowRight size={16} />}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Custom School / Bulk Order Banner ─────────────────────────────── */}
          <div className="p-6 sm:p-10 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 text-white rounded-3xl shadow-2xl border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider text-blue-200">
                🏫 School & Tutorial Center Discount
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Need a custom bulk plan for 50+ students?</h2>
              <p className="text-sm text-blue-200 max-w-xl font-medium">
                Get custom teacher dashboards, student performance monitoring, and discounted licenses for your institution.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <a
                href="https://wa.me/2349163345794"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
              >
                <FaWhatsapp className="text-lg" />
                <span>WhatsApp Us</span>
              </a>
              <a
                href="tel:+2349163345794"
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-900 hover:bg-gray-100 font-bold text-sm rounded-2xl transition-all shadow-lg"
              >
                <FiPhone className="text-lg" />
                <span>Call Inquiry</span>
              </a>
            </div>
          </div>

          {/* ── FAQ Section ──────────────────────────────────────────────────── */}
          <div className="max-w-4xl mx-auto space-y-6 pt-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Frequently Asked Questions</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Everything you need to know about payments & plans</p>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-4 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                    >
                      <span className="flex items-center gap-3">
                        <FiHelpCircle className="text-blue-500 shrink-0" />
                        {item.q}
                      </span>
                      <span className="text-xl text-gray-400 shrink-0">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium border-t border-gray-100 dark:border-gray-800 pt-3 leading-relaxed">
                        {item.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
