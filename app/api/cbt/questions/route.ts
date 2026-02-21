import { NextRequest, NextResponse } from 'next/server'

const ALOC_BASE = 'https://questions.aloc.com.ng/api/v2'
const ALOC_TOKEN = process.env.ALOC_ACCESS_TOKEN || ''

export async function GET(request: NextRequest) {
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

        console.log('Fetching ALOC:', alocUrl)

        const response = await fetch(alocUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'AccessToken': ALOC_TOKEN,    // MUST be "AccessToken" exactly
                'Content-Type': 'application/json'
            },
            next: { revalidate: 3600 }
        })

        const responseText = await response.text()
        // console.log('ALOC Raw Response:', responseText.substring(0, 200))

        let data
        try {
            data = JSON.parse(responseText)
        } catch {
            console.error('Failed to parse ALOC response:', responseText)
            return NextResponse.json(
                { error: 'Invalid response from questions API', raw: responseText.substring(0, 100) },
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
