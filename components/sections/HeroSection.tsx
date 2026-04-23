'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaArrowRight, FaUserGraduate, FaBrain } from 'react-icons/fa'
import Link from 'next/link'
import NeuralNetwork from '@/components/hero/NeuralNetwork'
import HexGrid from '@/components/hero/HexGrid'

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!heroRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      // Animate title
      gsap.from('.hero-title', {
        y: 50,
        opacity: 0,
        duration: 1,
        delay: 0.5,
        ease: 'power3.out'
      })

      // Animate subtitle
      gsap.from('.hero-subtitle', {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.8,
        ease: 'power3.out'
      })

      // Animate tagline
      gsap.from('.hero-tagline', {
        opacity: 0,
        duration: 1,
        delay: 1.1,
        ease: 'power3.out'
      })

      // Animate CTAs
      gsap.from('.hero-cta', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 1.4,
        stagger: 0.2,
        ease: 'back.out(1.7)'
      })

      // Animate dashboard previews
      gsap.from('.dashboard-preview', {
        scale: 0.8,
        opacity: 0,
        duration: 1,
        delay: 1.6,
        stagger: 0.2,
        ease: 'power3.out'
      })

      // Animate glass panels
      gsap.from('.glass-panel', {
        y: 50,
        opacity: 0,
        rotation: -5,
        duration: 0.8,
        delay: 1.8,
        stagger: 0.15,
        ease: 'power3.out'
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={heroRef} className="min-h-screen bg-[#0a0a0a] relative z-0 overflow-hidden">
      {/* Background Layers */}
      <HexGrid />
      <NeuralNetwork />

      {/* Main Hero Content */}
      <div className="relative z-10 container mx-auto px-4 pt-32 md:pt-40 pb-20 md:pb-32">
        <div className="max-w-7xl mx-auto">
          {/* Tagline */}
          <div className="text-center mb-8">
            <p className="hero-tagline inline-flex items-center px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-sm text-cyan-400 font-mono uppercase tracking-wider opacity-100">
              AI-Powered Study Tools in One Place
            </p>
          </div>

          {/* Main Title */}
            <h1 className="hero-title text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 text-center leading-tight opacity-100">
            Study smarter with AI:<br />
            <span className="text-cyan-400">Practice, progress, and focus</span>
          </h1>

          {/* Subtitle */}
            <p className="hero-subtitle text-xl md:text-2xl text-white/70 mb-12 text-center max-w-3xl mx-auto leading-relaxed opacity-100">
            Turn notes into practice questions, track progress, and study smarter with AI—all in one place.
          </p>

          <div className="max-w-xl mx-auto mb-12">
            {/* Dashboard Preview */}
            <div className="dashboard-preview relative group opacity-100">
              <div className="bg-white/5 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
                {/* Video Embed */}
                <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                  <iframe 
                    src="https://marketing-motion-maker--victorand804.replit.app" 
                    className="absolute top-0 left-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Student CTA */}
              <Link
                href="/auth/signup"
                className="hero-cta mt-4 group relative bg-emerald-500 text-white px-8 py-4 rounded-lg hover:bg-emerald-600 transition-all duration-300 font-bold text-lg uppercase tracking-wide overflow-hidden block text-center"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center space-x-3">
                  <span>Begin AI-Powered Learning</span>
                  <FaArrowRight className="group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center space-y-2 animate-bounce">
          <span className="text-white/40 text-xs uppercase tracking-widest font-mono">Scroll</span>
        </div>
      </div>
    </div>
  )
}
