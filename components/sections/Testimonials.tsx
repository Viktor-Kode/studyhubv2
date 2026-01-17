'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaChevronLeft, FaChevronRight, FaChalkboardTeacher, FaUserGraduate, FaBuilding } from 'react-icons/fa'

const teacherTestimonials = [
  {
    quote: 'I save 10+ hours every week on question creation. The AI generates comprehensive question banks that I can customize instantly.',
    author: 'Dr. James Wilson',
    role: 'Computer Science Professor',
    avatar: 'JW',
    school: 'Stanford University',
  },
  {
    quote: 'The question quality is exceptional. My students are more engaged, and I can focus on teaching instead of question writing.',
    author: 'Prof. Maria Garcia',
    role: 'Mathematics Department',
    avatar: 'MG',
    school: 'MIT',
  },
]

const studentTestimonials = [
  {
    quote: 'The AI-generated practice questions helped me improve my test scores by 30%. The personalized difficulty adjustment is perfect.',
    author: 'Sarah Chen',
    role: 'Computer Science Student',
    avatar: 'SC',
    improvement: '+30%',
  },
  {
    quote: 'I love the study timer and CGPA tracker. It keeps me organized and motivated throughout the semester.',
    author: 'Marcus Johnson',
    role: 'Engineering Student',
    avatar: 'MJ',
    improvement: '3.8 GPA',
  },
  {
    quote: 'The 24/7 availability is a game-changer. I can practice with AI questions whenever I need, even during late-night study sessions.',
    author: 'Emily Rodriguez',
    role: 'Biology Major',
    avatar: 'ER',
    improvement: '+25%',
  },
]

const adminTestimonials = [
  {
    quote: 'Standardized question quality across all courses has improved our institution\'s academic standards significantly.',
    author: 'Dr. Robert Kim',
    role: 'Academic Director',
    avatar: 'RK',
    institution: 'State University',
  },
]

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null)
  const [teacherIndex, setTeacherIndex] = useState(0)
  const [studentIndex, setStudentIndex] = useState(0)
  const [adminIndex, setAdminIndex] = useState(0)

  useEffect(() => {
    if (!sectionRef.current) return
    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      gsap.from('.testimonial-section', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out',
      })
    }, sectionRef)

    // Auto-rotate testimonials
    const teacherInterval = setInterval(() => {
      setTeacherIndex((prev) => (prev + 1) % teacherTestimonials.length)
    }, 8000)

    const studentInterval = setInterval(() => {
      setStudentIndex((prev) => (prev + 1) % studentTestimonials.length)
    }, 8000)

    return () => {
      ctx.revert()
      clearInterval(teacherInterval)
      clearInterval(studentInterval)
    }
  }, [])

  const nextTestimonial = (type: 'teacher' | 'student' | 'admin') => {
    if (type === 'teacher') {
      setTeacherIndex((prev) => (prev + 1) % teacherTestimonials.length)
    } else if (type === 'student') {
      setStudentIndex((prev) => (prev + 1) % studentTestimonials.length)
    } else {
      setAdminIndex((prev) => (prev + 1) % adminTestimonials.length)
    }
  }

  const prevTestimonial = (type: 'teacher' | 'student' | 'admin') => {
    if (type === 'teacher') {
      setTeacherIndex((prev) => (prev - 1 + teacherTestimonials.length) % teacherTestimonials.length)
    } else if (type === 'student') {
      setStudentIndex((prev) => (prev - 1 + studentTestimonials.length) % studentTestimonials.length)
    } else {
      setAdminIndex((prev) => (prev - 1 + adminTestimonials.length) % adminTestimonials.length)
    }
  }

  return (
    <section ref={sectionRef} id="testimonials" className="py-20 md:py-32 bg-[#0a0a0a] relative z-10">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Trusted by Educators & Students
            </h2>
            <p className="text-xl text-white/60 max-w-3xl mx-auto">
              See what teachers, students, and administrators are saying about StudyHelp
            </p>
          </div>

          {/* Teacher Testimonials */}
          <div className="testimonial-section mb-12">
            <div className="flex items-center gap-3 mb-6">
              <FaChalkboardTeacher className="text-blue-400 text-2xl" />
              <h3 className="text-2xl font-bold text-white">Teacher Testimonials</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teacherTestimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-md border-l-4 border-blue-500 border border-white/10 rounded-xl p-6"
                >
                  <div className="absolute top-4 left-4 text-4xl font-bold text-blue-500/20 font-serif">"</div>
                  <blockquote className="text-white/90 leading-relaxed mb-4 relative z-10">
                    {testimonial.quote}
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 font-bold text-sm">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{testimonial.author}</div>
                      <div className="text-white/60 text-sm">{testimonial.role}</div>
                      <div className="text-blue-400 text-xs">{testimonial.school}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Testimonials */}
          <div className="testimonial-section mb-12">
            <div className="flex items-center gap-3 mb-6">
              <FaUserGraduate className="text-emerald-400 text-2xl" />
              <h3 className="text-2xl font-bold text-white">Student Testimonials</h3>
            </div>
            <div className="relative">
              <button
                onClick={() => prevTestimonial('student')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-emerald-400/50 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                aria-label="Previous testimonial"
              >
                <FaChevronLeft className="text-white group-hover:text-emerald-400 transition-colors duration-300" />
              </button>

              <button
                onClick={() => nextTestimonial('student')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-emerald-400/50 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                aria-label="Next testimonial"
              >
                <FaChevronRight className="text-white group-hover:text-emerald-400 transition-colors duration-300" />
              </button>

              <div className="bg-white/5 backdrop-blur-md border-l-4 border-emerald-500 border border-white/10 rounded-xl p-8">
                <div className="absolute top-4 left-4 text-6xl font-bold text-emerald-500/20 font-serif">"</div>
                <blockquote className="text-xl text-white/90 leading-relaxed mb-6 relative z-10">
                  {studentTestimonials[studentIndex].quote}
                </blockquote>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center">
                      <span className="text-emerald-400 font-bold">{studentTestimonials[studentIndex].avatar}</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{studentTestimonials[studentIndex].author}</div>
                      <div className="text-white/60 text-sm">{studentTestimonials[studentIndex].role}</div>
                    </div>
                  </div>
                  <div className="text-emerald-400 font-bold text-lg">{studentTestimonials[studentIndex].improvement}</div>
                </div>
                <div className="flex gap-2 mt-6 justify-center">
                  {studentTestimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setStudentIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === studentIndex
                          ? 'bg-emerald-400 w-8'
                          : 'bg-white/20 w-2 hover:bg-white/40'
                      }`}
                      aria-label={`View testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Admin Testimonials */}
          <div className="testimonial-section">
            <div className="flex items-center gap-3 mb-6">
              <FaBuilding className="text-purple-400 text-2xl" />
              <h3 className="text-2xl font-bold text-white">Administrator Testimonials</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              {adminTestimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-md border-l-4 border-purple-500 border border-white/10 rounded-xl p-6"
                >
                  <div className="absolute top-4 left-4 text-4xl font-bold text-purple-500/20 font-serif">"</div>
                  <blockquote className="text-white/90 leading-relaxed mb-4 relative z-10">
                    {testimonial.quote}
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/50 rounded-full flex items-center justify-center">
                      <span className="text-purple-400 font-bold text-sm">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{testimonial.author}</div>
                      <div className="text-white/60 text-sm">{testimonial.role}</div>
                      <div className="text-purple-400 text-xs">{testimonial.institution}</div>
                    </div>
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
