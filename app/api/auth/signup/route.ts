import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import { sendVerificationEmail } from '@/lib/email/emailService'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this'

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const { email, password, name, role } = await request.json()

        // Validation
        if (!email || !password || !name || !role) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        if (!['student', 'teacher'].includes(role)) {
            return NextResponse.json(
                { error: 'Role must be either student or teacher' },
                { status: 400 }
            )
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() })
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            )
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Generate verification token
        const verificationToken = jwt.sign(
            { email: email.toLowerCase() },
            JWT_SECRET,
            { expiresIn: '24h' }
        )

        // Create user
        const user = await User.create({
            email: email.toLowerCase(),
            password: hashedPassword,
            name: name.trim(),
            role,
            isVerified: false,
            verificationToken
        })

        // Send verification email (non-blocking)
        sendVerificationEmail(user.email, user.name, verificationToken).catch(err =>
            console.error('Failed to send verification email:', err)
        )

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
                message: 'Account created successfully! Please check your email to verify.',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isVerified: user.isVerified
                },
                token
            },
            { status: 201 }
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
        console.error('Signup error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create account' },
            { status: 500 }
        )
    }
}
