'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/store/themeStore'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    const size = typeof localStorage !== 'undefined' ? localStorage.getItem('fontSize') : null
    const sizes: Record<string, string> = { small: '14px', medium: '16px', large: '18px' }
    document.documentElement.style.fontSize = sizes[size || 'medium'] || sizes.medium
  }, [])

  return <>{children}</>
}
