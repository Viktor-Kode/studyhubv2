'use client'

import { Check, Zap } from 'lucide-react'
import Link from 'next/link'
import { PLANS } from '@/lib/config/plans'

export default function PricingSection() {
  return (
    <section className="py-24 bg-[#0a0d1a]" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-bold mb-4 uppercase tracking-widest">
            Pricing
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Simple, Affordable Plans</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Built for Nigerian students. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="relative group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300 flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-2">{PLANS.free.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">₦0</span>
                <span className="text-slate-500 text-sm">forever</span>
              </div>
              <p className="text-slate-500 text-sm mt-4">Get started with no commitment</p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {PLANS.free.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                  <Check size={18} className="text-purple-500 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="w-full py-4 rounded-xl border border-slate-700 text-white font-bold text-center hover:bg-white hover:text-black transition-all duration-300">
              Get Started Free
            </Link>
          </div>

          {/* Weekly Plan */}
          <div className="relative group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Popular
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-2">{PLANS.weekly.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">₦{PLANS.weekly.price.toLocaleString()}</span>
                <span className="text-slate-500 text-sm">/ week</span>
              </div>
              <p className="text-slate-500 text-sm mt-4">Perfect for exam season</p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {PLANS.weekly.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                  <Check size={18} className="text-purple-500 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="w-full py-4 rounded-xl bg-purple-600 text-white font-bold text-center hover:bg-purple-700 transition-all duration-300 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
              Start Weekly Plan
            </Link>
          </div>

          {/* Monthly Plan */}
          <div className="relative group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300 flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-2">{PLANS.monthly.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">₦{PLANS.monthly.price.toLocaleString()}</span>
                <span className="text-slate-500 text-sm">/ month</span>
              </div>
              <p className="text-slate-500 text-sm mt-4">{PLANS.monthly.savings}</p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {PLANS.monthly.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                  <Check size={18} className="text-purple-500 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link href="/auth/signup" className="w-full py-4 rounded-xl border border-slate-700 text-white font-bold text-center hover:bg-white hover:text-black transition-all duration-300">
              Start Monthly Plan
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-8 text-slate-500 text-xs font-medium uppercase tracking-widest">
          <span>✅ Pay with card, bank or USSD</span>
          <span>✅ Instant activation</span>
          <span>✅ No auto-renewal</span>
        </div>
      </div>
    </section>
  )
}
