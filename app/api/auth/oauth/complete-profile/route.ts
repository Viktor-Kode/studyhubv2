import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Session not found. Please log in again.' },
                { status: 401 }
            )
        }

        const { role, name } = await request.json()

        if (!role || !['student', 'teacher'].includes(role)) {
            return NextResponse.json(
                { error: 'Valid role is required (student or teacher).' },
                { status: 400 }
            )
        }

        await connectDB()

        const userEmail = session.user.email.toLowerCase()
        console.log('[ProfileComplete] Attempting update for:', userEmail)

        // Find user by email
        let user = await User.findOne({ email: userEmail })

        if (!user) {
            console.log('[ProfileComplete] User not found, creating new entry')
            user = new User({
                email: userEmail,
                name: name || session.user.name || 'Anonymous',
                role: role,
                isVerified: true,
                oauthProvider: 'google',
                avatar: session.user.image
            })
        } else {
            console.log('[ProfileComplete] User found, updating role and name')
            user.role = role
            if (name) user.name = name
            user.isVerified = true
        }

        try {
            await user.save()
            console.log('[ProfileComplete] Save successful')
        } catch (saveError: any) {
            console.error('[ProfileComplete] Save failed:', saveError)
            return NextResponse.json(
                { error: `Database error: ${saveError.message}` },
                { status: 400 }
            )
        }

        // Generate JWT for backend
        const jwt = require('jsonwebtoken')
        const JWT_SECRET = process.env.JWT_SECRET || 'studyhelp_secret_key_2024'
        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '90d' }
        )

        return NextResponse.json({
            success: true,
            token, // Added token here
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                isVerified: user.isVerified ?? true,
                oauthProvider: user.oauthProvider || 'google'
            }
        })

    } catch (error: any) {
        console.error('[ProfileComplete] CRITICAL ERROR:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        })
        return NextResponse.json(
            { error: `Internal Server Error [PC-01]: ${error.message}` },
            { status: 500 }
        )
    }
}
