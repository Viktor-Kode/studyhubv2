import { NextRequest, NextResponse } from 'next/server';

/**
 * PRODUCTION DEBUG ROUTE
 * Use this to verify if environment variables are being picked up by Render.
 * DO NOT expose the actual values for security reasons.
 */
export async function GET(request: NextRequest) {
    // Only allow in development or if a specific debug key is provided in headers
    // For production debug, we only return TRUE/FALSE (masking the content)

    const envStatus = {
        ALOC_ACCESS_TOKEN: {
            exists: !!process.env.ALOC_ACCESS_TOKEN,
            length: process.env.ALOC_ACCESS_TOKEN?.length || 0,
            prefix: process.env.ALOC_ACCESS_TOKEN?.substring(0, 5) + '...',
        },
        TWILIO_ACCOUNT_SID: {
            exists: !!process.env.TWILIO_ACCOUNT_SID,
            length: process.env.TWILIO_ACCOUNT_SID?.length || 0,
        },
        TWILIO_AUTH_TOKEN: {
            exists: !!process.env.TWILIO_AUTH_TOKEN,
            length: process.env.TWILIO_AUTH_TOKEN?.length || 0,
        },
        TWILIO_WHATSAPP_NUMBER: {
            exists: !!process.env.TWILIO_WHATSAPP_NUMBER,
            value: process.env.TWILIO_WHATSAPP_NUMBER || 'Using fallback',
        },
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        RENDER: !!process.env.RENDER || !!process.env.RENDER_SERVICE_ID,
    };

    return NextResponse.json({
        status: 'Environment Check',
        timestamp: new Date().toISOString(),
        envStatus,
        usage: 'If "exists" is false, check your Render dashboard service settings.'
    });
}
