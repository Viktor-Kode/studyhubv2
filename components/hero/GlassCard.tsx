'use client'

import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  onHover?: () => void
}

export default function GlassCard({ children, className = '', onHover }: GlassCardProps) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300 ${className}`}
      onMouseEnter={onHover}
    >
      {children}
    </div>
  )
}
