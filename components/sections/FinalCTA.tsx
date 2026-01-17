'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaChalkboardTeacher, FaUserGraduate, FaArrowRight, FaCheck } from 'react-icons/fa'
import Link from 'next/link'

const teacherBenefits = [
  'Generate questions in minutes',
  'Save 10+ hours weekly',
  'Track student performance',
]

const studentBenefits = [
  'AI-powered practice questions',
  'Study tools & progress tracking',
  'Improve test scores by 30%',
]

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo('.cta-panel',
        { y: 50, opacity: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2,
          ease: 'power3.out',
        }
      )

      gsap.fromTo('.cta-benefit',
        { x: -20, opacity: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
          x: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          delay: 0.3,
          ease: 'power3.out',
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="final-cta" className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Transform Education?
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto mb-2">
              One account, dual dashboard. Start generating questions or begin studying in 2 minutes.
            </p>
            <p className="text-white/40 text-sm">
              No credit card required • Instant access • Cancel anytime
            </p>
          </div>

          {/* Dual Path CTA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Teacher Path */}
            <div className="cta-panel bg-white/5 backdrop-blur-md border-2 border-blue-500/30 rounded-2xl p-8 hover:border-blue-500/60 transition-all duration-300 group opacity-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-500/20 border-2 border-blue-500/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FaChalkboardTeacher className="text-blue-400 text-2xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">I'm a Teacher</h3>
                  <p className="text-white/60 text-sm">Start creating AI questions</p>
                </div>
              </div>

              {/* Benefits */}
              <ul className="space-y-3 mb-6">
                {teacherBenefits.map((benefit, i) => (
                  <li key={i} className="cta-benefit flex items-center gap-3">
                    <FaCheck className="text-blue-400 flex-shrink-0" />
                    <span className="text-white/80">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href="/signup?role=teacher"
                className="group block w-full bg-blue-500 text-white py-4 rounded-lg font-bold text-center hover:bg-blue-600 transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center justify-center gap-2">
                  Start Creating AI Questions
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>

            {/* Student Path */}
            <div className="cta-panel bg-white/5 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-8 hover:border-emerald-500/60 transition-all duration-300 group opacity-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FaUserGraduate className="text-emerald-400 text-2xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">I'm a Student</h3>
                  <p className="text-white/60 text-sm">Begin AI-powered learning</p>
                </div>
              </div>

              {/* Benefits */}
              <ul className="space-y-3 mb-6">
                {studentBenefits.map((benefit, i) => (
                  <li key={i} className="cta-benefit flex items-center gap-3">
                    <FaCheck className="text-emerald-400 flex-shrink-0" />
                    <span className="text-white/80">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href="/signup?role=student"
                className="group block w-full bg-emerald-500 text-white py-4 rounded-lg font-bold text-center hover:bg-emerald-600 transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center justify-center gap-2">
                  Begin AI-Powered Learning
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>

          {/* Unified Signup Option */}
          <div className="text-center">
            <p className="text-white/60 mb-4">
              Not sure which role? You can switch between dashboards anytime.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-300"
            >
              Create Account
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
