import { create } from 'zustand'
import type { AppRole, AppUser } from '@/lib/types/auth'

interface AuthState {
  user: AppUser | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: AppUser | null) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  refreshUser: () => Promise<void>

  /** @deprecated Legacy compatibility shim — use setUser instead */
  login: (user: AppUser) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // starts true until onAuthStateChanged fires

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  login: (user) => set({ user, isAuthenticated: true, isLoading: false }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  refreshUser: async () => {
    try {
      const { apiClient } = await import('@/lib/api/client')
      const response = await apiClient.get('/users/me')
      if (response.data?.data?.user) {
        set({ user: response.data.data.user, isAuthenticated: true })
      }
    } catch (err) {
      console.error('[refreshUser] Failed:', err)
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
}))

// Re-export the AppUser type so other files can import it from here
export type { AppUser, AppRole }

// ─── Firebase Token Helpers ───────────────────────────────────────────────────

/**
 * Wait for Firebase to finish loading the initial auth state.
 * Returns the current user if authenticated, or null if not.
 */
export async function waitForAuth(): Promise<any> {
  const { auth } = await import('@/lib/firebase')

  // 1. If already initialized, return immediately
  if (auth.currentUser) return auth.currentUser

  // 2. Wait for onAuthStateChanged to fire at least once
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

/**
 * Async helper — get the current Firebase user's ID token.
 * Use this in API calls that need an Authorization header.
 */
export async function getFirebaseToken(forceRefresh = false): Promise<string | null> {
  try {
    const user = await waitForAuth()
    if (!user) return null

    // Fetch a fresh token, forcing a refresh if requested
    return await user.getIdToken(forceRefresh)
  } catch (err) {
    console.error('[getFirebaseToken] Failed:', err)
    return null
  }
}

/**
 * @deprecated — Sync shim for legacy code.
 * Returns null immediately; migrate callers to use getFirebaseToken() instead.
 * We keep this export so files that import it still compile without errors.
 */
export function getTokenFromCookie(): string | null {
  return null
}

