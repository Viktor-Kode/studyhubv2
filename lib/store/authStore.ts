import { create } from 'zustand'
import type { AppRole, AppUser } from '@/lib/types/auth'

interface AuthState {
  user: AppUser | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: AppUser | null) => void
  logout: () => void
  setLoading: (loading: boolean) => void

  /** @deprecated Legacy compatibility shim — use setUser instead */
  login: (user: AppUser) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // starts true until onAuthStateChanged fires

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  login: (user) => set({ user, isAuthenticated: true, isLoading: false }),

  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),
}))

// Re-export the AppUser type so other files can import it from here
export type { AppUser, AppRole }

// ─── Firebase Token Helpers ───────────────────────────────────────────────────

/**
 * Async helper — get the current Firebase user's ID token.
 * Use this in API calls that need an Authorization header.
 */
export async function getFirebaseToken(): Promise<string | null> {
  try {
    const { auth } = await import('@/lib/firebase')
    return (await auth.currentUser?.getIdToken()) ?? null
  } catch {
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

