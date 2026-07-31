'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiHome, FiBook, FiAward, FiMessageSquare, FiUser } from 'react-icons/fi'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  isCenter?: boolean
  hasDot?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard/study', label: 'Study', icon: FiBook },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: FiAward },
  { href: '/dashboard/student', label: 'Home', icon: FiHome, isCenter: true },
  { href: '/dashboard/community', label: 'Community', icon: FiMessageSquare, hasDot: true },
  { href: '/dashboard/profile', label: 'Profile', icon: FiUser },
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard/student') return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      aria-label="Main navigation"
      className="sd-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        paddingTop: 10,
        paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
        zIndex: 100,
      }}
    >
      {NAV_ITEMS.map(item => {
        const active = isActive(item.href)
        const Icon = item.icon

        if (item.isCenter) {
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: 'var(--purple-deep)',
                  boxShadow: '0 0 16px rgba(91,33,246,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  color: '#ffffff',
                  marginTop: -10,
                  transition: 'transform 0.15s ease',
                }}
              >
                <Icon size={22} />
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: active ? 'var(--purple)' : 'var(--text-muted)',
                }}
              >
                {item.label}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: active ? 'var(--purple-bg)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: active ? 'var(--purple)' : 'var(--text-muted)',
                position: 'relative',
                transition: 'background 0.18s ease',
              }}
            >
              <Icon size={20} />
              {item.hasDot && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--red)',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: active ? 'var(--purple)' : 'var(--text-muted)',
              }}
            >
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
