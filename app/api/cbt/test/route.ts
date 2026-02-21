import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const token = process.env.ALOC_ACCESS_TOKEN || 'NOT SET'
    const tokenPreview = token !== 'NOT SET'
        ? token.substring(0, 8) + '...'
        : 'NOT SET'

    try {
        // Test with a simple known-working request
        const testUrl = 'https://questions.aloc.com.ng/api/v2/q/5?subject=english&type=utme'

        const response = await fetch(testUrl, {
            headers: {
                'Accept': 'application/json',
                'AccessToken': process.env.ALOC_ACCESS_TOKEN || '',
            }
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
            hasData: !!(data.data && Array.isArray(data.data)),
            questionCount: data.data?.length || 0
        })
    } catch (error: any) {
        return NextResponse.json({
            tokenSet: token !== 'NOT SET',
            tokenPreview,
            error: error.message,
            hint: 'Check if ALOC_ACCESS_TOKEN is set in .env.local'
        })
    }
}
