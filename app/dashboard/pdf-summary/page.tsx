'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import ProtectedRoute from '@/components/ProtectedRoute'
import { generateStudyNotes, saveStudyNote } from '@/lib/api/quizApi'
import { generateAIFlashCards, FlashCard } from '@/lib/api/flashcardApi'
import { extractTextFromFile } from '@/lib/utils/extraction'
import { useUpgrade } from '@/context/UpgradeContext'
import {
  FiUploadCloud, FiFileText, FiLoader, FiCheckCircle,
  FiSave, FiRefreshCw, FiX, FiEdit3,
  FiArrowRight, FiLayers, FiChevronLeft, FiChevronRight,
  FiRotateCw, FiEye, FiGrid, FiCheck, FiBookOpen, FiZap, FiLock
} from 'react-icons/fi'
import { BiBrain } from 'react-icons/bi'
import BlindSummaryModal from '@/components/dashboard/BlindSummaryModal'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getExtractionLabel(file: File): string {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'Scanning image with OCR...'
  if (ext === '.pdf') return 'Extracting PDF pages...'
  if (ext === '.docx') return 'Reading Word document...'
  if (ext === '.pptx' || ext === '.ppt') return 'Extracting presentation text...'
  return 'Reading document...'
}

function isUpgradeError(msg: string): boolean {
  const m = (msg || '').toLowerCase()
  return (
    m.includes('upgrade') || m.includes('ai limit') ||
    m.includes('limit reached') || m.includes('expired') || m.includes('renew')
  )
}

