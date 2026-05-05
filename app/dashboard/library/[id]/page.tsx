'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Pencil, 
  Trash2, 
  X,
  FileText,
  Loader2
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getFirebaseToken } from '@/lib/store/authStore'
import dynamic from 'next/dynamic'

// We still want to use some of the same logic for progress tracking
export default function LibraryReaderPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [document, setDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isSaving, setIsSaving] = useState(false)
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0)

  // Estimated read time logic from PDFViewer
  const percentage = useMemo(() => {
    const pages = document?.pages || numPages || 1
    const estimatedReadTimeSeconds = Math.max(1, pages) * 30
    return Math.min(100, Math.max(0, Math.round((timeSpentSeconds / estimatedReadTimeSeconds) * 100)))
  }, [timeSpentSeconds, document?.pages, numPages])

  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true)
      const token = await getFirebaseToken()
      const { apiClient } = await import('@/lib/api/client')
      const res = await apiClient.get(`/library/documents/${id}`)
      
      if (res.data?.success && res.data.document) {
        setDocument(res.data.document)
        if (res.data.document.pages) setNumPages(res.data.document.pages)
        
        // Handle initial progress
        if (res.data.document.progress) {
          if (res.data.document.progress.currentPage) {
            setCurrentPage(res.data.document.progress.currentPage)
          }
          if (res.data.document.progress.percentage) {
            const estimatedReadTimeSeconds = Math.max(1, res.data.document.pages || 1) * 30
            setTimeSpentSeconds(Math.round((res.data.document.progress.percentage / 100) * estimatedReadTimeSeconds))
          }
        }
      } else {
        setError('Document not found or access denied.')
      }
    } catch (err: any) {
      console.error('[LibraryReader] Fetch error:', err)
      setError(err.message || 'Failed to load document.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) void fetchDocument()
  }, [id, fetchDocument])

  // Time-based tracking interval
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpentSeconds((prev) => prev + 30)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Save progress logic
  useEffect(() => {
    if (!document || !numPages || loading) return

    const timeout = setTimeout(async () => {
      try {
        setIsSaving(true)
        const { apiClient } = await import('@/lib/api/client')
        await apiClient.post('/library/progress', {
          documentId: id,
          currentPage,
          percentage,
        })
      } catch (err) {
        console.error('[LibraryReader] Failed to save progress:', err)
      } finally {
        setIsSaving(false)
      }
    }, 1500) // Slightly longer debounce for page-level saving

    return () => clearTimeout(timeout)
  }, [currentPage, id, numPages, percentage, loading, document])

  const goToPage = (page: number) => {
    const total = numPages || document?.pages || 1
    setCurrentPage(Math.max(1, Math.min(total, page)))
  }

  const handleDelete = async () => {
    if (!confirm(`Delete “${document?.title}”? This cannot be undone.`)) return
    try {
       const { apiClient } = await import('@/lib/api/client')
       const res = await apiClient.delete(`/library/documents/${id}`)
       if (res.data?.success) {
         router.push('/dashboard/library')
       }
    } catch (err) {
       console.error('[LibraryReader] Failed to delete:', err)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-[80vh] w-full flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#5B4CF5]" />
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Opening document...</p>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !document) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <X size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Error Loading Document</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">{error || 'The document could not be found.'}</p>
          <button
            onClick={() => router.push('/dashboard/library')}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            <ArrowLeft size={18} /> Back to Library
          </button>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="fixed inset-0 z-[60] flex h-screen w-screen flex-col overflow-hidden bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/library')}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Back to Library"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">{document.title}</h1>
              <div className="flex items-center gap-2">
                 {isSaving && <span className="text-[10px] text-[#5B4CF5] animate-pulse">Saving...</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 sm:h-10 sm:w-10"
              title="Download"
            >
              <Download size={18} />
            </a>
            <button
              onClick={handleDelete}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-900/20 sm:h-10 sm:w-10"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Content */}
        <div className="relative flex-1 bg-slate-100 dark:bg-slate-950">
          <iframe
            src={`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(document.fileUrl)}#page=${currentPage}`}
            className="absolute inset-0 h-full w-full"
            style={{ border: 'none' }}
            title="PDF Viewer"
          />
        </div>

        {/* Footer Controls */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:px-6"
            >
              <ChevronLeft size={18} /> <span className="hidden sm:inline">Previous</span>
            </button>
            
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <span className="text-slate-900 dark:text-white">Page {currentPage}</span>
              <span className="opacity-40">/</span>
              <span>{numPages || '-'}</span>
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={!numPages || currentPage >= numPages}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:px-6"
            >
              <span className="hidden sm:inline">Next</span> <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
