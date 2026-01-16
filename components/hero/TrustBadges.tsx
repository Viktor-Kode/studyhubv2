'use client'

import { useEffect, useState } from 'react'
import { FaStar, FaUsers, FaGraduationCap } from 'react-icons/fa'

export default function TrustBadges() {
  const [count, setCount] = useState(0)
  const targetCount = 1247

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = targetCount / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= targetCount) {
        setCount(targetCount)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-wrap justify-center gap-6 mt-12">
      {/* Students Helped */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
        <div className="flex items-center gap-3">
          <FaGraduationCap className="text-blue-400 text-2xl" />
          <div>
            <div className="text-2xl font-bold text-white">{count}+</div>
            <div className="text-sm text-white/80">Students Helped</div>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
        <div className="flex items-center gap-3">
          <FaStar className="text-yellow-400 text-2xl animate-pulse" />
          <div>
            <div className="text-2xl font-bold text-white">4.9</div>
            <div className="text-sm text-white/80">From 200+ Reviews</div>
          </div>
        </div>
      </div>

      {/* Active Tutors */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20">
        <div className="flex items-center gap-3">
          <FaUsers className="text-purple-400 text-2xl" />
          <div>
            <div className="text-2xl font-bold text-white">50+</div>
            <div className="text-sm text-white/80">Expert Tutors</div>
          </div>
        </div>
      </div>
    </div>
  )
}
