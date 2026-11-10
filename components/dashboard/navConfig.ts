import React from 'react'
import {
  FiMap,
  FiFileText,
  FiHome,
  FiBarChart2,
  FiUser
} from 'react-icons/fi'

export interface DashboardNavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; size?: number }>
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { href: '/dashboard/student/map/default', label: 'Map', icon: FiMap },
  { href: '/dashboard/notes-history', label: 'Notes', icon: FiFileText },
  { href: '/dashboard/student', label: 'Home', icon: FiHome },
  { href: '/dashboard/analytics', label: 'Analytics', icon: FiBarChart2 },
  { href: '/dashboard/settings', label: 'Profile', icon: FiUser }
]

export const SUPPORT_PHONE = '+2349163345794'
export const SUPPORT_PHONE_DISPLAY = '+234 916 334 5794'
export const SUPPORT_CALL_URL = `tel:${SUPPORT_PHONE}`
export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE.replace('+', '')}`

/**
 * Shared active route matcher for sidebar and bottom nav items
 */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (!pathname) return false
  if (href === '/dashboard/student') {
    return pathname === '/dashboard/student'
  }
  if (href === '/dashboard/student/map/default') {
    return pathname.includes('/dashboard/student/map')
  }
  if (href === '/dashboard/settings') {
    return pathname.startsWith('/dashboard/settings') || pathname.startsWith('/dashboard/profile')
  }
  return pathname === href || pathname.startsWith(href + '/')
}

