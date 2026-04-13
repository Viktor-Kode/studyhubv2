'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { FiFileText, FiX, FiUpload, FiCheckCircle, FiXCircle, FiClock, FiLoader, FiCode, FiAlertTriangle, FiRefreshCw, FiFile, FiEdit3, FiSave, FiList, FiLink, FiCamera, FiTrash2 } from 'react-icons/fi'
import { BiBrain, BiMessageRoundedDots } from 'react-icons/bi'
import { HiOutlineLightBulb } from 'react-icons/hi'
import {
  generateQuiz,
  Question,
  generateStudyNotes,
  saveStudyNote,
  chatWithTutor,
  getTutorChatHistory,
  getTutorChatSession,
  saveTutorChatSession,
  deleteTutorChatSession,
  TutorChatMessage,
  TutorChatSessionPreview,
} from '@/lib/api/quizApi'
import { cbtApi } from '@/lib/api/cbt'
import { extractTextFromFile } from '@/lib/utils/fileExtractor'
import { toast } from 'react-hot-toast'
import { useUpgrade } from '@/context/UpgradeContext'

interface QuestionBankProps {
  className?: string
}

type InputMode = 'upload' | 'manual' | 'link'

const QGEN_STORAGE_KEY = 'qgen_session_v1'
const QGEN_SESSION_EXPIRY_HOURS = 24
const TUTOR_SAVE_DEBOUNCE_MS = 1500

function isUpgradeError(msg: string): boolean {
  const m = (msg || '').toLowerCase()
  return m.includes('upgrade') || m.includes('ai limit') || m.includes('limit reached')
}

function getExtractionLabel(file: File): string {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    return 'Scanning image with OCR...'
  }
  if (ext === '.pdf') return 'Extracting PDF pages...'
  if (ext === '.docx') return 'Reading Word document...'
  if (ext === '.ppt' || ext === '.pptx') return 'Extracting presentation text...'
  if (ext === '.txt' || ext === '.md') return 'Reading text file...'
  return 'Reading document...'
}

