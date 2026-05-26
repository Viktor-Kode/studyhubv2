'use client'

import { FaFileImport, FaQuestionCircle, FaChartLine, FaUsers } from 'react-icons/fa'

export default function FeaturesSection() {
  const features = [
    {
      icon: <FaFileImport />,
      title: "Note-to-Quiz",
      description: "Upload your PDFs or paste notes. Our AI generates exam-standard questions instantly.",
      preview: (
        <div className="mt-6 bg-[#060913] border border-white/5 rounded-xl p-3 text-[10px] font-mono text-slate-400">
          <div className="flex items-center justify-between text-[8px] text-purple-400 mb-2 border-b border-white/5 pb-1 font-bold">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
              AI Note Parser
            </span>
            <span className="text-slate-500">100% Done</span>
          </div>
          <div className="line-clamp-2 italic text-slate-500">"Photosynthesis is the process used by plants to convert light energy into chemical energy..."</div>
          <div className="mt-2 text-white bg-purple-500/10 border border-purple-500/20 p-2 rounded">
            <span className="text-purple-400 font-bold block text-[8px] mb-0.5">GENERATED QUESTION:</span>
            Where does the light-dependent reaction of photosynthesis occur?
          </div>
        </div>
      )
    },
    {
      icon: <FaQuestionCircle />,
      title: "Past Questions",
      description: "Access thousands of JAMB, WAEC, and University past questions with detailed solutions.",
      preview: (
        <div className="mt-6 bg-[#060913] border border-white/5 rounded-xl p-3 text-[10px] text-slate-400">
          <div className="flex justify-between items-center text-[8px] text-slate-500 mb-2">
            <span className="font-bold text-teal-400">JAMB • Biology</span>
            <span className="text-orange-400 font-bold font-mono">00:45</span>
          </div>
          <div className="text-white mb-2 font-medium">Which organelle is responsible for cellular respiration?</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900 border border-white/5 p-1.5 rounded text-[8px]">A) Lysosome</div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-1.5 rounded text-[8px] font-bold flex justify-between items-center">
              <span>B) Mitochondria</span>
              <span className="text-[7px]">✓</span>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <FaChartLine />,
      title: "Progress Tracking",
      description: "See your weak points and track your improvement with detailed analytics dashboards.",
      preview: (
        <div className="mt-6 bg-[#060913] border border-white/5 rounded-xl p-3 text-[10px] text-slate-400">
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-300">Mock Score Average</span>
            <span className="text-blue-400 font-bold">88%</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mb-3 border border-white/5">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full w-[88%] rounded-full"></div>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[7px] text-center">
            <div className="bg-blue-500/10 text-blue-400 py-1 rounded">Maths: 92%</div>
            <div className="bg-purple-500/10 text-purple-400 py-1 rounded">English: 85%</div>
            <div className="bg-teal-500/10 text-teal-400 py-1 rounded">Physics: 87%</div>
          </div>
        </div>
      )
    },
    {
      icon: <FaUsers />,
      title: "Study Groups",
      description: "Join thousands of other students. Share notes, discuss problems, and grow together.",
      preview: (
        <div className="mt-6 bg-[#060913] border border-white/5 rounded-xl p-3 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5 mb-2 border-b border-white/5 pb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">LUTH Study Room</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[7px] text-white font-bold">V</div>
              <div className="bg-slate-900 border border-white/5 rounded px-2 py-1 flex-1 leading-tight text-slate-300">
                Any tips on remembering the 12 cranial nerves?
              </div>
            </div>
            <div className="flex items-center gap-2 pl-4">
              <div className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center text-[7px] text-white font-bold">C</div>
              <div className="bg-pink-500/5 border border-pink-500/20 rounded px-2 py-1 flex-1 leading-tight text-pink-300">
                Use the mnemonic: "On Old Olympus Towering Tops..." 🧠
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <section className="py-24 bg-[#0a0d1a] border-t border-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Study Smarter, Not Harder</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base">
            Everything you need to ace your exams in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/50 to-transparent border border-slate-800 hover:border-purple-500/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center text-2xl text-purple-400 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
              
              {/* Feature Visual Preview */}
              {feature.preview}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

