import { NextRequest, NextResponse } from 'next/server'

const ALOC_BASE = 'https://questions.aloc.com.ng/api/v2'
export async function GET(request: NextRequest) {
    // Read token INSIDE the function to ensure it's picked up from the runtime environment
    const ALOC_TOKEN = process.env.ALOC_ACCESS_TOKEN;

    if (!ALOC_TOKEN) {
        console.error('ALOC_ACCESS_TOKEN is missing in the current environment.');
        return NextResponse.json(
            { error: 'API Configuration Error: Access Token missing. Please check Render Environment Variables.' },
            { status: 500 }
        );
    }

    try {
        const { searchParams } = new URL(request.url)
        const subject = searchParams.get('subject') || 'english'
        const year = searchParams.get('year') || ''
        const type = searchParams.get('type') || 'utme'
        const amount = searchParams.get('amount') || '20'

        // CORRECT ALOC URL FORMAT: amount is in the path /q/{amount}
        let alocUrl = `${ALOC_BASE}/m/${amount}?subject=${subject}&type=${type}`

        // Year is optional
        if (year) {
            alocUrl += `&year=${year}`
        }

        console.log('Fetching ALOC Questions...');

        const response = await fetch(alocUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*', // More permissive Accept header
                'AccessToken': ALOC_TOKEN.trim(),    // Trim whitespace
                'Content-Type': 'application/json'
            },
            next: { revalidate: 3600 }
        })

        if (response.status === 406) {
            return NextResponse.json(
                {
                    error: 'ALOC API returned 406 Not Acceptable.',
                    details: 'This often means the AccessToken is invalid or not recognized by their server. Please check your token on questions.aloc.com.ng dashboard.'
                },
                { status: 406 }
            );
        }

        const responseText = await response.text()

        let data
        try {
            data = JSON.parse(responseText)
        } catch {
            console.error('Failed to parse ALOC response:', responseText)
            return NextResponse.json(
                {
                    error: 'Invalid response from questions API',
                    status: response.status,
                    raw: responseText.substring(0, 200)
                },
                { status: 500 }
            )
        }

        if (!response.ok) {
            console.error('ALOC error status:', response.status, data)
            return NextResponse.json(
                { error: `API error: ${response.status}`, details: data },
                { status: response.status }
            )
        }

        // ALOC returns { status: true, message: "...", data: [...] }
        // OR sometimes { status: true, token: "...", data: [...] }
        return NextResponse.json(data)

    } catch (error: any) {
        console.error('CBT proxy error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch questions' },
            { status: 500 }
        )
    }
}
