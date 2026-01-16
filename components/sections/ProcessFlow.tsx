'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaQuestionCircle, FaUserCheck, FaGraduationCap, FaCheckCircle } from 'react-icons/fa'

const steps = [
  {
    number: 1,
    icon: FaQuestionCircle,
    title: 'Submit Question',
    description: 'Post your question with any relevant details, images, or context.',
  },
  {
    number: 2,
    icon: FaUserCheck,
    title: 'Get Matched',
    description: 'Our system matches you with the perfect tutor for your subject.',
  },
  {
    number: 3,
    icon: FaGraduationCap,
    title: 'Receive Help',
    description: 'Get detailed, step-by-step explanations tailored to your learning style.',
  },
  {
    number: 4,
    icon: FaCheckCircle,
    title: 'Master Concepts',
    description: 'Understand deeply and apply knowledge with confidence.',
  },
]

export default function ProcessFlow() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      // Animate circles filling
      gsap.from('.process-circle', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          toggleActions: 'play none none none',
        },
        scale: 0,
        duration: 0.6,
        stagger: 0.3,
        ease: 'back.out(1.7)',
      })

      // Animate panels sliding in
      gsap.from('.process-panel', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          toggleActions: 'play none none none',
        },
        x: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
      })

      // Animate connecting lines
      gsap.from('.process-line', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 60%',
          toggleActions: 'play none none none',
        },
        scaleY: 0,
        transformOrigin: 'top',
        duration: 0.8,
        stagger: 0.2,
        delay: 0.3,
        ease: 'power2.out',
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Simple process, powerful results
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/10 process-line-container">
              {steps.slice(0, -1).map((_, index) => (
                <div
                  key={index}
                  className="process-line absolute left-0 w-0.5 bg-cyan-400"
                  style={{
                    top: `${(index + 1) * 25}%`,
                    height: '25%',
                  }}
                />
              ))}
            </div>

            {/* Steps */}
            <div className="space-y-12">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={index} className="relative flex items-start gap-6">
                    {/* Circle Indicator */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="process-circle w-16 h-16 bg-white/5 border-2 border-white/20 rounded-full flex items-center justify-center group-hover:border-cyan-400 transition-colors duration-300">
                        <div className="w-12 h-12 bg-cyan-400 rounded-full flex items-center justify-center">
                          <Icon className="text-black text-xl" />
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-0.5 h-12 bg-white/10"></div>
                      )}
                    </div>

                    {/* Content Panel */}
                    <div className="process-panel flex-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-cyan-400 font-mono text-sm font-bold">
                          STEP {step.number}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-white/60 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
