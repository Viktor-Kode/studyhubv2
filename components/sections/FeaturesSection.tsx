'use client'

import { FaFileImport, FaQuestionCircle, FaChartLine, FaUsers } from 'react-icons/fa'

const features = [
  {
    icon: <FaFileImport />,
    title: "Note-to-Quiz",
    description: "Upload your PDFs or paste notes. Our AI generates exam-standard questions instantly."
  },
  {
    icon: <FaQuestionCircle />,
    title: "Past Questions",
    description: "Access thousands of JAMB, WAEC, and University past questions with detailed solutions."
  },
  {
    icon: <FaChartLine />,
    title: "Progress Tracking",
    description: "See your weak points and track your improvement with detailed analytics dashboards."
  },
  {
    icon: <FaUsers />,
    title: "Study Groups",
    description: "Join thousands of other students. Share notes, discuss problems, and grow together."
  }
]

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-[#0a0d1a] border-t border-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Study Smarter, Not Harder</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Everything you need to ace your exams in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-8 rounded-2xl bg-gradient-to-b from-slate-800/50 to-transparent border border-slate-800 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center text-2xl text-purple-400 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
