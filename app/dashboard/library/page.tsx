'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText, Search, Upload } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import dynamic from 'next/dynamic'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getFirebaseToken } from '@/lib/store/authStore'

const PDFViewer = dynamic(() => import('@/components/library/PDFViewer'), { ssr: false })

type LibraryDocument = {
  _id: string
  title: string
  subject?: string
  fileUrl: string
  fileSize?: number
  coverColor?: string
  pages?: number
  progress?: {
    currentPage: number
    percentage: number
    lastReadAt?: string | null
  }
}

const DEFAULT_COVER = '#5B4CF5'

export default function LibraryPage() {
  const [documents, setDocuments] = useState<LibraryDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<LibraryDocument | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      const token = await getFirebaseToken()
      const res = await fetch('/api/backend/library/documents', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data?.success) setDocuments(data.documents || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDocuments()
  }, [fetchDocuments])

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return documents
    return documents.filter((doc) => {
      const title = doc.title?.toLowerCase() || ''
      const subject = doc.subject?.toLowerCase() || ''
      return title.includes(term) || subject.includes(term)
    })
  }, [documents, search])

  return (
    <ProtectedRoute>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Study Library</h1>
            <p className="text-sm text-slate-500">Upload PDFs, read in-app, and track progress.</p>
          </div>
          <button onClick={() => setShowUpload(true)} type="button" className="inline-flex items-center gap-2 rounded-xl bg-[#5B4CF5] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
            <Upload size={16} /> Upload
          </button>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or subject..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-[#5B4CF5]/30 transition focus:ring"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <FileText size={38} className="mx-auto mb-3 text-slate-300" />
            <h2 className="text-lg font-semibold text-slate-900">No documents yet</h2>
            <p className="mt-1 text-sm text-slate-500">Upload a PDF to start building your study library.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredDocuments.map((doc) => (
              <article key={doc._id} className="overflow-hidden rounded-2xl border-[1.5px] border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-[#5B4CF5] hover:shadow-[0_4px_16px_rgba(91,76,245,0.12)]">
                <div className="h-2" style={{ backgroundColor: doc.coverColor || DEFAULT_COVER }} />
                <div className="p-4">
                  <FileText size={22} className="mb-3 text-slate-700" />
                  <h3 className="mb-1 line-clamp-2 text-base font-bold text-slate-900">{doc.title}</h3>
                  <p className="mb-3 line-clamp-1 text-xs text-slate-400">{doc.subject || 'General'}</p>
                  <p className="mb-2 text-xs font-medium text-slate-600">Progress: {doc.progress?.percentage || 0}%</p>
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full transition-all" style={{ width: `${doc.progress?.percentage || 0}%`, background: doc.coverColor || DEFAULT_COVER }} />
                  </div>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setSelectedDocument(doc)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[#5B4CF5] hover:bg-[#5B4CF5]/10">Open</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onUploaded={(doc) => {
              setDocuments((prev) => [doc, ...prev])
              setShowUpload(false)
            }}
          />
        )}

        {selectedDocument && (
          <PDFViewer
            documentItem={selectedDocument}
            onClose={() => setSelectedDocument(null)}
            onDeleted={(id) => setDocuments((prev) => prev.filter((doc) => doc._id !== id))}
            onProgressSaved={(id, currentPage, percentage) => {
              setDocuments((prev) =>
                prev.map((doc) =>
                  doc._id === id
                    ? { ...doc, progress: { currentPage, percentage, lastReadAt: new Date().toISOString() } }
                    : doc
                )
              )
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void
  onUploaded: (document: LibraryDocument) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [coverColor, setCoverColor] = useState(DEFAULT_COVER)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((accepted: File[]) => {
    const selected = accepted?.[0]
    if (!selected) return
    setFile(selected)
    setTitle(selected.name.replace(/\.pdf$/i, ''))
    setError('')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
  })

  const upload = async () => {
    if (!file) return setError('Select a PDF file.')
    if (!title.trim()) return setError('Enter a document title.')
    setUploading(true)
    setError('')
    const token = await getFirebaseToken()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title.trim())
    formData.append('subject', subject.trim())
    formData.append('coverColor', coverColor)

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/backend/library/documents')
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100))
      }
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300 && data.success) {
            onUploaded(data.document)
            resolve()
          } else {
            reject(new Error(data?.error || 'Upload failed'))
          }
        } catch {
          reject(new Error('Unexpected upload response'))
        }
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.send(formData)
    }).catch((err: Error) => setError(err.message))

    setUploading(false)
  }

  return (
    <div className="fixed inset-0 z-[65] bg-black/55 p-3" onClick={onClose}>
      <div className="mx-auto mt-8 w-full max-w-xl rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Upload Document</h3>
        <div {...getRootProps()} className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center ${isDragActive ? 'border-[#5B4CF5] bg-[#5B4CF5]/5' : 'border-slate-300'}`}>
          <input {...getInputProps()} />
          <Upload size={28} className="mx-auto mb-2 text-slate-500" />
          <p className="text-sm font-medium text-slate-700">Drag and drop PDF, or click to choose</p>
          {file && <p className="mt-2 text-xs text-slate-500">{file.name}</p>}
        </div>

        <div className="mt-4 grid gap-3">
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#5B4CF5]/30 focus:ring" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <input className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-[#5B4CF5]/30 focus:ring" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional)" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Cover color</span>
            <input type="color" value={coverColor} onChange={(e) => setCoverColor(e.target.value)} className="h-9 w-14 cursor-pointer rounded border border-slate-200 p-1" />
          </div>
          {uploading && (
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-[#5B4CF5] transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700" onClick={onClose} type="button">Cancel</button>
          <button className="rounded-xl bg-[#5B4CF5] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={upload} disabled={uploading} type="button">
            {uploading ? `Uploading ${progress}%` : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
