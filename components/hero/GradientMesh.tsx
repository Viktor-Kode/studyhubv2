'use client'

import { useEffect, useRef } from 'react'

export default function GradientMesh() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window

      const xPercent = (clientX / innerWidth) * 100
      const yPercent = (clientY / innerHeight) * 100

      container.style.background = `radial-gradient(circle at ${xPercent}% ${yPercent}%, 
        rgba(59, 130, 246, 0.15) 0%, 
        rgba(139, 92, 246, 0.1) 30%, 
        rgba(236, 72, 153, 0.08) 60%, 
        transparent 100%)`
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 30%, transparent 70%)',
        transition: 'background 0.3s ease-out',
      }}
    />
  )
}
