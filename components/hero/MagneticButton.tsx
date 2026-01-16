'use client'

import { useRef, useState, ReactNode } from 'react'
import Link from 'next/link'

interface MagneticButtonProps {
  href: string
  children: ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
}

export default function MagneticButton({
  href,
  children,
  variant = 'primary',
  className = '',
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2

    // Stronger magnetic effect
    setPosition({ x: x * 0.5, y: y * 0.5 })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  const baseClasses =
    variant === 'primary'
      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-2xl hover:shadow-blue-500/50'
      : 'bg-white/10 backdrop-blur-md text-white border-2 border-white/30 hover:bg-white/20 hover:border-white/50'

  return (
    <Link
      href={href}
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${baseClasses} ${className} relative inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      {children}
    </Link>
  )
}
