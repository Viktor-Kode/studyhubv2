'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCheckCircle, FiClock, FiFlag, FiLoader, FiXCircle } from 'react-icons/fi'
import { Sparkles, FileQuestion } from 'lucide-react'
import { getFirebaseToken } from '@/lib/store/authStore'
import jsPDF from 'jspdf'

import './PdfCbt.css'

type Stage = 'upload' | 'preview' | 'test' | 'results'
type OptionKey = 'A' | 'B' | 'C' | 'D'

interface PdfQuestion {
  question: string
  options: Record<OptionKey, string>
  answer: OptionKey
}

interface ExtractedData {
  subject: string
  totalFound: number
  questions: PdfQuestion[]
}

const STATUS_MESSAGES = [
  'Reading your PDF...',
  'Identifying questions...',
  'Stripping answers...',
  'Organising questions...',
  'Almost ready...'
]

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D']

const shuffleArray = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)

export default function PdfCbtPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null)

  const [stage, setStage] = useState<Stage>('upload')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [numQuestions, setNumQuestions] = useState('all')
  const [timeLimit, setTimeLimit] = useState('0')
  const [shuffle, setShuffle] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [extractStatus, setExtractStatus] = useState('')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [questionsToUse, setQuestionsToUse] = useState<PdfQuestion[]>([])

  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, OptionKey>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [flagged, setFlagged] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!extracting) return
    let i = 0
    setExtractStatus(STATUS_MESSAGES[0])
    const t = setInterval(() => {
      i = Math.min(i + 1, STATUS_MESSAGES.length - 1)
      setExtractStatus(STATUS_MESSAGES[i])
    }, 3000)
    return () => clearInterval(t)
  }, [extracting])

  useEffect(() => {
    if (stage !== 'test') return
    if (Number(timeLimit) <= 0) return
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [stage, timeLimit, timeLeft])

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  const score = useMemo(() => {
    const total = questionsToUse.length
    const correct = questionsToUse.filter((q, i) => answers[i] === q.answer).length
    const pct = total ? Math.round((correct / total) * 100) : 0
    return { total, correct, pct }
  }, [answers, questionsToUse])

  const currentQuestion = questionsToUse[currentQ]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    validateAndSetFile(selected)
  }

  const validateAndSetFile = (candidate: File) => {
    setError('')
    if (candidate.type !== 'application/pdf' && !candidate.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file.')
      return
    }
    if (candidate.size > 20 * 1024 * 1024) {
      setError('PDF exceeds 20MB limit.')
      return
    }
    if (candidate.size > 5 * 1024 * 1024) {
      setWarning('Large PDF detected. For best results, upload a PDF with 30 pages or less. We will extract from the most relevant sections.')
    } else {
      setWarning('')
    }
    setFile(candidate)
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop())
      setCameraStream(null)
    }
  }

  const openCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      setCameraStream(stream)
      setCameraOpen(true)
      requestAnimationFrame(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream
          void cameraVideoRef.current.play()
        }
      })
    } catch (err: any) {
      setError(err?.message || 'Could not access camera. Please allow permission.')
    }
  }

  const captureToPdf = async () => {
    const video = cameraVideoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

    const doc = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'pt',
      format: 'a4'
    })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.addImage(dataUrl, 'JPEG', 0, 0, pageWidth, pageHeight)
    const blob = doc.output('blob')
    const fileFromCamera = new File([blob], `camera-capture-${Date.now()}.pdf`, { type: 'application/pdf' })
    validateAndSetFile(fileFromCamera)
    setCameraOpen(false)
    stopCamera()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (!dropped) return
    validateAndSetFile(dropped)
  }

  const buildQuestionSet = (questions: PdfQuestion[]) => {
    const count = numQuestions === 'all' ? questions.length : Math.min(Number(numQuestions), questions.length)
    const base = shuffle ? shuffleArray(questions) : [...questions]
    return base.slice(0, count)
  }

  const handleExtract = async () => {
    if (!file) return
    setError('')
    setExtracting(true)
    try {
      const formData = new FormData()
      formData.append('pdf', file)
      const token = await getFirebaseToken()
      const response = await fetch('/api/backend/pdf-cbt/extract', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to extract questions.')
      }
      const normalizedQuestions: PdfQuestion[] = (data.questions || []).map((q: any) => ({
        question: String(q.question || ''),
        options: {
          A: String(q.options?.A || ''),
          B: String(q.options?.B || ''),
          C: String(q.options?.C || ''),
          D: String(q.options?.D || '')
        },
        answer: (String(q.answer || 'A').toUpperCase() as OptionKey)
      }))
      const cleanQuestions = normalizedQuestions.filter((q) => q.question && OPTION_KEYS.every((k) => q.options[k]))

      if (!cleanQuestions.length) {
        throw new Error('No usable multiple choice questions were extracted from this PDF.')
      }

      const prepared: ExtractedData = {
        subject: data.subject || 'General',
        totalFound: cleanQuestions.length,
        questions: cleanQuestions
      }

      setExtractedData(prepared)
      setQuestionsToUse(buildQuestionSet(prepared.questions))
      setStage('preview')
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to extract questions.')
    } finally {
      setExtracting(false)
    }
  }

  const startTest = () => {
    setAnswers({})
    setFlagged(new Set())
    setCurrentQ(0)
    setTimeLeft(Number(timeLimit) > 0 ? Number(timeLimit) * 60 : 0)
    setStage('test')
  }

  const handleSubmit = () => {
    setStage('results')
  }

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(currentQ)) next.delete(currentQ)
      else next.add(currentQ)
      return next
    })
  }

  return (
    <div className="pcbt-page">
      {stage === 'upload' && (
        <>
          <div className="pcbt-header">
            <h1>PDF to CBT</h1>
            <p>Upload any past question PDF with answers and practice without seeing answers first.</p>
          </div>

          <div
            className={`pcbt-dropzone ${dragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="pcbt-drop-icon">📄</div>
            <h3>Drop your PDF here</h3>
            <p>or click to browse</p>
            <span className="pcbt-drop-limit">PDF only · Max 20MB</span>
            <input ref={fileInputRef} type="file" accept=".pdf" hidden onChange={handleFileSelect} />
          </div>
          <div className="pcbt-camera-row">
            <button type="button" className="pcbt-btn-secondary" onClick={openCamera}>
              Use Camera
            </button>
          </div>
          {warning && <div className="pcbt-warning">⚠️ {warning}</div>}

          {cameraOpen && (
            <div className="pcbt-camera-wrap">
              <video ref={cameraVideoRef} autoPlay playsInline muted className="pcbt-camera-video" />
              <div className="pcbt-results-actions">
                <button className="pcbt-btn-secondary" onClick={() => { setCameraOpen(false); stopCamera() }}>Cancel</button>
                <button className="pcbt-btn-primary" onClick={captureToPdf}>Capture</button>
              </div>
            </div>
          )}

          {file && (
            <div className="pcbt-settings">
              <div className="pcbt-file-info">
                <span>📄 {file.name}</span>
                <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                <button onClick={() => setFile(null)}>✕ Remove</button>
              </div>

              <div className="pcbt-options">
                <div className="pcbt-option-group">
                  <label>Number of questions to practice</label>
                  <select value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)}>
                    <option value="all">All extracted questions</option>
                    <option value="10">10 questions</option>
                    <option value="20">20 questions</option>
                    <option value="30">30 questions</option>
                  </select>
                </div>
                <div className="pcbt-option-group">
                  <label>Time limit</label>
                  <select value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)}>
                    <option value="0">No timer</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                  </select>
                </div>
                <div className="pcbt-option-group">
                  <label>Shuffle questions?</label>
                  <div className="pcbt-toggle">
                    <button className={shuffle ? 'active' : ''} onClick={() => setShuffle(true)}>Yes</button>
                    <button className={!shuffle ? 'active' : ''} onClick={() => setShuffle(false)}>No</button>
                  </div>
                </div>
              </div>

              <button className="pcbt-extract-btn" onClick={handleExtract} disabled={extracting}>
                {extracting ? <><FiLoader className="pcbt-spin" /> Extracting questions...</> : <><Sparkles size={16} /> Extract Questions & Start</>}
              </button>

              {extracting && (
                <div className="pcbt-extracting-status">
                  <p>{extractStatus}</p>
                </div>
              )}

              {error && <div className="pcbt-error">{error}</div>}
            </div>
          )}

          <div className="pcbt-how-it-works">
            <h4>How it works</h4>
            <div className="pcbt-steps">
              <div className="pcbt-step"><span>1</span><p>Upload your PDF with questions and answers</p></div>
              <div className="pcbt-step"><span>2</span><p>AI extracts only objective questions</p></div>
              <div className="pcbt-step"><span>3</span><p>Answers stay hidden while you practice</p></div>
              <div className="pcbt-step"><span>4</span><p>Submit to see score and corrections</p></div>
            </div>
          </div>
        </>
      )}

      {stage === 'preview' && extractedData && (
        <div className="pcbt-preview">
          <div className="pcbt-preview-card">
            <div className="pcbt-preview-icon">✅</div>
            <h2>Questions Extracted!</h2>
            <p>Subject detected: <strong>{extractedData.subject}</strong></p>

            <div className="pcbt-preview-stats">
              <div><span>{extractedData.totalFound}</span><label>Questions found</label></div>
              <div><span>{questionsToUse.length}</span><label>You&apos;ll practice</label></div>
              <div><span>{Number(timeLimit) > 0 ? `${timeLimit}m` : '∞'}</span><label>Time limit</label></div>
            </div>

            <div className="pcbt-preview-questions">
              <p className="pcbt-preview-label">Preview (first 3 questions):</p>
              {questionsToUse.slice(0, 3).map((q, i) => (
                <div key={i} className="pcbt-preview-q">
                  <p><strong>Q{i + 1}:</strong> {q.question}</p>
                  <div className="pcbt-preview-options">
                    {Object.entries(q.options).map(([key, val]) => (
                      <span key={key} className="pcbt-preview-option">{key}. {val}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pcbt-preview-actions">
              <button className="pcbt-btn-secondary" onClick={() => setStage('upload')}>← Re-upload</button>
              <button className="pcbt-btn-primary" onClick={startTest}>Start Practice →</button>
            </div>
          </div>
        </div>
      )}

      {stage === 'test' && currentQuestion && (
        <div className="w-full">
          <div className="cbt-header">
            <div className="cbt-subject"><FileQuestion size={14} className="inline mr-1" /> PDF Practice</div>
            <div className="flex items-center gap-3">
              {Number(timeLimit) > 0 && (
                <div className="cbt-timer">
                  <FiClock className="inline-block mr-1" /> {formatTime(timeLeft)}
                </div>
              )}
              <button
                onClick={() => {
                  const remaining = questionsToUse.length - answeredCount
                  if (remaining > 0 && !window.confirm(`You have ${remaining} unanswered question(s). Submit anyway?`)) return
                  handleSubmit()
                }}
                className="nav-submit"
              >
                Submit
              </button>
            </div>
          </div>

          <div className="mt-2 mb-2 flex items-center justify-between text-xs text-gray-500">
            <span>Question {currentQ + 1} of {questionsToUse.length}</span>
            <span>Answered {answeredCount}/{questionsToUse.length}</span>
          </div>

          <div className="question-navigator mb-3">
            {questionsToUse.map((_, idx) => {
              const isAnswered = answers[idx] !== undefined
              const isFlagged = flagged.has(idx)
              const isCurrent = idx === currentQ
              let stateClass = ''
              if (isCurrent) stateClass = 'current'
              else if (isFlagged) stateClass = 'skipped'
              else if (isAnswered) stateClass = 'answered'
              return (
                <button key={idx} onClick={() => setCurrentQ(idx)} className={`nav-btn ${stateClass}`}>
                  {idx + 1}
                </button>
              )
            })}
          </div>

          <div className="question-card">
            <div className="flex items-start justify-between mb-2">
              <p className="question-number">Question {currentQ + 1}</p>
              <button onClick={toggleFlag} className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center gap-1">
                <FiFlag /> {flagged.has(currentQ) ? 'Flagged' : 'Flag'}
              </button>
            </div>

            <div className="question-text">{currentQuestion.question}</div>

            <div className="options-list">
              {OPTION_KEYS.map((key) => {
                const isSelected = answers[currentQ] === key
                return (
                  <button
                    key={key}
                    onClick={() => setAnswers((prev) => ({ ...prev, [currentQ]: key }))}
                    className={`option-btn ${isSelected ? 'selected' : ''}`}
                  >
                    <span className="option-letter">{key}.</span>
                    <span>{currentQuestion.options[key]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="cbt-nav-buttons">
            <button onClick={() => setCurrentQ((i) => Math.max(i - 1, 0))} disabled={currentQ === 0} className="nav-prev disabled:opacity-40">Previous</button>
            <button
              onClick={() => {
                if (currentQ === questionsToUse.length - 1) handleSubmit()
                else setCurrentQ((i) => Math.min(i + 1, questionsToUse.length - 1))
              }}
              className="nav-next"
            >
              {currentQ === questionsToUse.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      )}

      {stage === 'results' && extractedData && (
        <div className="pcbt-results">
          <div className="pcbt-results-card">
            <div className="pcbt-score-circle" style={{ ['--pct' as string]: score.pct }}>
              <span className="pcbt-score-num">{score.pct}%</span>
              <span className="pcbt-score-label">{score.correct}/{score.total}</span>
            </div>

            <h2>{score.pct >= 70 ? 'Great job!' : score.pct >= 50 ? 'Good effort!' : 'Keep studying!'}</h2>
            <p>{extractedData.subject} · PDF Practice</p>

            <div className="pcbt-review">
              {questionsToUse.map((q, i) => {
                const userAnswer = answers[i]
                const isCorrect = userAnswer === q.answer
                return (
                  <div key={i} className={`pcbt-review-item ${isCorrect ? 'correct' : 'wrong'}`}>
                    <div className="pcbt-review-header">
                      {isCorrect ? <FiCheckCircle color="#10B981" /> : <FiXCircle color="#EF4444" />}
                      <span>{isCorrect ? `Q${i + 1}: Correct` : `Q${i + 1}: Wrong — Answer: ${q.answer}. ${q.options[q.answer]}`}</span>
                    </div>
                    <p className="pcbt-review-question">{q.question}</p>
                    {!isCorrect && (
                      <div className="pcbt-review-options">
                        {OPTION_KEYS.map((key) => (
                          <span key={key} className={`pcbt-review-option ${key === q.answer ? 'correct' : key === userAnswer ? 'wrong' : ''}`}>
                            {key}. {q.options[key]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="pcbt-results-actions">
              <button
                className="pcbt-btn-secondary"
                onClick={() => {
                  setStage('upload')
                  setFile(null)
                  setWarning('')
                  setExtractedData(null)
                  setQuestionsToUse([])
                  setAnswers({})
                  setError('')
                }}
              >
                Upload Another PDF
              </button>
              <button
                className="pcbt-btn-primary"
                onClick={() => {
                  setAnswers({})
                  setCurrentQ(0)
                  setTimeLeft(Number(timeLimit) > 0 ? Number(timeLimit) * 60 : 0)
                  setStage('test')
                }}
              >
                Retry Same Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
