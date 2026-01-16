'use client'

import { useEffect, useState } from 'react'

interface TerminalTextProps {
  text: string
  speed?: number
  className?: string
  onComplete?: () => void
}

export default function TerminalText({ text, speed = 50, className = '', onComplete }: TerminalTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)

    return () => clearInterval(interval)
  }, [])

  return (
    <span className={`font-mono ${className}`}>
      {displayedText}
      {showCursor && currentIndex < text.length && (
        <span className="text-cyan-400 animate-pulse">_</span>
      )}
    </span>
  )
}
