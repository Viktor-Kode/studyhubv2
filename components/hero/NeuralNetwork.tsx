'use client'

import { useEffect, useRef, useState } from 'react'

interface Node {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  connections: number[]
}

export default function NeuralNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>()

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

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Create nodes
    const nodeCount = 150
    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 200 - 100,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      vz: (Math.random() - 0.5) * 0.3,
      connections: [],
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw nodes
      nodesRef.current.forEach((node, i) => {
        // Mouse interaction - create ripple effect
        const dx = mouseRef.current.x - node.x
        const dy = mouseRef.current.y - node.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const maxDistance = 150

        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance
          node.vx -= (dx / distance) * force * 0.2
          node.vy -= (dy / distance) * force * 0.2
        }

        // Update position
        node.x += node.vx
        node.y += node.vy
        node.z += node.vz

        // Damping
        node.vx *= 0.98
        node.vy *= 0.98
        node.vz *= 0.98

        // Wrap around edges
        if (node.x < 0) node.x = canvas.width
        if (node.x > canvas.width) node.x = 0
        if (node.y < 0) node.y = canvas.height
        if (node.y > canvas.height) node.y = 0

        // Keep z in range
        if (node.z < -100) node.z = 100
        if (node.z > 100) node.z = -100

        // Calculate size based on z (3D effect)
        const scale = 1 + node.z / 200
        const size = 2 * scale

        // Draw node with glow
        ctx.beginPath()
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 255, 255, ${0.6 * scale})`
        ctx.shadowBlur = 10
        ctx.shadowColor = 'rgba(0, 255, 255, 0.8)'
        ctx.fill()
        ctx.shadowBlur = 0

        // Find and draw connections
        node.connections = []
        nodesRef.current.forEach((otherNode, j) => {
          if (i >= j) return

          const dx = node.x - otherNode.x
          const dy = node.y - otherNode.y
          const dz = node.z - otherNode.z
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (distance < 120) {
            node.connections.push(j)
            ctx.beginPath()
            ctx.moveTo(node.x, node.y)
            ctx.lineTo(otherNode.x, otherNode.y)
            const opacity = (1 - distance / 120) * 0.3
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', handleMouseMove)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  )
}
