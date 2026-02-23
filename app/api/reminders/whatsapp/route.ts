
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // Read variables inside the handler for true runtime access
    const rawSid = process.env.TWILIO_ACCOUNT_SID;
    const rawToken = process.env.TWILIO_AUTH_TOKEN;

    const accountSid = rawSid && rawSid !== 'undefined' ? rawSid.trim() : null;
    const authToken = rawToken && rawToken !== 'undefined' ? rawToken.trim() : null;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    try {
        const { phoneNumber, message, reminderTitle, forceText } = await request.json()

        // Validate configurations inside the handler
        if (!accountSid || !authToken) {
            console.error('Twilio credentials missing or invalid in environment.');
            return NextResponse.json(
                {
                    error: 'Twilio Configuration Error: Missing SID or Token in production environment.',
                    details: 'Ensure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set in your Render dashboard.',
                    setupRequired: true
                },
                { status: 503 }
            )
        }

        // Initialize client on the fly inside the request handler
        const twilioClient = twilio(accountSid, authToken);

        // Validate phone number format
        if (!phoneNumber || !phoneNumber.startsWith('whatsapp:')) {
            return NextResponse.json(
                { error: 'Phone number must be in format: whatsapp:+1234567890' },
                { status: 400 }
            )
        }

        // Send WhatsApp message
        const contentSid = process.env.TWILIO_CONTENT_SID
        let messageOptions: any = {
            from: whatsappNumber.trim(),
            to: phoneNumber.trim()
        }

        if (contentSid && !forceText) {
            const now = new Date()
            const dateStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
            const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase()

            messageOptions.contentSid = contentSid.trim()
            messageOptions.contentVariables = JSON.stringify({
                "1": dateStr,
                "2": timeStr
            })
        } else {
            messageOptions.body = message || `📚 Study Reminder: ${reminderTitle}`
        }

        const twilioMessage = await twilioClient.messages.create(messageOptions)

        return NextResponse.json({
            success: true,
            messageSid: twilioMessage.sid,
            status: twilioMessage.status
        })

    } catch (error: any) {
        console.error('WhatsApp send error:', error)

        if (error.code === 21211) {
            return NextResponse.json(
                { error: 'Invalid WhatsApp number. Make sure it starts with whatsapp:+countrycode' },
                { status: 400 }
            )
        }

        if (error.code === 63007) {
            return NextResponse.json(
                {
                    error: 'This number has not joined the WhatsApp sandbox. Send "join <code>" to the Twilio number first.',
                    sandboxRequired: true
                },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: error.message || 'Failed to send WhatsApp message' },
            { status: 500 }
        )
    }
}