function MarkdownText({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={className}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}

export default function QuestionBank({ className = '' }: QuestionBankProps) {
  const { showUpgrade } = useUpgrade()

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
  const [linkUrl, setLinkUrl] = useState('')
  const [fetchingLink, setFetchingLink] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetchedTitle, setFetchedTitle] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraPreviewUrl, setCameraPreviewUrl] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<File | null>(null)
  const [imageExtracting, setImageExtracting] = useState(false)
  const [extractionHint, setExtractionHint] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  // Quiz Interaction State
  const [newQuestions, setNewQuestions] = useState<Question[]>([])
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({})
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, boolean>>({})
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<'quiz' | 'notes' | 'tutor'>('quiz')
  const [generatedNotes, setGeneratedNotes] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [generatingNotes, setGeneratingNotes] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  // AI Tutor State
  const [chatMessages, setChatMessages] = useState<TutorChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatting, setIsChatting] = useState(false)
  const [tutorSessionId, setTutorSessionId] = useState<string | null>(null)
  const [tutorSessions, setTutorSessions] = useState<TutorChatSessionPreview[]>([])
  const [loadingTutorHistory, setLoadingTutorHistory] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const tutorSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Saved quiz session state
  const [hasSession, setHasSession] = useState(false)
  const [showResumeBanner, setShowResumeBanner] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  // Explanation State
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({})
  const [isExplaining, setIsExplaining] = useState<string | null>(null)

  // Fuzzy Answer Matching Helper
  const getLevenshteinDistance = (a: string, b: string) => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const compareAnswers = (userAnsw: any, correctAnsw: any) => {
    if (userAnsw === undefined || userAnsw === null || correctAnsw === undefined || correctAnsw === null) return false;

    // String normalization helper
    const normalize = (s: any) =>
      String(s)
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // Remove punctuation
        .replace(/\b(a|an|the|is|are|was|were|some|many)\b/g, "") // Remove common filler words
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim();

    const u = normalize(userAnsw);
    const c = normalize(correctAnsw);

    // 1. Exact match after normalization
    if (u === c) return true;

    // 2. Numeric comparison (direct or string-based)
    if (typeof userAnsw === 'number' && typeof correctAnsw === 'number' && userAnsw === correctAnsw) return true;
    if (u && c && !isNaN(Number(u)) && !isNaN(Number(c)) && Number(u) === Number(c)) return true;

    // 3. Fuzzy matching for longer text answers (Blank Questions)
    // Only apply for strings with at least 3 characters
    if (u.length >= 3 && c.length >= 3) {
      const distance = getLevenshteinDistance(u, c);

      // Define threshold: approx 20-25% of the correct answer's length
      // For short words (3-5), only 1 mistake. For longer words, maybe 2 or 3.
      let threshold = 1;
      if (c.length > 5) threshold = 2;
      if (c.length > 10) threshold = 3;

      if (distance <= threshold) return true;

      // Handle cases where the user answer is contained within or contains the correct answer
      if (u.length > 4 && (c.includes(u) || u.includes(c))) return true;
    }

    return false;
  };

  // Handle Query Params and sessionStorage (from "Practice with Quiz" in My Study Notes)
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    const sourceParam = searchParams.get('source')
    const textParam = searchParams.get('text')

    if ((sourceParam === 'notes' || sourceParam === 'library') && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(QGEN_STORAGE_KEY)
      } catch {
        // ignore
      }
      setHasSession(false)
      setShowResumeBanner(false)
    }

    if (tabParam === 'notes') setActiveTab('notes')
    if (tabParam === 'quiz') setActiveTab('quiz')

    // Prefer sessionStorage from Practice with Quiz (avoids URI length/decode issues)
    if ((sourceParam === 'notes' || sourceParam === 'library') && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('quiz_source_content')
        if (stored) {
          setManualText(stored)
          setInputMode('manual')
          sessionStorage.removeItem('quiz_source_content')
          sessionStorage.removeItem('quiz_source_title')
        }
      } catch {
        // ignore
      }
      return
    }

    // Fallback: text in URL (shorter notes only)
    if (textParam) {
      try {
        setManualText(decodeURIComponent(textParam))
        setInputMode('manual')
      } catch {
        // URI malformed — ignore to prevent crash
      }
    }
  }, [searchParams])

  // Load saved quiz session on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(QGEN_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        newQuestions?: Question[]
        userAnswers?: Record<string, any>
        checkedAnswers?: Record<string, boolean>
        score?: number
        quizSubmitted?: boolean
        amount?: number
        questionType?: string
        inputMode?: InputMode
        manualText?: string
        extractedText?: string
        activeTab?: 'quiz' | 'notes' | 'tutor'
        savedAt?: string
      }

      if (!parsed.savedAt) {
        return
      }

      const savedAt = new Date(parsed.savedAt)
      const hoursSince = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60)
      if (hoursSince > QGEN_SESSION_EXPIRY_HOURS) {
        localStorage.removeItem(QGEN_STORAGE_KEY)
        return
      }

      if (parsed.newQuestions && parsed.newQuestions.length > 0) {
        setNewQuestions(parsed.newQuestions)
        setUserAnswers(parsed.userAnswers || {})
        setCheckedAnswers(parsed.checkedAnswers || {})
        setScore(parsed.score || 0)
        setQuizSubmitted(!!parsed.quizSubmitted)
        if (typeof parsed.amount === 'number') setAmount(parsed.amount)
        if (parsed.questionType) setQuestionType(parsed.questionType)
        if (parsed.inputMode) setInputMode(parsed.inputMode)
        if (typeof parsed.manualText === 'string') setManualText(parsed.manualText)
        if (typeof parsed.extractedText === 'string') setExtractedText(parsed.extractedText)
        if (parsed.activeTab) setActiveTab(parsed.activeTab)

        setHasSession(true)
        setShowResumeBanner(true)
        setLastSavedAt(parsed.savedAt)
      }
    } catch {
      // ignore parse/storage errors
    }
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
      if (cameraPreviewUrl) URL.revokeObjectURL(cameraPreviewUrl)
    }
  }, [cameraPreviewUrl])

  const handleOpenCamera = async () => {
    setError(null)
    setSuccess(null)
    setWarning(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      cameraStreamRef.current = stream
      setCameraOpen(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play()
        }
      })
    } catch (err: any) {
      setError(err?.message || 'Unable to open camera. Please allow camera access and try again.')
    }
  }

  const handleCloseCamera = () => {
    stopCamera()
    setCameraOpen(false)
  }

  const handleCaptureFromCamera = async () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
    )
    if (!blob) {
      setError('Could not capture image. Please try again.')
      return
    }

    const imageFile = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
    if (cameraPreviewUrl) URL.revokeObjectURL(cameraPreviewUrl)
    setCameraPreviewUrl(URL.createObjectURL(imageFile))
    setCapturedImage(imageFile)
    setUploadedFile(imageFile)
    stopCamera()
    setCameraOpen(false)
  }

  const extractTextFromImage = async () => {
    if (!capturedImage) return
    setImageExtracting(true)
    setExtractionHint('Scanning photo with OCR...')
    setError(null)
    setSuccess(null)

    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng')
      const result = await worker.recognize(capturedImage)
      await worker.terminate()

      const recognizedText = result?.data?.text?.trim() || ''
      if (recognizedText.length < 50) {
        setError('Text in captured image is too short/unclear. Try retaking in better lighting.')
        return
      }

      setExtractedText(recognizedText)
      setSuccess('Text extracted from camera image successfully!')
    } catch (err: any) {
      setError(err?.message || 'Failed to read text from image. Please upload a document instead.')
    } finally {
      setImageExtracting(false)
      setExtractionHint('')
    }
  }

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (activeTab === 'tutor') scrollToBottom()
  }, [chatMessages, activeTab])

  const loadTutorHistory = async (loadLatestSession = false) => {
    setLoadingTutorHistory(true)
    try {
      const data = await getTutorChatHistory()
      if (data.success) {
        const sessions = data.sessions || []
        setTutorSessions(sessions)
        if (loadLatestSession && sessions.length > 0) {
          await handleLoadTutorSession(sessions[0].sessionId)
        }
      }
    } catch {
      // non-blocking for quiz flow
    } finally {
      setLoadingTutorHistory(false)
    }
  }

  const handleLoadTutorSession = async (sid: string) => {
    try {
      const data = await getTutorChatSession(sid)
      if (!data.success) return
      setTutorSessionId(data.session.sessionId)
      setChatMessages(data.session.messages || [])
      setActiveTab('tutor')
    } catch {
      // ignore load failure
    }
  }

  const persistTutorChat = async () => {
    if (!chatMessages.length) return
    try {
      const payload = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp || new Date().toISOString(),
      }))
      const result = await saveTutorChatSession(tutorSessionId, payload, '')
      if (result?.sessionId && !tutorSessionId) {
        setTutorSessionId(result.sessionId)
      }
      await loadTutorHistory(false)
    } catch {
      // ignore save failure in UI
    }
  }

  const handleStartNewTutorChat = async () => {
    if (chatMessages.length > 0) {
      await persistTutorChat()
    }
    setTutorSessionId(null)
    setChatMessages([])
    setChatInput('')
  }

  const handleDeleteTutorSession = async (sid: string) => {
    try {
      await deleteTutorChatSession(sid)
      setTutorSessions((prev) => prev.filter((s) => s.sessionId !== sid))
      if (sid === tutorSessionId) {
        setTutorSessionId(null)
        setChatMessages([])
      }
    } catch {
      // ignore delete failure
    }
  }

  useEffect(() => {
    if (activeTab !== 'tutor') return
    if (tutorSessions.length > 0 || loadingTutorHistory) return
    void loadTutorHistory(true)
  }, [activeTab, tutorSessions.length, loadingTutorHistory])

  useEffect(() => {
    if (!chatMessages.length) return
    if (tutorSaveTimerRef.current) clearTimeout(tutorSaveTimerRef.current)
    tutorSaveTimerRef.current = setTimeout(() => {
      void persistTutorChat()
    }, TUTOR_SAVE_DEBOUNCE_MS)
    return () => {
      if (tutorSaveTimerRef.current) clearTimeout(tutorSaveTimerRef.current)
    }
  }, [chatMessages, tutorSessionId])

  // Auto-save quiz session to localStorage whenever key state changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!newQuestions.length) return
    try {
      const payload = {
        newQuestions,
        userAnswers,
        checkedAnswers,
        score,
        quizSubmitted,
        amount,
        questionType,
        inputMode,
        manualText,
        extractedText,
        activeTab,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(QGEN_STORAGE_KEY, JSON.stringify(payload))
      setHasSession(true)
      setLastSavedAt(payload.savedAt)
    } catch {
      // storage full or unavailable — ignore
    }
  }, [
    newQuestions,
    userAnswers,
    checkedAnswers,
    score,
    quizSubmitted,
    amount,
    questionType,
    inputMode,
    manualText,
    extractedText,
    activeTab,
  ])

  const handleSubmitQuiz = async () => {
    if (newQuestions.length === 0) return
    if (quizSubmitted) return

    const allChecked = newQuestions.length === Object.keys(checkedAnswers).length
    if (!allChecked) {
      if (!confirm('You haven\'t verified all answers yet. Submit anyway?')) return
    }

    try {
      setSubmitting(true)

      // Recalculate score to be sure it matches current states
      let finalScore = 0
      const processedAnswers = newQuestions.map(q => {
        const userAnswer = userAnswers[q._id]
        const correctAnswer = q.answer !== undefined ? q.answer : (q as any).correctAnswer

        const isCorrect = compareAnswers(userAnswer, correctAnswer);

        if (isCorrect) finalScore++

        return {
          questionId: q._id,
          question: q.content || (q as any).question,
          selectedAnswer: typeof userAnswer === 'number'
            ? q.options[userAnswer]
            : (userAnswer || 'Skipped'),
          correctAnswer: typeof correctAnswer === 'number'
            ? q.options[Number(correctAnswer)]
            : correctAnswer,
          explanation: q.knowledgeDeepDive || (q as any).knowledge_deep_dive || (q as any).explanation ||
            (q as any).modelAnswer || (q as any).solution || (q as any).explanationText ||
            (q as any).reason || (q as any).solution || (q as any).discussion ||
            "No deep-dive available.",
          isCorrect: isCorrect
        }
      })

      const accuracy = Math.round((finalScore / newQuestions.length) * 100)

      const resultsData = {
        subject: newQuestions[0].subject || 'AI Generated Quiz',
        examType: 'AI_STUDY',
        totalQuestions: newQuestions.length,
        correctAnswers: finalScore,
        wrongAnswers: newQuestions.length - finalScore,
        accuracy: accuracy,
        answers: processedAnswers
      }

      await cbtApi.saveResult(resultsData)
      setScore(finalScore)
      setQuizSubmitted(true)
      toast.success('Quiz results saved to dashboard!')
      setSuccess('Quiz results successfully recorded in your progress analytics!')
    } catch (err: any) {
      console.error('Failed to save quiz results:', err)
      setError('Failed to save quiz results to your dashboard.')
      toast.error('Failed to save quiz results.')
    } finally {
      setSubmitting(false)
    }
  }

  const clearSavedSession = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(QGEN_STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  const handleStartNewSession = () => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Start a new session? Your current questions and progress will be cleared.')
    ) {
      return
    }
    clearSavedSession()
    setNewQuestions([])
    setUserAnswers({})
    setCheckedAnswers({})
    setScore(0)
    setQuizSubmitted(false)
    setActiveTab('quiz')
    setHasSession(false)
    setShowResumeBanner(false)
    setLastSavedAt(null)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  const handleFileUpload = async (file: File) => {
    setError(null)
    setSuccess(null)
    setWarning(null)

    // Validate file type
    const allowedTypes = ['.pdf', '.docx', '.txt', '.md', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.webp']
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(extension)) {
      setError('Unsupported format. Use PDF, DOCX, PPT, PPTX, TXT, MD, JPG, JPEG, PNG, or WEBP.')
      return
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (Max 5MB).')
      return
    }

    setUploadedFile(file)
    setExtracting(true)
    setExtractionHint(getExtractionLabel(file))
    setError(null)

    try {
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
        const { createWorker } = await import('tesseract.js')
        const worker = await createWorker('eng')
        const result = await worker.recognize(file)
        await worker.terminate()

        const recognizedText = result?.data?.text?.trim() || ''
        if (recognizedText.length < 50) {
          setError('Text in uploaded image is too short/unclear. Try a clearer image with better lighting.')
          setUploadedFile(null)
          return
        }

        setExtractedText(recognizedText)
        setSuccess('Image text extracted successfully!')
        return
      }

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
      setExtractionHint('')
    }
  }

  const handleFetchUrl = async () => {
    const url = linkUrl.trim()
    if (!url) return

    setFetchingLink(true)
    setFetchError(null)
    setSuccess(null)
    setWarning(null)

    try {
      // Use backend API client so we always hit the Node API, not the Next.js app
      const response = await import('@/lib/api/client').then(m => m.apiClient.post('/ai/fetch-url', { url }))

      const data = response.data
      const text: string = data.text
      const title: string = data.title || url

      setFetchedTitle(title)
      setManualText(text || '')
      setExtractedText('')
      setFetchError(null)
      setSuccess('Link content fetched successfully! You can now generate questions or notes.')
    } catch (err: any) {
      const rawMessage =
        err?.response?.data?.error ||
        err?.message ||
        'Could not fetch that link. Try copying the text manually instead.'

      let message = rawMessage
      if (url.includes('docs.google.com')) {
        message =
          'Google Docs links need to be published first. Go to File → Share → Publish to web, then paste the published link.'
      } else if (url.includes('drive.google.com')) {
        message =
          'Google Drive links are not publicly accessible. Try copying the document text and pasting it manually.'
      }

      setFetchError(message)
    } finally {
      setFetchingLink(false)
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
      const msg = err.message || ''
      if (isUpgradeError(msg)) {
        showUpgrade('ai')
        return
      }
      setError(msg || 'Failed to generate quiz')
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
      const msg = err.message || ''
      if (isUpgradeError(msg)) {
        showUpgrade('ai')
        return
      }
      setError(msg || 'Failed to generate study notes')
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
    const outgoingMsg: TutorChatMessage = {
      role: 'user',
      content: userMsg,
      timestamp: new Date().toISOString(),
    }
    setChatMessages(prev => [...prev, outgoingMsg])
    setIsChatting(true)
    setError(null)

    try {
      const context = inputMode === 'upload' ? extractedText : manualText
      const historyForModel = chatMessages.map((msg) => ({ role: msg.role, content: msg.content }))
      const response = await chatWithTutor(userMsg, context, historyForModel)
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.reply, timestamp: new Date().toISOString() }])
    } catch (err: any) {
      const msg = err.message || ''
      if (isUpgradeError(msg)) {
        showUpgrade('ai')
        return
      }
      setError(msg || 'Tutor failed to respond. Please try again.')
    } finally {
      setIsChatting(false)
    }
  }

  // compareAnswers is now defined at the top scope with fuzzy matching logic

  const checkAnswer = (questionId: string, correctAnswer: any) => {
    if (checkedAnswers[questionId]) return;
    const userAnswer = userAnswers[questionId]
    if (userAnswer === undefined || userAnswer === '') return;

    setCheckedAnswers(prev => ({ ...prev, [questionId]: true }))

    const isCorrect = compareAnswers(userAnswer, correctAnswer);

    if (isCorrect) setScore(prev => prev + 1)
  }

  const handleGetAiExplanation = async (q: Question) => {
    if (aiExplanations[q._id] || isExplaining === q._id) return

    setIsExplaining(q._id)
    try {
      const qText = q.content || (q as any).question || '';
      const correctAnsText = typeof (q.answer !== undefined ? q.answer : (q as any).correctAnswer) === 'number'
        ? q.options[Number(q.answer !== undefined ? q.answer : (q as any).correctAnswer)]
        : String(q.answer !== undefined ? q.answer : (q as any).correctAnswer);

      const explanation = await cbtApi.getExplanation(qText, correctAnsText, q.options || [])
      setAiExplanations(prev => ({ ...prev, [q._id]: explanation }))
    } catch (err: any) {
      const msg = err?.message || ''
      if (isUpgradeError(msg)) {
        showUpgrade('ai')
        return
      }
      console.error('Failed to get AI explanation:', err)
      toast.error('Failed to generate explanation.')
    } finally {
      setIsExplaining(null)
    }
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
          {hasSession && !showResumeBanner && newQuestions.length > 0 && (
            <button
              type="button"
              className="start-new-btn hidden md:inline-flex"
              onClick={handleStartNewSession}
            >
              + Start New Session
            </button>
          )}
          <Link
            href="/dashboard/question-history"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition font-bold shadow-sm"
          >
            <FiClock className="text-blue-500" />
            History
          </Link>
        </div>

        {showResumeBanner && hasSession && newQuestions.length > 0 && (
          <div className="resume-banner">
            <div className="resume-banner-left">
              <div className="resume-icon">⚡</div>
              <div>
                <span className="resume-title">You have a saved quiz session</span>
                <span className="resume-sub">
                  {newQuestions.length} questions
                  {lastSavedAt && ` • Saved ${getTimeAgo(lastSavedAt)}`}
                </span>
              </div>
            </div>
            <div className="resume-actions">
              <button
                type="button"
                className="resume-continue-btn"
                onClick={() => {
                  setShowResumeBanner(false)
                  setActiveTab('quiz')
                }}
              >
                Continue →
              </button>
              <button
                type="button"
                className="resume-discard-btn"
                onClick={handleStartNewSession}
              >
                Start New
              </button>
            </div>
          </div>
        )}

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

            {/* Source Tabs: Paste Text / Paste Link / Upload PDF */}
            <div className="qg-source-tabs">
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className={`qg-source-tab ${inputMode === 'manual' ? 'active' : ''}`}
              >
                <span>✏️</span>
                <span>Paste Text</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('link')}
                className={`qg-source-tab ${inputMode === 'link' ? 'active' : ''}`}
              >
                <span>🔗</span>
                <span>Paste Link</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`qg-source-tab ${inputMode === 'upload' ? 'active' : ''}`}
              >
                <span>📄</span>
                <span>Upload PDF</span>
              </button>
            </div>

            {/* UPLOAD PDF MODE */}
            {inputMode === 'upload' && (
              <>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                  >
                    <FiCamera /> Use Camera
                  </button>
                </div>
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
                    accept=".pdf,.docx,.txt,.md,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
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
                        <p className="text-xs text-gray-500">PDF, Word, PPT, Notes, or Images (Max 5MB)</p>
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
                      {extracting || imageExtracting ? (
                        <div className="flex items-center justify-center gap-2 py-4">
                          <FiLoader className="animate-spin text-blue-500 shrink-0" />
                          <span className="text-xs font-bold text-blue-500 uppercase tracking-widest text-center leading-snug">
                            {extractionHint || 'Reading document...'}
                          </span>
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

                {cameraOpen && (
                  <div className="mt-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/40">
                    <video ref={videoRef} className="w-full rounded-lg bg-black" autoPlay playsInline muted />
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-200 hover:bg-gray-300" onClick={handleCloseCamera}>
                        Cancel
                      </button>
                      <button type="button" className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={handleCaptureFromCamera}>
                        Capture
                      </button>
                    </div>
                  </div>
                )}

                {cameraPreviewUrl && !cameraOpen && (
                  <div className="mt-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/40">
                    <img src={cameraPreviewUrl} alt="Captured preview" className="w-full rounded-lg object-cover max-h-64" />
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-200 hover:bg-gray-300" onClick={handleOpenCamera}>
                        Retake
                      </button>
                      <button type="button" className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={extractTextFromImage}>
                        Use Photo
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* PASTE LINK MODE */}
            {inputMode === 'link' && (
              <div className="space-y-3">
                <div className="qg-url-input-row">
                  <input
                    type="url"
                    placeholder="Paste a link e.g. https://en.wikipedia.org/wiki/Photosynthesis"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="qg-url-input"
                  />
                  <button
                    type="button"
                    onClick={handleFetchUrl}
                    disabled={fetchingLink || !linkUrl.trim()}
                    className="qg-fetch-btn"
                  >
                    {fetchingLink ? (
                      <>
                        <FiLoader size={15} className="animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <FiLink size={15} />
                        Fetch Content
                      </>
                    )}
                  </button>
                </div>

                {fetchedTitle && manualText && (
                  <div className="qg-url-preview">
                    <div className="qg-url-preview-icon">🌐</div>
                    <div className="min-w-0 flex-1">
                      <p className="qg-url-preview-title" title={fetchedTitle}>
                        {fetchedTitle}
                      </p>
                      <p className="qg-url-preview-chars">
                        {manualText.length} characters extracted
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFetchedTitle(null)
                        setManualText('')
                      }}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {fetchError && (
                  <div className="qg-fetch-error">
                    {fetchError}
                  </div>
                )}
              </div>
            )}

            {/* MANUAL TEXT MODE */}
            {inputMode === 'manual' && (
              <div className="min-h-[250px] flex flex-col">
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="flex-1 w-full p-4 text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-400 transition-all font-medium resize-none text-gray-900 dark:text-gray-100"
                  placeholder="Paste your study notes, sections of a book, or lecture transcripts here..."
                />
                <p className="text-xs text-gray-400 text-right mt-2">
                  {manualText.length} characters
                </p>
              </div>
            )}

            {/* Tips based on mode */}
            <div className="p-4 bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-[11px] font-black text-gray-800 dark:text-gray-100 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <FiFileText /> {inputMode === 'upload' ? 'File Format Tips' : 'Manual Input Tips'}
              </p>
              <ul className="text-[11px] text-gray-700 dark:text-gray-300 space-y-1 font-medium list-disc pl-4">
                {inputMode === 'upload' ? (
                  <>
                    <li><strong>PDF:</strong> Use text-based PDFs (not scanned)</li>
                    <li><strong>Word/DOCX:</strong> Highly reliable, recommended</li>
                    <li><strong>PPT/PPTX:</strong> Presentations supported</li>
                    <li><strong>TXT/MD:</strong> Fastest processing</li>
                    <li><strong>Camera:</strong> Capture a clear photo and tap Use Photo to extract text</li>
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
                    className="w-full px-3 py-2 border border-blue-200 dark:border-gray-700 rounded-xl bg-blue-50/30 dark:bg-gray-900/50 text-sm outline-none font-medium text-gray-900 dark:text-gray-100"
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
                      className="w-full px-3 py-2 border border-blue-200 dark:border-gray-700 rounded-xl bg-blue-50/30 dark:bg-gray-900/50 text-base outline-none font-bold text-gray-900 dark:text-gray-100"
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
              <div className="flex flex-col h-[75vh] min-h-[500px] md:h-[600px] border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900/20">
                <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 md:p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Tutor Conversations</p>
                    <button
                      type="button"
                      onClick={() => void handleStartNewTutorChat()}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                    >
                      + New Chat
                    </button>
                  </div>
                  <div className="max-h-32 md:max-h-40 overflow-y-auto space-y-2">
                    {loadingTutorHistory ? (
                      <p className="text-xs text-gray-400">Loading chats...</p>
                    ) : tutorSessions.length === 0 ? (
                      <p className="text-xs text-gray-400">No previous chats yet.</p>
                    ) : (
                      tutorSessions.map((session) => (
                        <button
                          key={session.sessionId}
                          type="button"
                          onClick={() => void handleLoadTutorSession(session.sessionId)}
                          className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs transition
                            ${session.sessionId === tutorSessionId ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200' : 'bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'}`}
                        >
                          <span className="truncate">{session.title || 'New Chat'}</span>
                          <span
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              void handleDeleteTutorSession(session.sessionId)
                            }}
                            className="p-1.5 rounded hover:bg-red-50 hover:text-red-500"
                            title="Delete chat"
                          >
                            <FiTrash2 size={14} />
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <BiMessageRoundedDots className="text-3xl text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-sm font-bold text-gray-700 dark:text-white">Ask your AI Tutor anything!</p>
                      <p className="text-xs text-gray-500 max-w-[220px]">Start a new chat or open a previous one. Your tutor chats are now saved automatically.</p>
                      {(!extractedText && inputMode === 'upload') && (
                        <p className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg mt-2">
                          Please upload a file first for context!
                        </p>
                      )}
                    </div>
                  )}

                  {chatMessages.map((msg, i) => (
                    <div key={`${msg.role}-${i}`} className={`flex w-full min-w-0 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] sm:max-w-[85%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm whitespace-pre-wrap text-wrap break-words min-w-0
                        ${msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'}`}
                        style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
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

                <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base outline-none focus:border-purple-400 transition-all text-gray-900 dark:text-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={isChatting || !chatInput.trim()}
                    className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center"
                  >
                    <FiCheckCircle size={20} />
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
                    className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-base outline-none focus:border-emerald-500 transition-all font-bold"
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
            <MarkdownText
              content={generatedNotes}
              className="prose dark:prose-invert max-w-none text-sm leading-relaxed font-medium text-gray-700 dark:text-gray-300"
            />
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
                    <MarkdownText
                      content={q.content || (q as any).question || ''}
                      className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-100 font-bold leading-snug"
                    />

                    <div className="grid gap-2">
                      {q.options && q.options.length > 0 ? (
                        q.options.map((opt, oIdx) => (
                          <label key={oIdx} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer
                            ${userAnswers[q._id] === oIdx ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-gray-50 dark:border-gray-700 hover:border-blue-200 hover:bg-gray-50/50 dark:hover:bg-gray-700'}
                            ${checkedAnswers[q._id] && compareAnswers(oIdx, q.answer !== undefined ? q.answer : (q as any).correctAnswer) ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/20' : ''}
                            ${checkedAnswers[q._id] && userAnswers[q._id] === oIdx && !compareAnswers(oIdx, q.answer !== undefined ? q.answer : (q as any).correctAnswer) ? 'border-red-400 bg-red-50/50 dark:bg-red-900/10' : ''}
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
                            <MarkdownText
                              content={opt}
                              className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 font-medium"
                            />
                            {checkedAnswers[q._id] && compareAnswers(oIdx, q.answer !== undefined ? q.answer : (q as any).correctAnswer) && <FiCheckCircle className="ml-auto text-emerald-500 animate-bounce" />}
                            {checkedAnswers[q._id] && userAnswers[q._id] === oIdx && !compareAnswers(oIdx, q.answer !== undefined ? q.answer : (q as any).correctAnswer) && <FiXCircle className="ml-auto text-red-400" />}
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
                      <button onClick={() => checkAnswer(q._id, q.answer !== undefined ? q.answer : (q as any).correctAnswer)} disabled={userAnswers[q._id] === undefined || userAnswers[q._id] === ''}
                        className="w-full sm:w-auto px-8 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-30 transition-all hover:bg-blue-600 active:scale-95"
                      >Verify Concept</button>
                    ) : (
                      <div className="mt-4 p-5 bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-2xl animate-in slide-in-from-top-2 duration-300 shadow-inner">
                        <div className="flex items-center gap-2 mb-3 text-sm font-black uppercase tracking-tighter">
                          {compareAnswers(userAnswers[q._id], q.answer !== undefined ? q.answer : (q as any).correctAnswer) ? (
                            <span className="text-emerald-500 flex items-center gap-1.5"><FiCheckCircle /> Drill Complete</span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1.5"><FiXCircle /> Misconception Identified:
                              <span className="text-blue-600 dark:text-blue-200 ml-1">
                                {typeof (q.answer !== undefined ? q.answer : (q as any).correctAnswer) === 'number'
                                  ? q.options?.[q.answer !== undefined ? Number(q.answer) : Number((q as any).correctAnswer)]
                                  : (q.answer !== undefined ? q.answer : (q as any).correctAnswer)}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest pl-1">📚 KNOWLEDGE DEEP-DIVE</p>
                          {(q.knowledgeDeepDive && q.knowledgeDeepDive !== 'No deep-dive available.') || aiExplanations[q._id] ? (
                            <MarkdownText
                              content={aiExplanations[q._id] || q.knowledgeDeepDive || (q as any).knowledge_deep_dive || (q as any).explanation || (q as any).modelAnswer || (q as any).solution || (q as any).reason || 'No deep-dive available.'}
                              className="prose prose-sm dark:prose-invert max-w-none text-blue-900 dark:text-blue-200 leading-relaxed font-medium italic"
                            />
                          ) : (
                            <button
                              onClick={() => handleGetAiExplanation(q)}
                              disabled={isExplaining === q._id}
                              className="mt-2 flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition py-2 px-3 bg-blue-50 dark:bg-blue-900/40 rounded-lg border border-blue-100 dark:border-blue-800"
                            >
                              {isExplaining === q._id ? (
                                <><FiLoader className="animate-spin" /> Generating Explanation...</>
                              ) : (
                                <><HiOutlineLightBulb className="text-sm" /> Generate AI Deep-Dive Explanation</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!quizSubmitted && newQuestions.length > 0 && (
            <div className="mt-8 flex justify-center pb-12">
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
              >
                {submitting ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Recording Progress...
                  </>
                ) : (
                  <>
                    <FiSave />
                    Finish & Sync to Dashboard
                  </>
                )}
              </button>
            </div>
          )}

          {quizSubmitted && (
            <div className="mt-8 mb-12 p-8 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500 rounded-3xl text-center space-y-4 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-4xl shadow-lg shadow-emerald-500/30">
                <FiCheckCircle />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white">Results Synced!</h3>
              <p className="text-gray-600 dark:text-gray-400">Your score of {score}/{newQuestions.length} ({Math.round((score / newQuestions.length) * 100)}%) has been recorded in your performance analytics.</p>
              <div className="flex justify-center gap-4 pt-4">
                <Link href="/dashboard/student" className="px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold text-sm">Return to Dashboard</Link>
                <button
                  onClick={() => {
                    setNewQuestions([])
                    setQuizSubmitted(false)
                    setScore(0)
                    setUserAnswers({})
                    setCheckedAnswers({})
                  }}
                  className="px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm shadow-sm"
                >New Session</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const getTimeAgo = (date: string | null) => {
  if (!date) return ''
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

