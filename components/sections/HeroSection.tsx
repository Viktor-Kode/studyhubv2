'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaArrowRight, FaChalkboardTeacher, FaUserGraduate, FaFileUpload, FaBrain } from 'react-icons/fa'
import Link from 'next/link'
import NeuralNetwork from '@/components/hero/NeuralNetwork'
import HexGrid from '@/components/hero/HexGrid'

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)
  const [hoveredRole, setHoveredRole] = useState<'teacher' | 'student' | null>(null)

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
              One Platform, Two Experiences: AI-Powered Education Tools
            </p>
          </div>

          {/* Main Title */}
            <h1 className="hero-title text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 text-center leading-tight opacity-100">
            Transform Education with AI:<br />
            <span className="text-cyan-400">Smarter Teaching, Deeper Learning</span>
          </h1>

          {/* Subtitle */}
            <p className="hero-subtitle text-xl md:text-2xl text-white/70 mb-12 text-center max-w-3xl mx-auto leading-relaxed opacity-100">
            Upload lesson materials, get instant questions. Study smarter with AI tools. One platform for educators and students.
          </p>

          {/* Split Layout: Teacher and Student Previews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Teacher Dashboard Preview */}
            <div
              className="dashboard-preview relative group opacity-100"
              onMouseEnter={() => setHoveredRole('teacher')}
              onMouseLeave={() => setHoveredRole(null)}
            >
              <div className="bg-white/5 backdrop-blur-md border-2 border-blue-500/30 rounded-2xl p-6 hover:border-blue-500/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
                {/* Teacher Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/50 rounded-lg flex items-center justify-center">
                    <FaChalkboardTeacher className="text-blue-400 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Teacher Dashboard</h3>
                    <p className="text-white/60 text-sm">AI Question Generator</p>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="space-y-3">
                  <div className="glass-panel bg-white/5 border border-white/10 rounded-lg p-4 opacity-100">
                    <div className="flex items-center gap-2 mb-2">
                      <FaFileUpload className="text-blue-400" />
                      <span className="text-white/80 text-sm font-medium">Upload PDF</span>
                    </div>
                    <div className="h-2 bg-blue-500/20 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-3/4"></div>
                    </div>
                  </div>

                  <div className="glass-panel bg-white/5 border border-white/10 rounded-lg p-4 opacity-100">
                    <div className="flex items-center gap-2 mb-2">
                      <FaBrain className="text-cyan-400" />
                      <span className="text-white/80 text-sm font-medium">AI Processing...</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-1 h-8 bg-cyan-400/20 rounded border border-cyan-400/30"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Teacher CTA */}
              <Link
                href="/signup?role=teacher"
                className="hero-cta mt-4 group relative bg-blue-500 text-white px-8 py-4 rounded-lg hover:bg-blue-600 transition-all duration-300 font-bold text-lg uppercase tracking-wide overflow-hidden block text-center"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center space-x-3">
                  <span>Start Creating AI Questions</span>
                  <FaArrowRight className="group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </Link>
            </div>

            {/* Student Dashboard Preview */}
            <div
              className="dashboard-preview relative group opacity-100"
              onMouseEnter={() => setHoveredRole('student')}
              onMouseLeave={() => setHoveredRole(null)}
            >
              <div className="bg-white/5 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20">
                {/* Student Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-center justify-center">
                    <FaUserGraduate className="text-emerald-400 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Student Dashboard</h3>
                    <p className="text-white/60 text-sm">AI-Powered Study Tools</p>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="space-y-3">
                  <div className="glass-panel bg-white/5 border border-white/10 rounded-lg p-4 opacity-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 text-sm font-medium">Study Progress</span>
                      <span className="text-emerald-400 text-sm font-bold">75%</span>
                    </div>
                    <div className="h-2 bg-emerald-500/20 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-3/4"></div>
                    </div>
                  </div>

                  <div className="glass-panel bg-white/5 border border-white/10 rounded-lg p-4 opacity-100">
                    <div className="grid grid-cols-3 gap-2">
                      {['Timer', 'CGPA', 'Reminder'].map((tool) => (
                        <div key={tool} className="h-12 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-center">
                          <span className="text-emerald-400 text-xs font-medium">{tool}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Student CTA */}
              <Link
                href="/signup?role=student"
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

          {/* Connecting Animation Line */}
          <div className="relative max-w-2xl mx-auto mb-12">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-cyan-400/50 to-emerald-500/50 transform -translate-x-1/2"></div>
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 bg-cyan-400/20 border-2 border-cyan-400/50 rounded-full flex items-center justify-center backdrop-blur-md">
                <FaBrain className="text-cyan-400 text-2xl animate-pulse" />
              </div>
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
