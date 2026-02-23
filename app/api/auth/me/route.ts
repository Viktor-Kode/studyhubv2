/**
 * /api/auth/me — DEPRECATED.
 * Session management is now handled by Firebase's onAuthStateChanged.
 * The user object and role are read from Zustand (hydrated from Firestore).
 */
import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json(
        { message: 'Session is now managed by Firebase. Use useAuthStore() on the client.' },
        { status: 200 }
    )
}
