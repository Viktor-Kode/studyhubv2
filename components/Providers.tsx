'use client'

import AuthSync from './AuthSync'

/**
 * Providers
 * Minimal provider wrapper — we no longer need NextAuth's SessionProvider.
 * Firebase handles session persistence via IndexedDB/localStorage natively.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AuthSync />
            {children}
        </>
    )
}
