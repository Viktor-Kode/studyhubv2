'use client'

import { useState } from 'react'
import Header from './Header'
import Sidebar from '@/components/dashboard/Sidebar'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
      <Header onMenuClick={toggleMobileMenu} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isMobileOpen={isMobileMenuOpen} onMobileClose={closeMobileMenu} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
