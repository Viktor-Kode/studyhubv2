import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json(
        { message: 'This endpoint is deprecated. Authentication is now handled client-side via Firebase.' },
        { status: 200 }
    )
}
