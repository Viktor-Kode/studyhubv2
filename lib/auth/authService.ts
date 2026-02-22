import { useAuthStore } from '@/lib/store/authStore'

// Use internal proxy by default to avoid CORS and cross-site cookies
const API_URL = '/api/backend'

interface SignupData {
    email: string
    password: string
    name: string
    role: 'student' | 'teacher'
}

interface LoginData {
    email: string
    password: string
}

/**
 * Normalizes the backend auth response.
 * Backend returns: { status, token, data: { user } }
 * We normalize to: { user, token }
 */
function normalizeAuthResponse(result: any): { user: any; token: string } {
    // Handle backend format: { status, token, data: { user } }
    if (result.data?.user) {
        const user = result.data.user
        return {
            token: result.token,
            user: {
                id: user._id || user.id,
                email: user.email,
                name: user.name,
                role: user.role || 'student',
                isVerified: user.isVerified ?? true,
                avatar: user.avatar,
                oauthProvider: user.oauthProvider || null,
            }
        }
    }
    // Handle already-normalized format: { user, token }
    if (result.user) {
        return {
            token: result.token,
            user: {
                id: result.user._id || result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: result.user.role || 'student',
                isVerified: result.user.isVerified ?? true,
                avatar: result.user.avatar,
                oauthProvider: result.user.oauthProvider || null,
            }
        }
    }
    throw new Error('Invalid auth response format')
}

export const authService = {
    async signup(data: SignupData) {
        // Backend route: POST /api/users/ (signup)
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        })

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.message || result.error || 'Signup failed')
        }

        return normalizeAuthResponse(result)
    },

    async login(data: LoginData) {
        // Backend route: POST /api/users/login
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        })

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.message || result.error || 'Login failed')
        }

        return normalizeAuthResponse(result)
    },

    async logout() {
        try {
            await fetch(`${API_URL}/users/logout`, {
                method: 'POST',
                credentials: 'include'
            })
        } catch {
            // Ignore logout errors - we still clear local state
        }
    },

    async getCurrentUser() {
        const response = await fetch('/api/auth/me')

        if (!response.ok) {
            throw new Error('Not authenticated')
        }

        const result = await response.json()
        return result
    },

    async forgotPassword(email: string) {
        const response = await fetch(`${API_URL}/users/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to send reset email')
        }

        return result
    },

    async resetPassword(token: string, password: string) {
        const response = await fetch(`${API_URL}/users/reset-password/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        })

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.message || result.error || 'Failed to reset password')
        }

        return result
    },

    async completeOAuthProfile(role: 'student' | 'teacher', name?: string) {
        const response = await fetch('/api/auth/oauth/complete-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role, name })
        })

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.error || 'Failed to complete profile')
        }

        return result
    }
}
