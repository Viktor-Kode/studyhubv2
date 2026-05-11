'use client'

import { FaSadTear, FaClock, FaBookOpen } from 'react-icons/fa'

const problems = [
  {
    icon: <FaSadTear className="text-3xl text-purple-400" />,
    title: "Information Overload",
    description: "You have 100+ pages of notes but don't know what will actually appear in the exam."
  },
  {
    icon: <FaClock className="text-3xl text-purple-400" />,
    title: "Time is Running Out",
    description: "Exam is in 2 days and you're still struggling to memorize basic concepts."
  },
  {
    icon: <FaBookOpen className="text-3xl text-purple-400" />,
    title: "Boring Study Sessions",
    description: "Reading the same textbook over and over is making you fall asleep."
  }
]

export default function ProblemSection() {
  return (
    <section className="py-24 bg-[#0a0d1a]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Sound familiar?</h2>
        <p className="text-slate-400 mb-16 max-w-2xl mx-auto">
          We've all been there. Studying shouldn't be this hard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 transition-all duration-300 group"
            >
              <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                {problem.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{problem.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
