'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaGraduationCap, FaArrowRight, FaArrowDown } from 'react-icons/fa'
import Link from 'next/link'
import NeuralNetwork from '@/components/hero/NeuralNetwork'
import HexGrid from '@/components/hero/HexGrid'
import TerminalText from '@/components/hero/TerminalText'
import GlassCard from '@/components/hero/GlassCard'
import FeaturesGrid from '@/components/sections/FeaturesGrid'
import ProcessFlow from '@/components/sections/ProcessFlow'
import Testimonials from '@/components/sections/Testimonials'
import CTASection from '@/components/sections/CTASection'
import Footer from '@/components/sections/Footer'

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize GSAP
    gsap.registerPlugin(ScrollTrigger)

    // Hero animations
    const ctx = gsap.context(() => {
      // Subtitle animation
      gsap.from('.hero-subtitle', {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 2,
        ease: 'power3.out'
      })

      // Button animation
      gsap.from('.hero-cta', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 2.5,
        stagger: 0.2,
        ease: 'back.out(1.7)'
      })

      // Stats cards animation
      gsap.from('.stat-card', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        delay: 3,
        stagger: 0.15,
        ease: 'power3.out'
      })

      // Scroll indicator
      gsap.to('.scroll-indicator', {
        y: 10,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={heroRef} className="min-h-screen bg-[#0a0a0a] relative z-0 overflow-hidden">
      {/* Background Layers */}
      <HexGrid />
      <NeuralNetwork />

      {/* Navigation */}
      <nav className="relative z-20 container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 border border-cyan-400 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:border-cyan-300 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]">
              <FaGraduationCap className="text-cyan-400 text-lg" />
            </div>
            <span className="text-2xl font-bold text-white font-mono tracking-tight">
              StudyHelp
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-white/60 hover:text-white font-medium transition-colors duration-300 uppercase tracking-wide text-sm"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-cyan-400 text-black px-6 py-2.5 rounded-lg hover:bg-cyan-300 transition-all duration-300 font-bold text-sm uppercase tracking-wide hover:shadow-[0_0_30px_rgba(0,255,255,0.6)] hover:scale-105"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Hero Content - Left Aligned (70%) */}
      <div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 items-center">
          {/* Left Content (70%) */}
          <div className="lg:col-span-7">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8">
              <span className="text-sm text-cyan-400 font-mono uppercase tracking-wider">AI-Powered Learning Platform</span>
            </div>

            {/* Main Title with Terminal Effect */}
            <h1 className="hero-title text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight font-sans">
              <TerminalText 
                text="StudyHelp: Where Questions Meet Expert Answers" 
                speed={60}
                className="block"
              />
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle text-xl md:text-2xl text-white/70 mb-12 max-w-2xl leading-relaxed font-light">
              Real-time academic support powered by AI and verified educators
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 hero-cta">
              <Link
                href="/signup"
                className="group relative bg-cyan-400 text-black px-10 py-4 rounded-lg hover:bg-cyan-300 transition-all duration-300 font-bold text-lg uppercase tracking-wide overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center space-x-3">
                  <span>Start Free Trial</span>
                  <FaArrowRight className="group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Link>
              
              <Link
                href="/login"
                className="group bg-white/5 backdrop-blur-sm border border-white/20 text-white px-10 py-4 rounded-lg hover:bg-white/10 hover:border-cyan-400/50 transition-all duration-300 font-bold text-lg uppercase tracking-wide"
              >
                <span className="relative flex items-center justify-center space-x-3">
                  <span>View Demo</span>
                </span>
              </Link>
            </div>
          </div>

          {/* Right Sidebar (30%) - Stats Cards */}
          <div className="lg:col-span-3 space-y-4">
            <GlassCard className="stat-card">
              <div className="text-4xl font-bold text-white mb-2 font-mono">2,500+</div>
              <div className="text-white/60 uppercase tracking-wide text-sm">Expert Tutors</div>
            </GlassCard>

            <GlassCard className="stat-card">
              <div className="text-4xl font-bold text-white mb-2 font-mono">24/7</div>
              <div className="text-white/60 uppercase tracking-wide text-sm">Availability</div>
            </GlassCard>

            <GlassCard className="stat-card">
              <div className="text-4xl font-bold text-white mb-2 font-mono">92%</div>
              <div className="text-white/60 uppercase tracking-wide text-sm">Satisfaction Rate</div>
            </GlassCard>

            <GlassCard className="stat-card">
              <div className="text-4xl font-bold text-cyan-400 mb-2 font-mono">15min</div>
              <div className="text-white/60 uppercase tracking-wide text-sm">Avg Response</div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 scroll-indicator">
        <div className="flex flex-col items-center space-y-2">
          <span className="text-white/40 text-xs uppercase tracking-widest font-mono">Scroll</span>
          <FaArrowDown className="text-cyan-400/60 text-xl" />
        </div>
      </div>

      {/* Progress Bar on Left */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-20 hidden md:block">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-1 h-32 bg-white/10 rounded-full overflow-hidden">
            <div className="w-full h-0 bg-cyan-400 rounded-full transition-all duration-300" style={{ height: '20%' }}></div>
          </div>
          <div className="flex flex-col space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1 h-1 bg-white/20 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Sections */}
      <FeaturesGrid />
      <ProcessFlow />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  )
}
