'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaRobot, FaClipboardList, FaLayerGroup, FaClock, FaChartLine, FaStickyNote } from 'react-icons/fa'

const REAL_FEATURES = [
  { Icon: FaRobot, title: 'AI Question Generator', desc: 'Generate custom practice questions for any subject and topic instantly' },
  { Icon: FaClipboardList, title: 'Past Question', desc: 'Timed practice tests for JAMB, WAEC, NECO and Post-UTME' },
  { Icon: FaLayerGroup, title: 'Flashcard System', desc: 'Smart flashcards with spaced repetition to help you memorise faster' },
  { Icon: FaClock, title: 'Study Timer', desc: 'Pomodoro-style timer to keep your study sessions focused' },
  { Icon: FaChartLine, title: 'Progress Analytics', desc: 'Track your scores, streaks and improvement over time' },
  { Icon: FaStickyNote, title: 'Notes', desc: 'Save and organise your study notes in one place' },
]

export default function FeaturesGrid() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.from('.feature-card', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      })

      gsap.from('.feature-number', {
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

      gsap.from('.feature-icon', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
        rotation: -180,
        scale: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)',
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Everything you need to excel in your studies
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REAL_FEATURES.map((feature, index) => {
              const Icon = feature.Icon
              return (
                <div
                  key={index}
                  className="feature-card group bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-400/10 relative overflow-hidden"
                >
                  {/* Number Indicator */}
                  <div className="feature-number absolute top-4 right-4 text-6xl font-bold text-white/5 font-mono">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  {/* Icon */}
                  <div className="feature-icon w-14 h-14 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mb-6 group-hover:border-cyan-400/50 group-hover:bg-cyan-400/10 transition-all duration-300">
                    <Icon className="text-white group-hover:text-cyan-400 text-2xl transition-colors duration-300" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
