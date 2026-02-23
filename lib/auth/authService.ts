/**
 * API Service — handles all backend REST calls.
 * Authentication is now managed entirely by Firebase.
 * This file only contains non-auth API helpers used by the app features.
 *
 * To get the current Firebase ID token for authenticated requests, use:
 *   import { auth } from '@/lib/firebase'
 *   const token = await auth.currentUser?.getIdToken()
 */

const API_URL = '/api/backend'

/** Get an Authorization header using the current Firebase user's ID token. */
export async function getAuthHeader(): Promise<Record<string, string>> {
    try {
        const { auth } = await import('@/lib/firebase')
        const token = await auth.currentUser?.getIdToken()
        return token ? { Authorization: `Bearer ${token}` } : {}
    } catch {
        return {}
    }
}

/** Generic authenticated GET request to the backend proxy. */
export async function apiGet<T = any>(path: string): Promise<T> {
    const headers = await getAuthHeader()
    const res = await fetch(`${API_URL}${path}`, {
        headers: { 'Accept': 'application/json', ...headers },
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || `Request failed: ${res.status}`)
    }
    return res.json()
}

/** Generic authenticated POST request to the backend proxy. */
export async function apiPost<T = any>(path: string, body?: unknown): Promise<T> {
    const headers = await getAuthHeader()
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || `Request failed: ${res.status}`)
    }
    return res.json()
}

/** Generic authenticated PATCH request to the backend proxy. */
export async function apiPatch<T = any>(path: string, body?: unknown): Promise<T> {
    const headers = await getAuthHeader()
    const res = await fetch(`${API_URL}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || `Request failed: ${res.status}`)
    }
    return res.json()
}

/** Generic authenticated DELETE request to the backend proxy. */
export async function apiDelete<T = any>(path: string): Promise<T> {
    const headers = await getAuthHeader()
    const res = await fetch(`${API_URL}${path}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json', ...headers },
    })
    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || `Request failed: ${res.status}`)
    }
    return res.json()
}

/**
 * @deprecated Legacy shim — kept so existing code that imports authService won't break at compile time.
 * All actual auth is now handled by Firebase in lib/firebase-auth.ts
 */
export const authService = {
    /** @deprecated Use firebaseSignOut from lib/firebase-auth instead */
    async logout() {
        const { firebaseSignOut } = await import('@/lib/firebase-auth')
        return firebaseSignOut()
    },

    /** @deprecated No longer needed — Firebase onAuthStateChanged handles session */
    async getCurrentUser() {
        console.warn('[authService.getCurrentUser] Deprecated — use useAuthStore() instead')
        return null
    },

    /** @deprecated Not used with Firebase auth */
    async forgotPassword(email: string) {
        const { sendPasswordResetEmail } = await import('firebase/auth')
        const { auth } = await import('@/lib/firebase')
        await sendPasswordResetEmail(auth, email)
        return { message: 'Password reset email sent' }
    },

    /** @deprecated Not needed with Firebase auth */
    async completeOAuthProfile(_role: string, _name?: string) {
        console.warn('[authService.completeOAuthProfile] Deprecated — use saveUserRole from lib/firebase-auth instead')
        return null
    },
}
