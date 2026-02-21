import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this'

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const { email, password } = await request.json()

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Find user (include password field)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Check if user signed up with OAuth
        if (!user.password && user.oauthProvider) {
            return NextResponse.json(
                { error: `Please sign in with ${user.oauthProvider}` },
                { status: 401 }
            )
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password!)

        if (!isMatch) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            )
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        // Create response
        const response = NextResponse.json(
            {
                success: true,
                message: 'Login successful',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isVerified: user.isVerified,
                    avatar: user.avatar
                },
                token
            },
            { status: 200 }
        )

        // Set HTTP-only cookie
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        })

        return response

    } catch (error: any) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to login' },
            { status: 500 }
        )
    }
}
