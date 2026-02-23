import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json(
        { message: 'This endpoint is deprecated. Email verification is now handled via Firebase.' },
        { status: 200 }
    )
}
