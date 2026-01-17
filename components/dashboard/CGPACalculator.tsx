'use client'

import { useState } from 'react'
import { FaCalculator, FaPlus, FaTrash } from 'react-icons/fa'

interface Course {
  id: string
  name: string
  creditHours: number
  grade: string
  gradePoint: number
}

interface CGPACalculatorProps {
  className?: string
}

const gradePoints: Record<string, number> = {
  'A': 4.0,
  'B': 3.0,
  'C': 2.0,
  'D': 1.0,
  'F': 0.0,
}

export default function CGPACalculator({ className = '' }: CGPACalculatorProps) {
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', name: '', creditHours: 3, grade: 'A', gradePoint: 4.0 },
  ])
  const [targetCGPA, setTargetCGPA] = useState(4.0)

  const addCourse = () => {
    setCourses([
      ...courses,
      { id: Date.now().toString(), name: '', creditHours: 3, grade: 'A', gradePoint: 4.0 },
    ])
  }

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter((c) => c.id !== id))
    }
  }

  const updateCourse = (id: string, field: keyof Course, value: any) => {
    setCourses(
      courses.map((course) => {
        if (course.id === id) {
          const updated = { ...course, [field]: value }
          if (field === 'grade') {
            updated.gradePoint = gradePoints[value] || 0
          }
          return updated
        }
        return course
      })
    )
  }

  const calculateCGPA = () => {
    const totalPoints = courses.reduce((sum, course) => sum + course.gradePoint * course.creditHours, 0)
    const totalCredits = courses.reduce((sum, course) => sum + course.creditHours, 0)
    return totalCredits > 0 ? totalPoints / totalCredits : 0
  }

  const currentCGPA = calculateCGPA()
  const remaining = targetCGPA - currentCGPA

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <FaCalculator className="text-blue-500 text-xl" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">CGPA Calculator</h3>
      </div>

      <div className="space-y-4">
        {/* Current CGPA Display */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Current CGPA</span>
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {currentCGPA.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Target CGPA</span>
            <input
              type="number"
              min="0"
              max="4"
              step="0.1"
              value={targetCGPA}
              onChange={(e) => setTargetCGPA(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            />
          </div>
          {remaining > 0 && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Need <span className="font-bold text-blue-600 dark:text-blue-400">{remaining.toFixed(2)}</span> more to reach target
            </div>
          )}
        </div>

        {/* Courses List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {courses.map((course, index) => (
            <div
              key={course.id}
              className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <input
                type="text"
                placeholder="Course name"
                value={course.name}
                onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
              <input
                type="number"
                min="1"
                max="6"
                value={course.creditHours}
                onChange={(e) => updateCourse(course.id, 'creditHours', parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                placeholder="Credits"
              />
              <select
                value={course.grade}
                onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              >
                {Object.keys(gradePoints).map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              {courses.length > 1 && (
                <button
                  onClick={() => removeCourse(course.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <FaTrash className="text-sm" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addCourse}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-500 transition-colors"
        >
          <FaPlus />
          Add Course
        </button>
      </div>
    </div>
  )
}
