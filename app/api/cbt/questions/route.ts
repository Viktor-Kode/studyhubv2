import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

const ALOC_BASE = 'https://questions.aloc.com.ng/api/v2'

export async function GET(request: NextRequest) {
    // Read token INSIDE the function to ensure it's picked up from the runtime environment
    // Use trim() and check for "undefined" string which sometimes happens on some CI/CD
    const rawToken = process.env.ALOC_ACCESS_TOKEN;
    const ALOC_TOKEN = rawToken && rawToken !== 'undefined' ? rawToken.trim() : null;

    if (!ALOC_TOKEN) {
        console.error('ALOC_ACCESS_TOKEN is missing or empty in the current environment.');
        return NextResponse.json(
            {
                error: 'API Configuration Error: Access Token missing.',
                details: 'The ALOC_ACCESS_TOKEN is not correctly configured in the production environment variables.',
                tip: 'Please ensure ALOC_ACCESS_TOKEN is set in your Render dashboard Environment variables.'
            },
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

        console.log(`Fetching ALOC Questions for ${subject}...`);

        const response = await fetch(alocUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'AccessToken': ALOC_TOKEN,
                'Content-Type': 'application/json'
            },
            cache: 'no-store' // Ensure no stale data
        })

        if (response.status === 406) {
            return NextResponse.json(
                {
                    error: 'ALOC API returned 406 Not Acceptable.',
                    details: 'The AccessToken may be invalid or expired. Check questions.aloc.com.ng.'
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

        return NextResponse.json(data)

    } catch (error: any) {
        console.error('CBT proxy error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch questions' },
            { status: 500 }
        )
    }
}

