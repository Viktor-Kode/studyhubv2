'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function GeometricShapes() {
  const shapesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!shapesRef.current || typeof window === 'undefined') return

    const shapes = shapesRef.current.children
    const tl = gsap.timeline({ repeat: -1, yoyo: true })

    Array.from(shapes).forEach((shape, index) => {
      gsap.to(shape, {
        rotation: 360,
        duration: 20 + index * 5,
        ease: 'none',
        repeat: -1,
      })

      gsap.to(shape, {
        y: '+=30',
        duration: 3 + index * 0.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    })
  }, [])

  return (
    <div ref={shapesRef} className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {/* Circle */}
      <div
        className="absolute top-20 right-20 w-32 h-32 rounded-full border-2 border-blue-400/20"
        style={{ transform: 'rotate(45deg)' }}
      />
      {/* Line */}
      <div
        className="absolute bottom-40 left-20 w-1 h-40 bg-gradient-to-b from-purple-400/20 to-transparent"
        style={{ transform: 'rotate(45deg)' }}
      />
      {/* Square */}
      <div
        className="absolute top-1/2 right-1/4 w-24 h-24 border-2 border-pink-400/20"
        style={{ transform: 'rotate(45deg)' }}
      />
    </div>
  )
}
