'use client'

// @ts-nocheck

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
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

const PDFReader = dynamic(() => import('./PDFReaderClient'), {
  ssr: false,
})

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
  const [materials, setMaterials] = useState<any[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [storage, setStorage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFolder, setActiveFolder] = useState('All')
  const [showUpload, setShowUpload] = useState(false)
  const [showReader, setShowReader] = useState<any>(null)
  const [editingMaterial, setEditingMaterial] = useState<any>(null)
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
  const uniqueFolders = Array.from(new Set(allFolders))

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
              <h1 className="lib-hero-title">Study Library</h1>
              <p className="lib-hero-sub">Your personal reading collection</p>
            </div>
          </div>

          <div className="lib-hero-stats">
            <div className="lib-hero-stat">
              <span className="lib-hero-stat-num">{materials.length}</span>
              <span className="lib-hero-stat-label">Materials</span>
            </div>
            <div className="lib-hero-divider" />
            <div className="lib-hero-stat">
              <span className="lib-hero-stat-num">{folders.length + 1}</span>
              <span className="lib-hero-stat-label">Folders</span>
            </div>
            <div className="lib-hero-divider" />
            <div className="lib-hero-stat">
              <span className="lib-hero-stat-num">
                {materials.filter((m: any) => m.readProgress > 0).length}
              </span>
              <span className="lib-hero-stat-label">In Progress</span>
            </div>
          </div>

          <button
            className="lib-upload-btn"
            onClick={() => setShowUpload(true)}
            type="button"
          >
            <Plus size={17} />
            <span>Upload PDF</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="lib-toolbar">
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
              className={`lib-folder-tab ${activeFolder === f ? 'active' : ''
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
    <button
      className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all text-left w-full sm:w-[280px]"
      onClick={onClick}
      type="button"
    >
      <div
        className="w-12 h-16 rounded-lg shrink-0 flex items-center justify-center relative overflow-hidden"
        style={{ background: `${colorObj.bg}15`, border: `1px solid ${colorObj.bg}30` }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: colorObj.bg }} />
        <BookOpen size={20} color={colorObj.bg} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate mb-1">{material.title}</p>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs text-gray-500 truncate">{material.subject || 'Document'}</span>
          <span className="text-[10px] font-bold" style={{ color: colorObj.bg }}>{material.readProgress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${material.readProgress}%`, background: colorObj.bg }}
          />
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

  return (
    <div className="relative group bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg hover:-translate-y-1">
      {material.isFavourite && (
        <div className="absolute -top-2 -right-2 bg-yellow-100 p-1.5 rounded-full z-10 shadow-sm border border-yellow-200">
          <Star size={14} fill="#F59E0B" color="#F59E0B" />
        </div>
      )}

      {/* Internal Card body */}
      <div
        className="w-full aspect-[3/4] rounded-xl mb-4 relative overflow-hidden cursor-pointer group/inner shadow-sm"
        onClick={onRead}
        style={{
          background: `linear-gradient(135deg, ${material.color}11 0%, ${material.color}05 100%)`,
          border: `1px solid ${material.color}33`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ background: material.color }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-full shadow-sm mb-3 group-hover/inner:scale-110 transition-transform">
            <FileText size={28} color={material.color} strokeWidth={1.5} />
          </div>
          <p className="font-bold text-gray-900 dark:text-white text-[15px] leading-tight line-clamp-3 mb-2">
            {material.title}
          </p>
          {material.subject && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-md"
              style={{ color: material.color, background: `${material.color}15` }}
            >
              {material.subject}
            </span>
          )}
        </div>

        {/* Hover overlay read */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/inner:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <span className="bg-white text-gray-900 font-bold px-6 py-2 rounded-full shadow-lg transform translate-y-4 group-hover/inner:translate-y-0 transition-transform">
            Read PDF
          </span>
        </div>

        {material.readProgress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gray-200 dark:bg-gray-700 z-10">
            <div
              className="h-full"
              style={{ width: `${material.readProgress}%`, background: material.color }}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] text-gray-400 font-medium">{sizeMB} MB</span>
          {material.readProgress > 0 && (
            <span className="text-[11px] font-bold" style={{ color: material.color }}>
              {material.readProgress}% Read
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onToggleFav}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-yellow-500 transition-colors"
          >
            <Star size={16} fill={material.isFavourite ? '#F59E0B' : 'none'} color={material.isFavourite ? '#F59E0B' : 'currentColor'} />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-500 transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
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
                  {((file?.size || 0) / (1024 * 1024)).toFixed(1)} MB
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
                    className={`lib-color-btn ${form.color === c.bg ? 'active' : ''
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
                  className={`lib-color-btn ${form.color === c.bg ? 'active' : ''
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
