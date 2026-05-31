import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const rawToken = process.env.ALOC_ACCESS_TOKEN;
    const token = rawToken && rawToken !== 'undefined' ? rawToken : 'NOT SET';

    const tokenPreview = token !== 'NOT SET'
        ? token.substring(0, 8) + '...'
        : 'NOT SET'

    try {
        // Test with a simple known-working request
        const testUrl = 'https://ng-pastquestions-api.onrender.com/questions?subject=English%20Language'

        const response = await fetch(testUrl, {
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store'
        })

        const responseText = await response.text()
        let data
        try {
            data = JSON.parse(responseText)
        } catch {
            data = { rawText: responseText.substring(0, 200) }
        }

        return NextResponse.json({
            tokenSet: token !== 'NOT SET',
            tokenPreview,
            apiStatus: response.status,
            apiOk: response.ok,
            testUrl,
            responsePreview: JSON.stringify(data).substring(0, 300),
            hasData: !!(data.questions && Array.isArray(data.questions)),
            questionCount: data.questions?.length || 0
        })
    } catch (error: any) {
        return NextResponse.json({
            tokenSet: token !== 'NOT SET',
            tokenPreview,
            error: error.message,
            hint: 'Ensure ALOC_ACCESS_TOKEN is correctly set in your environment variables.'
        })
    }
}

