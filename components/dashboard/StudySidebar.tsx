'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FiUsers,
  FiPhone,
  FiLogOut
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { firebaseSignOut } from '@/lib/firebase-auth'
import {
  DASHBOARD_NAV_ITEMS,
  isNavItemActive,
  SUPPORT_CALL_URL,
  SUPPORT_WHATSAPP_URL
} from './navConfig'
import './study-nav.css'

export default function StudySidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await firebaseSignOut()
    router.push('/auth/login')
  }

  return (
    <>
      {/* DESKTOP SIDEBAR (Visible only on screens > 1024px) */}
      <aside className="sp-sidebar" aria-label="Desktop sidebar">
        <Link href="/dashboard/student" className="sp-logo-wrap">
          <div
            className="sp-logo-icon"
            style={{
              overflow: 'hidden',
              borderRadius: '10px',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Image
              src="/apple-touch-icon.png"
              alt="StudyHelp"
              width={34}
              height={34}
              priority
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <span className="sp-logo-text">StudyHelp</span>
        </Link>

        <nav aria-label="Desktop navigation">
          <ul className="sp-nav-list">
            {DASHBOARD_NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = isNavItemActive(item.href, pathname)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`sp-nav-item ${active ? 'active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="sp-nav-icon" />
                    <span>{item.label === 'Notes' ? 'Notes Library' : item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="sp-nav-support">
          <h4 className="sp-nav-support-title">Support</h4>

          <Link href="/dashboard/settings?tab=referrals" className="sp-nav-support-link">
            <FiUsers className="sp-nav-support-icon referrals" />
            <span>Refer &amp; Earn</span>
          </Link>

          <a href={SUPPORT_CALL_URL} className="sp-nav-support-link">
            <FiPhone className="sp-nav-support-icon call" />
            <span>Call Support</span>
          </a>

          <a
            href={SUPPORT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="sp-nav-support-link"
          >
            <FaWhatsapp className="sp-nav-support-icon whatsapp" />
            <span>WhatsApp Support</span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="sp-nav-support-link sp-nav-logout"
            aria-label="Log out"
          >
            <FiLogOut className="sp-nav-support-icon" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible only on screens <= 1024px) */}
      <nav className="sp-bottom-nav" aria-label="Mobile navigation">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isNavItemActive(item.href, pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sp-bottom-nav-item ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="sp-bottom-nav-icon" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
