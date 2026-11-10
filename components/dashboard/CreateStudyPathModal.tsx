'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractTextFromFile } from '@/lib/utils/extraction'
import { uploadStudyMaterial } from '@/src/services/api'
import { openPaywallModal } from '@/lib/upgradeHandler'
import {
  FiCheckCircle,
  FiEdit3,
  FiLoader,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi'
import { IoSparklesSharp } from 'react-icons/io5'

type InputMode = 'upload' | 'text'

function getExtractionLabel(file: File): string {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return 'Scanning image with OCR...'
  if (ext === '.pdf') return 'Extracting PDF pages...'
  if (ext === '.docx') return 'Reading Word document...'
  if (ext === '.pptx' || ext === '.ppt') return 'Extracting presentation text...'
  return 'Reading document...'
}

export default function CreateStudyPathModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [inputMode, setInputMode] = useState<InputMode>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [manualText, setManualText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractionLabel, setExtractionLabel] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateStage, setGenerateStage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    const maxMb = 50
    if (file.size > maxMb * 1024 * 1024) {
      setInputError(`File too large. Maximum is ${maxMb}MB.`)
      return
    }
    setUploadedFile(file)
    setExtractedText('')
    setInputError(null)
    setExtractionLabel(getExtractionLabel(file))
    setExtracting(true)
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    try {
      const text = await extractTextFromFile(file)
      if (!text || text.trim().length < 30) {
        if (!isPdf) {
          setInputError('Could not extract readable text from this file. Please try a different file or paste text manually.')
          setUploadedFile(null)
        }
        setExtractedText('')
      } else {
        setExtractedText(text)
      }
    } catch (error: unknown) {
      if (isPdf) {
        setExtractedText('')
      } else {
        setInputError(error instanceof Error ? error.message : 'Failed to read file.')
        setUploadedFile(null)
        setExtractedText('')
      }
    } finally {
      setExtracting(false)
      setExtractionLabel('')
    }
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void handleFile(file)
  }, [handleFile])

  const sourceText = inputMode === 'upload' ? extractedText : manualText
  const isPdfUpload = Boolean(uploadedFile && (uploadedFile.type === 'application/pdf' || uploadedFile.name.toLowerCase().endsWith('.pdf')))
  const textReady = inputMode === 'upload'
    ? Boolean(extractedText || isPdfUpload) && !extracting
    : manualText.trim().length >= 50

  const handleGenerate = async () => {
    if (!textReady || isGenerating) return
    setInputError(null)
    setGenerateError(null)
    setIsGenerating(true)
    setGenerateStage('Uploading document...')
    try {
      const title = inputMode === 'upload' && uploadedFile
        ? uploadedFile.name.replace(/\.[^/.]+$/, '')
        : sourceText.split('\n')[0].slice(0, 60).trim() || 'Study Material'
      const studyPath = inputMode === 'upload' && uploadedFile
        ? await uploadStudyMaterial(uploadedFile, {
            title,
            text: sourceText,
            onProgress: (job: { stage?: string }) => setGenerateStage(job?.stage || 'Building map...'),
          })
        : await uploadStudyMaterial(null as any, { text: sourceText, title })

      localStorage.setItem('studyhelp_active_topic', JSON.stringify(studyPath))
      if (studyPath.topicId) {
        localStorage.setItem('studyhelp_claim_topic_id', studyPath.topicId)
      }
      try {
        const raw = localStorage.getItem('studyhelp_saved_topics')
        const list = raw ? JSON.parse(raw) : []
        const updated = [studyPath, ...list.filter((t) => t?.topicId !== studyPath.topicId)]
        localStorage.setItem('studyhelp_saved_topics', JSON.stringify(updated))
      } catch {}
      onClose()
      router.push(`/dashboard/student/map/${encodeURIComponent(studyPath.topicId)}`)
    } catch (error: unknown) {
      const err = error as any
      const isPaywall =
        err?.code === 'PAYWALL_TRIGGERED' ||
        err?.isPaywall ||
        err?.response?.status === 403 ||
        err?.response?.data?.error === 'PAYWALL_TRIGGERED' ||
        err?.response?.data?.code === 'PAYWALL_TRIGGERED' ||
        err?.message === 'PAYWALL_TRIGGERED'

      if (isPaywall) {
        openPaywallModal('study_map')
        onClose()
        return
      }

      setGenerateError(error instanceof Error ? error.message : 'Failed to generate study path. Please try again.')
    } finally {
      setIsGenerating(false)
      setGenerateStage('')
    }
  }

  const close = () => {
    if (!isGenerating) onClose()
  }

  return (
    <div className="sp-modal-overlay" onClick={close}>
      <div className="sp-modal-box sp-modal-box-lg" role="dialog" aria-modal="true" aria-labelledby="create-study-path-title" onClick={(event) => event.stopPropagation()}>
        <div className="sp-modal-header">
          <div>
            <h3 id="create-study-path-title" className="sp-modal-title">New Topic</h3>
            <p className="sp-tool-sub" style={{ marginTop: 4 }}>Upload a document or paste text to generate your study path.</p>
          </div>
          <button className="sp-modal-close-btn" onClick={close} disabled={isGenerating} aria-label="Close">
            <FiX />
          </button>
        </div>

        <div className="sp-input-tabs">
          <button className={`sp-input-tab ${inputMode === 'upload' ? 'active' : ''}`} onClick={() => setInputMode('upload')}>
            <FiUploadCloud /> Upload Document
          </button>
          <button className={`sp-input-tab ${inputMode === 'text' ? 'active' : ''}`} onClick={() => setInputMode('text')}>
            <FiEdit3 /> Paste Text
          </button>
        </div>

        {inputMode === 'upload' && (
          <div>
            <div
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !extracting && fileInputRef.current?.click()}
              className={`sp-dropzone ${isDragging ? 'dragging' : ''} ${uploadedFile && (extractedText || isPdfUpload) ? 'done' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="sp-hidden-input"
                accept=".pdf,.docx,.pptx,.ppt,.txt,.md,.jpg,.jpeg,.png,.webp"
                onChange={(event) => { if (event.target.files?.[0]) void handleFile(event.target.files[0]) }}
              />
              {extracting ? (
                <>
                  <FiLoader className="animate-spin sp-dropzone-loader" />
                  <p className="sp-dropzone-title">{extractionLabel}</p>
                </>
              ) : uploadedFile && (extractedText || isPdfUpload) ? (
                <>
                  <div className="sp-dropzone-icon done"><FiCheckCircle /></div>
                  <div>
                    <p className="sp-dropzone-title sp-dropzone-file">{uploadedFile.name}</p>
                    <p className="sp-dropzone-sub">{extractedText ? `${extractedText.length.toLocaleString()} characters extracted` : 'Text and visual slides will be analyzed'}</p>
                  </div>
                  <button className="sp-dropzone-remove" onClick={(event) => { event.stopPropagation(); setUploadedFile(null); setExtractedText('') }}>
                    <FiX /> Remove file
                  </button>
                </>
              ) : (
                <>
                  <div className="sp-dropzone-icon"><FiUploadCloud /></div>
                  <div>
                    <p className="sp-dropzone-title">Drop your document here</p>
                    <p className="sp-dropzone-sub">or click to browse — PDF, Word, PPT, Images (max 50 MB)</p>
                  </div>
                </>
              )}
            </div>
            <p className="sp-dropzone-hint">Supports PDF, DOCX, PPTX, TXT, and images (JPG, PNG)</p>
          </div>
        )}

        {inputMode === 'text' && (
          <div>
            <label className="sp-input-label" htmlFor="study-path-pasted-text">Your Content</label>
            <textarea
              id="study-path-pasted-text"
              value={manualText}
              onChange={(event) => setManualText(event.target.value)}
              rows={8}
              placeholder="Paste your lecture notes, textbook excerpt, or study material here... (minimum 50 characters)"
              className="sp-modal-textarea"
            />
            <p className={`sp-char-count ${manualText.trim().length < 50 ? 'warn' : 'ok'}`}>
              {manualText.trim().length} / 50 min characters
            </p>
          </div>
        )}

        {inputError && <p className="sp-input-error">{inputError}</p>}
        {generateError && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13, lineHeight: 1.5, marginTop: 4 }}>
            ⚠️ {generateError}
          </div>
        )}

        <button className="sp-btn-generate sp-generate-full" onClick={handleGenerate} disabled={!textReady || isGenerating}>
          {isGenerating ? (
            <><FiLoader style={{ animation: 'spin 1s linear infinite' }} /><span>{generateStage || 'Analyzing slides...'}</span></>
          ) : (
            <><IoSparklesSharp /><span>Generate Study Path</span></>
          )}
        </button>
      </div>
    </div>
  )
}
