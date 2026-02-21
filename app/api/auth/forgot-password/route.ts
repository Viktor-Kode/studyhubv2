import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import { sendPasswordResetEmail } from '@/lib/email/emailService'

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const { email } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() })

        // Don't reveal if user exists or not (security)
        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            })
        }

        // Check if OAuth user
        if (user.oauthProvider) {
            return NextResponse.json(
                { error: `This account uses ${user.oauthProvider} sign-in. Password reset is not available.` },
                { status: 400 }
            )
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex')
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex')

        // Save token to user (expires in 1 hour)
        user.resetPasswordToken = resetTokenHash
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000)
        await user.save()

        // Send email (non-blocking)
        sendPasswordResetEmail(user.email, user.name, resetToken).catch(err =>
            console.error('Failed to send reset email:', err)
        )

        return NextResponse.json({
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.'
        })

    } catch (error: any) {
        console.error('Forgot password error:', error)
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        )
    }
}
