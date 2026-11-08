'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { extractTextFromFile } from '@/lib/utils/extraction'
import { uploadStudyMaterial } from '@/src/services/api'
import { useAuthStore } from '@/lib/store/authStore'
import {
  FiCheckCircle,
  FiFileText,
  FiHelpCircle,
  FiLoader,
  FiUploadCloud,
  FiX,
  FiArrowRight
} from 'react-icons/fi'
import { IoSparklesSharp } from 'react-icons/io5'

interface FirstPathModalProps {
  isOpen?: boolean
  onClose: () => void
  onSkip?: () => void
}

export default function FirstPathModal({
  isOpen = true,
  onClose,
  onSkip
}: FirstPathModalProps) {
  const router = useRouter()
  const { user } = useAuthStore()

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractionLabel, setExtractionLabel] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateStage, setGenerateStage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDismiss = useCallback(() => {
    if (isGenerating) return
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('studyhelp_first_path_modal_dismissed', 'true')
      } catch {
        // Ignore session storage errors
      }
    }
    if (onSkip) {
      onSkip()
    } else {
      onClose()
    }
  }, [isGenerating, onSkip, onClose])

  const processFile = useCallback(async (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf && !file.name.match(/\.(docx|pptx|ppt|txt)$/i)) {
      setError('Please upload a PDF lecture note or document.')
      return
    }

    const maxMb = 50
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File size exceeds ${maxMb}MB limit.`)
      return
    }

    setError(null)
    setUploadedFile(file)
    setExtractionLabel('Reading lecture note & extracting text...')
    setExtracting(true)

    try {
      const text = await extractTextFromFile(file)
      if (text && text.trim().length >= 30) {
        setExtractedText(text)
      } else {
        setExtractedText('')
      }
    } catch {
      // PDF pipeline handles server-side parsing if client extraction fails
      setExtractedText('')
    } finally {
      setExtracting(false)
      setExtractionLabel('')
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        void processFile(files[0])
      }
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleGenerate = async () => {
    if (!uploadedFile || isGenerating) return

    setError(null)
    setIsGenerating(true)
    setGenerateStage('Uploading lecture note to AI...')

    try {
      const title = uploadedFile.name.replace(/\.[^/.]+$/, '').trim() || 'My Lecture Path'

      const studyPath = await uploadStudyMaterial(uploadedFile, {
        title,
        text: extractedText,
        userId: user?.uid,
        onProgress: (job: { stage?: string; status?: string }) => {
          setGenerateStage(job?.stage || 'Building roadmap nodes...')
        }
      })

      if (!studyPath || !studyPath.topicId) {
        throw new Error('Study path generation failed. Please try again.')
      }

      // Save active topic in localStorage so lesson view can access it instantly
      if (typeof window !== 'undefined') {
        localStorage.setItem('studyhelp_active_topic', JSON.stringify(studyPath))
        try {
          const raw = localStorage.getItem('studyhelp_saved_topics')
          const list = raw ? JSON.parse(raw) : []
          const updated = [studyPath, ...list.filter((t: any) => t?.topicId !== studyPath.topicId)]
          localStorage.setItem('studyhelp_saved_topics', JSON.stringify(updated))
        } catch {
          // ignore storage error
        }
      }

      // Automatically close modal
      onClose()

      // Route directly to Node 1 of newly generated map
      const firstNodeId = studyPath.nodes?.[0]?.id ?? 1
      router.push(`/dashboard/student/lesson/${firstNodeId}`)
    } catch (err: unknown) {
      console.error('[FirstPathModal] Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate study path. Please retry.')
    } finally {
      setIsGenerating(false)
      setGenerateStage('')
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="sp-modal-overlay"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 9999
      }}
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-path-title"
    >
      <div
        className="sp-modal-box"
        style={{
          maxWidth: '560px',
          width: '100%',
          position: 'relative',
          padding: '28px 24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Cancel Cross */}
        <div className="sp-modal-header" style={{ marginBottom: '16px', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3b82f6',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '8px'
              }}
            >
              <IoSparklesSharp /> Welcome to StudyHelp
            </div>
            <h2
              id="first-path-title"
              className="sp-modal-title"
              style={{ fontSize: '22px', lineHeight: 1.3, fontWeight: 800 }}
            >
              Drop your lecture note or PDF to build your path.
            </h2>
            <p
              className="sp-tool-sub"
              style={{ marginTop: '6px', fontSize: '14px', lineHeight: 1.5, opacity: 0.85 }}
            >
              Transform your handout, textbook chapter, or PDF slides into an interactive, step-by-step
              learning roadmap with quizzes and key takeaways.
            </p>
          </div>

          <button
            type="button"
            className="sp-modal-close-btn"
            onClick={handleDismiss}
            disabled={isGenerating}
            aria-label="Dismiss modal"
            title="Cancel / Skip"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !extracting && !isGenerating && fileInputRef.current?.click()}
          className={`sp-dropzone ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'done' : ''}`}
          style={{
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            padding: '28px 20px',
            textAlign: 'center',
            borderWidth: '2px',
            borderStyle: 'dashed',
            borderRadius: '16px',
            transition: 'all 0.2s ease',
            margin: '16px 0 12px'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="sp-hidden-input"
            accept=".pdf,application/pdf,.docx,.pptx,.ppt,.txt"
            onChange={(e) => {
              if (e.target.files?.[0]) void processFile(e.target.files[0])
            }}
            disabled={isGenerating}
          />

          {extracting ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <FiLoader className="animate-spin sp-dropzone-loader" size={32} />
              <p className="sp-dropzone-title" style={{ fontSize: '15px' }}>
                {extractionLabel}
              </p>
            </div>
          ) : uploadedFile ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div
                className="sp-dropzone-icon done"
                style={{
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e'
                }}
              >
                <FiCheckCircle size={28} />
              </div>
              <div>
                <p className="sp-dropzone-title sp-dropzone-file" style={{ fontWeight: 700, fontSize: '15px' }}>
                  {uploadedFile.name}
                </p>
                <p className="sp-dropzone-sub" style={{ fontSize: '13px', opacity: 0.75 }}>
                  {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to generate path
                </p>
              </div>
              <button
                type="button"
                className="sp-dropzone-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  setUploadedFile(null)
                  setExtractedText('')
                }}
                disabled={isGenerating}
                style={{
                  marginTop: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiX /> Remove file
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div
                className="sp-dropzone-icon"
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDragging ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.08)',
                  color: '#3b82f6'
                }}
              >
                <FiUploadCloud size={28} />
              </div>
              <div>
                <p className="sp-dropzone-title" style={{ fontWeight: 700, fontSize: '16px', margin: 0 }}>
                  Drag & drop your lecture PDF here
                </p>
                <p className="sp-dropzone-sub" style={{ fontSize: '13px', margin: '4px 0 0', opacity: 0.75 }}>
                  or click to browse from your device (PDF up to 50MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '13px',
              lineHeight: 1.4,
              marginBottom: '14px'
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          className="sp-btn-generate sp-generate-full"
          onClick={handleGenerate}
          disabled={!uploadedFile || isGenerating || extracting}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: !uploadedFile || isGenerating ? 'not-allowed' : 'pointer',
            opacity: !uploadedFile || isGenerating ? 0.6 : 1,
            marginTop: '6px'
          }}
        >
          {isGenerating ? (
            <>
              <FiLoader style={{ animation: 'spin 1s linear infinite' }} size={18} />
              <span>{generateStage || 'Creating your roadmap...'}</span>
            </>
          ) : (
            <>
              <IoSparklesSharp size={18} />
              <span>Build My Study Path</span>
            </>
          )}
        </button>

        {/* Cancel / Skip Options */}
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isGenerating}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '10px',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'transparent',
              color: 'inherit',
              fontWeight: 600,
              fontSize: '14px',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            Cancel / Skip
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13px',
              opacity: 0.8
            }}
          >
            <span>Want to practice first?</span>
            <Link
              href="/dashboard/question-bank"
              onClick={handleDismiss}
              style={{
                color: '#3b82f6',
                fontWeight: 600,
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              Open Question Generator <FiArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

