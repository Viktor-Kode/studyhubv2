'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaBrain, FaClock, FaCalculator, FaBell, FaChartBar, FaBook } from 'react-icons/fa'

const features = [
  {
    icon: FaBrain,
    title: 'Personalized Question Bank',
    description: 'AI-generated practice questions based on your syllabus',
    color: 'emerald',
  },
  {
    icon: FaClock,
    title: 'Smart Study Timer',
    description: 'Pomodoro technique with session tracking',
    color: 'cyan',
  },
  {
    icon: FaCalculator,
    title: 'CGPA Calculator',
    description: 'Predict and track your academic performance',
    color: 'blue',
  },
  {
    icon: FaBell,
    title: 'Study Reminders',
    description: 'Never miss deadlines or study sessions',
    color: 'purple',
  },
  {
    icon: FaChartBar,
    title: 'Progress Analytics',
    description: 'Visual learning progress dashboard',
    color: 'emerald',
  },
]

const studyTools = [
  { name: 'Question Generator', icon: FaBook, description: 'Practice with AI-generated questions' },
  { name: 'Study Timer', icon: FaClock, description: 'Pomodoro technique timer' },
  { name: 'CGPA Tracker', icon: FaCalculator, description: 'Calculate and track grades' },
  { name: 'Reminders', icon: FaBell, description: 'Never miss important dates' },
]

export default function StudentFeatures() {
  const sectionRef = useRef<HTMLElement>(null)
  const [timerProgress, setTimerProgress] = useState(0)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo('.student-feature-card',
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

      gsap.fromTo('.study-tool-card',
        { scale: 0.8, opacity: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
          scale: 1,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.7)',
        }
      )

      // Animate timer
      gsap.to('.timer-progress', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
        rotation: 360,
        duration: 2,
        ease: 'none',
      })
    }, sectionRef)

    // Simulate timer progress
    const interval = setInterval(() => {
      setTimerProgress((prev) => (prev + 1) % 100)
    }, 100)

    return () => {
      ctx.revert()
      clearInterval(interval)
    }
  }, [])

  return (
    <section ref={sectionRef} id="student-features" className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <span className="text-sm text-emerald-400 font-mono uppercase tracking-wider">For Students</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI-Powered Study Tools
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Study smarter with personalized AI tools. Track progress, manage time, and excel in your studies.
            </p>
          </div>

          {/* Main Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colorClasses = {
                blue: 'border-blue-500/30 hover:border-blue-500/60 text-blue-400 bg-blue-500/10',
                cyan: 'border-cyan-400/30 hover:border-cyan-400/60 text-cyan-400 bg-cyan-400/10',
                purple: 'border-purple-500/30 hover:border-purple-500/60 text-purple-400 bg-purple-500/10',
                emerald: 'border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 bg-emerald-500/10',
              }
              return (
                <div
                  key={index}
                  className={`student-feature-card bg-white/5 backdrop-blur-md border ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-xl p-6 hover:scale-105 transition-all duration-300 opacity-100`}
                >
                  <div className={`w-14 h-14 ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="text-2xl" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>

          {/* Study Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {studyTools.map((tool, index) => {
              const Icon = tool.icon
              return (
                <div
                  key={index}
                  className="study-tool-card bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 text-center group opacity-100"
                >
                  <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="text-emerald-400 text-2xl" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{tool.name}</h4>
                  <p className="text-white/60 text-sm">{tool.description}</p>
                </div>
              )
            })}
          </div>

          {/* Interactive Dashboard Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Study Timer Visualization */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <FaClock className="text-emerald-400" />
                Study Timer
              </h3>
              <div className="relative w-48 h-48 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-white/10"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - timerProgress / 100)}`}
                    className="text-emerald-400 transition-all duration-300"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-1">
                      {Math.floor((100 - timerProgress) / 60)}:{(100 - timerProgress) % 60 < 10 ? '0' : ''}
                      {Math.floor((100 - timerProgress) % 60)}
                    </div>
                    <div className="text-white/60 text-sm">Pomodoro Session</div>
                  </div>
                </div>
              </div>
            </div>

            {/* CGPA Calculator Preview */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <FaCalculator className="text-blue-400" />
                CGPA Calculator
              </h3>
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white/80 text-sm">Current CGPA</span>
                    <span className="text-2xl font-bold text-blue-400">3.75</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[75%]"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                    <div className="text-white/60 text-xs mb-1">Target CGPA</div>
                    <div className="text-xl font-bold text-white">4.0</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                    <div className="text-white/60 text-xs mb-1">Remaining</div>
                    <div className="text-xl font-bold text-emerald-400">0.25</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
