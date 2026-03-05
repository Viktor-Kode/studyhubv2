'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const SKIP_PATHS = ['/auth/login', '/auth/signup', '/auth/register', '/payment/verify']

export function useSaveLastPage() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    const shouldSkip = SKIP_PATHS.some((p) => pathname.startsWith(p))
    if (!shouldSkip) {
      try {
        localStorage.setItem('lastPage', pathname)
      } catch {
        // ignore
      }
    }
  }, [pathname])
}
