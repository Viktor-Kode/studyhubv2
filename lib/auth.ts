import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { connectDB } from '@/lib/db/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: 'consent',
                    access_type: 'offline',
                    response_type: 'code'
                }
            }
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                await connectDB()
                const user = await User.findOne({ email: credentials.email.toLowerCase() }).select('+password')

                if (!user || !user.password) return null

                const isValid = await bcrypt.compare(credentials.password, user.password)
                if (!isValid) return null

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    image: user.avatar
                }
            }
        })
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                await connectDB()

                const existingUser = await User.findOne({ email: user.email?.toLowerCase() })

                if (existingUser) {
                    if (!existingUser.oauthProvider) {
                        existingUser.oauthProvider = 'google'
                        existingUser.oauthId = account.providerAccountId
                        existingUser.isVerified = true
                        await existingUser.save()
                    }
                    return true
                }

                await User.create({
                    email: user.email?.toLowerCase(),
                    name: user.name || 'Anonymous User',
                    role: 'student',
                    isVerified: true,
                    oauthProvider: 'google',
                    oauthId: account.providerAccountId,
                    avatar: user.image
                })

                return true
            }

            return true
        },

        async jwt({ token, user, account }) {
            // Initial sign in
            if (user) {
                await connectDB()
                const dbUser = await User.findOne({ email: user.email?.toLowerCase() })
                if (dbUser) {
                    token.userId = dbUser._id.toString()
                    token.role = dbUser.role
                } else {
                    // Fallback for immediate response if user was just created in signIn callback
                    token.userId = user.id
                    token.role = (user as any).role || 'student'
                }
            }

            // Sync with DB on subsequent requests if needed
            if (!token.userId || account?.provider === 'google') {
                await connectDB()
                const dbUser = await User.findOne({ email: token.email?.toLowerCase() })
                if (dbUser) {
                    token.userId = dbUser._id.toString()
                    token.role = dbUser.role
                }
            }

            return token
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.userId;
                (session.user as any).role = token.role;
            }
            return session
        }
    },

    pages: {
        signIn: '/auth/login',
        signOut: '/auth/logout',
        error: '/auth/error'
    },

    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60
    },

    secret: process.env.NEXTAUTH_SECRET
}
