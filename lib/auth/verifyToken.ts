import { NextRequest } from 'next/server'
import { adminAuth } from './firebase-admin'
import { connectDB } from '../db/mongodb'
import User from '../models/User'

export async function verifyToken(request: NextRequest) {
    try {
        let token: string | undefined

        // Get token from header
        const authHeader = request.headers.get('authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split('Bearer ')[1]
        } else {
            // Check cookies
            token = request.cookies.get('auth-token')?.value
        }

        if (!token) {
            console.warn('[verifyToken] No token found in headers or cookies')
            return null
        }

        // Verify Firebase ID token
        // Use checkRevoked: true to ensure the token hasn't been revoked since issuance
        const decodedToken = await adminAuth.verifyIdToken(token, true)

        await connectDB()
        
        console.log(`[verifyToken] Successfully verified token for UID: ${decodedToken.uid}`)

        // Find user by firebaseUid or email
        let mongoUser = await User.findOne({ firebaseUid: decodedToken.uid })

        if (!mongoUser && decodedToken.email) {
            mongoUser = await User.findOne({ email: decodedToken.email.toLowerCase() })
            if (mongoUser) {
                // Link them
                mongoUser.firebaseUid = decodedToken.uid
                await mongoUser.save()
            }
        }

        if (!mongoUser) {
            // Auto-create user in MongoDB if not found
            mongoUser = await User.create({
                firebaseUid: decodedToken.uid,
                email: decodedToken.email?.toLowerCase(),
                name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
                role: (decodedToken as any).role || 'student',
                isVerified: true
            })
        }

        return {
            userId: mongoUser._id.toString(),
            email: mongoUser.email,
            role: mongoUser.role
        }
    } catch (error: any) {
        console.error('[verifyToken] Auth Failure Details:', {
            code: error?.code,
            message: error?.message,
            tokenPrefix: token?.substring(0, 15)
        })
        return null
    }
}
