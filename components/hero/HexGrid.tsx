'use client'

import { useEffect, useRef } from 'react'

export default function HexGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const hexSize = 40
    const hexWidth = hexSize * 2
    const hexHeight = Math.sqrt(3) * hexSize

    const drawHex = (x: number, y: number) => {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i
        const hx = x + hexSize * Math.cos(angle)
        const hy = y + hexSize * Math.sin(angle)
        if (i === 0) {
          ctx.moveTo(hx, hy)
        } else {
          ctx.lineTo(hx, hy)
        }
      }
      ctx.closePath()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const offsetX = (Date.now() * 0.01) % hexWidth
      const offsetY = (Date.now() * 0.005) % hexHeight

      for (let y = -hexHeight; y < canvas.height + hexHeight; y += hexHeight * 0.75) {
        for (let x = -hexWidth; x < canvas.width + hexWidth; x += hexWidth * 0.75) {
          const adjustedX = x + offsetX + (y % (hexHeight * 1.5) === 0 ? 0 : hexWidth * 0.375)
          drawHex(adjustedX, y + offsetY)
        }
      }

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
