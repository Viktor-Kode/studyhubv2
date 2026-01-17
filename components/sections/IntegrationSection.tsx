'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaPlug, FaFileAlt, FaDownload, FaCode } from 'react-icons/fa'

const lmsPlatforms = [
  { name: 'Canvas' },
  { name: 'Moodle' },
  { name: 'Blackboard' },
  { name: 'Google Classroom' },
]

const fileFormats = [
  { name: 'PDF' },
  { name: 'DOCX' },
  { name: 'PPT' },
  { name: 'Images' },
]

const exportFormats = [
  { name: 'LMS Export', icon: FaPlug },
  { name: 'PDF Print', icon: FaFileAlt },
  { name: 'Direct Assign', icon: FaDownload },
]

export default function IntegrationSection() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.fromTo('.integration-card',
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
          stagger: 0.1,
          ease: 'power3.out',
        }
      )

      gsap.fromTo('.lms-logo',
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
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="integrations" className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Integration & Compatibility
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              Seamlessly integrate with your existing educational infrastructure
            </p>
          </div>

          {/* LMS Integrations */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">LMS Integrations</h3>
            <div className="flex justify-center gap-6 flex-wrap">
              {lmsPlatforms.map((platform, index) => (
                <div
                  key={index}
                  className="lms-logo bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300 text-center min-w-[160px] opacity-100"
                >
                  <div className="text-white font-semibold text-lg">{platform.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* File Format Support */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Supported File Formats</h3>
            <div className="flex justify-center gap-6 flex-wrap">
              {fileFormats.map((format, index) => (
                <div
                  key={index}
                  className="integration-card bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300 text-center min-w-[140px] opacity-100"
                >
                  <div className="text-white font-semibold text-lg">{format.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Export Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {exportFormats.map((format, index) => {
                const Icon = format.icon
                return (
                  <div
                    key={index}
                    className="integration-card bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300 text-center"
                  >
                    <div className="w-16 h-16 bg-cyan-400/20 border border-cyan-400/50 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="text-cyan-400 text-2xl" />
                    </div>
                    <div className="text-white font-semibold">{format.name}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* API Availability */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-cyan-400/20 border border-cyan-400/50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FaCode className="text-cyan-400 text-2xl" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Developer-Friendly API</h3>
            <p className="text-white/60 max-w-2xl mx-auto">
              Build custom integrations with our comprehensive API. Full documentation and SDK support available.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
