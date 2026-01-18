'use client'

import { useEffect, useState, useMemo } from 'react'

interface StudyGuideLoaderProps {
  duration?: number
  networkSpeed?: 'fast' | 'medium' | 'slow'
  onComplete?: () => void
  text?: string
  tooltipText?: string
}

export default function StudyGuideLoader({
  duration = 3,
  networkSpeed = 'medium',
  onComplete,
  text,
  tooltipText,
}: StudyGuideLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [startTime] = useState(() => Date.now())

  // Processing steps with icons
  const processingSteps = [
    { icon: '🔍', label: 'Search', text: 'Searching knowledge base' },
    { icon: '🧠', label: 'Analyze', text: 'Analyzing patterns' },
    { icon: '⚡', label: 'Synthesize', text: 'Formulating response' },
    { icon: '✨', label: 'Format', text: 'Finalizing...' },
  ]

  // Get current status text based on progress
  const getStatusText = () => {
    if (progress < 33) return processingSteps[0].text
    if (progress < 66) return processingSteps[1].text
    return processingSteps[2].text
  }

  // Neural network nodes positions
  const neuralNodes = useMemo(
    () =>
      [...Array(12)].map((_, i) => {
        const angle = (i * 360) / 12
        const radius = 80
        return {
          x: 50 + radius * Math.cos((angle * Math.PI) / 180),
          y: 50 + radius * Math.sin((angle * Math.PI) / 180),
          angle,
        }
      }),
    []
  )

  // Data flow paths
  const dataPaths = useMemo(
    () => [
      { start: 0, end: 3, delay: 0 },
      { start: 1, end: 4, delay: 0.2 },
      { start: 2, end: 5, delay: 0.4 },
      { start: 6, end: 9, delay: 0.6 },
      { start: 7, end: 10, delay: 0.8 },
      { start: 8, end: 11, delay: 1.0 },
    ],
    []
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const newProgress = Math.min(100, (elapsed / duration) * 100)
      setProgress(newProgress)

      // Update active step based on progress
      if (newProgress < 25) setActiveStep(0)
      else if (newProgress < 50) setActiveStep(1)
      else if (newProgress < 75) setActiveStep(2)
      else setActiveStep(3)

      if (newProgress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          onComplete?.()
        }, 500)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [duration, onComplete, startTime])

  // Liquid fill percentage
  const liquidFill = progress

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        background: '#0a0a0f',
        backgroundImage: `
          linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
      }}
    >
      {/* Animated grid overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
          animation: 'gridMove 20s linear infinite',
        }}
      />

      {/* Floating data particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float-particle"
          style={{
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 2 === 0 ? '#00ffff' : '#ff00ff',
            boxShadow: `0 0 ${4 + Math.random() * 4}px ${i % 2 === 0 ? '#00ffff' : '#ff00ff'}`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
        {/* Neural Network Brain Container */}
        <div className="relative mb-12" style={{ width: '300px', height: '300px' }}>
          {/* Outer glow rings */}
          <div
            className="absolute inset-0 rounded-full animate-pulse-glow"
            style={{
              background: 'radial-gradient(circle, rgba(0, 255, 255, 0.2) 0%, transparent 70%)',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}
          />
          <div
            className="absolute inset-0 rounded-full animate-pulse-glow"
            style={{
              background: 'radial-gradient(circle, rgba(255, 0, 255, 0.15) 0%, transparent 70%)',
              animation: 'pulseGlow 2s ease-in-out infinite 0.5s',
            }}
          />

          {/* Neural Network Connections */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ filter: 'drop-shadow(0 0 2px rgba(0, 255, 255, 0.5))' }}
          >
            {neuralNodes.map((node, i) =>
              neuralNodes.slice(i + 1).map((target, j) => {
                const distance = Math.sqrt(
                  Math.pow(node.x - target.x, 2) + Math.pow(node.y - target.y, 2)
                )
                if (distance < 60) {
                  return (
                    <line
                      key={`${i}-${j}`}
                      x1={`${node.x}%`}
                      y1={`${node.y}%`}
                      x2={`${target.x}%`}
                      y2={`${target.y}%`}
                      stroke="rgba(0, 255, 255, 0.2)"
                      strokeWidth="1"
                      className="animate-neural-pulse"
                      style={{
                        animationDelay: `${(i + j) * 0.1}s`,
                      }}
                    />
                  )
                }
                return null
              })
            )}
          </svg>

          {/* Data Flow Dots */}
          {dataPaths.map((path, pathIndex) => {
            const startNode = neuralNodes[path.start]
            const endNode = neuralNodes[path.end]
            const distance = Math.sqrt(
              Math.pow(endNode.x - startNode.x, 2) + Math.pow(endNode.y - startNode.y, 2)
            )
            const angle = Math.atan2(endNode.y - startNode.y, endNode.x - startNode.x) * (180 / Math.PI)
            
            return (
              <div
                key={pathIndex}
                className="absolute rounded-full animate-data-flow"
                style={{
                  left: `${startNode.x}%`,
                  top: `${startNode.y}%`,
                  width: '8px',
                  height: '8px',
                  background: 'radial-gradient(circle, #00ffff, #ff00ff)',
                  boxShadow: '0 0 10px #00ffff, 0 0 20px #ff00ff',
                  animation: `dataFlow 2s linear infinite ${path.delay}s`,
                  transform: 'translate(-50%, -50%)',
                  '--start-x': `${startNode.x}%`,
                  '--start-y': `${startNode.y}%`,
                  '--end-x': `${endNode.x}%`,
                  '--end-y': `${endNode.y}%`,
                  '--distance': `${distance}%`,
                  '--angle': `${angle}deg`,
                } as React.CSSProperties & {
                  '--start-x': string
                  '--start-y': string
                  '--end-x': string
                  '--end-y': string
                  '--distance': string
                  '--angle': string
                }}
              />
            )
          })}

          {/* Neural Network Nodes */}
          {neuralNodes.map((node, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-node-pulse"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: '12px',
                height: '12px',
                background: i % 2 === 0 ? 'radial-gradient(circle, #00ffff, transparent)' : 'radial-gradient(circle, #ff00ff, transparent)',
                boxShadow: `0 0 ${8 + (i % 3) * 4}px ${i % 2 === 0 ? '#00ffff' : '#ff00ff'}`,
                transform: 'translate(-50%, -50%)',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}

          {/* Central Brain Icon with Liquid Fill */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: 'translate(0, 0)' }}
          >
            <div className="relative" style={{ width: '120px', height: '120px' }}>
              {/* Brain SVG */}
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full"
                style={{ zIndex: 2 }}
              >
                <path
                  d="M50 20 C40 20, 30 25, 30 35 C30 40, 35 45, 40 50 C35 55, 30 60, 30 65 C30 75, 40 80, 50 80 C60 80, 70 75, 70 65 C70 60, 65 55, 60 50 C65 45, 70 40, 70 35 C70 25, 60 20, 50 20 Z"
                  fill="none"
                  stroke="rgba(0, 255, 255, 0.3)"
                  strokeWidth="2"
                />
                <path
                  d="M45 30 C40 30, 35 35, 35 40"
                  fill="none"
                  stroke="rgba(0, 255, 255, 0.3)"
                  strokeWidth="1.5"
                />
                <path
                  d="M55 30 C60 30, 65 35, 65 40"
                  fill="none"
                  stroke="rgba(0, 255, 255, 0.3)"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Liquid Fill Effect */}
              <div
                className="absolute bottom-0 left-0 right-0 rounded-b-full transition-all duration-300"
                style={{
                  height: `${liquidFill}%`,
                  background: `linear-gradient(to top, 
                    rgba(0, 255, 255, 0.8) 0%,
                    rgba(255, 0, 255, 0.6) 50%,
                    rgba(0, 255, 255, 0.4) 100%
                  )`,
                  boxShadow: `0 0 ${20 + liquidFill * 0.5}px rgba(0, 255, 255, 0.6)`,
                  clipPath: `polygon(0% ${100 - liquidFill}%, 100% ${100 - liquidFill}%, 100% 100%, 0% 100%)`,
                  zIndex: 1,
                }}
              />
            </div>
          </div>
        </div>

        {/* Processing Steps */}
        <div className="mb-8 flex gap-6 md:gap-8">
          {processingSteps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center transition-all duration-500"
              style={{
                opacity: index <= activeStep ? 1 : 0.3,
                transform: index === activeStep ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              <div
                className="text-3xl md:text-4xl mb-2 transition-all duration-500"
                style={{
                  filter: index === activeStep
                    ? 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.8)) drop-shadow(0 0 20px rgba(255, 0, 255, 0.6))'
                    : 'none',
                  animation: index === activeStep ? 'stepPulse 1s ease-in-out infinite' : 'none',
                }}
              >
                {step.icon}
              </div>
              <div
                className="text-xs md:text-sm font-semibold"
                style={{
                  color: index === activeStep ? '#00ffff' : '#666',
                  textShadow: index === activeStep ? '0 0 8px rgba(0, 255, 255, 0.8)' : 'none',
                }}
              >
                {step.label}
              </div>
            </div>
          ))}
        </div>

        {/* Status Text */}
        <div className="mb-6 text-center">
          <h2
            className="text-2xl md:text-3xl font-bold mb-2 transition-all duration-500"
            style={{
              background: 'linear-gradient(90deg, #00ffff, #ff00ff, #00ffff)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'textShimmer 3s linear infinite',
            }}
          >
            {text || getStatusText()}
          </h2>
          {tooltipText && (
            <p className="text-sm md:text-base text-gray-400 mt-2">{tooltipText}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md">
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{
              background: 'rgba(0, 255, 255, 0.1)',
              boxShadow: 'inset 0 0 10px rgba(0, 255, 255, 0.2)',
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #00ffff, #ff00ff, #00ffff)',
                backgroundSize: '200% 100%',
                boxShadow: '0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(255, 0, 255, 0.4)',
                animation: 'progressShimmer 2s linear infinite',
              }}
            />
          </div>
          <div className="text-center mt-3">
            <span
              className="text-sm font-semibold"
              style={{
                color: '#00ffff',
                textShadow: '0 0 8px rgba(0, 255, 255, 0.8)',
              }}
            >
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
