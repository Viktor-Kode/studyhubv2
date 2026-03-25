'use client'

import { useEffect, useState } from 'react'

export default function HelpButton({ onClick, tooltip = 'Take a tour' }) {
  const [isHovered, setIsHovered] = useState(false)
  const [showPulse, setShowPulse] = useState(false)

  useEffect(() => {
    try {
      const key = 'studyhelp_help_visit_count'
      const raw = localStorage.getItem(key)
      const count = raw ? Number(raw) : 0
      setShowPulse(count < 3)
      localStorage.setItem(key, String(count + 1))
    } catch {
      // ignore
    }
  }, [])

  return (
    <div className="fixed bottom-6 left-6 z-[1250]">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-white px-3 py-1 text-xs font-semibold text-gray-900 shadow-lg border border-gray-100">
            {tooltip}
          </div>
        )}

        <button
          type="button"
          onClick={onClick}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#5B4CF5] text-white shadow-xl hover:bg-[#4F3FE5] transition select-none"
          aria-label="Start onboarding tour"
        >
          {showPulse && (
            <span
              className="absolute inset-0 rounded-full border border-white/70 opacity-70 animate-ping"
              aria-hidden
            />
          )}
          <span className="relative z-10 text-2xl font-black leading-none">?</span>
        </button>
      </div>
    </div>
  )
}

