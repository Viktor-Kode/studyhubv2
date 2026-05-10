'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  FiFileText, FiX, FiUpload, FiCheckCircle, FiXCircle, 
  FiClock, FiLoader, FiCamera, FiRefreshCw, FiAlertTriangle,
  FiFlag, FiChevronLeft, FiChevronRight, FiPlay
} from 'react-icons/fi'
import { Sparkles, FileQuestion } from 'lucide-react'
import { getFirebaseToken } from '@/lib/store/authStore'
import { cbtApi } from '@/lib/api/cbt'
import { toast } from 'react-hot-toast'
import { confirmToast } from '@/lib/utils/confirm'
import { extractTextFromFile } from '@/lib/utils/extraction'

import './PdfCbt.css'

// Types
type InputMode = 'upload' | 'manual'
type Stage = 'setup' | 'practice' | 'results'
type OptionKey = 'A' | 'B' | 'C' | 'D'

interface Question {
  type: 'objective' | 'theory'
  question: string
  options: Record<OptionKey, string> | null
  answer: string
  explanation?: string
}

interface ExtractedData {
  subject: string
  questions: Question[]
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

const shuffleArray = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)

export default function PdfCbtPage() {
  // Input State
  const [inputMode, setInputMode] = useState<InputMode>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [manualText, setManualText] = useState('')
  
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
  const [capturedImage, setCapturedImage] = useState<File | null>(null)
  const [imageExtracting, setImageExtracting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  // Config State
  const [numQuestions, setNumQuestions] = useState('all')
  const [timeLimit, setTimeLimit] = useState('0')
  const [shuffle, setShuffle] = useState(true)

  // Practice State
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
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
      if (text && text.trim().length > 0) {
        setExtractedText(text)
        setSuccess('Document ready! Click "Start Practice" to begin.')
      } else {
        throw new Error('Could not read this file. Try a text-based PDF or paste your text directly.')
      }
    } catch (err: any) {
      setError(err?.message || 'Could not read this file. Try a text-based PDF or paste your text directly.')
      setUploadedFile(null)
    } finally {
      setExtracting(false)
      setExtractionHint('')
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
    
    setImageExtracting(true)
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
      setImageExtracting(false)
      setExtractionHint('')
    }
  }

  const handleStartPractice = async () => {
    const text = inputMode === 'manual' ? manualText : extractedText
    if (!text || text.trim().length === 0) {
      setError('Please provide some content first.')
      return
    }

    setGenerating(true)
    setError(null)
    try {
      const token = await getFirebaseToken()
      const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const generateUrl = publicApiUrl ? `${publicApiUrl.replace(/\/+$/, '')}/pdf-cbt/generate` : '/api/backend/pdf-cbt/generate'

      const resp = await fetch(generateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ text })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Failed to extract questions.')

      const questions: Question[] = (data.questions || []).map((q: any) => ({
        type: String(q.type || '').toLowerCase() === 'theory' ? 'theory' : 'objective',
        question: q.question || '',
        options: q.options || null,
        answer: q.answer || '',
        explanation: q.explanation || q.knowledgeDeepDive || ''
      })).filter((q: Question) => q.question)

      if (questions.length === 0) throw new Error('No questions found in this document.')

      setAllQuestions(questions)
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
    <div className="pcbt-page">
      {stage === 'setup' && (
        <div className="max-w-3xl mx-auto py-8 px-4">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-[#0F172A] mb-2">Document to CBT</h1>
            <p className="text-[#64748B]">Extract questions from any PDF, Word, or Image and practice immediately.</p>
          </div>

          <div className="qg-source-tabs mb-6">
            <button className={`qg-source-tab ${inputMode === 'upload' ? 'active' : ''}`} onClick={() => setInputMode('upload')}>
              <FiUpload /> Upload File
            </button>
            <button className={`qg-source-tab ${inputMode === 'manual' ? 'active' : ''}`} onClick={() => setInputMode('manual')}>
              <FiFileText /> Paste Text
            </button>
          </div>

          {inputMode === 'upload' ? (
            <div className="mb-8">
              <div 
                className={`pcbt-dropzone cursor-pointer ${uploadedFile ? 'has-file' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="pcbt-drop-icon">{uploadedFile ? '✅' : '📄'}</div>
                <h3>{uploadedFile ? uploadedFile.name : 'Click or Drop File'}</h3>
                <p>{uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(1)} MB` : 'PDF, Word, PPT, Image'}</p>
                <input ref={fileInputRef} type="file" hidden onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
              </div>
              <div className="mt-4 flex justify-center">
                <button onClick={handleOpenCamera} className="pcbt-btn-secondary flex items-center gap-2">
                  <FiCamera /> Scan with Camera
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <textarea 
                className="w-full min-h-[250px] p-5 rounded-2xl border-2 border-[#E8EAED] focus:border-[#5B4CF5] outline-none transition-all text-sm leading-relaxed"
                placeholder="Paste your questions and answers here..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
            </div>
          )}

          {cameraOpen && (
            <div className="pcbt-camera-wrap mb-8">
              <video ref={videoRef} autoPlay playsInline muted className="pcbt-camera-video" />
              <div className="flex gap-4 mt-4">
                <button onClick={() => { setCameraOpen(false); if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach(t => t.stop()); }} className="pcbt-btn-secondary flex-1">Cancel</button>
                <button onClick={handleCapture} className="pcbt-btn-primary flex-1">Capture Text</button>
              </div>
            </div>
          )}

          {(extractedText || manualText) && (
            <div className="bg-white p-6 rounded-3xl border border-[#E8EAED] shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Practice Count</label>
                  <select value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} className="w-full p-3 rounded-xl border border-[#E8EAED] outline-none">
                    <option value="all">All Questions</option>
                    <option value="10">10 Questions</option>
                    <option value="20">20 Questions</option>
                    <option value="50">50 Questions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Time Limit</label>
                  <select value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className="w-full p-3 rounded-xl border border-[#E8EAED] outline-none">
                    <option value="0">Unlimited Time</option>
                    <option value="15">15 Minutes</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">1 Hour</option>
                  </select>
                </div>
              </div>
              
              <button 
                onClick={handleStartPractice}
                disabled={generating || extracting || imageExtracting}
                className="w-full py-4 bg-[#5B4CF5] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {generating || extracting || imageExtracting ? (
                  <><FiLoader className="animate-spin" /> {extractionHint || 'Processing...'}</>
                ) : (
                  <><FiPlay /> Start Practice</>
                )}
              </button>
            </div>
          )}

          {error && <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3 text-sm font-medium"><FiAlertTriangle /> {error}</div>}
          {success && <div className="mt-6 p-4 bg-green-50 text-green-600 rounded-xl border border-green-100 flex items-center gap-3 text-sm font-medium"><FiCheckCircle /> {success}</div>}
        </div>
      )}

      {stage === 'practice' && currentQ && (
        <div className="w-full max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#F7F8FA]/80 backdrop-blur-md py-4 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#E8EAED] shadow-sm font-bold text-[#5B4CF5]">
                {currentIdx + 1}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">{subject}</h4>
                <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-widest">Question {currentIdx + 1} of {practiceQuestions.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {Number(timeLimit) > 0 && (
                <div className={`px-4 py-2 rounded-full font-mono font-bold text-sm border shadow-sm ${timeLeft < 60 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-[#E8EAED] text-[#0F172A]'}`}>
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
                className="px-6 py-2 bg-[#0F172A] text-white rounded-full text-sm font-bold shadow-lg hover:opacity-90"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-[#E8EAED] shadow-sm mb-6">
            <div className="flex justify-between items-start mb-6">
              <span className="px-3 py-1 bg-[#EEF2FF] text-[#5B4CF5] text-[10px] font-bold uppercase tracking-wider rounded-md">
                {currentQ.type === 'theory' ? 'Theory' : 'Multiple Choice'}
              </span>
              <button onClick={toggleFlag} className={`text-xs flex items-center gap-2 font-bold ${flagged.has(currentIdx) ? 'text-orange-500' : 'text-[#94A3B8]'}`}>
                <FiFlag /> {flagged.has(currentIdx) ? 'Flagged' : 'Flag Question'}
              </button>
            </div>

            <div className="text-lg font-medium text-[#0F172A] mb-8 leading-relaxed">
              {currentQ.question}
            </div>

            {currentQ.type === 'objective' && currentQ.options ? (
              <div className="grid grid-cols-1 gap-3">
                {OPTION_KEYS.map(key => {
                  if (!currentQ.options![key]) return null
                  const isSelected = answers[currentIdx] === key
                  return (
                    <button 
                      key={key} 
                      onClick={() => setAnswers(prev => ({ ...prev, [currentIdx]: key }))}
                      className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${isSelected ? 'border-[#5B4CF5] bg-[#EEF2FF] text-[#5B4CF5]' : 'border-[#F1F5F9] hover:border-[#E2E8F0]'}`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-[#5B4CF5] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                        {key}
                      </span>
                      <span className="font-medium">{currentQ.options![key]}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <textarea 
                className="w-full min-h-[200px] p-5 rounded-2xl border-2 border-[#F1F5F9] focus:border-[#5B4CF5] outline-none transition-all"
                placeholder="Type your response here..."
                value={answers[currentIdx] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [currentIdx]: e.target.value }))}
              />
            )}
          </div>

          <div className="flex justify-between items-center">
            <button 
              onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="p-4 rounded-2xl bg-white border border-[#E8EAED] text-[#0F172A] disabled:opacity-20"
            >
              <FiChevronLeft size={24} />
            </button>
            
            <div className="flex gap-2">
              {practiceQuestions.length <= 10 ? (
                practiceQuestions.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentIdx ? 'w-6 bg-[#5B4CF5]' : 'bg-[#E8EAED]'}`} />
                ))
              ) : (
                <span className="text-xs font-bold text-[#64748B]">Page {currentIdx + 1} of {practiceQuestions.length}</span>
              )}
            </div>

            <button 
              onClick={() => {
                if (currentIdx === practiceQuestions.length - 1) void handleSubmit()
                else setCurrentIdx(i => Math.min(practiceQuestions.length - 1, i + 1))
              }}
              className="p-4 rounded-2xl bg-white border border-[#E8EAED] text-[#0F172A]"
            >
              <FiChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      {stage === 'results' && (
        <div className="pcbt-results max-w-4xl mx-auto px-4 py-12 animate-in zoom-in-95">
          <div className="bg-white rounded-[3rem] p-12 border border-[#E8EAED] shadow-2xl text-center mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#5B4CF5] to-[#7C70FF]" />
            
            <div className="w-32 h-32 rounded-full bg-[#EEF2FF] flex items-center justify-center mx-auto mb-6 text-4xl border-8 border-white shadow-inner">
              {score.pct >= 70 ? '🎉' : score.pct >= 50 ? '👍' : '📚'}
            </div>
            
            <h2 className="text-4xl font-black text-[#0F172A] mb-2">{score.pct}% Score</h2>
            <p className="text-[#64748B] mb-8 font-bold">You got {score.correct} out of {score.total} objective questions correct.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9]">
                <span className="block text-2xl font-black text-[#0F172A]">{score.correct}</span>
                <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Correct</label>
              </div>
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9]">
                <span className="block text-2xl font-black text-[#0F172A]">{score.total - score.correct}</span>
                <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Wrong</label>
              </div>
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9]">
                <span className="block text-2xl font-black text-[#0F172A]">{practiceQuestions.length - answeredCount}</span>
                <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Skipped</label>
              </div>
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9]">
                <span className="block text-2xl font-black text-[#0F172A]">{formatTime(Number(timeLimit) * 60 - timeLeft)}</span>
                <label className="text-[10px] font-bold text-[#94A3B8] uppercase">Time</label>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={() => setStage('setup')}
                className="px-8 py-4 bg-[#5B4CF5] text-white rounded-2xl font-bold hover:shadow-xl transition-all"
              >
                Try Another Document
              </button>
              <button 
                onClick={() => {
                  setAnswers({})
                  setCurrentIdx(0)
                  setQuizSubmitted(false)
                  setStage('practice')
                  setTimeLeft(Number(timeLimit) > 0 ? Number(timeLimit) * 60 : 0)
                }}
                className="px-8 py-4 bg-[#0F172A] text-white rounded-2xl font-bold hover:shadow-xl transition-all"
              >
                Re-practice Same
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-[#0F172A] px-2">Review Questions</h3>
            {practiceQuestions.map((q, i) => {
              const userAns = String(answers[i] || '').trim().toUpperCase()
              const correctAns = String(q.answer || '').trim().toUpperCase()
              const isCorrect = q.type === 'objective' ? userAns === correctAns : false
              const isSkipped = !userAns
              
              return (
                <div key={i} className={`bg-white p-8 rounded-[2rem] border-2 transition-all ${isSkipped ? 'border-[#F1F5F9]' : isCorrect ? 'border-green-100 shadow-sm shadow-green-50' : 'border-red-100 shadow-sm shadow-red-50'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-black text-[#0F172A]">Question {i + 1}</span>
                    <div className="flex items-center gap-2">
                      {isSkipped ? (
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">Skipped</span>
                      ) : isCorrect ? (
                        <span className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><FiCheckCircle /> Correct</span>
                      ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><FiXCircle /> Incorrect</span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-[#0F172A] mb-6 leading-relaxed font-medium">{q.question}</p>
                  
                  {q.type === 'objective' && q.options && (
                    <div className="space-y-2">
                      {OPTION_KEYS.map(key => {
                        if (!q.options![key]) return null
                        const isUserChoice = userAns === key
                        const isCorrectAnswer = correctAns === key
                        let style = 'bg-[#F8FAFC] text-[#64748B]'
                        if (isCorrectAnswer) style = 'bg-green-50 text-green-700 border border-green-200'
                        else if (isUserChoice) style = 'bg-red-50 text-red-700 border border-red-200'
                        
                        return (
                          <div key={key} className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${style}`}>
                            <span className="font-bold">{key}.</span>
                            {q.options![key]}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {q.type === 'theory' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#F1F5F9]">
                        <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">Your Answer</label>
                        <p className="text-sm text-[#0F172A]">{answers[i] || 'No answer provided'}</p>
                      </div>
                      <div className="p-4 bg-[#EEF2FF] rounded-xl border border-[#E0E7FF]">
                        <label className="block text-[10px] font-bold text-[#5B4CF5] uppercase tracking-wider mb-1">Model Answer</label>
                        <p className="text-sm text-[#5B4CF5]">{q.answer || 'Not available'}</p>
                      </div>
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-6 pt-6 border-t border-[#F1F5F9]">
                      <label className="block text-[10px] font-bold text-[#5B4CF5] uppercase tracking-wider mb-2">AI Explanation</label>
                      <p className="text-xs text-[#64748B] italic leading-relaxed">{q.explanation}</p>
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
