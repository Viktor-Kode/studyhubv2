'use client'

import { useEffect } from 'react'
import { subscribeToAuthState } from '@/lib/firebase-auth'
import { useAuthStore } from '@/lib/store/authStore'

/**
 * AuthSync
 * Mounts once at the app root. Subscribes to Firebase's onAuthStateChanged,
 * which then pushes the user + role into Zustand on every page load / refresh.
 * No NextAuth dependency.
 */
export default function AuthSync() {
    useEffect(() => {
        let unsubscribe: () => void = () => { }
        try {
            unsubscribe = subscribeToAuthState()
        } catch (err) {
            console.error('[AuthSync] subscribeToAuthState crashed:', err)
            useAuthStore.getState().setLoading(false)
        }
        return () => unsubscribe()
    }, [])

    return null
}
