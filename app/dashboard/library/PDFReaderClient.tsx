'use client'

// @ts-nocheck

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { getFirebaseToken, waitForAuth } from '@/lib/store/authStore'
import { PDF_WORKER_PUBLIC_PATH } from '@/lib/utils/pdfWorkerSrc'

// 3D book cover palette (monochrome shades only)
const BOOK_COLORS = [
  { bg: '#0F172A', light: '#FFFFFF', label: 'Primary' },
  { bg: '#1E293B', light: '#F7F7F7', label: 'Slate' },
  { bg: '#334155', light: '#F7F7F7', label: 'Steel' },
  { bg: '#475569', light: '#F7F7F7', label: 'Gray' },
  { bg: '#64748B', light: '#F7F7F7', label: 'Muted' },
  { bg: '#374151', light: '#F7F7F7', label: 'Dark Gray' },
  { bg: '#1F2937', light: '#F7F7F7', label: 'Near-black' },
  { bg: '#111827', light: '#F7F7F7', label: 'Charcoal' },
  { bg: '#292524', light: '#F7F7F7', label: 'Warm Gray' },
  { bg: '#1C1917', light: '#F7F7F7', label: 'Deep Charcoal' },
]

const getToken = async (forceRefresh = false) => {
  return await getFirebaseToken(forceRefresh)
}

pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_PUBLIC_PATH

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
  // Hard stop flag — once set, the effect will NEVER retry the fetch
  const [pdfFetchFailed, setPdfFetchFailed] = useState(false)
  const [pdfData, setPdfData] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // Load PDF via backend proxy to avoid Cloudinary CORS
  useEffect(() => {
    // Hard stop — if a previous fetch already failed, never attempt again
    if (pdfFetchFailed) return

    let isMounted = true
    // Declare objectUrl here so it is in scope for both the assignment and cleanup
    let objectUrl = ''

    const loadPdf = async () => {
      try {
        // Wait for Firebase auth to settle before fetching — eliminates the
        // race condition on first render that causes a 401 (no token yet).
        await waitForAuth()
        const token = await getToken()

        if (!token) {
          if (isMounted) {
            setPdfFetchFailed(true)
            setFetchError(true)
            setLoading(false)
          }
          return
        }

        let response = await fetch(`/api/backend/library/proxy-pdf/${material._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (response.status === 401) {
          const newToken = await getToken(true)
          if (newToken) {
            response = await fetch(`/api/backend/library/proxy-pdf/${material._id}`, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            })
          }
        }

        if (response.status === 401) {
          // Do NOT redirect — redirecting causes a remount which restarts the loop.
          // Show a static error message instead.
          if (isMounted) {
            setPdfFetchFailed(true)
            setFetchError(true)
            setLoading(false)
          }
          return
        }

        if (!response.ok) {
          throw new Error('Failed to load document. Please try again.')
        }

        const arrayBuffer = await response.arrayBuffer()
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
        // Fix: previously `objectUrl` was assigned without being declared, causing a
        // ReferenceError in ES module strict mode and silently failing the fetch.
        objectUrl = URL.createObjectURL(blob)

        if (isMounted) {
          setPdfData(objectUrl)
          setLoading(false)
          setFetchError(false)
        }
      } catch (err: any) {
        console.error(`[PDF Load] Failed:`, err.message);
        if (isMounted) {
          setPdfFetchFailed(true)
          setFetchError(true)
          setLoading(false)
        }
      }
    }

    loadPdf()

    return () => {
      isMounted = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
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
                  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
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

