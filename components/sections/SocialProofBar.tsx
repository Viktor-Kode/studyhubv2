'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function SocialProofBar() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!barRef.current) return
    gsap.registerPlugin(ScrollTrigger)
    
    gsap.from(barRef.current, {
      opacity: 0,
      y: 20,
      duration: 1,
      scrollTrigger: {
        trigger: barRef.current,
        start: 'top 95%',
      }
    })
  }, [])

  const schools = [
    "UNILAG", "UI", "OAU", "ABU", "UNIBEN", 
    "UNN", "UNILORIN", "FUTA", "LASU", "BUK", 
    "LAUTECH", "FUTO", "UNIPORT", "UNIJOS", "KWASU", 
    "TASUED", "FUNAAB", "DELSU", "OOU", "UNIZIK"
  ]

  return (
    <div ref={barRef} className="bg-white/5 border-y border-white/10 py-6 overflow-hidden relative w-full">
      {/* Custom Styles for Infinite Marquee */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />

      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-6 z-10 relative">
        <p className="text-white/80 text-sm font-semibold shrink-0 text-center md:text-left flex items-center justify-center md:justify-start gap-2">
          <span className="text-purple-400 font-extrabold text-base">183+</span> 
          students already studying smarter 🇳🇬
        </p>

        {/* Marquee Container */}
        <div className="w-full overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
          <div className="animate-marquee flex gap-12 whitespace-nowrap text-white font-bold text-sm tracking-widest opacity-40">
            {/* Render list twice for seamless looping */}
            {schools.concat(schools).map((school, i) => (
              <span 
                key={i} 
                className="hover:text-purple-400 hover:opacity-100 transition-all duration-300 cursor-default px-2 select-none"
              >
                {school}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

