'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCheckCircle, FiClock, FiFlag, FiLoader, FiXCircle } from 'react-icons/fi'
import { Sparkles, FileQuestion } from 'lucide-react'
import { getFirebaseToken } from '@/lib/store/authStore'
import { cbtApi } from '@/lib/api/cbt'
import { jsPDF } from 'jspdf'

import './PdfCbt.css'

type Stage = 'upload' | 'preview' | 'test' | 'results'
type OptionKey = 'A' | 'B' | 'C' | 'D'
type QuestionType = 'objective' | 'theory'

interface PdfQuestion {
  type: QuestionType
  question: string
  options: Record<OptionKey, string> | null
  answer: string
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
  const [customQuestionCount, setCustomQuestionCount] = useState('40')
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
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [savingResult, setSavingResult] = useState(false)
  const [resultSaved, setResultSaved] = useState(false)

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
      void handleSubmit()
      return
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [stage, timeLimit, timeLeft])

  const answeredCount = useMemo(
    () => Object.values(answers).filter((val) => String(val || '').trim().length > 0).length,
    [answers]
  )

  const score = useMemo(() => {
    const objectiveQuestions = questionsToUse.filter((q) => q.type === 'objective' && q.options)
    const total = objectiveQuestions.length
    const correct = questionsToUse.filter((q, i) => q.type === 'objective' && answers[i] === q.answer).length
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
    const selectedCount =
      numQuestions === 'custom' ? Number(customQuestionCount || 0) : Number(numQuestions || 0)
    const count = numQuestions === 'all' ? questions.length : Math.min(selectedCount, questions.length)
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
      const selectedCount =
        numQuestions === 'custom' ? Number(customQuestionCount || 0) : Number(numQuestions || 0)
      const requestedCount = numQuestions === 'all' ? 60 : Math.max(1, Math.min(selectedCount || 1, 100))
      formData.append('requestedCount', String(requestedCount))
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
        type: String(q.type || '').toLowerCase() === 'theory' ? 'theory' : 'objective',
        question: String(q.question || ''),
        options: q?.options
          ? {
              A: String(q.options?.A || ''),
              B: String(q.options?.B || ''),
              C: String(q.options?.C || ''),
              D: String(q.options?.D || '')
            }
          : null,
        answer: String(q.answer || '')
      }))
      const cleanQuestions = normalizedQuestions.filter((q) => {
        if (!q.question) return false
        if (q.type === 'objective') return Boolean(q.options && OPTION_KEYS.every((k) => q.options?.[k]))
        return true
      })

      if (!cleanQuestions.length) {
        throw new Error('No usable questions were extracted from this PDF.')
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
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to extract questions.'
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to extract questions.')
    } finally {
      setExtracting(false)
    }
  }

  const startTest = () => {
    setAnswers({})
    setFlagged(new Set())
    setCurrentQ(0)
    setResultSaved(false)
    setTimeLeft(Number(timeLimit) > 0 ? Number(timeLimit) * 60 : 0)
    setStage('test')
  }

  const handleSubmit = async () => {
    if (savingResult || resultSaved) {
      setStage('results')
      return
    }

    setSavingResult(true)
    try {
      const objectiveQuestions = questionsToUse.filter((q) => q.type === 'objective' && q.options)
      const correct = questionsToUse.filter((q, i) => q.type === 'objective' && answers[i] === q.answer).length
      const total = objectiveQuestions.length
      const wrong = Math.max(total - correct, 0)
      const skipped = questionsToUse.reduce((acc, _q, i) => {
        const val = String(answers[i] || '').trim()
        return val ? acc : acc + 1
      }, 0)
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
      const selectedTime = Number(timeLimit)
      const computedTimeTaken =
        selectedTime > 0 ? Math.max(selectedTime * 60 - Math.max(timeLeft, 0), 0) : undefined

      await cbtApi.saveResult({
        subject: extractedData?.subject || 'General',
        examType: 'PDF_CBT',
        year: String(new Date().getFullYear()),
        totalQuestions: total || questionsToUse.length,
        correctAnswers: correct,
        wrongAnswers: wrong,
        skipped,
        accuracy,
        timeTaken: computedTimeTaken,
        answers: questionsToUse.map((q, i) => ({
          questionId: String(i + 1),
          question: q.question,
          selectedAnswer: String(answers[i] || '').trim(),
          correctAnswer: String(q.answer || ''),
          explanation: q.type === 'theory' ? 'Theory question' : undefined,
          isCorrect: q.type === 'objective' ? answers[i] === q.answer : undefined
        }))
      })
      setResultSaved(true)
    } catch (e) {
      console.error('Failed to save PDF CBT result:', e)
    } finally {
      setSavingResult(false)
      setStage('results')
    }
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
            <p>Upload any past question PDF with answers and practice all extracted question types.</p>
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
                    <option value="40">40 questions</option>
                    <option value="50">50 questions</option>
                    <option value="custom">Custom</option>
                  </select>
                  {numQuestions === 'custom' && (
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={customQuestionCount}
                      onChange={(e) => setCustomQuestionCount(e.target.value)}
                      placeholder="Enter question count"
                    />
                  )}
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
              <div className="pcbt-step"><span>2</span><p>AI extracts objective and theory questions</p></div>
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
                  {q.type === 'objective' && q.options ? (
                    <div className="pcbt-preview-options">
                      {Object.entries(q.options).map(([key, val]) => (
                        <span key={key} className="pcbt-preview-option">{key}. {val}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="pcbt-preview-options">
                      <span className="pcbt-preview-option">Theory question</span>
                    </div>
                  )}
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
                  void handleSubmit()
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

            {currentQuestion.type === 'objective' && currentQuestion.options ? (
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
            ) : (
              <div className="options-list">
                <textarea
                  value={answers[currentQ] || ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ]: e.target.value }))}
                  placeholder="Type your answer here..."
                  className="w-full min-h-[120px] rounded-xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            )}
          </div>

          <div className="cbt-nav-buttons">
            <button onClick={() => setCurrentQ((i) => Math.max(i - 1, 0))} disabled={currentQ === 0} className="nav-prev disabled:opacity-40">Previous</button>
            <button
              onClick={() => {
                if (currentQ === questionsToUse.length - 1) void handleSubmit()
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
            {score.total === 0 && <p>No objective questions to auto-grade in this set.</p>}

            <div className="pcbt-review">
              {questionsToUse.map((q, i) => {
                const userAnswer = answers[i]
                const isCorrect = q.type === 'objective' ? userAnswer === q.answer : false
                return (
                  <div key={i} className={`pcbt-review-item ${isCorrect ? 'correct' : 'wrong'}`}>
                    <div className="pcbt-review-header">
                      {q.type === 'objective' ? (
                        <>
                          {isCorrect ? <FiCheckCircle color="#10B981" /> : <FiXCircle color="#EF4444" />}
                          <span>
                            {isCorrect
                              ? `Q${i + 1}: Correct`
                              : `Q${i + 1}: Wrong — Answer: ${q.answer}. ${q.options?.[q.answer as OptionKey] || ''}`}
                          </span>
                        </>
                      ) : (
                        <>
                          <FiCheckCircle color="#3B82F6" />
                          <span>Q{i + 1}: Theory response recorded</span>
                        </>
                      )}
                    </div>
                    <p className="pcbt-review-question">{q.question}</p>
                    {q.type === 'objective' && !isCorrect && (
                      <div className="pcbt-review-options">
                        {OPTION_KEYS.map((key) => (
                          <span key={key} className={`pcbt-review-option ${key === q.answer ? 'correct' : key === userAnswer ? 'wrong' : ''}`}>
                            {key}. {q.options?.[key] || ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {q.type === 'theory' && (
                      <div className="pcbt-review-options">
                        <span className="pcbt-review-option"><strong>Your answer:</strong> {userAnswer || 'No answer provided'}</span>
                        <span className="pcbt-review-option"><strong>Model answer:</strong> {q.answer || 'No model answer provided'}</span>
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
                  setResultSaved(false)
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
                  setResultSaved(false)
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
