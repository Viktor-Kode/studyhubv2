'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaArrowRight, FaShieldAlt, FaLock, FaCheck } from 'react-icons/fa'
import Link from 'next/link'

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.from('.cta-content', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      })

      gsap.from('.trust-badge', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
        scale: 0,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.3,
        ease: 'back.out(1.7)',
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="cta-content bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
              Join thousands of students getting expert help 24/7
            </p>

            {/* Email Input */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mb-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-white/5 border border-white/20 rounded-lg px-6 py-4 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300"
              />
              <Link
                href="/signup"
                className="group bg-cyan-400 text-black px-8 py-4 rounded-lg hover:bg-cyan-300 transition-all duration-300 font-bold uppercase tracking-wide hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6">
              <div className="trust-badge flex items-center gap-2 text-white/60 text-sm">
                <FaShieldAlt className="text-cyan-400" />
                <span>Secure & Private</span>
              </div>
              <div className="trust-badge flex items-center gap-2 text-white/60 text-sm">
                <FaLock className="text-cyan-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="trust-badge flex items-center gap-2 text-white/60 text-sm">
                <FaCheck className="text-cyan-400" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
