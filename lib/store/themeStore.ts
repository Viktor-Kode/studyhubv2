import { create } from 'zustand'

function getThemeCookie(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark'
  const match = document.cookie.match(/(^| )theme=([^;]+)/)
  const val = match ? decodeURIComponent(match[2]) : null
  return val === 'light' ? 'light' : 'dark'
}

function setThemeCookie(theme: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + 365 * 864e5).toUTCString()
  document.cookie = `theme=${theme}; expires=${expires}; path=/; SameSite=Lax`
}

interface ThemeState {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useThemeStore = create<ThemeState>()((set) => ({
  theme: 'dark',
  toggleTheme: () => set((state) => {
    const next = state.theme === 'light' ? 'dark' : 'light'
    setThemeCookie(next)
    return { theme: next }
  }),
  setTheme: (theme) => {
    setThemeCookie(theme)
    set({ theme })
  },
}))

// Initialize from cookie on client
if (typeof window !== 'undefined') {
  useThemeStore.setState({ theme: getThemeCookie() })
}
