'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaClock, FaChartLine, FaUsers, FaShieldAlt } from 'react-icons/fa'

const benefits = [
  {
    role: 'Teachers',
    icon: FaClock,
    metric: '10+ hours',
    description: 'Save weekly on question creation',
    color: 'blue',
  },
  {
    role: 'Students',
    icon: FaChartLine,
    metric: '30%',
    description: 'Improve test scores with targeted practice',
    color: 'emerald',
  },
  {
    role: 'Institutions',
    icon: FaShieldAlt,
    metric: '100%',
    description: 'Standardized question quality across courses',
    color: 'purple',
  },
  {
    role: 'Administrators',
    icon: FaUsers,
    metric: '360°',
    description: 'Comprehensive learning analytics',
    color: 'cyan',
  },
]

export default function BenefitsSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo('.benefit-card', 
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
          stagger: 0.15,
          ease: 'power3.out',
        }
      )

      // Animate counters
      gsap.from('.benefit-metric', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
        scale: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.7)',
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="benefits" className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Benefits for Education
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Measurable impact across all levels of education
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              const colorClasses = {
                blue: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
                cyan: 'border-cyan-400/30 text-cyan-400 bg-cyan-400/10',
                purple: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
                emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
              }
              return (
                <div
                  key={index}
                  className={`benefit-card bg-white/5 backdrop-blur-md border ${colorClasses[benefit.color as keyof typeof colorClasses]} rounded-xl p-6 hover:scale-105 transition-all duration-300 text-center opacity-100`}
                >
                  <div className={`w-16 h-16 ${colorClasses[benefit.color as keyof typeof colorClasses]} rounded-full flex items-center justify-center mx-auto mb-4 border-2`}>
                    <Icon className="text-2xl" />
                  </div>
                  <div className="benefit-metric text-4xl font-bold text-white mb-2">
                    {benefit.metric}
                  </div>
                  <div className="text-white/60 text-sm font-semibold mb-2">{benefit.role}</div>
                  <p className="text-white/60 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
