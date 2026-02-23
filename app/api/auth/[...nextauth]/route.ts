/**
 * NextAuth route — DEPRECATED.
 * Authentication is now handled by Firebase. This file is kept as a stub
 * to avoid 404s from any lingering references, but it does nothing.
 */
import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({ message: 'Auth is now handled by Firebase' }, { status: 200 })
}

export async function POST() {
    return NextResponse.json({ message: 'Auth is now handled by Firebase' }, { status: 200 })
}
