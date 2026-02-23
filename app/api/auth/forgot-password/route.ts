import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json(
        { message: 'This endpoint is deprecated. Password reset is now handled client-side via Firebase.' },
        { status: 200 }
    )
}
