'use client'

// @ts-nocheck

import { useState, useEffect, useRef, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { getFirebaseToken } from '@/lib/store/authStore'
import {
  Upload,
  Search,
  Star,
  FileText,
  Trash2,
  Edit2,
  X,
  Plus,
  BookOpen,
  HardDrive,
  Clock,
  ChevronRight,
  FolderOpen,
  Folder,
  Check,
  ArrowLeft,
} from 'lucide-react'

// Colour palette for books
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

// Confirm Dialog (replaces window.confirm)
const ConfirmDialog = ({
  title,
  message,
  onConfirm,
  onCancel,
  danger = false,
}: {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) => (
  <div className="lib-overlay" onClick={onCancel}>
    <div className="lib-confirm-modal" onClick={(e) => e.stopPropagation()}>
      <div
        className="lib-confirm-icon"
        style={{ background: danger ? '#FEF2F2' : '#EEF2FF' }}
      >
        {danger ? <Trash2 size={22} color="#DC2626" /> : <BookOpen size={22} color="#4F46E5" />}
      </div>
      <h3 className="lib-confirm-title">{title}</h3>
      <p className="lib-confirm-message">{message}</p>
      <div className="lib-confirm-actions">
        <button className="lib-confirm-cancel" onClick={onCancel} type="button">
          Cancel
        </button>
        <button
          className={`lib-confirm-ok ${danger ? 'danger' : ''}`}
          onClick={onConfirm}
          type="button"
        >
          {danger ? 'Delete' : 'Confirm'}
        </button>
      </div>
    </div>
  </div>
)

// New Folder Dialog (replaces window.prompt)
const NewFolderDialog = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void
  onCancel: () => void
}) => {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <div className="lib-overlay" onClick={onCancel}>
      <div className="lib-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lib-confirm-icon" style={{ background: '#EEF2FF' }}>
          <FolderOpen size={22} color="#4F46E5" />
        </div>
        <h3 className="lib-confirm-title">New Folder</h3>
        <p className="lib-confirm-message">Give your folder a name</p>
        <input
          ref={inputRef}
          className="lib-input"
          placeholder="e.g. WAEC Materials"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{ marginBottom: 0 }}
        />
        <div className="lib-confirm-actions">
          <button className="lib-confirm-cancel" onClick={onCancel} type="button">
            Cancel
          </button>
          <button
            className="lib-confirm-ok"
            onClick={handleSubmit}
            disabled={!name.trim()}
            type="button"
          >
            Create Folder
          </button>
        </div>
      </div>
    </div>
  )
}

