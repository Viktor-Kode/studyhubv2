'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaUserGraduate, FaArrowRight, FaCheck } from 'react-icons/fa'
import Link from 'next/link'

const benefits = [
  'AI-powered practice questions',
  'Study tools and progress tracking',
  'Built for exams and daily study',
]

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cta-panel',
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
          ease: 'power3.out',
        }
      )

      gsap.fromTo(
        '.cta-benefit',
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
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to study smarter?
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto mb-2">
              Create a free account and open your dashboard in minutes.
            </p>
            <p className="text-white/40 text-sm">
              No credit card required • Instant access • Cancel anytime
            </p>
          </div>

          <div className="max-w-lg mx-auto mb-12">
            <div className="cta-panel bg-white/5 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-8 hover:border-emerald-500/60 transition-all duration-300 group opacity-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FaUserGraduate className="text-emerald-400 text-2xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Get started</h3>
                  <p className="text-white/60 text-sm">AI-powered learning in one dashboard</p>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {benefits.map((benefit, i) => (
                  <li key={i} className="cta-benefit flex items-center gap-3">
                    <FaCheck className="text-emerald-400 flex-shrink-0" />
                    <span className="text-white/80">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/signup"
                className="group block w-full bg-emerald-500 text-white py-4 rounded-lg font-bold text-center hover:bg-emerald-600 transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center justify-center gap-2">
                  Create free account
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-300"
            >
              Already have an account? Log in
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
