import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const JWT_SECRET = process.env.JWT_SECRET || 'studyhelp_secret_key_2024'

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        let userId: string | null = null

        // 1. Try NextAuth session first
        const session = await getServerSession(authOptions)
        if (session?.user) {
            userId = (session.user as any).id
        }

        // 2. Fallback to custom JWT token
        if (!userId) {
            const token = request.cookies.get('auth-token')?.value ||
                request.headers.get('authorization')?.replace('Bearer ', '')

            if (token) {
                try {
                    const decoded = jwt.verify(token, JWT_SECRET) as any
                    userId = decoded.id || decoded.userId
                } catch (err) {
                    console.log('JWT verification failed in /me fallback')
                }
            }
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Get user
        const user = await User.findById(userId).select('-password')

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Generate a token for the user (important for backend compatibility)
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
                isVerified: user.isVerified,
                avatar: user.avatar,
                oauthProvider: user.oauthProvider || null,
                createdAt: user.createdAt
            }
        })

    } catch (error: any) {
        console.error('Get user error:', error)
        return NextResponse.json(
            { error: 'Failed to get user' },
            { status: 500 }
        )
    }
}
