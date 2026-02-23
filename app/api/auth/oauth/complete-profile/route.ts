import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json(
        { message: 'This endpoint is deprecated. OAuth profile completion is now handled via Firebase and Firestore.' },
        { status: 200 }
    )
}
