import { create } from 'zustand'
import type { AppRole, AppUser } from '@/lib/types/auth'
import { LS_CHAT_HIDDEN, LS_TOUR_HIDDEN } from '@/lib/store/helpWidgetsStore'

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
      const tour = localStorage.getItem(LS_TOUR_HIDDEN)
      const chat = localStorage.getItem(LS_CHAT_HIDDEN)
      localStorage.clear()
      if (tour != null) localStorage.setItem(LS_TOUR_HIDDEN, tour)
      if (chat != null) localStorage.setItem(LS_CHAT_HIDDEN, chat)
    }
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  refreshUser: async () => {
    try {
      const { apiClient } = await import('@/lib/api/client')
      const response = await apiClient.get('/users/me')
      if (response.data?.data?.user) {
        const u = response.data.data.user
        const prev = useAuthStore.getState().user
        // Prefer the role already resolved from Firebase/Firestore,
        // and only accept a backend role if it is a known value.
        const validRoles: AppRole[] = ['student', 'teacher', 'admin']
        const backendRole = (u.role as AppRole | undefined)
        let resolvedRole: AppRole =
          backendRole && validRoles.includes(backendRole)
            ? backendRole
            : (prev?.role ?? 'student')
        // Firestore can be ahead of Mongo until the next API sync; avoid a one-frame "student" flash for teachers.
        if (prev?.role === 'teacher' && resolvedRole === 'student') {
          resolvedRole = 'teacher'
        }

        const merged: AppUser = {
          ...(prev || { uid: '', email: '', name: '', role: 'student' as AppRole }),
          uid: u.uid || prev?.uid || '',
          email: u.email ?? prev?.email ?? '',
          name: u.name ?? prev?.name ?? '',
          role: resolvedRole,
          schoolName: u.schoolName ?? prev?.schoolName,
          classLevel: u.classLevel ?? prev?.classLevel,
          courseOfStudy: u.courseOfStudy ?? prev?.courseOfStudy,
          avatar: prev?.avatar,
          provider: prev?.provider,
          preferences: u.preferences ?? prev?.preferences,
          notificationsEnabled: u.notificationsEnabled ?? prev?.notificationsEnabled,
          plan: u.plan ?? prev?.plan,
          onboarding: u.onboarding ?? prev?.onboarding,
          progress: u.progress ?? prev?.progress,
        }
        set({ user: merged, isAuthenticated: true })
        const { useHelpWidgetsStore } = await import('@/lib/store/helpWidgetsStore')
        useHelpWidgetsStore.getState().applyServerPreferences(merged.preferences)
      }
    } catch (err) {
      console.error('[refreshUser] Failed:', err)
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
}))

// Re-export the AppUser type so other files can import it from here
export type { AppUser, AppRole }

let authInitialized = false
let authInitPromise: Promise<any> | null = null

/**
 * Wait for Firebase to finish loading the initial auth state.
 * Returns the current user if authenticated, or null if not.
 */
export async function waitForAuth(): Promise<any> {
  const { auth } = await import('@/lib/firebase')

  // 1. If already initialized, return immediately
  if (authInitialized && auth.currentUser) return auth.currentUser
  if (authInitialized && !auth.currentUser) return null

  // 2. Return existing promise if already waiting
  if (authInitPromise) return authInitPromise

  // 3. Wait for onAuthStateChanged to fire at least once, with a timeout
  // so API calls do not hang forever if Firebase fails to initialize.
  authInitPromise = new Promise((resolve) => {
    let settled = false
    const timeoutId = setTimeout(() => {
      if (settled) return
      settled = true
      authInitialized = true
      unsubscribe()
      resolve(null)
    }, 8000)

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (settled) return
      settled = true
      authInitialized = true
      clearTimeout(timeoutId)
      unsubscribe()
      resolve(user)
    })
  })

  return authInitPromise
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

