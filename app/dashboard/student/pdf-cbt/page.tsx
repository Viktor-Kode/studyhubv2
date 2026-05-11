'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { 
  FiFileText, FiX, FiUpload, FiCheckCircle, FiXCircle, 
  FiClock, FiLoader, FiCamera, FiAlertTriangle,
  FiFlag, FiChevronLeft, FiChevronRight, FiPlay, FiTrash2, FiLink, FiFile
} from 'react-icons/fi'
import { Sparkles, FileQuestion } from 'lucide-react'
import { getFirebaseToken } from '@/lib/store/authStore'
import { cbtApi } from '@/lib/api/cbt'
import { apiClient } from '@/lib/api/client'
import { toast } from 'react-hot-toast'
import { confirmToast } from '@/lib/utils/confirm'
import { extractTextFromFile } from '@/lib/utils/extraction'

import './PdfCbt.css'

// Premium Design System for Dark Mode
const DARK_THEME = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  accent: '#5B4CF5',
  text: '#F8FAFB',
  muted: '#94A3B8'
}


// Types
type InputMode = 'upload' | 'manual' | 'link'
type Stage = 'setup' | 'practice' | 'results'
type OptionKey = 'A' | 'B' | 'C' | 'D'
type QuestionType = 'objective' | 'theory' | 'mixed'

interface Question {
  type: 'objective' | 'theory'
  question: string
  options: Record<OptionKey, string> | null
  answer: string
  explanation?: string
}

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D']

function getExtractionLabel(file: File): string {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'Scanning photo with OCR...'
  if (ext === '.pdf') return 'Extracting PDF pages...'
  if (ext === '.docx') return 'Reading Word document...'
  if (ext === '.ppt' || ext === '.pptx') return 'Extracting presentation text...'
  if (ext === '.txt' || ext === '.md') return 'Reading text file...'
  return 'Reading document...'
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return <div className="p-2 bg-red-100 text-red-600 rounded-lg"><FiFileText /></div>
  if (ext === 'docx' || ext === 'doc') return <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FiFile /></div>
  if (ext === 'pptx' || ext === 'ppt') return <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><FiFile /></div>
  return <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><FiFile /></div>
}

const shuffleArray = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)

