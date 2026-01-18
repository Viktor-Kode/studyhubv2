'use client'

import { useEffect, useState, useMemo } from 'react'

interface StudyGuideLoaderProps {
  duration?: number // Duration in seconds (2-4)
  networkSpeed?: 'fast' | 'medium' | 'slow'
  onComplete?: () => void
}

export default function StudyGuideLoader({
  duration = 3,
  networkSpeed = 'medium',
  onComplete,
}: StudyGuideLoaderProps) {
  const [currentText, setCurrentText] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [progress, setProgress] = useState(0)
  const [showCheckmark, setShowCheckmark] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const fullText = 'Crafting your study guide'
  const words = fullText.split(' ')
  const wordColors = [
    'from-blue-500 to-cyan-400',
    'from-purple-500 to-pink-400',
    'from-indigo-500 to-blue-400',
    'from-violet-500 to-purple-400',
  ]

  // Network speed affects typing speed
  const typingSpeed = networkSpeed === 'fast' ? 30 : networkSpeed === 'medium' ? 50 : 80

  // Fixed positions for geometric shapes (to avoid re-rendering)
  const shapePositions = useMemo(
    () =>
      [...Array(6)].map((_, i) => ({
        left: [15, 75, 30, 85, 45, 20][i] || 50,
        top: [20, 60, 80, 25, 70, 40][i] || 50,
        delay: i * 0.5,
        duration: 3 + (i % 3) * 0.5,
      })),
    []
  )

  useEffect(() => {
    // Typing animation
    let charIndex = 0
    const typingInterval = setInterval(() => {
      if (charIndex < fullText.length) {
        setCurrentText(fullText.slice(0, charIndex + 1))
        charIndex++
      } else {
        clearInterval(typingInterval)
      }
    }, typingSpeed)

    return () => clearInterval(typingInterval)
  }, [fullText, typingSpeed])

  useEffect(() => {
    // Progress and countdown
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval)
          setProgress(100)
          setShowCheckmark(true)
          setTimeout(() => {
            setIsComplete(true)
            onComplete?.()
          }, 500)
          return 0
        }
        const newTime = prev - 0.1
        setProgress(((duration - newTime) / duration) * 100)
        return newTime
      })
    }, 100)

    return () => clearInterval(interval)
  }, [duration, onComplete])

  // Render text with gradient colors per word
  const renderAnimatedText = () => {
    const words = fullText.split(' ')
    let charCount = 0
    return words.map((word, wordIndex) => {
      const wordStart = charCount
      const wordEnd = charCount + word.length
      const isVisible = currentText.length > wordStart
      const displayWord = isVisible
        ? currentText.slice(wordStart, Math.min(wordEnd, currentText.length))
        : ''
      charCount = wordEnd + 1 // +1 for space

      return (
        <span
          key={wordIndex}
          className={`inline-block transition-opacity duration-300 ${
            isVisible ? 'opacity-100 animate-text-float' : 'opacity-0'
          }`}
        >
          <span
            className={`bg-gradient-to-r ${wordColors[wordIndex % wordColors.length]} bg-clip-text text-transparent`}
          >
            {displayWord}
          </span>
          {wordIndex < words.length - 1 && currentText.length > wordStart && ' '}
        </span>
      )
    })
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f0f9ff] dark:bg-gray-900">
      {/* Background Gradient Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 animate-gradient-horizontal" />

      {/* Geometric Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {shapePositions.map((pos, i) => (
          <div
            key={i}
            className="absolute opacity-20 animate-shape-fade"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              animationDelay: `${pos.delay}s`,
              animationDuration: `${pos.duration}s`,
            }}
          >
            {i % 3 === 0 ? (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-300 to-purple-300" />
            ) : i % 3 === 1 ? (
              <div className="w-12 h-12 bg-gradient-to-br from-pink-300 to-orange-300 transform rotate-45" />
            ) : (
              <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-cyan-300" />
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
        {/* Header Text */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {renderAnimatedText()}
            {currentText.length < fullText.length && (
              <span className="inline-block w-0.5 h-8 md:h-12 bg-gradient-to-b from-blue-500 to-purple-500 ml-1 animate-blink" />
            )}
          </h1>
        </div>

        {/* Circular Progress Indicator */}
        <div className="mb-12 relative w-32 h-32 md:w-40 md:h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-100 ease-linear"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* 8 Dots around circumference */}
          {[...Array(8)].map((_, i) => {
            const angle = (i * 360) / 8 - 90 // Start from top
            const radius = 45
            const x = 50 + radius * Math.cos((angle * Math.PI) / 180)
            const y = 50 + radius * Math.sin((angle * Math.PI) / 180)
            const dotProgress = (progress / 100) * 8
            const isActive = i < dotProgress && !showCheckmark
            const centerX = 50
            const centerY = 50

            return (
              <div
                key={i}
                className={`absolute w-3 h-3 rounded-full transition-all ${
                  showCheckmark
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                    : isActive
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500 scale-125 shadow-lg shadow-blue-500/50'
                    : 'bg-gray-300 dark:bg-gray-600 scale-100'
                }`}
                style={{
                  left: showCheckmark ? `${centerX}%` : `calc(${x}% - 6px)`,
                  top: showCheckmark ? `${centerY}%` : `calc(${y}% - 6px)`,
                  transform: showCheckmark
                    ? `translate(-50%, -50%) scale(0)`
                    : isActive
                    ? 'translate(-50%, -50%) scale(1.25)'
                    : 'translate(-50%, -50%) scale(1)',
                  opacity: showCheckmark ? 0 : 1,
                  transition: showCheckmark
                    ? `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.05}s`
                    : 'all 0.3s',
                }}
              />
            )
          })}

          {/* Checkmark when complete */}
          {showCheckmark && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-16 h-16 md:w-20 md:h-20 text-green-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                  className="checkmark-path"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Tooltip */}
        <div className="mb-8 text-center">
          <div className="inline-block px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 animate-pulse-slow">
              Finding the best explanations...
            </p>
          </div>
        </div>

        {/* Time Remaining */}
        <div className="mb-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Estimated time: <span className="font-semibold">{timeRemaining.toFixed(1)}s</span>
          </p>
        </div>

        {/* Skeleton Content Preview */}
        <div className="w-full max-w-2xl mt-8 space-y-4">
          {/* Heading skeleton */}
          <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg animate-shimmer bg-[length:200%_100%]" />
          
          {/* Body text skeletons */}
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="space-y-2"
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <div
                className={`h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-shimmer bg-[length:200%_100%] ${
                  i === 3 ? 'w-3/4' : 'w-full'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Primary Action Button (when ready) */}
        {isComplete && (
          <button className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse-button">
            View Study Guide
          </button>
        )}
      </div>
    </div>
  )
}
