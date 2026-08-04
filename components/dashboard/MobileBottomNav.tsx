'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiHome, FiBook, FiAward, FiCalendar, FiUser, FiFileText, FiBarChart2 } from 'react-icons/fi'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  isCenter?: boolean
  hasDot?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard/analytics', label: 'Analytics', icon: FiBarChart2 },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: FiAward },
  { href: '/dashboard/student', label: 'Home', icon: FiHome, isCenter: true },
  { href: '/dashboard/timetable', label: 'Timetable', icon: FiCalendar },
  { href: '/dashboard/notes-history', label: 'My Notes', icon: FiFileText },
]

import { useState, useEffect, useRef } from 'react'

// Selectors that indicate a modal/overlay/popup is open
const MODAL_SELECTORS = [
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[data-radix-dialog-content]',
  '[data-radix-alert-dialog-content]',
  '[data-radix-dropdown-menu-content]',
  '[data-radix-popover-content]',
  '[data-radix-sheet-content]',
  '.modal',
  '.modal-overlay',
  '.modal-backdrop',
  '.dialog',
  '.overlay',
  '.drawer',
  '.sheet',
  '[data-modal]',
  '[data-overlay]',
  '[data-dialog]',
].join(', ')

function isModalOpen(): boolean {
  try {
    return document.querySelector(MODAL_SELECTORS) !== null
  } catch {
    return false
  }
}

export default function BottomNav() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [prevScrollPos, setPrevScrollPos] = useState(0)
  const scrollVisibleRef = useRef(true)

  // Hide nav when any modal/popup/overlay is present in the DOM
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkModal = () => {
      setModalOpen(isModalOpen())
    }

    // Observe DOM mutations to detect modals being added/removed
    const observer = new MutationObserver(checkModal)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['role', 'data-modal', 'data-overlay', 'data-dialog'] })

    // Also support custom events for manual control
    const onOpen = () => setModalOpen(true)
    const onClose = () => setModalOpen(false)
    window.addEventListener('modal-open', onOpen)
    window.addEventListener('modal-close', onClose)

    // Initial check
    checkModal()

    return () => {
      observer.disconnect()
      window.removeEventListener('modal-open', onOpen)
      window.removeEventListener('modal-close', onClose)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      const currentScrollPos = window.scrollY
      // Show when scrolling up, hide when scrolling down
      const isScrollingDown = currentScrollPos > prevScrollPos
      if (isScrollingDown && currentScrollPos > 80) {
        scrollVisibleRef.current = false
        setVisible(false)
      } else {
        scrollVisibleRef.current = true
        setVisible(true)
      }
      setPrevScrollPos(currentScrollPos)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prevScrollPos])

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
        transform: (visible && !modalOpen) ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-in-out',
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
