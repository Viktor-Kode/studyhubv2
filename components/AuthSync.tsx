'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useAuthStore } from '@/lib/store/authStore'
import { authService } from '@/lib/auth/authService'

export default function AuthSync() {
    const { data: session, status } = useSession()
    const { login, logout, user: storeUser } = useAuthStore()

    useEffect(() => {
        const syncSession = async () => {
            if (status === 'authenticated' && session?.user) {
                const hasAccountMismatch = !storeUser || storeUser.email !== session.user.email
                const isMissingOAuthInfo = storeUser && !storeUser.oauthProvider
                const isMissingToken = !useAuthStore.getState().token

                if (hasAccountMismatch || isMissingOAuthInfo || isMissingToken) {
                    console.log('[AuthSync] Re-hydrating session with backend token...');
                    try {
                        // Fetch fresh user data + token from our local API
                        const result = await authService.getCurrentUser()
                        if (result.user && result.token) {
                            login(result.user, result.token)
                            console.log('[AuthSync] Sync successful');
                        }
                    } catch (err) {
                        console.error('[AuthSync] Failed to fetch backend token for session:', err);
                    }
                }
            } else if (status === 'unauthenticated' && storeUser?.oauthProvider === 'google') {
                console.log('[AuthSync] OAuth session expired, logging out');
                logout()
            }
        }

        syncSession()
    }, [status, session?.user?.email, storeUser?.email, storeUser?.oauthProvider])

    return null
}
