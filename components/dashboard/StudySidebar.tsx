'use client'

import Image from 'next/image'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FiHome,
  FiMap,
  FiFileText,
  FiBarChart2,
  FiUser,
  FiUsers,
  FiPhone,
  FiLogOut
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { IoSparklesSharp } from 'react-icons/io5'
import { firebaseSignOut } from '@/lib/firebase-auth'
import './study-nav.css'

const NAV_ITEMS = [
  { href: '/dashboard/student/map/default', label: 'Map', icon: FiMap },
  { href: '/dashboard/notes-history', label: 'Notes', icon: FiFileText },
  { href: '/dashboard/student', label: 'Home', icon: FiHome },
  { href: '/dashboard/analytics', label: 'Analytics', icon: FiBarChart2 },
  { href: '/dashboard/profile', label: 'Profile', icon: FiUser }
]

const SUPPORT_PHONE = '+2349163345794'

export default function StudySidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    // Home should only light up on the home route, not every student subpage
    if (href === '/dashboard/student') return pathname === href
    if (href === '/dashboard/student/map/default') return pathname.includes('/dashboard/student/map')
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleLogout = async () => {
    await firebaseSignOut()
    router.push('/auth/login')
  }

  return (
    <>
      <aside className="sp-sidebar">
        <Link href="/dashboard/student" className="sp-logo-wrap">
          <div className="sp-logo-icon" style={{ overflow: 'hidden', borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

        <nav>
          <ul className="sp-nav-list">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`sp-nav-item ${isActive(item.href) ? 'active' : ''}`}
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

          <a href={`tel:${SUPPORT_PHONE}`} className="sp-nav-support-link">
            <FiPhone className="sp-nav-support-icon call" />
            <span>Call Support</span>
          </a>

          <a
            href={`https://wa.me/${SUPPORT_PHONE.replace('+', '')}`}
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

      <nav className="sp-bottom-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sp-bottom-nav-item ${isActive(item.href) ? 'active' : ''}`}
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
