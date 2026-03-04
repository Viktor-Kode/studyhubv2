'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { postutmeApi, type University, type UniversityDetails } from '@/lib/api/postutmeApi'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function UniversitySkeletonGrid() {
  return (
    <div className="uni-grid">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="uni-card animate-pulse">
          <div className="uni-logo bg-gray-200" />
          <div className="uni-info flex-1">
            <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-20 mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function UniversityModal({
  university,
  onClose,
  onStart,
}: {
  university: University
  onClose: () => void
  onStart: (config: { slug: string; subject: string; year: string; count: number }) => void
}) {
  const [details, setDetails] = useState<UniversityDetails | null>(null)
  const [subject, setSubject] = useState('')
  const [year, setYear] = useState('')
  const [count, setCount] = useState(40)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    postutmeApi
      .getUniversityBySlug(university.slug)
      .then((data) => {
        setDetails(data.university)
        const subs = data.university.availableSubjects || []
        const yrs = data.university.availableYears || []
        if (subs.length) setSubject(subs[0])
        if (yrs.length) setYear(String(yrs[0]))
      })
      .catch(() => setDetails(null))
      .finally(() => setLoading(false))
  }, [university.slug])

  const handleStart = () => {
    onStart({ slug: university.slug, subject, year, count })
  }

  const subs = details?.availableSubjects || university.availableSubjects || []
  const yrs = (details?.availableYears || []).map(String)

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="uni-modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="uni-modal-header">
          <div className="uni-modal-logo">
            {university.logo ? (
              <img src={university.logo} alt={university.shortName} />
            ) : (
              <span>{university.shortName.slice(0, 3)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3>{university.shortName}</h3>
            <p>{university.name}</p>
            <span className={`uni-type ${university.type}`}>{university.type}</span>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading...</div>
        ) : (
          <>
            <div className="uni-stats-row">
              <div className="uni-stat">
                <span className="stat-num">{details?.totalQuestions ?? 0}</span>
                <span className="stat-label">Questions</span>
              </div>
              <div className="uni-stat">
                <span className="stat-num">{subs.length}</span>
                <span className="stat-label">Subjects</span>
              </div>
              <div className="uni-stat">
                <span className="stat-num">{yrs.length}</span>
                <span className="stat-label">Years</span>
              </div>
            </div>

            <div className="exam-config">
              <h4>Configure Your Practice</h4>

              <div className="config-group">
                <label>Select Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="config-select"
                >
                  <option value="">All Subjects (Mixed)</option>
                  {subs.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="config-group">
                <label>Select Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="config-select"
                >
                  <option value="">All Years (Mixed)</option>
                  {yrs.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="config-group">
                <label>Number of Questions</label>
                <div className="count-control">
                  <button
                    type="button"
                    onClick={() => setCount(Math.max(10, count - 10))}
                    className="count-btn"
                  >
                    −
                  </button>
                  <span className="count-display">{count}</span>
                  <button
                    type="button"
                    onClick={() => setCount(Math.min(100, count + 10))}
                    className="count-btn"
                  >
                    +
                  </button>
                </div>
              </div>

              <button type="button" className="start-exam-btn" onClick={handleStart}>
                🚀 Start {university.shortName} Post-UTME Practice
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function PostUTMEPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<University | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    postutmeApi
      .getUniversities({ type: filter === 'all' ? undefined : filter, search: search || undefined })
      .then((data) => setUniversities(data.universities || []))
      .catch(() => setUniversities([]))
      .finally(() => setLoading(false))
  }, [filter, search])

  const filtered = universities.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.shortName.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.type === filter
    return matchSearch && matchFilter
  })

  const handleStart = (config: { slug: string; subject: string; year: string; count: number }) => {
    const params = new URLSearchParams({
      uni: config.slug,
      subject: config.subject,
      year: config.year,
      count: String(config.count),
    })
    router.push(`/dashboard/postutme/exam?${params}`)
  }

  return (
    <ProtectedRoute>
      <div className="postutme-page">
        <div className="postutme-header">
          <h2>🎓 Post-UTME Practice</h2>
          <p>Select your university and practise past questions</p>
        </div>

        <input
          type="text"
          className="uni-search"
          placeholder="🔍 Search university e.g. UNILAG, OAU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="uni-filters">
          {['all', 'federal', 'state', 'private'].map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <UniversitySkeletonGrid />
        ) : (
          <div className="uni-grid">
            {filtered.map((uni) => (
              <div
                key={uni._id}
                className="uni-card"
                onClick={() => setSelected(uni)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelected(uni)}
              >
                <div className="uni-logo">
                  {uni.logo ? (
                    <img src={uni.logo} alt={uni.shortName} />
                  ) : (
                    <span className="uni-initials">{uni.shortName.slice(0, 3)}</span>
                  )}
                </div>
                <div className="uni-info">
                  <h4>{uni.shortName}</h4>
                  <p>{uni.name}</p>
                  <div className="uni-meta">
                    <span className={`uni-type ${uni.type}`}>{uni.type}</span>
                    {uni.location && (
                      <span className="uni-location">📍 {uni.location}</span>
                    )}
                  </div>
                  <span className="uni-subjects">
                    {uni.availableSubjects?.length || 0} subjects available
                  </span>
                </div>
                <span className="uni-arrow">→</span>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="notes-empty">
            <span className="empty-icon">🎓</span>
            <h3>No universities found</h3>
            <p>Try a different search or filter</p>
          </div>
        )}

        <div className="mt-6">
          <Link
            href="/dashboard/postutme/results"
            className="text-indigo-600 hover:underline font-medium"
          >
            View My Post-UTME Results →
          </Link>
        </div>

        {selected && (
          <UniversityModal
            university={selected}
            onClose={() => setSelected(null)}
            onStart={handleStart}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
