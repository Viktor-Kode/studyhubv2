import { useEffect, useState, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaArrowRight, FaPlay, FaCheck, FaBook, FaBrain, FaChartBar, FaClock } from 'react-icons/fa'
import { FiZap, FiGrid } from 'react-icons/fi'
import Link from 'next/link'

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [userInteracted, setUserInteracted] = useState(false)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
  }, [])

  useEffect(() => {
    if (userInteracted) return
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev === 4 ? 0 : prev + 1))
    }, 4500)
    return () => clearInterval(interval)
  }, [userInteracted])

  const handleTabClick = (tabIndex: number) => {
    setActiveTab(tabIndex)
    setUserInteracted(true)
  }

  return (
    <div ref={heroRef} className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center pt-20 bg-[#0a0d1a]">
      {/* Custom Styles for active view transitions */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Background Glow - pointer-events-none to prevent blocking scroll */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 py-12">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs sm:text-sm font-semibold mb-6">
              <span className="mr-2">✨</span> The #1 Study Tool for Nigerians
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
              The Tool Behind Every <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">First Class</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Upload your notes, practice past questions and track your progress — all in one place. Built specifically for Nigerian students.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link 
                href="/auth/signup"
                className="w-full sm:w-auto px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(147,51,234,0.3)] flex items-center justify-center gap-2"
              >
                Start Free <FaArrowRight className="text-sm" />
              </Link>
              <Link 
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-slate-700 hover:border-purple-500/50 text-white rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                See How It Works <FaPlay className="text-sm text-purple-400" />
              </Link>
            </div>
          </div>

          {/* Right Content - Real Dashboard Mockup (Interactive & Animated) */}
          <div className="flex-1 relative w-full max-w-[600px] lg:max-w-[550px]">
            <div className="relative group">
              {/* Decorative Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25"></div>
              
              <div className="relative bg-[#0B1220] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Mockup Header */}
                <div className="bg-[#111827]/80 backdrop-blur px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <button 
                    onClick={() => handleTabClick(0)}
                    className="flex items-center gap-3 hover:opacity-80 transition-all select-none"
                    aria-label="Go to Dashboard Home"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                       <FaChartBar className="text-[10px] text-slate-400" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-300">Dashboard</div>
                  </button>
                  <div className="flex items-center gap-3">
                     <div className="flex flex-col items-end">
                        <div className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full text-[8px] font-bold">SCHOLAR</div>
                        <div className="text-[10px] text-white font-bold">Viktor</div>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 overflow-hidden">
                        <div className="w-full h-full bg-slate-700 animate-pulse" />
                     </div>
                  </div>
                </div>

                {/* Mockup Content */}
                <div className="p-4 bg-[#0B1220] flex flex-col gap-5">
                  {/* Action Cards / Tabs */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Core Study Actions</div>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleTabClick(1)}
                        className={`p-3 rounded-xl flex items-center gap-3 border transition-all duration-300 text-left ${
                          activeTab === 1 
                            ? 'bg-teal-500/20 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.15)] scale-[1.02]' 
                            : 'bg-teal-500/5 border-teal-500/10 hover:bg-teal-500/15'
                        }`}
                      >
                         <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white text-xs"><FiZap /></div>
                         <div>
                           <div className="text-[9px] font-bold text-teal-400">Past Questions</div>
                           <div className="text-[7px] text-slate-400">Practice CBT</div>
                         </div>
                      </button>
                      
                      <button 
                        onClick={() => handleTabClick(2)}
                        className={`p-3 rounded-xl flex items-center gap-3 border transition-all duration-300 text-left ${
                          activeTab === 2 
                            ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)] scale-[1.02]' 
                            : 'bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/15'
                        }`}
                      >
                         <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs"><FaBook /></div>
                         <div>
                           <div className="text-[9px] font-bold text-blue-400">Note Generator</div>
                           <div className="text-[7px] text-slate-400">AI Summaries</div>
                         </div>
                      </button>

                      <button 
                        onClick={() => handleTabClick(3)}
                        className={`p-3 rounded-xl flex items-center gap-3 border transition-all duration-300 text-left ${
                          activeTab === 3 
                            ? 'bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.15)] scale-[1.02]' 
                            : 'bg-purple-500/5 border-purple-500/10 hover:bg-purple-500/15'
                        }`}
                      >
                         <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs"><FaBrain /></div>
                         <div>
                           <div className="text-[9px] font-bold text-purple-400">AI Study Tutor</div>
                           <div className="text-[7px] text-slate-400">Interactive Chat</div>
                         </div>
                      </button>

                      <button 
                        onClick={() => handleTabClick(4)}
                        className={`p-3 rounded-xl flex items-center gap-3 border transition-all duration-300 text-left ${
                          activeTab === 4 
                            ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] scale-[1.02]' 
                            : 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/15'
                        }`}
                      >
                         <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white text-xs"><FiGrid /></div>
                         <div>
                           <div className="text-[9px] font-bold text-amber-400">Question Bank</div>
                           <div className="text-[7px] text-slate-400">Flashcards</div>
                         </div>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Simulation Screens */}
                  <div className="min-h-[160px] flex flex-col justify-center">
                    {activeTab === 0 && (
                      <div className="flex flex-col gap-4 animate-fadeIn">
                        {/* Streak & Progress */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                             <div className="text-amber-500 text-xl mb-1">🔥</div>
                             <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Streak</div>
                             <div className="text-sm font-black text-amber-500">12 Days</div>
                          </div>
                          
                          <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                             <div className="relative w-10 h-10 shrink-0">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                   <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
                                   <circle cx="50" cy="50" r="40" stroke="#9333ea" stroke-width="10" fill="none" stroke-dasharray="251.2" stroke-dashoffset="62.8" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">75%</div>
                             </div>
                             <div>
                                <div className="text-[8px] font-bold text-slate-500">NEXT RANK</div>
                                <div className="text-[10px] font-bold text-white">Master</div>
                             </div>
                          </div>
                        </div>

                        {/* Reminders */}
                        <div className="bg-[#111827] border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                           <div>
                              <div className="text-[10px] font-bold text-white">Maths Practice</div>
                              <div className="text-[8px] text-slate-500">2:00 PM • Today</div>
                           </div>
                           <div className="w-7 h-7 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 text-[10px]"><FaClock /></div>
                        </div>
                      </div>
                    )}

                    {activeTab === 1 && (
                      <div className="bg-[#111827] border border-teal-500/20 p-4 rounded-xl flex flex-col gap-3 animate-fadeIn text-[10px]">
                        <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-2">
                          <span className="font-bold text-teal-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                            JAMB Mock Exam • Physics
                          </span>
                          <span className="text-orange-400 font-mono flex items-center gap-1"><FaClock className="text-[8px]" /> 01:42:09</span>
                        </div>
                        <div className="text-white font-medium">Q4: A car accelerates from rest at 4 m/s² for 5 seconds. Calculate the total distance covered.</div>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                          <div className="bg-[#0B1220] border border-white/5 p-2 rounded text-slate-400 flex justify-between">
                            <span>A) 20 meters</span>
                          </div>
                          <div className="bg-teal-500/20 border border-teal-500/40 p-2 rounded text-teal-300 flex justify-between font-bold animate-pulse">
                            <span>B) 50 meters (Selected)</span>
                            <span>✓ Correct</span>
                          </div>
                          <div className="bg-[#0B1220] border border-white/5 p-2 rounded text-slate-400">
                            <span>C) 100 meters</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 2 && (
                      <div className="bg-[#111827] border border-blue-500/20 p-4 rounded-xl flex flex-col gap-3 animate-fadeIn text-[10px]">
                        <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-2">
                          <span className="font-bold text-blue-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                            AI Note Generator
                          </span>
                          <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-[8px]">PDF Parsing...</span>
                        </div>
                        <div className="bg-[#0B1220] border border-white/5 p-2.5 rounded-lg flex flex-col gap-1.5 font-sans leading-relaxed text-slate-300">
                          <div className="text-white font-bold border-b border-white/5 pb-1 flex justify-between items-center">
                            <span>Photosynthesis_Summary.txt</span>
                            <span className="text-emerald-400 text-[8px] animate-pulse">Generated</span>
                          </div>
                          <p className="text-[9px]"><span className="text-blue-400 font-bold">1. Light Phase:</span> Inside thylakoid membranes. Sunlight excites chlorophyll, splitting H₂O into oxygen and hydrogen.</p>
                          <p className="text-[9px]"><span className="text-blue-400 font-bold">2. Dark Phase:</span> In the stroma. Uses ATP/NADPH to turn CO₂ into glucose.</p>
                        </div>
                      </div>
                    )}

                    {activeTab === 3 && (
                      <div className="bg-[#111827] border border-purple-500/20 p-4 rounded-xl flex flex-col gap-3 animate-fadeIn text-[10px]">
                        <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-2">
                          <span className="font-bold text-purple-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                            AI Study Tutor
                          </span>
                          <span className="text-[8px] text-slate-500">English & Pidgin Mode</span>
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <div className="flex justify-end">
                            <div className="bg-purple-600 text-white rounded-lg px-2.5 py-1.5 max-w-[85%] text-right font-medium">
                              Explain Newton second law in simple Nigerian Pidgin.
                            </div>
                          </div>
                          <div className="flex justify-start">
                            <div className="bg-[#0B1220] border border-white/5 text-slate-300 rounded-lg px-2.5 py-1.5 max-w-[85%] leading-normal">
                              <span className="text-purple-400 font-bold block mb-0.5 text-[8px]">AI Tutor:</span>
                              Newton second law simple: Force wey you push body na mass times speed wey the body take accelerate (<span className="text-white font-bold">F = ma</span>). Bigger force = faster speed!
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 4 && (
                      <div className="bg-[#111827] border border-amber-500/20 p-4 rounded-xl flex flex-col gap-3 animate-fadeIn text-[10px]">
                        <div className="flex justify-between items-center text-slate-400 border-b border-white/5 pb-2">
                          <span className="font-bold text-amber-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            Interactive Flashcards
                          </span>
                          <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded text-[8px]">Chemistry</span>
                        </div>
                        <div className="flex justify-center py-1">
                          <div className="bg-[#0B1220] border-2 border-amber-500/30 w-full max-w-[250px] p-3.5 rounded-xl text-center shadow-lg transform rotate-1 transition-transform">
                            <div className="text-slate-500 text-[8px] uppercase tracking-wider mb-1">Question</div>
                            <div className="text-white font-bold text-xs mb-2">What is the atomic number of Sodium (Na)?</div>
                            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-sm py-1 rounded-lg animate-pulse">
                              11
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Floating Success Notification */}
              <div className="absolute -bottom-4 -left-4 bg-purple-600 p-3 rounded-xl shadow-xl hidden md:block animate-bounce-slow">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">🚀</div>
                  <div>
                    <div className="text-white font-bold text-[10px]">Rank Up!</div>
                    <div className="text-purple-200 text-[8px]">New Badges Unlocked</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
