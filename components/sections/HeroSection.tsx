'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'react-gsap' // Wait, the previous one used gsap directly. I'll stick to gsap.
import { FaArrowRight, FaPlay } from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={heroRef} className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-[#0a0d1a]">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold mb-6 animate-fade-in">
              <span className="mr-2">✨</span> The #1 Study Tool for Nigerians
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
              The Tool Behind Every <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">First Class</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
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

            {/* Quick Stats */}
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 border-t border-slate-800 pt-8">
              <div>
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-sm text-slate-500">AI Accuracy</div>
              </div>
              <div className="w-px h-10 bg-slate-800" />
              <div>
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-slate-500">Study Support</div>
              </div>
              <div className="w-px h-10 bg-slate-800" />
              <div>
                <div className="text-2xl font-bold text-white">FREE</div>
                <div className="text-sm text-slate-500">To Get Started</div>
              </div>
            </div>
          </div>

          {/* Right Content - Mockup */}
          <div className="flex-1 relative w-full max-w-[600px] lg:max-w-none">
            <div className="relative group">
              {/* Decorative Elements */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              
              <div className="relative bg-[#161b33] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Mockup Header */}
                <div className="bg-[#1e2548] px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-[#0a0d1a] px-3 py-1 rounded text-[10px] text-slate-500 w-48 text-center">studyhelp.site/dashboard</div>
                  </div>
                </div>

                {/* Mockup Content */}
                <div className="p-6 aspect-[4/3] flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-32 bg-slate-700/50 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-purple-600/30 rounded-full" />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                      <div className="h-2 w-10 bg-slate-700 rounded mb-2" />
                      <div className="h-4 w-16 bg-white/10 rounded" />
                    </div>
                    <div className="h-24 bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                      <div className="h-2 w-10 bg-slate-700 rounded mb-2" />
                      <div className="h-4 w-16 bg-white/10 rounded" />
                    </div>
                    <div className="h-24 bg-purple-600/20 rounded-xl border border-purple-500/30 p-4">
                      <div className="h-2 w-10 bg-purple-400 rounded mb-2" />
                      <div className="h-4 w-16 bg-purple-300/50 rounded" />
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
                    <div className="flex gap-4 mb-4">
                      <div className="h-8 w-8 bg-slate-700 rounded" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-3 w-1/2 bg-slate-700 rounded" />
                        <div className="h-2 w-1/4 bg-slate-700/50 rounded" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-slate-700/30 rounded" />
                      <div className="h-2 w-full bg-slate-700/30 rounded" />
                      <div className="h-2 w-3/4 bg-slate-700/30 rounded" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Element */}
              <div className="absolute -bottom-6 -left-6 bg-purple-600 p-4 rounded-xl shadow-xl hidden md:block animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    🏆
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Top Performer</div>
                    <div className="text-purple-200 text-xs">Score: 98%</div>
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
