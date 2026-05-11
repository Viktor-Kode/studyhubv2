'use client'

import { FaFileUpload, FaDumbbell, FaGraduationCap } from 'react-icons/fa'

const steps = [
  {
    icon: <FaFileUpload />,
    title: "Upload",
    description: "Drop your lecture notes or textbooks into the platform."
  },
  {
    icon: <FaDumbbell />,
    title: "Practice",
    description: "Our AI generates practice questions tailored to your materials."
  },
  {
    icon: <FaGraduationCap />,
    title: "Pass",
    description: "Improve your accuracy and walk into the exam hall with confidence."
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#0a0d1a] relative overflow-hidden">
      {/* Connector Line (Desktop) */}
      <div className="hidden lg:block absolute top-[55%] left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Simple 3-Step Process</h2>
          <p className="text-slate-400">From stressed student to top of the class in 3 steps.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center text-3xl text-purple-400 mb-8 group-hover:border-purple-600 transition-all duration-300 relative">
                {step.icon}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center border-4 border-[#0a0d1a]">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{step.title}</h3>
              <p className="text-slate-400 leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
