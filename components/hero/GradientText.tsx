'use client'

import React from 'react'

interface GradientTextProps {
  children: React.ReactNode
  className?: string
}

export default function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span
      className={`text-gray-900 dark:text-white ${className}`}
    >
      {children}
    </span>
  )
}