function extractFlashcardsFromMarkdown(markdownText: string, category: string): FlashCard[] {
  const cards: FlashCard[] = []
  if (!markdownText) return cards

  const boldTermRegex = /(?:^|\n)(?:\d+\.\s*|\*\s*|- \s*)?\*\*(.*?)\*\*\s*[:\-–]?\s*([^\n]+)/g
  let match
  while ((match = boldTermRegex.exec(markdownText)) !== null) {
    const front = match[1].trim().replace(/^#+\s*/, '')
    const back = match[2].trim()
    if (front.length >= 3 && back.length >= 5 && front.length < 150 && back.length < 500) {
      cards.push({
        userId: '',
        front: front,
        back: back,
        category: category || 'PDF Summary'
      })
    }
  }

  if (cards.length < 4) {
    const sections = markdownText.split(/(?=\n##+\s)/)
    for (const sec of sections) {
      const lines = sec.trim().split('\n').filter(Boolean)
      if (lines.length >= 2) {
        const title = lines[0].replace(/^#+\s*/, '').replace(/\*\*/g, '').trim()
        const content = lines.slice(1).join(' ').replace(/\*\*/g, '').trim()
        if (title.length > 3 && content.length > 10) {
          cards.push({
            userId: '',
            front: `What is ${title}?`,
            back: content.slice(0, 300),
            category: category || 'PDF Summary'
          })
        }
      }
    }
  }

  return cards.slice(0, 15)
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MarkdownNote({ content }: { content: string }) {
  return (
    <div style={{ width: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mt-8 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-6 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mt-4 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 mb-3">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-400 pl-4 py-1 my-3 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg text-sm italic text-gray-600 dark:text-gray-300">
              {children}
            </blockquote>
          ),
          code: ({ inline, children, ...props }: any) =>
            inline ? (
              <code className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto font-mono my-3">
                <code {...props}>{children}</code>
              </pre>
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type InputMode = 'upload' | 'manual'
type Stage = 'input' | 'generating' | 'result'
type ActiveTab = 'note' | 'flashcard'

export default function PDFSummaryPage() {
  const { showUpgrade } = useUpgrade()

  // Generator Options (Checkbox)
  const [includeFlashcards, setIncludeFlashcards] = useState(false)

  // Navigation tab state (in result)
  const [activeTab, setActiveTab] = useState<ActiveTab>('note')
  const [blindSummaryOpen, setBlindSummaryOpen] = useState(false)
  const [blindSummaryDismissed, setBlindSummaryDismissed] = useState(false)

  // Input state
  const [inputMode, setInputMode] = useState<InputMode>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [manualText, setManualText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractionLabel, setExtractionLabel] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Generation state
  const [stage, setStage] = useState<Stage>('input')
  const [generatedNotes, setGeneratedNotes] = useState('')
  const [flashcards, setFlashcards] = useState<FlashCard[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Flashcards UI state
  const [cardIndex, setCardIndex] = useState(0)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [cardsViewMode, setCardsViewMode] = useState<'flip' | 'grid'>('flip')

  // Loading UX state
  const [elapsedSecs, setElapsedSecs] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortRef = useRef(false)

  // Save note state
  const [noteTitle, setNoteTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── File Upload & Extraction ────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    const MAX_MB = 50
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`File too large. Maximum is ${MAX_MB}MB.`)
      return
    }
    setUploadedFile(file)
    setExtractedText('')
    setError(null)
    setExtractionLabel(getExtractionLabel(file))
    setExtracting(true)
    try {
      const text = await extractTextFromFile(file)
      if (!text || text.trim().length < 30) {
        setError('Could not extract readable text from this file. Please try a different file or paste text manually.')
        setUploadedFile(null)
      } else {
        setExtractedText(text)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to read file.')
      setUploadedFile(null)
    } finally {
      setExtracting(false)
      setExtractionLabel('')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  // ── Timer helpers ─────────────────────────────────────────────────────────
  const startLoadingTimers = () => {
    setElapsedSecs(0)
    setStepIndex(0)
    abortRef.current = false
    timerRef.current = setInterval(() => setElapsedSecs(s => s + 1), 1000)
    stepTimerRef.current = setInterval(() => setStepIndex(s => s + 1), 3500)
  }
  const stopLoadingTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (stepTimerRef.current) clearInterval(stepTimerRef.current)
  }

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    const text = inputMode === 'upload' ? extractedText : manualText
    if (!text || text.trim().length < 50) {
      setError('Please provide at least 50 characters of content.')
      return
    }
    setError(null)
    setGeneratedNotes('')
    setFlashcards([])
    setGenerating(true)
    setStage('generating')
    setSaved(false)
    setActiveTab('note')
    startLoadingTimers()

    // Auto-title from file name or first line
    const title = noteTitle || (inputMode === 'upload' && uploadedFile
      ? uploadedFile.name.replace(/\.[^/.]+$/, '')
      : text.split('\n')[0].slice(0, 60).trim()) || 'My Study Material'
    setNoteTitle(title)

    try {
      // 1. Generate Study Notes
      const notePromise = generateStudyNotes(
        text,
        inputMode === 'upload' ? uploadedFile?.name : undefined,
        (chunk) => setGeneratedNotes(prev => prev + chunk)
      )

      // 2. Generate Flashcards if checkbox is checked
      const cardPromise = includeFlashcards
        ? generateAIFlashCards({
            text: text.slice(0, 4000),
            amount: 10,
            category: title
          }).catch(err => {
            console.warn('AI Flashcards API failed, fallback to parser', err)
            return null
          })
        : Promise.resolve(null)

      const [noteRes, cardRes] = await Promise.all([notePromise, cardPromise])

      let notesContent = ''
      if (noteRes?.success && noteRes.notes) {
        notesContent = noteRes.notes
        setGeneratedNotes(noteRes.notes)
      } else {
        notesContent = generatedNotes
      }

      if (includeFlashcards) {
        let generatedCardsList: FlashCard[] = []
        if (cardRes?.success && Array.isArray(cardRes.flashCards) && cardRes.flashCards.length > 0) {
          generatedCardsList = cardRes.flashCards
        } else {
          generatedCardsList = extractFlashcardsFromMarkdown(notesContent || text, title)
        }
        setFlashcards(generatedCardsList)
      }

      setCardIndex(0)
      setCardFlipped(false)
      if (!abortRef.current) setStage('result')
    } catch (e: any) {
      if (abortRef.current) return
      const msg = e?.message || 'Generation failed. Please try again.'
      setError(msg)
      if (isUpgradeError(msg)) {
        showUpgrade('notes')
      }
      setStage('input')
    } finally {
      stopLoadingTimers()
      setGenerating(false)
    }
  }

  // ── Generate Flashcards On-demand (if tab switched) ─────────────────────────
  const generateFlashcardsOnDemand = async () => {
    if (flashcards.length > 0) return
    const text = generatedNotes || (inputMode === 'upload' ? extractedText : manualText)
    if (!text) return
    setGenerating(true)
    const title = noteTitle || 'PDF Summary'
    try {
      const cardRes = await generateAIFlashCards({
        text: text.slice(0, 4000),
        amount: 10,
        category: title
      }).catch(() => null)

      if (cardRes?.success && Array.isArray(cardRes.flashCards) && cardRes.flashCards.length > 0) {
        setFlashcards(cardRes.flashCards)
      } else {
        setFlashcards(extractFlashcardsFromMarkdown(text, title))
      }
    } catch (e) {
      setFlashcards(extractFlashcardsFromMarkdown(text, title))
    } finally {
      setGenerating(false)
    }
  }

  // ── Save Note ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!generatedNotes || !noteTitle) return
    setSaving(true)
    try {
      const sourceName =
        inputMode === 'upload' && uploadedFile ? uploadedFile.name : 'Manual text'
      await saveStudyNote(noteTitle, generatedNotes, sourceName)
      setSaved(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to save note.')
    } finally {
      setSaving(false)
    }
  }

  // ── Save Flashcards Deck ────────────────────────────────────────────────────
  const handleSaveCards = async () => {
    if (flashcards.length === 0) return
    setSavingCards(true)
    try {
      const deckTitle = noteTitle || 'PDF Summary Flashcards'
      const deckRes = await createDeck({
        name: deckTitle,
        description: `Generated from ${inputMode === 'upload' && uploadedFile ? uploadedFile.name : 'PDF Summary'}`,
        category: 'PDF Summary',
        color: 'purple'
      }).catch(() => null)

      const deckId = deckRes?.deck?._id || deckRes?._id

      for (const card of flashcards) {
        await createFlashCard({
          front: card.front,
          back: card.back,
          category: card.category || 'PDF Summary',
          deckId: deckId
        }).catch(() => {})
      }
      setCardsSaved(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to save flashcards.')
    } finally {
      setSavingCards(false)
    }
  }

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStage('input')
    setGeneratedNotes('')
    setFlashcards([])
    setCardIndex(0)
    setCardFlipped(false)
    setUploadedFile(null)
    setExtractedText('')
    setManualText('')
    setNoteTitle('')
    setError(null)
    setSaved(false)
    setActiveTab('note')
  }

  const textReady =
    inputMode === 'upload'
      ? !!extractedText && !extracting
      : manualText.trim().length >= 50

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute allowedRoles={['student', 'teacher']}>
      <div className="max-w-4xl mx-auto">
                {/* ── INPUT STAGE ─────────────────────────────────────────────────── */}
        {stage === 'input' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Mode Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setInputMode('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all
                  ${inputMode === 'upload'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 font-black'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <FiUploadCloud /> Upload Document
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all
                  ${inputMode === 'manual'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 font-black'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <FiEdit3 /> Paste Text
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {/* Upload Mode */}
              {inputMode === 'upload' && (
                <div>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !extracting && fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all
                      ${isDragging
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.01]'
                        : uploadedFile && extractedText
                          ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
                      }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.pptx,.ppt,.txt,.md,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />

                    {extracting ? (
                      <>
                        <FiLoader className="text-4xl text-blue-500 animate-spin" />
                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{extractionLabel}</p>
                      </>
                    ) : uploadedFile && extractedText ? (
                      <>
                        <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                          <FiCheckCircle className="text-3xl text-emerald-500" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-900 dark:text-white">{uploadedFile.name}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            {extractedText.length.toLocaleString()} characters extracted
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setUploadedFile(null); setExtractedText('') }}
                          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition"
                        >
                          <FiX /> Remove file
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30">
                          <FiUploadCloud className="text-4xl text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-700 dark:text-gray-200 text-base">
                            Drop your document here
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            or click to browse &mdash; PDF, Word, PPT, Images (max 50 MB)
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-center text-gray-400">
                    Supports PDF, DOCX, PPTX, TXT, and images (JPG, PNG)
                  </p>
                </div>
              )}

              {/* Manual Text Mode */}
              {inputMode === 'manual' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                    Your Content
                  </label>
                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    rows={10}
                    placeholder="Paste your lecture notes, textbook excerpt, or study material here... (minimum 50 characters)"
                    className="w-full px-4 py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-400 transition resize-none font-medium"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className={`text-xs font-medium ${manualText.trim().length < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {manualText.trim().length} / 50 min characters
                    </p>
                  </div>
                </div>
              )}

              {/* ── FLASHCARD CHECKBOX OPTION ───────────────────────────────── */}
              <label className="mt-6 flex items-center gap-3 cursor-pointer select-none p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={includeFlashcards}
                    onChange={(e) => setIncludeFlashcards(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    includeFlashcards
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                  }`}>
                    {includeFlashcards && <FiCheck className="text-xs stroke-[3]" />}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Also generate flashcards</span>
                  <p className="text-xs text-gray-400 mt-0.5">Create review cards from your study notes</p>
                </div>
              </label>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!textReady}
                className="mt-6 w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <BiBrain className="text-xl" />
                {includeFlashcards ? 'Generate Note & Flashcards' : 'Generate Study Note'}
              </button>

              {/* Chip list showing what AI will produce */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {['Study Notes', 'Key Concepts', includeFlashcards ? '10+ Flashcards' : '', 'Exam Prep'].filter(Boolean).map(chip => (
                  <span key={chip} className="text-[10px] font-bold px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-full">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GENERATING STAGE ─────────────────────────────────────────────── */}
        {stage === 'generating' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
            {generatedNotes ? (
              <>
                {/* Live streaming preview */}
                <div className="flex items-center gap-2 mb-6">
                  <FiLoader className="animate-spin text-blue-500" />
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                    Streaming your notes...
                  </span>
                  <span className="ml-auto text-xs text-gray-400 font-mono">{elapsedSecs}s</span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <MarkdownNote content={generatedNotes} />
                </div>
              </>
            ) : (
              (() => {
                const steps = includeFlashcards
                  ? [
                      { icon: '📄', label: 'Reading your document...' },
                      { icon: '🧠', label: 'Identifying key concepts...' },
                      { icon: '📝', label: 'Structuring study notes...' },
                      { icon: '🃏', label: 'Building flashcards...' },
                      { icon: '✨', label: 'Polishing output...' },
                    ]
                  : [
                      { icon: '📄', label: 'Reading your document...' },
                      { icon: '🧠', label: 'Identifying key concepts...' },
                      { icon: '📝', label: 'Structuring study notes...' },
                      { icon: '✨', label: 'Almost ready...' },
                    ]
                const current = steps[stepIndex % steps.length]
                const pct = Math.min((elapsedSecs / (includeFlashcards ? 40 : 25)) * 100, 95)
                return (
                  <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
                    {/* Animated brain icon */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full border-4 border-blue-100 dark:border-blue-900 border-t-blue-500 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center text-3xl">
                        {current.icon}
                      </div>
                    </div>

                    {/* Current step label */}
                    <div>
                      <p className="font-black text-gray-800 dark:text-white text-lg mb-1">
                        {current.label}
                      </p>
                      <p className="text-xs text-gray-400">
                        AI is working — this usually takes 15–30 seconds
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full max-w-sm">
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                        <span>Processing</span>
                        <span className="font-mono">{elapsedSecs}s</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Steps list */}
                    <div className="flex flex-col gap-1.5 w-full max-w-sm text-left">
                      {steps.map((s, i) => {
                        const done = i < stepIndex % steps.length + (pct >= 95 ? steps.length : 0)
                        const active = i === stepIndex % steps.length
                        return (
                          <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                            active ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}>
                            <span className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-[10px] font-black ${
                              done
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : active
                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                  : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
                            }`}>
                              {done ? '✓' : active ? '●' : '○'}
                            </span>
                            <span className={`text-xs font-semibold ${
                              active ? 'text-blue-700 dark:text-blue-300' :
                              done ? 'text-gray-500 line-through' :
                              'text-gray-400'
                            }`}>{s.label}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Cancel button — only after 15s */}
                    {elapsedSecs >= 15 && (
                      <button
                        onClick={() => {
                          abortRef.current = true
                          stopLoadingTimers()
                          setGenerating(false)
                          setStage('input')
                          setGeneratedNotes('')
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 dark:border-gray-600 hover:border-red-300 px-4 py-2 rounded-xl transition font-bold"
                      >
                        Cancel & try again
                      </button>
                    )}
                  </div>
                )
              })()
            )}
          </div>
        )}

        {/* ── RESULT STAGE (SEAMLESS UNIFIED CARD CONTAINER) ─────────────────── */}
        {stage === 'result' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Header: Tabs + Title & Actions in a single bar */}
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Note / Flashcard Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl self-start md:self-auto">
                <button
                  onClick={() => setActiveTab('note')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'note'
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm font-black'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <FiFileText className="text-sm" />
                  <span>Note</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('flashcard')
                    if (flashcards.length === 0) {
                      generateFlashcardsOnDemand()
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'flashcard'
                      ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm font-black'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <FiLayers className="text-sm" />
                  <span>Flashcards</span>
                  {flashcards.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                      {flashcards.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setBlindSummaryOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200/60 dark:border-purple-800/40 transition-all shadow-sm"
                  title="Type 3 main points without looking back to earn +25 XP"
                >
                  <span>🙈 Blind Summary</span>
                  <span className="text-[10px] px-1.5 py-0.2 font-extrabold bg-yellow-400 text-purple-950 rounded-full">
                    +25 XP
                  </span>
                </button>
              </div>

              {/* Title & Actions */}
              <div className="flex flex-1 items-center gap-3">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Title for this note..."
                  className="flex-1 px-3 py-2 bg-transparent border-b border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 transition"
                />

                <div className="flex items-center gap-2 flex-shrink-0">
                  {saved ? (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                      <FiCheckCircle /> Saved
                    </div>
                  ) : (
                    <button
                      onClick={handleSave}
                      disabled={saving || !noteTitle}
                      className="flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
                      Save Note
                    </button>
                  )}

                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                  >
                    <FiRefreshCw /> New
                  </button>
                </div>
              </div>
            </div>

            {/* Saved Banner inside card */}
            {saved && (
              <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <FiCheckCircle /> Saved to your notes history
                </span>
                <Link
                  href="/dashboard/notes-history"
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  View Notes <FiArrowRight />
                </Link>
              </div>
            )}

            {/* Active Recall Prompt Banner */}
            {!blindSummaryDismissed && (
              <div className="p-4 m-4 mb-0 bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-blue-900/10 border border-purple-200 dark:border-purple-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
                    🙈
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                        Active Recall Challenge
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-yellow-400 text-purple-950 rounded-full">
                        +25 XP
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Read your summary? Test your memory: Type 3 main points without looking back!
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => setBlindSummaryDismissed(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => setBlindSummaryOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all transform active:scale-95"
                  >
                    <BiBrain className="text-sm" /> Test Memory
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB CONTENT: NOTE VIEW ────────────────────────────────────── */}
            {activeTab === 'note' && generatedNotes && (
              <div className="p-6 sm:p-8">
                <MarkdownNote content={generatedNotes} />
              </div>
            )}

            {/* ── TAB CONTENT: FLASHCARD VIEW ───────────────────────────────── */}
            {activeTab === 'flashcard' && (
              <div className="p-6 sm:p-8">
                {generating ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FiLoader className="text-3xl text-purple-500 animate-spin mb-3" />
                    <p className="font-bold text-gray-700 dark:text-gray-200">Generating flashcards...</p>
                  </div>
                ) : flashcards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <FiLayers className="text-4xl text-purple-400" />
                    <p className="font-bold text-gray-700 dark:text-gray-200">No flashcards generated yet</p>
                    <button
                      onClick={generateFlashcardsOnDemand}
                      className="px-5 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-700 transition"
                    >
                      Generate Flashcards Now
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    {/* View Controls & Info */}
                    <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          Interactive Deck
                        </span>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {flashcards.length} Flashcards Generated
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCardsViewMode('flip')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            cardsViewMode === 'flip'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <FiEye /> Flip View
                        </button>
                        <button
                          onClick={() => setCardsViewMode('grid')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            cardsViewMode === 'grid'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <FiGrid /> Grid View
                        </button>
                      </div>
                    </div>

                    {/* Single 3D Flip Card View */}
                    {cardsViewMode === 'flip' && (
                      <div className="w-full max-w-xl">
                        <div className="flex justify-between items-center mb-2 px-1">
                          <span className="text-xs font-bold text-gray-400">
                            Card {cardIndex + 1} of {flashcards.length}
                          </span>
                          <span className="text-xs text-purple-500 font-medium flex items-center gap-1">
                            <FiRotateCw /> Click card to flip
                          </span>
                        </div>

                        <div
                          onClick={() => setCardFlipped(!cardFlipped)}
                          className="cursor-pointer group relative w-full h-80 select-none"
                          style={{ perspective: '1000px' }}
                        >
                          <div
                            className="relative w-full h-full rounded-3xl shadow-xl transition-all duration-500"
                            style={{
                              transformStyle: 'preserve-3d',
                              transform: cardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            {/* FRONT SIDE */}
                            <div
                              className="absolute inset-0 w-full h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-3xl p-8 flex flex-col justify-between shadow-md"
                              style={{ backfaceVisibility: 'hidden' }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                                  Question
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <FiRotateCw /> Tap to flip
                                </span>
                              </div>
                              <div className="my-auto text-center px-4">
                                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-relaxed">
                                  {flashcards[cardIndex]?.front}
                                </p>
                              </div>
                              <div className="text-center">
                                <span className="text-xs text-gray-400 font-medium">Tap card to reveal answer</span>
                              </div>
                            </div>

                            {/* BACK SIDE */}
                            <div
                              className="absolute inset-0 w-full h-full rounded-3xl flex flex-col border-2 border-indigo-300 dark:border-indigo-600 shadow-md"
                              style={{
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                background: '#eef2ff'
                              }}
                            >
                              <div className="flex-shrink-0 flex items-center justify-between px-8 pt-6">
                                <span className="px-3 py-1 bg-indigo-200 text-indigo-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                                  Answer
                                </span>
                                <span className="text-xs text-indigo-400 flex items-center gap-1">
                                  <FiRotateCw /> Tap to flip back
                                </span>
                              </div>
                              <div className="flex-1 min-h-0 overflow-y-auto px-8 py-4 flex items-center justify-center">
                                <p className="text-sm font-semibold leading-relaxed text-center" style={{ color: '#1e1b4b' }}>
                                  {flashcards[cardIndex]?.back}
                                </p>
                              </div>
                              <div className="flex-shrink-0 text-center pb-5">
                                <span className="text-xs font-medium" style={{ color: '#6366f1' }}>Tap card to return to question</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Navigation controls */}
                        <div className="flex items-center justify-between mt-6">
                          <button
                            onClick={() => {
                              setCardFlipped(false)
                              setCardIndex(prev => (prev > 0 ? prev - 1 : flashcards.length - 1))
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 transition"
                          >
                            <FiChevronLeft /> Previous
                          </button>

                          <button
                            onClick={() => setCardFlipped(!cardFlipped)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-black hover:bg-indigo-200 transition"
                          >
                            <FiRotateCw /> Flip Card
                          </button>

                          <button
                            onClick={() => {
                              setCardFlipped(false)
                              setCardIndex(prev => (prev < flashcards.length - 1 ? prev + 1 : 0))
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 transition"
                          >
                            Next <FiChevronRight />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* All Cards Grid View */}
                    {cardsViewMode === 'grid' && (
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {flashcards.map((card, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
                          >
                            <div>
                              <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full inline-block mb-3">
                                Card #{idx + 1}
                              </span>
                              <p className="font-bold text-gray-900 dark:text-white text-sm mb-3">
                                {card.front}
                              </p>
                              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl text-xs text-gray-600 dark:text-gray-300 leading-relaxed border border-gray-200 dark:border-gray-700">
                                <span className="font-bold text-purple-600 dark:text-purple-400 block mb-1">Answer:</span>
                                {card.back}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <BlindSummaryModal
        isOpen={blindSummaryOpen}
        onClose={() => setBlindSummaryOpen(false)}
        onSkip={() => setBlindSummaryOpen(false)}
        title={noteTitle || 'AI Summary'}
        originalSummaryText={generatedNotes}
      />
    </ProtectedRoute>
  )
}


