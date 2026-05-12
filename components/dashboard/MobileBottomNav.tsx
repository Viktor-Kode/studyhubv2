'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiHome, FiBook, FiAward, FiFileText } from 'react-icons/fi'

export default function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard/student', label: 'Home', icon: FiHome },
    { href: '/dashboard/library', label: 'Library', icon: FiBook },
    { href: '/dashboard/notes-history', label: 'My Notes', icon: FiFileText },
    { href: '/dashboard/student/community', label: 'Leaderboard', icon: FiAward },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 flex justify-around items-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== '/dashboard/student' && pathname.startsWith(item.href))
        
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              isActive ? 'scale-110' : 'text-gray-500 dark:text-gray-400 hover:text-purple-500'
            }`}
            style={isActive ? { color: '#8B7CF8' } : undefined}
          >
            <Icon className="text-xl" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
