'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaUserGraduate, FaChartLine, FaCalendar, FaBook, FaClock, FaCalculator } from 'react-icons/fa'

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
      gsap.fromTo(
        '.dashboard-panel',
        { y: 40, opacity: 0 },
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
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="dual-dashboard" className="py-20 md:py-32 bg-[#0a0a0a] relative z-10 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your learning dashboard
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Practice, track progress, and stay organized with AI-assisted study tools in one place.
            </p>
          </div>

          <div className="max-w-lg mx-auto mb-12">
            <div className="dashboard-panel bg-white/5 backdrop-blur-md border-2 border-emerald-500/30 rounded-2xl p-6 hover:border-emerald-500/60 transition-all duration-300 opacity-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-center justify-center">
                  <FaUserGraduate className="text-emerald-400 text-xl" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Student dashboard</h3>
                  <p className="text-white/60 text-sm">Study tools and progress tracking</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/80 text-sm font-medium">Study progress</span>
                    <span className="text-emerald-400 text-sm font-bold">75%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-3/4"></div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaBook className="text-emerald-400 text-sm" />
                    <span className="text-white/80 text-sm font-medium">Study tools</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {studentFeatures.map((feature, i) => {
                      const Icon = feature.icon
                      return (
                        <div
                          key={i}
                          className="h-16 bg-emerald-500/10 border border-emerald-500/30 rounded flex flex-col items-center justify-center gap-2 p-2"
                        >
                          <Icon className="text-emerald-400 text-lg" />
                          <span className="text-white/70 text-sm text-center">{feature.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FaChartLine className="text-emerald-400 text-sm" />
                    <span className="text-white/80 text-sm font-medium">CGPA tracker</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-sm">Current</span>
                    <span className="text-2xl font-bold text-emerald-400">3.75</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/60 max-w-2xl mx-auto">
              Generate questions from your notes, run timed practice, and see analytics—all from your dashboard.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
