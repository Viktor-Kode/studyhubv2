'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaFileUpload, FaBrain, FaQuestionCircle, FaSlidersH, FaShare } from 'react-icons/fa'

const workflowSteps = [
  {
    step: 1,
    icon: FaFileUpload,
    title: 'Upload Document',
    description: 'PDF, DOCX, PPT, Images (OCR)',
    color: 'blue',
  },
  {
    step: 2,
    icon: FaBrain,
    title: 'AI Processing',
    description: 'Neural network analyzes content',
    color: 'cyan',
  },
  {
    step: 3,
    icon: FaQuestionCircle,
    title: 'Generate Questions',
    description: 'Multiple question types created',
    color: 'purple',
  },
  {
    step: 4,
    icon: FaSlidersH,
    title: 'Adjust Difficulty',
    description: 'Fine-tune complexity levels',
    color: 'emerald',
  },
  {
    step: 5,
    icon: FaShare,
    title: 'Export & Share',
    description: 'LMS, print, or direct assignment',
    color: 'blue',
  },
]

const supportedFormats = [
  { name: 'PDF' },
  { name: 'DOCX' },
  { name: 'PPT' },
  { name: 'Images' },
]

export default function AIWorkflow() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo('.workflow-step-card',
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
          stagger: 0.2,
          ease: 'power3.out',
        }
      )

      gsap.fromTo('.format-icon',
        { scale: 0, opacity: 0 },
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

      // Animate connecting lines
      gsap.fromTo('.workflow-connector',
        { scaleX: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
          scaleX: 1,
          duration: 0.8,
          stagger: 0.2,
          delay: 0.3,
          ease: 'power2.out',
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="ai-workflow" className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-6">
              <span className="text-sm text-cyan-400 font-mono uppercase tracking-wider">AI Technology</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Question Generation Workflow
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              From document upload to question export - see how our AI transforms educational content
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="relative mb-16">
            {/* Horizontal Timeline */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-white/10 workflow-timeline">
              <div className="workflow-connector absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-500 origin-left"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon
                const colorClasses = {
                  blue: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
                  cyan: 'border-cyan-400/30 text-cyan-400 bg-cyan-400/10',
                  purple: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
                  emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
                }
                return (
                  <div key={index} className="relative">
                    <div className={`workflow-step-card bg-white/5 backdrop-blur-md border ${colorClasses[step.color as keyof typeof colorClasses]} rounded-xl p-6 text-center hover:scale-105 transition-all duration-300 relative z-10 opacity-100`}>
                      <div className={`w-16 h-16 ${colorClasses[step.color as keyof typeof colorClasses]} rounded-full flex items-center justify-center mx-auto mb-4 border-2`}>
                        <Icon className="text-2xl" />
                      </div>
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
                        <span className="text-sm font-bold text-black">{step.step}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2 mt-2">{step.title}</h3>
                      <p className="text-white/60 text-sm">{step.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Supported Formats */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Supported Document Formats</h3>
            <div className="flex justify-center gap-6 flex-wrap">
              {supportedFormats.map((format, index) => (
                <div
                  key={index}
                  className="format-icon bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300 text-center min-w-[140px] opacity-100"
                >
                  <div className="text-white font-semibold text-lg">{format.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              'Document Support',
              'AI Models',
              'Quality Control',
              'Customization',
              'LMS Integration',
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-4 text-center hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300"
              >
                <div className="text-white font-semibold text-sm">{feature}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
