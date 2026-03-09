'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import BackButton from '@/components/BackButton'
import { getFirebaseToken } from '@/lib/store/authStore'
import {
  Upload,
  Search,
  Folder,
  Star,
  StarOff,
  FileText,
  Trash2,
  Edit2,
  Eye,
  X,
  Plus,
  BookOpen,
  HardDrive,
  Grid,
  List,
} from 'lucide-react'

const EXAM_TYPES = ['All', 'JAMB', 'WAEC', 'NECO', 'Post-UTME', 'University', 'Professional', 'Other']
const FOLDER_COLORS = ['#4F46E5', '#059669', '#DC2626', '#D97706', '#7C3AED', '#0891B2', '#BE185D', '#374151']

interface LibraryMaterial {
  _id: string
  title: string
  description?: string
  subject?: string
  topic?: string
  tags?: string[]
  folder: string
  fileUrl: string
  publicId: string
  fileSize: number
  pageCount?: number
  color: string
  isFavourite: boolean
  lastReadPage?: number
  readProgress?: number
  examType: string
}

interface StorageInfo {
  usedBytes: number
  usedMB: string
  limitMB: number
  percentage: number
}

type ViewMode = 'grid' | 'list'

export default function LibraryPage() {
  const [materials, setMaterials] = useState<LibraryMaterial[]>([])
  const [folders, setFolders] = useState<string[]>(['All'])
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('grid')
  const [activeFolder, setActiveFolder] = useState<string>('All')
  const [activeExam, setActiveExam] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [showReader, setShowReader] = useState<LibraryMaterial | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<LibraryMaterial | null>(null)
  const [showFavourites, setShowFavourites] = useState(false)

  const getToken = async () => {
    return await getFirebaseToken()
  }

  const fetchMaterials = useCallback(async () => {
    try {
      const token = await getToken()
      const params = new URLSearchParams()
      if (activeFolder && activeFolder !== 'All') params.append('folder', activeFolder)
      if (activeExam && activeExam !== 'All') params.append('examType', activeExam)
      if (search) params.append('search', search)
      if (showFavourites) params.append('favourite', 'true')

      const res = await fetch(`/api/backend/library?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        setMaterials(data.materials || [])
        setFolders(['All', ...(data.folders || [])])
        setStorage(data.storage || null)
      }
    } catch (err) {
      console.error('Library fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeFolder, activeExam, search, showFavourites])

  useEffect(() => {
    const debounce = setTimeout(() => {
      void fetchMaterials()
    }, 300)
    return () => clearTimeout(debounce)
  }, [fetchMaterials])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this material? This cannot be undone.')) return
    try {
      const token = await getToken()
      await fetch(`/api/backend/library/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setMaterials((prev) => prev.filter((m) => m._id !== id))
    } catch (err) {
      console.error('Delete material error:', err)
    }
  }

  const handleToggleFavourite = async (material: LibraryMaterial) => {
    try {
      const token = await getToken()
      const updated = !material.isFavourite
      await fetch(`/api/backend/library/${material._id}`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavourite: updated }),
      })
      setMaterials((prev) =>
        prev.map((m) => (m._id === material._id ? { ...m, isFavourite: updated } : m))
      )
    } catch (err) {
      console.error('Toggle favourite error:', err)
    }
  }

  return (
    <ProtectedRoute>
      <div className="library-page">
        <BackButton label="Dashboard" href="/dashboard/student" />

        {/* Header */}
        <div className="library-header">
          <div>
            <h1>My Study Library</h1>
            <p>Upload, organise and read your PDF study materials</p>
          </div>
          <button className="upload-trigger-btn" onClick={() => setShowUpload(true)}>
            <Upload size={16} /> Upload PDF
          </button>
        </div>

        {/* Storage Bar */}
        {storage && (
          <div className="storage-bar-card">
            <div className="storage-info">
              <HardDrive size={16} color="#4F46E5" />
              <span>Storage Used</span>
              <strong>
                {storage.usedMB} MB / {storage.limitMB} MB
              </strong>
              {storage.percentage >= 80 && (
                <span className="storage-warning">
                  {storage.percentage >= 100 ? '⚠️ Full!' : `⚠️ ${storage.percentage}% used`}
                </span>
              )}
            </div>
            <div className="storage-track">
              <div
                className="storage-fill"
                style={{
                  width: `${Math.min(storage.percentage, 100)}%`,
                  background:
                    storage.percentage >= 90 ? '#DC2626' : storage.percentage >= 70 ? '#D97706' : '#4F46E5',
                }}
              />
            </div>
            {storage.limitMB === 50 && (
              <button
                className="storage-upgrade-btn"
                onClick={() => {
                  window.location.href = '/dashboard/pricing'
                }}
              >
                Upgrade for 500MB →
              </button>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="library-toolbar">
          <div className="lib-search-wrap">
            <Search size={15} />
            <input
              className="lib-search"
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="lib-search-clear" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <button
            className={`fav-toggle ${showFavourites ? 'active' : ''}`}
            onClick={() => setShowFavourites(!showFavourites)}
            title="Show favourites"
          >
            <Star size={16} />
          </button>

          <div className="view-toggle">
            <button
              className={view === 'grid' ? 'active' : ''}
              onClick={() => setView('grid')}
              type="button"
            >
              <Grid size={15} />
            </button>
            <button
              className={view === 'list' ? 'active' : ''}
              onClick={() => setView('list')}
              type="button"
            >
              <List size={15} />
            </button>
          </div>
        </div>

        <div className="library-body">
          {/* Sidebar */}
          <div className="library-sidebar">
            <div className="lib-sidebar-section">
              <span className="lib-sidebar-label">Folders</span>
              {folders.map((f) => (
                <button
                  key={f}
                  className={`lib-folder-btn ${activeFolder === f ? 'active' : ''}`}
                  onClick={() => setActiveFolder(f)}
                  type="button"
                >
                  <Folder size={14} />
                  <span>{f}</span>
                  <span className="folder-count">
                    {f === 'All'
                      ? materials.length
                      : materials.filter((m) => m.folder === f).length}
                  </span>
                </button>
              ))}
              <button
                className="new-folder-btn"
                type="button"
                onClick={() => {
                  const name = window.prompt('New folder name:')
                  if (name) setFolders((prev) => [...prev, name])
                }}
              >
                <Plus size={13} /> New Folder
              </button>
            </div>

            <div className="lib-sidebar-section">
              <span className="lib-sidebar-label">Exam Type</span>
              {EXAM_TYPES.map((type) => (
                <button
                  key={type}
                  className={`lib-filter-btn ${activeExam === type ? 'active' : ''}`}
                  onClick={() => setActiveExam(type)}
                  type="button"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div className="library-content">
            {loading ? (
              <div className="lib-loading">Loading your library...</div>
            ) : materials.length === 0 ? (
              <div className="lib-empty">
                <BookOpen size={48} color="#E5E7EB" />
                <h3>{search ? 'No results found' : 'Your library is empty'}</h3>
                <p>
                  {search
                    ? 'Try a different search term'
                    : 'Upload your first PDF to get started'}
                </p>
                {!search && (
                  <button
                    className="upload-trigger-btn"
                    onClick={() => setShowUpload(true)}
                    type="button"
                  >
                    <Upload size={15} /> Upload PDF
                  </button>
                )}
              </div>
            ) : (
              <div className={`materials-${view}`}>
                {materials.map((material) => (
                  <MaterialCard
                    key={material._id}
                    material={material}
                    view={view}
                    onRead={() => setShowReader(material)}
                    onEdit={() => setEditingMaterial(material)}
                    onDelete={() => handleDelete(material._id)}
                    onToggleFavourite={() => handleToggleFavourite(material)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <UploadModal
            folders={folders.filter((f) => f !== 'All')}
            onClose={() => setShowUpload(false)}
            onUploaded={(material) => {
              setMaterials((prev) => [material, ...prev])
              setShowUpload(false)
            }}
          />
        )}

        {/* PDF Reader Modal */}
        {showReader && (
          <PDFReader
            material={showReader}
            onClose={() => setShowReader(null)}
            onProgressSaved={(id, page, progress) => {
              setMaterials((prev) =>
                prev.map((m) =>
                  m._id === id
                    ? { ...m, lastReadPage: page, readProgress: progress }
                    : m
                )
              )
            }}
          />
        )}

        {/* Edit Modal */}
        {editingMaterial && (
          <EditMaterialModal
            material={editingMaterial}
            folders={folders.filter((f) => f !== 'All')}
            onClose={() => setEditingMaterial(null)}
            onSaved={(updated) => {
              setMaterials((prev) =>
                prev.map((m) => (m._id === updated._id ? updated : m))
              )
              setEditingMaterial(null)
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

function MaterialCard({
  material,
  view,
  onRead,
  onEdit,
  onDelete,
  onToggleFavourite,
}: {
  material: LibraryMaterial
  view: ViewMode
  onRead: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleFavourite: () => void
}) {
  const sizeMB = (material.fileSize / (1024 * 1024)).toFixed(1)

  if (view === 'list') {
    return (
      <div className="material-list-row">
        <div
          className="material-list-icon"
          style={{ background: `${material.color}20` }}
        >
          <FileText size={20} color={material.color} />
        </div>
        <div className="material-list-info">
          <span className="material-title">{material.title}</span>
          <div className="material-meta">
            {material.subject && <span>{material.subject}</span>}
            {material.examType !== 'Other' && <span>• {material.examType}</span>}
            <span>• {sizeMB} MB</span>
            {material.readProgress && material.readProgress > 0 && (
              <span className="progress-chip">{material.readProgress}% read</span>
            )}
          </div>
        </div>
        <div className="material-list-actions">
          <button className="lib-action-btn" onClick={onToggleFavourite} type="button">
            {material.isFavourite ? (
              <Star size={15} color="#F59E0B" fill="#F59E0B" />
            ) : (
              <StarOff size={15} color="#9CA3AF" />
            )}
          </button>
          <button
            className="lib-action-btn read"
            onClick={onRead}
            title="Read"
            type="button"
          >
            <Eye size={15} />
          </button>
          <button
            className="lib-action-btn edit"
            onClick={onEdit}
            title="Edit"
            type="button"
          >
            <Edit2 size={15} />
          </button>
          <button
            className="lib-action-btn delete"
            onClick={onDelete}
            title="Delete"
            type="button"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="material-card">
      <div
        className="material-card-top"
        style={{
          background: `linear-gradient(135deg, ${material.color}22, ${material.color}44)`,
        }}
        onClick={onRead}
      >
        <FileText size={36} color={material.color} />
        {material.isFavourite && (
          <Star size={14} color="#F59E0B" fill="#F59E0B" className="fav-star" />
        )}
        {material.readProgress && material.readProgress > 0 && (
          <div className="card-progress-bar">
            <div
              className="card-progress-fill"
              style={{ width: `${material.readProgress}%`, background: material.color }}
            />
          </div>
        )}
      </div>

      <div className="material-card-body">
        <h4 className="material-title" title={material.title}>
          {material.title}
        </h4>
        <div className="material-meta">
          {material.subject && <span className="meta-chip">{material.subject}</span>}
          {material.examType !== 'Other' && (
            <span className="meta-chip exam">{material.examType}</span>
          )}
        </div>
        {material.tags && material.tags.length > 0 && (
          <div className="material-tags">
            {material.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="material-footer">
          <span className="file-size">{sizeMB} MB</span>
          {material.readProgress && material.readProgress > 0 && (
            <span className="read-progress">{material.readProgress}% read</span>
          )}
        </div>
      </div>

      <div className="material-card-actions">
        <button className="lib-action-btn" onClick={onToggleFavourite} type="button">
          {material.isFavourite ? (
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
          ) : (
            <StarOff size={14} color="#9CA3AF" />
          )}
        </button>
        <button className="lib-action-btn read" onClick={onRead} type="button">
          <Eye size={14} /> Read
        </button>
        <button className="lib-action-btn edit" onClick={onEdit} type="button">
          <Edit2 size={14} />
        </button>
        <button className="lib-action-btn delete" onClick={onDelete} type="button">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function UploadModal({
  folders,
  onClose,
  onUploaded,
}: {
  folders: string[]
  onClose: () => void
  onUploaded: (material: LibraryMaterial) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    title: '',
    subject: '',
    topic: '',
    folder: 'General',
    examType: 'Other',
    description: '',
    tags: '',
    color: '#4F46E5',
  })
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (f: File | null | undefined) => {
    if (!f) return
    if (f.type !== 'application/pdf') {
      setError('Only PDF files allowed')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File must be under 20MB')
      return
    }
    setFile(f)
    setError('')
    if (!form.title) {
      setForm((p) => ({ ...p, title: f.name.replace(/\.pdf$/i, '') }))
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file')
      return
    }
    if (!form.title) {
      setError('Please enter a title')
      return
    }

    setUploading(true)
    setError('')

    try {
      const token = await getFirebaseToken()
      const formData = new FormData()
      formData.append('pdf', file)
      Object.entries(form).forEach(([key, val]) => {
        formData.append(key, val as string)
      })

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/backend/library/upload')
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText)
            if (xhr.status === 200 && data.success) {
              onUploaded(data.material)
              resolve()
            } else {
              reject(new Error(data.error || 'Upload failed'))
            }
          } catch (err) {
            reject(err as Error)
          }
        }

        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(formData)
      })
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Upload Study Material</h3>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div
          className={`lib-upload-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files[0])
          }}
          onClick={() => {
            const input = document.getElementById('lib-file-input') as HTMLInputElement | null
            input?.click()
          }}
        >
          <input
            id="lib-file-input"
            type="file"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {file ? (
            <div className="file-selected">
              <FileText size={28} color="#4F46E5" />
              <div>
                <span className="file-name">{file.name}</span>
                <span className="file-size">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              <button
                className="remove-file-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  setProgress(0)
                }}
                type="button"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={28} color="#9CA3AF" />
              <p className="upload-title">Drop PDF here or click to browse</p>
              <p className="upload-sub">Max 20MB per file</p>
            </>
          )}
        </div>

        {uploading && (
          <div className="upload-progress-wrap">
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>{progress}% uploaded</span>
          </div>
        )}

        <div className="upload-form">
          <div className="form-row">
            <div className="form-group">
              <label>Title *</label>
              <input
                className="teacher-input"
                placeholder="e.g. JAMB Chemistry Past Questions"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input
                className="teacher-input"
                placeholder="e.g. Chemistry"
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Folder</label>
              <select
                className="teacher-input"
                value={form.folder}
                onChange={(e) => setForm((p) => ({ ...p, folder: e.target.value }))}
              >
                <option value="General">General</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value="__new__">+ Create new folder</option>
              </select>
            </div>
            <div className="form-group">
              <label>Exam Type</label>
              <select
                className="teacher-input"
                value={form.examType}
                onChange={(e) => setForm((p) => ({ ...p, examType: e.target.value }))}
              >
                {EXAM_TYPES.filter((t) => t !== 'All').map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.folder === '__new__' && (
            <div className="form-group">
              <label>New Folder Name</label>
              <input
                className="teacher-input"
                placeholder="e.g. WAEC Materials"
                onChange={(e) => setForm((p) => ({ ...p, folder: e.target.value }))}
              />
            </div>
          )}

          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input
              className="teacher-input"
              placeholder="e.g. chemistry, organic, 2023"
              value={form.tags}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label>Colour Label</label>
            <div className="color-picker">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-dot ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>

        {error && <div className="tool-error">{error}</div>}

        <button
          className="generate-btn"
          onClick={handleUpload}
          disabled={uploading || !file}
          type="button"
        >
          {uploading ? `Uploading... ${progress}%` : (
            <>
              <Upload size={16} /> Upload Material
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function PDFReader({
  material,
  onClose,
  onProgressSaved,
}: {
  material: LibraryMaterial
  onClose: () => void
  onProgressSaved: (id: string, page: number, progress: number) => void
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [currentPage] = useState<number>(material.lastReadPage || 1)

  const handleClose = async () => {
    try {
      const token = await getFirebaseToken()
      const progress =
        material.pageCount && material.pageCount > 0
          ? Math.round((currentPage / material.pageCount) * 100)
          : material.readProgress || 0

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
      onProgressSaved(material._id, currentPage, progress)
    } catch (err) {
      console.error('Progress save error:', err)
    }
    onClose()
  }

  const pdfUrl = `${material.fileUrl}#page=${currentPage}`

  return (
    <div className="reader-overlay">
      <div className="reader-modal">
        <div className="reader-header">
          <div className="reader-title">
            <FileText size={18} color={material.color} />
            <span>{material.title}</span>
            {material.subject && <span className="reader-subject">— {material.subject}</span>}
          </div>
          <div className="reader-controls">
            <a
              href={material.fileUrl}
              download={material.title}
              className="reader-download-btn"
              target="_blank"
              rel="noreferrer"
            >
              Download
            </a>
            <button className="reader-close-btn" onClick={handleClose} type="button">
              <X size={18} /> Close
            </button>
          </div>
        </div>

        <div className="reader-body">
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className="pdf-iframe"
            title={material.title}
          />
        </div>

        {material.readProgress && material.readProgress > 0 && (
          <div className="reader-footer">
            <span>Last read: Page {material.lastReadPage}</span>
            <div className="reader-progress-bar">
              <div
                className="reader-progress-fill"
                style={{ width: `${material.readProgress}%`, background: material.color }}
              />
            </div>
            <span>{material.readProgress}% complete</span>
          </div>
        )}
      </div>
    </div>
  )
}

function EditMaterialModal({
  material,
  folders,
  onClose,
  onSaved,
}: {
  material: LibraryMaterial
  folders: string[]
  onClose: () => void
  onSaved: (material: LibraryMaterial) => void
}) {
  const [form, setForm] = useState({
    title: material.title,
    subject: material.subject || '',
    topic: material.topic || '',
    folder: material.folder || 'General',
    examType: material.examType || 'Other',
    description: material.description || '',
    tags: material.tags?.join(', ') || '',
    color: material.color || '#4F46E5',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = await getFirebaseToken()
      const res = await fetch(`/api/backend/library/${material._id}`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) onSaved(data.material)
    } catch (err) {
      console.error('Save material error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Material</h3>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="upload-form">
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input
                className="teacher-input"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input
                className="teacher-input"
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Folder</label>
              <select
                className="teacher-input"
                value={form.folder}
                onChange={(e) => setForm((p) => ({ ...p, folder: e.target.value }))}
              >
                <option value="General">General</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Exam Type</label>
              <select
                className="teacher-input"
                value={form.examType}
                onChange={(e) => setForm((p) => ({ ...p, examType: e.target.value }))}
              >
                {EXAM_TYPES.filter((t) => t !== 'All').map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Tags</label>
            <input
              className="teacher-input"
              placeholder="tag1, tag2, tag3"
              value={form.tags}
              onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Colour Label</label>
            <div className="color-picker">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-dot ${form.color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>

        <button className="generate-btn" onClick={handleSave} disabled={saving} type="button">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

