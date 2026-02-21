import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
  role: 'student' | 'teacher'
  isVerified: boolean
  avatar?: string
  oauthProvider?: 'google' | null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

// Helper: set a cookie (client-side, no expiry = session cookie)
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

// Helper: get a cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

// Helper: delete a cookie
function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

// Initial state helper
const getInitialToken = () => {
  if (typeof document === 'undefined') return null
  return getCookie('auth-token')
}

export const useAuthStore = create<AuthState>()((set) => {
  const initialToken = getInitialToken()

  return {
    user: null,
    token: initialToken,
    isAuthenticated: false, // Will be set to true after re-hydration if token exists
    isLoading: true,

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setToken: (token) => {
      if (token) {
        setCookie('auth-token', token)
      } else {
        deleteCookie('auth-token')
      }
      set({ token })
    },

    login: (user, token) => {
      const currentToken = getCookie('auth-token')
      const currentState = useAuthStore.getState()

      // Prevent redundant updates if state is already identical
      if (
        currentState.isAuthenticated &&
        currentState.user?.email === user.email &&
        currentState.token === token
      ) {
        return
      }

      setCookie('auth-token', token)
      set({ user, token, isAuthenticated: true, isLoading: false })
    },

    logout: () => {
      deleteCookie('auth-token')
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    },

    setLoading: (isLoading) => set({ isLoading }),

    // New action to re-hydrate from cookies
    hydrate: () => {
      const token = getCookie('auth-token')
      if (token && !initialToken) {
        set({ token })
      }
    }
  }
})

// Token is stored in a cookie, NOT localStorage
export function getTokenFromCookie(): string | null {
  const token = getCookie('auth-token')
  return token || null
}
