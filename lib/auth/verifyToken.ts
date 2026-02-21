import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this'

export async function verifyToken(request: NextRequest) {
    try {
        // Get token from cookie or header
        const token = request.cookies.get('auth-token')?.value ||
            request.headers.get('authorization')?.replace('Bearer ', '')

        if (!token) {
            return null
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string
            email: string
            role: string
        }

        return decoded
    } catch (error) {
        console.error('Token verification failed:', error)
        return null
    }
}