export default function PdfCbtPage() {
  // Input State
  const [inputMode, setInputMode] = useState<InputMode>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [manualText, setManualText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [fetchingLink, setFetchingLink] = useState(false)
  
  
  // App State
  const [stage, setStage] = useState<Stage>('setup')
  const [extracting, setExtracting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [extractionHint, setExtractionHint] = useState('')
  
  // Camera State
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraStreamRef] = useState<{ current: MediaStream | null }>({ current: null })
  const videoRef = useRef<HTMLVideoElement>(null)

  // Config State
  const [numQuestions, setNumQuestions] = useState('all')
  const [timeLimit, setTimeLimit] = useState('0')
  const [shuffle, setShuffle] = useState(true)
  const [questionType, setQuestionType] = useState<QuestionType>('mixed')

  // Practice State
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [savingResult, setSavingResult] = useState(false)
  const [subject, setSubject] = useState('General Study')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Timer Effect
  useEffect(() => {
    if (stage !== 'practice' || Number(timeLimit) <= 0 || quizSubmitted) return
    if (timeLeft <= 0) {
      void handleSubmit()
      return
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [stage, timeLimit, timeLeft, quizSubmitted])

  // Helpers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const answeredCount = useMemo(
    () => Object.values(answers).filter((val) => String(val || '').trim().length > 0).length,
    [answers]
  )

  const score = useMemo(() => {
    const objectives = practiceQuestions.filter(q => q.type === 'objective')
    const total = objectives.length
    const correct = practiceQuestions.reduce((acc, q, i) => {
      if (q.type !== 'objective') return acc
      const userAns = String(answers[i] || '').trim().toUpperCase()
      const correctAns = String(q.answer || '').trim().toUpperCase()
      return userAns === correctAns ? acc + 1 : acc
    }, 0)
    const pct = total ? Math.round((correct / total) * 100) : 0
    return { total, correct, pct }
  }, [answers, practiceQuestions])

  // Handlers
  const handleFileUpload = async (file: File) => {
    setError(null)
    setSuccess(null)
    setWarning(null)

    if (file.size > 25 * 1024 * 1024) {
      setError('File too large (Max 25MB).')
      return
    }

    setUploadedFile(file)
    setExtracting(true)

    try {
      setExtractionHint(getExtractionLabel(file))
      const text = await extractTextFromFile(file)
      setExtractedText(text)
      setSuccess('Document ready! Click "Start Practice" to begin.')
    } catch (err: any) {
      setError(err?.message || 'Could not read this file. Try a text-based PDF or paste your text directly.')
      setUploadedFile(null)
    } finally {
      setExtracting(false)
      setExtractionHint('')
    }
  }

  const handleFetchUrl = async () => {
    const url = linkUrl.trim()
    if (!url) return

    setFetchingLink(true)
    setError(null)
    setSuccess(null)

    try {
      const resp = await apiClient.post('/ai/fetch-url', { url })
      const data = resp.data

      if (data.text) {
        setExtractedText(data.text)
        setSuccess('Link content fetched! Click "Start Practice" to begin.')
      } else {
        throw new Error('No readable content found at this link.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err?.message || 'Failed to fetch link content.')
    } finally {
      setFetchingLink(false)
    }
  }

  const handleOpenCamera = async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      cameraStreamRef.current = stream
      setCameraOpen(true)
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      })
    } catch (err: any) {
      setError('Could not access camera.')
    }
  }

  const handleCapture = async () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.92))
    if (!blob) return
    
    const imageFile = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
    setUploadedFile(imageFile)
    setCameraOpen(false)
    if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop())
    
    setExtracting(true)
    setExtractionHint('Scanning photo with OCR...')
    try {
      const text = await extractTextFromFile(imageFile)
      if (text && text.trim().length > 0) {
        setExtractedText(text)
        setSuccess('Text extracted! Click "Start Practice" to begin.')
      } else {
        throw new Error('No text found in photo.')
      }
    } catch (err: any) {
      setError(err?.message || 'OCR failed.')
    } finally {
      setExtracting(false)
      setExtractionHint('')
    }
  }

  const handleStartPractice = async () => {
    const text = inputMode === 'manual' ? manualText : extractedText
    if (!text || text.trim().length === 0) {
      setError('Please provide some content or a link first.')
      return
    }

    setGenerating(true)
    setError(null)
    try {
      const resp = await apiClient.post('/pdf-cbt/generate', { 
        text, 
        questionType,
        requestedCount: numQuestions === 'all' ? 60 : Number(numQuestions)
      })
      const data = resp.data


      const questions: Question[] = (data.questions || []).map((q: any) => ({
        type: String(q.type || '').toLowerCase() === 'theory' ? 'theory' : 'objective',
        question: q.question || '',
        options: q.options || null,
        answer: q.answer || '',
        explanation: q.explanation || q.knowledgeDeepDive || ''
      })).filter((q: Question) => q.question)

      if (questions.length === 0) throw new Error('No questions found in this document.')

      setSubject(data.subject || 'Extracted Practice')
      
      // Select subset based on config
      let finalSet = shuffle ? shuffleArray(questions) : [...questions]
      if (numQuestions !== 'all') {
        finalSet = finalSet.slice(0, Number(numQuestions))
      }
      
      setPracticeQuestions(finalSet)
      setTimeLeft(Number(timeLimit) > 0 ? Number(timeLimit) * 60 : 0)
      setStage('practice')
      setCurrentIdx(0)
      setAnswers({})
      setFlagged(new Set())
      setQuizSubmitted(false)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async () => {
    if (quizSubmitted || savingResult) return
    setSavingResult(true)
    try {
      const accuracy = score.pct
      await cbtApi.saveResult({
        subject,
        examType: 'PDF_CBT',
        totalQuestions: practiceQuestions.length,
        correctAnswers: score.correct,
        wrongAnswers: practiceQuestions.length - score.correct,
        accuracy,
        answers: practiceQuestions.map((q, i) => ({
          questionId: String(i + 1),
          question: q.question,
          selectedAnswer: String(answers[i] || '').trim(),
          correctAnswer: String(q.answer || '').trim(),
          isCorrect: q.type === 'objective' ? (String(answers[i] || '').trim().toUpperCase() === String(q.answer || '').trim().toUpperCase()) : undefined
        }))
      })
      setQuizSubmitted(true)
      setStage('results')
      toast.success('Results saved to dashboard!')
    } catch (err) {
      console.error('Save failed:', err)
      setStage('results') // Still show results even if save fails
    } finally {
      setSavingResult(false)
    }
  }

  const handleQuit = async () => {
    const ok = await confirmToast('Are you sure you want to quit? Your progress will be lost.', {
      title: 'Quit Practice',
      confirmText: 'Quit',
      variant: 'danger'
    })
    if (ok) setStage('setup')
  }

  const toggleFlag = () => {
    setFlagged(prev => {
      const next = new Set(prev)
      if (next.has(currentIdx)) next.delete(currentIdx)
      else next.add(currentIdx)
      return next
    })
  }

  // UI Components
  const currentQ = practiceQuestions[currentIdx]

  return (
    <div className="pcbt-page bg-[#0F172A] min-h-screen text-white dark">
      <style jsx global>{`
        body { background-color: #0F172A; }
        .pcbt-page { color: ${DARK_THEME.text}; }
        .pcbt-page textarea, .pcbt-page input {
          background-color: ${DARK_THEME.bg} !important;
          color: white !important;
          border-color: ${DARK_THEME.border} !important;
        }
        .pcbt-page textarea:focus, .pcbt-page input:focus {
          border-color: ${DARK_THEME.accent} !important;
        }
        .pcbt-page .bg-white { background-color: ${DARK_THEME.card} !important; }
        .pcbt-page .text-[#0F172A] { color: ${DARK_THEME.text} !important; }
        .pcbt-page .border-gray-100, .pcbt-page .border-gray-200 { border-color: ${DARK_THEME.border} !important; }
        .pcbt-page .bg-gray-50 { background-color: ${DARK_THEME.bg} !important; }
        .pcbt-page .text-gray-600, .pcbt-page .text-gray-500 { color: ${DARK_THEME.muted} !important; }
      `}</style>
      {stage === 'setup' && (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Document to CBT</h1>
            <p className="text-gray-400 text-lg">Extract questions from any PDF, Word, or Link and practice immediately.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Side */}
            <div className="space-y-4">
              <div className="qg-source-tabs">
                <button className={`qg-source-tab ${inputMode === 'manual' ? 'active' : ''}`} onClick={() => setInputMode('manual')}>
                  <span>✏️</span> Paste
                </button>
                <button className={`qg-source-tab ${inputMode === 'upload' ? 'active' : ''}`} onClick={() => setInputMode('upload')}>
                  <span>📄</span> Files
                </button>
                <button className={`qg-source-tab ${inputMode === 'link' ? 'active' : ''}`} onClick={() => setInputMode('link')}>
                  <span>🔗</span> Link
                </button>
              </div>

              {inputMode === 'link' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="relative">
                    <input 
                      type="text"
                      className="w-full p-4 pl-12 rounded-2xl border-2 border-[#E8EAED] dark:border-gray-700 bg-white dark:bg-gray-800 text-white focus:border-[#5B4CF5] outline-none transition-all text-sm font-medium"
                      placeholder="Paste a website or Google Doc link..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                    <FiLink className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                  <button 
                    onClick={handleFetchUrl}
                    disabled={fetchingLink}
                    className="w-full py-3 bg-[#5B4CF5] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {fetchingLink ? <FiLoader className="animate-spin" /> : 'Fetch Content'}
                  </button>
                </div>
              )}

              {inputMode === 'upload' ? (
                <>
                  <div className="flex items-center justify-end">
                    <button onClick={handleOpenCamera} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition">
                      <FiCamera /> Use Camera
                    </button>
                  </div>
                  <div 
                    className={`relative border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[250px]
                    ${isDragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'}
                    ${uploadedFile ? 'border-solid border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-900/5' : ''}
                    `}
                    onClick={() => !uploadedFile && !extracting && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleFileUpload(file) }}
                  >
                    <input ref={fileInputRef} type="file" hidden accept=".pdf,.docx,.doc,.txt,.md,.ppt,.pptx,image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                    
                    {!uploadedFile ? (
                      <>
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500">
                          <FiUpload size={24} />
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-700 dark:text-gray-200">Select Study Material</p>
                          <p className="text-xs text-gray-500">PDF, Word, PPT, or Images (Max 25MB)</p>
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
                            <button onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setExtractedText('') }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 hover:text-red-500 rounded-lg transition">
                              <FiX />
                            </button>
                          )}
                        </div>
                        {extracting ? (
                          <div className="flex items-center justify-center gap-2 py-4">
                            <FiLoader className="animate-spin text-blue-500" />
                            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">{extractionHint || 'Processing...'}</span>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-100 dark:border-gray-700">
                             <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] uppercase font-black text-gray-400 tracking-tighter">File Ready</span>
                             </div>
                             <p className="text-[11px] text-gray-600 dark:text-gray-400 italic leading-relaxed">"{uploadedFile.name}" ready for extraction.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="min-h-[250px] flex flex-col">
                  <textarea 
                    className="flex-1 w-full p-5 rounded-2xl border-2 border-[#E8EAED] dark:border-gray-700 bg-white dark:bg-gray-800 text-white focus:border-[#5B4CF5] outline-none transition-all text-sm leading-relaxed font-medium resize-none"
                    placeholder="Paste your questions and answers here..."
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 text-right mt-2">{manualText.length} characters</p>
                </div>
              )}

              {cameraOpen && (
                <div className="pcbt-camera-wrap dark:bg-gray-800/50">
                  <video ref={videoRef} autoPlay playsInline muted className="pcbt-camera-video" />
                  <div className="flex gap-4 mt-4">
                    <button onClick={() => { setCameraOpen(false); if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop()); }} className="pcbt-btn-secondary dark:bg-gray-700 dark:text-gray-300 flex-1">Cancel</button>
                    <button onClick={handleCapture} className="pcbt-btn-primary flex-1">Capture Text</button>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-[11px] font-black text-gray-800 dark:text-gray-100 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <FiFileText /> {inputMode === 'upload' ? 'File Tips' : 'Manual Tips'}
                </p>
                <ul className="text-[11px] text-gray-700 dark:text-gray-300 space-y-1 font-medium list-disc pl-4">
                  {inputMode === 'upload' ? (
                    <>
                      <li><strong>PDF/Word:</strong> Best for large question banks</li>
                      <li><strong>Images:</strong> Ensure photos are clear and brightly lit</li>
                    </>
                  ) : (
                    <>
                      <li>Paste text exactly as it appears in the material</li>
                      <li>Mixed formats are supported (MCQ + Theory)</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Options Side */}
            <div className="flex flex-col justify-between">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-[#E8EAED] dark:border-gray-700 shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Question Type</label>
                    <select value={questionType} onChange={(e) => setQuestionType(e.target.value as QuestionType)} className="w-full p-3 rounded-xl border border-[#E8EAED] dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm outline-none text-gray-900 dark:text-white">
                      <option value="objective">Objective Only</option>
                      <option value="theory">Theory Only</option>
                      <option value="mixed">Mixed (Recommended)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Quantity</label>
                    <select value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} className="w-full p-3 rounded-xl border border-[#E8EAED] dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm outline-none text-gray-900 dark:text-white">
                      <option value="all">All Questions</option>
                      <option value="10">10 Questions</option>
                      <option value="20">20 Questions</option>
                      <option value="50">50 Questions</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Time Limit</label>
                  <select value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className="w-full p-3 rounded-xl border border-[#E8EAED] dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm outline-none text-gray-900 dark:text-white">
                    <option value="0">Unlimited Time</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                </div>

                <button 
                  onClick={handleStartPractice}
                  disabled={generating || extracting || (!extractedText && !manualText)}
                  className="w-full py-4 bg-[#5B4CF5] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-[#5B4CF5]/20"
                >
                  {generating || extracting ? (
                    <><FiLoader className="animate-spin" /> Processing...</>
                  ) : (
                    <><FiPlay /> Start Practice</>
                  )}
                </button>
              </div>

              {error && <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-3 text-sm font-medium"><FiAlertTriangle /> {error}</div>}
              {success && <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl border border-green-100 dark:border-green-800 flex items-center gap-3 text-sm font-medium"><FiCheckCircle /> {success}</div>}
            </div>
          </div>
        </div>
      )}

      {stage === 'practice' && currentQ && (
        <div className="w-full max-w-5xl mx-auto px-4 py-6">
          {/* Practice Header */}
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#F7F8FA]/90 dark:bg-[#0F172A]/90 backdrop-blur-md py-4 z-10 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <button onClick={handleQuit} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition bg-white/10 rounded-xl" title="Quit Practice">
                <FiXCircle size={18} /> Quit
              </button>
              <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700" />
              <div>
                <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">{subject}</h4>
                <p className="text-[10px] text-[#64748B] dark:text-gray-400 uppercase font-black tracking-widest">Question {currentIdx + 1} of {practiceQuestions.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {Number(timeLimit) > 0 && (
                <div className={`px-4 py-2 rounded-full font-mono font-bold text-sm border shadow-sm ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white dark:bg-gray-800 border-[#E8EAED] dark:border-gray-700 text-[#0F172A] dark:text-white'}`}>
                  <FiClock className="inline mr-2" /> {formatTime(timeLeft)}
                </div>
              )}
              <button 
                onClick={async () => {
                  if (answeredCount < practiceQuestions.length) {
                    const ok = await confirmToast(`You haven't answered ${practiceQuestions.length - answeredCount} questions. Submit anyway?`, { title: 'Submit Practice', confirmText: 'Submit' })
                    if (!ok) return
                  }
                  void handleSubmit()
                }}
                className="px-6 py-2 bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] rounded-full text-sm font-bold shadow-lg hover:opacity-90"
              >
                Submit
              </button>
            </div>
          </div>

          {/* Pagination Navigation */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm sticky top-24 z-20">
            {practiceQuestions.map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-8 h-8 rounded-lg font-black text-[10px] transition-all border-2 ${
                  i === currentIdx 
                    ? 'bg-[#5B4CF5] text-white border-[#5B4CF5] scale-110 shadow-lg shadow-[#5B4CF5]/40' 
                    : answers[i] 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : flagged.has(i)
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-[#5B4CF5]/50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-white/10 shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#5B4CF5]" />
            <div className="flex justify-between items-start mb-8">
              <div className="flex flex-col gap-1">
                <span className="px-3 py-1 bg-[#5B4CF5]/20 text-[#7C70FF] text-[10px] font-black uppercase tracking-wider rounded-full w-fit">
                  {currentQ.type === 'theory' ? 'Theory / Essay' : 'Multiple Choice'}
                </span>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Question {currentIdx + 1} of {practiceQuestions.length}</p>
              </div>
              <button onClick={toggleFlag} className={`px-4 py-2 rounded-xl text-xs flex items-center gap-2 font-bold transition-all ${flagged.has(currentIdx) ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
                <FiFlag /> {flagged.has(currentIdx) ? 'Flagged' : 'Flag'}
              </button>
            </div>

            <div className="text-2xl md:text-3xl font-black text-white mb-12 leading-tight">
              {currentQ.question}
            </div>

            {currentQ.type === 'objective' && currentQ.options ? (
              <div className="grid grid-cols-1 gap-4">
                {OPTION_KEYS.map(key => {
                  if (!currentQ.options![key]) return null
                  const isSelected = answers[currentIdx] === key
                  return (
                    <button 
                      key={key} 
                      onClick={() => setAnswers(prev => ({ ...prev, [currentIdx]: key }))}
                      className={`flex items-center gap-6 p-6 rounded-3xl border-2 transition-all text-left group relative overflow-hidden ${isSelected ? 'border-[#5B4CF5] bg-[#5B4CF5]/10 text-white shadow-xl shadow-[#5B4CF5]/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
                    >
                      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 transition-all ${isSelected ? 'bg-[#5B4CF5] text-white rotate-12' : 'bg-white/10 text-gray-500 group-hover:text-gray-300'}`}>
                        {key}
                      </span>
                      <span className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{currentQ.options![key]}</span>
                    </button>
                  )
                })}
              </div>

            ) : (
              <textarea 
                className="w-full min-h-[250px] p-6 rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 text-[#0F172A] dark:text-white focus:border-[#5B4CF5] outline-none transition-all font-medium leading-relaxed"
                placeholder="Type your response here..."
                value={answers[currentIdx] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [currentIdx]: e.target.value }))}
              />
            )}
          </div>

          <div className="flex justify-between items-center gap-6">
            <button 
              onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-20 hover:bg-white/10 transition-all shadow-lg"
            >
              Prev
            </button>
            
            <button 
              onClick={() => {
                if (currentIdx === practiceQuestions.length - 1) void handleSubmit()
                else setCurrentIdx(i => Math.min(practiceQuestions.length - 1, i + 1))
              }}
              className="flex-1 py-4 px-6 rounded-2xl bg-[#5B4CF5] text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-[#5B4CF5]/20"
            >
              {currentIdx === practiceQuestions.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {stage === 'results' && (
        <div className="w-full max-w-4xl mx-auto px-4 py-12 animate-in zoom-in-95">
          {/* Result Hero */}
          <div className="result-hero">
            <div className="result-score-container">
              <svg className="result-score-svg" viewBox="0 0 100 100">
                <circle className="result-score-bg" cx="50" cy="50" r="44" />
                <circle 
                  className="result-score-fill" 
                  cx="50" 
                  cy="50" 
                  r="44" 
                  style={{ 
                    strokeDasharray: '276.46', 
                    strokeDashoffset: `${276.46 * (1 - score.pct / 100)}` 
                  }}
                />
              </svg>
              <div className="result-score-text">
                <span className="result-score-pct">{score.pct}%</span>
                <span className="result-score-label">Score</span>
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              {score.pct >= 90 ? 'Absolute Mastery! 🏆' : 
               score.pct >= 70 ? 'Incredible Performance! 🔥' : 
               score.pct >= 50 ? 'Well Done! 👍' : 
               'Keep Practicing! 📚'}
            </h2>
            <p className="text-white/80 font-medium text-lg">
              You correctly answered {score.correct} out of {score.total} objective questions.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value text-emerald-400">{score.pct}%</span>
              <span className="stat-label">Accuracy</span>
            </div>
            <div className="stat-card">
              <span className="stat-value text-blue-400">{score.correct}</span>
              <span className="stat-label">Correct</span>
            </div>
            <div className="stat-card">
              <span className="stat-value text-red-400">{score.total - score.correct}</span>
              <span className="stat-label">Wrong</span>
            </div>
            <div className="stat-card">
              <span className="stat-value text-orange-400">{formatTime(Number(timeLimit) * 60 - timeLeft)}</span>
              <span className="stat-label">Time Taken</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons mb-16">
            <button onClick={() => setStage('setup')} className="action-btn primary">
              <FiFileText /> New Document
            </button>
            <button onClick={() => { setAnswers({}); setCurrentIdx(0); setQuizSubmitted(false); setStage('practice'); setTimeLeft(Number(timeLimit) > 0 ? Number(timeLimit) * 60 : 0); }} className="action-btn secondary">
              <FiPlay /> Try Again
            </button>
          </div>

          {/* Review Section */}
          <div className="review-section">
            <h3 className="review-section-title text-white">Question Review</h3>
            {practiceQuestions.map((q, i) => {
              const userAns = String(answers[i] || '').trim().toUpperCase()
              const correctAns = String(q.answer || '').trim().toUpperCase()
              const isCorrect = q.type === 'objective' ? userAns === correctAns : false
              const isSkipped = !userAns
              const status = isSkipped ? 'skipped' : (isCorrect ? 'correct' : 'incorrect')
              
              return (
                <div key={i} className={`question-review-card ${status} animate-in slide-in-from-bottom-4`} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Question {i + 1}</span>
                    <div className={`status-badge ${status}`}>
                      {status === 'correct' && <FiCheckCircle />}
                      {status === 'incorrect' && <FiXCircle />}
                      {status === 'skipped' && <FiAlertTriangle />}
                      {status}
                    </div>
                  </div>
                  
                  <p className="text-xl md:text-2xl font-bold text-white mb-8 leading-tight">{q.question}</p>
                  
                  {q.type === 'objective' && q.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {OPTION_KEYS.map(key => {
                        if (!q.options![key]) return null
                        const isUserChoice = userAns === key
                        const isCorrectAnswer = correctAns === key
                        
                        return (
                          <div 
                            key={key} 
                            className={`option-review-item ${isCorrectAnswer ? 'is-correct' : ''} ${isUserChoice ? 'is-user-choice' : ''}`}
                          >
                            <div className="option-letter-box">{key}</div>
                            <span className="font-bold">{q.options![key]}</span>
                            {isCorrectAnswer && <FiCheckCircle className="ml-auto text-emerald-500" />}
                            {isUserChoice && !isCorrectAnswer && <FiXCircle className="ml-auto text-red-500" />}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {q.type === 'theory' && (
                    <div className="mt-6 space-y-4">
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Your Answer</label>
                        <p className="text-white font-medium">{answers[i] || 'No answer provided'}</p>
                      </div>
                      <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                        <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Model Answer</label>
                        <p className="text-emerald-400 font-bold">{q.answer || 'Not available'}</p>
                      </div>
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-8 p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2 text-blue-400">
                        <Sparkles size={14} />
                        <label className="text-[10px] font-black uppercase tracking-widest">AI Insight</label>
                      </div>
                      <p className="text-blue-100/80 text-sm leading-relaxed italic">"{q.explanation}"</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
