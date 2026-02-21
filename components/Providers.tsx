'use client'

import { SessionProvider } from 'next-auth/react'
import AuthSync from './AuthSync'

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthSync />
            {children}
        </SessionProvider>
    )
}
