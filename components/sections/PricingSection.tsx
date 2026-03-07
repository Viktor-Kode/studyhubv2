'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaCheck, FaStar, FaZap, FaAward, FaPlus } from 'react-icons/fa'
import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    icon: FaStar,
    price: '₦0',
    period: '',
    features: [
      '5 AI messages',
      '3 flashcard sets',
      'Basic CBT practice',
      'Limited subjects',
    ],
    color: 'gray',
    cta: 'Get Started',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Weekly',
    icon: FaZap,
    price: '₦600',
    period: '/week',
    features: [
      '80 AI messages',
      '40 flashcard sets',
      'Full CBT access',
      'Basic analytics',
      'Study plan',
    ],
    color: 'blue',
    cta: 'Get Weekly',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Monthly',
    icon: FaAward,
    price: '₦2,300',
    period: '/month',
    features: [
      '250 AI messages',
      '120 flashcard sets',
      'Full CBT + Exam Mode',
      'Advanced analytics',
      'Full study plan',
      'Priority features',
    ],
    color: 'emerald',
    cta: 'Get Monthly',
    href: '/auth/signup',
    highlight: true,
  },
  {
    name: 'AI Add-On',
    icon: FaPlus,
    price: '₦500',
    period: '',
    features: [
      '+100 AI messages',
      'Added to current plan',
      'Never expires',
    ],
    color: 'purple',
    cta: 'Buy Add-On',
    href: '/auth/signup',
    highlight: false,
  },
]

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo('.pricing-card',
        { y: 50, opacity: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const colorClasses: Record<string, string> = {
    gray: 'border-white/20 hover:border-white/40 bg-white/5',
    blue: 'border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5',
    emerald: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5',
    purple: 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5',
  }
  const textColorClasses: Record<string, string> = {
    gray: 'text-white/80',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
  }
  const btnClasses: Record<string, string> = {
    gray: 'bg-white/20 text-white hover:bg-white/30',
    blue: 'bg-blue-500 text-white hover:bg-blue-600',
    emerald: 'bg-emerald-500 text-white hover:bg-emerald-600',
    purple: 'bg-purple-500 text-white hover:bg-purple-600',
  }

  return (
    <section ref={sectionRef} id="pricing" className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Choose the plan that fits your study journey. Unlock more AI power, tests, and features.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => {
              const Icon = plan.icon
              return (
                <div
                  key={index}
                  className={`pricing-card bg-white/5 backdrop-blur-md border-2 ${colorClasses[plan.color]} rounded-2xl p-8 hover:scale-105 transition-all duration-300 relative opacity-100 ${
                    plan.highlight ? 'ring-4 ring-emerald-500/20 border-emerald-500/60 scale-105 z-10' : ''
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  {/* Icon */}
                  <div className={`w-16 h-16 ${colorClasses[plan.color]} border-2 rounded-lg flex items-center justify-center mb-6`}>
                    <Icon className={`${textColorClasses[plan.color]} text-2xl`} />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-6">
                    <span className={`text-4xl font-bold ${textColorClasses[plan.color]}`}>
                      {plan.price}
                    </span>
                    <span className="text-white/60 text-lg">{plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <FaCheck className={`${textColorClasses[plan.color]} mt-1 flex-shrink-0`} />
                        <span className="text-white/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.href}
                    className={`block w-full text-center py-3 rounded-lg font-bold transition-all duration-300 ${btnClasses[plan.color]}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Note */}
          <div className="text-center mt-12">
            <p className="text-white/60 text-sm">
              No credit card required for free plan. Log in to upgrade from your dashboard.
            </p>
            <Link href="/auth/signup" className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 font-medium">
              Create free account →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
