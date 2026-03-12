'use client'

// @ts-nocheck

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { getFirebaseToken } from '@/lib/store/authStore'

const BOOK_COLORS = [
  { bg: '#4F46E5', light: '#EEF2FF', label: 'Indigo' },
  { bg: '#DC2626', light: '#FEF2F2', label: 'Red' },
  { bg: '#059669', light: '#ECFDF5', label: 'Green' },
  { bg: '#D97706', light: '#FEF3C7', label: 'Amber' },
  { bg: '#7C3AED', light: '#F5F3FF', label: 'Purple' },
  { bg: '#0891B2', light: '#ECFEFF', label: 'Cyan' },
  { bg: '#BE185D', light: '#FDF2F8', label: 'Pink' },
  { bg: '#EA580C', light: '#FFF7ED', label: 'Orange' },
  { bg: '#0D9488', light: '#F0FDFA', label: 'Teal' },
  { bg: '#4338CA', light: '#EEF2FF', label: 'Blue' },
]

const getToken = async () => {
  return await getFirebaseToken()
}

// Worker config that works dynamically for v3 (.js) and v4 (.mjs)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.${pdfjs.version.startsWith('3') ? 'js' : 'mjs'
  }`

type PDFReaderProps = {
  material: any
  onClose: () => void
  onProgressSaved: (id: string, page: number, progress: number) => void
}

const PDFReader = ({ material, onClose, onProgressSaved }: PDFReaderProps) => {
  const colorObj = BOOK_COLORS.find((c) => c.bg === material.color) || BOOK_COLORS[0]
  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(material.lastReadPage || 1)
  const [scale, setScale] = useState<number>(1.2)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)
  const [fetchError, setFetchError] = useState<boolean>(false)
  const [pdfData, setPdfData] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // Load PDF via backend proxy to avoid Cloudinary CORS
  useEffect(() => {
    let isMounted = true

    const loadPdf = async () => {
      try {
        const token = await getToken()
        console.log('[PDF] Fetching proxy for:', material._id)

        const response = await fetch(`/api/library/proxy-pdf/${material._id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        console.log('[PDF] Proxy response status:', response.status)

        if (!response.ok) {
          let errData: any = null
          try {
            errData = await response.json()
          } catch {
            // ignore JSON parse errors
          }
          if (errData) {
            console.error('[PDF] Proxy error:', errData)
          }
          throw new Error(errData?.error || 'Failed to load PDF')
        }

        const blob = await response.blob()
        console.log('[PDF] Blob size:', blob.size, 'type:', blob.type)

        const url = URL.createObjectURL(blob)
        if (!isMounted) {
          URL.revokeObjectURL(url)
          return
        }
        setPdfData(url)
        setLoading(false)
      } catch (err) {
        console.error('[PDF Load] Final error:', (err as any)?.message || err)
        if (!isMounted) return
        setFetchError(true)
        setLoading(false)
      }
    }

    loadPdf()

    return () => {
      isMounted = false
      if (pdfData) {
        URL.revokeObjectURL(pdfData)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material._id])

  const onDocumentLoadSuccess = ({ numPages: total }: { numPages: number }) => {
    setNumPages(total)
    setLoading(false)
  }

  const onDocumentLoadError = (err: unknown) => {
    console.error('PDF load error:', err)
    setError(true)
    setLoading(false)
  }

  const goToPage = (page: number) => {
    const safeTotal = numPages || 1
    const p = Math.max(1, Math.min(page, safeTotal))
    setCurrentPage(p)
    const el = pageRefs.current[p]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleScroll = () => {
    if (!containerRef.current || !numPages) return
    const scrollTop = containerRef.current.scrollTop
    const containerHeight = containerRef.current.clientHeight
    const center = scrollTop + containerHeight / 2

    let closest = 1
    let minDist = Infinity
    Object.entries(pageRefs.current).forEach(([pageNum, el]) => {
      if (!el) return
      const mid = el.offsetTop + el.clientHeight / 2
      const dist = Math.abs(center - mid)
      if (dist < minDist) {
        minDist = dist
        closest = parseInt(pageNum, 10)
      }
    })
    setCurrentPage(closest)
  }

  const handleClose = async () => {
    try {
      const token = await getToken()
      const progress = numPages ? Math.round((currentPage / numPages) * 100) : 0
      await fetch(`/api/backend/library/${material._id}/progress`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastReadPage: currentPage,
          readProgress: progress,
        }),
      })
      onProgressSaved?.(material._id, currentPage, progress)
    } catch (err) {
      console.error(err)
    }
    onClose()
  }

  return (
    <div className="lib-reader-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="lib-reader w-full h-full max-w-6xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative">
        {/* Top bar */}
        <div
          className="lib-reader-bar flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b relative z-10"
          style={{ borderBottom: `3px solid ${material.color}` }}
        >
          <button className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" onClick={handleClose} type="button">
            <ArrowLeft size={20} />
            <span className="font-medium hidden sm:inline">Back to Library</span>
          </button>

          <div className="flex flex-1 items-center justify-center px-4 overflow-hidden">
            <div
              className="w-2 h-2 rounded-full mr-3 shrink-0"
              style={{ background: material.color }}
            />
            <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">{material.title}</span>
            {material.subject && (
              <span className="text-gray-500 text-sm ml-2 shrink-0 hidden md:inline">— {material.subject}</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Page navigation */}
            {numPages && (
              <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600 shadow-sm">
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 text-xl text-gray-600 dark:text-gray-300"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  type="button"
                >
                  ‹
                </button>
                <div className="flex items-center gap-1 font-medium text-sm text-gray-600 dark:text-gray-300">
                  <input
                    className="w-12 text-center bg-transparent outline-none font-bold text-gray-900 dark:text-white no-spinners"
                    type="number"
                    min={1}
                    max={numPages}
                    value={currentPage}
                    onChange={(e) => goToPage(parseInt(e.target.value || '1', 10) || 1)}
                  />
                  <span>/ {numPages}</span>
                </div>
                <button
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 text-xl text-gray-600 dark:text-gray-300"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= numPages}
                  type="button"
                >
                  ›
                </button>
              </div>
            )}

            {/* Zoom */}
            <div className="hidden lg:flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600 shadow-sm">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 text-lg text-gray-600 dark:text-gray-300"
                onClick={() => setScale((s: number) => Math.max(0.7, s - 0.2))}
                type="button"
              >
                −
              </button>
              <span className="text-sm font-medium w-12 text-center text-gray-700 dark:text-gray-300">{Math.round(scale * 100)}%</span>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 text-lg text-gray-600 dark:text-gray-300"
                onClick={() => setScale((s: number) => Math.min(2.5, s + 0.2))}
                type="button"
              >
                +
              </button>
            </div>

            {/* Progress badge */}
            {numPages && (
              <span
                className="px-3 py-1.5 rounded-full font-bold text-xs"
                style={{ background: colorObj.bg + '22', color: colorObj.bg }}
              >
                {Math.round((currentPage / numPages) * 100)}%
              </span>
            )}

            <a
              href={material.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:block text-sm font-semibold rounded-lg px-4 py-2 text-white shadow-md transition-all hover:opacity-90 active:scale-95"
              style={{ background: material.color }}
            >
              Raw File
            </a>
          </div>
        </div>

        {/* Reader body */}
        <div
          className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950 p-4 sm:p-8"
          ref={containerRef}
          onScroll={handleScroll}
        >
          {/* Loading */}
          {loading && !fetchError && (
            <div className="flex flex-col items-center justify-center h-full">
              <div
                className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin mb-4"
                style={{ borderTopColor: material.color }}
              />
              <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading PDF Document...</p>
            </div>
          )}

          {/* Error */}
          {(error || fetchError) && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
              <BookOpen size={48} className="text-gray-400 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Couldn&apos;t load this PDF</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Try downloading it to read offline.</p>
              <a
                href={material.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
                style={{ background: material.color }}
              >
                Download PDF
              </a>
            </div>
          )}

          {/* PDF Document */}
          {!error && !fetchError && pdfData && (
            <div className="flex flex-col items-center gap-6 w-full pb-12">
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
                options={{
                  cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
                  cMapPacked: true,
                }}
              >
                {numPages &&
                  Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
                    <div
                      key={page}
                      ref={(el) => {
                        pageRefs.current[page] = el
                      }}
                      className="lib-pdf-page-wrap mb-6 shadow-md rounded-md overflow-hidden"
                    >
                      <Page
                        pageNumber={page}
                        scale={scale}
                        renderTextLayer
                        renderAnnotationLayer
                        loading=""
                      />
                      <div className="lib-pdf-page-num">{page}</div>
                    </div>
                  ))}
              </Document>
            </div>
          )}
        </div>

        {/* Bottom progress bar */}
        {numPages && (
          <div className="lib-reader-footer">
            <div className="lib-reader-footer-bar">
              <div
                className="lib-reader-footer-fill"
                style={{
                  width: `${(currentPage / numPages) * 100}%`,
                  background: material.color,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PDFReader

