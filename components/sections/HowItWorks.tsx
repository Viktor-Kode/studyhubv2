'use client'

import { useState, useEffect } from 'react'
import { FaFileUpload, FaDumbbell, FaGraduationCap, FaCloudUploadAlt, FaSpinner, FaTrophy } from 'react-icons/fa'

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)
  const [userInteracted, setUserInteracted] = useState(false)

  const steps = [
    {
      icon: <FaFileUpload />,
      title: "Upload",
      subtitle: "Lectures & Material",
      description: "Drop your lecture notes, PDFs, or textbooks into the platform."
    },
    {
      icon: <FaDumbbell />,
      title: "Practice",
      subtitle: "AI Quiz & CBT",
      description: "Our AI generates practice questions tailored directly to your uploaded materials."
    },
    {
      icon: <FaGraduationCap />,
      title: "Pass",
      subtitle: "A+ Academic Excellence",
      description: "Track your progress, build confidence, and ace your exams."
    }
  ]

  useEffect(() => {
    if (userInteracted) return
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev === 2 ? 0 : prev + 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [userInteracted])

  const handleStepClick = (index: number) => {
    setActiveStep(index)
    setUserInteracted(true)
  }

  return (
    <section id="how-it-works" className="py-24 bg-[#05070a] relative overflow-hidden border-t border-slate-900/50">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">3-Step</span> Process
          </h2>
          <p className="text-slate-400 text-base max-w-lg mx-auto">From stressed student to top of the class in 3 steps.</p>
        </div>

        {/* Step Navigation / Headers */}
        <div className="relative max-w-4xl mx-auto mb-16">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-1 bg-slate-800 z-0">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
              style={{ width: `${activeStep * 50}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 relative z-10">
            {steps.map((step, index) => {
              const isActive = activeStep === index
              const isCompleted = index < activeStep
              return (
                <button
                  key={index}
                  onClick={() => handleStepClick(index)}
                  className="flex flex-col items-center group focus:outline-none"
                >
                  {/* Step Bubble */}
                  <div 
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl transition-all duration-500 border-4 ${
                      isActive 
                        ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_25px_rgba(147,51,234,0.4)] scale-110' 
                        : isCompleted
                          ? 'bg-slate-900 border-purple-500 text-purple-400'
                          : 'bg-slate-900 border-slate-800 text-slate-500 group-hover:border-slate-700'
                    }`}
                  >
                    {step.icon}
                  </div>
                  
                  {/* Step Number Tag */}
                  <span className={`mt-4 text-xs font-black uppercase tracking-widest ${
                    isActive ? 'text-purple-400' : 'text-slate-500'
                  }`}>
                    Step {index + 1}
                  </span>

                  <h3 className={`mt-1 font-bold text-sm sm:text-base hidden sm:block ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}>
                    {step.title}
                  </h3>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dynamic Step Display Panel */}
        <div className="max-w-3xl mx-auto bg-[#0b0f19] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-10 relative">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes slideIn {
              from { opacity: 0; transform: translateX(20px); }
              to { opacity: 1; transform: translateX(0); }
            }
            .animate-slideIn {
              animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}} />

          {/* Active Step Content */}
          <div key={activeStep} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-slideIn">
            
            {/* Left Side: Descriptions */}
            <div className="text-center md:text-left">
              <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                {steps[activeStep].subtitle}
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-white mt-4 mb-4">
                {steps[activeStep].title}
              </h4>
              <p className="text-slate-400 leading-relaxed text-sm sm:text-base mb-6">
                {steps[activeStep].description}
              </p>
              <div className="flex justify-center md:justify-start gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Fast</span>
                <span>•</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> AI-Powered</span>
                <span>•</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Simple</span>
              </div>
            </div>

            {/* Right Side: Visual Demo */}
            <div className="bg-[#070a12] border border-white/5 rounded-xl p-5 min-h-[220px] flex flex-col justify-center shadow-inner relative">
              
              {/* Step 1 Visual: Upload */}
              {activeStep === 0 && (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 animate-pulse text-2xl">
                    <FaCloudUploadAlt />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white mb-1">physics_lecture_3.pdf</div>
                    <div className="text-[10px] text-slate-500 mb-3">12.4 MB</div>
                    {/* Fake progress bar */}
                    <div className="w-48 bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5 mx-auto">
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full w-[80%] animate-pulse"></div>
                    </div>
                    <div className="text-[9px] text-purple-400 mt-2 font-mono">Uploading... 80%</div>
                  </div>
                </div>
              )}

              {/* Step 2 Visual: Practice */}
              {activeStep === 1 && (
                <div className="flex flex-col gap-4 text-[10px]">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <FaSpinner className="animate-spin text-purple-400 text-xs" />
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px]">AI generating questions...</span>
                  </div>
                  <div className="bg-slate-900 border border-white/5 p-3 rounded-lg flex flex-col gap-2">
                    <div className="text-white font-medium">Q: Which law states that the pressure of a given mass of gas is inversely proportional to its volume?</div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="bg-[#0B1220] border border-white/5 p-2 rounded text-slate-400">A) Charles' Law</div>
                      <div className="bg-[#0B1220] border border-white/5 p-2 rounded text-slate-400">B) Boyle's Law</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 Visual: Pass */}
              {activeStep === 2 && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-3xl animate-bounce">
                    <FaTrophy />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">Score: 320/400 (Excellent)</div>
                    <div className="text-[10px] text-slate-400 mt-1">Mock test completed successfully!</div>
                  </div>
                  <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[9px] font-bold border border-emerald-500/20 mt-2">
                    Rank Up: First Class Scholar 🎓
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

