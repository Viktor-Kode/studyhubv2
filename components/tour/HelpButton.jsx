'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useHelpWidgets } from '@/hooks/useHelpWidgets'

export default function HelpButton({ onClick, tooltip = 'Take a tour' }) {
  const { tourButtonVisible, hideTourButton } = useHelpWidgets()
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

  if (!tourButtonVisible) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-6 z-[1250]">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-gray-100 bg-white px-3 py-1 text-xs font-semibold text-gray-900 shadow-lg">
            {tooltip}
          </div>
        )}

        <div className="relative inline-flex">
          <button
            type="button"
            onClick={onClick}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#5B4CF5] text-white shadow-xl transition select-none hover:bg-[#4F3FE5]"
            aria-label="Start onboarding tour"
          >
            {showPulse && (
              <span
                className="absolute inset-0 animate-ping rounded-full border border-white/70 opacity-70"
                aria-hidden
              />
            )}
            <span className="relative z-10 text-2xl font-black leading-none">?</span>
          </button>
          {isHovered && (
            <button
              type="button"
              className="absolute -right-1 -top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-slate-700 text-white shadow-md hover:bg-slate-900"
              onClick={(e) => {
                e.stopPropagation()
                void hideTourButton()
              }}
              aria-label="Hide tour button"
              title="Hide tour button"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
