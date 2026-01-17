'use client'

import { useState, useRef } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { questionsApi } from '@/lib/api/questions'
import { 
  FaFilePdf, 
  FaUpload, 
  FaTimes, 
  FaSpinner,
  FaCheckCircle,
  FaSlidersH,
  FaBrain,
  FaArrowLeft
} from 'react-icons/fa'
import Link from 'next/link'

interface GenerationOptions {
  difficulty: 'easy' | 'medium' | 'hard'
  questionType: 'multiple-choice' | 'fill-in-gap' | 'theory' | 'all'
  numberOfQuestions: number
  subject?: string
  assessmentType: 'assignment' | 'mid-term' | 'examination' | 'classwork'
  marksPerQuestion: number
}

export default function QuestionGeneratorPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [options, setOptions] = useState<GenerationOptions>({
    difficulty: 'medium',
    questionType: 'all',
    numberOfQuestions: 10,
    subject: '',
    assessmentType: 'assignment',
    marksPerQuestion: 1,
  })

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }
    setUploadedFile(file)
    setError(null)
    setSuccess(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setGeneratedQuestions([])
    setError(null)
    setSuccess(false)
  }

  const generateQuestions = async () => {
    if (!uploadedFile) {
      setError('Please upload a PDF file first')
      return
    }

    setGenerating(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await questionsApi.generateFromPDF(uploadedFile, {
        difficulty: options.difficulty,
        questionType: options.questionType === 'all' ? undefined : options.questionType,
        numberOfQuestions: options.numberOfQuestions,
        subject: options.subject || undefined,
        assessmentType: options.assessmentType,
        marksPerQuestion: options.marksPerQuestion,
      })

      if (response.questions && response.questions.length > 0) {
        // Add marks and assessment type to each question
        const questionsWithMarks = response.questions.map((q: any) => ({
          ...q,
          marks: options.marksPerQuestion,
          assessmentType: options.assessmentType,
          totalMarks: options.marksPerQuestion,
        }))
        setGeneratedQuestions(questionsWithMarks)
        setSuccess(true)
        
        // Save to localStorage for question bank
        const savedQuestions = localStorage.getItem('teacherGeneratedQuestions')
        const existingQuestions = savedQuestions ? JSON.parse(savedQuestions) : []
        const newQuestions = questionsWithMarks.map((q: any) => ({
          ...q,
          id: `q-${Date.now()}-${Math.random()}`,
          createdAt: new Date().toISOString(),
        }))
        localStorage.setItem(
          'teacherGeneratedQuestions',
          JSON.stringify([...newQuestions, ...existingQuestions])
        )
      } else {
        setError('No questions were generated. Please try again with a different file or options.')
      }
    } catch (err: any) {
      console.error('Error generating questions:', err)
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to generate questions. Please try again.'
      )
    } finally {
      setGenerating(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={['teacher']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/dashboard/teacher"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FaArrowLeft />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Question Generator
              </h1>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                TEACHER
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Upload your lesson materials and generate AI-powered questions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Upload Document
              </h2>
              
              {!uploadedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <FaFilePdf className="mx-auto text-4xl text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drag and drop your PDF file here, or
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                  >
                    <FaUpload /> Browse Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Maximum file size: 10MB
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaFilePdf className="text-2xl text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {uploadedFile.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}
            </div>

            {/* Generation Options */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaSlidersH /> Generation Options
              </h2>
              
              <div className="space-y-4">
                {/* Assessment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assessment Type *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['assignment', 'classwork', 'mid-term', 'examination'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setOptions({ ...options, assessmentType: type })}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                          options.assessmentType === type
                            ? type === 'assignment'
                              ? 'bg-blue-500 text-white'
                              : type === 'classwork'
                              ? 'bg-green-500 text-white'
                              : type === 'mid-term'
                              ? 'bg-purple-500 text-white'
                              : 'bg-orange-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {type === 'assignment' ? 'Assignment' : type === 'classwork' ? 'Classwork' : type === 'mid-term' ? 'Mid-Term Test' : 'Examination'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject (Optional)
                  </label>
                  <input
                    type="text"
                    value={options.subject}
                    onChange={(e) => setOptions({ ...options, subject: e.target.value })}
                    placeholder="e.g., Mathematics, Physics"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['easy', 'medium', 'hard'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setOptions({ ...options, difficulty: level })}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          options.difficulty === level
                            ? level === 'easy'
                              ? 'bg-green-500 text-white'
                              : level === 'medium'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Question Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question Type
                  </label>
                  <select
                    value={options.questionType}
                    onChange={(e) => setOptions({ ...options, questionType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="fill-in-gap">Fill in the Gap</option>
                    <option value="theory">Theory Questions</option>
                  </select>
                </div>

                {/* Number of Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Number of Questions *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={options.numberOfQuestions}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1
                      setOptions({ ...options, numberOfQuestions: Math.max(1, Math.min(100, value)) })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter number of questions"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum: 1, Maximum: 100
                  </p>
                </div>

                {/* Marks Per Question */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Marks Per Question *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={options.marksPerQuestion}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1
                      setOptions({ ...options, marksPerQuestion: Math.max(1, Math.min(100, value)) })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter marks per question"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum: 1, Maximum: 100
                  </p>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                      Total Marks: {options.numberOfQuestions * options.marksPerQuestion} marks
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {options.numberOfQuestions} questions × {options.marksPerQuestion} mark{options.marksPerQuestion > 1 ? 's' : ''} each
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={generateQuestions}
                disabled={!uploadedFile || generating}
                className="w-full mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <FaBrain /> Generate Questions
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Generated Questions Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Generated Questions
              </h2>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" />
                  <p className="text-sm text-green-800 dark:text-green-300">
                    Successfully generated {generatedQuestions.length} questions!
                  </p>
                </div>
              )}

              {generatedQuestions.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                      Total Marks: {generatedQuestions.length * options.marksPerQuestion} marks
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {generatedQuestions.length} questions × {options.marksPerQuestion} mark{options.marksPerQuestion > 1 ? 's' : ''} each
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Type: {options.assessmentType === 'assignment' ? 'Assignment' : options.assessmentType === 'classwork' ? 'Classwork' : options.assessmentType === 'mid-term' ? 'Mid-Term Test' : 'Examination'}
                    </p>
                  </div>
                  {generatedQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                            Q{index + 1}
                          </span>
                          <span className="text-xs font-bold px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 rounded">
                            {options.marksPerQuestion} mark{options.marksPerQuestion > 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          question.difficulty === 'easy'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                            : question.difficulty === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                        }`}>
                          {question.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white line-clamp-3">
                        {question.question}
                      </p>
                      {question.type && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Type: {question.type}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FaBrain className="mx-auto mb-2 text-3xl" />
                  <p className="text-sm">No questions generated yet</p>
                </div>
              )}

              {generatedQuestions.length > 0 && (
                <Link
                  href="/dashboard/teacher/questions"
                  className="mt-4 block w-full text-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  View All Questions →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
