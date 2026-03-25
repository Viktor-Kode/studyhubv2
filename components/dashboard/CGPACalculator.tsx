'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { usePersistedState } from '@/hooks/usePersistedState'

interface Course {
  name: string
  grade: string
  units: string
}

interface Result {
  semesterGPA: string
  cumulativeGPA: string | null
  totalUnits: number
  classification: { label: string; color: string }
  scale: number
}

interface CGPACalculatorProps {
  className?: string
}

export default function CGPACalculator({ className = '' }: CGPACalculatorProps) {
  const [scale, setScale] = usePersistedState('cgpa_scale', '5.0')
  const [currentCGPA, setCurrentCGPA] = usePersistedState('cgpa_current', '')
  const [currentCredits, setCurrentCredits] = usePersistedState('cgpa_credits', '')
  const [courses, setCourses] = usePersistedState<Course[]>('cgpa_courses', [
    { name: '', grade: '', units: '' },
  ])
  const [result, setResult] = useState<Result | null>(null)

  const updateCourse = (index: number, field: keyof Course, value: string) => {
    setCourses(
      courses.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    )
  }

  const addCourse = () => {
    setCourses([...courses, { name: '', grade: '', units: '' }])
  }

  const removeCourse = (index: number) => {
    if (courses.length > 1) {
      setCourses(courses.filter((_, i) => i !== index))
    }
  }

  const calculateCGPA = () => {
    const maxScale = parseFloat(scale)

    const validCourses = courses.filter((c) => c.grade !== '' && c.units !== '')

    if (validCourses.length === 0) {
      setResult(null)
      return
    }

    let totalPoints = 0
    let totalUnits = 0

    validCourses.forEach((c) => {
      const units = parseFloat(c.units)
      const gradePoint = parseFloat(c.grade)
      totalPoints += gradePoint * units
      totalUnits += units
    })

    const semesterGPA = totalUnits > 0 ? totalPoints / totalUnits : 0

    let cumulativeGPA: number | null = null
    if (currentCGPA && currentCredits) {
      const prevPoints = parseFloat(currentCGPA) * parseFloat(currentCredits)
      const newTotalPoints = prevPoints + totalPoints
      const newTotalUnits = parseFloat(currentCredits) + totalUnits
      cumulativeGPA = newTotalPoints / newTotalUnits
    }

    const getClass = (gpa: number) => {
      if (scale === '5.0') {
        if (gpa >= 4.5) return { label: 'First Class', color: '#0F172A' }
        if (gpa >= 3.5) return { label: 'Second Class Upper', color: '#0F172A' }
        if (gpa >= 2.4) return { label: 'Second Class Lower', color: '#0F172A' }
        if (gpa >= 1.5) return { label: 'Third Class', color: '#0F172A' }
        return { label: 'Fail', color: '#0F172A' }
      } else {
        if (gpa >= 3.7) return { label: 'First Class', color: '#0F172A' }
        if (gpa >= 3.0) return { label: 'Second Class Upper', color: '#0F172A' }
        if (gpa >= 2.0) return { label: 'Second Class Lower', color: '#0F172A' }
        if (gpa >= 1.0) return { label: 'Third Class', color: '#0F172A' }
        return { label: 'Fail', color: '#0F172A' }
      }
    }

    const displayGPA = cumulativeGPA ?? semesterGPA

    setResult({
      semesterGPA: semesterGPA.toFixed(2),
      cumulativeGPA: cumulativeGPA?.toFixed(2) ?? null,
      totalUnits,
      classification: getClass(displayGPA),
      scale: maxScale,
    })
  }

  return (
    <div className={`cgpa-page ${className}`}>
      {/* Scale selector */}
      <div className="cgpa-scale-selector">
        <label>CGPA Scale</label>
        <div className="scale-options">
          {['4.0', '5.0'].map((s) => (
            <button
              key={s}
              type="button"
              className={`scale-btn ${scale === s ? 'active' : ''}`}
              onClick={() => setScale(s)}
            >
              {s} Scale
            </button>
          ))}
        </div>
      </div>

      {/* Current CGPA section */}
      <div className="cgpa-current-section">
        <h4>
          Your Current CGPA <span className="optional-tag">(optional)</span>
        </h4>
        <p className="section-hint">
          Fill this in if you want to calculate your cumulative CGPA after
          adding new courses
        </p>
        <div className="current-cgpa-row">
          <div className="form-group">
            <label>Current CGPA</label>
            <input
              className="cgpa-input"
              type="number"
              placeholder={scale === '5.0' ? 'e.g. 3.85' : 'e.g. 3.20'}
              value={currentCGPA}
              onChange={(e) => setCurrentCGPA(e.target.value)}
              min={0}
              max={scale === '5.0' ? 5 : 4}
              step={0.01}
            />
          </div>
          <div className="form-group">
            <label>Total Credit Units Done</label>
            <input
              className="cgpa-input"
              type="number"
              placeholder="e.g. 60"
              value={currentCredits}
              onChange={(e) => setCurrentCredits(e.target.value)}
              min={0}
            />
          </div>
        </div>
        {currentCGPA && (
          <div className="current-cgpa-display">
            <span>Current CGPA:</span>
            <strong>
              {parseFloat(currentCGPA).toFixed(2)} / {scale}
            </strong>
            <button
              type="button"
              className="clear-cgpa-btn"
              onClick={() => {
                setCurrentCGPA('')
                setCurrentCredits('')
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Course rows */}
      <div className="courses-section">
        <h4>Courses This Semester</h4>

        {courses.map((course, index) => (
          <div key={index} className="course-row">
            <div className="course-name-group">
              <label>Course Name / Code</label>
              <input
                className="cgpa-input course-name-input"
                type="text"
                placeholder="e.g. MTH 201 — Calculus"
                value={course.name}
                onChange={(e) => updateCourse(index, 'name', e.target.value)}
              />
            </div>

            <div className="course-meta-row">
              <div className="form-group">
                <label>Grade</label>
                <select
                  className="cgpa-input"
                  value={course.grade}
                  onChange={(e) => updateCourse(index, 'grade', e.target.value)}
                >
                  <option value="">Grade</option>
                  {scale === '5.0' ? (
                    <>
                      <option value="5">A — 5.0</option>
                      <option value="4">B — 4.0</option>
                      <option value="3">C — 3.0</option>
                      <option value="2">D — 2.0</option>
                      <option value="1">E — 1.0</option>
                      <option value="0">F — 0.0</option>
                    </>
                  ) : (
                    <>
                      <option value="4">A — 4.0</option>
                      <option value="3.7">A- — 3.7</option>
                      <option value="3.3">B+ — 3.3</option>
                      <option value="3">B — 3.0</option>
                      <option value="2.7">B- — 2.7</option>
                      <option value="2.3">C+ — 2.3</option>
                      <option value="2">C — 2.0</option>
                      <option value="1">D — 1.0</option>
                      <option value="0">F — 0.0</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Credit Units</label>
                <input
                  className="cgpa-input"
                  type="number"
                  placeholder="e.g. 3"
                  value={course.units}
                  onChange={(e) => updateCourse(index, 'units', e.target.value)}
                  min={1}
                  max={6}
                />
              </div>

              <button
                type="button"
                className="remove-course-btn"
                onClick={() => removeCourse(index)}
                disabled={courses.length === 1}
                aria-label="Remove course"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        <button type="button" className="add-course-btn" onClick={addCourse}>
          <Plus size={15} /> Add Course
        </button>
      </div>

      {/* Calculate button */}
      <button
        type="button"
        className="calculate-cgpa-btn"
        onClick={calculateCGPA}
      >
        Calculate CGPA
      </button>

      {/* Result */}
      {result && (
        <div
          className="cgpa-result"
          style={{ borderColor: result.classification.color }}
        >
          <div className="result-row">
            <span>Semester GPA:</span>
            <strong>{result.semesterGPA} / {result.scale}</strong>
          </div>
          {result.cumulativeGPA && (
            <div className="result-row">
              <span>Cumulative GPA:</span>
              <strong>{result.cumulativeGPA} / {result.scale}</strong>
            </div>
          )}
          <div className="result-row">
            <span>Classification:</span>
            <strong style={{ color: result.classification.color }}>
              {result.classification.label}
            </strong>
          </div>
          <div className="result-row">
            <span>Total Units (this sem):</span>
            <strong>{result.totalUnits}</strong>
          </div>
        </div>
      )}
    </div>
  )
}
