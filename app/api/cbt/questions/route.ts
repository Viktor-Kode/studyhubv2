import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

// Use backend proxy for CBT questions to centralize token management
const BACKEND_BASE = process.env.BACKEND_API_URL || 'https://studyhelp-zyqw.onrender.com/api'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const subject = searchParams.get('subject') || 'english'
        const year = searchParams.get('year') || ''
        const type = searchParams.get('type') || 'utme'
        const amount = searchParams.get('amount') || '20'

        // Centralized URL for the backend proxy
        const backendUrl = `${BACKEND_BASE}/cbt/questions?subject=${subject}&type=${type}&year=${year}&amount=${amount}`

        console.log(`Delegating CBT Fetch to backend: ${subject}...`);

        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                // Authorization will be handled if the backend proxy requires it (it does)
                // But the frontend api route running server-side won't have the user token 
                // unless we forward it from the incoming request.
                'Authorization': request.headers.get('Authorization') || '',
            },
            cache: 'no-store'
        })

        const data = await response.json()

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status })
        }

        return NextResponse.json(data)

    } catch (error: any) {
        console.error('Frontend CBT proxy error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch questions via backend proxy' },
            { status: 500 }
        )
    }
}


