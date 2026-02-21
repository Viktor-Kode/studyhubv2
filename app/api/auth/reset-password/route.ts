import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const { token, password } = await request.json()

        if (!token || !password) {
            return NextResponse.json(
                { error: 'Token and password are required' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        // Hash the token from URL
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex')

        // Find user with valid token
        const user = await User.findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpires: { $gt: new Date() }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired reset token' },
                { status: 400 }
            )
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Update user
        user.password = hashedPassword
        user.resetPasswordToken = undefined
        user.resetPasswordExpires = undefined
        await user.save()

        return NextResponse.json({
            success: true,
            message: 'Password reset successful. You can now login with your new password.'
        })

    } catch (error: any) {
        console.error('Reset password error:', error)
        return NextResponse.json(
            { error: 'Failed to reset password' },
            { status: 500 }
        )
    }
}
