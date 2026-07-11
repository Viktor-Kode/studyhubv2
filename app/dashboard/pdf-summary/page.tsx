'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import ProtectedRoute from '@/components/ProtectedRoute'
import { generateStudyNotes, saveStudyNote } from '@/lib/api/quizApi'
import { extractTextFromFile } from '@/lib/utils/extraction'
import { useUpgrade } from '@/context/UpgradeContext'
import {
  FiUploadCloud, FiFileText, FiLoader, FiCheckCircle,
  FiSave, FiRefreshCw, FiX, FiBookOpen, FiEdit3, FiLink,
  FiArrowLeft, FiArrowRight
} from 'react-icons/fi'
import { BiBrain } from 'react-icons/bi'

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

export default function PDFSummaryPage() {
  const { showUpgrade } = useUpgrade()

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
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Save state
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

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    const text = inputMode === 'upload' ? extractedText : manualText
    if (!text || text.trim().length < 50) {
      setError('Please provide at least 50 characters of content.')
      return
    }
    setError(null)
    setGeneratedNotes('')
    setGenerating(true)
    setStage('generating')
    setSaved(false)

    // Auto-title from file name or first line
    if (!noteTitle) {
      const autoTitle =
        inputMode === 'upload' && uploadedFile
          ? uploadedFile.name.replace(/\.[^/.]+$/, '')
          : text.split('\n')[0].slice(0, 60).trim()
      setNoteTitle(autoTitle || 'My Study Notes')
    }

    try {
      const response = await generateStudyNotes(
        text,
        inputMode === 'upload' ? uploadedFile?.name : undefined,
        (chunk) => setGeneratedNotes(prev => prev + chunk)
      )
      if (response.success && response.notes) {
        setGeneratedNotes(response.notes)
      }
      setStage('result')
    } catch (e: any) {
      const msg = e?.message || 'Generation failed. Please try again.'
      setError(msg)
      if (isUpgradeError(msg)) {
        showUpgrade('notes')
      }
      setStage('input')
    } finally {
      setGenerating(false)
    }
  }

  // ── Save to My Notes ────────────────────────────────────────────────────────
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

  // ── Reset ───────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setStage('input')
    setGeneratedNotes('')
    setUploadedFile(null)
    setExtractedText('')
    setManualText('')
    setNoteTitle('')
    setError(null)
    setSaved(false)
  }

  const textReady =
    inputMode === 'upload'
      ? !!extractedText && !extracting
      : manualText.trim().length >= 50

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute allowedRoles={['student', 'teacher']}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <FiFileText className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">PDF Summary</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload a document or paste text — get exam-ready study notes in seconds
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl">
            <FiX className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <FiX />
            </button>
          </div>
        )}

        {/* ── INPUT STAGE ─────────────────────────────────────────────────── */}
        {stage === 'input' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Mode Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setInputMode('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all
                  ${inputMode === 'upload'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <FiUploadCloud /> Upload Document
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all
                  ${inputMode === 'manual'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
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
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
                        : uploadedFile && extractedText
                          ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10'
                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
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
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
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
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-400 transition resize-none font-medium"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className={`text-xs font-medium ${manualText.trim().length < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {manualText.trim().length} / 50 min characters
                    </p>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!textReady}
                className="mt-6 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <BiBrain className="text-xl" />
                Generate Study Notes
              </button>

              {/* Chip list showing what AI will produce */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {['Key Concepts', 'Detailed Explanations', 'Likely Exam Questions', 'Summary'].map(chip => (
                  <span key={chip} className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-full">
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
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Generating your notes...</span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <MarkdownNote content={generatedNotes} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                  <BiBrain className="absolute inset-0 m-auto text-blue-500 text-2xl" />
                </div>
                <p className="font-bold text-gray-700 dark:text-gray-200">Analyzing your document...</p>
                <p className="text-xs text-gray-400">This may take a few seconds</p>
              </div>
            )}
          </div>
        )}

        {/* ── RESULT STAGE ─────────────────────────────────────────────────── */}
        {stage === 'result' && generatedNotes && (
          <div className="space-y-4">
            {/* Action bar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Title for this note..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition"
                />
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {saved ? (
                  <div className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                    <FiCheckCircle /> Saved to My Notes
                  </div>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving || !noteTitle}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/20"
                  >
                    {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
                    Save to My Notes
                  </button>
                )}

                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition"
                >
                  <FiRefreshCw /> New
                </button>
              </div>
            </div>

            {/* Saved CTA */}
            {saved && (
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    Saved! View it anytime in your notes.
                  </p>
                </div>
                <Link
                  href="/dashboard/notes-history"
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  View Notes <FiArrowRight />
                </Link>
              </div>
            )}

            {/* Notes Content */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
              <MarkdownNote content={generatedNotes} />
            </div>

            {/* Bottom actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2"
              >
                <FiRefreshCw /> Summarise Another Document
              </button>
              <Link
                href="/dashboard/notes-history"
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/20"
              >
                <FiBookOpen /> My Notes <FiArrowRight />
              </Link>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
