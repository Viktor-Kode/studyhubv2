'use client'

import { useState } from 'react'
import { DIAGRAMS } from '@/lib/data/visualLabDiagrams'
import { Search, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

const SUBJECTS = ['All', 'Biology', 'Physics', 'Chemistry', 'Geography']

const SUBJECT_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  biology: { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  physics: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  chemistry: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  geography: { bg: '#F3E8FF', text: '#6D28D9', border: '#C4B5FD' },
}

export default function VisualLabPage() {
  const [activeSubject, setActiveSubject] = useState<string>('All')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<(typeof DIAGRAMS)[number] | null>(
    null,
  )
  const [zoom, setZoom] = useState(1)
  const [showLabels, setShowLabels] = useState(true)

  const filtered = DIAGRAMS.filter((d) => {
    const matchSubject =
      activeSubject === 'All' || d.subject === activeSubject.toLowerCase()
    const lowerSearch = search.toLowerCase()
    const matchSearch =
      !lowerSearch ||
      d.title.toLowerCase().includes(lowerSearch) ||
      d.keywords.some((k) => k.includes(lowerSearch))
    return matchSubject && matchSearch
  })

  return (
    <div className="vlab-page">
      {/* Header */}
      <div className="vlab-header">
        <div>
          <h1>🔬 Visual Lab</h1>
          <p>Explore diagrams, structures and scientific illustrations</p>
        </div>
      </div>

      {/* Controls */}
      <div className="vlab-controls">
        {/* Search */}
        <div className="vlab-search">
          <Search size={15} color="#94A3B8" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diagrams... e.g. Cell, Circuit, Titration"
          />
        </div>

        {/* Subject filters */}
        <div className="vlab-subject-tabs">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              className={`vlab-subject-tab ${
                activeSubject === s ? 'active' : ''
              }`}
              onClick={() => setActiveSubject(s)}
            >
              {s === 'Biology'
                ? '🧬'
                : s === 'Physics'
                  ? '⚡'
                  : s === 'Chemistry'
                    ? '🧪'
                    : s === 'Geography'
                      ? '🌍'
                      : '📚'}{' '}
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="vlab-layout">
        {/* Diagram grid */}
        <div className="vlab-grid">
          {filtered.map((diagram) => {
            const colors = SUBJECT_COLORS[diagram.subject]
            return (
              <div
                key={diagram.id}
                className={`vlab-card ${
                  selected?.id === diagram.id ? 'active' : ''
                }`}
                onClick={() => {
                  setSelected(diagram)
                  setZoom(1)
                }}
              >
                <div
                  className="vlab-card-preview"
                  dangerouslySetInnerHTML={{ __html: diagram.svg }}
                />
                <div className="vlab-card-info">
                  <span
                    className="vlab-subject-badge"
                    style={{
                      background: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {diagram.subject.charAt(0).toUpperCase() +
                      diagram.subject.slice(1)}
                  </span>
                  <p className="vlab-card-title">{diagram.title}</p>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="vlab-empty">
              <span>🔬</span>
              <p>No diagrams found for &quot;{search}&quot;</p>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="vlab-detail">
            <div className="vlab-detail-header">
              <h3>{selected.title}</h3>
              <button
                type="button"
                className="vlab-close"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            {/* Zoom controls */}
            <div className="vlab-zoom-controls">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              >
                <ZoomOut size={15} />
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              >
                <ZoomIn size={15} />
              </button>
              <button type="button" onClick={() => setZoom(1)}>
                <RotateCcw size={15} />
              </button>
              <label className="vlab-labels-toggle">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => setShowLabels(e.target.checked)}
                />
                Labels
              </label>
            </div>

            {/* SVG viewer */}
            <div className="vlab-svg-viewer">
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s',
                }}
                className={`vlab-svg-inner ${!showLabels ? 'hide-labels' : ''}`}
                dangerouslySetInnerHTML={{ __html: selected.svg }}
              />
            </div>

            {/* Keywords */}
            <div className="vlab-keywords">
              <span className="vlab-keywords-label">Related topics:</span>
              {selected.keywords.slice(0, 6).map((k) => (
                <span key={k} className="vlab-keyword-chip">
                  {k}
                </span>
              ))}
            </div>

            {/* Study tip */}
            <div className="vlab-tip">
              💡 <strong>Study tip:</strong> Questions about{' '}
              {selected.title.toLowerCase()} often appear in{' '}
              {selected.subject.charAt(0).toUpperCase() +
                selected.subject.slice(1)}{' '}
              WAEC and JAMB papers. Study the labels carefully.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

