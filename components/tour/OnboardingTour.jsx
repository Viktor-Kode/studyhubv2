'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

function computeFlip(primaryPosition) {
  if (primaryPosition === 'top') return 'bottom'
  if (primaryPosition === 'bottom') return 'top'
  if (primaryPosition === 'left') return 'right'
  if (primaryPosition === 'right') return 'left'
  return 'bottom'
}

function measureTooltipHeight(el, fallback = 190) {
  if (!el) return fallback
  const rect = el.getBoundingClientRect()
  return rect.height || fallback
}

export default function OnboardingTour({ steps, onComplete }) {
  const safeSteps = steps || []
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const [tooltipStyle, setTooltipStyle] = useState({})
  const [isMounted, setIsMounted] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const tooltipRef = useRef(null)

  const step = safeSteps[stepIndex]
  const spotlightPad = 6
  const tooltipWidth = 300
  const margin = 12

  const placement = useMemo(() => {
    const r = targetRect
    if (!r || !step) return null

    const rawPos = step.position || 'bottom'
    return { rect: r, rawPos }
  }, [targetRect, step])

  const calcTooltip = (rect, position, tooltipHeight) => {
    const leftBase = rect.left + rect.width / 2 - tooltipWidth / 2
    const topBase = rect.top + rect.height / 2 - tooltipHeight / 2

    if (position === 'top') {
      return {
        top: rect.top - tooltipHeight - margin,
        left: leftBase,
      }
    }
    if (position === 'bottom') {
      return {
        top: rect.bottom + margin,
        left: leftBase,
      }
    }
    if (position === 'left') {
      return {
        top: topBase,
        left: rect.left - tooltipWidth - margin,
      }
    }

    // right (default)
    return {
      top: topBase,
      left: rect.right + margin,
    }
  }

  const updateForStep = async (nextIndex) => {
    const nextStep = safeSteps[nextIndex]
    if (!nextStep) return

    const el = document.querySelector(nextStep.target)
    if (!el) {
      // If target doesn't exist on this page, skip it.
      setTargetRect(null)
      setStepIndex((prev) => Math.min(prev + 1, safeSteps.length - 1))
      return
    }

    setHasStarted(true)

    // Ensure element is visible before measuring.
    const r = el.getBoundingClientRect()
    const isVisible = r.top >= 0 && r.bottom <= window.innerHeight
    if (!isVisible) {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      } catch {
        // ignore
      }
      // Give the browser time to scroll before measuring.
      await new Promise((res) => window.setTimeout(res, 350))
    }

    const rectNow = el.getBoundingClientRect()
    setTargetRect(rectNow)
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    void updateForStep(stepIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, isMounted])

  useLayoutEffect(() => {
    if (!placement) return
    const rect = placement.rect

    const primary = placement.rawPos
    const flipped = computeFlip(primary)

    const height = measureTooltipHeight(tooltipRef.current)
    const primaryCandidate = calcTooltip(rect, primary, height)

    let finalPos = primary
    let candidate = primaryCandidate

    const primaryOffscreen =
      primaryCandidate.left < margin ||
      primaryCandidate.left + tooltipWidth > window.innerWidth - margin ||
      primaryCandidate.top < margin ||
      primaryCandidate.top + height > window.innerHeight - margin

    if (primaryOffscreen) {
      finalPos = flipped
      candidate = calcTooltip(rect, flipped, height)
    }

    // Clamp to viewport edges as a last resort
    candidate.left = clamp(candidate.left, margin, window.innerWidth - tooltipWidth - margin)
    candidate.top = clamp(candidate.top, margin, window.innerHeight - height - margin)

    setTooltipStyle({
      top: candidate.top,
      left: candidate.left,
      width: `${tooltipWidth}px`,
    })
  }, [placement, stepIndex])

  if (!safeSteps.length) return null
  if (!targetRect) {
    // Render overlay only after the first measurement.
    if (!hasStarted) {
      return null
    }
  }

  const goNext = () => {
    if (stepIndex >= safeSteps.length - 1) {
      try {
        localStorage.setItem('studyhelp_tour_completed', 'true')
      } catch {
        // ignore
      }
      onComplete?.()
      return
    }
    setStepIndex((i) => Math.min(i + 1, safeSteps.length - 1))
  }

  const goBack = () => {
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  const skip = () => {
    try {
      localStorage.setItem('studyhelp_tour_completed', 'true')
    } catch {
      // ignore
    }
    onComplete?.()
  }

  const spotlightStyle = targetRect
    ? {
        left: targetRect.left - spotlightPad,
        top: targetRect.top - spotlightPad,
        width: targetRect.width + spotlightPad * 2,
        height: targetRect.height + spotlightPad * 2,
        borderRadius: 12,
        boxShadow: `0 0 0 9999px rgba(0,0,0,0.45)`,
        transition: 'left 200ms ease, top 200ms ease, width 200ms ease, height 200ms ease',
      }
    : {}

  return (
    <div className="fixed inset-0 z-[1200]" aria-modal="true" role="dialog">
      {targetRect && <div className="absolute z-0" style={spotlightStyle} />}

      <style>
        {`
          @keyframes studyhelpTourFadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      {step && targetRect && (
        <div
          ref={tooltipRef}
          className="absolute z-[1201] rounded-xl bg-white shadow-xl p-4 text-gray-900 animate-[studyhelpTourFadeIn_220ms_ease-in-out] border border-gray-100"
          style={tooltipStyle}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-gray-500">
                Step {stepIndex + 1} of {safeSteps.length}
              </div>
              <h3 className="mt-1 font-black text-base">{step.title}</h3>
            </div>
            <div className="text-xs font-bold text-gray-400"> </div>
          </div>

          <p className="mt-2 text-sm text-gray-600">{step.description}</p>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              Back
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                onClick={skip}
              >
                Skip
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#5B4CF5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4F3FE5]"
                onClick={goNext}
              >
                {stepIndex === safeSteps.length - 1 ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

