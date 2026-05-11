'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FaArrowRight, FaPlay, FaCheck, FaBook, FaBrain, FaChartBar, FaClock } from 'react-icons/fa'
import { FiZap, FiGrid } from 'react-icons/fi'
import Link from 'next/link'

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
  }, [])

  return (
    <div ref={heroRef} className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center pt-20 bg-[#0a0d1a]">
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

          {/* Right Content - Real Dashboard Mockup */}
          <div className="flex-1 relative w-full max-w-[600px] lg:max-w-[550px] pointer-events-none">
            <div className="relative group">
              {/* Decorative Elements */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25"></div>
              
              <div className="relative bg-[#0B1220] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Mockup Header */}
                <div className="bg-[#111827]/80 backdrop-blur px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                       <FaChartBar className="text-[10px] text-slate-400" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-300">Dashboard</div>
                  </div>
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
                  {/* Action Cards */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Core Study Actions</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-teal-500/10 border border-teal-500/20 p-3 rounded-xl flex items-center gap-3">
                         <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white text-xs"><FiZap /></div>
                         <div className="text-[9px] font-bold text-teal-400">Past Questions</div>
                      </div>
                      <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center gap-3">
                         <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs"><FaBook /></div>
                         <div className="text-[9px] font-bold text-blue-400">Note Generator</div>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl flex items-center gap-3">
                         <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xs"><FaBrain /></div>
                         <div className="text-[9px] font-bold text-purple-400">AI Study Tutor</div>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-3">
                         <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white text-xs"><FiGrid /></div>
                         <div className="text-[9px] font-bold text-amber-400">Question Bank</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                       <div className="text-amber-500 text-xl mb-1">🔥</div>
                       <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Streak</div>
                       <div className="text-sm font-black text-amber-500">12 Days</div>
                    </div>
                    <div className="bg-[#111827] border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                       <div className="relative w-10 h-10">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                             <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
                             <circle cx="50" cy="50" r="40" stroke="#9333ea" strokeWidth="10" fill="none" strokeDasharray="251.2" strokeDashoffset="62.8" />
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