const LibraryPage = () => {
  const [materials, setMaterials] = useState([])
  const [folders, setFolders] = useState([])
  const [storage, setStorage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFolder, setActiveFolder] = useState('All')
  const [showUpload, setShowUpload] = useState(false)
  const [showReader, setShowReader] = useState(null)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [showFavourites, setShowFavourites] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const searchRef = useRef(null)

  const fetchMaterials = useCallback(async () => {
    try {
      const token = await getToken()
      const params = new URLSearchParams()
      if (activeFolder !== 'All') params.append('folder', activeFolder)
      if (search) params.append('search', search)
      if (showFavourites) params.append('favourite', 'true')

      const res = await fetch(`/api/backend/library?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) {
        setMaterials(data.materials)
        setFolders(data.folders.filter((f: string) => f !== 'General').concat())
        setStorage(data.storage)
      }
    } catch (err) {
      console.error('Library error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeFolder, search, showFavourites])

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchMaterials()
    }, 250)
    return () => clearTimeout(t)
  }, [fetchMaterials])

  const handleDelete = (id: string) => {
    setConfirmDelete(id)
  }

  const confirmDeleteMaterial = async () => {
    if (!confirmDelete) return
    const id = confirmDelete
    setConfirmDelete(null)
    const token = await getToken()
    await fetch(`/api/backend/library/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    setMaterials((prev) => prev.filter((m: any) => m._id !== id))
  }

  const handleToggleFavourite = async (material: any) => {
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
      prev.map((m: any) =>
        m._id === material._id ? { ...m, isFavourite: updated } : m
      )
    )
  }

  const recentlyOpened = materials
    .filter((m: any) => m.readProgress > 0)
    .sort(
      (a: any, b: any) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 4)

  const allFolders = ['All', 'General', ...folders]
  const uniqueFolders = [...new Set(allFolders)]

  const folderCount = (f: string) =>
    f === 'All'
      ? materials.length
      : materials.filter((m: any) => m.folder === f).length

  const filtered =
    activeFolder === 'All'
      ? materials
      : materials.filter((m: any) => m.folder === activeFolder)

  return (
    <ProtectedRoute>
      <div className="lib-page">
        {/* Top Hero */}
        <div className="lib-hero">
          <div className="lib-hero-left">
            <div className="lib-hero-icon">
              <BookOpen size={24} color="white" />
            </div>
            <div>
              <h1 className="lib-hero-title">My Study Library</h1>
              <p className="lib-hero-sub">
                {materials.length} material{materials.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          </div>

          <button
            className="lib-upload-btn"
            onClick={() => setShowUpload(true)}
            type="button"
          >
            <Plus size={18} />
            <span>Upload PDF</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="lib-search-bar">
          <div className="lib-search-inner">
            <Search size={18} color="#9CA3AF" />
            <input
              ref={searchRef}
              className="lib-search-input"
              placeholder="Search by title, subject or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="lib-search-x"
                onClick={() => setSearch('')}
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            className={`lib-fav-btn ${showFavourites ? 'active' : ''}`}
            onClick={() => setShowFavourites(!showFavourites)}
            title="Starred only"
            type="button"
          >
            <Star
              size={16}
              fill={showFavourites ? '#F59E0B' : 'none'}
              color={showFavourites ? '#F59E0B' : '#6B7280'}
            />
            <span>{showFavourites ? 'Starred' : 'All'}</span>
          </button>
        </div>

        {/* Storage bar */}
        {storage && (
          <div className="lib-storage">
            <HardDrive size={14} />
            <div className="lib-storage-track">
              <div
                className="lib-storage-fill"
                style={{
                  width: `${Math.min(storage.percentage, 100)}%`,
                  background:
                    storage.percentage >= 90
                      ? '#DC2626'
                      : storage.percentage >= 70
                      ? '#D97706'
                      : '#4F46E5',
                }}
              />
            </div>
            <span className="lib-storage-text">
              {storage.usedMB} / {storage.limitMB} MB
            </span>
            {storage.limitMB === 50 && (
              <button
                className="lib-storage-upgrade"
                onClick={() => {
                  window.location.href = '/dashboard/pricing'
                }}
                type="button"
              >
                Upgrade →
              </button>
            )}
          </div>
        )}

        {/* Recently opened */}
        {recentlyOpened.length > 0 && !search && activeFolder === 'All' && (
          <div className="lib-section">
            <div className="lib-section-header">
              <Clock size={15} />
              <span>Continue Reading</span>
            </div>
            <div className="lib-recent-row">
              {recentlyOpened.map((m: any) => (
                <RecentCard
                  key={m._id}
                  material={m}
                  onClick={() => setShowReader(m)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Folder tabs */}
        <div className="lib-folder-tabs">
          {uniqueFolders.map((f: string) => (
            <button
              key={f}
              className={`lib-folder-tab ${
                activeFolder === f ? 'active' : ''
              }`}
              onClick={() => setActiveFolder(f)}
              type="button"
            >
              {activeFolder === f ? (
                <FolderOpen size={14} />
              ) : (
                <Folder size={14} />
              )}
              <span>{f}</span>
              <span className="lib-folder-count">{folderCount(f)}</span>
            </button>
          ))}
          <button
            className="lib-new-folder-tab"
            onClick={() => setShowNewFolder(true)}
            type="button"
          >
            <Plus size={13} /> New Folder
          </button>
        </div>

        {/* Bookshelf grid */}
        <div className="lib-section">
          {activeFolder !== 'All' && (
            <div className="lib-section-header">
              <FolderOpen size={15} />
              <span>{activeFolder}</span>
              <span className="lib-section-count">
                {filtered.length} files
              </span>
            </div>
          )}

          {loading ? (
            <div className="lib-skeleton-grid">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="lib-skeleton-card">
                    <div className="lib-skeleton-top" />
                    <div className="lib-skeleton-body">
                      <div className="lib-skeleton-line long" />
                      <div className="lib-skeleton-line short" />
                    </div>
                  </div>
                ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="lib-empty-state">
              {search ? (
                <>
                  <Search size={40} color="#E5E7EB" />
                  <h3>No results for "{search}"</h3>
                  <p>Try searching by subject or tag</p>
                </>
              ) : (
                <>
                  <BookOpen size={40} color="#E5E7EB" />
                  <h3>
                    {activeFolder === 'All'
                      ? 'Your library is empty'
                      : `No files in ${activeFolder}`}
                  </h3>
                  <p>Upload your first PDF to get started</p>
                  <button
                    className="lib-upload-btn"
                    onClick={() => setShowUpload(true)}
                    type="button"
                  >
                    <Plus size={16} /> Upload PDF
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="lib-book-grid">
              {filtered.map((material: any) => (
                <BookCard
                  key={material._id}
                  material={material}
                  onRead={() => setShowReader(material)}
                  onEdit={() => setEditingMaterial(material)}
                  onDelete={() => handleDelete(material._id)}
                  onToggleFav={() => handleToggleFavourite(material)}
                />
              ))}

              <button
                className="lib-add-card"
                onClick={() => setShowUpload(true)}
                type="button"
              >
                <div className="lib-add-icon">
                  <Plus size={24} />
                </div>
                <span>Add Material</span>
              </button>
            </div>
          )}
        </div>

        {/* Modals */}
        {showUpload && (
          <UploadModal
            folders={uniqueFolders.filter((f: string) => f !== 'All')}
            onClose={() => setShowUpload(false)}
            onUploaded={(material: any) => {
              setMaterials((prev) => [material, ...prev])
              setShowUpload(false)
            }}
          />
        )}

        {showReader && (
          <PDFReader
            material={showReader}
            onClose={() => setShowReader(null)}
            onProgressSaved={(id, page, progress) => {
              setMaterials((prev) =>
                prev.map((m: any) =>
                  m._id === id ? { ...m, lastReadPage: page, readProgress: progress } : m
                )
              )
            }}
          />
        )}

        {editingMaterial && (
          <EditModal
            material={editingMaterial}
            folders={uniqueFolders.filter((f: string) => f !== 'All')}
            onClose={() => setEditingMaterial(null)}
            onSaved={(updated: any) => {
              setMaterials((prev) =>
                prev.map((m: any) => (m._id === updated._id ? updated : m))
              )
              setEditingMaterial(null)
            }}
          />
        )}

        {confirmDelete && (
          <ConfirmDialog
            title="Delete Material"
            message="This will permanently delete this PDF from your library. This cannot be undone."
            danger
            onConfirm={confirmDeleteMaterial}
            onCancel={() => setConfirmDelete(null)}
          />
        )}

        {showNewFolder && (
          <NewFolderDialog
            onConfirm={(name) => {
              setFolders((prev) => [...prev, name])
              setShowNewFolder(false)
            }}
            onCancel={() => setShowNewFolder(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

// Recently opened card
const RecentCard = ({ material, onClick }: { material: any; onClick: () => void }) => {
  const colorObj = BOOK_COLORS.find((c) => c.bg === material.color) || BOOK_COLORS[0]
  return (
    <button className="lib-recent-card" onClick={onClick} type="button">
      <div
        className="lib-recent-spine"
        style={{ background: colorObj.bg }}
      />
      <div className="lib-recent-info">
        <span className="lib-recent-title">{material.title}</span>
        {material.subject && (
          <span className="lib-recent-subject">{material.subject}</span>
        )}
        <div className="lib-recent-progress">
          <div className="lib-recent-bar">
            <div
              className="lib-recent-fill"
              style={{
                width: `${material.readProgress}%`,
                background: colorObj.bg,
              }}
            />
          </div>
          <span>{material.readProgress}%</span>
        </div>
      </div>
    </button>
  )
}

// Book card
const BookCard = ({
  material,
  onRead,
  onEdit,
  onDelete,
  onToggleFav,
}: {
  material: any
  onRead: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleFav: () => void
}) => {
  const colorObj = BOOK_COLORS.find((c) => c.bg === material.color) || BOOK_COLORS[0]
  const sizeMB = (material.fileSize / (1024 * 1024)).toFixed(1)
  const initials = material.title
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('')

  return (
    <div className="lib-book-card">
      <div
        className="lib-book-cover"
        style={{
          background: `linear-gradient(160deg, ${colorObj.bg} 0%, ${colorObj.bg}CC 100%)`,
        }}
        onClick={onRead}
      >
        <div className="lib-book-spine" />
        <div className="lib-book-initials">{initials || '📄'}</div>

        {material.subject && (
          <div className="lib-book-subject-badge">{material.subject}</div>
        )}

        {material.isFavourite && (
          <div className="lib-book-star">
            <Star size={13} fill="#FCD34D" color="#FCD34D" />
          </div>
        )}

        {material.readProgress > 0 && (
          <div className="lib-book-progress">
            <div
              className="lib-book-progress-fill"
              style={{ width: `${material.readProgress}%` }}
            />
          </div>
        )}

        <div className="lib-book-hover">
          <span>Open</span>
        </div>
      </div>

      <div className="lib-book-info">
        <p className="lib-book-title" title={material.title}>
          {material.title}
        </p>
        <div className="lib-book-meta">
          <span>{sizeMB} MB</span>
          {material.readProgress > 0 && (
            <span className="lib-book-read" style={{ color: colorObj.bg }}>
              {material.readProgress}% read
            </span>
          )}
        </div>
      </div>

      <div className="lib-book-actions">
        <button
          className="lib-book-action-btn fav"
          onClick={onToggleFav}
          title={material.isFavourite ? 'Unstar' : 'Star'}
          type="button"
        >
          <Star
            size={13}
            fill={material.isFavourite ? '#F59E0B' : 'none'}
            color={material.isFavourite ? '#F59E0B' : '#9CA3AF'}
          />
        </button>
        <button
          className="lib-book-action-btn"
          onClick={onEdit}
          title="Edit"
          type="button"
        >
          <Edit2 size={13} />
        </button>
        <button
          className="lib-book-action-btn danger"
          onClick={onDelete}
          title="Delete"
          type="button"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// Upload modal
const UploadModal = ({
  folders,
  onClose,
  onUploaded,
}: {
  folders: string[]
  onClose: () => void
  onUploaded: (material: any) => void
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: '',
    subject: '',
    folder: 'General',
    tags: '',
    color: '#4F46E5',
  })
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
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
    setForm((p) => ({ ...p, title: f.name.replace('.pdf', '') }))
    setError('')
    setStep(2)
  }

  const handleUpload = async () => {
    if (!form.title.trim()) {
      setError('Please enter a title')
      return
    }
    setUploading(true)
    setError('')

    try {
      const token = await getToken()
      const formData = new FormData()
      formData.append('pdf', file as File)
      Object.entries(form).forEach(([k, v]) => formData.append(k, v as string))

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/backend/library/upload')
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onload = () => {
          const data = JSON.parse(xhr.responseText)
          if (xhr.status === 200 && data.success) {
            onUploaded(data.material)
            resolve()
          } else {
            reject(new Error(data.error || 'Upload failed'))
          }
        }

        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(formData)
      })
    } catch (err: any) {
      setError(err.message)
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="lib-overlay" onClick={onClose}>
      <div className="lib-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lib-modal-header">
          {step === 2 && (
            <button
              className="lib-modal-back"
              onClick={() => setStep(1)}
              type="button"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <h3>{step === 1 ? 'Upload PDF' : 'Add Details'}</h3>
          <button className="lib-modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        {step === 1 && (
          <div
            className={`lib-drop-zone ${dragOver ? 'drag-over' : ''}`}
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
              const input = document.getElementById('lib-pdf-input') as HTMLInputElement | null
              input?.click()
            }}
          >
            <input
              id="lib-pdf-input"
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <div className="lib-drop-icon">
              <Upload size={32} color="#4F46E5" />
            </div>
            <p className="lib-drop-title">Drop your PDF here</p>
            <p className="lib-drop-sub">or click to browse files</p>
            <div className="lib-drop-limit">Max 20MB per file · PDF only</div>
            {error && <div className="lib-error">{error}</div>}
          </div>
        )}

        {step === 2 && (
          <div className="lib-upload-details">
            <div className="lib-file-preview">
              <div
                className="lib-file-preview-icon"
                style={{ background: form.color + '22' }}
              >
                <FileText size={24} color={form.color} />
              </div>
              <div className="lib-file-preview-info">
                <span className="lib-file-preview-name">{file?.name}</span>
                <span className="lib-file-preview-size">
                  {(file?.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              <button
                className="lib-file-preview-change"
                onClick={() => setStep(1)}
                type="button"
              >
                Change
              </button>
            </div>

            <div className="lib-color-row">
              <span className="lib-form-label">Colour</span>
              <div className="lib-colors">
                {BOOK_COLORS.map((c) => (
                  <button
                    key={c.bg}
                    className={`lib-color-btn ${
                      form.color === c.bg ? 'active' : ''
                    }`}
                    style={{ background: c.bg }}
                    onClick={() => setForm((p) => ({ ...p, color: c.bg }))}
                    title={c.label}
                    type="button"
                  >
                    {form.color === c.bg && (
                      <Check size={12} color="white" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="lib-book-preview">
              <div
                className="lib-preview-cover"
                style={{
                  background: `linear-gradient(160deg, ${form.color} 0%, ${form.color}CC 100%)`,
                }}
              >
                <div className="lib-book-spine" />
                <div className="lib-book-initials">
                  {form.title
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join('') || '📄'}
                </div>
                {form.subject && (
                  <div className="lib-book-subject-badge">{form.subject}</div>
                )}
              </div>
              <span className="lib-preview-label">Preview</span>
            </div>

            <div className="lib-form-fields">
              <div className="lib-form-group">
                <label className="lib-form-label">Title *</label>
                <input
                  className="lib-input"
                  placeholder="e.g. JAMB Chemistry Past Questions 2024"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </div>

              <div className="lib-form-row">
                <div className="lib-form-group">
                  <label className="lib-form-label">Subject</label>
                  <input
                    className="lib-input"
                    placeholder="e.g. Chemistry"
                    value={form.subject}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, subject: e.target.value }))
                    }
                  />
                </div>
                <div className="lib-form-group">
                  <label className="lib-form-label">Folder</label>
                  <select
                    className="lib-input"
                    value={form.folder}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, folder: e.target.value }))
                    }
                  >
                    <option value="General">General</option>
                    {folders
                      .filter((f) => f !== 'General')
                      .map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="lib-form-group">
                <label className="lib-form-label">Tags</label>
                <input
                  className="lib-input"
                  placeholder="e.g. organic, 2023, waec (comma separated)"
                  value={form.tags}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tags: e.target.value }))
                  }
                />
              </div>
            </div>

            {uploading && (
              <div className="lib-upload-progress">
                <div className="lib-progress-track">
                  <div
                    className="lib-progress-fill"
                    style={{ width: `${uploadProgress}%`, background: form.color }}
                  />
                </div>
                <span>{uploadProgress}%</span>
              </div>
            )}

            {error && <div className="lib-error">{error}</div>}

            <button
              className="lib-upload-submit"
              style={{ background: form.color }}
              onClick={handleUpload}
              disabled={uploading}
              type="button"
            >
              {uploading ? (
                `Uploading... ${uploadProgress}%`
              ) : (
                <>
                  <Upload size={16} /> Save to Library
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const VIEWER_STRATEGIES = [
  { id: 'google', label: 'Google Docs' },
  { id: 'direct', label: 'Direct' },
  { id: 'office', label: 'Office Viewer' },
]

const PDFReader = ({
  material,
  onClose,
  onProgressSaved,
}: {
  material: any
  onClose: () => void
  onProgressSaved: (id: string, page: number, progress: number) => void
}) => {
  const colorObj = BOOK_COLORS.find((c) => c.bg === material.color) || BOOK_COLORS[0]
  const [loading, setLoading] = useState(true)
  const [strategyIndex, setStrategyIndex] = useState(0)
  const [allFailed, setAllFailed] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const loadTimerRef = useRef<number | null>(null)

  const pdfUrl = material.fileUrl as string

  const getViewerSrc = (index: number) => {
    switch (index) {
      case 0:
        return `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`
      case 1:
        return pdfUrl
      case 2:
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pdfUrl)}`
      default:
        return null
    }
  }

  const tryNextStrategy = () => {
    if (loadTimerRef.current) {
      window.clearTimeout(loadTimerRef.current)
    }
    if (strategyIndex < VIEWER_STRATEGIES.length - 1) {
      setStrategyIndex((prev) => prev + 1)
      setLoading(true)
      setAllFailed(false)
    } else {
      setAllFailed(true)
      setLoading(false)
    }
  }

  // Auto-detect blank/failed load for Google Docs, then fall back
  useEffect(() => {
    setLoading(true)
    setAllFailed(false)

    if (loadTimerRef.current) {
      window.clearTimeout(loadTimerRef.current)
    }

    loadTimerRef.current = window.setTimeout(() => {
      if (strategyIndex === 0) {
        tryNextStrategy()
      }
    }, 12000)

    return () => {
      if (loadTimerRef.current) {
        window.clearTimeout(loadTimerRef.current)
      }
    }
  }, [strategyIndex])

  const handleIframeLoad = () => {
    if (loadTimerRef.current) {
      window.clearTimeout(loadTimerRef.current)
    }
    setLoading(false)
  }

  const handleClose = async () => {
    if (loadTimerRef.current) {
      window.clearTimeout(loadTimerRef.current)
    }
    try {
      const token = await getToken()
      const progress = material.readProgress || 0
      const lastReadPage = material.lastReadPage || 1
      await fetch(`/api/backend/library/${material._id}/progress`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastReadPage,
          readProgress: progress,
        }),
      })
      onProgressSaved(material._id, lastReadPage, progress)
    } catch (err) {
      console.error(err)
    }
    onClose()
  }

  const viewerSrc = getViewerSrc(strategyIndex)

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
            {!loading && !allFailed && (
              <button
                className="lib-reader-retry"
                onClick={tryNextStrategy}
                type="button"
                title="If the PDF looks blank, tap this"
              >
                Not loading? Try again
              </button>
            )}
            {material.readProgress > 0 && (
              <span
                className="lib-reader-progress-badge"
                style={{ background: colorObj.bg + '22', color: colorObj.bg }}
              >
                {material.readProgress}%
              </span>
            )}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="lib-reader-download"
            >
              Download
            </a>
          </div>
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="lib-reader-loading">
            <div
              className="lib-reader-spinner"
              style={{ borderTopColor: material.color }}
            />
            <p>Opening PDF...</p>
            <span className="lib-reader-loading-sub">
              Using {VIEWER_STRATEGIES[strategyIndex].label} viewer
            </span>
          </div>
        )}

        {/* All strategies failed */}
        {allFailed && (
          <div className="lib-reader-error">
            <BookOpen size={44} color="#4B5563" />
            <h3>Couldn&apos;t display this PDF</h3>
            <p>
              This can happen with large files or restricted URLs.
              <br />
              Download it to read offline.
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="lib-upload-submit"
              style={{
                background: material.color,
                textDecoration: 'none',
                maxWidth: 220,
                padding: '12px 24px',
              }}
            >
              Download PDF
            </a>
          </div>
        )}

        {/* iframe viewer */}
        {!allFailed && viewerSrc && (
          <iframe
            key={strategyIndex}
            ref={iframeRef}
            src={viewerSrc}
            className="lib-reader-iframe"
            title={material.title}
            style={{ display: loading ? 'none' : 'block' }}
            onLoad={handleIframeLoad}
          />
        )}
      </div>
    </div>
  )
}

// Edit modal
const EditModal = ({
  material,
  folders,
  onClose,
  onSaved,
}: {
  material: any
  folders: string[]
  onClose: () => void
  onSaved: (material: any) => void
}) => {
  const [form, setForm] = useState({
    title: material.title,
    subject: material.subject || '',
    folder: material.folder || 'General',
    tags: material.tags?.join(', ') || '',
    color: material.color || '#4F46E5',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = await getToken()
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="lib-overlay" onClick={onClose}>
      <div className="lib-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lib-modal-header">
          <h3>Edit Material</h3>
          <button className="lib-modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="lib-upload-details">
          <div className="lib-color-row">
            <span className="lib-form-label">Colour</span>
            <div className="lib-colors">
              {BOOK_COLORS.map((c) => (
                <button
                  key={c.bg}
                  className={`lib-color-btn ${
                    form.color === c.bg ? 'active' : ''
                  }`}
                  style={{ background: c.bg }}
                  onClick={() => setForm((p) => ({ ...p, color: c.bg }))}
                  type="button"
                >
                  {form.color === c.bg && (
                    <Check size={12} color="white" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="lib-form-fields">
            <div className="lib-form-group">
              <label className="lib-form-label">Title</label>
              <input
                className="lib-input"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div className="lib-form-row">
              <div className="lib-form-group">
                <label className="lib-form-label">Subject</label>
                <input
                  className="lib-input"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subject: e.target.value }))
                  }
                />
              </div>
              <div className="lib-form-group">
                <label className="lib-form-label">Folder</label>
                <select
                  className="lib-input"
                  value={form.folder}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, folder: e.target.value }))
                  }
                >
                  {folders.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="lib-form-group">
              <label className="lib-form-label">Tags</label>
              <input
                className="lib-input"
                placeholder="tag1, tag2"
                value={form.tags}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tags: e.target.value }))
                }
              />
            </div>
          </div>

          <button
            className="lib-upload-submit"
            style={{ background: form.color }}
            onClick={handleSave}
            disabled={saving}
            type="button"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <Check size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LibraryPage
