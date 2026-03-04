'use client'

import { useState, useEffect, useCallback } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { notesApi, type Note } from '@/lib/api/notesApi'

const SUBJECTS = ['All', 'General', 'Mathematics', 'English', 'Biology', 'Physics', 'Chemistry']
const NOTE_COLORS = [
  '#ffffff',
  '#FEF3C7',
  '#ECFDF5',
  '#EEF2FF',
  '#FDF2F8',
  '#FFF7ED',
  '#F0F9FF',
  '#F9FAFB',
]

function NotesSkeletonLoader() {
  return (
    <div className="notes-grid">
      {[1, 2, 3].map((i) => (
        <div key={i} className="note-card animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-3 bg-gray-200 rounded w-full mb-2" />
          <div className="h-3 bg-gray-200 rounded w-4/5" />
        </div>
      ))}
    </div>
  )
}

function NoteCard({
  note,
  onEdit,
  onDelete,
  onPin,
  onColorChange,
  noteColors,
}: {
  note: Note
  onEdit: () => void
  onDelete: () => void
  onPin: () => void
  onColorChange: (color: string) => void
  noteColors: string[]
}) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="note-card" style={{ background: note.color || '#ffffff' }}>
      <div className="note-card-header">
        <div className="note-meta">
          {note.subject && note.subject !== 'General' && (
            <span className="note-subject-badge">{note.subject}</span>
          )}
          {note.source === 'ai-generated' && <span className="ai-badge">✨ AI</span>}
        </div>
        <div className="note-actions">
          <button
            type="button"
            className={`pin-btn ${note.isPinned ? 'pinned' : ''}`}
            onClick={onPin}
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            📌
          </button>
          <div className="note-menu-wrapper">
            <button
              type="button"
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
            >
              ⋮
            </button>
            {showMenu && (
              <div className="note-menu">
                <button
                  type="button"
                  onClick={() => {
                    onEdit()
                    setShowMenu(false)
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowColorPicker(!showColorPicker)
                    setShowMenu(false)
                  }}
                >
                  🎨 Color
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete()
                    setShowMenu(false)
                  }}
                  className="delete-option"
                >
                  🗑 Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showColorPicker && (
        <div className="color-picker">
          {noteColors.map((color) => (
            <button
              key={color}
              type="button"
              className={`color-dot ${note.color === color ? 'selected' : ''}`}
              style={{ background: color }}
              onClick={() => {
                onColorChange(color)
                setShowColorPicker(false)
              }}
            />
          ))}
        </div>
      )}

      <h4 className="note-title" onClick={onEdit} onKeyDown={(e) => e.key === 'Enter' && onEdit()} role="button" tabIndex={0}>
        {note.title}
      </h4>
      <p className="note-preview">
        {note.content.length > 150 ? note.content.slice(0, 150) + '...' : note.content}
      </p>

      {note.tags && note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="note-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="note-footer">
        <span className="note-date">
          {new Date(note.updatedAt).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <span className="note-wordcount">{note.content.split(/\s+/).filter(Boolean).length} words</span>
      </div>
    </div>
  )
}

