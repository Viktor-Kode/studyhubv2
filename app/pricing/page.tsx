'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/authStore'
import { FiCheckCircle, FiZap, FiAward, FiArrowRight, FiPhone, FiHelpCircle } from 'react-icons/fi'
import { HiOutlineSparkles } from 'react-icons/hi'
import { FaWhatsapp } from 'react-icons/fa'
import { PLANS } from '@/lib/config/plans'
import { useState } from 'react'

export default function PublicPricingPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [cycle, setCycle] = useState<'weekly' | 'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleAction = (planKey: string) => {
    if (user) {
      router.push(`/dashboard/pricing?plan=${planKey}`)
    } else {
      router.push(`/auth/signup?plan=${planKey}`)
    }
  }

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

  const displayPlans = [
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
      cta: 'Get Started Free',
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* ── Navbar brand ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg">⚡</span>
            <span>StudyHelp</span>
          </Link>

          <Link
            href={user ? '/dashboard/student' : '/auth/login'}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-bold transition"
          >
            {user ? 'Dashboard' : 'Sign In'}
          </Link>
        </div>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-extrabold uppercase tracking-widest">
            <HiOutlineSparkles className="animate-spin text-sm" />
            Simple & Transparent Pricing
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Invest in Your Future with <span className="text-blue-500">Unbeatable Value</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
            Built for Nigerian students preparing for JAMB, WAEC & Post-UTME. No hidden fees. Cancel or upgrade anytime.
          </p>

          {/* Cycle Selector */}
          <div className="pt-4 flex justify-center">
            <div className="inline-flex p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700">
              {(['weekly', 'monthly', 'yearly'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all capitalize ${
                    cycle === c
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {c === 'weekly' ? 'Weekly' : c === 'monthly' ? 'Monthly 🔥' : 'Yearly (Save 30%)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pricing Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {displayPlans.map((plan) => {
            const isFree = plan.price === 0

            return (
              <div
                key={plan.key}
                className={`relative flex flex-col rounded-3xl transition-all duration-300 bg-slate-900 border-2 overflow-hidden shadow-xl hover:shadow-2xl ${
                  plan.highlight
                    ? 'border-blue-500 ring-4 ring-blue-500/30 lg:-translate-y-2'
                    : 'border-slate-800 hover:border-slate-700'
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
                      <h3 className="text-xl font-black text-white">{plan.name}</h3>
                      <div className={`p-2 rounded-xl ${plan.highlight ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                        {isFree ? <FiAward size={20} /> : <FiZap size={20} />}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                          {isFree ? '₦0' : `₦${plan.price.toLocaleString()}`}
                        </span>
                        {!isFree && (
                          <span className="text-xs font-semibold text-slate-400">/{plan.period}</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-400 mt-2 min-h-[32px]">
                        {plan.desc}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="pt-4 border-t border-slate-800 mb-6">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-3">
                        What's Included:
                      </span>
                      <ul className="space-y-3">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-300">
                            <FiCheckCircle className="text-emerald-400 mt-0.5 shrink-0 text-base" />
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleAction(plan.key)}
                    className={`w-full min-h-[48px] py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                      plan.highlight
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:shadow-blue-500/40'
                        : isFree
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-white text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>{plan.cta}</span>
                    <FiArrowRight size={16} />
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
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-sm rounded-2xl transition-all shadow-lg"
            >
              <FiPhone className="text-lg" />
              <span>Call Inquiry</span>
            </a>
          </div>
        </div>

        {/* ── FAQ Section ──────────────────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto space-y-6 pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-400 font-medium">Everything you need to know about payments & plans</p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-sm sm:text-base flex items-center justify-between gap-4 text-white hover:bg-slate-800/50 transition"
                  >
                    <span className="flex items-center gap-3">
                      <FiHelpCircle className="text-blue-500 shrink-0" />
                      {item.q}
                    </span>
                    <span className="text-xl text-slate-400 shrink-0">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 font-medium border-t border-slate-800 pt-3 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
