'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const testimonials = [
  {
    quote: 'StudyHelp transformed how I approach difficult subjects. The explanations are clear and the tutors are incredibly patient.',
    author: 'Sarah Chen',
    role: 'Computer Science Student',
    avatar: 'SC',
  },
  {
    quote: 'I used to struggle with calculus, but the step-by-step guidance here helped me finally understand the concepts.',
    author: 'Marcus Johnson',
    role: 'Engineering Student',
    avatar: 'MJ',
  },
  {
    quote: 'The 24/7 availability is a game-changer. I can get help whenever I need it, even during late-night study sessions.',
    author: 'Emily Rodriguez',
    role: 'Biology Major',
    avatar: 'ER',
  },
]

const metrics = [
  { value: '2,500+', label: 'Expert Tutors' },
  { value: '24/7', label: 'Availability' },
  { value: '92%', label: 'Satisfaction' },
  { value: '15min', label: 'Avg Response' },
]

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.from('.testimonial-card', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      })

      gsap.from('.metric-item', {
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
    }, sectionRef)

    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length)
    }, 8000)

    return () => {
      ctx.revert()
      clearInterval(interval)
    }
  }, [])

  const activeTestimonial = testimonials[activeIndex]

  return (
    <section ref={sectionRef} className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Trusted by Students
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              See what students are saying about StudyHelp
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Testimonial Card */}
            <div className="lg:col-span-2">
              <div className="testimonial-card bg-white/5 backdrop-blur-md border-l-4 border-cyan-400 border border-white/10 rounded-xl p-8 relative">
                {/* Quote Mark */}
                <div className="absolute top-4 left-4 text-6xl font-bold text-cyan-400/20 font-serif">
                  "
                </div>

                <blockquote className="text-xl text-white/90 leading-relaxed mb-6 relative z-10">
                  {activeTestimonial.quote}
                </blockquote>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-400/20 border border-cyan-400/50 rounded-full flex items-center justify-center">
                    <span className="text-cyan-400 font-bold">{activeTestimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">{activeTestimonial.author}</div>
                    <div className="text-white/60 text-sm">{activeTestimonial.role}</div>
                  </div>
                </div>

                {/* Navigation Dots */}
                <div className="flex gap-2 mt-6">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === activeIndex
                          ? 'bg-cyan-400 w-8'
                          : 'bg-white/20 w-2 hover:bg-white/40'
                      }`}
                      aria-label={`View testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="metric-item bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300"
                >
                  <div className="text-4xl font-bold text-cyan-400 mb-2 font-mono">
                    {metric.value}
                  </div>
                  <div className="text-white/60 uppercase tracking-wide text-sm">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
