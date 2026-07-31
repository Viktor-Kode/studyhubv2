'use client'

import Link from 'next/link'
import BottomNav from '@/components/dashboard/MobileBottomNav'
import { useAuthStore } from '@/lib/store/authStore'
import ProtectedRoute from '@/components/ProtectedRoute'
import { FiMessageSquare } from 'react-icons/fi'

function getInitials(name?: string | null): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0][0].toUpperCase()
}

export default function CommunityPage() {
  const { user } = useAuthStore()
  const initials = getInitials(user?.name)

  return (
    <ProtectedRoute>
      <div
        style={{
          background: 'var(--bg)',
          minHeight: '100dvh',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: 'var(--text-primary)',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 16px 12px',
          }}
        >
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Community
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Connect with other students
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            aria-label="Profile"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--purple-bg)',
              border: '2px solid var(--purple-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--purple)',
              textDecoration: 'none',
              flexShrink: 0,
              overflow: 'hidden',
              padding: 0,
            }}
          >
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Student'}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt="Profile"
            />
          </Link>
        </header>

        {/* Coming soon card */}
        <div style={{ padding: '60px 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--purple)',
              marginBottom: 20,
            }}
          >
            <FiMessageSquare size={38} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
            Coming Soon
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 280, marginBottom: 28 }}>
            The Community hub is almost ready. You'll be able to join study groups, share notes, and collaborate with students across Nigeria.
          </p>
          <Link
            href="/dashboard/student"
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              background: 'var(--purple-bg)',
              border: '1px solid var(--purple-border)',
              color: 'var(--purple)',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Back to Dashboard
          </Link>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
