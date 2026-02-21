import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this'

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const { token } = await request.json()

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            )
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET) as any

            // Find user
            const user = await User.findOne({
                email: decoded.email,
                verificationToken: token
            })

            if (!user) {
                return NextResponse.json(
                    { error: 'Invalid or expired verification token' },
                    { status: 400 }
                )
            }

            // Update user
            user.isVerified = true
            user.verificationToken = undefined
            await user.save()

            return NextResponse.json({
                success: true,
                message: 'Email verified successfully! You can now login.'
            })

        } catch (err: any) {
            if (err.name === 'TokenExpiredError') {
                return NextResponse.json(
                    { error: 'Verification link has expired' },
                    { status: 400 }
                )
            }
            return NextResponse.json(
                { error: 'Invalid verification token' },
                { status: 400 }
            )
        }

    } catch (error: any) {
        console.error('Verify email error:', error)
        return NextResponse.json(
            { error: 'Failed to verify email' },
            { status: 500 }
        )
    }
}
