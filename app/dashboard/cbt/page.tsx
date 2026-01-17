'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { cbtApi, ExamType, CBTQuestion } from '@/lib/api/cbt'
import { FaCheckCircle, FaTimesCircle, FaArrowRight, FaArrowLeft, FaClock, FaGraduationCap, FaSpinner } from 'react-icons/fa'

interface Question extends CBTQuestion {}

const examTypes = [
  { value: 'WAEC', label: 'WAEC', description: 'West African Examinations Council', duration: 120 },
  { value: 'JAMB', label: 'JAMB', description: 'Joint Admissions and Matriculation Board', duration: 120 },
  { value: 'POST_UTME', label: 'POST UTME', description: 'Post Unified Tertiary Matriculation Examination', duration: 60 },
  { value: 'NECO', label: 'NECO', description: 'National Examinations Council', duration: 120 },
  { value: 'BECE', label: 'BECE', description: 'Basic Education Certificate Examination', duration: 90 },
]

// Sample questions as fallback (will be replaced by API)
const sampleQuestions: Record<ExamType, Question[]> = {
  WAEC: [],
  JAMB: [],
  POST_UTME: [],
  NECO: [],
  BECE: [],
}

export default function CBTPage() {
  const [selectedExam, setSelectedExam] = useState<ExamType | null>(null)
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [showResults, setShowResults] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load available years when exam is selected
  useEffect(() => {
    if (selectedExam) {
      loadAvailableYears()
    }
  }, [selectedExam])

  // Load available subjects when year is selected
  useEffect(() => {
    if (selectedExam && selectedYear) {
      loadAvailableSubjects()
    }
  }, [selectedExam, selectedYear])

  const loadAvailableYears = async () => {
    if (!selectedExam) return
    try {
      setLoading(true)
      const response = await cbtApi.getAvailableYears(selectedExam)
      setAvailableYears(response.years)
      if (response.years.length > 0 && !selectedYear) {
        setSelectedYear(response.years[0]) // Auto-select first year
      }
    } catch (error: any) {
      console.error('Error loading years:', error)
      setError('Failed to load available years')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSubjects = async () => {
    if (!selectedExam || !selectedYear) return
    try {
      setLoading(true)
      const response = await cbtApi.getAvailableSubjects(selectedExam, selectedYear)
      setAvailableSubjects(response.subjects)
      if (response.subjects.length > 0 && !selectedSubject) {
        setSelectedSubject(response.subjects[0]) // Auto-select first subject
      }
    } catch (error: any) {
      console.error('Error loading subjects:', error)
      setError('Failed to load available subjects')
    } finally {
      setLoading(false)
    }
  }

  const loadQuestions = async () => {
    if (!selectedExam || !selectedYear || !selectedSubject) return
    try {
      setLoading(true)
      setError(null)
      const response = await cbtApi.getQuestions(selectedExam, selectedYear, selectedSubject, 50)
      
      if (response.questions.length === 0) {
        setError('No questions generated. The backend API endpoint /cbt/generate-from-syllabus needs to be implemented. Please check the API documentation.')
        setQuestions([])
      } else {
        // Check if questions are placeholders
        const hasPlaceholders = response.questions.some(q => 
          q.question.includes('placeholder') || q.question.includes('AI will generate')
        )
        
        if (hasPlaceholders) {
          setError('Backend AI API not configured. Questions are placeholders. Please implement the /cbt/generate-from-syllabus endpoint with AI integration.')
        }
        
        setQuestions(response.questions)
      }

      // Reset test state
      setCurrentIndex(0)
      setSelectedAnswers({})
      setShowResults(false)
    } catch (error: any) {
      console.error('Error loading questions:', error)
      setError(error.message || 'Failed to load questions. Please try again.')
      // Fallback to sample questions
      setQuestions(sampleQuestions[selectedExam] || [])
    } finally {
      setLoading(false)
    }
  }

  const handleStartTest = () => {
    if (!selectedExam || !selectedYear || !selectedSubject) {
      setError('Please select exam type, year, and subject')
      return
    }
    loadQuestions()
  }

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = questions.length > 0 && currentIndex === questions.length - 1
  const isFirstQuestion = currentIndex === 0

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResults) return
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion.id]: optionIndex })
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleSubmit = () => {
    setShowResults(true)
    setIsTimerRunning(false)
  }

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0 && !showResults) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            setShowResults(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isTimerRunning, timeRemaining, showResults])

  const getScore = () => {
    let correct = 0
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++
      }
    })
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) }
  }

  const score = showResults ? getScore() : null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const resetTest = () => {
    setSelectedExam(null)
    setSelectedYear('')
    setSelectedSubject('')
    setQuestions([])
    setShowResults(false)
    setCurrentIndex(0)
    setSelectedAnswers({})
    setTimeRemaining(0)
    setIsTimerRunning(false)
    setError(null)
  }

  // Start timer when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && !showResults && !isTimerRunning) {
      const exam = examTypes.find((e) => e.value === selectedExam)
      if (exam) {
        setTimeRemaining(exam.duration * 60)
        setIsTimerRunning(true)
      }
    }
  }, [questions, selectedExam, showResults, isTimerRunning])

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            CBT Practice - Past Questions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Practice with WAEC, JAMB, POST UTME, NECO, and BECE past questions
          </p>
        </div>

        {!selectedExam && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaGraduationCap className="text-blue-500" />
                Select Exam Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {examTypes.map((exam) => (
                  <button
                    key={exam.value}
                    onClick={() => setSelectedExam(exam.value as ExamType)}
                    className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all text-left group"
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {exam.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {exam.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                      <FaClock className="text-xs" />
                      <span>{exam.duration} minutes</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Year and Subject Selection */}
        {selectedExam && !isTimerRunning && !showResults && questions.length === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {examTypes.find((e) => e.value === selectedExam)?.label} Past Questions
              </h2>
              
              {error && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Year
                  </label>
                  {loading && availableYears.length === 0 ? (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <FaSpinner className="animate-spin" />
                      <span>Loading years...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value)
                        setSelectedSubject('') // Reset subject when year changes
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    >
                      <option value="">Select a year</option>
                      {availableYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedYear && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Subject
                    </label>
                    {loading && availableSubjects.length === 0 ? (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <FaSpinner className="animate-spin" />
                        <span>Loading subjects...</span>
                      </div>
                    ) : (
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      >
                        <option value="">Select a subject</option>
                        {availableSubjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {selectedYear && selectedSubject && (
                  <button
                    onClick={handleStartTest}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Loading Questions...
                      </>
                    ) : (
                      <>
                        <FaGraduationCap />
                        Start Test
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={resetTest}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Back to Exam Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedExam && (isTimerRunning || showResults) && (
          <div className="space-y-6">
            {/* Exam Info and Timer */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {examTypes.find((e) => e.value === selectedExam)?.label} Past Questions
                  </h2>
                  {questions[currentIndex]?.subject && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Subject: {questions[currentIndex].subject}
                      {questions[currentIndex].year && ` • Year: ${questions[currentIndex].year}`}
                    </p>
                  )}
                </div>
                {!showResults && (
                  <button
                    onClick={resetTest}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    Exit Test
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaClock className="text-blue-500" />
                  <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Question {currentIndex + 1} of {questions.length}
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            {currentQuestion && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {currentQuestion.question}
                </h2>

              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === index
                  const isCorrect = index === currentQuestion.correctAnswer
                  const showAnswer = showResults

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showResults}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        showAnswer && isCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : showAnswer && isSelected && !isCorrect
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {isSelected && (
                            <div className="w-3 h-3 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white">{option}</span>
                        {showAnswer && isCorrect && (
                          <FaCheckCircle className="text-green-500 ml-auto" />
                        )}
                        {showAnswer && isSelected && !isCorrect && (
                          <FaTimesCircle className="text-red-500 ml-auto" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {showResults && currentQuestion.explanation && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Explanation:</strong> {currentQuestion.explanation}
                  </p>
                </div>
              )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={isFirstQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaArrowLeft />
                Previous
              </button>

              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  disabled={showResults}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  Submit Test
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Next
                  <FaArrowRight />
                </button>
              )}
            </div>

            {/* Results */}
            {showResults && score && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {examTypes.find((e) => e.value === selectedExam)?.label} Test Results
                </h2>
                <div className="text-6xl font-bold text-blue-500 mb-4">{score.percentage}%</div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  You scored {score.correct} out of {score.total} questions
                </p>
                {score.percentage >= 70 ? (
                  <p className="text-green-600 dark:text-green-400 font-medium mb-6">
                    Excellent! Keep up the good work!
                  </p>
                ) : score.percentage >= 50 ? (
                  <p className="text-yellow-600 dark:text-yellow-400 font-medium mb-6">
                    Good attempt! Practice more to improve.
                  </p>
                ) : (
                  <p className="text-red-600 dark:text-red-400 font-medium mb-6">
                    Keep practicing! You'll improve with more study.
                  </p>
                )}
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => selectedExam && startTest(selectedExam)}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    Retake Test
                  </button>
                  <button
                    onClick={resetTest}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Choose Another Exam
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
