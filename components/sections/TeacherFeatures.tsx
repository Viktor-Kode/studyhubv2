'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaFilePdf, FaBrain, FaSlidersH, FaFileExport, FaChartLine, FaCheckCircle } from 'react-icons/fa'

const questionTypes = [
  { name: 'Fill-in-Gap', color: 'blue' },
  { name: 'Objectives', color: 'cyan' },
  { name: 'Theory Questions', color: 'purple' },
  { name: 'Pascal/Code', color: 'emerald' },
]

const features = [
  {
    icon: FaFilePdf,
    title: 'AI Question Engine',
    description: 'Upload any lesson material (PDF, DOC, PPT)',
    color: 'blue',
  },
  {
    icon: FaSlidersH,
    title: 'Smart Difficulty Scaling',
    description: 'Automatically adjust question complexity',
    color: 'cyan',
  },
  {
    icon: FaCheckCircle,
    title: 'Multiple Question Types',
    description: 'Fill-in-gap, theory, objectives, programming questions',
    color: 'purple',
  },
  {
    icon: FaFileExport,
    title: 'Export Options',
    description: 'Export to LMS, print, or assign directly',
    color: 'emerald',
  },
  {
    icon: FaChartLine,
    title: 'Analytics Dashboard',
    description: 'Track student performance on generated questions',
    color: 'blue',
  },
]

const workflowSteps = [
  { step: 1, title: 'Upload', description: 'Upload your lesson materials' },
  { step: 2, title: 'AI Process', description: 'AI analyzes and processes content' },
  { step: 3, title: 'Generate', description: 'Questions generated automatically' },
  { step: 4, title: 'Export', description: 'Export or assign to students' },
]

export default function TeacherFeatures() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo('.teacher-feature-card',
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

      gsap.fromTo('.question-type-card',
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

      gsap.fromTo('.workflow-step',
        { x: -50, opacity: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
          x: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
        }
      )

      // Animate difficulty slider
      gsap.fromTo('.difficulty-slider',
        { scale: 0.8, opacity: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          },
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: 'power3.out',
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="teacher-features" className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
              <span className="text-sm text-blue-400 font-mono uppercase tracking-wider">For Teachers</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI-Powered Question Generation
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Create comprehensive question banks in minutes, not hours. Focus on teaching while AI handles question creation.
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
                  className={`teacher-feature-card bg-white/5 backdrop-blur-md border ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-xl p-6 hover:scale-105 transition-all duration-300 opacity-100`}
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

          {/* Question Types Grid */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Question Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {questionTypes.map((type, index) => (
                <div
                  key={index}
                  className="question-type-card bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300 text-center group opacity-100"
                >
                  <div className="text-white font-semibold text-lg">{type.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Animation */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {workflowSteps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="workflow-step bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 opacity-100">
                    <div className="w-16 h-16 bg-blue-500/20 border-2 border-blue-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-400">{step.step}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{step.title}</h4>
                    <p className="text-white/60 text-sm">{step.description}</p>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <div className="w-6 h-0.5 bg-blue-500/50"></div>
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-8 border-l-blue-500/50 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Slider Visualization */}
          <div className="difficulty-slider bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 opacity-100">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Smart Difficulty Scaling</h3>
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60">Easy</span>
                <span className="text-white/60">Medium</span>
                <span className="text-white/60">Hard</span>
              </div>
              <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-emerald-500/50"></div>
                  <div className="flex-1 bg-yellow-500/50"></div>
                  <div className="flex-1 bg-red-500/50"></div>
                </div>
                <div className="absolute top-0 left-1/3 w-1 h-full bg-white/80"></div>
                <div className="absolute top-0 left-2/3 w-1 h-full bg-white/80"></div>
              </div>
              <p className="text-center text-white/60 mt-4 text-sm">
                AI automatically adjusts question complexity based on your requirements
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
