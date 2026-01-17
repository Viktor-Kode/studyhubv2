'use client'

import { useState, useRef } from 'react'
import { FaBrain, FaSlidersH, FaQuestionCircle, FaBook, FaUpload, FaFilePdf, FaTimes } from 'react-icons/fa'
import { questionsApi, GeneratedQuestion } from '@/lib/api/questions'

interface QuestionBankProps {
  className?: string
}

export default function QuestionBank({ className = '' }: QuestionBankProps) {
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [selectedType, setSelectedType] = useState<'all' | 'multiple-choice' | 'fill-in-gap' | 'theory'>('all')
  const [generating, setGenerating] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [generationOptions, setGenerationOptions] = useState({
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    questionType: 'all' as 'multiple-choice' | 'fill-in-gap' | 'theory' | 'all',
    numberOfQuestions: 10,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndSetFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file')
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return false
    }
    setUploadedFile(file)
    setError(null)
    return true
  }

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science']

  // Get unique values from generated questions
  const uniqueSubjects = Array.from(new Set(questions.map((q) => q.subject).filter(Boolean)))
  const uniqueDifficulties = Array.from(new Set(questions.map((q) => q.difficulty)))
  const uniqueTypes = Array.from(new Set(questions.map((q) => q.type)))

  // Only show filters if there are multiple options
  const showSubjectFilter = uniqueSubjects.length > 1
  const showDifficultyFilter = uniqueDifficulties.length > 1
  const showTypeFilter = uniqueTypes.length > 1

  const filteredQuestions = questions.filter((q) => {
    if (selectedSubject !== 'all' && q.subject && q.subject !== selectedSubject) return false
    if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false
    if (selectedType !== 'all' && q.type !== selectedType) return false
    return true
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      validateAndSetFile(file)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const generateQuestions = async () => {
    if (!uploadedFile) {
      setError('Please upload a PDF file first')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const response = await questionsApi.generateFromPDF(uploadedFile, {
        difficulty: generationOptions.difficulty,
        questionType: generationOptions.questionType === 'all' ? undefined : generationOptions.questionType,
        numberOfQuestions: generationOptions.numberOfQuestions,
      })

      if (response.questions && response.questions.length > 0) {
        setQuestions(response.questions)
      } else {
        setError('No questions were generated. Please try again with a different PDF.')
      }
    } catch (err: any) {
      console.error('Error generating questions:', err)
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to generate questions. Please check your PDF and try again.'
      )
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FaBrain className="text-emerald-500 text-xl" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Question Bank</h3>
        </div>
      </div>

      {/* PDF Upload Section */}
      <div
        className={`mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'border-gray-200 dark:border-gray-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          {!uploadedFile ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-upload"
              />
              <label
                htmlFor="pdf-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <FaFilePdf className="text-4xl text-red-500 mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isDragging ? 'Drop PDF here' : 'Click to upload PDF or drag and drop'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDF files only (max 10MB)
                </p>
              </label>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaFilePdf className="text-2xl text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                title="Remove file"
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Generation Options */}
      {uploadedFile && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Generation Options</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                value={generationOptions.difficulty}
                onChange={(e) =>
                  setGenerationOptions({
                    ...generationOptions,
                    difficulty: e.target.value as 'easy' | 'medium' | 'hard',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Question Type
              </label>
              <select
                value={generationOptions.questionType}
                onChange={(e) =>
                  setGenerationOptions({
                    ...generationOptions,
                    questionType: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              >
                <option value="all">All Types</option>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="fill-in-gap">Fill in Gap</option>
                <option value="theory">Theory</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Number of Questions
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={generationOptions.numberOfQuestions}
                onChange={(e) =>
                  setGenerationOptions({
                    ...generationOptions,
                    numberOfQuestions: parseInt(e.target.value) || 10,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
              />
            </div>
          </div>
          <button
            onClick={generateQuestions}
            disabled={generating || !uploadedFile}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaBrain className="text-sm" />
            {generating ? 'Generating Questions...' : 'Generate Questions'}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Filters - Only show if there are multiple options */}
      {(showSubjectFilter || showDifficultyFilter || showTypeFilter) && (
        <div
          className={`grid grid-cols-1 gap-3 mb-4 ${
            [showSubjectFilter, showDifficultyFilter, showTypeFilter].filter(Boolean).length === 1
              ? 'md:grid-cols-1'
              : [showSubjectFilter, showDifficultyFilter, showTypeFilter].filter(Boolean).length === 2
              ? 'md:grid-cols-2'
              : 'md:grid-cols-3'
          }`}
        >
          {showSubjectFilter && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          )}

          {showDifficultyFilter && (
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            >
              <option value="all">All Difficulties</option>
              {uniqueDifficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          )}

          {showTypeFilter && (
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaQuestionCircle className="mx-auto mb-2 text-3xl" />
            <p>
              {questions.length === 0
                ? 'Upload a PDF and generate questions to get started!'
                : 'No questions match your filters. Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium mb-1">{question.question}</p>
                  {question.options && question.options.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {question.options.map((option, idx) => (
                        <p key={idx} className="text-sm text-gray-600 dark:text-gray-400 ml-4">
                          {String.fromCharCode(65 + idx)}. {option}
                        </p>
                      ))}
                    </div>
                  )}
                  {question.answer && (
                    <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      Answer: {question.answer}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {question.subject && (
                      <>
                        <span>{question.subject}</span>
                        <span>•</span>
                      </>
                    )}
                    <span className="capitalize">{question.difficulty}</span>
                    <span>•</span>
                    <span className="capitalize">{question.type.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
