'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Pencil,
  Trash2,
  X,
} from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { getFirebaseToken } from '@/lib/store/authStore'
import { PDF_WORKER_PUBLIC_PATH } from '@/lib/utils/pdfWorkerSrc'

pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_PUBLIC_PATH

type LibraryDocument = {
  _id: string
  title: string
  fileUrl: string
  coverColor?: string
  pages?: number
}

type Props = {
  documentItem: LibraryDocument
  onClose: () => void
  onEditDetails?: () => void
  onDeleted: (id: string) => void
  onProgressSaved: (id: string, currentPage: number, percentage: number) => void
}

export default function PDFViewer({
  documentItem,
  onClose,
  onEditDetails,
  onDeleted,
  onProgressSaved,
}: Props) {
  const [numPages, setNumPages] = useState<number>(documentItem.pages || 0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pageWidth, setPageWidth] = useState(800)
  // Start as null — prevents react-pdf from making an unauthenticated request on first render
  const [fileSource, setFileSource] = useState<string | null>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(true)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)
  // Hard stop flag — once set, the effect will NEVER retry the fetch
  const [pdfFetchFailed, setPdfFetchFailed] = useState(false)

  const percentage = useMemo(() => {
    if (!numPages) return 0
    return Math.min(100, Math.max(0, Math.round((currentPage / numPages) * 100)))
  }, [currentPage, numPages])

  useEffect(() => {
    const onResize = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : 1200
      setPageWidth(Math.min(1000, Math.max(280, width - 80)))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    // Hard stop — if a previous fetch already failed and we've shown the error, stop trying.
    if (pdfFetchFailed) return

    let mounted = true
    let objectUrl = ''

    const loadPdf = async () => {
      try {
        const { apiClient } = await import('@/lib/api/client')
        
        console.log(`[PDFViewer] Attempting to load document: ${documentItem._id}`)
        
        // Fetch the PDF binary via the proxy
        const response = await apiClient.get(`/library/proxy-pdf/${documentItem._id}`, {
          responseType: 'arraybuffer',
          // apiClient handles token attachment and 401 retry (refresh) automatically.
        })

        if (!mounted) return

        const blob = new Blob([response.data], { type: 'application/pdf' })
        objectUrl = URL.createObjectURL(blob)
        
        console.log(`[PDFViewer] Blob created. Size: ${blob.size} bytes. Type: ${blob.type}`)
        
        setFileSource(objectUrl)
        setErrorStatus(null)
        setIsPdfLoading(false)

      } catch (err: any) {
        if (!mounted) return
        console.error('[PDFViewer] Failed to load PDF:', err)
        
        let msg = 'Could not load PDF. Please try again.'
        if (err.response?.status === 401) {
          msg = 'Session expired. Please refresh the page or log in again.'
        } else if (err.response?.status === 404) {
          msg = 'Document not found or access denied.'
        } else if (err.response?.status >= 500) {
          msg = 'The document server is currently busy. Please try again in a few moments.'
        }
        
        setPdfFetchFailed(true)
        setErrorStatus(msg)
        setIsPdfLoading(false)
      }
    }

    void loadPdf()

    return () => {
      mounted = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [documentItem._id, pdfFetchFailed])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const { apiClient } = await import('@/lib/api/client')
      const res = await apiClient.get(`/library/progress/${documentItem._id}`)
      if (mounted && res.data?.success && res.data.progress?.currentPage) {
        setCurrentPage(res.data.progress.currentPage)
      }
    }

    void run()
    return () => {
      mounted = false
    }
  }, [documentItem._id])

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!numPages) return
      try {
        setIsSaving(true)
        const { apiClient } = await import('@/lib/api/client')
        await apiClient.post('/library/progress', {
          documentId: documentItem._id,
          currentPage,
          percentage,
        })
        onProgressSaved(documentItem._id, currentPage, percentage)
      } catch (err) {
        console.error('[PDFViewer] Failed to save progress:', err)
      } finally {
        setIsSaving(false)
      }
    }, 600)

    return () => clearTimeout(timeout)
  }, [currentPage, documentItem._id, numPages, onProgressSaved, percentage])

  const goToPage = (page: number) => {
    if (!numPages) return
    setCurrentPage(Math.max(1, Math.min(numPages, page)))
  }

  const handleDelete = async () => {
    if (!confirm(`Delete “${documentItem.title}”? This cannot be undone.`)) return
    try {
       const { apiClient } = await import('@/lib/api/client')
       const res = await apiClient.delete(`/library/documents/${documentItem._id}`)
       if (res.data?.success) {
         onDeleted(documentItem._id)
         onClose()
       }
    } catch (err) {
       console.error('[PDFViewer] Failed to delete:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 p-2 sm:p-6">
      <div
        className={`h-full rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${isFullscreen ? 'w-full' : 'mx-auto max-w-6xl'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3 dark:border-slate-700 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-base">{documentItem.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{percentage}% read</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {onEditDetails && (
              <button
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={onEditDetails}
                type="button"
                title="Edit title & subject"
              >
                <Pencil size={18} />
              </button>
            )}
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={onClose}
              type="button"
            >
              <X size={18} />
            </button>
            <a
              href={documentItem.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Download size={18} />
            </a>
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-800"
              onClick={handleDelete}
              type="button"
            >
              <Trash2 size={18} />
            </button>
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setIsFullscreen((v) => !v)}
              type="button"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>

        <div className="h-[calc(100%-114px)] overflow-auto bg-slate-100 p-3 dark:bg-slate-950 sm:p-6">
          {/* Loading state */}
          {isPdfLoading && !errorStatus && (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#5B4CF5] border-t-transparent" />
            </div>
          )}

          {/* Error state */}
          {errorStatus && (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
              <div className="mb-4 rounded-full bg-red-50 p-3 dark:bg-red-900/20">
                <X className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Could not load PDF</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{errorStatus}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Reload Page
              </button>
            </div>
          )}

          {/* PDF document */}
          {!errorStatus && fileSource && (
            <Document
              file={fileSource}
              onLoadSuccess={({ numPages: pages }) => {
                setNumPages(pages)
                setCurrentPage((prev) => Math.min(prev, pages))
              }}
              onLoadError={(err) => {
                console.error('[PDFViewer] react-pdf load error:', err)
                setErrorStatus('Failed to render PDF. Try downloading it instead.')
              }}
              loading={""}
            >
              <div className="mx-auto w-fit rounded-md bg-white p-2 shadow dark:bg-slate-800">
                <Page pageNumber={currentPage} width={pageWidth} />
              </div>
            </Document>
          )}
        </div>

        <div className="border-t border-slate-200 px-3 py-3 dark:border-slate-700 sm:px-5">
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full transition-all" style={{ width: `${percentage}%`, background: documentItem.coverColor || '#5B4CF5' }} />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              type="button"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage} / {numPages || '-'} {isSaving ? '• Saving...' : ''}
            </div>
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
              onClick={() => goToPage(currentPage + 1)}
              disabled={!numPages || currentPage >= numPages}
              type="button"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
