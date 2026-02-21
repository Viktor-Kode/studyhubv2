'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FiFileText, FiX, FiUpload, FiCheckCircle, FiXCircle, FiClock, FiLoader, FiCode, FiAlertTriangle, FiRefreshCw, FiFile, FiEdit3, FiSave, FiList } from 'react-icons/fi'
import { BiBrain, BiMessageRoundedDots } from 'react-icons/bi'
import { generateQuiz, Question, generateStudyNotes, saveStudyNote, chatWithTutor } from '@/lib/api/quizApi'
import { extractTextFromFile } from '@/lib/utils/fileExtractor'

interface QuestionBankProps {
  className?: string
}

type InputMode = 'upload' | 'manual'

export default function QuestionBank({ className = '' }: QuestionBankProps) {
  // Generation State
  const [inputMode, setInputMode] = useState<InputMode>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [manualText, setManualText] = useState('')
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

  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<'quiz' | 'notes' | 'tutor'>('quiz')
  const [generatedNotes, setGeneratedNotes] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [generatingNotes, setGeneratingNotes] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  // AI Tutor State
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatting, setIsChatting] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Handle Query Params
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    const textParam = searchParams.get('text')

    if (tabParam === 'notes') setActiveTab('notes')
    if (tabParam === 'quiz') setActiveTab('quiz')

    if (textParam) {
      setManualText(decodeURIComponent(textParam))
      setInputMode('manual')
    }
  }, [searchParams])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (activeTab === 'tutor') scrollToBottom()
  }, [chatMessages, activeTab])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleFileUpload = async (file: File) => {
    setError(null)
    setSuccess(null)
    setWarning(null)

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.txt', '.md', '.ppt', '.pptx']
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(extension)) {
      setError('Unsupported format. Use PDF, DOCX, PPT, PPTX, TXT, or MD.')
      return
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (Max 5MB).')
      return
    }

    setUploadedFile(file)
    setExtracting(true)
    setError(null)

    try {
      const result = await extractTextFromFile(file)
      if (result.success && result.text) {
        setExtractedText(result.text)
        setSuccess('Content analyzed successfully!')
        setError(null)
      } else {
        setError(result.error || 'Failed to extract content')
        setUploadedFile(null)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during extraction')
      setUploadedFile(null)
    } finally {
      setExtracting(false)
    }
  }

  const handleGenerate = async (forcedText?: string, forceNew: boolean = false) => {
    // Determine which text to use based on mode or override
    let textToUse = forcedText

    if (!textToUse) {
      if (inputMode === 'upload') {
        textToUse = extractedText
      } else {
        textToUse = manualText
      }
    }

    if (!textToUse || textToUse.trim().length < 50) {
      setError('Please provide valid content (at least 50 characters) to generate questions.')
      return
    }

    setGenerating(true)
    setError(null)
    setSuccess(null)
    setWarning(null)
    setNewQuestions([])
    setUserAnswers({})
    setCheckedAnswers({})
    setScore(0)

    try {
      const sourceName = inputMode === 'upload' ? uploadedFile?.name : 'Manual Input'
      const response = await generateQuiz(textToUse, amount, questionType, sourceName, forceNew)

      if (response.isDuplicate && !forceNew) {
        setWarning('Showing existing questions for this content. Click "Generate New Set" for more.')
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

  const handleSaveNote = async () => {
    if (!generatedNotes || !noteTitle) {
      setError('Please provide a title for your note.')
      return
    }

    setSavingNote(true)
    setError(null)
    try {
      const sourceName = inputMode === 'upload' ? uploadedFile?.name : 'Manual Input'
      const response = await saveStudyNote(noteTitle, generatedNotes, sourceName)
      if (response.success) {
        setSuccess('Study note saved successfully!')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleForceRegenerate = () => {
    // Appending a timestamp bypasses the hash check on the backend
    const currentText = inputMode === 'upload' ? extractedText : manualText
    const saltedText = currentText + `\n\n[Force Regeneration ID: ${Date.now()}]`
    handleGenerate(saltedText)
  }

  const handleGenerateNotes = async () => {
    let textToUse = inputMode === 'upload' ? extractedText : manualText

    if (!textToUse || textToUse.trim().length < 50) {
      setError('Please provide valid content (at least 50 characters) to generate notes.')
      return
    }

    setGeneratingNotes(true)
    setError(null)
    setWarning(null)
    setGeneratedNotes('')

    try {
      const sourceName = inputMode === 'upload' ? uploadedFile?.name : 'Manual Input'
      const response = await generateStudyNotes(textToUse, sourceName)

      if (response.success && response.notes) {
        setGeneratedNotes(response.notes)
        setSuccess('Study notes generated successfully!')
      } else {
        setError('Failed to generate study notes. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate study notes')
    } finally {
      setGeneratingNotes(false)
    }
  }

  const handleCreateQuizFromNotes = () => {
    if (!generatedNotes) return
    setManualText(generatedNotes)
    setInputMode('manual')
    setActiveTab('quiz')
    // Optionally auto-scroll to generator
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!chatInput.trim() || isChatting) return

    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsChatting(true)
    setError(null)

    try {
      const context = inputMode === 'upload' ? extractedText : manualText
      const response = await chatWithTutor(userMsg, context, chatMessages)
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.reply }])
    } catch (err: any) {
      setError(err.message || 'Tutor failed to respond. Please try again.')
    } finally {
      setIsChatting(false)
    }
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
      case 'pdf': return <FiFileText className="text-red-500 text-xl" />
      case 'docx': return <FiFileText className="text-blue-500 text-xl" />
      case 'ppt':
      case 'pptx': return <FiFileText className="text-orange-500 text-xl" />
      case 'md': return <FiCode className="text-gray-500 text-xl" />
      default: return <FiFile className="text-amber-500 text-xl" />
    }
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Quiz Generation Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <BiBrain className="text-emerald-500 text-2xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Question Bank</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Deep Learning through Active Recall</p>
            </div>
          </div>
          <Link
            href="/dashboard/notes-history"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition font-bold shadow-sm"
          >
            <FiList className="text-emerald-500" />
            My Notes
          </Link>
          <Link
            href="/dashboard/question-history"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition font-bold shadow-sm"
          >
            <FiClock className="text-blue-500" />
            History
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`pb-2 px-4 text-sm font-bold transition-all border-b-2 
                    ${activeTab === 'quiz'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Quiz Generator
          </button>
          <button
            onClick={() => setActiveTab('tutor')}
            className={`pb-2 px-4 text-sm font-bold transition-all border-b-2 
                    ${activeTab === 'tutor'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            AI Study Tutor
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-2 px-4 text-sm font-bold transition-all border-b-2 
                    ${activeTab === 'notes'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Study Notes
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Side */}
          <div className="space-y-4">

            {/* Input Method Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
              <button
                onClick={() => setInputMode('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all
                  ${inputMode === 'upload'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                <FiUpload /> Upload File
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all
                  ${inputMode === 'manual'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                <FiEdit3 /> Manual Text
              </button>
            </div>

            {/* UPLOAD MODE */}
            {inputMode === 'upload' && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleFileUpload(file) }}
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[250px]
                  ${isDragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'}
                  ${uploadedFile ? 'border-solid border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-900/5' : ''}
                `}
                onClick={() => !uploadedFile && !extracting && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.docx,.txt,.md,.ppt,.pptx"
                  onChange={handleFileSelect}
                  disabled={extracting}
                />

                {!uploadedFile ? (
                  <>
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <FiUpload className="text-2xl text-gray-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-700 dark:text-gray-200">Select Study Material</p>
                      <p className="text-xs text-gray-500">PDF, Word, PPT, or Notes (Max 5MB)</p>
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
                          <FiX />
                        </button>
                      )}
                    </div>
                    {extracting ? (
                      <div className="flex items-center justify-center gap-2 py-4">
                        <FiLoader className="animate-spin text-blue-500" />
                        <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Parsing Structure...</span>
                      </div>
                    ) : extractedText && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">Content Extracted</span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-3 italic leading-relaxed">
                          "{extractedText.substring(0, 200)}..."
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MANUAL MODE */}
            {inputMode === 'manual' && (
              <div className="min-h-[250px] flex flex-col">
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="flex-1 w-full p-4 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-400 transition-all font-medium resize-none"
                  placeholder="Paste your study notes, sections of a book, or lecture transcripts here..."
                />
                <p className="text-xs text-gray-400 text-right mt-2">
                  {manualText.length} characters
                </p>
              </div>
            )}

            {/* Tips based on mode */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
              <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <FiFileText /> {inputMode === 'upload' ? 'File Format Tips' : 'Manual Input Tips'}
              </p>
              <ul className="text-[11px] text-blue-800 dark:text-blue-300 space-y-1 font-medium list-disc pl-4 opacity-80">
                {inputMode === 'upload' ? (
                  <>
                    <li><strong>PDF:</strong> Use text-based PDFs (not scanned)</li>
                    <li><strong>Word/DOCX:</strong> Highly reliable, recommended</li>
                    <li><strong>PPT/PPTX:</strong> Presentations supported</li>
                    <li><strong>TXT/MD:</strong> Fastest processing</li>
                  </>
                ) : (
                  <>
                    <li>Paste ample content for best results (at least 50 chars)</li>
                    <li>Structured text (headings, bullets) works best</li>
                    <li>Ensure content is clear and readable</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Options Side - Conditional Rendering */}
          <div className="flex flex-col justify-between">
            {activeTab === 'quiz' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Type
                    </label>
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 dark:border-gray-700 rounded-xl bg-blue-50/30 dark:bg-gray-900/50 text-sm outline-none font-medium"
                    >
                      <option value="multiple-choice">MCQ</option>
                      <option value="theory">Theory</option>
                      <option value="fill-in-the-blank">Blanks</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Amount
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={amount}
                      onChange={(e) => setAmount(Math.min(50, Math.max(1, Number(e.target.value))))}
                      className="w-full px-3 py-2 border border-blue-200 dark:border-gray-700 rounded-xl bg-blue-50/30 dark:bg-gray-900/50 text-sm outline-none font-bold"
                    />
                  </div>
                </div>

                {amount > 20 && (
                  <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg">
                    <FiAlertTriangle className="flex-shrink-0" />
                    <span>Generating {amount} questions may take a moment.</span>
                  </div>
                )}

                {error && activeTab === 'quiz' && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/50">
                    <p className="text-red-500 text-xs font-medium mb-2">{error}</p>
                  </div>
                )}

                {success && activeTab === 'quiz' && <div className="p-3 bg-emerald-50 text-emerald-600 text-xs rounded-xl font-medium">{success}</div>}

                {warning && activeTab === 'quiz' && (
                  <div className="p-3 bg-amber-50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
                      <FiAlertTriangle className="flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                    <button onClick={handleForceRegenerate} className="w-full py-1 bg-amber-600 text-white text-[10px] font-bold rounded-lg uppercase">Regenerate Anyway</button>
                  </div>
                )}

                <button
                  onClick={() => handleGenerate()}
                  disabled={generating || (inputMode === 'upload' && (!extractedText || extracting)) || (inputMode === 'manual' && manualText.trim().length < 50)}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all mt-4 disabled:bg-gray-100 disabled:text-gray-400 shadow-lg shadow-blue-500/20"
                >
                  {generating ? <span className="flex items-center justify-center gap-2"><FiLoader className="animate-spin" /> Generating...</span> : "Create Quiz"}
                </button>

                {newQuestions.length > 0 && (
                  <button
                    onClick={() => handleGenerate(undefined, true)}
                    disabled={generating}
                    className="w-full py-3 border-2 border-blue-600/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl font-bold uppercase tracking-widest text-xs transition-all mt-2"
                  >
                    Generate New Set
                  </button>
                )}
              </div>
            ) : activeTab === 'tutor' ? (
              // TUTOR TAB UI
              <div className="flex flex-col h-[400px] border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900/20">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <BiMessageRoundedDots className="text-3xl text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-sm font-bold text-gray-700 dark:text-white">Ask your AI Tutor anything!</p>
                      <p className="text-xs text-gray-500 max-w-[200px]">I can explain topics, summarize parts, or help you with practice questions based on your material.</p>
                      {(!extractedText && inputMode === 'upload') && (
                        <p className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg mt-2">
                          Please upload a file first for context!
                        </p>
                      )}
                    </div>
                  )}

                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm
                        ${msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'}`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatting && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3 rounded-2xl rounded-tl-none shadow-sm">
                        <FiLoader className="animate-spin text-purple-500" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {error && activeTab === 'tutor' && (
                  <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-100">
                    <p className="text-red-500 text-[10px] font-bold">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-purple-400 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isChatting || !chatInput.trim()}
                    className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <FiCheckCircle />
                  </button>
                </form>
              </div>
            ) : (
              // NOTES TAB UI
              <div className="space-y-4 h-full flex flex-col">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex-1">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200 mb-2 flex items-center gap-2">
                    <FiFileText /> AI Note Generator
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-4 opacity-80">
                    Transform your documents into concise, structured study summaries.
                    Perfect for quick revision and understanding complex topics.
                  </p>

                  {error && activeTab === 'notes' && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100">
                      <p className="text-red-500 text-xs font-medium">{error}</p>
                    </div>
                  )}

                  {success && activeTab === 'notes' && (
                    <div className="mb-4 p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-medium">
                      {success}
                    </div>
                  )}

                  <button
                    onClick={handleGenerateNotes}
                    disabled={generatingNotes || (inputMode === 'upload' && (!extractedText || extracting)) || (inputMode === 'manual' && manualText.trim().length < 50)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all disabled:bg-gray-100 disabled:text-gray-400 shadow-lg shadow-emerald-500/20"
                  >
                    {generatingNotes ? (
                      <span className="flex items-center justify-center gap-2">
                        <FiLoader className="animate-spin" /> Analyzing Content...
                      </span>
                    ) : "Generate Study Notes"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generated Content View */}
      {activeTab === 'notes' && generatedNotes && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Note Title</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter a name for this note..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-emerald-500 transition-all font-bold"
                  />
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote || !noteTitle}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 hover:bg-emerald-700 disabled:bg-gray-400 shadow-lg shadow-emerald-500/20"
                  >
                    {savingNote ? <FiLoader className="animate-spin" /> : <FiSave />}
                    Save Note
                  </button>
                </div>
              </div>
              <div className="flex gap-2 self-end">
                <button
                  onClick={handleCreateQuizFromNotes}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 rounded-lg text-xs font-bold transition flex items-center gap-2 border border-blue-100 dark:border-blue-800"
                >
                  <BiBrain className="text-lg" />
                  Turn into Quiz
                </button>
              </div>
            </div>
            <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-medium text-gray-700 dark:text-gray-300">
              {generatedNotes}
            </div>
          </div>
        </div>
      )}

      {/* Generated Questions View (Only show if Quiz tab active) */}
      {activeTab === 'quiz' && newQuestions.length > 0 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between bg-blue-600 p-4 rounded-2xl shadow-xl text-white">
            <h4 className="font-bold flex items-center gap-2 italic">CORE KNOWLEDGE DRILL</h4>
            <div className="bg-white/20 px-4 py-1.5 rounded-xl font-black">{score} / {newQuestions.length}</div>
          </div>

          <div className="grid gap-6">
            {newQuestions.map((q, idx) => (
              <div key={q._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center font-black text-sm">{idx + 1}</span>
                  <div className="flex-1 space-y-4">
                    <p className="text-lg text-gray-800 dark:text-gray-100 font-bold leading-snug">{q.content}</p>

                    <div className="grid gap-2">
                      {q.options && q.options.length > 0 ? (
                        q.options.map((opt, oIdx) => (
                          <label key={oIdx} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer
                            ${userAnswers[q._id] === oIdx ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-50 dark:border-gray-700 hover:border-blue-200 hover:bg-gray-50/50 dark:hover:bg-gray-700'}
                            ${checkedAnswers[q._id] && q.answer === oIdx ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/20' : ''}
                            ${checkedAnswers[q._id] && userAnswers[q._id] === oIdx && q.answer !== oIdx ? 'border-red-400 bg-red-50/50 dark:bg-red-900/10' : ''}
                          `}>
                            <input type="radio"
                              name={`q-${q._id}`}
                              className="hidden"
                              disabled={checkedAnswers[q._id]}
                              onChange={() => setUserAnswers(prev => ({ ...prev, [q._id]: oIdx }))}
                            />
                            <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-[10px] font-black
                              ${userAnswers[q._id] === oIdx ? 'bg-blue-500 border-blue-500 text-white scale-110' : 'border-gray-300 dark:border-gray-600 text-gray-400'}
                            `}>{String.fromCharCode(65 + oIdx)}</span>
                            <span className="text-gray-600 dark:text-gray-300 font-medium">{opt}</span>
                            {checkedAnswers[q._id] && q.answer === oIdx && <FiCheckCircle className="ml-auto text-emerald-500 animate-bounce" />}
                            {checkedAnswers[q._id] && userAnswers[q._id] === oIdx && q.answer !== oIdx && <FiXCircle className="ml-auto text-red-400" />}
                          </label>
                        ))
                      ) : (
                        <div className="space-y-2">
                          <input type="text" placeholder="Your answer..." disabled={checkedAnswers[q._id]}
                            className={`w-full px-5 py-3.5 rounded-xl border-2 outline-none transition-all font-medium
                              ${checkedAnswers[q._id] ? 'bg-gray-50 dark:bg-gray-700 text-gray-500' : 'bg-gray-50/50 dark:bg-gray-900/20 border-gray-100 dark:border-gray-600 focus:border-blue-500/50 focus:bg-white'}
                            `}
                            value={userAnswers[q._id] || ''} onChange={(e) => setUserAnswers(prev => ({ ...prev, [q._id]: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>

                    {!checkedAnswers[q._id] ? (
                      <button onClick={() => checkAnswer(q._id, q.answer)} disabled={userAnswers[q._id] === undefined || userAnswers[q._id] === ''}
                        className="w-full sm:w-auto px-8 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-blue-600 active:scale-95"
                      >Verify Concept</button>
                    ) : (
                      <div className="mt-4 p-5 bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-2xl animate-in slide-in-from-top-2 duration-300 shadow-inner">
                        <div className="flex items-center gap-2 mb-3 text-sm font-black uppercase tracking-tighter">
                          {String(userAnswers[q._id]).toLowerCase().trim() === String(q.answer).toLowerCase().trim() ? (
                            <span className="text-emerald-500 flex items-center gap-1.5"><FiCheckCircle /> Drill Complete</span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1.5"><FiXCircle /> Misconception Identified:
                              <span className="text-blue-600 dark:text-blue-200 ml-1">
                                {typeof q.answer === 'number' ? q.options[q.answer] : q.answer}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest pl-1">📚 KNOWLEDGE DEEP-DIVE</p>
                          <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed font-medium italic">
                            "{q.knowledgeDeepDive}"
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
