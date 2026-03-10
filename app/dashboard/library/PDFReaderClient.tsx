'use client'

// @ts-nocheck

import { useState, useRef } from 'react'
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

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({})

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
    <div className="lib-reader-overlay">
      <div className="lib-reader">
        {/* Top bar */}
        <div
          className="lib-reader-bar"
          style={{ borderBottom: `3px solid ${material.color}` }}
        >
          <button className="lib-reader-back" onClick={handleClose} type="button">
            <ArrowLeft size={18} />
            <span>Back to Library</span>
          </button>

          <div className="lib-reader-title-wrap">
            <div
              className="lib-reader-dot"
              style={{ background: material.color }}
            />
            <span className="lib-reader-title">{material.title}</span>
            {material.subject && (
              <span className="lib-reader-sub">— {material.subject}</span>
            )}
          </div>

          <div className="lib-reader-right">
            {/* Page navigation */}
            {numPages && (
              <div className="lib-reader-nav">
                <button
                  className="lib-reader-nav-btn"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  type="button"
                >
                  ‹
                </button>
                <span className="lib-reader-page-info">
                  <input
                    className="lib-reader-page-input"
                    type="number"
                    min={1}
                    max={numPages}
                    value={currentPage}
                    onChange={(e) => goToPage(parseInt(e.target.value || '1', 10) || 1)}
                  />
                  <span>/ {numPages}</span>
                </span>
                <button
                  className="lib-reader-nav-btn"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= numPages}
                  type="button"
                >
                  ›
                </button>
              </div>
            )}

            {/* Zoom */}
            <div className="lib-reader-zoom">
              <button
                className="lib-reader-nav-btn"
                onClick={() => setScale((s: number) => Math.max(0.7, s - 0.2))}
                type="button"
              >
                −
              </button>
              <span className="lib-reader-zoom-label">{Math.round(scale * 100)}%</span>
              <button
                className="lib-reader-nav-btn"
                onClick={() => setScale((s: number) => Math.min(2.5, s + 0.2))}
                type="button"
              >
                +
              </button>
            </div>

            {/* Progress badge */}
            {numPages && (
              <span
                className="lib-reader-progress-badge"
                style={{ background: colorObj.bg + '22', color: colorObj.bg }}
              >
                {Math.round((currentPage / numPages) * 100)}%
              </span>
            )}

            <a
              href={material.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="lib-reader-download"
            >
              Download
            </a>
          </div>
        </div>

        {/* Reader body */}
        <div
          className="lib-reader-body"
          ref={containerRef}
          onScroll={handleScroll}
        >
          {/* Loading */}
          {loading && (
            <div className="lib-reader-loading">
              <div
                className="lib-reader-spinner"
                style={{ borderTopColor: material.color }}
              />
              <p>Loading PDF...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="lib-reader-error">
              <BookOpen size={44} color="#4B5563" />
              <h3>Couldn&apos;t load this PDF</h3>
              <p>Try downloading it to read offline.</p>
              <a
                href={material.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="lib-upload-submit"
                style={{
                  background: material.color,
                  textDecoration: 'none',
                  maxWidth: 220,
                  padding: '12px 24px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Download PDF
              </a>
            </div>
          )}

          {/* PDF Document */}
          {!error && (
            <Document
              file={material.fileUrl}
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
                    className="lib-pdf-page-wrap"
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

