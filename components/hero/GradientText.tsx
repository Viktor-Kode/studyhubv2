'use client'

import { useEffect, useRef } from 'react'

interface GradientTextProps {
  children: React.ReactNode
  className?: string
}

export default function GradientText({ children, className = '' }: GradientTextProps) {
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const text = textRef.current
    if (!text) return

    let angle = 0
    const animate = () => {
      angle = (angle + 0.5) % 360
      text.style.backgroundImage = `linear-gradient(${angle}deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)`
      requestAnimationFrame(animate)
    }
    animate()
  }, [])

  return (
    <span
      ref={textRef}
      className={`bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 ${className}`}
      style={{
        backgroundSize: '200% 200%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {children}
    </span>
  )
}
