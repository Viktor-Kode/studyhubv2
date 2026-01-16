'use client'

import { useEffect, useRef } from 'react'

export default function NeonGlow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = glowRef.current
    if (!element) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      element.style.setProperty('--mouse-x', `${x}px`)
      element.style.setProperty('--mouse-y', `${y}px`)
    }

    element.addEventListener('mousemove', handleMouseMove)
    return () => element.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      ref={glowRef}
      className={`relative ${className}`}
      style={{
        filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5)) drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))',
      }}
    >
      {children}
    </div>
  )
}
