'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaCheck, FaChalkboardTeacher, FaUserGraduate, FaBuilding } from 'react-icons/fa'
import Link from 'next/link'

const teacherPlan = {
  name: 'Teacher Plan',
  icon: FaChalkboardTeacher,
  price: '₦29,000',
  period: '/month',
  features: [
    'Unlimited AI question generation',
    'All question types included',
    'Class management tools',
    'Student performance analytics',
    'LMS integration',
    'Export to multiple formats',
  ],
  color: 'blue',
  cta: 'Start Teaching',
}

const studentPlan = {
  name: 'Student Plan',
  icon: FaUserGraduate,
  price: '₦9,000',
  period: '/month',
  features: [
    'AI-generated practice questions',
    'Study timer & Pomodoro',
    'CGPA calculator & tracker',
    'Study reminders',
    'Progress analytics',
    'Personalized question bank',
  ],
  color: 'emerald',
  cta: 'Start Learning',
}

const institutionPlan = {
  name: 'Institution Plan',
  icon: FaBuilding,
  price: 'Custom',
  period: '',
  features: [
    'Everything in Teacher & Student plans',
    'Admin dashboard & controls',
    'Multi-campus support',
    'Custom integrations',
    'Dedicated support',
    'Advanced analytics',
  ],
  color: 'purple',
  cta: 'Contact Sales',
}

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

  const plans = [teacherPlan, studentPlan, institutionPlan]

  return (
    <section ref={sectionRef} id="pricing" className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Pricing by Role
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Choose the plan that fits your needs. One account, dual dashboard access.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const Icon = plan.icon
              const colorClasses = {
                blue: 'border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5',
                emerald: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5',
                purple: 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5',
              }
              const textColorClasses = {
                blue: 'text-blue-400',
                emerald: 'text-emerald-400',
                purple: 'text-purple-400',
              }
              return (
                <div
                  key={index}
                  className={`pricing-card bg-white/5 backdrop-blur-md border-2 ${colorClasses[plan.color as keyof typeof colorClasses]} rounded-2xl p-8 hover:scale-105 transition-all duration-300 relative opacity-100`}
                >
                  {/* Icon */}
                  <div className={`w-16 h-16 ${colorClasses[plan.color as keyof typeof colorClasses]} border-2 rounded-lg flex items-center justify-center mb-6`}>
                    <Icon className={`${textColorClasses[plan.color as keyof typeof textColorClasses]} text-2xl`} />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

                  {/* Price */}
                  <div className="mb-6">
                    <span className={`text-4xl font-bold ${textColorClasses[plan.color as keyof typeof textColorClasses]}`}>
                      {plan.price}
                    </span>
                    <span className="text-white/60 text-lg">{plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <FaCheck className={`${textColorClasses[plan.color as keyof typeof textColorClasses]} mt-1 flex-shrink-0`} />
                        <span className="text-white/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.name === 'Institution Plan' ? '/contact' : '/signup'}
                    className={`block w-full text-center py-3 rounded-lg font-bold transition-all duration-300 ${
                      plan.color === 'blue'
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : plan.color === 'emerald'
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-purple-500 text-white hover:bg-purple-600'
                    }`}
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
              All plans include 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
