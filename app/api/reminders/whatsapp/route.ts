
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'

let twilioClient: any = null

// Only initialize if credentials exist
if (accountSid && authToken) {
    try {
        twilioClient = twilio(accountSid, authToken)
    } catch (error) {
        console.error('Failed to initialize Twilio client:', error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const { phoneNumber, message, reminderTitle, forceText } = await request.json()

        if (!twilioClient) {
            return NextResponse.json(
                {
                    error: 'WhatsApp notifications not configured. Please add Twilio credentials to .env.local',
                    setupRequired: true
                },
                { status: 503 }
            )
        }

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
            from: whatsappNumber,
            to: phoneNumber
        }

        if (contentSid && !forceText) {
            // Use Content Template if available (preferred for WhatsApp)
            // We map "1" to Date and "2" to Time based on user's snippet
            const now = new Date()
            const dateStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) // 12/1 format
            const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase() // 3:00pm format

            messageOptions.contentSid = contentSid
            messageOptions.contentVariables = JSON.stringify({
                "1": dateStr,
                "2": timeStr
            })
        } else {
            // Fallback to freeform text
            // Ensure we have a body if we are forcing text or if no template exists
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

        // Handle specific Twilio errors
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