function NoteEditor({
  note,
  onSave,
  onClose,
}: {
  note: Note | null
  onSave: (data: Partial<Note> & { title: string; content: string }) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    title: note?.title || '',
    content: note?.content || '',
    subject: note?.subject || 'General',
    topic: note?.topic || '',
    tags: note?.tags?.join(', ') || '',
    color: note?.color || '#ffffff',
  })

  useEffect(() => {
    if (note) {
      setForm({
        title: note.title,
        content: note.content,
        subject: note.subject || 'General',
        topic: note.topic || '',
        tags: note.tags?.join(', ') || '',
        color: note.color || '#ffffff',
      })
    } else {
      setForm({
        title: '',
        content: '',
        subject: 'General',
        topic: '',
        tags: '',
        color: '#ffffff',
      })
    }
  }, [note])

  const handleSave = () => {
    onSave({
      ...form,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
  }

  return (
    <div className="editor-overlay" onClick={onClose} role="presentation">
      <div className="editor-modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="editor-header">
          <h3>{note ? '✏️ Edit Note' : '📝 New Note'}</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <input
          className="editor-title-input"
          placeholder="Note title..."
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <div className="editor-meta-row">
          <select
            className="editor-select"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          >
            {['General', 'Mathematics', 'English', 'Biology', 'Physics', 'Chemistry', 'Economics'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </select>
          <input
            className="editor-input"
            placeholder="Topic (optional)"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
          />
        </div>
        <textarea
          className="editor-content"
          placeholder="Write your notes here..."
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={12}
        />
        <input
          className="editor-input"
          placeholder="Tags (comma separated): e.g. algebra, formulas"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
        />
        <div className="editor-footer">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="save-note-btn"
            onClick={handleSave}
            disabled={!form.title || !form.content}
          >
            💾 Save Note
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyNotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await notesApi.getAll({
        subject: filter === 'all' ? undefined : filter,
        search: search || undefined,
      })
      setNotes(res.notes || [])
    } catch {
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return
    try {
      await notesApi.delete(id)
      fetchNotes()
    } catch {
      alert('Failed to delete note.')
    }
  }

  const handlePin = async (id: string) => {
    try {
      await notesApi.togglePin(id)
      fetchNotes()
    } catch {
      alert('Failed to update pin.')
    }
  }

  const handleColorChange = async (id: string, color: string) => {
    try {
      await notesApi.update(id, { color })
      fetchNotes()
    } catch {
      alert('Failed to update color.')
    }
  }

  const handleSaveNote = async (data: Partial<Note> & { title: string; content: string }) => {
    try {
      if (editingNote) {
        await notesApi.update(editingNote._id, data)
      } else {
        await notesApi.create(data)
      }
      setShowEditor(false)
      setEditingNote(null)
      fetchNotes()
    } catch {
      alert('Failed to save note.')
    }
  }

  const pinnedNotes = notes.filter((n) => n.isPinned)
  const unpinnedNotes = notes.filter((n) => !n.isPinned)

  return (
    <ProtectedRoute>
      <div className="notes-page w-full min-w-0">
        <div className="notes-header">
          <div>
            <h2>📝 My Notes</h2>
            <p>
              {notes.length} note{notes.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button
            type="button"
            className="new-note-btn"
            onClick={() => {
              setEditingNote(null)
              setShowEditor(true)
            }}
          >
            + New Note
          </button>
        </div>

        <div className="notes-toolbar">
          <input
            type="text"
            placeholder="🔍 Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="notes-search"
          />
          <div className="subject-filters">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                className={`filter-chip ${filter === s.toLowerCase() ? 'active' : ''}`}
                onClick={() => setFilter(s.toLowerCase())}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="view-toggle">
            <button
              type="button"
              className={view === 'grid' ? 'active' : ''}
              onClick={() => setView('grid')}
            >
              ⊞
            </button>
            <button
              type="button"
              className={view === 'list' ? 'active' : ''}
              onClick={() => setView('list')}
            >
              ☰
            </button>
          </div>
        </div>

        {pinnedNotes.length > 0 && (
          <div className="notes-section">
            <h4 className="section-label">📌 Pinned</h4>
            <div className={`notes-${view}`}>
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  onEdit={() => {
                    setEditingNote(note)
                    setShowEditor(true)
                  }}
                  onDelete={() => handleDelete(note._id)}
                  onPin={() => handlePin(note._id)}
                  onColorChange={(color) => handleColorChange(note._id, color)}
                  noteColors={NOTE_COLORS}
                />
              ))}
            </div>
          </div>
        )}

        <div className="notes-section">
          {pinnedNotes.length > 0 && <h4 className="section-label">All Notes</h4>}
          {loading ? (
            <NotesSkeletonLoader />
          ) : unpinnedNotes.length === 0 && pinnedNotes.length === 0 ? (
            <div className="notes-empty">
              <span className="empty-icon">📝</span>
              <h3>No notes yet</h3>
              <p>Create your first note or generate one from the AI tutor</p>
              <button
                type="button"
                className="new-note-btn"
                onClick={() => setShowEditor(true)}
              >
                + Create Note
              </button>
            </div>
          ) : (
            <div className={`notes-${view}`}>
              {unpinnedNotes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  onEdit={() => {
                    setEditingNote(note)
                    setShowEditor(true)
                  }}
                  onDelete={() => handleDelete(note._id)}
                  onPin={() => handlePin(note._id)}
                  onColorChange={(color) => handleColorChange(note._id, color)}
                  noteColors={NOTE_COLORS}
                />
              ))}
            </div>
          )}
        </div>

        {showEditor && (
          <NoteEditor
            note={editingNote}
            onSave={handleSaveNote}
            onClose={() => {
              setShowEditor(false)
              setEditingNote(null)
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
