'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function SocialProofBar() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!barRef.current) return
    
    gsap.from(barRef.current, {
      opacity: 0,
      y: 20,
      duration: 1,
      scrollTrigger: {
        trigger: barRef.current,
        start: 'top 90%',
      }
    })
  }, [])

  return (
    <div ref={barRef} className="bg-white/5 border-y border-white/10 py-6 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-4 md:flex-row md:space-y-0 md:space-x-8">
          <p className="text-white/60 text-lg font-medium text-center">
            <span className="text-purple-400 font-bold">183+</span> students already studying smarter 🇳🇬
          </p>
          <div className="flex items-center space-x-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-300">
            {/* Logos of Nigerian universities could go here if available */}
            <span className="text-white font-bold text-xl tracking-tighter">UNILAG</span>
            <span className="text-white font-bold text-xl tracking-tighter">OAU</span>
            <span className="text-white font-bold text-xl tracking-tighter">ABU</span>
            <span className="text-white font-bold text-xl tracking-tighter">UNIBEN</span>
          </div>
        </div>
      </div>
    </div>
  )
}
