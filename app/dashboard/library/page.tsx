'use client'

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { FileText, Pencil, Search, Trash2, Upload } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import dynamic from 'next/dynamic'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getFirebaseToken } from '@/lib/store/authStore'
import AdBanner from '@/components/AdBanner'

const PDFViewer = dynamic(() => import('@/components/library/PDFViewer'), { ssr: false })

export type LibraryDocument = {
  _id: string
  title: string
  subject?: string
  fileUrl: string
  fileType?: string
  originalName?: string
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
  const [editingDocument, setEditingDocument] = useState<LibraryDocument | null>(null)

  const handleProgressSaved = useCallback((id: string, currentPage: number, percentage: number) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc._id === id
          ? { ...doc, progress: { currentPage, percentage, lastReadAt: new Date().toISOString() } }
          : doc
      )
    )
  }, [])
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

  const handleDeleteFromGrid = async (doc: LibraryDocument, e: MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete “${doc.title}”? This cannot be undone.`)) return
    try {
      const token = await getFirebaseToken()
      const res = await fetch(`/api/backend/library/documents/${doc._id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data?.success) {
        setDocuments((prev) => prev.filter((d) => d._id !== doc._id))
        if (selectedDocument?._id === doc._id) setSelectedDocument(null)
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Study Library</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Upload PDFs, Word, PPT, text, and images; read and reuse in Question Generator.</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#5B4CF5] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Upload size={16} /> Upload
          </button>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or subject..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none ring-[#5B4CF5]/30 transition focus:ring dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <AdBanner className="mb-6" />

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-600 dark:bg-slate-800/80">
            <FileText size={38} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">No documents yet</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Upload a PDF to start building your study library.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredDocuments.map((doc) => (
              <article
                key={doc._id}
                className="overflow-hidden rounded-2xl border-[1.5px] border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-[#5B4CF5] hover:shadow-[0_4px_16px_rgba(91,76,245,0.12)] dark:border-slate-700 dark:bg-slate-800 dark:hover:border-[#7c6cf0] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.35)]"
              >
                <div className="h-2" style={{ backgroundColor: doc.coverColor || DEFAULT_COVER }} />
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <FileText size={22} className="shrink-0 text-slate-700 dark:text-slate-300" />
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingDocument(doc)
                        }}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={(e) => void handleDeleteFromGrid(doc, e)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="mb-1 line-clamp-2 text-base font-bold text-slate-900 dark:text-white">{doc.title}</h3>
                  <p className="mb-3 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{doc.subject || 'General'}</p>
                  <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    Progress: {doc.progress?.percentage || 0}%
                  </p>
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${doc.progress?.percentage || 0}%`, background: doc.coverColor || DEFAULT_COVER }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if ((doc.fileType || '').toLowerCase().includes('pdf')) {
                          setSelectedDocument(doc)
                        } else {
                          window.open(doc.fileUrl, '_blank', 'noopener,noreferrer')
                        }
                      }}
                      className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[#5B4CF5] hover:bg-[#5B4CF5]/10 dark:text-[#a599ff] dark:hover:bg-[#5B4CF5]/20"
                    >
                      Open
                    </button>
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

        {editingDocument && (
          <EditDocumentModal
            document={editingDocument}
            onClose={() => setEditingDocument(null)}
            onSaved={(updated) => {
              setDocuments((prev) => prev.map((d) => (d._id === updated._id ? { ...d, ...updated } : d)))
              setSelectedDocument((sel) => (sel && sel._id === updated._id ? { ...sel, ...updated } : sel))
              setEditingDocument(null)
            }}
          />
        )}

        {selectedDocument && (
          <PDFViewer
            documentItem={selectedDocument}
            onClose={() => setSelectedDocument(null)}
            onEditDetails={() => {
              setEditingDocument(selectedDocument)
              setSelectedDocument(null)
            }}
            onDeleted={(id) => setDocuments((prev) => prev.filter((doc) => doc._id !== id))}
            onProgressSaved={handleProgressSaved}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

function EditDocumentModal({
  document,
  onClose,
  onSaved,
}: {
  document: LibraryDocument
  onClose: () => void
  onSaved: (doc: LibraryDocument) => void
}) {
  const [title, setTitle] = useState(document.title)
  const [subject, setSubject] = useState(document.subject || '')
  const [coverColor, setCoverColor] = useState(document.coverColor || DEFAULT_COVER)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!title.trim()) return setError('Title is required.')
    setSaving(true)
    setError('')
    try {
      const token = await getFirebaseToken()
      const res = await fetch(`/api/backend/library/documents/${document._id}`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          coverColor,
        }),
      })
      const data = await res.json()
      if (data?.success && data.document) {
        onSaved(data.document as LibraryDocument)
      } else {
        setError(data?.error || 'Could not save changes.')
      }
    } catch {
      setError('Network error.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[65] bg-black/55 p-3" onClick={onClose}>
      <div
        className="mx-auto mt-8 w-full max-w-xl rounded-2xl bg-white p-5 dark:bg-slate-800 dark:ring-1 dark:ring-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Edit document</h3>
        <div className="grid gap-3">
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[#5B4CF5]/30 focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[#5B4CF5]/30 focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
          />
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">Cover color</span>
            <input
              type="color"
              value={coverColor}
              onChange={(e) => setCoverColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border border-slate-200 p-1 dark:border-slate-600"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-[#5B4CF5] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => void save()}
            disabled={saving}
            type="button"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
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
    setTitle(selected.name.replace(/\.[^/.]+$/i, ''))
    setError('')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
  })

  const upload = async () => {
    if (!file) return setError('Select a supported file.')
    if (!title.trim()) return setError('Enter a document title.')
    setUploading(true)
    setError('')

    try {
      const token = await getFirebaseToken()

      // Step 1: Get signed upload signature from backend
      const sigResp = await fetch('/api/backend/library/upload-signature', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const sigData = await sigResp.json()
      if (!sigData.success) throw new Error(sigData.error || 'Failed to prepare upload')

      // Step 2: Upload directly to Cloudinary from browser
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', sigData.apiKey)
      formData.append('timestamp', sigData.timestamp)
      formData.append('signature', sigData.signature)
      formData.append('folder', sigData.folder)

      const cloudUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`

      const uploadResp = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', cloudUrl)
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // We count this as 90% of the total process
            setProgress(Math.round((event.loaded / event.total) * 90))
          }
        }
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText)
            if (xhr.status >= 200 && xhr.status < 300) resolve(data)
            else reject(new Error(data?.error?.message || 'Cloudinary upload failed'))
          } catch {
            reject(new Error('Cloudinary response error'))
          }
        }
        xhr.onerror = () => reject(new Error('Cloudinary network error'))
        xhr.send(formData)
      })

      // Step 3: Send metadata to backend to save record
      setProgress(95)
      const finalizeResp = await fetch('/api/backend/library/finalize-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          coverColor,
          fileUrl: uploadResp.secure_url,
          fileSize: file.size,
          fileType: file.type || 'application/pdf',
          publicId: uploadResp.public_id,
          originalName: file.name,
        }),
      })

      const finalizeData = await finalizeResp.json()
      if (!finalizeData.success) throw new Error(finalizeData.error || 'Failed to save document record')

      setProgress(100)
      onUploaded(finalizeData.document)
    } catch (err: any) {
      console.error('[Library] Direct upload error:', err)
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[65] bg-black/55 p-3" onClick={onClose}>
      <div
        className="mx-auto mt-8 w-full max-w-xl rounded-2xl bg-white p-5 dark:bg-slate-800 dark:ring-1 dark:ring-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Upload Document</h3>
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center dark:border-slate-600 ${
            isDragActive ? 'border-[#5B4CF5] bg-[#5B4CF5]/5 dark:bg-[#5B4CF5]/10' : 'border-slate-300'
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={28} className="mx-auto mb-2 text-slate-500 dark:text-slate-400" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Drag and drop document, or click to choose</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">PDF, DOC/DOCX, PPT/PPTX, TXT/MD, JPG/PNG/WEBP</p>
          {file && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{file.name}</p>}
        </div>

        <div className="mt-4 grid gap-3">
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[#5B4CF5]/30 focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[#5B4CF5]/30 focus:ring dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional)"
          />
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">Cover color</span>
            <input
              type="color"
              value={coverColor}
              onChange={(e) => setCoverColor(e.target.value)}
              className="h-9 w-14 cursor-pointer rounded border border-slate-200 p-1 dark:border-slate-600"
            />
          </div>
          {uploading && (
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div className="h-full bg-[#5B4CF5] transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-600 dark:text-slate-300"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-[#5B4CF5] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={upload}
            disabled={uploading}
            type="button"
          >
            {uploading ? `Uploading ${progress}%` : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
