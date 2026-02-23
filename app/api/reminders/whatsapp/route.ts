import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

const BACKEND_BASE = process.env.BACKEND_API_URL || 'https://studyhelp-zyqw.onrender.com/api'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        console.log('Forwarding WhatsApp request to backend...');

        const response = await fetch(`${BACKEND_BASE}/reminders/whatsapp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('Authorization') || '',
            },
            body: JSON.stringify(body),
            cache: 'no-store'
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Backend WhatsApp Error:', data);
            return NextResponse.json(data, { status: response.status })
        }

        return NextResponse.json(data)

    } catch (error: any) {
        console.error('Frontend WhatsApp proxy error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to send WhatsApp via backend proxy' },
            { status: 500 }
        )
    }
}


