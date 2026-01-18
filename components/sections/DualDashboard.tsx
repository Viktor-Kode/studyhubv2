'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaChalkboardTeacher, FaUserGraduate, FaSync, FaChartLine, FaCalendar, FaBook, FaClock, FaCalculator } from 'react-icons/fa'

const teacherFeatures = [
  { icon: FaBook, label: 'Question Generation' },
  { icon: FaChartLine, label: 'Analytics' },
  { icon: FaCalendar, label: 'Scheduling' },
  { icon: FaSync, label: 'Class Management' },
]

const studentFeatures = [
  { icon: FaBook, label: 'Practice Questions' },
  { icon: FaClock, label: 'Study Timer' },
  { icon: FaCalculator, label: 'CGPA Tracker' },
  { icon: FaCalendar, label: 'Reminders' },
]

export default function DualDashboard() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo('.dashboard-panel',
        (index: number) => ({ x: index === 0 ? -100 : 100, opacity: 0 }),
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
          x: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2,
          ease: 'power3.out',
        }
      )

      gsap.from('.sync-animation', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
        scale: 0,
        opacity: 0,
        duration: 0.8,
        delay: 0.5,
        ease: 'back.out(1.7)',
      })

      // Animate data flow
      gsap.to('.data-flow', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
        x: '100%',
        duration: 2,
        repeat: -1,
        ease: 'none',
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="dual-dashboard" className="py-20 md:py-32 bg-[#0a0a0a] relative z-10 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Dual Dashboard Experience
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              One platform, two powerful interfaces. See how teachers and students work together seamlessly.
            </p>
          </div>

          {/* Side-by-Side Dashboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Teacher Dashboard */}
            <div className="dashboard-panel bg-white/5 backdrop-blur-md border-2 border-blue-500/30 rounded-2xl p-6 hover:border-blue-500/60 transition-all duration-300 opacity-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/50 rounded-lg flex items-center justify-center">
                  <FaChalkboardTeacher className="text-blue-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Teacher Dashboard</h3>
                  <p className="text-white/60 text-sm">AI Question Generator & Analytics</p>
                </div>
              </div>

              {/* Dashboard Preview */}
              <div className="space-y-4">
                {/* Class Management */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/80 text-sm font-medium">Active Classes</span>
                    <span className="text-blue-400 text-sm font-bold">3</span>
                  </div>
                  <div className="space-y-2">
                    {['CS101', 'MATH201', 'PHYS301'].map((cls, i) => (
                      <div key={i} className="h-10 bg-blue-500/10 border border-blue-500/30 rounded flex items-center px-4">
                        <span className="text-white/80 text-sm font-medium">{cls}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Question Generation Panel */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaBook className="text-cyan-400 text-sm" />
                    <span className="text-white/80 text-sm font-medium">Question Generation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {teacherFeatures.map((feature, i) => {
                      const Icon = feature.icon
                      return (
                        <div key={i} className="h-16 bg-cyan-400/10 border border-cyan-400/30 rounded flex flex-col items-center justify-center gap-2 p-2">
                          <Icon className="text-cyan-400 text-lg" />
                          <span className="text-white/70 text-sm text-center">{feature.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Analytics */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaChartLine className="text-blue-400 text-sm" />
                    <span className="text-white/80 text-sm font-medium">Student Performance</span>
                  </div>
                  <div className="h-24 bg-blue-500/10 border border-blue-500/30 rounded flex items-center justify-center">
                    <span className="text-white/60 text-sm font-medium">Performance Chart</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Animation */}
            <div className="hidden lg:flex items-center justify-center absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="sync-animation w-16 h-16 bg-cyan-400/20 border-2 border-cyan-400/50 rounded-full flex items-center justify-center backdrop-blur-md">
                <FaSync className="text-cyan-400 text-2xl animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="absolute inset-0 data-flow">
                <div className="absolute left-0 top-1/2 w-32 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-500 transform -translate-y-1/2"></div>
              </div>
            </div>

            {/* Student Dashboard */}
            <div className="dashboard-panel bg-white/5 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500/60 transition-all duration-300 opacity-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-center justify-center">
                  <FaUserGraduate className="text-emerald-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Student Dashboard</h3>
                  <p className="text-white/60 text-sm">Study Tools & Progress Tracking</p>
                </div>
              </div>

              {/* Dashboard Preview */}
              <div className="space-y-4">
                {/* Study Progress */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/80 text-sm font-medium">Study Progress</span>
                    <span className="text-emerald-400 text-sm font-bold">75%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-3/4"></div>
                  </div>
                </div>

                {/* Study Tools */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaBook className="text-emerald-400 text-sm" />
                    <span className="text-white/80 text-sm font-medium">Study Tools</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {studentFeatures.map((feature, i) => {
                      const Icon = feature.icon
                      return (
                        <div key={i} className="h-16 bg-emerald-500/10 border border-emerald-500/30 rounded flex flex-col items-center justify-center gap-2 p-2">
                          <Icon className="text-emerald-400 text-lg" />
                          <span className="text-white/70 text-sm text-center">{feature.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* CGPA Tracker */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaCalculator className="text-emerald-400 text-sm" />
                    <span className="text-white/80 text-sm font-medium">CGPA Tracker</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Current</span>
                    <span className="text-2xl font-bold text-emerald-400">3.75</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Description */}
          <div className="text-center">
            <p className="text-white/60 max-w-2xl mx-auto">
              Questions assigned by teachers automatically appear in student dashboards. 
              Completed work syncs back for grading and analytics.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
