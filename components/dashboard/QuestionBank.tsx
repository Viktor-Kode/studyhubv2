'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import {
  FaBrain, FaFilePdf, FaFileWord, FaFileAlt, FaTimes,
  FaUpload, FaCheckCircle, FaTimesCircle,
  FaHistory, FaSpinner, FaFileCode, FaExclamationTriangle,
  FaRedo
} from 'react-icons/fa'
import { generateQuiz, Question } from '@/lib/api/quizApi'
import { extractTextFromFile } from '@/lib/utils/extraction'

interface QuestionBankProps {
  className?: string
}

export default function QuestionBank({ className = '' }: QuestionBankProps) {
  // Generation State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [amount, setAmount] = useState(5)
  const [questionType, setQuestionType] = useState('multiple-choice')
  const [generating, setGenerating] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Quiz Interaction State
  const [newQuestions, setNewQuestions] = useState<Question[]>([])
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({})
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, boolean>>({})
  const [score, setScore] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleFileUpload = async (file: File) => {
    setError(null)
    setSuccess(null)
    setWarning(null)

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.txt', '.md']
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(extension)) {
      setError('Unsupported file format. Please upload PDF, DOCX, TXT, or MD.')
      return
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.')
      return
    }

    setUploadedFile(file)
    setExtracting(true)

    try {
      const text = await extractTextFromFile(file)
      setExtractedText(text)
      setSuccess('File processed successfully!')
    } catch (err: any) {
      setError(err.message)
      setUploadedFile(null)
    } finally {
      setExtracting(false)
    }
  }

  const handleGenerate = async (forcedText?: string) => {
    const textToUse = forcedText || extractedText
    if (!textToUse) return

    setGenerating(true)
    setError(null)
    setSuccess(null)
    setWarning(null)
    setNewQuestions([])
    setUserAnswers({})
    setCheckedAnswers({})
    setScore(0)

    try {
      const response = await generateQuiz(textToUse, amount, questionType, uploadedFile?.name)

      if (response.isDuplicate) {
        setWarning('This document was already processed. Showing the previously generated questions.')
      } else {
        setSuccess(`Successfully generated ${response.data.length} questions!`)
      }

      setNewQuestions(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz')
    } finally {
      setGenerating(false)
    }
  }

  const handleForceRegenerate = () => {
    // Appending a timestamp bypasses the hash check on the backend
    const saltedText = extractedText + `\n\n[Force Regeneration ID: ${Date.now()}]`
    handleGenerate(saltedText)
  }

  const checkAnswer = (questionId: string, correctAnswer: any) => {
    if (checkedAnswers[questionId]) return;
    const userAnswer = userAnswers[questionId]
    if (userAnswer === undefined || userAnswer === '') return;

    setCheckedAnswers(prev => ({ ...prev, [questionId]: true }))
    const isCorrect = String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim()
    if (isCorrect) setScore(prev => prev + 1)
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return <FaFilePdf className="text-red-500" />
      case 'docx': return <FaFileWord className="text-blue-500" />
      case 'md': return <FaFileCode className="text-gray-500" />
      default: return <FaFileAlt className="text-amber-500" />
    }
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Quiz Generation Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <FaBrain className="text-emerald-500 text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Quiz Generator</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Transform documents into practice tests</p>
            </div>
          </div>
          <Link
            href="/dashboard/question-history"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition font-bold shadow-sm"
          >
            <FaHistory className="text-amber-500" />
            History
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Side */}
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleFileUpload(file) }}
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer
                ${isDragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'}
                ${uploadedFile ? 'border-solid border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-900/5' : ''}
              `}
              onClick={() => !uploadedFile && !extracting && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileSelect}
                disabled={extracting}
              />

              {!uploadedFile ? (
                <>
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <FaUpload className="text-2xl text-gray-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-700 dark:text-gray-200">Drop your document</p>
                    <p className="text-xs text-gray-500">PDF, DOCX, TXT, MD (Max 5MB)</p>
                  </div>
                </>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(uploadedFile.name)}
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{uploadedFile.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    {!extracting && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setExtractedText(''); setError(null); setSuccess(null); setWarning(null) }}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 hover:text-red-500 rounded-lg transition"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  {extracting ? (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <FaSpinner className="animate-spin text-emerald-500" />
                      <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Processing Content...</span>
                    </div>
                  ) : extractedText && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">Text Extracted</span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-3 italic leading-relaxed">
                        "{extractedText.substring(0, 200)}..."
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Options Side */}
          <div className="flex flex-col justify-between">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400">
                    Type
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-medium"
                  >
                    <option value="multiple-choice">MCQ</option>
                    <option value="theory">Theory</option>
                    <option value="fill-in-the-blank">Blanks</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400">
                    Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={amount}
                    onChange={(e) => setAmount(Math.min(50, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              {amount > 20 && (
                <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg">
                  <FaExclamationTriangle className="flex-shrink-0" />
                  <span>Generating {amount} questions may take a moment.</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-xl text-red-500 text-xs font-medium animate-shake">
                  <FaTimesCircle className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  <FaCheckCircle className="flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {warning && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    <FaExclamationTriangle className="flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                  <button
                    onClick={handleForceRegenerate}
                    className="w-full flex items-center justify-center gap-2 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all"
                  >
                    <FaRedo /> Generate New Anyway
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={generating || !extractedText || extracting}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all mt-4
                ${generating || !extractedText || extracting
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95'}
              `}
            >
              {generating ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Crafting Quiz...
                </>
              ) : (
                <>
                  <FaBrain />
                  Generate Quiz
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Questions View */}
      {newQuestions.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between bg-gray-900 dark:bg-gray-700 p-4 rounded-2xl shadow-xl">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500 rounded-lg"><FaBrain /></span>
              Active Training Session
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">Progress:</span>
              <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-xl font-black shadow-lg">
                {score} / {newQuestions.length}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {newQuestions.map((q, idx) => (
              <div key={q._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center font-black text-sm">
                    {idx + 1}
                  </span>
                  <div className="flex-1 space-y-4">
                    <p className="text-lg text-gray-800 dark:text-gray-100 font-bold leading-snug">{q.content}</p>

                    <div className="grid gap-2">
                      {q.options && q.options.length > 0 ? (
                        q.options.map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all
                              ${userAnswers[q._id] === oIdx ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-gray-50 dark:border-gray-700 hover:border-emerald-200 hover:bg-gray-50/50 dark:hover:bg-gray-700'}
                              ${checkedAnswers[q._id] && q.answer === oIdx ? 'border-emerald-500 bg-emerald-100/30 dark:bg-emerald-900/20' : ''}
                              ${checkedAnswers[q._id] && userAnswers[q._id] === oIdx && q.answer !== oIdx ? 'border-red-400 bg-red-50/50 dark:bg-red-900/10' : ''}
                            `}
                          >
                            <input
                              type="radio"
                              name={`q-${q._id}`}
                              className="hidden"
                              disabled={checkedAnswers[q._id]}
                              onChange={() => setUserAnswers(prev => ({ ...prev, [q._id]: oIdx }))}
                            />
                            <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-[10px] font-black
                              ${userAnswers[q._id] === oIdx ? 'bg-emerald-500 border-emerald-500 text-white scale-110' : 'border-gray-300 dark:border-gray-600 text-gray-400'}
                            `}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="text-gray-600 dark:text-gray-300 font-medium">{opt}</span>
                            {checkedAnswers[q._id] && q.answer === oIdx && <FaCheckCircle className="ml-auto text-emerald-500 animate-bounce" />}
                            {checkedAnswers[q._id] && userAnswers[q._id] === oIdx && q.answer !== oIdx && <FaTimesCircle className="ml-auto text-red-400" />}
                          </label>
                        ))
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Type your response here..."
                            disabled={checkedAnswers[q._id]}
                            className={`w-full px-5 py-3.5 rounded-xl border-2 outline-none transition-all font-medium
                              ${checkedAnswers[q._id] ? 'bg-gray-50 dark:bg-gray-700 text-gray-500' : 'bg-gray-50/50 dark:bg-gray-900/20 border-gray-100 dark:border-gray-600 focus:border-emerald-500/50 focus:bg-white'}
                            `}
                            value={userAnswers[q._id] || ''}
                            onChange={(e) => setUserAnswers(prev => ({ ...prev, [q._id]: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>

                    {!checkedAnswers[q._id] ? (
                      <button
                        onClick={() => checkAnswer(q._id, q.answer)}
                        disabled={userAnswers[q._id] === undefined || userAnswers[q._id] === ''}
                        className="w-full sm:w-auto px-10 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-emerald-600 active:scale-95"
                      >
                        Verify Answer
                      </button>
                    ) : (
                      <div className="mt-4 p-5 bg-gray-50 dark:bg-gray-900/40 rounded-2xl animate-in slide-in-from-top-2 duration-300 shadow-inner border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-3 text-sm font-black uppercase tracking-tighter">
                          {String(userAnswers[q._id]).toLowerCase().trim() === String(q.answer).toLowerCase().trim() ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><FaCheckCircle /> Victory! Excellent Work</span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1.5"><FaTimesCircle /> Not quite. Solution:
                              <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                                {typeof q.answer === 'number' ? q.options[q.answer] : q.answer}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Knowledge Deep-Dive:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm italic">
                            "{q.explanation}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
